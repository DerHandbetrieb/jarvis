// Linien-Symbole fürs PV-Feld (05.11.2026): Sonne, Haus, Akku (mit Füllstand), Strommast, Auto. glanz = Stärke des
// Leuchtens (Anteil der Symbolgröße); das Haus im Dauer-HUD leuchtet kaum (Rückmeldung Auftraggeber 05.11.2026).
/** Linien-Symbole (Wunsch Auftraggeber 05.11.2026): Sonne, Haus, Akku (mit Füllstand), Strommast – nur Umrisse, leuchtend */
export function symbol(g, art, x, y, gr, farbe, wert = 0, glanz = 0.25) {
  g.save(); g.translate(x, y); g.strokeStyle = farbe; g.fillStyle = farbe; g.lineWidth = Math.max(1.6, gr * 0.06); g.lineJoin = 'round'; g.lineCap = 'round'
  g.shadowColor = farbe; g.shadowBlur = gr * glanz
  const s = gr / 2
  if (art === 'sonne') {
    g.beginPath(); g.arc(0, 0, s * 0.45, 0, Math.PI * 2); g.stroke()
    for (let i = 0; i < 8; i++) { const w = (i * Math.PI) / 4; g.beginPath(); g.moveTo(Math.cos(w) * s * 0.65, Math.sin(w) * s * 0.65); g.lineTo(Math.cos(w) * s * 0.95, Math.sin(w) * s * 0.95); g.stroke() }
  } else if (art === 'haus') {
    g.beginPath(); g.moveTo(-s * 0.85, -s * 0.05); g.lineTo(0, -s * 0.85); g.lineTo(s * 0.85, -s * 0.05); g.stroke()
    g.beginPath(); g.moveTo(-s * 0.65, -s * 0.2); g.lineTo(-s * 0.65, s * 0.8); g.lineTo(s * 0.65, s * 0.8); g.lineTo(s * 0.65, -s * 0.2); g.stroke()
    g.strokeRect(-s * 0.18, s * 0.3, s * 0.36, s * 0.5)
  } else if (art === 'akku') {
    const b = s * 1.0, h = s * 1.6
    g.beginPath(); g.roundRect(-b / 2, -h / 2 + s * 0.12, b, h - s * 0.12, s * 0.08); g.stroke()
    g.fillRect(-b * 0.2, -h / 2 - s * 0.05, b * 0.4, s * 0.14)
    g.shadowBlur = 0; g.globalAlpha = 0.85
    const innen = h - s * 0.12 - s * 0.24, f = Math.max(0, Math.min(1, wert / 100))
    g.fillRect(-b / 2 + s * 0.12, h / 2 - s * 0.12 - innen * f, b - s * 0.24, innen * f)
  } else if (art === 'mast') {
    g.beginPath(); g.moveTo(-s * 0.5, s * 0.9); g.lineTo(-s * 0.12, -s * 0.9); g.lineTo(s * 0.12, -s * 0.9); g.lineTo(s * 0.5, s * 0.9); g.stroke()
    g.beginPath(); g.moveTo(-s * 0.75, -s * 0.5); g.lineTo(s * 0.75, -s * 0.5); g.moveTo(-s * 0.55, -s * 0.1); g.lineTo(s * 0.55, -s * 0.1); g.stroke()
    g.beginPath(); g.moveTo(-s * 0.36, s * 0.3); g.lineTo(s * 0.2, -s * 0.1); g.moveTo(s * 0.36, s * 0.3); g.lineTo(-s * 0.2, -s * 0.1); g.moveTo(-s * 0.45, s * 0.65); g.lineTo(s * 0.3, s * 0.3); g.stroke()
  }
  g.restore()
}

/** Auto als Linien-Symbol (mit Ladestecker) */
export function auto(g, x, y, gr, farbe, glanz = 0.2) {
  g.save(); g.translate(x, y); g.strokeStyle = farbe; g.lineWidth = Math.max(1.6, gr * 0.05); g.lineJoin = 'round'; g.lineCap = 'round'; g.shadowColor = farbe; g.shadowBlur = gr * glanz
  const s = gr / 2
  g.beginPath(); g.moveTo(-s, s * 0.25); g.lineTo(-s, -s * 0.05); g.lineTo(-s * 0.6, -s * 0.15); g.lineTo(-s * 0.35, -s * 0.5); g.lineTo(s * 0.35, -s * 0.5); g.lineTo(s * 0.6, -s * 0.15); g.lineTo(s, -s * 0.05); g.lineTo(s, s * 0.25); g.closePath(); g.stroke()
  for (const wx of [-s * 0.55, s * 0.55]) { g.beginPath(); g.arc(wx, s * 0.3, s * 0.2, 0, Math.PI * 2); g.stroke() }
  g.beginPath(); g.moveTo(-s * 0.05, -s * 0.85); g.lineTo(-s * 0.18, -s * 0.62); g.lineTo(s * 0.02, -s * 0.62); g.lineTo(-s * 0.1, -s * 0.4); g.stroke() // Blitz = Laden
  g.restore()
}
