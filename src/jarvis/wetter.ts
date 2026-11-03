// Wetter für die Morgen-Lage (übernommen aus der Werkstatt-App: src/lib/wetterort.ts und src/wikinger/wetterlage.ts).
// Daten kostenlos von Open-Meteo, ohne Konto und ohne Schlüssel. Ort je Gerät (localStorage „wetter.ort“), Start Öhringen.

export type Ort = 'oehringen' | 'obersontheim'

export const ORTE: Record<Ort, { name: string; breite: number; laenge: number }> = {
  oehringen: { name: 'Öhringen', breite: 49.2, laenge: 9.5 },
  obersontheim: { name: 'Obersontheim', breite: 49.057, laenge: 9.899 },
}

export type WetterAntwort = { current?: { temperature_2m?: number; weather_code?: number; cloud_cover?: number } }

export function wetterOrt(): Ort {
  try { if (localStorage.getItem('wetter.ort') === 'obersontheim') return 'obersontheim' } catch { /* Startwert */ }
  return 'oehringen'
}

export async function holeWetter(o: Ort): Promise<WetterAntwort> {
  const p = ORTE[o]
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.breite}&longitude=${p.laenge}&current=temperature_2m,weather_code,cloud_cover&timezone=Europe%2FBerlin`)
  if (!r.ok) throw new Error(`Wetter: Fehler ${r.status}`)
  return r.json() as Promise<WetterAntwort>
}

/** WMO-Wettercode (Open-Meteo) → grobe Wetterart */
export function wetterAusCode(code: number, wolken = 0): 'klar' | 'wolkig' | 'regen' | 'gewitter' {
  if (code >= 95) return 'gewitter'
  if ((code >= 51 && code <= 67) || (code >= 71 && code <= 77) || (code >= 80 && code <= 86)) return 'regen'
  if (code === 2 || code === 3 || code === 45 || code === 48 || wolken >= 70) return 'wolkig'
  return 'klar'
}
