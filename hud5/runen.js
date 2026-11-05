// Echte Runen des Älteren Futhark als Striche (05.11.2026, Wunsch Auftraggeber: die angedeuteten Zeichen in den
// Runenringen durch echte Runen ersetzen). Selbst gezeichnet statt Schrift, damit sie auf jedem Rechner gleich und
// gestochen scharf aussehen. Koordinaten in einem Feld 0..1 (Breite) × 0..1.6 (Höhe), Ursprung oben links.
// Runen-Regel (CLAUDE.md, Abschnitt 13): ᛋ/ᛊ (Sig), ᛟ (Odal), ᛉ und ᛦ (Lebens-/Todesrune) kommen nicht vor.
const S = 1.6 // Höhe des Feldes

export const RUNEN = {
  'ᚠ': [[0, 0, 0, S], [0, 0.3, 0.75, 0], [0, 0.75, 0.75, 0.4]], // Fehu
  'ᚢ': [[0, S, 0, 0], [0, 0, 0.8, 0.5], [0.8, 0.5, 0.8, S]], // Uruz
  'ᚦ': [[0, 0, 0, S], [0, 0.45, 0.7, 0.8], [0.7, 0.8, 0, 1.15]], // Thurisaz
  'ᚨ': [[0, 0, 0, S], [0, 0.3, 0.75, 0.6], [0, 0.75, 0.75, 1.05]], // Ansuz
  'ᚱ': [[0, 0, 0, S], [0, 0, 0.7, 0.4], [0.7, 0.4, 0, 0.8], [0, 0.8, 0.75, S]], // Raidho
  'ᚲ': [[0.7, 0.3, 0.05, 0.8], [0.05, 0.8, 0.7, 1.3]], // Kaunan
  'ᚷ': [[0, 0.2, 0.8, 1.4], [0.8, 0.2, 0, 1.4]], // Gebo
  'ᚹ': [[0, 0, 0, S], [0, 0, 0.7, 0.4], [0.7, 0.4, 0, 0.8]], // Wunjo
  'ᚺ': [[0, 0, 0, S], [0.75, 0, 0.75, S], [0, 0.55, 0.75, 1.05]], // Hagalaz
  'ᚾ': [[0.4, 0, 0.4, S], [0.05, 0.55, 0.75, 1.0]], // Naudiz
  'ᛁ': [[0.4, 0, 0.4, S]], // Isa
  'ᛃ': [[0.35, 0.15, 0, 0.55], [0, 0.55, 0.35, 0.95], [0.45, 0.65, 0.8, 1.05], [0.8, 1.05, 0.45, 1.45]], // Jera
  'ᛇ': [[0.4, 0, 0.4, S], [0.4, 0, 0.75, 0.35], [0.4, S, 0.05, 1.25]], // Eihwaz
  'ᛈ': [[0, 0, 0, S], [0, 0, 0.6, 0.35], [0.6, 0.35, 0.6, 0.55], [0, S, 0.6, 1.25], [0.6, 1.25, 0.6, 1.05]], // Perthro
  'ᛏ': [[0.4, 0, 0.4, S], [0.4, 0, 0, 0.45], [0.4, 0, 0.8, 0.45]], // Tiwaz
  'ᛒ': [[0, 0, 0, S], [0, 0, 0.65, 0.4], [0.65, 0.4, 0, 0.8], [0, 0.8, 0.65, 1.2], [0.65, 1.2, 0, S]], // Berkanan
  'ᛖ': [[0, 0, 0, S], [0.8, 0, 0.8, S], [0, 0, 0.4, 0.5], [0.4, 0.5, 0.8, 0]], // Ehwaz
  'ᛗ': [[0, 0, 0, S], [0.8, 0, 0.8, S], [0, 0, 0.8, 0.65], [0.8, 0, 0, 0.65]], // Mannaz
  'ᛚ': [[0.15, 0, 0.15, S], [0.15, 0, 0.7, 0.45]], // Laguz
  'ᛜ': [[0.4, 0.3, 0.8, 0.8], [0.8, 0.8, 0.4, 1.3], [0.4, 1.3, 0, 0.8], [0, 0.8, 0.4, 0.3]], // Ingwaz
  'ᛞ': [[0, 0.1, 0, 1.5], [0.9, 0.1, 0.9, 1.5], [0, 0.1, 0.9, 1.5], [0.9, 0.1, 0, 1.5]], // Dagaz
}

/** Reihenfolge der Ringe: beginnt mit ᛚᚢᚲᛁ (L-O-K-I mit ᚢ für „o“, wie im bisherigen Schriftzug), dann das Futhark */
export const FOLGE = ['ᛚ', 'ᚢ', 'ᚲ', 'ᛁ', 'ᚠ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛜ', 'ᛞ']

/** eine Rune zeichnen, Mitte im Ursprung, Höhe h */
export function rune(g, zeichen, h) {
  const k = h / S, striche = RUNEN[zeichen]
  if (!striche) return
  g.beginPath()
  for (const [x1, y1, x2, y2] of striche) { g.moveTo((x1 - 0.4) * k, (y1 - S / 2) * k); g.lineTo((x2 - 0.4) * k, (y2 - S / 2) * k) }
  g.stroke()
}
