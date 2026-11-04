// Sprüche nach hinten stellen (04.11.2026, Wunsch Auftraggeber: „verwendete Sprüche nicht mehr nutzen beziehungsweise
// nach hinten stellen“). Für jede Sammlung (Pool) merkt sich Loki, wann welcher Spruch zuletzt dran war – über den Text,
// nicht die Nummer, damit neue Sprüche aus dem Nachschub nichts durcheinanderbringen. Gewählt wird immer zuerst unter den
// noch nie benutzten, danach unter dem ältesten Viertel (zufällig, damit es nicht wie eine feste Reihenfolge klingt).
// Gespeichert in localStorage „jarvis.rotation“; die Zahl der unbenutzten je Pool meldet dienst.ts an Claude (Datei
// sprueche-stand.json), damit bei der nächsten Arbeitssitzung nachgefüllt wird, wo es knapp wird.

export type Speicher = Pick<Storage, 'getItem' | 'setItem'> | null
type Daten = { zaehler: number; pools: Record<string, Record<string, number>> }
const SCHLUESSEL = 'jarvis.rotation'
const standardSpeicher = (): Speicher => (typeof localStorage === 'undefined' ? null : localStorage)

/** kurze Kennung eines Spruchtextes (djb2) */
export function kennung(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

function lesen(speicher: Speicher): Daten {
  try {
    const d = JSON.parse(speicher?.getItem(SCHLUESSEL) ?? 'null')
    if (d && Number.isFinite(d.zaehler) && d.pools && typeof d.pools === 'object') return d
  } catch { /* neu anfangen */ }
  return { zaehler: 0, pools: {} }
}

/**
 * n verschiedene Einträge aus `texte` wählen (→ Nummern in texte), benutzte nach hinten stellen.
 * texte = die Spruchtexte (mit fester Anrede, z. B. „Sir“) – nur zum Wiedererkennen.
 */
export function waehle(pool: string, texte: string[], n = 1, zufall: () => number = Math.random, speicher: Speicher = standardSpeicher()): number[] {
  if (!texte.length || n <= 0) return []
  const d = lesen(speicher)
  const benutzt = d.pools[pool] ?? {}
  const kenn = texte.map(kennung)
  const wahl: number[] = []
  for (let runde = 0; runde < Math.min(n, texte.length); runde++) {
    const frei = kenn.map((k, i) => ({ i, zuletzt: benutzt[k] ?? -1 })).filter((x) => !wahl.includes(x.i))
    const nie = frei.filter((x) => x.zuletzt < 0)
    // nie benutzte zuerst; sonst das älteste Viertel (mindestens einer)
    const kandidaten = nie.length ? nie : [...frei].sort((a, b) => a.zuletzt - b.zuletzt).slice(0, Math.max(1, Math.floor(frei.length / 4)))
    const x = kandidaten[Math.min(kandidaten.length - 1, Math.floor(zufall() * kandidaten.length))]
    wahl.push(x.i)
    benutzt[kenn[x.i]] = ++d.zaehler
  }
  // Einträge entfernter Sprüche vergessen (die Datei bleibt klein)
  const aktuell = new Set(kenn)
  for (const k of Object.keys(benutzt)) if (!aktuell.has(k)) delete benutzt[k]
  d.pools[pool] = benutzt
  try { speicher?.setItem(SCHLUESSEL, JSON.stringify(d)) } catch { /* dann eben nicht gemerkt */ }
  return wahl
}

/** Stand je Pool: wie viele Sprüche es gibt und wie viele noch nie dran waren */
export function stand(pools: Record<string, string[]>, speicher: Speicher = standardSpeicher()): Record<string, { gesamt: number; unbenutzt: number }> {
  const d = lesen(speicher)
  return Object.fromEntries(Object.entries(pools).map(([p, texte]) => {
    const b = d.pools[p] ?? {}
    return [p, { gesamt: texte.length, unbenutzt: texte.filter((t) => b[kennung(t)] === undefined).length }]
  }))
}
