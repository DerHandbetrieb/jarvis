// Eigene Fensterrahmen für das Dauer-HUD (Entwürfe 05.11.2026, Rückmeldung Auftraggeber: die gemalten Rahmen des
// Grafikpakets passen nicht exakt zu den Inhalten – neue Rahmen im selben Stil, Rahmen und Inhalt in EINER Ebene, die
// zusammen mit echter Perspektive gekippt wird). Jeder Stil zeichnet Glas, Rand und Zierde in eine flache Leinwand und
// gibt den Innenbereich für den Inhalt zurück.
const CYAN = '#5ff6ff', GOLD = '#f2b04a'

function abgeschraegt(g, x, y, b, h, e) { // Viereck mit abgeschrägten Ecken (oben links, unten rechts)
  g.beginPath(); g.moveTo(x + e, y); g.lineTo(x + b, y); g.lineTo(x + b, y + h - e); g.lineTo(x + b - e, y + h); g.lineTo(x, y + h); g.lineTo(x, y + e); g.closePath()
}
function glas(g, b, h, oben = 'rgba(8,34,44,0.82)', unten = 'rgba(2,12,18,0.9)') {
  const v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, oben); v.addColorStop(1, unten); g.fillStyle = v; g.fill()
}
function lichtkante(g, x0, x1, y, farbe = GOLD, breite = 2) { // leuchtender Streifen, zur Mitte hell
  const v = g.createLinearGradient(x0, 0, x1, 0)
  v.addColorStop(0, 'rgba(242,176,74,0)'); v.addColorStop(0.5, farbe); v.addColorStop(1, 'rgba(242,176,74,0)')
  g.save(); g.shadowColor = farbe; g.shadowBlur = 10; g.fillStyle = v; g.fillRect(x0, y - breite / 2, x1 - x0, breite); g.restore()
}
function ecken(g, b, h, l, farbe, breite = 2, rand = 0) { // Eckwinkel
  g.strokeStyle = farbe; g.lineWidth = breite; g.shadowColor = farbe; g.shadowBlur = 6
  for (const [x, y, sx, sy] of [[rand, rand, 1, 1], [b - rand, rand, -1, 1], [rand, h - rand, 1, -1], [b - rand, h - rand, -1, -1]]) {
    g.beginPath(); g.moveTo(x + sx * l, y); g.lineTo(x, y); g.lineTo(x, y + sy * l); g.stroke()
  }
  g.shadowBlur = 0
}

export const RAHMEN_STILE = {
  /** 1 Glas & Goldkante – nah am Grafikpaket: dunkles Glas, feiner Cyan-Rand, goldener Lichtstreifen oben und unten */
  1: { name: 'Glas & Goldkante', zeichne(g, b, h) {
    abgeschraegt(g, 1, 1, b - 2, h - 2, 18); glas(g, b, h)
    g.strokeStyle = 'rgba(95,246,255,0.55)'; g.lineWidth = 1.2; g.stroke()
    lichtkante(g, b * 0.15, b * 0.75, 1.5); lichtkante(g, b * 0.35, b * 0.95, h - 1.5, GOLD, 1.5)
    return { x: 0, y: 0, b, h }
  } },
  /** 2 Doppelrahmen mit Reiter – Außen- und Innenlinie, Titel-Reiter oben links, Eckwinkel */
  2: { name: 'Doppelrahmen mit Reiter', zeichne(g, b, h) {
    abgeschraegt(g, 6, 6, b - 12, h - 12, 14); glas(g, b, h)
    g.strokeStyle = 'rgba(95,246,255,0.35)'; g.lineWidth = 1; g.stroke()
    abgeschraegt(g, 1, 1, b - 2, h - 2, 20); g.strokeStyle = 'rgba(95,246,255,0.75)'; g.lineWidth = 1.4; g.stroke()
    ecken(g, b, h, 26, CYAN, 2.2, 1)
    g.fillStyle = 'rgba(95,246,255,0.18)'; g.fillRect(24, 1, Math.min(220, b * 0.35), 4) // Reiter oben
    lichtkante(g, b * 0.55, b * 0.95, 1.5)
    return { x: 6, y: 6, b: b - 12, h: h - 12 }
  } },
  /** 3 Runen-Leiste – Wikinger-Einschlag: goldene Leiste oben mit kleinen Runen-Kerben und Flechtknoten in den Ecken */
  3: { name: 'Runen-Leiste', zeichne(g, b, h) {
    abgeschraegt(g, 1, 1, b - 2, h - 2, 12); glas(g, b, h)
    g.strokeStyle = 'rgba(95,246,255,0.45)'; g.lineWidth = 1; g.stroke()
    // goldene Leiste mit Kerben
    g.fillStyle = 'rgba(242,176,74,0.85)'; g.fillRect(14, 0, b - 28, 3)
    g.fillStyle = GOLD; for (let x = 30; x < b - 30; x += 46) { g.fillRect(x, 3, 2, 5); g.fillRect(x + 6, 3, 2, 3) }
    // Flechtknoten-Andeutung in den oberen Ecken (zwei verschlungene Bögen)
    g.strokeStyle = GOLD; g.lineWidth = 1.6; g.shadowColor = GOLD; g.shadowBlur = 6
    for (const x of [14, b - 14]) { g.beginPath(); g.arc(x, 10, 8, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(x, 10, 3.5, 0, Math.PI * 2); g.stroke() }
    g.shadowBlur = 0
    lichtkante(g, b * 0.2, b * 0.8, h - 1.5, CYAN, 1.2)
    return { x: 0, y: 6, b, h: h - 6 }
  } },
  /** 4 Holo minimal – kein ganzer Rand: sehr helles, durchscheinendes Glas, nur leuchtende Eckwinkel und Lichtbalken unten */
  4: { name: 'Holo minimal', zeichne(g, b, h) {
    g.beginPath(); g.rect(0, 0, b, h); glas(g, b, h, 'rgba(20,70,85,0.55)', 'rgba(4,20,28,0.7)')
    ecken(g, b, h, 34, CYAN, 2.5, 1.5)
    const v = g.createLinearGradient(0, h - 6, 0, h); v.addColorStop(0, 'rgba(95,246,255,0)'); v.addColorStop(1, 'rgba(95,246,255,0.7)')
    g.fillStyle = v; g.fillRect(b * 0.1, h - 6, b * 0.8, 6)
    return { x: 0, y: 0, b, h }
  } },
}
