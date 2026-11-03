// Jarvis – Brücke zum Windows-Programm und Einstellungen je Gerät (03.11.2026). Jarvis gibt es nur im Windows-Programm
// (Stimme und Spracherkennung laufen dort lokal); im Browser ist window.jarvisDesktop nicht da.
import { useSyncExternalStore } from 'react'
import { BAUSTEINE, type BausteinSchluessel } from './morgenlage'

export type JarvisStatus = { verfuegbar: boolean; modelle: Record<string, boolean>; bereit: boolean; zuhoeren: boolean; groesseMb: number }
export type JarvisBruecke = {
  status: () => Promise<JarvisStatus | null>
  vorbereiten: () => Promise<JarvisStatus | null>
  sprechen: (text: string, tempo: number) => Promise<{ samples: Float32Array; sampleRate: number } | null>
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
  tempo: number
  bausteine: BausteinSchluessel[]
  /** eigene Aussprache-Einträge, eine Zeile je „Wort = Aussprache“ */
  aussprache: string
  modell: string
  /** Morgen-Lage am Tag schon vorgetragen (JJJJ-MM-TT) – damit „Guten Morgen“ später nur noch kurz antwortet */
  zuletztLage: string
}

const STANDARD: JarvisEinstellungen = {
  an: false, anrede: 'Sir', humor: true, tempo: 0.88, bausteine: BAUSTEINE.map((b) => b.schluessel), aussprache: '', modell: 'qwen2.5:7b', zuletztLage: '',
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
