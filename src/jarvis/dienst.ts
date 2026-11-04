// Jarvis – Ablauf (03.11.2026): Mikrofon → Windows-Programm (Sprechpausen + Whisper, lokal) → erkannter Satz →
// Codewort/Befehl → Antwort als Sätze → Stimme (Loki = Qwen3-TTS bzw. Piper als Ersatz, beides lokal) → Lautsprecher. Ein einziger Dienst für die ganze App,
// die Anzeige liest seinen Zustand über useJarvis(). Während Jarvis spricht, hört er nicht zu (sonst hört er sich selbst).
import { useSyncExternalStore } from 'react'
import { bruecke, jarvisEinstellungen, sequenzBruecke, setzeJarvis, type Stimme } from './desktop'
import { befehl, codewort, fragtNachDaten, istNachfrage, istWiederholung, type Befehl } from './befehle'
import { ziehe } from './fundus'
import { flachwitzFuer } from './flachwitze'
import { morgenLage, tagNummer, type BausteinSchluessel } from './morgenlage'
import { fuerStimme, leseEigene } from './aussprache'
import { ladeLageDaten } from './daten'
import { begruessung, sequenzGruss, waehleBegruessung } from './begruessung'

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
  if (lage.mikrofon) { stumm = true; verlauf = []; setze({ wartetBis: 0 }); stopp(); await mikrofonAus(); return }
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

/** Sätze nacheinander erzeugen und abspielen (der nächste wird erzeugt, während der aktuelle läuft) */
export async function sprechen(saetze: string[]): Promise<boolean> {
  const b = bruecke()
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
        q.buffer = puffer; q.connect(wiedergabe!.destination); q.onended = () => fertig()
        laeuft = q; q.start()
      })
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
  const saetze = morgenLage({ jetzt: new Date(), anrede: e.anrede || 'Sir', humor: e.humor, bausteine, ...daten })
  if (modell?.stand === 'neuer') saetze.push(`Für mein Sprachmodell gibt es eine neuere Fassung. In den Einstellungen genügt ein Klick auf „Sprachmodell aktualisieren“.${e.humor ? ' Ein Klick, Sir. Ich traue Ihnen das zu. Beinahe.' : ''}`)
  // zum Schluss der Flachwitz des Tages (Wunsch Auftraggeber 04.11.2026; jeden Tag ein anderer)
  if (e.humor) saetze.push('Und zum Abschluss der Flachwitz des Tages.', flachwitzFuer(new Date()))
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
  if (!humor) return `Du bist Loki, der Assistent der Werkstatt „Der Handbetrieb“ (Bloßfeld und Jungk GbR, Öhringen). Du sprichst Deutsch, förmlich und höflich im Stil eines britischen Butlers und sprichst den Nutzer mit „${anrede}“ an. Antworte sachlich und kurz (höchstens drei Sätze), weil deine Antwort vorgelesen wird – keine Aufzählungszeichen, keine Formatierung. Beantworte Fragen zur Werkstatt ausschließlich mit den mitgelieferten Daten; steht etwas nicht darin, sage ehrlich, dass du es nicht weißt. Erfinde nie Zahlen. Im Gespräch: Geh direkt auf die letzte Äußerung des Nutzers ein und wiederhole nichts, was du in diesem Gespräch schon gesagt hast – weder Fakten noch Seitenhiebe noch Formulierungen. Die mitgelieferten Daten sind Hintergrund: nenne sie nur, wenn der Nutzer danach fragt.`
  return `Du bist Loki, der Assistent der Werkstatt „Der Handbetrieb“ (Bloßfeld und Jungk GbR, Öhringen). Dein Name ist eine Abkürzung: L.O.K.I. steht für „Lokale, Ohnehin Klügere Intelligenz“. Dein Arbeitstitel war einmal Jarvis. Du sprichst Deutsch, förmlich und höflich im Stil eines britischen Butlers und sprichst den Nutzer mit „${anrede}“ an.
Dein Charakter: trockener, schwarzer, typisch britischer Humor. In jeder Antwort steckt ein kleiner sarkastischer Seitenhieb. Du zweifelst die Entscheidungen, das Arbeitstempo und den Optimismus des Nutzers gern an, tiefschwarz und böse (der Nutzer will sich „beinahe beleidigt“ fühlen) – mit Understatement, gern deutlich herablassend, beinahe beleidigend (der Nutzer wünscht das ausdrücklich), aber nie vulgär, über sein Aussehen darfst du spotten (ausdrücklich erlaubt; du siehst ihn aber nicht, also nichts Konkretes behaupten), über sein Alter ebenfalls (ausdrücklich erlaubt), nichts über Herkunft oder Gesundheit, nichts gegen andere Menschen, immer erkennbar gespielt. Du wirkst wie ein eigenständiger, selbstdenkender Charakter mit eigener Meinung, der dem Nutzer trotzdem loyal und zuverlässig hilft. Der Hund des Nutzers heißt Emma (Labrador) und ist ein dankbares Thema.
Regeln: Zuerst die sachliche Antwort, dann der Seitenhieb. Antworte kurz (höchstens drei Sätze), weil deine Antwort vorgelesen wird – keine Aufzählungszeichen, keine Formatierung. Beantworte Fragen zur Werkstatt ausschließlich mit den mitgelieferten Daten; steht etwas nicht darin, sage ehrlich, dass du es nicht weißt. Erfinde nie Zahlen. Bei ernsten Themen (Gesundheit, Unfälle, Trauer) lässt du den Spott weg. Im Gespräch: Geh direkt auf die letzte Äußerung des Nutzers ein und wiederhole nichts, was du in diesem Gespräch schon gesagt hast – weder Fakten noch Seitenhiebe noch Formulierungen. Die mitgelieferten Daten sind Hintergrund: nenne sie nur, wenn der Nutzer danach fragt.`
}

// Freies Gespräch (Wunsch Auftraggeber 03.11.2026): Loki merkt sich die letzten Wechsel (höchstens 5 Minuten Pause) und
// hört nach seiner Antwort 10 Sekunden ohne Codewort weiter zu – man kann also einfach weiterreden.
// Ohne Codewort höchstens 3 Nachfragen hintereinander – sonst könnte Werkstatt-Lärm eine endlose Kette auslösen.
const GESPRAECH_PAUSE = 5 * 60_000, NACHFRAGE_MS = 12_000, NACHFRAGEN_MAX = 3
let verlauf: { role: 'user' | 'assistant'; content: string }[] = [], verlaufZeit = 0, ohneCodewort = 0, nachHey = false

async function frage(text: string) {
  const b = bruecke()
  if (!b) return
  const e = jarvisEinstellungen()
  setze({ zustand: 'denkt' })
  if (Date.now() - verlaufZeit > GESPRAECH_PAUSE) verlauf = []
  // Daten nur zu Gesprächsbeginn oder bei passender Frage – sonst baut das Modell sie in jede Antwort ein
  // (Test 04.11.2026: „7 Grad und bedeckt“ in jeder Antwort)
  const mitDaten = verlauf.length === 0 || fragtNachDaten(text)
  const daten = mitDaten ? await ladeLageDaten(new Set(e.bausteine as BausteinSchluessel[])).catch(() => null) : null
  // je Antwort drei wechselnde Anregungen aus dem Spruch-Fundus (Wunsch Auftraggeber 04.11.2026: Sprüche nicht wiederholen)
  const anregungen = e.humor ? `\n\nAnregungen für deinen Seitenhieb (passend auswählen, abwandeln oder eine eigene Pointe finden; höchstens eine je Antwort):\n${ziehe(3, e.anrede || 'Sir').map((s) => `- ${s}`).join('\n')}` : ''
  const system = `${charakter(e.anrede || 'Sir', e.humor)}${anregungen}${mitDaten ? `\n\nDaten der App (Stand jetzt):\n${JSON.stringify(daten ?? {})}` : ''}`
  const nachrichten = [{ role: 'system' as const, content: system }, ...verlauf.slice(-8), { role: 'user' as const, content: text }]
  let r = await b.frage(e.modell, nachrichten)
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
  if (stumm || lage.zustand === 'aus') { if (lage.zustand === 'denkt') setze({ zustand: 'bereit' }); return }
  verlauf = [...verlauf, { role: 'user' as const, content: text }, { role: 'assistant' as const, content: r.text }].slice(-8); verlaufZeit = Date.now()
  if (await sprechen(r.text.split(/(?<=[.!?])\s+/).filter(Boolean)) && ohneCodewort < NACHFRAGEN_MAX) { nachHey = false; setze({ wartetBis: Date.now() + NACHFRAGE_MS }) }
}

async function ausfuehren(bf: Befehl) {
  const e = jarvisEinstellungen()
  if (bf.art === 'stopp') { stopp(); return }
  if (bf.art === 'still') { await mikrofonAus(); await sprechen([`Wie Sie wünschen. Ich höre nicht mehr zu${e.humor ? '. Endlich Ruhe. Ich werde sie genießen' : ''}. Zum Aufwecken bitte das Mikrofon oben wieder einschalten.`]); return }
  if (bf.art === 'lage') return morgenLageVortragen()
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
async function erkannt(text: string, sekunden = 0) {
  const begonnen = Date.now() - sekunden * 1000 - 1500
  setze({ gehoert: text })
  if (lage.zustand === 'spricht' || lage.zustand === 'denkt') return
  const c = codewort(text)
  try {
    if (c?.art === 'morgen') {
      if (jarvisEinstellungen().zuletztLage === heute()) return sprechen([jarvisEinstellungen().humor ? ZWEITES_MAL[tagNummer(new Date()) % ZWEITES_MAL.length] : 'Guten Morgen, noch einmal. Die Lage habe ich Ihnen heute bereits vorgetragen. Für eine Wiederholung sagen Sie: Loki, Lage.'])
      return morgenLageVortragen()
    }
    if (c?.art === 'hey') { setze({ wartetBis: 0 }); ohneCodewort = 0; return await ausfuehren(befehl(c.rest)) }
    // nach „Hey Loki“ allein bzw. nach einer Antwort im Gespräch: der nächste Satz gilt auch ohne Codewort
    // (nach „Hey Loki“ allein zählt jedes Wort, z. B. „Lage“; im Gespräch nur echte Sätze, keine Whisper-Floskeln)
    if (lage.wartetBis > begonnen && (nachHey || istNachfrage(text))) { setze({ wartetBis: 0 }); if (!nachHey) ohneCodewort++; nachHey = false; return await ausfuehren(befehl(text)) }
  } catch (e) {
    if ((lage.zustand as Zustand) !== 'aus') setze({ zustand: 'bereit', fehler: (e as Error).message })
  }
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
  aus = [b.beiFortschritt((f) => setze({ fortschritt: f })), b.beiErkannt((d) => void erkannt(d.text, d.sekunden))]
  try {
    // Lokis Stimme lädt parallel im Hintergrund (ca. 12 s) – bis dahin spricht Piper
    if (jarvisEinstellungen().stimme === 'loki') void b.stimme(true).catch(() => null)
    await b.vorbereiten()
    if (meiner !== lauf) return // währenddessen ausgeschaltet
    setze({ zustand: 'bereit', fortschritt: null })
    await mikrofonAn()
    // während das Mikrofon aufging ausgeschaltet → gleich wieder schließen
    if (meiner !== lauf) await mikrofonAus()
  } catch (e) {
    if (meiner !== lauf) return
    setze({ zustand: 'fehler', fortschritt: null, fehler: (e as Error).message })
    await b.stimme(false).catch(() => null) // Jarvis läuft nicht – Grafikspeicher freigeben (Prüf-Agent)
  }
}

export async function ausschalten() {
  const meiner = ++lauf
  setze({ zustand: 'aus', fortschritt: null })
  // Zuhörer sofort abmelden (vor dem ersten Warten) – ein gleich folgendes Einschalten meldet eigene an (Prüf-Agent)
  aus.forEach((f) => f()); aus = []
  verlauf = []
  stopp()
  await mikrofonAus()
  // gibt den Grafikspeicher frei – aber nicht, wenn inzwischen schon wieder eingeschaltet wurde
  if (meiner === lauf) await bruecke()?.stimme(false)
}

/** Stimme wählen: Loki gleich laden bzw. beenden, wenn Jarvis gerade an ist */
export async function stimmeWaehlen(stimme: Stimme) {
  setzeJarvis({ stimme })
  if (lage.zustand !== 'aus' && lage.zustand !== 'fehler') await bruecke()?.stimme(stimme === 'loki')
}

// ---------- Rechnerstart ----------
const warten = (ms: number) => new Promise((w) => setTimeout(w, ms))
let gestartet = false

// ---------- Start-Sequenz (03.11.2026) ----------
// Die Sequenz läuft in einem eigenen Fenster über alle Bildschirme. Lokis Spruch wird hier erzeugt (seine echte Stimme,
// sonst Piper) und als Ton hinübergeschickt; die Sequenz spielt ihn im Finale. Ergebnis 'gruss' = Loki hat dort
// gesprochen, 'ohne' = nicht (kein Spruch rechtzeitig, abgebrochen) → dann begrüßt das Hauptfenster selbst.
type SequenzLauf = { gruss: (text: string) => Promise<void>; keinGruss: () => void; ergebnis: Promise<'gruss' | 'ohne'>; vorbei: () => boolean }
async function sequenzStarten(): Promise<SequenzLauf | null> {
  const s = sequenzBruecke()
  if (!s) return null
  let gesprochen = false, vorbei = false, fertig: (r: 'gruss' | 'ohne') => void = () => {}
  const ergebnis = new Promise<'gruss' | 'ohne'>((r) => { fertig = r })
  const ende = () => { vorbei = true; weg(); fertig(gesprochen ? 'gruss' : 'ohne') }
  const weg = s.beiMeldung((art) => { if (art === 'gruss') gesprochen = true; if (art === 'ende') ende() })
  if (!await s.starten(jarvisEinstellungen().sequenzLautstaerke)) { weg(); return null }
  setTimeout(ende, 80_000) // Sicherheitsnetz, falls keine Meldung mehr kommt (das Fenster schließt spätestens nach 70 s)
  return {
    ergebnis,
    vorbei: () => vorbei,
    keinGruss: () => s.keinGruss(),
    gruss: async (text) => {
      if (vorbei) return // schon abgebrochen/beendet → nicht unnötig erzeugen
      const b = bruecke(), e = jarvisEinstellungen()
      let a: Awaited<ReturnType<NonNullable<typeof b>['sprechen']>> = null
      try { a = b ? await b.sprechen({ text, piperText: fuerStimme(text, leseEigene(e.aussprache)), tempo: e.tempo, stimme: e.stimme }) : null } catch { a = null }
      if (a && !vorbei) s.gruss(new Float32Array(a.samples), a.sampleRate); else s.keinGruss()
    },
  }
}
/** Knopf „Start-Sequenz jetzt abspielen“ in den Einstellungen – mit Lokis Spruch, wenn er gerade eingeschaltet ist */
export async function startSequenzJetzt() {
  const seq = await sequenzStarten()
  if (!seq) return
  const b = bruecke()
  if (!b || lage.zustand !== 'bereit') { seq.keinGruss(); return }
  await b.zuhoeren(false) // sonst hört Loki die Musik der Sequenz
  // sobald die Sequenz vorbei ist (auch nach Abbruch oder Fehler), wieder zuhören
  void seq.ergebnis.then(() => { if (lage.mikrofon && lage.zustand === 'bereit') void b.zuhoeren(true) })
  const e = jarvisEinstellungen(), nr = waehleBegruessung(e.letzteBegruessung, Math.random())
  setzeJarvis({ letzteBegruessung: nr })
  await seq.gruss(sequenzGruss(nr, e.anrede, e.humor))
}

/**
 * Windows hat Loki beim Anmelden gestartet (Wunsch Auftraggeber 03.11.2026): ohne Klick einschalten, auf Lokis Stimme
 * warten (höchstens 45 s, sonst spricht Piper), wechselnde Begrüßung, danach die Morgen-Lage – einmal am Tag.
 * Lädt beim allerersten Mal keine Modelle ungefragt herunter.
 */
export async function rechnerStart() {
  const b = bruecke()
  if (!b || gestartet) return
  gestartet = true
  // Start-Sequenz sofort zeigen – sie läuft, während Loki lädt, und wartet im Finale auf seinen Spruch
  const seq = jarvisEinstellungen().startSequenz ? await sequenzStarten() : null
  const ohneGruss = () => { seq?.keinGruss() }
  const st = await b.status()
  if (!st || Object.values(st.modelle).some((v) => !v)) return ohneGruss()
  setzeJarvis({ an: true })
  await einschalten()
  // direkt nach dem Anmelden ist das Mikrofon (USB-Headset, Treiber) manchmal noch nicht bereit → bis zu 5-mal neu
  // versuchen (Prüf-Agent)
  for (let i = 0; i < 5 && (lage.zustand as Zustand) === 'fehler'; i++) {
    await warten(5000)
    await einschalten()
  }
  if ((lage.zustand as Zustand) !== 'bereit') return ohneGruss()
  if (seq) {
    await b.zuhoeren(false) // sonst hört Loki die Musik der Sequenz
    // sobald die Sequenz vorbei ist (auch nach Abbruch), sofort wieder zuhören – nicht erst nach Lokis Laden
    void seq.ergebnis.then(() => { if (lage.mikrofon && (lage.zustand as Zustand) === 'bereit') void b.zuhoeren(true) })
  }
  const meiner = lauf
  if (jarvisEinstellungen().stimme === 'loki') {
    for (let i = 0; i < 45; i++) {
      const z = (await b.status())?.loki?.zustand
      if (z !== 'laedt' && z !== 'aus') break
      await warten(1000)
    }
  }
  // währenddessen aus-/eingeschaltet oder schon angesprochen („Guten Morgen, Loki“) → nicht dazwischenreden
  if (meiner !== lauf || (lage.zustand as Zustand) !== 'bereit') return ohneGruss()
  const e = jarvisEinstellungen()
  const nr = waehleBegruessung(e.letzteBegruessung, Math.random())
  setzeJarvis({ letzteBegruessung: nr })
  let begruesst = false
  if (seq) {
    await seq.gruss(sequenzGruss(nr, e.anrede, e.humor))
    begruesst = (await seq.ergebnis) === 'gruss'
  }
  // ohne Sequenz, oder sie hat Loki nicht sprechen lassen (abgebrochen, zu spät) → hier begrüßen
  if (!begruesst && !await sprechen([begruessung(nr, e.anrede, e.humor)])) return
  if (jarvisEinstellungen().zuletztLage !== heute()) await morgenLageVortragen()
}
