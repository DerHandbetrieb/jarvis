// Kleine, leicht animierte Linien-Symbole fürs Dauer-HUD (08.11.2026, Wunsch Auftraggeber: Statistik links „leicht animiert
// mit kleinen Symbolen wie rechts“). Münze dreht sich, Paket hüpft, Säge sägt, Haken zeichnet sich, Kurve baut sich auf,
// Ring dreht sich, Stempel nickt.
// 14.11.2026 (Wunsch Auftraggeber: links „zu offensichtlich, zu nervig“): Symbole stehen still, nur das Leuchten atmet
// langsam (etwa alle 12 s) – alle Aufrufer liegen auf der linken Seite.
const SCHRIFT = 'Bahnschrift, "Segoe UI", Arial, sans-serif'
const welle = (t, f = 1) => 0.5 + 0.5 * Math.sin(t * f)
export function ikone(g, art, x, y, gr, farbe, t) {
  g.save(); g.translate(x, y); g.strokeStyle = farbe; g.fillStyle = farbe; g.lineWidth = Math.max(1.5, gr * 0.07); g.lineJoin = 'round'; g.lineCap = 'round'
  g.shadowColor = farbe; g.shadowBlur = gr * (0.12 + 0.08 * welle(t, 0.5))
  t = 0 // keine Bewegung mehr, feste Grundstellung
  const r = gr / 2
  if (art === 'muenze') { // Münze dreht sich langsam um die senkrechte Achse
    const sx = 1
    g.beginPath(); g.ellipse(0, 0, r * sx, r, 0, 0, Math.PI * 2); g.stroke()
    if (sx > 0.45) { g.scale(sx, 1); g.font = `600 ${gr * 0.55}px ${SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('€', 0, gr * 0.03) }
  } else if (art === 'paket') { // Paket hüpft leicht
    const dy = -Math.abs(Math.sin(t * 2.2)) * gr * 0.12
    g.translate(0, dy); g.strokeRect(-r * 0.8, -r * 0.55, r * 1.6, r * 1.2); g.beginPath(); g.moveTo(-r * 0.8, -r * 0.15); g.lineTo(r * 0.8, -r * 0.15); g.moveTo(0, -r * 0.55); g.lineTo(0, r * 0.65); g.stroke()
  } else if (art === 'saege') { // Säge fährt hin und her
    const dx = Math.sin(t * 3) * r * 0.25
    g.translate(dx, 0); g.beginPath(); g.moveTo(-r, r * 0.2); g.lineTo(r * 0.6, r * 0.2)
    for (let i = 0; i < 6; i++) { const x0 = -r + i * (r * 1.6 / 6); g.lineTo(x0 + r * 0.13, r * 0.4); g.lineTo(x0 + r * 0.27, r * 0.2) }
    g.moveTo(-r, r * 0.2); g.lineTo(-r * 0.9, -r * 0.35); g.lineTo(r * 0.6, -r * 0.2); g.lineTo(r * 0.6, r * 0.2); g.stroke()
    g.strokeRect(r * 0.6, -r * 0.45, r * 0.4, r * 0.75)
  } else if (art === 'haken') { // Kästchen, Haken zeichnet sich immer wieder
    g.strokeRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6)
    const p = 1, f = 1
    if (p < 1.2) { g.beginPath(); g.moveTo(-r * 0.45, 0); const a = Math.min(1, f * 2); g.lineTo(-r * 0.45 + r * 0.35 * a, r * 0.35 * a); if (f > 0.5) { const b2 = (f - 0.5) * 2; g.lineTo(-r * 0.1 + r * 0.6 * b2, r * 0.35 - r * 0.8 * b2) } g.stroke() }
  } else if (art === 'kurve') { // kleine Kurve, die sich aufbaut
    g.beginPath(); const p = 1
    for (let i = 0; i <= 20 * p; i++) { const x0 = -r + (i / 20) * gr, y0 = Math.sin(i * 0.7) * r * 0.35 - (i / 20) * r * 0.4; i ? g.lineTo(x0, y0) : g.moveTo(x0, y0) } g.stroke()
    g.beginPath(); g.moveTo(-r, r * 0.7); g.lineTo(r, r * 0.7); g.stroke()
  } else if (art === 'ring') { // Ring dreht sich
    for (let i = 0; i < 3; i++) { const a = t * 0.6 + i * 2.1; g.beginPath(); g.arc(0, 0, r * 0.8, a, a + 1.6); g.stroke() }
  } else if (art === 'stempel') { // Freigabe-Stempel nickt
    g.rotate(Math.sin(t * 2) * 0.12); g.strokeRect(-r * 0.6, r * 0.25, r * 1.2, r * 0.35); g.beginPath(); g.moveTo(0, r * 0.25); g.lineTo(0, -r * 0.3); g.stroke(); g.beginPath(); g.arc(0, -r * 0.5, r * 0.25, 0, Math.PI * 2); g.stroke()
  }
  g.restore()
}

