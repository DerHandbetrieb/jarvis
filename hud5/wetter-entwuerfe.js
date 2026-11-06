// Vier Entwürfe fürs Wetterfeld (05.11.2026, Wunsch Auftraggeber): mit Symbolen statt Textzeilen, große, auf einen Blick
// lesbare Werte, Fläche genutzt, nicht vollgeklatscht. Alle Werte aus der eigenen Station (Ecowitt).
import { wetterSymbol, wetterArt, istNacht } from './ringschrift.js'
const CYAN = '#5ff6ff', HELL = '#e8fdff', BLASS = 'rgba(165,230,240,0.62)', GOLD = '#f2b04a', LINIE = 'rgba(95,246,255,0.14)'
const SCHRIFT = 'Bahnschrift, "Segoe UI", Arial, sans-serif'
function text(g, t, x, y, gr, farbe = HELL, ausr = 'left', gew = 600) { g.font = `${gew} ${gr}px ${SCHRIFT}`; g.fillStyle = farbe; g.textAlign = ausr; g.fillText(t, x, y) }
const z = (v, n = 0) => (v == null ? '–' : (Math.round(v * 10 ** n) / 10 ** n).toFixed(n).replace('.', ','))
function kopf(g, b, w) { text(g, `WETTER · ${String(w?.ort ?? 'Obersontheim').toUpperCase()}`, 28, 22, 13, CYAN); text(g, 'EIGENE STATION', b - 14, 22, 11, BLASS, 'right'); g.strokeStyle = 'rgba(95,246,255,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(14, 30.5); g.lineTo(b - 14, 30.5); g.stroke() }
const RICHTUNG = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW']
const richtung = (grad) => (grad == null ? '' : RICHTUNG[Math.round(grad / 45) % 8])

/** Linien-Symbole: thermo | tropfen | wind | boe | druck | regen; (x, y) = Mitte, gr = Höhe */
export function symbolW(g, art, x, y, gr, farbe = CYAN) {
  const s = gr / 2
  g.save(); g.translate(x, y); g.strokeStyle = farbe; g.fillStyle = farbe; g.lineWidth = Math.max(1.6, gr * 0.055); g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = farbe; g.shadowBlur = gr * 0.12
  g.beginPath()
  if (art === 'thermo') {
    g.moveTo(-s * 0.18, s * 0.35); g.lineTo(-s * 0.18, -s * 0.75); g.arc(0, -s * 0.75, s * 0.18, Math.PI, 0); g.lineTo(s * 0.18, s * 0.35)
    g.stroke(); g.beginPath(); g.arc(0, s * 0.6, s * 0.34, -Math.PI * 0.32, Math.PI * 1.32); g.stroke()
    g.beginPath(); g.arc(0, s * 0.6, s * 0.18, 0, Math.PI * 2); g.fill(); g.fillRect(-s * 0.06, -s * 0.3, s * 0.12, s * 0.8)
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(s * 0.3, -s * 0.55 + i * s * 0.28); g.lineTo(s * 0.5, -s * 0.55 + i * s * 0.28); g.stroke() }
  } else if (art === 'tropfen') {
    g.moveTo(0, -s * 0.9); g.bezierCurveTo(s * 0.35, -s * 0.35, s * 0.62, s * 0.05, s * 0.62, s * 0.35); g.arc(0, s * 0.35, s * 0.62, 0, Math.PI); g.bezierCurveTo(-s * 0.62, s * 0.05, -s * 0.35, -s * 0.35, 0, -s * 0.9); g.stroke()
    g.beginPath(); g.arc(-s * 0.18, s * 0.4, s * 0.25, Math.PI * 0.6, Math.PI * 1.1); g.stroke()
  } else if (art === 'wind') {
    for (const [y0, l, r] of [[-s * 0.4, 0.8, 0.28], [0, 1, 0.22], [s * 0.4, 0.6, 0.2]]) { g.beginPath(); g.moveTo(-s * 0.9, y0); g.lineTo(-s * 0.9 + s * 1.5 * l, y0); g.arc(-s * 0.9 + s * 1.5 * l, y0 - s * r, s * r, Math.PI / 2, -Math.PI * 0.9, true); g.stroke() }
  } else if (art === 'boe') {
    for (const [y0, l] of [[-s * 0.35, 1], [s * 0.05, 0.7]]) { g.beginPath(); g.moveTo(-s * 0.9, y0); g.lineTo(-s * 0.9 + s * 1.5 * l, y0); g.stroke() }
    g.beginPath(); g.moveTo(s * 0.25, s * 0.15); g.lineTo(s * 0.75, s * 0.45); g.lineTo(s * 0.25, s * 0.75); g.stroke()
    g.beginPath(); g.moveTo(-s * 0.9, s * 0.45); g.lineTo(s * 0.7, s * 0.45); g.stroke()
  } else if (art === 'druck') {
    g.arc(0, s * 0.2, s * 0.85, Math.PI * 0.85, Math.PI * 2.15); g.stroke()
    for (let i = 0; i <= 6; i++) { const w = Math.PI * 0.85 + (i / 6) * Math.PI * 1.3; g.beginPath(); g.moveTo(Math.cos(w) * s * 0.6, s * 0.2 + Math.sin(w) * s * 0.6); g.lineTo(Math.cos(w) * s * 0.75, s * 0.2 + Math.sin(w) * s * 0.75); g.stroke() }
    g.beginPath(); g.moveTo(0, s * 0.2); g.lineTo(s * 0.35, -s * 0.3); g.stroke(); g.beginPath(); g.arc(0, s * 0.2, s * 0.08, 0, Math.PI * 2); g.fill()
  } else if (art === 'regen') {
    g.moveTo(-s * 0.75, s * 0.05); g.bezierCurveTo(-s * 1.05, s * 0.05, -s * 1.0, -s * 0.5, -s * 0.55, -s * 0.45); g.bezierCurveTo(-s * 0.45, -s * 0.95, s * 0.35, -s * 0.95, s * 0.4, -s * 0.5); g.bezierCurveTo(s * 0.95, -s * 0.55, s * 1.0, s * 0.05, s * 0.65, s * 0.05); g.closePath(); g.stroke()
    for (const dx of [-0.45, 0, 0.45]) { g.beginPath(); g.moveTo(s * dx, s * 0.3); g.lineTo(s * (dx - 0.12), s * 0.75); g.stroke() }
  }
  g.restore()
}

const himmel = (w) => wetterArt(w?.code, istNacht(w))
export const WETTER_ENTWURF = {
  /** A · Kacheln: sechs gleich große Felder, je Symbol oben, Wert groß darunter */
  a(g, b, h, w) {
    kopf(g, b, w)
    const st = w.station ?? {}, felder = [['thermo', `${z(w.grad, 1)}°`, 'TEMPERATUR', HELL], ['tropfen', `${z(st.feuchte)} %`, 'FEUCHTE', CYAN], ['wind', z(st.wind, 1), 'WIND KM/H', CYAN], ['boe', z(st.boe, 1), 'BÖEN KM/H', CYAN], ['regen', z(st.regenHeute, 1), 'REGEN MM HEUTE', CYAN], ['druck', z(st.druck), 'DRUCK HPA', CYAN]]
    const sp = 2, zl = 3, kb = (b - 28 - 10) / sp, kh = (h - 42 - 2 * 8) / zl
    felder.forEach(([art, wert, name, f], i) => {
      const x = 14 + (i % sp) * (kb + 10), y = 38 + Math.floor(i / sp) * (kh + 8)
      g.fillStyle = 'rgba(95,246,255,0.04)'; g.fillRect(x, y, kb, kh); g.strokeStyle = LINIE; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, kb - 1, kh - 1)
      symbolW(g, art, x + 32, y + kh / 2, 40, f)
      text(g, wert, x + 64, y + kh / 2 + 10, 30, f); text(g, name, x + 64, y + kh / 2 - 18, 10, BLASS)
    })
  },
  /** B · Temperatur groß oben mit Himmel, darunter eine Reihe mit vier Symbol-Werten */
  b(g, b, h, w, t = 0) {
    kopf(g, b, w)
    const st = w.station ?? {}, [art, wort] = himmel(w)
    // Himmel-Symbol leicht bewegt (Wunsch Auftraggeber 05.11.2026: überall etwas Animation, minimalistisch)
    g.save(); g.strokeStyle = GOLD; g.lineWidth = 2.4; g.shadowColor = GOLD; g.shadowBlur = 8; g.translate(70, 120)
    if (art === 'sonne') g.rotate(t * 0.15); else g.translate(Math.sin(t * 0.6) * 3, Math.sin(t * 0.9) * 1.5)
    wetterSymbol(g, art, 90); g.restore()
    if (art === 'regen' || art === 'schnee' || art === 'gewitter') { // fallende Tropfen bzw. Flocken unter dem Symbol
      g.save(); g.strokeStyle = CYAN; g.fillStyle = CYAN; g.lineWidth = 1.6; g.lineCap = 'round'
      for (let i = 0; i < 7; i++) { const f = (t * 0.9 + i / 7) % 1, x = 40 + i * 9 - f * 6, y = 150 + f * 40; g.globalAlpha = 1 - f
        if (art === 'schnee') { g.beginPath(); g.arc(x, y, 1.8, 0, Math.PI * 2); g.fill() } else { g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + 7); g.stroke() } }
      g.restore()
    }
    text(g, `${z(w.grad, 1)}°`, 140, 150, 72, HELL, 'left', 300); text(g, wort, 144, 176, 15, GOLD)
    if (st.gefuehlt != null) text(g, `GEFÜHLT ${z(st.gefuehlt, 1)}°`, b - 16, 176, 11, BLASS, 'right')
    g.strokeStyle = LINIE; g.beginPath(); g.moveTo(14, 202.5); g.lineTo(b - 14, 202.5); g.stroke()
    const reihe = [['tropfen', `${z(st.feuchte)}`, '%'], ['wind', z(st.wind, 1), 'km/h'], ['boe', z(st.boe, 1), 'Böen'], ['regen', z(st.regenHeute, 1), 'mm']]
    const sb = (b - 28) / reihe.length
    reihe.forEach(([a, v, e], i) => {
      const x = 14 + sb * (i + 0.5), wind = Math.min(1, (Number(st.wind) || 0) / 30)
      // kleine Bewegung je Symbol: Tropfen wippt, Wind und Böen ziehen (schneller bei mehr Wind), Regen fällt
      const dx = a === 'wind' ? Math.sin(t * (1.5 + 4 * wind)) * 3 : a === 'boe' ? Math.max(0, Math.sin(t * 2.2)) * 5 : 0
      const dy = a === 'tropfen' ? Math.sin(t * 1.8) * 2 : 0
      symbolW(g, a, x + dx, 250 + dy, 40, CYAN)
      if (a === 'regen' && (Number(st.regenRate) || 0) > 0) { g.save(); g.strokeStyle = CYAN; g.lineWidth = 1.4; for (let k = 0; k < 3; k++) { const f = (t * 1.2 + k / 3) % 1; g.globalAlpha = 1 - f; g.beginPath(); g.moveTo(x - 9 + k * 9, 262 + f * 14); g.lineTo(x - 11 + k * 9, 268 + f * 14); g.stroke() } g.restore() }
      text(g, v, x, 312, 28, HELL, 'center'); text(g, e, x, 332, 11, BLASS, 'center')
    })
    text(g, `LUFTDRUCK ${z(st.druck)} HPA`, b / 2, h - 16, 12, BLASS, 'center')
  },
  /** C · Windrose links (Richtung als Pfeil, Stärke in der Mitte), rechts Temperatur und Feuchte groß */
  c(g, b, h, w) {
    kopf(g, b, w)
    const st = w.station ?? {}, cx = b * 0.3, cy = 34 + (h - 34) / 2 + 8, r = Math.min(b * 0.25, (h - 70) / 2)
    g.strokeStyle = 'rgba(95,246,255,0.35)'; g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke()
    for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2, l = i % 9 === 0 ? 10 : 4; g.beginPath(); g.moveTo(cx + Math.sin(a) * r, cy - Math.cos(a) * r); g.lineTo(cx + Math.sin(a) * (r - l), cy - Math.cos(a) * (r - l)); g.stroke() }
    for (const [i, n] of ['N', 'O', 'S', 'W'].entries()) { const a = (i / 4) * Math.PI * 2; text(g, n, cx + Math.sin(a) * (r - 20), cy - Math.cos(a) * (r - 20) + 5, 12, BLASS, 'center') }
    if (st.richtung != null) { const a = (st.richtung * Math.PI) / 180; g.save(); g.translate(cx, cy); g.rotate(a); g.fillStyle = GOLD; g.shadowColor = GOLD; g.shadowBlur = 8; g.beginPath(); g.moveTo(0, -r + 6); g.lineTo(9, -r + 26); g.lineTo(-9, -r + 26); g.closePath(); g.fill(); g.restore() }
    text(g, z(st.wind, 1), cx, cy + 6, 30, HELL, 'center'); text(g, `KM/H ${richtung(st.richtung)}`, cx, cy + 26, 11, BLASS, 'center')
    text(g, `BÖEN ${z(st.boe, 1)}`, cx, cy + r + 22, 12, CYAN, 'center')
    const x2 = b * 0.62
    symbolW(g, 'thermo', x2, 110, 50, HELL); text(g, `${z(w.grad, 1)}°`, x2 + 34, 128, 46, HELL, 'left', 300)
    symbolW(g, 'tropfen', x2, 210, 44, CYAN); text(g, `${z(st.feuchte)} %`, x2 + 34, 226, 34, CYAN)
    symbolW(g, 'regen', x2, 300, 40, CYAN); text(g, `${z(st.regenHeute, 1)} mm`, x2 + 34, 314, 28, CYAN)
  },
  /** D · Liste: fünf Zeilen, großes Symbol links, großer Wert rechtsbündig */
  d(g, b, h, w) {
    kopf(g, b, w)
    const st = w.station ?? {}, zeilen = [['thermo', 'TEMPERATUR', `${z(w.grad, 1)} °C`, HELL], ['tropfen', 'LUFTFEUCHTE', `${z(st.feuchte)} %`, CYAN], ['wind', `WIND ${richtung(st.richtung)}`, `${z(st.wind, 1)} km/h`, CYAN], ['boe', 'BÖEN', `${z(st.boe, 1)} km/h`, CYAN], ['regen', 'REGEN HEUTE', `${z(st.regenHeute, 1)} mm`, CYAN]]
    const zh = (h - 44) / zeilen.length
    zeilen.forEach(([a, n, v, f], i) => {
      const y = 40 + i * zh + zh / 2
      symbolW(g, a, 40, y, Math.min(40, zh * 0.62), f); text(g, n, 78, y + 6, 13, BLASS); text(g, v, b - 16, y + 11, 30, f, 'right')
      if (i) { g.strokeStyle = LINIE; g.lineWidth = 1; g.beginPath(); g.moveTo(14, Math.round(y - zh / 2) + 0.5); g.lineTo(b - 14, Math.round(y - zh / 2) + 0.5); g.stroke() }
    })
  },
}
export const BEISPIEL_WETTER = { ort: 'Obersontheim', grad: 3.1, code: 2, station: { grad: 3.1, gefuehlt: 1.4, feuchte: 90, wind: 7.2, boe: 12.6, richtung: 245, druck: 1012, regenHeute: 0.4 } }
