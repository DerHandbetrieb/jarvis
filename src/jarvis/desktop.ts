// Jarvis – Brücke zum Windows-Programm und Einstellungen je Gerät (03.11.2026). Jarvis gibt es nur im Windows-Programm
// (Stimme und Spracherkennung laufen dort lokal); im Browser ist window.jarvisDesktop nicht da.
import { useSyncExternalStore } from 'react'
import { BAUSTEINE, type BausteinSchluessel } from './morgenlage'

/** Lokis Stimme (Qwen3-TTS als eigenes Python-Programm): fehlt = nicht eingerichtet, fehler = abgestürzt/Laden misslungen */
export type LokiZustand = 'aus' | 'laedt' | 'bereit' | 'fehlt' | 'fehler'
export type JarvisStatus = { verfuegbar: boolean; modelle: Record<string, boolean>; bereit: boolean; zuhoeren: boolean; groesseMb: number; loki?: { zustand: LokiZustand; fehler: string } }
export type Stimme = 'loki' | 'piper'
/** Autostart mit Windows – nur im installierten Programm verfügbar */
export type Autostart = { verfuegbar: boolean; an: boolean }
export type JarvisBruecke = {
  /** Zustand fürs Symbol im Infobereich unten rechts */
  meldeZustand: (zustand: string, mikrofon: boolean) => void
  /** Rechtsklick-Menü des Symbols: „Mikrofon aus/an“ */
  beiTrayMikrofon: (fn: () => void) => () => void
  status: () => Promise<JarvisStatus | null>
  vorbereiten: () => Promise<JarvisStatus | null>
  /** text = Originalsatz für Loki, piperText = mit Aussprache-Liste für Piper (springt ein, wenn Loki nicht bereit ist) */
  sprechen: (a: { text: string; piperText: string; tempo: number; stimme: Stimme }) => Promise<{ samples: Float32Array; sampleRate: number; stimme: Stimme } | null>
  /** Lokis Stimme laden (im Hintergrund) oder beenden (gibt den Grafikspeicher frei) */
  stimme: (an: boolean) => Promise<JarvisStatus | null>
  zuhoeren: (an: boolean) => Promise<JarvisStatus | null>
  frage: (modell: string, nachrichten: { role: 'system' | 'user' | 'assistant'; content: string }[]) => Promise<{ text: string; fehler?: 'modell' | 'ollama' | 'fehlt' } | null>
  ton: (stueck: Float32Array) => void
  beiErkannt: (fn: (d: { text: string; sekunden: number }) => void) => () => void
  beiFortschritt: (fn: (d: { name: string; anteil: number }) => void) => () => void
}

/** Werkstatt-Anbindung (Anmeldung des Loki-Kontos): einrichten = QR-Code scannen, code = 6-stelligen Code eingeben */
export type WerkstattStatus = { verfuegbar: boolean; zustand: 'aus' | 'einrichten' | 'code' | 'verbunden' | 'fehler'; fehler: string; qr: string; stand: number | null }
export type WerkstattBruecke = {
  status: () => Promise<WerkstattStatus | null>
  verbinden: (email: string, passwort: string) => Promise<WerkstattStatus | null>
  code: (code: string) => Promise<WerkstattStatus | null>
  trennen: () => Promise<WerkstattStatus | null>
  /** erzwingen = frisch holen statt aus dem Zwischenspeicher (bis 2 Minuten alt) */
  lage: (erzwingen?: boolean) => Promise<WerkstattLage | null>
  beiAenderung: (fn: (s: WerkstattStatus) => void) => () => void
}
/** Antwort der Serverfunktion jarvis-lage (Werkstatt-App, supabase/functions/jarvis-lage) */
export type WerkstattLage = {
  stand: string
  geholt: number
  aufgaben: { offen: number; neu: number; wichtigste: { titel: string; faellig: string | null }[]; amazonProbleme: string[] }
  lagerKnapp: { name: string; variante: string | null; bestand: number; meldebestand: number }[]
  verkauf: {
    gestern: { tag: string; bestellungen: number; stueck: number; umsatzCent: number; kanaele: { kanal: string; bestellungen: number; stueck: number; umsatzCent: number }[] }
    tage: { tag: string; bestellungen: number; stueck: number; umsatzCent: number }[]
    kanaele14: { kanal: string; bestellungen: number; stueck: number; umsatzCent: number }[]
  }
  freigaben: number
  selbsttest: { am: string; rot: number } | null
}
export const werkstattBruecke = (): WerkstattBruecke | null => (typeof window !== 'undefined' ? window.jarvisDesktop?.werkstatt ?? null : null)

/** Start-Sequenz über alle Bildschirme; Meldungen: gruss (Loki hat dort gesprochen), ohne-gruss, abgebrochen, ende */
export type SequenzBruecke = {
  starten: (lautstaerke: number) => Promise<boolean>
  gruss: (samples: Float32Array, sampleRate: number) => void
  keinGruss: () => void
  beiMeldung: (fn: (art: string) => void) => () => void
}
export const sequenzBruecke = (): SequenzBruecke | null => (typeof window !== 'undefined' ? window.jarvisDesktop?.sequenz ?? null : null)

export const bruecke = (): JarvisBruecke | null => (typeof window !== 'undefined' ? window.jarvisDesktop?.jarvis ?? null : null)

export type JarvisEinstellungen = {
  an: boolean
  anrede: string
  humor: boolean
  /** loki = neue Stimme (Probe S), piper = alte Computerstimme Thorsten */
  stimme: Stimme
  /** Sprechtempo – nur für Piper, Loki hat sein Tempo aus der Vorlage */
  tempo: number
  bausteine: BausteinSchluessel[]
  /** eigene Aussprache-Einträge, eine Zeile je „Wort = Aussprache“ – nur für Piper */
  aussprache: string
  modell: string
  /** Morgen-Lage am Tag schon vorgetragen (JJJJ-MM-TT) – damit „Guten Morgen“ später nur noch kurz antwortet */
  zuletztLage: string
  /** Nummer der letzten Begrüßung beim Rechnerstart (-1 = noch keine) – damit nie zweimal dieselbe kommt */
  letzteBegruessung: number
  /** Start-Sequenz über alle Bildschirme beim Rechnerstart (Lokis Spruch im Finale) */
  startSequenz: boolean
  /** Lautstärke der Start-Sequenz (0 bis 1) – Lokis Stimme bleibt dabei verständlich */
  sequenzLautstaerke: number
}

const STANDARD: JarvisEinstellungen = {
  an: false, anrede: 'Sir', humor: true, stimme: 'loki', tempo: 0.88, bausteine: BAUSTEINE.map((b) => b.schluessel), aussprache: '', modell: 'qwen2.5:7b', zuletztLage: '', letzteBegruessung: -1, startSequenz: true, sequenzLautstaerke: 0.8,
}
const SCHLUESSEL = 'jarvis.einstellungen'
const zuhoerer = new Set<() => void>()

function lesen(): JarvisEinstellungen {
  try {
    const roh = JSON.parse(localStorage.getItem(SCHLUESSEL) ?? 'null') as Partial<JarvisEinstellungen> | null
    return { ...STANDARD, ...(roh ?? {}) }
  } catch { return { ...STANDARD } }
}
let aktuell = lesen()

export function jarvisEinstellungen(): JarvisEinstellungen { return aktuell }
export function setzeJarvis(teil: Partial<JarvisEinstellungen>) {
  aktuell = { ...aktuell, ...teil }
  try { localStorage.setItem(SCHLUESSEL, JSON.stringify(aktuell)) } catch { /* dann eben nicht gemerkt */ }
  zuhoerer.forEach((z) => z())
}
export function useJarvisEinstellungen(): JarvisEinstellungen {
  return useSyncExternalStore((z) => { zuhoerer.add(z); return () => { zuhoerer.delete(z) } }, () => aktuell)
}
