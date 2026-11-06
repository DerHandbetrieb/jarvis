// Wetterart für Lokis Sätze und das Dauer-HUD. Das Wetter selbst kommt seit 06.11.2026 ausnahmslos von der eigenen Station
// (electron/himmel.cjs), kein Wetterdienst mehr.

/** WMO-Wettercode (aus den Stationswerten abgeleitet) → grobe Wetterart */
export function wetterAusCode(code: number, wolken = 0): 'klar' | 'heiter' | 'wolkig' | 'regen' | 'schnee' | 'nebel' | 'gewitter' {
  if (code >= 95) return 'gewitter'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'schnee'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 84)) return 'regen'
  if (code === 45 || code === 48) return 'nebel'
  if (code === 2) return 'heiter'
  if (code === 3 || wolken >= 70) return 'wolkig'
  return 'klar'
}

export const WETTER_WORT = { klar: 'Sonnenschein', heiter: 'heiter', wolkig: 'bewölkt', regen: 'Regen', schnee: 'Schnee', nebel: 'Nebel', gewitter: 'Gewitter' } as const
