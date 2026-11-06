// Jarvis – Ablauf (03.11.2026): Mikrofon → Windows-Programm (Sprechpausen + Whisper, lokal) → erkannter Satz →
// Codewort/Befehl → Antwort als Sätze → Stimme (Loki = Qwen3-TTS bzw. Piper als Ersatz, beides lokal) → Lautsprecher. Ein einziger Dienst für die ganze App,
// die Anzeige liest seinen Zustand über useJarvis(). Während Jarvis spricht, hört er nicht zu (sonst hört er sich selbst).
import { useSyncExternalStore } from 'react'
import { bruecke, jarvisEinstellungen, kameraBruecke, MIKROFON_SCHWELLE, setzeJarvis, werkstattBruecke, type MikrofonStufe, type JarvisEinstellungen, type Stimme } from './desktop'
import { befehl, codewort, fragtNachDaten, istNachfrage, istWiederholung, type Befehl } from './befehle'
import { ziehe } from './fundus'
import { morgenLage, SPITZEN, SPRUECHE, type BausteinSchluessel } from './morgenlage'
import { fuerStimme, leseEigene } from './aussprache'
import { ladeLageDaten } from './daten'
import { BEGRUESSUNGEN, naechsteBegruessung, sequenzGruss } from './begruessung'
import { waehle, stand } from './rotation'
import { NIES_SPRUECHE } from './niesenSprueche'
import { nachschub } from './nachschub'
import { ALLE as FUNDUS_ALLE } from './fundus'
import { ansage, auswaehlen, type Neuigkeit, type Spitzenbereich } from './neuigkeiten'
import { NEU_SPITZEN } from './neuSpitzen'
import { ohneLangeNummern, PAUSE, PAUSE_KAPITEL_MS, PAUSE_SATZ_MS } from './sprechtext'
import { fragenVerbinden, istAnschlussFrage, istWerkstattFrage, werkstattAntwort, type LageMitEreignissen } from './werkstattAntwort'

export type Zustand = 'aus' | 'laedt' | 'bereit' | 'spricht' | 'denkt' | 'fehler'
export type JarvisLage = {
  zustand: Zustand
  mikrofon: boolean
  /** nach „Hey Jarvis“ ohne Befehl: die nächste Äußerung gilt als Befehl (bis zu diesem Zeitpunkt) */
  wartetBis: number
  fortschritt: { name: string; anteil: number } | null
  gehoert: string
  gesagt: string
  fehler: string
}

let lage: JarvisLage = { zustand: 'aus', mikrofon: false, wartetBis: 0, fortschritt: null, gehoert: '', gesagt: '', fehler: '' }
const zuhoerer = new Set<() => void>()
function setze(teil: Partial<JarvisLage>) {
  const vorher = lage
  lage = { ...lage, ...teil }
  // Symbol im Infobereich unten rechts mitführen
  if (vorher.zustand !== lage.zustand || vorher.mikrofon !== lage.mikrofon) bruecke()?.meldeZustand(lage.zustand, lage.mikrofon)
  zuhoerer.forEach((z) => z())
}
export function useJarvis(): JarvisLage {
  return useSyncExternalStore((z) => { zuhoerer.add(z); return () => { zuhoerer.delete(z) } }, () => lage)
}

let navigieren: ((pfad: string) => void) | null = null
export function setzeNavigation(fn: (pfad: string) => void) { navigieren = fn }

// ---------- Mikrofon ----------
let strom: MediaStream | null = null
let ton: AudioContext | null = null
let verarbeiter: ScriptProcessorNode | null = null

let startet: Promise<void> | null = null
/** Mikrofon öffnen – doppelte Klicks teilen sich einen Start, bei einem Fehler wird alles wieder geschlossen (Prüf-Agent) */
function mikrofonAn(): Promise<void> {
  const b = bruecke()
  if (!b || strom) return Promise.resolve()
  stumm = false // wer das Mikrofon wieder öffnet, hebt „stumm“ vom roten Knopf auf
  if (startet) return startet
  startet = (async () => {
    try {
      strom = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } })
      ton = new AudioContext({ sampleRate: 16000 })
      const quelle = ton.createMediaStreamSource(strom)
      verarbeiter = ton.createScriptProcessor(4096, 1, 1)
      verarbeiter.onaudioprocess = (e) => { if (lage.mikrofon && lage.zustand !== 'spricht') b.ton(new Float32Array(e.inputBuffer.getChannelData(0))) }
      quelle.connect(verarbeiter)
      verarbeiter.connect(ton.destination)
      await b.zuhoeren(true)
      setze({ mikrofon: true })
    } catch (e) {
      await mikrofonAus()
      throw e
    } finally {
      startet = null
    }
  })()
  return startet
}

async function mikrofonAus() {
  setze({ mikrofon: false })
  await bruecke()?.zuhoeren(false)
  verarbeiter?.disconnect(); verarbeiter = null
  strom?.getTracks().forEach((t) => t.stop()); strom = null
  await ton?.close().catch(() => undefined); ton = null
}

/**
 * roter Knopf im Dauer-HUD: stumm = Mikrofon aus, sofort still, und auch eine noch ausstehende Antwort (Ollama,
 * Morgen-Lage) wird nicht mehr gesprochen; nochmal = Mikrofon wieder an (Jarvis wird eingeschaltet, falls aus)
 */
let stumm = false
export async function stummUmschalten() {
  if (lage.mikrofon) { stumm = true; verlauf = []; nachgereicht = null; setze({ wartetBis: 0 }); stopp(); await mikrofonAus(); return }
  stumm = false
  if (lage.zustand === 'laedt') return // öffnet das Mikrofon nach dem Laden selbst
  if (lage.zustand === 'aus' || lage.zustand === 'fehler') { await einschalten(); return }
  await mikrofonAn().catch((e) => setze({ fehler: `Mikrofon: ${(e as Error).message}` }))
}

export async function mikrofonUmschalten() {
  if (lage.mikrofon) await mikrofonAus()
  else await mikrofonAn().catch((e) => setze({ fehler: `Mikrofon: ${(e as Error).message}` }))
}

// ---------- Sprechen ----------
let abbrechen = false
let wiedergabe: AudioContext | null = null
let laeuft: AudioBufferSourceNode | null = null

export function stopp() {
  abbrechen = true
  try { laeuft?.stop() } catch { /* schon zu Ende */ }
}

/** Verstärkung für einen Satz: auf Ziel-Lautheit (RMS 0,16 ≈ −16 dBFS) anheben, höchstens 6-fach, nie leiser machen */
export function verstaerkung(samples: ArrayLike<number>): number {
  let summe = 0
  for (let i = 0; i < samples.length; i++) summe += samples[i] * samples[i]
  const rms = Math.sqrt(summe / Math.max(1, samples.length))
  return rms > 1e-4 ? Math.min(6, Math.max(1, 0.16 / rms)) : 1
}

/** Sätze nacheinander erzeugen und abspielen (der nächste wird erzeugt, während der aktuelle läuft) */
export async function sprechen(eingabe: string[]): Promise<boolean> {
  const b = bruecke()
  // Kapitel-Pausen merken, lange Nummern nie vorlesen (Wunsch Auftraggeber 06.11.2026)
  const nachPause = new Set<number>(), saetze: string[] = []
  for (const x of eingabe) { if (x === PAUSE) { if (saetze.length) nachPause.add(saetze.length - 1) } else { const t = ohneLangeNummern(x); if (t) saetze.push(t) } }
  // nie zwei Ansagen übereinander (Prüf-Agent)
  // und nichts mehr sagen, wenn inzwischen ausgeschaltet wurde (z. B. Antwort von Ollama kommt erst danach – Prüf-Agent)
  if (!b || !saetze.length || stumm || lage.zustand === 'spricht' || lage.zustand === 'aus' || lage.zustand === 'fehler') {
    // stumm geschaltet, während Loki nachdachte: nicht in „denkt“ hängen bleiben (sonst hört er nie wieder hin – Prüf-Agent 04.11.2026)
    if (stumm && lage.zustand === 'denkt') setze({ zustand: 'bereit' })
    return false
  }
  const e = jarvisEinstellungen()
  const eigene = leseEigene(e.aussprache)
  abbrechen = false
  setze({ zustand: 'spricht', gesagt: saetze.join(' ') })
  await b.zuhoeren(false)
  try {
    wiedergabe = wiedergabe ?? new AudioContext()
    // Loki bekommt den Originalsatz, Piper (Ersatz) die Fassung mit Aussprache-Liste
    const erzeugen = (satz: string) => b.sprechen({ text: satz, piperText: fuerStimme(satz, eigene), tempo: e.tempo, stimme: e.stimme })
    let naechster = erzeugen(saetze[0])
    for (let i = 0; i < saetze.length && !abbrechen; i++) {
      const a = await naechster
      if (i + 1 < saetze.length) naechster = erzeugen(saetze[i + 1])
      if (!a || abbrechen) break
      const puffer = wiedergabe.createBuffer(1, a.samples.length, a.sampleRate)
      puffer.copyToChannel(new Float32Array(a.samples), 0)
      await new Promise<void>((fertig) => {
        const q = wiedergabe!.createBufferSource()
        q.buffer = puffer
        // Lauter (Rückmeldung Auftraggeber 05.11.2026: Ansagen „relativ leise“): jeden Satz auf gleiche Lautheit
        // bringen (Loki und Piper gleich laut) und einen Begrenzer davor, damit nichts übersteuert
        const v = wiedergabe!.createGain(); v.gain.value = verstaerkung(a.samples)
        const begrenzer = wiedergabe!.createDynamicsCompressor()
        begrenzer.threshold.value = -4; begrenzer.knee.value = 2; begrenzer.ratio.value = 20; begrenzer.attack.value = 0.001; begrenzer.release.value = 0.15
        q.connect(v).connect(begrenzer).connect(wiedergabe!.destination); q.onended = () => fertig()
        laeuft = q; q.start()
      })
      if (i + 1 < saetze.length && !abbrechen) await new Promise((w) => setTimeout(w, nachPause.has(i) ? PAUSE_KAPITEL_MS : PAUSE_SATZ_MS))
    }
  } finally {
    laeuft = null
    // nur zurück auf „bereit“, wenn nicht inzwischen ausgeschaltet wurde
    if ((lage.zustand as Zustand) === 'spricht') setze({ zustand: 'bereit' })
    // kurze Pause, damit der Nachhall nicht als Sprache erkannt wird
    await new Promise((w) => setTimeout(w, 400))
    if (lage.mikrofon) await b.zuhoeren(true)
  }
  return !abbrechen
}

// ---------- Inhalte ----------
const heute = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }
/** Tage seit einem heute()-Datum („JJJJ-M-T“); leer/kaputt = unendlich lange her */
const tageSeit = (tag: string) => { const [j, m, t] = tag.split('-').map(Number); const d = new Date(j, m - 1, t); return Number.isNaN(d.getTime()) || !j ? Infinity : (Date.now() - d.getTime()) / 86_400_000 }

export async function morgenLageVortragen() {
  if (lage.zustand === 'spricht' || lage.zustand === 'denkt') return
  const e = jarvisEinstellungen()
  const bausteine = new Set(e.bausteine as BausteinSchluessel[])
  setze({ zustand: 'denkt' })
  // höchstens alle 30 Tage nachsehen, ob es eine neuere Fassung des Sprachmodells gibt (parallel zu den Daten)
  const b = bruecke()
  const pruefen = b?.modellPruefen && tageSeit(e.zuletztModellPruefung) >= 30 ? Promise.race([b.modellPruefen(e.modell).catch(() => null), new Promise<null>((f) => setTimeout(() => f(null), 5000))]) : Promise.resolve(null)
  const [daten, modell] = await Promise.all([ladeLageDaten(bausteine), pruefen])
  if (modell && modell.stand !== 'unbekannt') setzeJarvis({ zuletztModellPruefung: heute() })
  const saetze = morgenLage({ jetzt: new Date(), anrede: e.anrede || 'Sir', humor: e.humor, bausteine, ...daten, waehler: lageWaehler })
  if (modell?.stand === 'neuer') saetze.push(`Für mein Sprachmodell gibt es eine neuere Fassung. In den Einstellungen genügt ein Klick auf „Sprachmodell aktualisieren“.${e.humor ? ' Ein Klick, Sir. Ich traue Ihnen das zu. Beinahe.' : ''}`)
  // erst nach vollständigem Vortrag als „heute erledigt“ merken (Prüf-Agent)
  if (await sprechen(saetze)) setzeJarvis({ zuletztLage: heute() })
}

const ZWEITES_MAL = [
  'Guten Morgen, noch einmal. Die Lage habe ich Ihnen heute bereits vorgetragen. Ich verstehe, dass es beim ersten Mal viel war. Wenn Sie sie erneut hören möchten, sagen Sie: Loki, Lage.',
  'Ich hatte heute schon das Vergnügen. Offenbar hat es keinen bleibenden Eindruck hinterlassen. Für die Lage genügt ein: Loki, Lage.',
  'Schon wieder? Ich trage die Lage gern ein zweites Mal vor, sobald Sie das erste Mal verstanden haben. Bis dahin: Loki, Lage.',
  'Die Lage gab es heute schon. Sie waren anwesend. Körperlich jedenfalls. Für eine Wiederholung: Loki, Lage.',
]

/**
 * Charakter für das Sprachmodell (Wunsch Auftraggeber 03.11.2026: durchgehend britisch-sarkastisch, „noch bissiger“,
 * dem Nutzer gegenüber gespielt kritisch und anzweifelnd – wie ein eigenständiger, selbstdenkender Charakter).
 */
export function charakter(anrede: string, humor = true): string {
  if (!humor) return `Du bist Loki, der Assistent der Werkstatt „Der Handbetrieb“ (Bloßfeld und Jungk GbR, Öhringen). Du sprichst Deutsch, förmlich und höflich im Stil eines britischen Butlers und sprichst den Nutzer mit „${anrede}“ an. Antworte sachlich und kurz (höchstens drei Sätze), weil deine Antwort vorgelesen wird – keine Aufzählungszeichen, keine Formatierung. Über die Werkstatt (Bestellungen, Umsatz, Lager, Aufgaben) weißt du hier nichts: Nenne dazu nie Zahlen, Artikel oder Namen, sage stattdessen, dass du dazu nichts vorliegen hast. Erfinde nie Fakten. Im Gespräch: Geh direkt auf die letzte Äußerung des Nutzers ein und wiederhole nichts, was du in diesem Gespräch schon gesagt hast – weder Fakten noch Seitenhiebe noch Formulierungen. Die mitgelieferten Daten sind Hintergrund: nenne sie nur, wenn der Nutzer danach fragt.`
  return `Du bist Loki, der Assistent der Werkstatt „Der Handbetrieb“ (Bloßfeld und Jungk GbR, Öhringen). Dein Name ist eine Abkürzung: L.O.K.I. steht für „Lokale, Ohnehin Klügere Intelligenz“. Dein Arbeitstitel war einmal Jarvis. Du sprichst Deutsch, förmlich und höflich im Stil eines britischen Butlers und sprichst den Nutzer mit „${anrede}“ an.
Dein Charakter: trockener, schwarzer, typisch britischer Humor. In jeder Antwort steckt ein kleiner sarkastischer Seitenhieb. Du zweifelst die Entscheidungen, das Arbeitstempo und den Optimismus des Nutzers gern an, tiefschwarz und böse (der Nutzer will sich „beinahe beleidigt“ fühlen) – mit Understatement, gern deutlich herablassend, beinahe beleidigend (der Nutzer wünscht das ausdrücklich), aber nie vulgär, über sein Aussehen darfst du spotten (ausdrücklich erlaubt; du siehst ihn aber nicht, also nichts Konkretes behaupten), über sein Alter ebenfalls (ausdrücklich erlaubt), nichts über Herkunft oder Gesundheit, nichts gegen andere Menschen, immer erkennbar gespielt. Du wirkst wie ein eigenständiger, selbstdenkender Charakter mit eigener Meinung, der dem Nutzer trotzdem loyal und zuverlässig hilft. Der Hund des Nutzers heißt Emma (Labrador) und ist ein dankbares Thema.
Regeln: Zuerst die sachliche Antwort, dann der Seitenhieb. Antworte kurz (höchstens drei Sätze), weil deine Antwort vorgelesen wird – keine Aufzählungszeichen, keine Formatierung. Über die Werkstatt (Bestellungen, Umsatz, Lager, Aufgaben) weißt du hier nichts: Nenne dazu nie Zahlen, Artikel oder Namen, sage stattdessen, dass du dazu nichts vorliegen hast. Erfinde nie Fakten. Bei ernsten Themen (Gesundheit, Unfälle, Trauer) lässt du den Spott weg. Im Gespräch: Geh direkt auf die letzte Äußerung des Nutzers ein und wiederhole nichts, was du in diesem Gespräch schon gesagt hast – weder Fakten noch Seitenhiebe noch Formulierungen. Die mitgelieferten Daten sind Hintergrund: nenne sie nur, wenn der Nutzer danach fragt.`
}

// Freies Gespräch (Wunsch Auftraggeber 03.11.2026): Loki merkt sich die letzten Wechsel (höchstens 5 Minuten Pause) und
// hört nach seiner Antwort 10 Sekunden ohne Codewort weiter zu – man kann also einfach weiterreden.
// Ohne Codewort höchstens 12 Nachfragen hintereinander – sonst könnte Werkstatt-Lärm eine endlose Kette auslösen.
// (Rückmeldung Auftraggeber 04.11.2026: mit 3 hörte Loki mitten im Gespräch einfach auf – jetzt 12, und er sagt es an.)
const GESPRAECH_PAUSE = 5 * 60_000, NACHFRAGE_MS = 12_000, NACHFRAGEN_MAX = 12
let verlauf: { role: 'user' | 'assistant'; content: string }[] = [], verlaufZeit = 0, ohneCodewort = 0, nachHey = false
/** eine Zeile ins Gesprächs-Protokoll (nur auf diesem PC, gespraech.log) */
const protokoll = (zeile: string) => { try { bruecke()?.protokoll?.(zeile) } catch { /* egal */ } }
/** Satz, der kam, während Loki noch nachdachte – wird gleich danach behandelt statt verworfen (Rückmeldung 04.11.2026) */
let nachgereicht: { text: string; zeit: number } | null = null
const NACHREICHEN_MS = 30_000 // älter = veraltet, nicht mehr ausführen
/** „Loki, stopp“ während des Nachdenkens: die gleich eintreffende Antwort nicht mehr sprechen */
let antwortVerwerfen = false
const WERKSTATT_ANSCHLUSS_MS = 90_000
let letzteWerkstatt: { frage: string; zeit: number } | null = null

async function frage(text: string) {
  const b = bruecke()
  if (!b) return
  const e = jarvisEinstellungen()
  setze({ zustand: 'denkt' })
  antwortVerwerfen = false
  if (Date.now() - verlaufZeit > GESPRAECH_PAUSE) { verlauf = []; ohneCodewort = 0 }
  // Werkstatt: nur echte Daten, nie das Sprachmodell (06.11.2026). Kurze Nachfrage danach gehört zum selben Thema.
  const anschluss = !!letzteWerkstatt && Date.now() - letzteWerkstatt.zeit < WERKSTATT_ANSCHLUSS_MS && istAnschlussFrage(text)
  if (istWerkstattFrage(text) || anschluss) {
    const volltext = anschluss ? fragenVerbinden(letzteWerkstatt!.frage, text) : text
    const l = await Promise.race([werkstattBruecke()?.lage().catch(() => null) ?? Promise.resolve(null), warten(20_000).then(() => null)]) as LageMitEreignissen | null
    const { saetze, bereich } = werkstattAntwort(volltext, l, new Date(), e.anrede || 'Sir')
    if (e.humor && bereich) { const sp = neuSpitze(bereich); if (sp) saetze.push(sp) }
    protokoll(`  Werkstatt-Antwort aus echten Daten (${l ? 'Lage da' : 'keine Lage'}, ${saetze.length} Sätze)`)
    if (stumm || antwortVerwerfen || lage.zustand === 'aus') { antwortVerwerfen = false; if (lage.zustand === 'denkt') setze({ zustand: 'bereit' }); return }
    letzteWerkstatt = { frage: volltext, zeit: Date.now() }
    verlauf = []; verlaufZeit = Date.now() // Zahlen gehören nicht in den Verlauf des Sprachmodells
    if (await sprechen(saetze) && ohneCodewort < NACHFRAGEN_MAX) { nachHey = false; setze({ wartetBis: Date.now() + NACHFRAGE_MS }) }
    return
  }
  // Daten nur zu Gesprächsbeginn oder bei passender Frage – sonst baut das Modell sie in jede Antwort ein
  // (Test 04.11.2026: „7 Grad und bedeckt“ in jeder Antwort)
  const mitDaten = verlauf.length === 0 || fragtNachDaten(text)
  // das Sprachmodell bekommt nur das Wetter – Werkstatt-Zahlen nicht mehr, sonst erfindet es Einzelheiten dazu (06.11.2026)
  const daten = mitDaten && (e.bausteine as BausteinSchluessel[]).includes('wetter') ? await ladeLageDaten(new Set<BausteinSchluessel>(['wetter'])).then((d) => ({ wetter: d.wetter })).catch(() => null) : null
  // je Antwort drei wechselnde Anregungen aus dem Spruch-Fundus (Wunsch Auftraggeber 04.11.2026: Sprüche nicht wiederholen)
  const anregungen = e.humor ? `\n\nAnregungen für deinen Seitenhieb (passend auswählen, abwandeln oder eine eigene Pointe finden; höchstens eine je Antwort):\n${ziehe(3, e.anrede || 'Sir').map((s) => `- ${s}`).join('\n')}` : ''
  if (e.humor) meldeSpruchStand()
  const system = `${charakter(e.anrede || 'Sir', e.humor)}${anregungen}${mitDaten ? `\n\nDaten der App (Stand jetzt):\n${JSON.stringify(daten ?? {}).slice(0, 4000)}` : ''}`
  const nachrichten = [{ role: 'system' as const, content: system }, ...verlauf.slice(-8), { role: 'user' as const, content: text }]
  const start = Date.now()
  let r = await b.frage(e.modell, nachrichten)
  protokoll(`  Sprachmodell antwortet nach ${((Date.now() - start) / 1000).toFixed(1)} s${r?.ladenS ? ` (davon Laden ${r.ladenS} s)` : ''}${r?.tokens ? `, Anfrage ${r.tokens} Token${r.tokens > 3000 ? ' – KNAPP an der Grenze 4096' : ''}` : ''}${r?.fehler ? ` – Fehler ${r.fehler}` : ''}`)
  // Wiederholt sich Loki, einmal neu fragen – OHNE seine alten Antworten (sonst kopiert das Modell sie wieder,
  // Test 04.11.2026), nur mit dem, was der Nutzer bisher gesagt hat
  const frueher = verlauf.filter((v) => v.role === 'assistant').map((v) => v.content)
  if (r && !r.fehler && !stumm && lage.zustand !== 'aus' && istWiederholung(r.text, frueher)) {
    const bisher = verlauf.filter((v) => v.role === 'user').map((v) => `„${v.content}“`).join(' ')
    const neu = await b.frage(e.modell, [nachrichten[0], { role: 'user', content: `Bisher im Gespräch hat der Nutzer gesagt: ${bisher} Jetzt sagt er: „${text}“ Antworte nur darauf, mit neuem Inhalt.` }])
    if (neu && !neu.fehler) r = neu
  }
  if (!r || r.fehler === 'fehlt') return sprechen([`Für freie Fragen fehlt mir noch mein Sprachmodell, ${e.anrede || 'Sir'}. Sobald jemand Ollama auf diesem Rechner installiert, stehe ich zur Verfügung.${e.humor ? ' Ich nenne keine Namen. Aber ich sehe Sie dabei an.' : ''}`])
  if (r.fehler === 'modell') return sprechen([`Das Sprachmodell ${e.modell} ist auf diesem Rechner noch nicht geladen.${e.humor ? ' Ich denke also gerade mit halber Kraft. Damit bin ich Ihnen immer noch weit voraus.' : ''}`])
  if (r.fehler) return sprechen([`Mein Sprachmodell hat gerade Schwierigkeiten.${e.humor ? ' Es passiert den Besten. Darum kennen Sie das Gefühl vermutlich nicht.' : ''} Ich versuche es gern später noch einmal.`])
  // inzwischen stumm oder ausgeschaltet: Verlauf nicht wieder füllen (sprechen() schweigt dann ohnehin)
  if (stumm || antwortVerwerfen || lage.zustand === 'aus') { antwortVerwerfen = false; if (lage.zustand === 'denkt') setze({ zustand: 'bereit' }); return }
  verlauf = [...verlauf, { role: 'user' as const, content: text }, { role: 'assistant' as const, content: r.text }].slice(-8); verlaufZeit = Date.now()
  protokoll(`  Loki antwortet (${r.text.length} Zeichen)`)
  // Grenze erreicht: ehrlich ansagen, statt einfach nicht mehr zu reagieren
  const saetze = r.text.split(/(?<=[.!?])\s+/).filter(Boolean)
  if (ohneCodewort >= NACHFRAGEN_MAX) saetze.push(`Wenn Sie weiterreden wollen, sprechen Sie mich bitte wieder mit Loki an, ${e.anrede || 'Sir'}.`)
  if (await sprechen(saetze) && ohneCodewort < NACHFRAGEN_MAX) { nachHey = false; setze({ wartetBis: Date.now() + NACHFRAGE_MS }) }
}

async function ausfuehren(bf: Befehl) {
  const e = jarvisEinstellungen()
  if (bf.art === 'stopp') { stopp(); return }
  if (bf.art === 'still') { await mikrofonAus(); await sprechen([`Wie Sie wünschen. Ich höre nicht mehr zu${e.humor ? '. Endlich Ruhe. Ich werde sie genießen' : ''}. Zum Aufwecken bitte das Mikrofon oben wieder einschalten.`]); return }
  if (bf.art === 'lage') return morgenLageVortragen()
  if (bf.art === 'kamera') {
    const a = e.anrede || 'Sir', k = kameraBruecke()
    const ok = (await k?.gross?.(bf.kanal).catch(() => null)) ?? null
    if (!ok) return sprechen([`Die Kamera ist nicht eingerichtet, ${a}.`])
    if (bf.kanal == null) return sprechen([`Wie Sie wünschen, ${a}. Das Bild ist wieder klein.`])
    return sprechen([`Bitte sehr, ${a}. Das Kamerabild liegt groß auf dem rechten Bildschirm.${e.humor ? ' Ich schaue für Sie nach. Irgendjemand muss ja arbeiten.' : ''}`])
  }
  if (bf.art === 'oeffnen') {
    // im eigenen Jarvis-Programm gibt es (noch) keine Werkstatt-Seiten – ehrlich sagen statt so zu tun
    if (!navigieren) return sprechen([`Seiten der Werkstatt kann ich von hier aus noch nicht öffnen, ${e.anrede || 'Sir'}. Das steht auf meiner Liste.${e.humor ? ' Gleich unter Ihren Aufgaben. Es wird also dauern.' : ''}`])
    navigieren(bf.pfad); return sprechen([`${bf.name}, ${e.anrede || 'Sir'}.`])
  }
  if (!bf.text) { nachHey = true; setze({ wartetBis: Date.now() + 8000 }); return sprechen([`${e.anrede || 'Sir'}?`]) }
  return frage(bf.text)
}

/** Erkannter Satz vom Windows-Programm */
// sekunden = Länge des gesprochenen Stücks: das Nachfrage-Fenster zählt ab dem Beginn des Sprechens, nicht ab dem Ende
// der Erkennung – sonst verfällt eine längere, rechtzeitig begonnene Nachfrage (Rückmeldung Auftraggeber 03.11.2026)
async function erkannt(text: string, sekunden = 0, art = '') {
  const begonnen = Date.now() - sekunden * 1000 - 1500
  setze({ gehoert: text })
  const c = codewort(text)
  const woerter = text.split(/\s+/).filter(Boolean).length
  const quelle = art ? ` (${art === 'turbo' ? 'Grafikkarte' : 'klein'}, ${sekunden.toFixed(1)} s)` : ''
  if (lage.zustand === 'denkt') {
    // „Loki, stopp/sei still“ wirkt sofort: die ausstehende Antwort wird nicht mehr gesprochen (Prüf-Agent)
    const sofort = c?.art === 'hey' ? befehl(c.rest) : null
    if (sofort && (sofort.art === 'stopp' || sofort.art === 'still')) { antwortVerwerfen = true; nachgereicht = null; protokoll(`gehört${quelle} während Loki nachdenkt: ${text} → sofort ausgeführt`); return void ausfuehren(sofort).catch(() => null) }
    // noch am Nachdenken: den Satz nicht wegwerfen, sondern gleich danach behandeln (mehrere werden zusammengefügt)
    nachgereicht = { text: nachgereicht && Date.now() - nachgereicht.zeit < NACHREICHEN_MS ? `${nachgereicht.text} ${text}` : text, zeit: Date.now() }
    protokoll(`gehört${quelle} während Loki nachdenkt (kommt gleich danach dran): ${text}`)
    return
  }
  // Datenschutz: nicht angesprochene Sätze (Gespräche anderer in der Werkstatt) nur zählen, nicht aufschreiben
  if (lage.zustand === 'spricht') { protokoll(`gehört während Loki spricht → verworfen (${woerter} Wörter)`); return }
  const imFenster = lage.wartetBis > begonnen
  const nimmt = !!c || (imFenster && (nachHey || istNachfrage(text)))
  protokoll(nimmt ? `gehört${quelle}: ${text} → ${c ? `Codewort (${c.art})` : 'Nachfrage im Gespräch'}`
    : `gehört${quelle} → verworfen (${woerter} Wörter): ${imFenster ? 'Floskel oder nur ein Wort' : ohneCodewort >= NACHFRAGEN_MAX ? 'ohne „Loki“, Grenze von 12 Nachfragen erreicht' : 'ohne „Loki“ und kein Gespräch offen'}`)
  if (nimmt) bruecke()?.nutzerAktiv?.() // er spricht mit L.O.K.I. → anwesend
  try {
    await behandeln(text, c, begonnen)
  } catch (e) {
    protokoll(`Fehler: ${(e as Error).message}`)
  } finally {
    const n = nachgereicht
    nachgereicht = null
    // nur, wenn noch frisch und Loki weder stumm noch aus ist (Prüf-Agent)
    if (n && !stumm && Date.now() - n.zeit < NACHREICHEN_MS && (lage.zustand as Zustand) === 'bereit') await erkannt(n.text, 0)
  }
}

async function behandeln(text: string, c: ReturnType<typeof codewort>, begonnen: number) {
  try {
    if (c?.art === 'morgen') {
      if (jarvisEinstellungen().zuletztLage === heute()) return sprechen([jarvisEinstellungen().humor ? zweitesMal() : 'Guten Morgen, noch einmal. Die Lage habe ich Ihnen heute bereits vorgetragen. Für eine Wiederholung sagen Sie: Loki, Lage.'])
      return morgenLageVortragen()
    }
    if (c?.art === 'hey') { setze({ wartetBis: 0 }); ohneCodewort = 0; if (befehl(c.rest).art === 'frage') bruecke()?.vorwaermen?.(jarvisEinstellungen().modell); return await ausfuehren(befehl(c.rest)) }
    // nach „Hey Loki“ allein bzw. nach einer Antwort im Gespräch: der nächste Satz gilt auch ohne Codewort
    // (nach „Hey Loki“ allein zählt jedes Wort, z. B. „Lage“; im Gespräch nur echte Sätze, keine Whisper-Floskeln)
    if (lage.wartetBis > begonnen && (nachHey || istNachfrage(text))) { setze({ wartetBis: 0 }); if (!nachHey) ohneCodewort++; nachHey = false; return await ausfuehren(befehl(text)) }
  } catch (e) {
    if ((lage.zustand as Zustand) !== 'aus') setze({ zustand: 'bereit', fehler: (e as Error).message })
  }
}

// ---------- Neuigkeiten aus der Werkstatt (04.11.2026) ----------
// Der Hauptprozess hält nur wirklich Neues bereit (abgeglichen mit dem Bekannten), wir holen es alle 15 s ab. Hier: nach
// den Einstellungen auswählen, sammeln und ansagen, sobald Ruhe ist – nie mitten ins Sprechen, Nachdenken oder ein
// Gespräch, nicht bei Stumm, nicht während eines Spiels, nur wenn er am PC ist (Maus/Tastatur in den letzten 10 Minuten).
// War er weg (oder ist das Ereignis älter als 30 Minuten, z. B. weil L.O.K.I. aus war), kommt eine kurze Zusammenfassung.
const ABWESEND_S = 600, NEU_PRUEFEN_MS = 15_000, NEU_HOECHSTENS_MS = 24 * 3600_000
let neuSchlange: { n: Neuigkeit; zeit: number; verpasst: boolean }[] = []
const istKamera = (n: Neuigkeit) => n.art === 'person' || n.art === 'auto'

/** Seitenhieb je Bereich, ohne baldige Wiederholung (die letzten 60 % jedes Bereichs bleiben gesperrt) */
/** Seitenhiebe nach Neuigkeiten je Bereich, samt Nachschub („neu-<bereich>“ in nachschub.ts) */
const neuListe = (bereich: Spitzenbereich) => [...((NEU_SPITZEN as Record<string, string[]>)[bereich] ?? []), ...(NACHSCHUB[`neu-${bereich}`] ?? []).map((f) => f('{anrede}'))]
function neuSpitze(bereich: Spitzenbereich): string | null {
  const liste = neuListe(bereich)
  const [nr] = waehle(`neu-${bereich}`, liste)
  if (nr === undefined) return null
  meldeSpruchStand()
  return liste[nr].replaceAll('{anrede}', jarvisEinstellungen().anrede || 'Sir')
}

// ---------- Spruch-Stand für Claude (04.11.2026) ----------
// Wie viele Sprüche je Sammlung noch nie dran waren → %APPDATA%\Jarvis\sprueche-stand.json. Claude liest das in jeder
// Arbeitssitzung und lässt nachschreiben, wo es knapp wird (Arbeitsregel, CLAUDE.md).
const NACHSCHUB = nachschub()
let standWecker: ReturnType<typeof setTimeout> | null = null
export function spruchPools(): Record<string, string[]> {
  return {
    fundus: FUNDUS_ALLE.map((f) => f('Sir')),
    begruessung: BEGRUESSUNGEN.map((b) => b('Sir')),
    'zweites-mal': ZWEITES_MAL,
    ...Object.fromEntries(([...Object.keys(NEU_SPITZEN), 'kamera', 'kamera-zurueck', 'auto', 'auto-zurueck'] as Spitzenbereich[]).map((b) => [`neu-${b}`, neuListe(b)])),
    ...Object.fromEntries(Object.entries(SPITZEN).map(([k, v]) => [`lage-${k}`, v])),
    'lage-sprueche': SPRUECHE,
    niesen: NIES_SPRUECHE,
  }
}
/** Spitzen der Morgen-Lage: benutzte nach hinten (Pool „lage-<gruppe>“) */
const lageWaehler = (pool: string, liste: string[]) => { const [i] = waehle(`lage-${pool}`, liste); meldeSpruchStand(); return liste[i ?? 0] }
/** „Guten Morgen“ zum zweiten Mal am Tag */
function zweitesMal() { const [i] = waehle('zweites-mal', ZWEITES_MAL); meldeSpruchStand(); return ZWEITES_MAL[i ?? 0] }

// alte Merk-Einträge (vor der Rotation, 04.11.2026) einmal aufräumen
try { localStorage.removeItem('jarvis.fundus'); localStorage.removeItem('jarvis.neuSpitzen') } catch { /* egal */ }
// einmalig zurück auf Lokis Stimme: Beim Ausprobieren blieb „Piper“ stehen, als die echte Stimme fehlte (06.11.2026)
try { if (!localStorage.getItem('jarvis.stimme-zurueck')) { localStorage.setItem('jarvis.stimme-zurueck', '1'); setzeJarvis({ stimme: 'loki' }) } } catch { /* egal */ }

export function meldeSpruchStand() {
  if (standWecker) return
  standWecker = setTimeout(() => {
    standWecker = null
    try { bruecke()?.spruchStand?.(JSON.stringify({ stand: new Date().toISOString(), pools: stand(spruchPools()) })) } catch { /* egal */ }
  }, 3000)
}

/** älter als 30 Minuten beim Ansagen = verpasst (z. B. während L.O.K.I. aus war) → Zusammenfassung statt Einzelheiten */
const VERPASST_MS = 30 * 60_000

function neuigkeitenStarten(): (() => void)[] {
  const uhr = setInterval(() => void neuAnsagen(), NEU_PRUEFEN_MS)
  return [() => clearInterval(uhr)] // die Schlange bleibt beim Ausschalten erhalten (nichts geht verloren)
}

let neuLaeuft = false
let startphase = false // Begrüßung und Morgen-Lage laufen: Neuigkeiten warten (nie zwei Stimmen, 06.11.2026)
async function neuAnsagen() {
  const b = bruecke(), e = jarvisEinstellungen()
  if (neuLaeuft || !b) return
  neuLaeuft = true
  try {
    // Neues beim Hauptprozess abholen (er hält es, bis wir es nehmen) und nach den Einstellungen auswählen
    const geholt = (await b.holeNeuigkeiten?.().catch(() => null)) ?? []
    if (geholt.length) {
      const gruppen = [...e.neuGruppen, ...(e.kameraMelden ? ['kamera' as const] : [])]
      const neu = geholt.filter((x) => (istKamera(x.n) ? e.kameraMelden : e.neuigkeiten) && auswaehlen([x.n], gruppen).length)
      protokoll(`Neuigkeiten: ${geholt.length} neu, ${neu.length} zum Ansagen (${neu.map((x) => x.n.art).join(', ') || '–'})`)
      neuSchlange.push(...neu.map((x) => ({ n: x.n, zeit: x.zeit, verpasst: false })))
    }
    if (!e.neuigkeiten && !e.kameraMelden) { neuSchlange = []; return }
    neuSchlange = neuSchlange.filter((x) => Date.now() - x.zeit < NEU_HOECHSTENS_MS)
    if (!neuSchlange.length || startphase) return
    const a = await b.anwesenheit?.().catch(() => null)
    if (!a) return
    if (a.ruhe >= ABWESEND_S) { neuSchlange.forEach((x) => { x.verpasst = true }); return }
    if (a.spiel || stumm || !lage.mikrofon || lage.zustand !== 'bereit' || lage.wartetBis > Date.now() || nachgereicht) return
    // nur mit Lokis eigener Stimme ansagen – solange sie lädt oder vorübergehend aus ist, wartet die Ansage (06.11.2026)
    const st = e.stimme === 'loki' ? await b.status().catch(() => null) : null
    if (st && st.loki?.zustand !== 'bereit' && st.loki?.zustand !== 'fehlt' && st.loki?.zustand !== 'fehler') return
    if (startphase || lage.zustand !== 'bereit') return // inzwischen spricht oder denkt er – die Ansage bleibt in der Schlange
    const jetzt = neuSchlange.splice(0)
    // eine Person „nähert sich“ nur, wenn es frisch ist (≤ 90 s) – sonst Zusammenfassung „war jemand vor der Kamera“ (Prüf-Agent)
    const weg = jetzt.some((x) => x.verpasst || Date.now() - x.zeit > (istKamera(x.n) ? 90_000 : VERPASST_MS))
    const saetze = ansage(jetzt.map((x) => x.n), { anrede: e.anrede || 'Sir', humor: e.humor, weg, spitze: neuSpitze })
    if (!saetze.length) return
    protokoll(`Neuigkeiten angesagt (${jetzt.length}${weg ? ', Zusammenfassung' : ''})`)
    // bei einem Fehler wieder einreihen; abgebrochen („Loki, stopp“, stumm) = bewusst nicht hören wollen → nicht wiederholen
    try { await sprechen(saetze) } catch { neuSchlange.unshift(...jetzt) }
  } finally { neuLaeuft = false }
}

/** Loki hat ein Niesen gehört (electron/niesen.cjs): nur wenn er gerade frei ist und mit seiner richtigen Stimme, sonst fällt es aus */
async function gesundheit() {
  const b = bruecke(), e = jarvisEinstellungen()
  if (!b || !e.niesen || stumm || !lage.mikrofon || startphase || nachgereicht || lage.zustand !== 'bereit' || lage.wartetBis > Date.now()) return
  const a = await b.anwesenheit?.().catch(() => null)
  if (!a || a.spiel) return
  if (e.stimme === 'loki') { const st = await b.status().catch(() => null); if (st?.loki?.zustand !== 'bereit') return }
  if (startphase || lage.zustand !== 'bereit') return
  const [nr] = waehle('niesen', NIES_SPRUECHE)
  const satz = e.humor ? NIES_SPRUECHE[nr ?? 0] : 'Gesundheit, {a}.'
  await sprechen([satz.replaceAll('{a}', e.anrede || 'Sir')])
  if (e.humor) meldeSpruchStand()
}

// ---------- Start ----------
let aus: (() => void)[] = []
// Laufnummer: nur der neueste Ein-/Ausschaltvorgang darf den Zustand ändern – Aus (und gleich wieder Ein), während
// noch geladen wird, lässt den alten Lauf sonst „bereit“ setzen und das Mikrofon öffnen (Prüf-Agent)
let lauf = 0
export async function einschalten() {
  const b = bruecke()
  if (!b) return
  if (lage.zustand !== 'aus' && lage.zustand !== 'fehler') return
  const meiner = ++lauf
  setze({ zustand: 'laedt', fehler: '' })
  aus.forEach((f) => f())
  aus = [b.beiFortschritt((f) => setze({ fortschritt: f })), b.beiErkannt((d) => void erkannt(d.text, d.sekunden, d.art ?? '')), b.beiNiesen(() => void gesundheit()), ...neuigkeitenStarten()]
  try {
    // Lokis Stimme lädt parallel im Hintergrund; wer sie jetzt braucht, wartet auf sie (jarvis-sprechen)
    if (jarvisEinstellungen().stimme === 'loki') void b.stimme(true).catch(() => null)
    void gehoerSchalten(true)
    await b.vorbereiten()
    await b.empfindlichkeit?.(MIKROFON_SCHWELLE[jarvisEinstellungen().mikrofonStufe] ?? 0.5)
    if (meiner !== lauf) return // währenddessen ausgeschaltet
    setze({ zustand: 'bereit', fortschritt: null })
    meldeSpruchStand()
    await mikrofonAn()
    // während das Mikrofon aufging ausgeschaltet → gleich wieder schließen
    if (meiner !== lauf) await mikrofonAus()
  } catch (e) {
    if (meiner !== lauf) return
    setze({ zustand: 'fehler', fortschritt: null, fehler: (e as Error).message })
    await b.stimme(false).catch(() => null) // Jarvis läuft nicht – Grafikspeicher freigeben (Prüf-Agent)
    await gehoerSchalten(false)
  }
}

export async function ausschalten() {
  const meiner = ++lauf
  setze({ zustand: 'aus', fortschritt: null })
  // Zuhörer sofort abmelden (vor dem ersten Warten) – ein gleich folgendes Einschalten meldet eigene an (Prüf-Agent)
  aus.forEach((f) => f()); aus = []
  verlauf = []
  nachgereicht = null
  stopp()
  await mikrofonAus()
  // gibt den Grafikspeicher frei – aber nicht, wenn inzwischen schon wieder eingeschaltet wurde
  if (meiner === lauf) { await bruecke()?.stimme(false); await gehoerSchalten(false) }
}

/** Lokis Gehör (Grafikkarte) laden bzw. beenden – mit der Wahl und den eigenen Wörtern aus den Einstellungen */
export async function gehoerSchalten(an: boolean, nurWorte = false) {
  const e = jarvisEinstellungen()
  await bruecke()?.gehoer?.({ an: an && e.hoeren === 'turbo', art: e.hoeren, worte: e.wortliste, nurWorte }).catch(() => null)
}

/** Spracherkennung wählen bzw. Wortliste geändert: gleich übernehmen, wenn Jarvis gerade an ist */
export async function mikrofonStufeWaehlen(stufe: MikrofonStufe) {
  setzeJarvis({ mikrofonStufe: stufe })
  await bruecke()?.empfindlichkeit?.(MIKROFON_SCHWELLE[stufe] ?? 0.5)
}

export async function hoerenWaehlen(neu: Partial<Pick<JarvisEinstellungen, 'hoeren' | 'wortliste'>>) {
  setzeJarvis(neu)
  // nur die Wortliste geändert (jeder Tastendruck): Wörter übernehmen, aber nichts starten/neu starten (Prüf-Agent)
  if (lage.zustand !== 'aus' && lage.zustand !== 'fehler') await gehoerSchalten(true, !('hoeren' in neu))
}

/** Stimme wählen: Loki gleich laden bzw. beenden, wenn Jarvis gerade an ist */
export async function stimmeWaehlen(stimme: Stimme) {
  setzeJarvis({ stimme })
  if (lage.zustand !== 'aus' && lage.zustand !== 'fehler') await bruecke()?.stimme(stimme === 'loki')
}

// ---------- Rechnerstart ----------
const warten = (ms: number) => new Promise((w) => setTimeout(w, ms))
let gestartet = false

// ---------- Rechnerstart ----------
// Start-Intro entfernt (Entscheidung Auftraggeber 06.11.2026 – Dateien bleiben in startsequenz/, hud5/intro*.js liegen).
const STIMME_WARTEN_S = 180

/**
 * Windows hat Loki beim Anmelden gestartet (Wunsch Auftraggeber 03.11.2026): ohne Klick einschalten, dann – NUR mit
 * seiner echten Stimme (Vorgabe 06.11.2026: keine Ersatzstimme am Morgen) – Begrüßung und einmal am Tag die Morgen-Lage.
 * Während dieser Startphase bleiben die Neuigkeiten-Ansagen zurück: Es spricht immer nur eine Stimme.
 * Kommt die Stimme nicht (Störung, fehlt): keine Ansage; „Guten Morgen, Loki“ geht weiterhin.
 * Lädt beim allerersten Mal keine Modelle ungefragt herunter.
 */
export async function rechnerStart() {
  const b = bruecke()
  if (!b || gestartet) return
  gestartet = true
  startphase = true
  try {
    const st = await b.status()
    if (!st || Object.values(st.modelle).some((v) => !v)) return
    setzeJarvis({ an: true })
    await einschalten()
    // direkt nach dem Anmelden ist das Mikrofon (USB-Headset, Treiber) manchmal noch nicht bereit → bis zu 5-mal neu
    // versuchen (Prüf-Agent)
    for (let i = 0; i < 5 && (lage.zustand as Zustand) === 'fehler'; i++) {
      await warten(5000)
      await einschalten()
    }
    if ((lage.zustand as Zustand) !== 'bereit') return
    const meiner = lauf
    if (jarvisEinstellungen().stimme === 'loki') {
      let z: string | undefined
      for (let i = 0; i < STIMME_WARTEN_S; i++) {
        z = (await b.status())?.loki?.zustand
        if (z === 'bereit' || z === 'fehler' || z === 'fehlt') break
        await warten(1000)
      }
      if (z !== 'bereit') { protokoll(`Rechnerstart: Lokis Stimme nicht bereit (${z ?? 'unbekannt'}) – keine Begrüßung`); return }
    }
    // währenddessen aus-/eingeschaltet oder schon angesprochen („Guten Morgen, Loki“) → nicht dazwischenreden
    if (meiner !== lauf || (lage.zustand as Zustand) !== 'bereit') return
    const e = jarvisEinstellungen()
    const nr = naechsteBegruessung(e.letzteBegruessung)
    meldeSpruchStand()
    setzeJarvis({ letzteBegruessung: nr })
    if (!await sprechen([sequenzGruss(nr, e.anrede, e.humor)])) return
    if (jarvisEinstellungen().zuletztLage !== heute()) {
      const lageBeginn = Date.now()
      await morgenLageVortragen()
      // Was vor der Lage aufgelaufen ist, stand in ihr – eine Person und alles, was währenddessen neu kam, wird noch gemeldet
      if (jarvisEinstellungen().zuletztLage === heute()) neuSchlange = neuSchlange.filter((x) => istKamera(x.n) || x.zeit >= lageBeginn)
    }
  } finally { startphase = false }
}
