// Vier Entwürfe fürs Audiofeld mit laufendem Lied und Cover (07.11.2026, Wunsch Auftraggeber: „welche Band, welches Lied,
// dazu das kleine Cover – Premium“). Quelle später: Medien-Schnittstelle von Wallpaper Engine (Titel, Interpret, Album,
// Cover als Bild + Hauptfarben, Spielstand, Position). Hier nur Beispielwerte und ein selbst gezeichnetes Beispiel-Cover.
const CYAN = '#5ff6ff', GOLD = '#f2b04a', HELL = '#e8fdff', BLASS = 'rgba(165,230,240,0.62)'
const SCHRIFT = 'Bahnschrift, "Segoe UI", Arial, sans-serif'

function text(g, t, x, y, gr, farbe = HELL, ausr = 'left', gew = 400) {
  g.font = `${gew} ${gr}px ${SCHRIFT}`; g.fillStyle = farbe; g.textAlign = ausr; g.textBaseline = 'alphabetic'; g.fillText(t, x, y)
}
function kuerzen(g, t, breite) {
  if (g.measureText(t).width <= breite) return t
  while (t.length > 1 && g.measureText(t + '…').width > breite) t = t.slice(0, -1)
  return t + '…'
}
function kopf(g, titel, rechts, b) {
  text(g, titel, 28, 24, 14, CYAN, 'left', 600)
  if (rechts) text(g, rechts, b - 14, 24, 14, GOLD, 'right', 600)
  g.strokeStyle = 'rgba(95,246,255,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(14, 32.5); g.lineTo(b - 14, 32.5); g.stroke()
}
const zeit = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/** Beispiel-Cover (selbst gezeichnet, kein echtes Album) */
function beispielCover() {
  const c = document.createElement('canvas'); c.width = c.height = 300; const g = c.getContext('2d')
  const v = g.createLinearGradient(0, 0, 300, 300); v.addColorStop(0, '#3a0d4f'); v.addColorStop(0.55, '#c2364a'); v.addColorStop(1, '#f6a03a')
  g.fillStyle = v; g.fillRect(0, 0, 300, 300)
  g.fillStyle = 'rgba(255,240,200,0.9)'; g.beginPath(); g.arc(150, 170, 62, 0, Math.PI * 2); g.fill()
  g.fillStyle = 'rgba(20,6,30,0.85)'; for (let i = 0; i < 7; i++) g.fillRect(0, 175 + i * 14, 300, 5 + i)
  g.fillStyle = '#fff'; g.font = `700 30px ${SCHRIFT}`; g.textAlign = 'center'; g.fillText('NORDLICHT', 150, 58)
  return c
}
export const BEISPIEL = {
  quelle: 'SPOTIFY', titel: 'Kalte Sterne über dem See', kuenstler: 'Die Nordlichter', album: 'Mitternachtsfahrt',
  spielt: true, position: 83, dauer: 214, farben: { haupt: '#c2364a', zweit: '#f6a03a' },
}
let cover = null
const holeCover = () => (cover ??= beispielCover())

/** Spektrum-Balken (Beispielwerte, im Programm die echten Werte) */
function spektrum(g, x0, x1, oben, unten, t, n = 48, farbe = null) {
  const breite = (x1 - x0) / n, hoehe = unten - oben
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1)
    const w = Math.pow(0.15 + 0.75 * Math.abs(Math.sin(t * 2.1 + i * 0.37) * Math.cos(t * 0.9 + i * 0.11)) * (1 - f * 0.55), 0.9)
    const hb = Math.max(1.5, w * hoehe)
    const rgb = farbe ?? (f < 0.5 ? mische([150, 18, 32], [95, 246, 255], f / 0.5) : mische([95, 246, 255], [240, 250, 255], (f - 0.5) / 0.5))
    const v = g.createLinearGradient(0, unten - hb, 0, unten); v.addColorStop(0, `rgba(${rgb},0.95)`); v.addColorStop(1, `rgba(${rgb},0.25)`)
    g.fillStyle = v; g.fillRect(x0 + i * breite + 1, unten - hb, Math.max(1, breite - 3), hb)
  }
  g.strokeStyle = 'rgba(95,246,255,0.25)'; g.beginPath(); g.moveTo(x0, unten + 0.5); g.lineTo(x1, unten + 0.5); g.stroke()
}
const mische = (a, b, f) => a.map((v, k) => Math.round(v + (b[k] - v) * f))
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))

/** Cover mit feinem Rand und Lichthof in der Cover-Farbe */
function coverZeichnen(g, x, y, s, d, rund = false, winkel = 0) {
  g.save()
  g.shadowColor = d.farben.haupt; g.shadowBlur = 18
  if (rund) {
    g.translate(x + s / 2, y + s / 2); g.rotate(winkel)
    g.beginPath(); g.arc(0, 0, s / 2, 0, Math.PI * 2); g.fillStyle = '#050505'; g.fill(); g.shadowBlur = 0
    for (let r = s / 2 - 3; r > s * 0.3; r -= 3) { g.strokeStyle = 'rgba(255,255,255,0.05)'; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke() }
    g.beginPath(); g.arc(0, 0, s * 0.3, 0, Math.PI * 2); g.clip(); g.drawImage(holeCover(), -s * 0.3, -s * 0.3, s * 0.6, s * 0.6)
    g.restore(); g.save(); g.fillStyle = '#081820'; g.beginPath(); g.arc(x + s / 2, y + s / 2, 3, 0, Math.PI * 2); g.fill()
  } else {
    g.fillStyle = '#000'; g.fillRect(x, y, s, s); g.shadowBlur = 0
    g.drawImage(holeCover(), x, y, s, s)
    g.strokeStyle = 'rgba(232,253,255,0.35)'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1)
  }
  g.restore()
}
function fortschritt(g, x, y, b, d, farbe = CYAN) {
  g.fillStyle = 'rgba(95,246,255,0.12)'; g.fillRect(x, y, b, 3)
  g.fillStyle = farbe; g.fillRect(x, y, b * (d.position / d.dauer), 3)
  g.beginPath(); g.arc(x + b * (d.position / d.dauer), y + 1.5, 4, 0, Math.PI * 2); g.fill()
}
function spielzeichen(g, x, y, spielt, farbe = GOLD) {
  g.fillStyle = farbe
  if (spielt) { g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 10, y); g.lineTo(x, y + 6); g.closePath(); g.fill() }
  else { g.fillRect(x, y - 6, 3.5, 12); g.fillRect(x + 6, y - 6, 3.5, 12) }
}

export const ENTWUERFE = {
  /** A · Cover links, Titel daneben, Tonbalken rechts */
  a(g, b, h, d, t) {
    kopf(g, 'AUDIO', `${d.quelle} · ${d.spielt ? 'SPIELT' : 'PAUSE'}`, b)
    const s = h - 54
    coverZeichnen(g, 28, 42, s, d)
    const tx = 28 + s + 18, tb = 300
    g.font = `600 22px ${SCHRIFT}`; text(g, kuerzen(g, d.titel, tb), tx, 70, 22, HELL, 'left', 600)
    g.font = `400 16px ${SCHRIFT}`; text(g, kuerzen(g, d.kuenstler, tb), tx, 94, 16, CYAN)
    g.font = `400 12px ${SCHRIFT}`; text(g, kuerzen(g, d.album.toUpperCase(), tb), tx, 113, 12, BLASS)
    fortschritt(g, tx, h - 22, tb - 60, d); text(g, `${zeit(d.position)} / ${zeit(d.dauer)}`, tx + tb, h - 17, 11, BLASS, 'right', 600)
    spektrum(g, tx + tb + 30, b - 16, 42, h - 12, t)
  },
  /** B · Tonbalken über die ganze Breite, Lied als Leiste unten, Cover rechts oben über dem Rand */
  b(g, b, h, d, t) {
    kopf(g, 'AUDIO', null, b)
    spektrum(g, 16, b - 132, 42, h - 40, t)
    const s = 104
    coverZeichnen(g, b - s - 16, 40, s, d)
    g.fillStyle = 'rgba(2,12,18,0.75)'; g.fillRect(16, h - 36, b - 148 - 16, 28)
    spielzeichen(g, 30, h - 22, d.spielt)
    g.font = `600 17px ${SCHRIFT}`
    const z = `${d.kuenstler}  ·  ${d.titel}`
    text(g, kuerzen(g, z, b - 420), 50, h - 16, 17, HELL, 'left', 600)
    text(g, `${d.quelle}  ${zeit(d.position)} / ${zeit(d.dauer)}`, b - 148, h - 17, 12, GOLD, 'right', 600)
  },
  /** C · Lied in der Kopfzeile mit Mini-Cover, Balken in den Farben des Covers */
  c(g, b, h, d, t) {
    text(g, 'AUDIO', 28, 24, 14, CYAN, 'left', 600)
    coverZeichnen(g, 100, 6, 24, d)
    g.font = `600 15px ${SCHRIFT}`; const z = kuerzen(g, `${d.titel}  —  ${d.kuenstler}`, b - 420)
    text(g, z, 134, 24, 15, HELL, 'left', 600)
    text(g, `${d.quelle} · ${zeit(d.position)} / ${zeit(d.dauer)}`, b - 14, 24, 14, GOLD, 'right', 600)
    g.strokeStyle = 'rgba(95,246,255,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(14, 32.5); g.lineTo(b - 14, 32.5); g.stroke()
    // Balken: Verlauf zwischen den beiden Hauptfarben des Covers
    const a = hexRgb(d.farben.haupt), e = hexRgb(d.farben.zweit), n = 48
    g.save()
    for (let i = 0; i < n; i++) {
      g.save(); g.beginPath(); g.rect(16 + ((b - 32) / n) * i, 0, (b - 32) / n, h); g.clip()
      spektrum(g, 16, b - 16, 42, h - 14, t, n, mische(a, e, i / (n - 1))); g.restore()
    }
    g.restore()
    fortschritt(g, 16, h - 8, b - 32, d, d.farben.zweit)
  },
  /** D · Cover als drehende Schallplatte, Titel groß, Balken als Spiegel unten */
  d(g, b, h, d, t) {
    kopf(g, 'AUDIO', `${d.quelle}`, b)
    const s = h - 50
    coverZeichnen(g, 30, 40, s, d, true, d.spielt ? t * 0.9 : 0)
    const tx = 30 + s + 22
    text(g, 'JETZT LÄUFT', tx, 56, 11, GOLD, 'left', 600)
    g.font = `600 26px ${SCHRIFT}`; text(g, kuerzen(g, d.titel, 420), tx, 86, 26, HELL, 'left', 600)
    g.font = `400 16px ${SCHRIFT}`; text(g, kuerzen(g, `${d.kuenstler} · ${d.album}`, 420), tx, 110, 16, CYAN)
    fortschritt(g, tx, h - 20, 360, d); text(g, zeit(d.dauer - d.position) + ' übrig', tx + 420, h - 15, 11, BLASS, 'right', 600)
    spektrum(g, tx + 450, b - 16, 42, h - 12, t, 40)
  },
}
export const NAMEN = { a: 'A · Cover links, Balken rechts', b: 'B · Balken breit, Liedleiste unten', c: 'C · Lied in der Kopfzeile, Balken in Cover-Farben', d: 'D · Schallplatte dreht sich' }
