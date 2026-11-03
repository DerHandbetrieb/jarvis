// Standbilder für die Stilsuche (03.11.2026). Rückmeldung zu Runde 5: „80er-Jahre-Sci-Fi“, stotterig, Gitter raus, kein
// räumlicher Hintergrund. Gewünscht: Hightech, glossy, mehrere Ebenen, verschiedene Tiefenschärfen, viele kleine Striche,
// Kreise, Audiographen. Darum hier acht deutlich verschiedene Richtungen als ruhende Bilder über alle drei Bildschirme
// (5760×1080), damit der Auftraggeber zuerst die Richtung wählt und erst danach Bewegung und Ton gebaut werden.
// Alles flach (keine Perspektive). Glanz = gefüllte, halbdurchsichtige Flächen mit Verlauf und Lichthof; Tiefe = Ebenen
// mit unterschiedlicher Unschärfe. Kleine Details aus ../hud/kleinteile.js. Alle Werkstatt-Zahlen sind Beispieldaten.
import { RUNEN, LOKI, RUNEN_SCHRIFT, DATEN, zufall, rauschen } from '../hud/zeichner.js'
import { KLEIN } from '../hud/kleinteile.js'

const B = 1920, H = 1080
const RN = [...RUNEN].filter((z) => z !== 'ᛜ').join('') // ᛜ fehlt in „Segoe UI Historic“ (leeres Kästchen)
const SCHRIFT = 'Bahnschrift, "Segoe UI", sans-serif', MONO = 'Consolas, monospace'

// ---------- die acht Richtungen ----------
export const STILE = [
  { name: 'Tiefsee-Glanz', text: 'Leuchtend tiefblauer Grund, dicke glänzende Ringe, Lichtbänder, Schaltkreis-Bahnen (wie Vorbild 1).',
    grund: ['#0b2f86', '#06205e', '#020b26'], haupt: [70, 160, 255], hell: [200, 235, 255], akzent: [255, 170, 60], glas: 0.14, lichtband: 1, binaer: 1, tiefe: 0.6, aufbau: 'kacheln', schaltkreis: 1 },
  { name: 'Schwarzglas', text: 'Fast schwarz, Glasplatten mit Spiegelkante, starke Tiefenschärfe vorn und hinten, Orange als Signal (wie Vorbild 7/8).',
    grund: ['#0b1822', '#050b11', '#010204'], haupt: [80, 200, 255], hell: [220, 245, 255], akzent: [255, 110, 30], glas: 0.2, lichtband: 0.3, tiefe: 1, aufbau: 'faecher', spiegel: 1 },
  { name: 'Hologramm-Türkis', text: 'Dunkles Petrol, sehr dicht, viele kleine leuchtende Kreise und Zahlen (wie Vorbild 3).',
    grund: ['#07444a', '#032a2c', '#010d0e'], haupt: [40, 240, 225], hell: [210, 255, 250], akzent: [255, 210, 90], glas: 0.08, lichtband: 0.5, tiefe: 0.5, aufbau: 'kreise', dicht: 1 },
  { name: 'Silberlicht', text: 'Weiß und Silber auf Schwarz, edel und ruhig: frei schwebende Elemente mit Leitlinien statt Kästen (wie Vorbild 6).',
    grund: ['#1b1e24', '#0b0c10', '#020203'], haupt: [205, 215, 228], hell: [255, 255, 255], akzent: [120, 200, 255], glas: 0.07, lichtband: 0.4, tiefe: 0.7, aufbau: 'streuung' },
  { name: 'Nordlicht', text: 'Tiefblau-violett mit Polarlicht-Schleiern; aufgebaut aus hohen Glas-Säulen mit senkrechten Messbalken, mehr Runen-Ornament.',
    grund: ['#1a1060', '#0b0a38', '#03041a'], haupt: [60, 230, 210], hell: [220, 255, 245], akzent: [190, 110, 255], glas: 0.12, lichtband: 0.4, tiefe: 0.6, aufbau: 'saeulen', nordlicht: 1, ornament: 1 },
  { name: 'Asgard-Gold', text: 'Nachtblau mit Gold und Eisblau, waagerechte Bänder mit Flechtband-Trennern, wie veredeltes Metall – Wikinger-Luxus.',
    grund: ['#0d1a2e', '#070e1a', '#020408'], haupt: [110, 200, 255], hell: [230, 245, 255], akzent: [255, 190, 80], glas: 0.12, lichtband: 0.6, tiefe: 0.7, aufbau: 'band', gold: 1, ornament: 1 },
  { name: 'Milchglas', text: 'Heller, gefrostete Glasflächen mit großer Unschärfe dahinter, weiche Farben – modern wie eine Brille aus der Zukunft.',
    grund: ['#1d4a7a', '#13325a', '#0a1a33'], haupt: [150, 215, 255], hell: [255, 255, 255], akzent: [255, 150, 120], glas: 0.22, lichtband: 0.3, tiefe: 1, aufbau: 'kacheln', frost: 1 },
  { name: 'Kino-Anamorph', text: 'Schwarz, wenige gestochen scharfe Elemente, starke blaue Lichtstreifen wie im Kino.',
    grund: ['#05101c', '#02070d', '#000000'], haupt: [90, 180, 255], hell: [235, 248, 255], akzent: [255, 140, 50], glas: 0.08, lichtband: 1.6, tiefe: 0.8, aufbau: 'kreise', flare: 1, sparsam: 1 },
]

// ---------- Werkzeuge ----------
const fb = (a, al = 1) => `rgba(${a[0]},${a[1]},${a[2]},${al})`
const misch = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
const kf = (S) => ({ haupt: { r: S.haupt[0] / 255, g: S.haupt[1] / 255, b: S.haupt[2] / 255 }, akzent: { r: S.akzent[0] / 255, g: S.akzent[1] / 255, b: S.akzent[2] / 255 } })
function txt(g, s, x, y, farbe, { gr = 10, gew = 400, aus = 'left', schrift = SCHRIFT, sp = 1 } = {}) { g.font = `${gew} ${gr}px ${schrift}`; g.textAlign = aus; g.fillStyle = farbe; g.letterSpacing = `${sp}px`; g.fillText(s, x, y); g.letterSpacing = '0px' }
function leuchten(g, S, staerke, fn) { g.save(); g.shadowColor = fb(S.haupt, 0.9); g.shadowBlur = staerke; fn(); g.restore() }
function ebene(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return { c, g: c.getContext('2d') } }

// glänzendes Ringband (gefüllt, Verlauf von innen dunkel nach außen hell)
function band(g, S, x, y, r1, r2, von, bis, { al = 0.8, farbe = S.haupt, kante = 1 } = {}) {
  const v = g.createRadialGradient(x, y, r1, x, y, r2); v.addColorStop(0, fb(farbe, al * 0.15)); v.addColorStop(0.65, fb(farbe, al * 0.55)); v.addColorStop(1, fb(misch(farbe, S.hell, 0.5), al))
  g.beginPath(); g.arc(x, y, r2, von, bis); g.arc(x, y, r1, bis, von, true); g.closePath(); g.fillStyle = v; g.fill()
  if (kante) { g.strokeStyle = fb(S.hell, al * 0.7); g.lineWidth = 1; g.beginPath(); g.arc(x, y, r2, von, bis); g.stroke() }
}
function segmente(g, S, x, y, r1, r2, n, luecke, anteil = 1, opt = {}) { for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; band(g, S, x, y, r1, r2, a + luecke, a + (Math.PI * 2) / n - luecke, { ...opt, al: (opt.al ?? 0.8) * (i / n < anteil ? 1 : 0.18) }) } }
function skala(g, S, x, y, r, n, lang, al = 0.6) { g.strokeStyle = fb(S.haupt, al); g.lineWidth = 1; g.beginPath(); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, l = i % 5 ? lang : lang * 2.2; g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.lineTo(x + Math.cos(a) * (r - l), y + Math.sin(a) * (r - l)) } g.stroke() }
function bogen(g, S, x, y, r, von, bis, { al = 0.9, b = 1, farbe = S.haupt } = {}) { g.strokeStyle = fb(farbe, al); g.lineWidth = b; g.beginPath(); g.arc(x, y, r, von, bis); g.stroke() }
function hof(g, S, x, y, r, al = 0.5, farbe = S.haupt) { const v = g.createRadialGradient(x, y, 0, x, y, r); v.addColorStop(0, fb(misch(farbe, S.hell, 0.4), al)); v.addColorStop(0.3, fb(farbe, al * 0.4)); v.addColorStop(1, fb(farbe, 0)); g.fillStyle = v; g.fillRect(x - r, y - r, r * 2, r * 2) }

// Glasplatte mit abgeschrägten Ecken, Spiegelkante oben, Reiter mit Titel
function glas(g, S, x, y, w, h, titel, kennung = '') {
  const s = 14
  const pfad = () => { g.beginPath(); g.moveTo(x + s, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h - s); g.lineTo(x + w - s, y + h); g.lineTo(x, y + h); g.lineTo(x, y + s); g.closePath() }
  pfad()
  if (S.frost) { g.save(); g.clip(); g.filter = 'blur(18px)'; g.drawImage(g.canvas, x, y, w, h, x, y, w, h); g.filter = 'none'; g.restore(); pfad() }
  const v = g.createLinearGradient(x, y, x, y + h); v.addColorStop(0, fb(S.frost ? S.hell : S.haupt, S.glas * (S.frost ? 0.9 : 1.3))); v.addColorStop(1, fb(S.haupt, S.glas * 0.25)); g.fillStyle = v; g.fill()
  const sp = g.createLinearGradient(x, y, x, y + h * 0.35); sp.addColorStop(0, `rgba(255,255,255,${S.spiegel ? 0.14 : 0.07})`); sp.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sp; g.fillRect(x + 1, y + 1, w - 2, h * 0.35)
  g.strokeStyle = fb(S.haupt, 0.55); g.lineWidth = 1; pfad(); g.stroke()
  leuchten(g, S, 8, () => { g.strokeStyle = fb(S.hell, 0.95); g.lineWidth = 2; g.beginPath(); g.moveTo(x, y + s + 26); g.lineTo(x, y + s); g.lineTo(x + s, y); g.lineTo(x + s + 60, y); g.stroke() })
  if (titel) {
    g.font = `700 12px ${SCHRIFT}`; g.letterSpacing = '1.3px'; const tb = g.measureText(titel).width; g.letterSpacing = '0px'
    g.fillStyle = fb(S.haupt, 0.85); g.beginPath(); g.moveTo(x + s + 8, y - 1); g.lineTo(x + s + 34 + tb, y - 1); g.lineTo(x + s + 26 + tb, y + 18); g.lineTo(x + s + 16, y + 18); g.closePath(); g.fill()
    txt(g, titel, x + s + 20, y + 13, 'rgba(0,10,20,0.95)', { gr: 12, gew: 700, sp: 1.3 })
  }
  if (kennung) txt(g, kennung, x + w - 10, y + 14, fb(S.haupt, 0.75), { gr: 11, aus: 'right', schrift: MONO, sp: 0 })
}
// Baustein aus kleinteile.js an eine Stelle zeichnen (feine Details)
function klein(g, S, art, x, y, w, h, nr = 0) { g.save(); g.translate(x, y); g.beginPath(); g.rect(0, 0, w, h); g.clip(); KLEIN[art](g, w, h, 30, kf(S), nr); g.restore() }

// Audiograph: gespiegelte Balken mit Glanz + feine Hüllkurve
function audio(g, S, x, y, w, h, saat = 1, { balken = 2, luecke = 1 } = {}) {
  const z = zufall(saat), mitte = y + h / 2
  for (let i = 0, px = x; px < x + w; i++, px += balken + luecke) {
    const t = (px - x) / w, hoch = (0.15 + 0.85 * Math.abs(Math.sin(t * 9 + saat) * Math.sin(t * 2.3 + 1)) * (0.6 + 0.4 * z())) * h / 2
    const v = g.createLinearGradient(0, mitte - hoch, 0, mitte + hoch); v.addColorStop(0, fb(S.hell, 0.15)); v.addColorStop(0.5, fb(S.hell, 0.95)); v.addColorStop(1, fb(S.hell, 0.15))
    g.fillStyle = v; g.fillRect(px, mitte - hoch, balken, hoch * 2)
  }
  g.strokeStyle = fb(S.haupt, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(x, mitte); g.lineTo(x + w, mitte); g.stroke()
}
function spektrum(g, S, x, y, w, h, saat = 2) {
  const z = zufall(saat), n = Math.floor(w / 6)
  for (let i = 0; i < n; i++) { const v = (0.2 + 0.8 * Math.pow(1 - i / n, 0.6) * (0.5 + 0.5 * z())) * h; for (let k = 0; k < v; k += 4) { g.fillStyle = fb(k > h * 0.75 ? S.akzent : S.haupt, 0.25 + 0.7 * (k / h)); g.fillRect(x + i * 6, y + h - k - 3, 5, 3) } }
}
function flaeche(g, S, x, y, w, h, daten, max) {
  const p = daten.map((v, i) => [x + (i / (daten.length - 1)) * w, y + h - (v / max) * h])
  const v = g.createLinearGradient(0, y, 0, y + h); v.addColorStop(0, fb(S.haupt, 0.55)); v.addColorStop(1, fb(S.haupt, 0.02))
  g.beginPath(); g.moveTo(x, y + h); p.forEach(([a, b]) => g.lineTo(a, b)); g.lineTo(x + w, y + h); g.closePath(); g.fillStyle = v; g.fill()
  leuchten(g, S, 10, () => { g.strokeStyle = fb(S.hell, 1); g.lineWidth = 1.5; g.beginPath(); p.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.stroke() })
  p.forEach(([a, b], i) => { g.fillStyle = fb(i === p.length - 1 ? S.akzent : S.hell, 1); g.beginPath(); g.arc(a, b, i === p.length - 1 ? 4 : 2, 0, 7); g.fill() })
  g.strokeStyle = fb(S.haupt, 0.12); g.lineWidth = 1; for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(x, y + (k / 5) * h); g.lineTo(x + w, y + (k / 5) * h); g.stroke() }
}
// runde Anzeige mit Glanzring, Skala, Teilbögen, Zahl
function anzeige(g, S, x, y, r, wert, titel, unter = '', farbe = S.haupt) {
  hof(g, S, x, y, r * 1.5, 0.18, farbe)
  skala(g, S, x, y, r + 10, 72, 4, 0.45)
  band(g, S, x, y, r * 0.86, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * wert, { farbe, al: 0.95 })
  band(g, S, x, y, r * 0.86, r, -Math.PI / 2 + Math.PI * 2 * wert + 0.04, Math.PI * 1.5 - 0.02, { farbe, al: 0.12, kante: 0 })
  bogen(g, S, x, y, r * 0.74, 0.3, 1.9, { al: 0.6 }); bogen(g, S, x, y, r * 0.7, 3.5, 4.3, { al: 0.9, b: 2, farbe: S.akzent })
  segmente(g, S, x, y, r * 0.58, r * 0.64, 24, 0.03, 0.7, { al: 0.6, kante: 0 })
  leuchten(g, S, 14, () => txt(g, titel, x, y + r * 0.12, fb(S.hell, 1), { gr: Math.round(r * 0.36), gew: 300, aus: 'center', sp: 0 }))
  if (unter) txt(g, unter, x, y + r * 0.34, fb(S.haupt, 0.9), { gr: Math.max(11, Math.round(r * 0.09)), aus: 'center', sp: 2 })
}
function kreisReihe(g, S, x, y, w, n, r) { for (let i = 0; i < n; i++) { const cx = x + r + (i * (w - 2 * r)) / (n - 1); bogen(g, S, cx, y, r, 0, 7, { al: 0.5 }); band(g, S, cx, y, r * 0.6, r * 0.8, -1.5, -1.5 + 1 + (i * 0.7) % 5, { al: 0.9, farbe: i === 2 ? S.akzent : S.haupt }); txt(g, String(20 + i * 13), cx, y + 4, fb(S.hell, 1), { gr: Math.round(r * 0.5), aus: 'center', sp: 0 }) } }
function schaltkreis(g, S, x, y, w, h, saat = 3) {
  const z = zufall(saat)
  for (let i = 0; i < 14; i++) {
    let px = x, py = y + 8 + z() * (h - 16); const pfad = [[px, py]]
    while (px < x + w - 20) { px += 30 + z() * 90; if (z() < 0.5) py = Math.max(y + 6, Math.min(y + h - 6, py + (z() - 0.5) * 50)); pfad.push([Math.min(px, x + w - 10), py]) }
    g.strokeStyle = fb(S.haupt, 0.35 + z() * 0.4); g.lineWidth = 1.2; g.beginPath(); pfad.forEach(([a, b], k) => (k ? g.lineTo(a, b) : g.moveTo(a, b))); g.stroke()
    const [ex, ey] = pfad.at(-1); g.strokeStyle = fb(S.hell, 0.9); g.beginPath(); g.arc(ex, ey, 3.5, 0, 7); g.stroke()
    if (z() < 0.35) { const [kx, ky] = pfad[1 + Math.floor(z() * (pfad.length - 1))]; hof(g, S, kx, ky, 26, 0.8); g.fillStyle = fb(S.hell, 1); g.beginPath(); g.arc(kx, ky, 3, 0, 7); g.fill() }
  }
}
function globus(g, S, x, y, r) {
  hof(g, S, x, y, r * 1.4, 0.2)
  for (let b = -80; b <= 80; b += 6) for (let l = 0; l < 360; l += 6) {
    const la = (b * Math.PI) / 180, lo = (l * Math.PI) / 180 + 0.6, px = Math.cos(la) * Math.sin(lo), pz = Math.cos(la) * Math.cos(lo)
    if (pz < 0) continue; const land = rauschen(l * 0.05) * rauschen(b * 0.07 + 2) > 0.2
    g.fillStyle = fb(land ? S.hell : S.haupt, land ? 0.9 : 0.25); g.fillRect(x + px * r, y - Math.sin(la) * r, land ? 2 : 1, land ? 2 : 1)
  }
  bogen(g, S, x, y, r + 8, 0, 7, { al: 0.4 }); bogen(g, S, x, y, r + 16, -0.6, 0.9, { al: 0.9, b: 2 }); skala(g, S, x, y, r + 30, 120, 4, 0.35)
}
function radar(g, S, x, y, r) {
  hof(g, S, x, y, r * 1.2, 0.15)
  for (let k = 1; k <= 4; k++) bogen(g, S, x, y, (r * k) / 4, 0, 7, { al: 0.3 })
  g.strokeStyle = fb(S.haupt, 0.25); g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.moveTo(x, y - r); g.lineTo(x, y + r); g.stroke()
  const a = -0.7, v = g.createConicGradient(a - 1.2, x, y); v.addColorStop(0, fb(S.haupt, 0)); v.addColorStop(0.19, fb(S.haupt, 0.55)); v.addColorStop(0.191, fb(S.haupt, 0)); g.fillStyle = v; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill()
  leuchten(g, S, 8, () => { g.strokeStyle = fb(S.hell, 1); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke() })
  const z = zufall(9); for (let i = 0; i < 7; i++) { const w = z() * 7, d = z() * r * 0.9; g.fillStyle = fb(i === 0 ? S.akzent : S.hell, 1); g.beginPath(); g.arc(x + Math.cos(w) * d, y + Math.sin(w) * d, 3, 0, 7); g.fill() }
  skala(g, S, x, y, r + 14, 72, 5, 0.5)
}
function lichtstreifen(g, S, x, y, laenge, staerke = 1) {
  const v = g.createLinearGradient(x - laenge / 2, 0, x + laenge / 2, 0); v.addColorStop(0, fb(S.haupt, 0)); v.addColorStop(0.5, fb(S.hell, 0.85 * staerke)); v.addColorStop(1, fb(S.haupt, 0))
  g.fillStyle = v; g.fillRect(x - laenge / 2, y - 1, laenge, 2)
  g.save(); g.translate(x, y); g.scale(laenge / 60, 1); hof(g, S, 0, 0, 30, 0.35 * staerke); g.restore()
}
function ornament(g, S, x, y, w, farbe) { g.strokeStyle = fb(farbe, 0.8); g.lineWidth = 1.2; for (let i = 0; i < w; i += 28) { g.beginPath(); g.moveTo(x + i, y); g.bezierCurveTo(x + i + 7, y - 9, x + i + 21, y + 9, x + i + 28, y); g.moveTo(x + i, y); g.bezierCurveTo(x + i + 7, y + 9, x + i + 21, y - 9, x + i + 28, y); g.stroke() } }

// ---------- Hintergrund (flach, ohne Perspektive) ----------
function hintergrund(g, S) {
  const v = g.createLinearGradient(0, 0, 0, H); v.addColorStop(0, S.grund[1]); v.addColorStop(0.5, S.grund[0]); v.addColorStop(1, S.grund[2]); g.fillStyle = v; g.fillRect(0, 0, 3 * B, H)
  for (let s = 0; s < 3; s++) hof(g, S, s * B + B / 2, H / 2, s === 1 ? 900 : 700, s === 1 ? 0.22 : 0.12)
  if (S.nordlicht) for (let i = 0; i < 5; i++) { g.save(); g.filter = 'blur(40px)'; g.globalAlpha = 0.35; const vv = g.createLinearGradient(0, 0, 0, H * 0.7); vv.addColorStop(0, fb(i % 2 ? S.akzent : [60, 255, 160], 0.7)); vv.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = vv; g.beginPath(); g.moveTo(i * 1300 - 200, 0); for (let x = 0; x <= 1600; x += 80) g.lineTo(i * 1300 - 200 + x, 120 + Math.sin(x * 0.006 + i) * 120); g.lineTo(i * 1300 + 1400, 0); g.fill(); g.restore() }
  if (S.binaer) { g.font = `11px ${MONO}`; const z = zufall(4); for (let y = 380; y < 720; y += 26) for (let x = 0; x < 3 * B; x += 22) { if (z() < 0.5) { g.fillStyle = fb(S.haupt, 0.06 + z() * 0.08); g.fillText(z() < 0.5 ? '0' : '1', x, y) } } }
  // ferne, unscharfe Ringe (hinterste Ebene)
  const e = ebene(3 * B / 4, H / 4), z = zufall(11)
  for (let i = 0; i < 9; i++) { const x = z() * e.c.width, y = z() * e.c.height, r = 40 + z() * 120; e.g.strokeStyle = fb(S.haupt, 0.25); e.g.lineWidth = 3 + z() * 10; e.g.beginPath(); e.g.arc(x, y, r, z() * 6, z() * 6 + 2 + z() * 3); e.g.stroke() }
  g.save(); g.filter = `blur(${6 * S.tiefe}px)`; g.globalAlpha = 0.6; g.drawImage(e.c, 0, 0, 3 * B, H); g.restore()
  if (S.lichtband) for (const y of [H * 0.34, H * 0.66]) { const vv = g.createLinearGradient(0, y - 30, 0, y + 30); vv.addColorStop(0, fb(S.haupt, 0)); vv.addColorStop(0.5, fb(S.haupt, 0.18 * S.lichtband)); vv.addColorStop(1, fb(S.haupt, 0)); g.fillStyle = vv; g.fillRect(0, y - 30, 3 * B, 60); g.fillStyle = fb(S.hell, 0.25 * S.lichtband); g.fillRect(0, y, 3 * B, 1) }
}
// vorderste Ebene: große, unscharfe Bögen am Außenrand (Tiefenschärfe)
function vordergrund(g, S) {
  if (!S.tiefe) return
  const e = ebene(3 * B / 2, H / 2)
  for (const [x, y, r] of [[-60, 300, 420], [3 * B / 2 + 60, 240, 400]]) { band(e.g, S, x, y, r, r + 40, 0, 7, { al: 0.5 }); segmente(e.g, S, x, y, r - 70, r - 50, 30, 0.02, 1, { al: 0.4, kante: 0 }) }
  g.save(); g.filter = `blur(${10 * S.tiefe}px)`; g.globalAlpha = 0.55 * S.tiefe; g.drawImage(e.c, 0, 0, 3 * B, H); g.restore()
}

// ---------- Mitte: Runen-Schild (flach, glänzend) ----------
function schild(g, S, x, y, R) {
  hof(g, S, x, y, R * 1.9, 0.35); hof(g, S, x, y, R * 0.9, 0.35, S.hell)
  skala(g, S, x, y, R * 1.08, 180, 5, 0.55); bogen(g, S, x, y, R * 1.12, -2.5, -0.6, { al: 0.95, b: 2 }); bogen(g, S, x, y, R * 1.12, 0.6, 2.5, { al: 0.95, b: 2 })
  bogen(g, S, x, y, R * 1.16, 2.9, 3.4, { al: 1, b: 4, farbe: S.akzent })
  // Runenband
  band(g, S, x, y, R * 0.86, R, 0, 7, { al: 0.55, farbe: S.gold ? S.akzent : S.haupt })
  g.save(); g.translate(x, y); g.font = `${Math.round(R * 0.085)}px ${RUNEN_SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle'
  const n = 48; for (let i = 0; i < n; i++) { g.save(); g.rotate((i / n) * Math.PI * 2); g.fillStyle = fb(S.hell, i % 6 === 0 ? 1 : 0.75); g.fillText(RN[i % RN.length], 0, -R * 0.93); g.restore() }
  g.restore()
  if (S.ornament) for (let k = 0; k < 4; k++) { g.save(); g.translate(x, y); g.rotate(k * Math.PI / 2 + Math.PI / 4); ornament(g, S, -R * 0.2, -R * 1.25, R * 0.4, S.gold ? S.akzent : S.haupt); g.restore() }
  // zwölf Platten
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI / 2 + (i / 12) * Math.PI * 2
    band(g, S, x, y, R * 0.56, R * 0.8, a + 0.03, a + Math.PI / 6 - 0.03, { al: S.gold ? 0.75 : 0.85, farbe: S.gold && i % 2 ? S.akzent : S.haupt })
    const m = a + Math.PI / 12; leuchten(g, S, 10, () => txt(g, RN[(i * 5) % RN.length], x + Math.cos(m) * R * 0.68, y + Math.sin(m) * R * 0.68 + R * 0.04, fb(S.hell, 1), { gr: Math.round(R * 0.12), aus: 'center', schrift: RUNEN_SCHRIFT, sp: 0 }))
  }
  segmente(g, S, x, y, R * 0.46, R * 0.5, 60, 0.012, 0.8, { al: 0.7, kante: 0 })
  bogen(g, S, x, y, R * 0.42, 0, 7, { al: 0.5 }); bogen(g, S, x, y, R * 0.38, 0.4, 2.2, { al: 1, b: 3 }); bogen(g, S, x, y, R * 0.38, 3.6, 5.3, { al: 1, b: 3 })
  // Vegvisir-Speichen + Kern
  g.strokeStyle = fb(S.hell, 0.85); g.lineWidth = 1.5; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.beginPath(); g.moveTo(x + Math.cos(a) * R * 0.1, y + Math.sin(a) * R * 0.1); g.lineTo(x + Math.cos(a) * R * 0.3, y + Math.sin(a) * R * 0.3); g.stroke(); g.beginPath(); g.arc(x + Math.cos(a) * R * 0.3, y + Math.sin(a) * R * 0.3, 4, 0, 7); g.stroke() }
  hof(g, S, x, y, R * 0.35, 0.95, S.hell); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, R * 0.05, 0, 7); g.fill()
  txt(g, LOKI, x, y + R * 0.24, fb(S.hell, 0.9), { gr: Math.round(R * 0.06), aus: 'center', schrift: RUNEN_SCHRIFT, sp: 6 })
}
function mitte(g, S) {
  const ox = B, x = ox + B / 2, y = H / 2
  if (S.flare) { lichtstreifen(g, S, x, y, 3 * B, 1.4); lichtstreifen(g, S, x - 300, y - 180, 1400, 0.6) } else lichtstreifen(g, S, x, y, 2400, 0.7 * S.lichtband + 0.3)
  schild(g, S, x, y, 380)
  // Uhr oben, Stimme unten
    // Uhr links oben, Datum/Wetter rechts oben, Stimme unter dem Schild (Schild reicht von y 99 bis 981)
  leuchten(g, S, 10, () => txt(g, '07:42', ox + 60, 76, fb(S.hell, 1), { gr: 44, gew: 200, sp: 4 })); txt(g, 'ORTSZEIT', ox + 62, 96, fb(S.haupt, 0.8), { gr: 11, sp: 3 })
  txt(g, 'DIENSTAG · 03.11.', ox + B - 60, 60, fb(S.hell, 0.95), { gr: 16, aus: 'right', sp: 2 }); txt(g, 'ÖHRINGEN · 9 °C · BEWÖLKT', ox + B - 60, 82, fb(S.haupt, 0.8), { gr: 11, aus: 'right', sp: 2 })
  audio(g, S, x - 330, 996, 660, 48, 5, { balken: 2, luecke: 2 }); txt(g, 'LOKI SPRICHT', x - 350, 1026, fb(S.haupt, 0.9), { gr: 11, aus: 'right', sp: 3 })
  // vier Kennzeichen mit Leitlinien
  for (const [sx, sy, t1, t2] of [[-1, -1, 'KERN', '98,4 %'], [1, -1, 'RUNEN', '24 / 24'], [-1, 1, 'STIMME', 'BEREIT'], [1, 1, 'NETZ', 'LOKAL']]) {
    const ax = x + sx * 300, ay = y + sy * 290, bx = x + sx * 620, by = y + sy * 330
    g.strokeStyle = fb(S.haupt, 0.7); g.lineWidth = 1; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx - sx * 60, by); g.lineTo(bx, by); g.stroke(); g.fillStyle = fb(S.hell, 1); g.beginPath(); g.arc(ax, ay, 3, 0, 7); g.fill()
    txt(g, t1, bx, by - 8, fb(S.haupt, 0.9), { gr: 12, aus: sx < 0 ? 'left' : 'right', sp: 2 }); leuchten(g, S, 8, () => txt(g, t2, bx, by + 20, fb(S.hell, 1), { gr: 20, gew: 300, aus: sx < 0 ? 'left' : 'right', sp: 1 }))
  }
}

// ---------- Seiten: drei Aufbauten ----------
function links(g, S) {
  const f = kf(S)
  if (S.aufbau === 'kacheln') {
    glas(g, S, 40, 60, 540, 560, 'WERKSTATT · LAGE', 'BEISPIEL'); anzeige(g, S, 310, 330, 170, 0.62, '11', 'AUFGABEN OFFEN')
    glas(g, S, 610, 60, 600, 560, 'YGGDRASIL', 'DATENBAUM'); klein(g, S, 'baum', 625, 82, 570, 530)
    glas(g, S, 1240, 60, 640, 560, 'TO-DO', 'BEISPIEL'); klein(g, S, 'aufgaben', 1255, 82, 610, 530)
    glas(g, S, 40, 660, 1100, 200, 'STIMMKANAL', '48 kHz'); audio(g, S, 60, 690, 1060, 150, 3)
    glas(g, S, 1170, 660, 710, 200, 'SYSTEM'); kreisReihe(g, S, 1190, 760, 670, 5, 50)
    if (S.schaltkreis) schaltkreis(g, S, 40, 900, 1840, 140); else { klein(g, S, 'zahlen', 40, 900, 900, 140); klein(g, S, 'status', 980, 900, 900, 140) }
  } else if (S.aufbau === 'kreise') {
    hinweis(g, S, 40, 40)
    anzeige(g, S, 380, 400, 250, 0.62, '11', 'AUFGABEN OFFEN')
    for (const [x, y, r, w, t] of [[860, 200, 90, 0.8, '2'], [1080, 200, 90, 0.35, '1'], [860, 420, 90, 0.92, 'OK'], [1080, 420, 90, 0.5, '3']]) anzeige(g, S, x, y, r, w, t, ['NEU', 'FREIGABE', 'SELBSTTEST', 'VERKÄUFE'][Math.round(x + y) % 4])
    klein(g, S, 'baum', 1250, 60, 640, 560)
    if (S.dicht) { for (let i = 0; i < 3; i++) kreisReihe(g, S, 60, 700 + i * 70, 640, 9, 26); klein(g, S, 'aufgaben', 760, 660, 560, 380); klein(g, S, 'zahlen', 1350, 660, 530, 180); spektrum(g, S, 1350, 860, 530, 170) }
    else if (S.sparsam) { audio(g, S, 80, 800, 1760, 160, 3, { balken: 1, luecke: 3 }); txt(g, 'STIMMKANAL · 48 kHz', 80, 990, fb(S.haupt, 0.9), { gr: 12, sp: 3 }) }
    else { audio(g, S, 60, 700, 1100, 160, 3); klein(g, S, 'aufgaben', 1220, 660, 660, 380); klein(g, S, 'status', 60, 900, 1100, 140) }
  } else if (S.aufbau === 'streuung') { // frei schwebend, Leitlinien statt Kästen
    hinweis(g, S, 40, 40)
    anzeige(g, S, 400, 440, 240, 0.62, '11', 'AUFGABEN OFFEN')
    for (const [x, y, w, t, n, lx, ly] of [[880, 200, 0.8, '2', 'NEU SEIT GESTERN', 1060, 120], [980, 420, 0.35, '1', 'FREIGABE OFFEN', 1160, 360], [860, 640, 0.92, 'OK', 'SELBSTTEST NACHT', 1040, 720]]) { anzeige(g, S, x, y, 70, w, t, ''); leit(g, S, x + 72, y - 20, lx, ly, n, t) }
    klein(g, S, 'baum', 1240, 60, 520, 520); chips(g, S, 1790, 80, 9)
    klein(g, S, 'aufgaben', 60, 760, 820, 280); klein(g, S, 'zahlen', 920, 800, 820, 120); audio(g, S, 920, 950, 820, 80, 3, { balken: 1, luecke: 2 })
  } else if (S.aufbau === 'saeulen') { // hohe Glas-Säulen mit senkrechten Messbalken
    for (const [i, [n, w, z]] of [['AUFGABEN', 0.62, '11'], ['LAGER', 0.3, '4'], ['FREIGABEN', 0.15, '1']].entries()) saeule(g, S, 40 + i * 200, 60, 170, 980, n, w, z, RN[(i * 7) % RN.length])
    glas(g, S, 640, 60, 600, 640, 'YGGDRASIL', 'DATENBAUM'); klein(g, S, 'baum', 655, 84, 570, 610)
    glas(g, S, 640, 740, 600, 300, 'SYSTEM'); kreisReihe(g, S, 660, 830, 560, 5, 42); kreisReihe(g, S, 660, 960, 560, 5, 42)
    glas(g, S, 1280, 60, 600, 640, 'TO-DO', 'BEISPIEL'); klein(g, S, 'aufgaben', 1295, 84, 570, 610)
    glas(g, S, 1280, 740, 600, 300, 'STIMMKANAL'); spektrum(g, S, 1300, 790, 560, 230)
  } else if (S.aufbau === 'band') { // waagerechte Bänder mit Flechtband-Trennern
    glas(g, S, 40, 50, 1840, 170, 'WERKSTATT · LAGE', 'BEISPIEL'); leuchten(g, S, 16, () => txt(g, '11', 70, 190, fb(S.hell, 1), { gr: 120, gew: 200, sp: 0 })); txt(g, 'AUFGABEN OFFEN', 220, 120, fb(S.hell, 0.9), { gr: 14, sp: 3 }); klein(g, S, 'status', 520, 75, 640, 140); klein(g, S, 'segmentBalken', 1200, 75, 660, 140, 1)
    ornament(g, S, 40, 245, 1840, S.akzent)
    glas(g, S, 40, 270, 600, 300, 'YGGDRASIL'); klein(g, S, 'baum', 55, 292, 570, 270)
    glas(g, S, 680, 270, 1200, 300, 'TO-DO', 'BEISPIEL'); klein(g, S, 'aufgaben', 695, 292, 1170, 270)
    ornament(g, S, 40, 595, 1840, S.akzent)
    glas(g, S, 40, 620, 1840, 190, 'STIMMKANAL', '48 kHz'); audio(g, S, 60, 650, 1800, 150, 3)
    ornament(g, S, 40, 835, 1840, S.akzent)
    kreisReihe(g, S, 60, 940, 1800, 12, 46)
  } else { // fächer: Diagnose-Fächer, konzentrisch um den Schild in der Mitte
    faecher(g, S, 2 * B + B / 2 - B, 1)
    glas(g, S, 40, 30, 1840, 140, 'WERKSTATT · LAGE', 'BEISPIEL'); klein(g, S, 'status', 55, 52, 880, 110); klein(g, S, 'segmentBalken', 960, 52, 900, 110, 1)
    klein(g, S, 'baum', 40, 200, 560, 660); if (S.ornament) ornament(g, S, 60, 880, 520, S.akzent)
    glas(g, S, 630, 200, 560, 660, 'TO-DO', 'BEISPIEL'); klein(g, S, 'aufgaben', 645, 222, 530, 630)
    glas(g, S, 40, 910, 1840, 140, 'STIMMKANAL'); audio(g, S, 60, 935, 1800, 105, 3)
  }
}
// Leitlinie mit Beschriftung (für frei schwebende Elemente)
function leit(g, S, ax, ay, bx, by, t1, t2) {
  g.strokeStyle = fb(S.haupt, 0.7); g.lineWidth = 1; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx - 40, by); g.lineTo(bx + 160, by); g.stroke(); g.fillStyle = fb(S.hell, 1); g.beginPath(); g.arc(ax, ay, 3, 0, 7); g.fill()
  txt(g, t1, bx, by - 8, fb(S.haupt, 0.9), { gr: 12, sp: 2 }); leuchten(g, S, 8, () => txt(g, t2, bx, by + 24, fb(S.hell, 1), { gr: 20, gew: 300, sp: 1 }))
}
// Spalte kleiner Zahlenkästchen am Rand (wie Vorbild 6)
function chips(g, S, x, y, n) { for (let i = 0; i < n; i++) { const yy = y + i * 100; g.strokeStyle = fb(S.haupt, 0.6); g.lineWidth = 1; g.strokeRect(x + 0.5, yy + 0.5, 90, 56); g.fillStyle = fb(S.haupt, S.glas + 0.05); g.fillRect(x + 1, yy + 1, 89, 18); txt(g, String(11 + i * 7).padStart(3, '0'), x + 8, yy + 46, fb(S.hell, 1), { gr: 22, gew: 300, sp: 1 }); txt(g, 'K' + (i + 1), x + 84, yy + 14, fb(S.hell, 0.8), { gr: 10, aus: 'right', sp: 0 }) } }
// hohe Glas-Säule mit senkrechtem, fein unterteiltem Messbalken
function saeule(g, S, x, y, w, h, name, wert, zahl, rune) {
  glas(g, S, x, y, w, h, '', '')
  txt(g, rune, x + w / 2, y + 60, fb(S.hell, 0.95), { gr: 34, aus: 'center', schrift: RUNEN_SCHRIFT, sp: 0 }); txt(g, name, x + w / 2, y + 92, fb(S.hell, 0.9), { gr: 12, gew: 600, aus: 'center', sp: 2 })
  const top = y + 120, unten = y + h - 130, n = Math.floor((unten - top) / 7)
  for (let i = 0; i < n; i++) { const an = i / n < wert; g.fillStyle = fb(an ? (i / n > 0.8 ? S.akzent : S.hell) : S.haupt, an ? 0.85 : 0.1); g.fillRect(x + w / 2 - 30, unten - i * 7, 60, 4) }
  g.strokeStyle = fb(S.haupt, 0.5); g.lineWidth = 1; for (let i = 0; i <= 10; i++) { const yy = unten - ((unten - top) * i) / 10; g.beginPath(); g.moveTo(x + w / 2 + 38, yy); g.lineTo(x + w / 2 + (i % 5 ? 44 : 52), yy); g.stroke() }
  leuchten(g, S, 14, () => txt(g, zahl, x + w / 2, y + h - 50, fb(S.hell, 1), { gr: 44, gew: 200, aus: 'center', sp: 0 })); txt(g, 'BEISPIEL', x + w / 2, y + h - 22, fb(S.haupt, 0.8), { gr: 11, aus: 'center', sp: 2 })
}
// gut sichtbarer Hinweis für Aufbauten ohne Kästen
function hinweis(g, S, x, y) { txt(g, 'WERKSTATT · BEISPIELDATEN', x, y, fb(S.hell, 0.8), { gr: 12, gew: 600, sp: 3 }) }
// Fächer: Ringbänder mit Messbalken, Mittelpunkt = Schild; seite 1 = links (zeigt nach rechts), -1 = rechts
function faecher(g, S, cx, seite) {
  for (let k = 0; k < 6; k++) {
    const r1 = 1060 + k * 105, r2 = r1 + 80, sp = Math.asin(330 / r2), a0 = seite > 0 ? Math.PI - sp : -sp, a1 = seite > 0 ? Math.PI + sp : sp
    band(g, S, cx, H / 2, r1, r2, a0, a1, { al: k % 2 ? 0.3 : 0.55, farbe: S.gold && k === 2 ? S.akzent : S.haupt })
    for (let i = 0; i < 46; i++) { const a = a0 + (i / 46) * (a1 - a0), l = (0.25 + 0.75 * Math.abs(Math.sin(i * 0.7 + k * 1.3))) * 60; g.fillStyle = fb(i % 9 === 0 ? S.akzent : S.hell, 0.85); g.save(); g.translate(cx + Math.cos(a) * (r1 + 10), H / 2 + Math.sin(a) * (r1 + 10)); g.rotate(a); g.fillRect(0, -1.5, l, 3); g.restore() }
    txt(g, ['AUFGABEN', 'LAGER', 'SHOPS', 'VERKAUF', 'SYSTEM', 'STIMME'][k], cx + Math.cos(a1) * (r2 + 6) * 1, H / 2 + Math.sin(a1) * (r2 + 6) + 14 * seite, fb(S.hell, 0.9), { gr: 11, gew: 600, aus: 'center', sp: 2 })
  }
}
function rechts(g, S) {
  const ox = 2 * B; g.save(); g.translate(ox, 0)
  if (S.aufbau === 'kacheln') {
    glas(g, S, 40, 60, 1100, 380, 'UMSATZ · 14 TAGE', 'BEISPIEL · €'); flaeche(g, S, 70, 110, 1040, 300, DATEN.umsatz14, 160)
    glas(g, S, 1170, 60, 710, 380, 'VERKÄUFE GESTERN', 'BEISPIEL'); leuchten(g, S, 20, () => txt(g, '3', 1260, 330, fb(S.hell, 1), { gr: 230, gew: 200, sp: 0 })); txt(g, '4 ARTIKEL · 123,49 €', 1420, 200, fb(S.hell, 0.95), { gr: 18, sp: 1 }); spektrum(g, S, 1420, 240, 430, 170)
    glas(g, S, 40, 480, 1100, 380, 'SHOPS', 'BEISPIEL'); DATEN.shops.forEach(([n, a, w], i) => anzeige(g, S, 230 + i * 360, 680, 130, w, String(a), n, w < 1 ? S.akzent : S.haupt))
    glas(g, S, 1170, 480, 710, 380, 'BESTELLUNGEN · KARTE'); globus(g, S, 1525, 680, 150)
    glas(g, S, 40, 900, 900, 150, 'LAGER KNAPP', 'BEISPIEL'); klein(g, S, 'lager', 55, 920, 870, 125)
    glas(g, S, 980, 900, 900, 150, 'SYSTEM'); klein(g, S, 'status', 995, 920, 870, 125, 2)
  } else if (S.aufbau === 'kreise') {
    hinweis(g, S, 40, 40)
    DATEN.shops.forEach(([n, a, w], i) => anzeige(g, S, 240 + i * 420, 300, 170, w, String(a), n, w < 1 ? S.akzent : S.haupt))
    radar(g, S, 1560, 300, 210)
    if (S.sparsam) { flaeche(g, S, 80, 640, 1760, 300, DATEN.umsatz14, 160); txt(g, 'UMSATZ · 14 TAGE · BEISPIEL', 80, 990, fb(S.haupt, 0.9), { gr: 12, sp: 3 }) }
    else { flaeche(g, S, 60, 640, 1000, 260, DATEN.umsatz14, 160); txt(g, 'UMSATZ · 14 TAGE · BEISPIEL', 60, 930, fb(S.haupt, 0.9), { gr: 12, sp: 3 }); spektrum(g, S, 1120, 640, 760, 160); klein(g, S, 'lager', 1120, 830, 760, 200); if (S.dicht) for (let i = 0; i < 2; i++) kreisReihe(g, S, 60, 980 + i * 0, 1000, 12, 22) }
  } else if (S.aufbau === 'streuung') {
    hinweis(g, S, 40, 40)
    globus(g, S, 420, 420, 230); leit(g, S, 600, 260, 760, 140, 'BESTELLUNGEN', '3 GESTERN')
    DATEN.shops.forEach(([n, a, w], i) => { const x = 900 + i * 230, y = 330; anzeige(g, S, x, y, 80, w, String(a), '', w < 1 ? S.akzent : S.haupt); txt(g, n, x, y + 120, fb(S.hell, 0.9), { gr: 12, aus: 'center', sp: 3 }) })
    radar(g, S, 1560, 640, 140); chips(g, S, 1790, 80, 9)
    flaeche(g, S, 60, 780, 1300, 180, DATEN.umsatz14, 160); txt(g, 'UMSATZ · 14 TAGE · BEISPIEL', 60, 1000, fb(S.haupt, 0.9), { gr: 12, sp: 3 })
    klein(g, S, 'lager', 900, 520, 480, 200)
  } else if (S.aufbau === 'saeulen') {
    glas(g, S, 40, 60, 600, 460, 'UMSATZ · 14 TAGE', 'BEISPIEL'); flaeche(g, S, 60, 110, 560, 380, DATEN.umsatz14, 160)
    glas(g, S, 40, 560, 600, 480, 'VERKÄUFE GESTERN', 'BEISPIEL'); leuchten(g, S, 20, () => txt(g, '3', 90, 900, fb(S.hell, 1), { gr: 260, gew: 200, sp: 0 })); txt(g, '4 ARTIKEL', 300, 720, fb(S.hell, 0.95), { gr: 18, sp: 2 }); txt(g, '123,49 €', 300, 760, fb(S.akzent, 1), { gr: 26, sp: 1 }); spektrum(g, S, 300, 800, 320, 200)
    glas(g, S, 680, 60, 400, 980, 'SHOPS', 'BEISPIEL'); DATEN.shops.forEach(([n, a, w], i) => anzeige(g, S, 880, 240 + i * 300, 105, w, String(a), n, w < 1 ? S.akzent : S.haupt))
    for (const [i, [n, w, z]] of [['ETSY', 0.66, '2'], ['AMAZON', 0.33, '1'], ['SHOP', 0.05, '0'], ['NETZ', 0.9, 'OK']].entries()) saeule(g, S, 1120 + i * 190, 60, 160, 980, n, w, z, RN[(i * 5 + 3) % RN.length])
  } else if (S.aufbau === 'band') {
    glas(g, S, 40, 50, 1840, 330, 'UMSATZ · 14 TAGE', 'BEISPIEL · €'); flaeche(g, S, 70, 100, 1500, 250, DATEN.umsatz14, 160); leuchten(g, S, 14, () => txt(g, '123,49 €', 1850, 190, fb(S.akzent, 1), { gr: 40, gew: 300, aus: 'right', sp: 0 })); txt(g, 'GESTERN · 3 BESTELLUNGEN', 1850, 220, fb(S.hell, 0.85), { gr: 12, aus: 'right', sp: 2 })
    ornament(g, S, 40, 405, 1840, S.akzent)
    glas(g, S, 40, 430, 1840, 340, 'SHOPS', 'BEISPIEL'); DATEN.shops.forEach(([n, a, w], i) => anzeige(g, S, 220 + i * 380, 610, 120, w, String(a), n, w < 1 ? S.akzent : S.haupt)); spektrum(g, S, 1260, 480, 600, 270)
    ornament(g, S, 40, 795, 1840, S.akzent)
    glas(g, S, 40, 820, 1840, 220, 'LAGER KNAPP', 'BEISPIEL'); klein(g, S, 'lager', 55, 845, 900, 185); klein(g, S, 'status', 980, 845, 880, 185, 2)
  } else {
    faecher(g, S, -B / 2, -1)
    glas(g, S, 40, 30, 1840, 140, 'VERKÄUFE GESTERN', 'BEISPIEL'); txt(g, '3 BESTELLUNGEN · 4 ARTIKEL · 123,49 €', 760, 115, fb(S.hell, 1), { gr: 22, sp: 1 }); spektrum(g, S, 1300, 60, 560, 100)
    glas(g, S, 730, 200, 1150, 330, 'UMSATZ · 14 TAGE', 'BEISPIEL · €'); flaeche(g, S, 760, 245, 1090, 260, DATEN.umsatz14, 160)
    DATEN.shops.forEach(([n, a, w], i) => anzeige(g, S, 880 + i * 360, 720, 120, w, String(a), n, w < 1 ? S.akzent : S.haupt))
    glas(g, S, 40, 910, 1840, 140, 'LAGER KNAPP', 'BEISPIEL'); klein(g, S, 'lager', 55, 930, 900, 115); klein(g, S, 'status', 980, 930, 880, 115, 2)
  }
  g.restore()
}

export function zeichne(c, nr) {
  const S = STILE[nr], g = c.getContext('2d')
  c.width = 3 * B; c.height = H
  hintergrund(g, S)
  links(g, S); mitte(g, S); rechts(g, S)
  vordergrund(g, S)
  // Kennzeichnung am Bildrand: Beispiel
  txt(g, `STILPROBE ${nr + 1} · ${S.name.toUpperCase()} · ALLE WERKSTATT-ZAHLEN SIND BEISPIELE`, 3 * B - 30, H - 10, fb(S.hell, 0.75), { gr: 13, aus: 'right', sp: 2 })
}
