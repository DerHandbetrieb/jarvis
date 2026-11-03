// Jarvis – Brücke zum Windows-Programm und Einstellungen je Gerät (03.11.2026). Jarvis gibt es nur im Windows-Programm
// (Stimme und Spracherkennung laufen dort lokal); im Browser ist window.jarvisDesktop nicht da.
import { useSyncExternalStore } from 'react'
import { BAUSTEINE, type BausteinSchluessel } from './morgenlage'

/** Lokis Stimme (Qwen3-TTS als eigenes Python-Programm): fehlt = nicht eingerichtet, fehler = abgestürzt/Laden misslungen */
export type LokiZustand = 'aus' | 'laedt' | 'bereit' | 'fehlt' | 'fehler'
export type JarvisStatus = { verfuegbar: boolean; modelle: Record<string, boolean>; bereit: boolean; zuhoeren: boolean; groesseMb: number; loki?: { zustand: LokiZustand; fehler: string } }
export type Stimme = 'loki' | 'piper'
export type JarvisBruecke = {
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
}

const STANDARD: JarvisEinstellungen = {
  an: false, anrede: 'Sir', humor: true, stimme: 'loki', tempo: 0.88, bausteine: BAUSTEINE.map((b) => b.schluessel), aussprache: '', modell: 'qwen2.5:7b', zuletztLage: '',
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
