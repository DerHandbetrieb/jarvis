// Jarvis – Daten für die Morgen-Lage (03.11.2026). Jeder Baustein für sich: scheitert einer (z. B. kein Internet
// fürs Wetter), fehlt nur dieser Satz.
// Im eigenen Jarvis-Projekt gibt es vorerst nur das Wetter. Die Werkstatt-Daten (Aufgaben, Amazon-Probleme, Lager,
// Verkäufe, Freigaben) kommen später aus derselben Supabase-Datenbank wie die Werkstatt-App – mit eigener Anmeldung
// inkl. Zwei-Faktor. Das wird erst geplant und mit dem Auftraggeber abgestimmt (siehe CLAUDE.md, „Werkstatt-Anbindung“).
// Bis dahin liefern diese Bausteine „null“ und die Morgen-Lage lässt sie einfach weg.
// Die frühere Fassung mit den Werkstatt-Abfragen steht in der Werkstatt-App unter src/jarvis/daten.ts.
import { holeWetter, wetterAusCode, wetterOrt } from './wetter'
import type { BausteinSchluessel, LageEingabe } from './morgenlage'

const WETTER_WORT = { klar: 'klarer Himmel', wolkig: 'bewölkt', regen: 'Regen', gewitter: 'Gewitter' } as const

const sicher = async <T,>(f: () => Promise<T>): Promise<T | null> => { try { return await f() } catch { return null } }

export async function ladeLageDaten(bausteine: Set<BausteinSchluessel>): Promise<Omit<LageEingabe, 'jetzt' | 'anrede' | 'humor' | 'bausteine'>> {
  const wetter = bausteine.has('wetter') ? await sicher(() => holeWetter(wetterOrt())) : null
  const c = wetter?.current
  return {
    aufgaben: null, probleme: null, lager: null, verkauf: null, freigaben: null,
    wetter: c ? { grad: c.temperature_2m ?? null, text: c.weather_code != null ? WETTER_WORT[wetterAusCode(c.weather_code, c.cloud_cover ?? 0)] : null } : null,
  }
}
