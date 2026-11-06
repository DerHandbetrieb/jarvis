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

/** Kleine Linien-Symbole für den System-Streifen (Wunsch Auftraggeber 06.11.2026): gleicher Stil wie oben, ganz schlicht */
export function leistenSymbol(g, art, x, y, gr, farbe, glanz = 0.2) {
  g.save(); g.translate(x, y); g.strokeStyle = farbe; g.fillStyle = farbe; g.lineWidth = Math.max(1.5, gr * 0.07); g.lineJoin = 'round'; g.lineCap = 'round'
  g.shadowColor = farbe; g.shadowBlur = gr * glanz
  const s = gr / 2
  if (art === 'stimme') { // Tonwelle
    ;[0.35, 0.7, 1, 0.6, 0.3].forEach((h, i) => { const px = (i - 2) * s * 0.42; g.beginPath(); g.moveTo(px, -s * 0.85 * h); g.lineTo(px, s * 0.85 * h); g.stroke() })
  } else if (art === 'mikrofon') {
    g.beginPath(); g.roundRect(-s * 0.3, -s * 0.95, s * 0.6, s * 1.2, s * 0.3); g.stroke()
    g.beginPath(); g.arc(0, -s * 0.05, s * 0.6, 0, Math.PI); g.stroke()
    g.beginPath(); g.moveTo(0, s * 0.55); g.lineTo(0, s * 0.92); g.moveTo(-s * 0.32, s * 0.92); g.lineTo(s * 0.32, s * 0.92); g.stroke()
  } else if (art === 'zahnrad') {
    const z = 8, r1 = s * 0.95, r2 = s * 0.7
    g.beginPath()
    for (let i = 0; i < z; i++) {
      const w = (i * Math.PI * 2) / z, d = Math.PI / z
      for (const [r, a] of [[r2, -d], [r1, -d * 0.55], [r1, d * 0.55], [r2, d]]) g.lineTo(Math.cos(w + a) * r, Math.sin(w + a) * r)
    }
    g.closePath(); g.stroke()
    g.beginPath(); g.arc(0, 0, s * 0.3, 0, Math.PI * 2); g.stroke()
  } else if (art === 'kamera') {
    g.beginPath(); g.roundRect(-s * 0.95, -s * 0.52, s * 1.25, s * 1.04, s * 0.14); g.stroke()
    g.beginPath(); g.moveTo(s * 0.3, -s * 0.12); g.lineTo(s * 0.95, -s * 0.48); g.lineTo(s * 0.95, s * 0.48); g.lineTo(s * 0.3, s * 0.12); g.stroke()
  } else if (art === 'schild') {
    g.beginPath(); g.moveTo(0, -s * 0.95); g.lineTo(s * 0.78, -s * 0.65); g.lineTo(s * 0.78, s * 0.05); g.quadraticCurveTo(s * 0.7, s * 0.65, 0, s * 0.98); g.quadraticCurveTo(-s * 0.7, s * 0.65, -s * 0.78, s * 0.05); g.lineTo(-s * 0.78, -s * 0.65); g.closePath(); g.stroke()
    g.beginPath(); g.moveTo(-s * 0.34, 0); g.lineTo(-s * 0.08, s * 0.28); g.lineTo(s * 0.38, -s * 0.28); g.stroke()
  } else if (art === 'whatsapp') { // Sprechblase mit Hörer, schlicht als Umriss
    g.beginPath(); g.arc(s * 0.04, -s * 0.04, s * 0.88, Math.PI * 0.72, Math.PI * 2.62); g.lineTo(-s * 0.95, s * 0.95); g.closePath(); g.stroke()
    g.beginPath(); g.moveTo(-s * 0.3, -s * 0.36); g.quadraticCurveTo(-s * 0.3, s * 0.32, s * 0.38, s * 0.32); g.stroke()
    g.lineWidth *= 1.9
    g.beginPath(); g.moveTo(-s * 0.36, -s * 0.42); g.lineTo(-s * 0.26, -s * 0.2); g.moveTo(s * 0.44, s * 0.3); g.lineTo(s * 0.2, s * 0.24); g.stroke()
  }
  g.restore()
}

// Dreier-Knoten (Kleeblattschlinge) mit Über- und Unterführungen, wie das Flechtwerk im Reaktor. Die Kreuzungen werden
// einmal ausgerechnet; jede zweite Stelle läuft oben drüber.
const knotenPunkt = (t) => [Math.sin(t) + 2 * Math.sin(2 * t), Math.cos(t) - 2 * Math.cos(2 * t)]
const KNOTEN_OBEN = (() => {
  const n = 720, p = Array.from({ length: n }, (_, i) => knotenPunkt((i / n) * Math.PI * 2)), funde = []
  for (let i = 0; i < n; i++) for (let j = i + 40; j < n; j++) {
    if (n - (j - i) < 40) continue
    const d = Math.hypot(p[i][0] - p[j][0], p[i][1] - p[j][1])
    if (d < 0.02) funde.push(i, j)
  }
  // nahe beieinanderliegende Treffer zusammenfassen, dann jede zweite Stelle nehmen
  const stellen = [...funde].sort((a, b) => a - b).reduce((l, v) => { if (!l.length || v - l[l.length - 1].at(-1) > 6) l.push([v]); else l[l.length - 1].push(v); return l }, []).map((l) => l[Math.floor(l.length / 2)])
  return stellen.filter((_, i) => i % 2 === 0).map((i) => (i / n) * Math.PI * 2)
})()
export function knoten(g, x, y, gr, farbe, grund = '#04131a') {
  const m = (gr / 2) / 3.05 // der Knoten reicht bis etwa 3 Einheiten von der Mitte
  const bahn = (von, bis) => { g.beginPath(); const n = Math.ceil((bis - von) * 40); for (let i = 0; i <= n; i++) { const [px, py] = knotenPunkt(von + ((bis - von) * i) / n); g.lineTo(px * m, py * m) } }
  g.save(); g.translate(x, y); g.lineJoin = 'round'; g.lineCap = 'butt'; g.strokeStyle = farbe; g.lineWidth = Math.max(1.3, gr * 0.075)
  g.shadowColor = farbe; g.shadowBlur = gr * 0.18
  bahn(0, Math.PI * 2); g.closePath(); g.stroke()
  g.shadowBlur = 0
  const breite = g.lineWidth
  for (const t of KNOTEN_OBEN) {
    g.strokeStyle = grund; g.lineWidth = breite * 2.6; bahn(t - 0.2, t + 0.2); g.stroke()
    g.strokeStyle = farbe; g.lineWidth = breite; bahn(t - 0.32, t + 0.32); g.stroke()
  }
  g.restore()
}
