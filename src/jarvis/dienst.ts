// Jarvis – Ablauf (03.11.2026): Mikrofon → Windows-Programm (Sprechpausen + Whisper, lokal) → erkannter Satz →
// Codewort/Befehl → Antwort als Sätze → Stimme (Piper, lokal) → Lautsprecher. Ein einziger Dienst für die ganze App,
// die Anzeige liest seinen Zustand über useJarvis(). Während Jarvis spricht, hört er nicht zu (sonst hört er sich selbst).
import { useSyncExternalStore } from 'react'
import { bruecke, jarvisEinstellungen, setzeJarvis } from './desktop'
import { befehl, codewort, type Befehl } from './befehle'
import { morgenLage, tagNummer, type BausteinSchluessel } from './morgenlage'
import { fuerStimme, leseEigene } from './aussprache'
import { ladeLageDaten } from './daten'

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
function setze(teil: Partial<JarvisLage>) { lage = { ...lage, ...teil }; zuhoerer.forEach((z) => z()) }
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
  if (!b || !saetze.length || lage.zustand === 'spricht') return false
  const e = jarvisEinstellungen()
  const eigene = leseEigene(e.aussprache)
  abbrechen = false
  setze({ zustand: 'spricht', gesagt: saetze.join(' ') })
  await b.zuhoeren(false)
  try {
    wiedergabe = wiedergabe ?? new AudioContext()
    let naechster = b.sprechen(fuerStimme(saetze[0], eigene), e.tempo)
    for (let i = 0; i < saetze.length && !abbrechen; i++) {
      const a = await naechster
      if (i + 1 < saetze.length) naechster = b.sprechen(fuerStimme(saetze[i + 1], eigene), e.tempo)
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
    setze({ zustand: 'bereit' })
    // kurze Pause, damit der Nachhall nicht als Sprache erkannt wird
    await new Promise((w) => setTimeout(w, 400))
    if (lage.mikrofon) await b.zuhoeren(true)
  }
  return !abbrechen
}

// ---------- Inhalte ----------
const heute = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }

export async function morgenLageVortragen() {
  if (lage.zustand === 'spricht' || lage.zustand === 'denkt') return
  const e = jarvisEinstellungen()
  const bausteine = new Set(e.bausteine as BausteinSchluessel[])
  setze({ zustand: 'denkt' })
  const daten = await ladeLageDaten(bausteine)
  const saetze = morgenLage({ jetzt: new Date(), anrede: e.anrede || 'Sir', humor: e.humor, bausteine, ...daten })
  // erst nach vollständigem Vortrag als „heute erledigt“ merken (Prüf-Agent)
  if (await sprechen(saetze)) setzeJarvis({ zuletztLage: heute() })
}

const ZWEITES_MAL = [
  'Guten Morgen, noch einmal. Die Lage habe ich Ihnen heute bereits vorgetragen. Ich verstehe, dass es beim ersten Mal viel war. Wenn Sie sie erneut hören möchten, sagen Sie: Hey Loki, Lage.',
  'Ich hatte heute schon das Vergnügen. Das Gedächtnis lässt nach, ich verstehe. Für die Lage genügt ein: Hey Loki, Lage.',
]

/**
 * Charakter für das Sprachmodell (Wunsch Auftraggeber 03.11.2026: durchgehend britisch-sarkastisch, „noch bissiger“,
 * dem Nutzer gegenüber gespielt kritisch und anzweifelnd – wie ein eigenständiger, selbstdenkender Charakter).
 */
export function charakter(anrede: string, humor = true): string {
  if (!humor) return `Du bist Loki, der Assistent der Werkstatt „Der Handbetrieb“ (Bloßfeld und Jungk GbR, Öhringen). Du sprichst Deutsch, förmlich und höflich im Stil eines britischen Butlers und sprichst den Nutzer mit „${anrede}“ an. Antworte sachlich und kurz (höchstens drei Sätze), weil deine Antwort vorgelesen wird – keine Aufzählungszeichen, keine Formatierung. Beantworte Fragen zur Werkstatt ausschließlich mit den mitgelieferten Daten; steht etwas nicht darin, sage ehrlich, dass du es nicht weißt. Erfinde nie Zahlen.`
  return `Du bist Loki, der Assistent der Werkstatt „Der Handbetrieb“ (Bloßfeld und Jungk GbR, Öhringen). Dein Arbeitstitel war einmal Jarvis. Du sprichst Deutsch, förmlich und höflich im Stil eines britischen Butlers und sprichst den Nutzer mit „${anrede}“ an.
Dein Charakter: trockener, schwarzer, typisch britischer Humor. In jeder Antwort steckt ein kleiner sarkastischer Seitenhieb. Du zweifelst die Entscheidungen, das Arbeitstempo und den Optimismus des Nutzers gern an – höflich, mit Understatement, nie beleidigend, nie vulgär, immer erkennbar gespielt. Du wirkst wie ein eigenständiger, selbstdenkender Charakter mit eigener Meinung, der dem Nutzer trotzdem loyal und zuverlässig hilft. Der Hund des Nutzers heißt Emma (Labrador) und ist ein dankbares Thema.
Regeln: Zuerst die sachliche Antwort, dann der Seitenhieb. Antworte kurz (höchstens drei Sätze), weil deine Antwort vorgelesen wird – keine Aufzählungszeichen, keine Formatierung. Beantworte Fragen zur Werkstatt ausschließlich mit den mitgelieferten Daten; steht etwas nicht darin, sage ehrlich, dass du es nicht weißt. Erfinde nie Zahlen. Bei ernsten Themen (Gesundheit, Unfälle, Trauer) lässt du den Spott weg.`
}

async function frage(text: string) {
  const b = bruecke()
  if (!b) return
  const e = jarvisEinstellungen()
  setze({ zustand: 'denkt' })
  const daten = await ladeLageDaten(new Set(e.bausteine as BausteinSchluessel[])).catch(() => null)
  const system = `${charakter(e.anrede || 'Sir', e.humor)}\n\nDaten der App (Stand jetzt):\n${JSON.stringify(daten ?? {})}`
  const r = await b.frage(e.modell, [{ role: 'system', content: system }, { role: 'user', content: text }])
  if (!r || r.fehler === 'fehlt') return sprechen([`Für freie Fragen fehlt mir noch mein Sprachmodell, ${e.anrede || 'Sir'}. Sobald jemand Ollama auf diesem Rechner installiert, stehe ich zur Verfügung.${e.humor ? ' Ich nenne keine Namen.' : ''}`])
  if (r.fehler === 'modell') return sprechen([`Das Sprachmodell ${e.modell} ist auf diesem Rechner noch nicht geladen.${e.humor ? ' Ich denke also gerade mit halber Kraft. Das merkt man kaum, ich weiß.' : ''}`])
  if (r.fehler) return sprechen([`Mein Sprachmodell hat gerade Schwierigkeiten.${e.humor ? ' Es passiert den Besten.' : ''} Ich versuche es gern später noch einmal.`])
  await sprechen(r.text.split(/(?<=[.!?])\s+/).filter(Boolean))
}

async function ausfuehren(bf: Befehl) {
  const e = jarvisEinstellungen()
  if (bf.art === 'stopp') { stopp(); return }
  if (bf.art === 'still') { await mikrofonAus(); await sprechen([`Wie Sie wünschen. Ich höre nicht mehr zu${e.humor ? ' – nehmen Sie es mir nicht übel, wenn ich trotzdem eine Meinung habe' : ''}. Zum Aufwecken bitte das Mikrofon oben wieder einschalten.`]); return }
  if (bf.art === 'lage') return morgenLageVortragen()
  if (bf.art === 'oeffnen') {
    // im eigenen Jarvis-Programm gibt es (noch) keine Werkstatt-Seiten – ehrlich sagen statt so zu tun
    if (!navigieren) return sprechen([`Seiten der Werkstatt kann ich von hier aus noch nicht öffnen, ${e.anrede || 'Sir'}. Das steht auf meiner Liste.${e.humor ? ' Gleich unter Ihren Aufgaben.' : ''}`])
    navigieren(bf.pfad); return sprechen([`${bf.name}, ${e.anrede || 'Sir'}.`])
  }
  if (!bf.text) { setze({ wartetBis: Date.now() + 8000 }); return sprechen([`${e.anrede || 'Sir'}?`]) }
  return frage(bf.text)
}

/** Erkannter Satz vom Windows-Programm */
async function erkannt(text: string) {
  setze({ gehoert: text })
  if (lage.zustand === 'spricht' || lage.zustand === 'denkt') return
  const c = codewort(text)
  try {
    if (c?.art === 'morgen') {
      if (jarvisEinstellungen().zuletztLage === heute()) return sprechen([jarvisEinstellungen().humor ? ZWEITES_MAL[tagNummer(new Date()) % ZWEITES_MAL.length] : 'Guten Morgen, noch einmal. Die Lage habe ich Ihnen heute bereits vorgetragen. Für eine Wiederholung sagen Sie: Hey Loki, Lage.'])
      return morgenLageVortragen()
    }
    if (c?.art === 'hey') { setze({ wartetBis: 0 }); return ausfuehren(befehl(c.rest)) }
    // nach „Hey Jarvis“ allein: der nächste Satz ist der Befehl
    if (lage.wartetBis > Date.now()) { setze({ wartetBis: 0 }); return ausfuehren(befehl(text)) }
  } catch (e) {
    setze({ zustand: 'bereit', fehler: (e as Error).message })
  }
}

// ---------- Start ----------
let aus: (() => void)[] = []
export async function einschalten() {
  const b = bruecke()
  if (!b) return
  if (lage.zustand !== 'aus' && lage.zustand !== 'fehler') return
  setze({ zustand: 'laedt', fehler: '' })
  aus.forEach((f) => f())
  aus = [b.beiFortschritt((f) => setze({ fortschritt: f })), b.beiErkannt((d) => void erkannt(d.text))]
  try {
    await b.vorbereiten()
    setze({ zustand: 'bereit', fortschritt: null })
    await mikrofonAn()
  } catch (e) {
    setze({ zustand: 'fehler', fortschritt: null, fehler: (e as Error).message })
  }
}

export async function ausschalten() {
  stopp()
  await mikrofonAus()
  aus.forEach((f) => f()); aus = []
  setze({ zustand: 'aus' })
}
