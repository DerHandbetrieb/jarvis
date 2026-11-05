// Eigene Strichschrift im Futhark-Stil (05.11.2026, Wunsch Auftraggeber: Text im Ring „in einer Futhark-Schrift“, gut
// lesbar). Lateinische Buchstaben nur aus geraden, schrägen Strichen wie eingeritzte Runen – selbst gezeichnet, darum
// keine Lizenzfrage. Runen-Regel: kein Zeichen ähnelt ᛋ/ᛟ/ᛉ/ᛦ (S senkrecht gebrochen statt Zickzack, O sechseckig ohne
// Beine, Y wird nicht benutzt). Raster: Breite je Zeichen, Höhe 6 Einheiten, y = 0 oben.
const Z = {
  A: [[0, 6, 1.6, 0], [1.6, 0, 3.2, 6], [0.7, 3.6, 2.6, 3.2]],
  B: [[0, 0, 0, 6], [0, 0, 3, 1.5], [3, 1.5, 0, 3], [0, 3, 3, 4.5], [3, 4.5, 0, 6]],
  C: [[3, 0.6, 1.5, 0], [1.5, 0, 0, 1.5], [0, 1.5, 0, 4.5], [0, 4.5, 1.5, 6], [1.5, 6, 3, 5.4]],
  D: [[0, 0, 0, 6], [0, 0, 3, 1.5], [3, 1.5, 3, 4.5], [3, 4.5, 0, 6]],
  E: [[0, 0, 0, 6], [0, 0, 3, 0.8], [0, 3, 2.4, 3.4], [0, 6, 3, 5.2]],
  F: [[0, 0, 0, 6], [0, 0, 3, 0.8], [0, 3, 2.4, 3.4]],
  G: [[3, 0.8, 1.5, 0], [1.5, 0, 0, 1.5], [0, 1.5, 0, 4.5], [0, 4.5, 1.5, 6], [1.5, 6, 3, 4.5], [3, 4.5, 3, 3.3], [3, 3.3, 1.6, 3.3]],
  H: [[0, 0, 0, 6], [3, 0, 3, 6], [0, 3.6, 3, 2.6]],
  I: [[0, 0, 0, 6]],
  J: [[2, 0, 2, 4.8], [2, 4.8, 1, 6], [1, 6, 0, 5]],
  K: [[0, 0, 0, 6], [3, 0, 0, 3.2], [0, 2.8, 3, 6]],
  L: [[0, 0, 0, 6], [0, 6, 3, 5.2]],
  M: [[0, 6, 0, 0], [0, 0, 2, 3], [2, 3, 4, 0], [4, 0, 4, 6]],
  N: [[0, 6, 0, 0], [0, 0, 3, 6], [3, 6, 3, 0]],
  O: [[1.5, 0, 0, 1.5], [0, 1.5, 0, 4.5], [0, 4.5, 1.5, 6], [1.5, 6, 3, 4.5], [3, 4.5, 3, 1.5], [3, 1.5, 1.5, 0]],
  P: [[0, 6, 0, 0], [0, 0, 3, 1.5], [3, 1.5, 0, 3]],
  Q: [[1.5, 0, 0, 1.5], [0, 1.5, 0, 4.5], [0, 4.5, 1.5, 6], [1.5, 6, 3, 4.5], [3, 4.5, 3, 1.5], [3, 1.5, 1.5, 0], [1.8, 4.4, 3.4, 6.4]],
  R: [[0, 6, 0, 0], [0, 0, 3, 1.5], [3, 1.5, 0, 3], [0, 3, 3, 6]],
  S: [[3, 0.8, 0, 0], [0, 0, 0, 2.8], [0, 2.8, 3, 3.2], [3, 3.2, 3, 6], [3, 6, 0, 5.2]],
  T: [[0, 0, 3.2, 0], [1.6, 0, 1.6, 6]],
  U: [[0, 0, 0, 4.5], [0, 4.5, 1.5, 6], [1.5, 6, 3, 4.5], [3, 4.5, 3, 0]],
  V: [[0, 0, 1.6, 6], [1.6, 6, 3.2, 0]],
  W: [[0, 0, 1, 6], [1, 6, 2, 2.5], [2, 2.5, 3, 6], [3, 6, 4, 0]],
  X: [[0, 0, 3, 6], [3, 0, 0, 6]],
  Z: [[0, 0, 3, 0], [3, 0, 0, 6], [0, 6, 3, 6]],
  0: [[1.5, 0, 0, 1.2], [0, 1.2, 0, 4.8], [0, 4.8, 1.5, 6], [1.5, 6, 3, 4.8], [3, 4.8, 3, 1.2], [3, 1.2, 1.5, 0]],
  1: [[0, 1.2, 1.5, 0], [1.5, 0, 1.5, 6]],
  2: [[0, 1.4, 1.5, 0], [1.5, 0, 3, 1.4], [3, 1.4, 0, 6], [0, 6, 3, 6]],
  3: [[0, 0, 3, 0], [3, 0, 1.2, 2.7], [1.2, 2.7, 3, 4.2], [3, 4.2, 1.5, 6], [1.5, 6, 0, 5]],
  4: [[2.4, 6, 2.4, 0], [2.4, 0, 0, 4], [0, 4, 3, 4]],
  5: [[3, 0, 0, 0], [0, 0, 0, 2.6], [0, 2.6, 2, 2.6], [2, 2.6, 3, 3.8], [3, 3.8, 3, 4.8], [3, 4.8, 1.8, 6], [1.8, 6, 0, 5.4]],
  6: [[3, 0.5, 1.5, 0], [1.5, 0, 0, 1.8], [0, 1.8, 0, 4.5], [0, 4.5, 1.5, 6], [1.5, 6, 3, 4.5], [3, 4.5, 3, 3.6], [3, 3.6, 1.5, 2.8], [1.5, 2.8, 0, 3.6]],
  7: [[0, 0, 3, 0], [3, 0, 1, 6]],
  8: [[1.5, 0, 0, 1.4], [0, 1.4, 1.5, 2.9], [1.5, 2.9, 3, 1.4], [3, 1.4, 1.5, 0], [1.5, 2.9, 0, 4.4], [0, 4.4, 1.5, 6], [1.5, 6, 3, 4.4], [3, 4.4, 1.5, 2.9]],
  9: [[0, 5.5, 1.5, 6], [1.5, 6, 3, 4.2], [3, 4.2, 3, 1.5], [3, 1.5, 1.5, 0], [1.5, 0, 0, 1.5], [0, 1.5, 0, 2.4], [0, 2.4, 1.5, 3.2], [1.5, 3.2, 3, 2.4]],
  '-': [[0, 3, 2.4, 3]],
  '/': [[0, 6, 2.4, 0]],
}
// Umlaute: Grundbuchstabe + zwei kurze Kerben darüber
for (const [u, b] of [['Ä', 'A'], ['Ö', 'O'], ['Ü', 'U']]) Z[u] = [...Z[b], [0.6, -1.6, 0.9, -0.8], [2.3, -1.6, 2.6, -0.8]]
const PUNKTE = { ':': [2, 4.6], '.': [5.6], '°': [0.6] } // kleine Rauten statt runder Punkte
const breite = (z) => (z === ' ' ? 2.2 : PUNKTE[z] ? 1 : z === '·' ? 2 : Math.max(...(Z[z] ?? [[0, 0, 2, 0]]).flatMap((s) => [s[0], s[2]])))

// Roboto Thin/Light (Wunsch Auftraggeber 05.11.2026: feine, dünne Schrift; Roboto, OFL-1.1, lokal mitgeliefert)
const ROBOTO = { 'roboto-100': 100, 'roboto-300': 300 }
let messer = null
/** Buchstabenabstand: Roboto enger gesperrt (05.11.2026: Platz für Trennlinien), Strichschrift wie bisher */
export const sperrung = (h) => 1.7 * (h / 6)
const robotoFont = (h) => `${ROBOTO[SCHRIFT.stil]} ${(h / 0.711).toFixed(2)}px Roboto` // Versalhöhe von Roboto = 0,711 em
function robotoBreite(z, h) { messer ??= document.createElement('canvas').getContext('2d'); messer.font = robotoFont(h); return messer.measureText(z).width }

/** Breite eines Texts in Bildpunkten (Höhe h = Versalhöhe) */
export function textBreite(text, h) {
  if (ROBOTO[SCHRIFT.stil]) return [...text.toUpperCase()].reduce((s, z) => s + robotoBreite(z, h) + sperrung(h), -sperrung(h))
  const u = h / 6
  return [...text.toUpperCase()].reduce((s, z) => s + (breite(z) + 1.7) * u, -1.7 * u)
}

/** Schriftart (Vorschläge 05.11.2026): strich (feine Striche) | kerbe (keilförmig, wie in Stein geschlagen) |
 *  stab (verlängerte senkrechte Stäbe wie auf Runensteinen) | doppel (hohl, wie in Metall graviert) */
export const SCHRIFT = { stil: 'strich' }
function striche(g, liste, u) {
  const stil = SCHRIFT.stil
  if (stil === 'kerbe') { // jeder Strich ein spitz zulaufender Keil
    g.fillStyle = g.strokeStyle
    for (const [x1, y1, x2, y2] of liste) {
      const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, b0 = 0.55, b1 = 0.12
      g.beginPath(); g.moveTo((x1 + nx * b0) * u, (y1 + ny * b0) * u); g.lineTo((x2 + nx * b1) * u, (y2 + ny * b1) * u); g.lineTo((x2 - nx * b1) * u, (y2 - ny * b1) * u); g.lineTo((x1 - nx * b0) * u, (y1 - ny * b0) * u); g.closePath(); g.fill()
      if (g.shadowBlur > 0) g.stroke()
    }
    return
  }
  const lw = g.lineWidth
  g.beginPath()
  for (let [x1, y1, x2, y2] of liste) {
    if (stil === 'stab' && x1 === x2) { const o = 0.7, auf = y1 < y2; y1 += auf ? -o : o; y2 += auf ? o : -o } // Stäbe länger
    g.moveTo(x1 * u, y1 * u); g.lineTo(x2 * u, y2 * u)
  }
  if (stil === 'stab') { g.lineCap = 'butt'; g.lineWidth = lw * 1.25 }
  if (stil === 'doppel') { g.lineWidth = lw * 2.3; g.stroke(); const alt = g.strokeStyle, sb = g.shadowBlur; g.shadowBlur = 0; g.strokeStyle = '#061014'; g.lineWidth = lw * 1.0; g.stroke(); g.strokeStyle = alt; g.shadowBlur = sb }
  else g.stroke()
  g.lineWidth = lw; g.lineCap = 'round'
}

/** ein Zeichen zeichnen; (0,0) = Mitte unten-oben-zentriert, nur Striche (Strichstärke vom Aufrufer) */
export function zeichen(g, z, h) {
  if (ROBOTO[SCHRIFT.stil]) { z = z.toUpperCase(); g.save(); g.font = robotoFont(h); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = g.strokeStyle; g.fillText(z, 0, h / 2); g.restore(); return robotoBreite(z, h) }
  const u = h / 6, b = breite(z) * u
  z = z.toUpperCase()
  g.save(); g.translate(-b / 2, -h / 2)
  if (PUNKTE[z]) {
    for (const y of PUNKTE[z]) { g.save(); g.translate(0.5 * u, y * u); g.rotate(Math.PI / 4); g.fillRect(-0.45 * u, -0.45 * u, 0.9 * u, 0.9 * u); g.restore() }
  } else if (z === '·') {
    g.save(); g.translate(1 * u, 3 * u); g.rotate(Math.PI / 4); g.fillRect(-0.55 * u, -0.55 * u, 1.1 * u, 1.1 * u); g.restore()
  } else if (Z[z]) {
    striche(g, Z[z], u)
  }
  g.restore()
  return b
}

/** Wetter-Symbol als Strichzeichnung (sonne | wolke | sonne-wolke | regen | schnee | nebel | gewitter), Höhe h */
export function wetterSymbol(g, art, h) {
  const s = h / 2
  g.save(); g.beginPath()
  const wolke = (dx, dy, k) => { // eckige Wolke aus geraden Strichen
    g.moveTo(dx - s * k, dy + s * 0.35 * k); g.lineTo(dx - s * 0.75 * k, dy - s * 0.15 * k); g.lineTo(dx - s * 0.3 * k, dy - s * 0.2 * k); g.lineTo(dx, dy - s * 0.6 * k)
    g.lineTo(dx + s * 0.45 * k, dy - s * 0.3 * k); g.lineTo(dx + s * k, dy + s * 0.05 * k); g.lineTo(dx + s * 0.85 * k, dy + s * 0.35 * k); g.closePath()
  }
  const sonne = (dx, dy, k) => {
    const r = s * 0.42 * k; for (let i = 0; i < 6; i++) { const w = (i * Math.PI) / 3; i ? g.lineTo(dx + r * Math.cos(w), dy + r * Math.sin(w)) : g.moveTo(dx + r, dy) } g.closePath()
    for (let i = 0; i < 8; i++) { const w = (i * Math.PI) / 4 + 0.2; g.moveTo(dx + Math.cos(w) * s * 0.62 * k, dy + Math.sin(w) * s * 0.62 * k); g.lineTo(dx + Math.cos(w) * s * 0.92 * k, dy + Math.sin(w) * s * 0.92 * k) }
  }
  if (art === 'sonne') sonne(0, 0, 1)
  else if (art === 'sonne-wolke') { sonne(-s * 0.35, -s * 0.3, 0.75); wolke(s * 0.15, s * 0.25, 0.8) }
  else wolke(0, -s * 0.15, 1)
  if (art === 'regen') for (let i = -1; i <= 1; i++) { g.moveTo(i * s * 0.45, s * 0.45); g.lineTo(i * s * 0.45 - s * 0.15, s * 0.85) }
  if (art === 'schnee') for (let i = -1; i <= 1; i++) { g.moveTo(i * s * 0.45 - s * 0.1, s * 0.65); g.lineTo(i * s * 0.45 + s * 0.1, s * 0.65); g.moveTo(i * s * 0.45, s * 0.55); g.lineTo(i * s * 0.45, s * 0.75) }
  if (art === 'nebel') for (let i = 0; i < 2; i++) { g.moveTo(-s * 0.8, s * (0.5 + i * 0.25)); g.lineTo(s * 0.8, s * (0.5 + i * 0.25)) }
  if (art === 'gewitter') { g.moveTo(s * 0.05, s * 0.3); g.lineTo(-s * 0.15, s * 0.65); g.lineTo(s * 0.1, s * 0.65); g.lineTo(-s * 0.1, s * 0.98) }
  g.stroke(); g.restore()
}

/** WMO-Wettercode (Open-Meteo) → Symbol und kurzes Wort */
export function wetterArt(code) {
  const c = Number(code)
  if (c === 0) return ['sonne', 'SONNIG']
  if (c <= 2) return ['sonne-wolke', 'HEITER']
  if (c === 3) return ['wolke', 'BEWÖLKT']
  if (c === 45 || c === 48) return ['nebel', 'NEBEL']
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return ['schnee', 'SCHNEE']
  if (c >= 95) return ['gewitter', 'GEWITTER']
  if (c >= 51) return ['regen', 'REGEN']
  return ['wolke', 'BEWÖLKT']
}

const TAGE = ['SONNTAG', 'MONTAG', 'DIENSTAG', 'MITTWOCH', 'DONNERSTAG', 'FREITAG', 'SAMSTAG']
const MONATE = ['JANUAR', 'FEBRUAR', 'MÄRZ', 'APRIL', 'MAI', 'JUNI', 'JULI', 'AUGUST', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DEZEMBER']
/** Uhrzeit, Datum, Kalenderwoche (ISO 8601) in deutscher Zeit */
export function zeitAngaben(jetzt = new Date()) {
  const teile = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(jetzt).map((p) => [p.type, p.value]))
  const j = Number(teile.year), m = Number(teile.month), t = Number(teile.day)
  const d = new Date(Date.UTC(j, m - 1, t)), wt = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - wt)
  const kw = Math.ceil(((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86_400_000 + 1) / 7)
  return { uhr: `${teile.hour}:${teile.minute}`, tag: TAGE[new Date(Date.UTC(j, m - 1, t)).getUTCDay()], datum: `${t}. ${MONATE[m - 1]} ${j}`, datumKurz: `${String(t).padStart(2, '0')}.${String(m).padStart(2, '0')}.${j}`, kw }
}
