// Vier Entwürfe fürs PV-Feld (05.11.2026, Rückmeldung Auftraggeber: großes Feld kaum genutzt). Alle mit Beispielwerten.
// Farben: Sonnenstrom grün, Akku türkis, Netz rot, Haus weiß. Kennzahl „Autarkie“ = Anteil des Hausverbrauchs ohne Netz.
import { symbol } from './pv-zeichen.js'
export { symbol }
const GRUEN = '#5dff8a', CYAN = '#5ff6ff', ROT = '#ff4a3a', HELL = '#e8fdff', BLASS = 'rgba(165,230,240,0.62)', GOLD = '#f2b04a'
const SCHRIFT = 'Bahnschrift, "Segoe UI", Arial, sans-serif'
const kw = (w) => (w == null ? '–' : Math.abs(w) >= 1000 ? `${(Math.abs(w) / 1000).toFixed(1).replace('.', ',')}` : `${Math.round(Math.abs(w))}`)
const einheit = (w) => (w != null && Math.abs(w) >= 1000 ? 'kW' : 'W')
function text(g, t, x, y, gr, farbe = HELL, ausr = 'left', gew = 400) { g.font = `${gew} ${gr}px ${SCHRIFT}`; g.fillStyle = farbe; g.textAlign = ausr; g.fillText(t, x, y) }
function kopf(g, b, rechts = 'LIVE') {
  text(g, 'ENERGIE · PV-ANLAGE', 14, 24, 14, CYAN, 'left', 600); text(g, rechts, b - 14, 24, 14, GOLD, 'right', 600)
  g.strokeStyle = 'rgba(95,246,255,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(14, 32.5); g.lineTo(b - 14, 32.5); g.stroke()
}
export const BEISPIEL = { akku: 64, akkuW: -1800, netzW: -350, pvW: 4400, hausW: 2250, zustand: 0,
  verlauf: Array.from({ length: 48 }, (_, i) => { const s = Math.max(0, Math.sin(((i - 12) / 30) * Math.PI)); return { pv: 5200 * s * (0.85 + 0.15 * Math.sin(i)), haus: 900 + 700 * Math.abs(Math.sin(i * 0.37)) + (i > 34 ? 900 : 0) } }) }
const autarkie = (d) => (d.hausW > 0 ? Math.round(Math.max(0, Math.min(1, 1 - Math.max(0, d.netzW) / d.hausW)) * 100) : 100)
const zustandAkku = (w) => (w < -20 ? 'LÄDT' : w > 20 ? 'ENTLÄDT' : 'RUHT')
const zustandNetz = (w) => (w < -20 ? 'EINSPEISUNG' : w > 20 ? 'BEZUG' : '±0')

function kachel(g, x, y, b, h, titel, wert, zusatz, farbe) {
  g.fillStyle = 'rgba(95,246,255,0.05)'; g.fillRect(x, y, b, h)
  g.fillStyle = farbe; g.fillRect(x, y, 3, h)
  text(g, titel, x + 14, y + 20, 11, BLASS, 'left', 600)
  text(g, kw(wert), x + 14, y + h - 18, 30, farbe, 'left', 600)
  g.font = `600 30px ${SCHRIFT}`; const wb = g.measureText(kw(wert)).width
  text(g, einheit(wert), x + 18 + wb, y + h - 18, 14, BLASS, 'left', 600)
  text(g, zusatz, x + b - 10, y + 20, 10, farbe, 'right', 600)
}
function balken(g, x, y, b, h, anteil, farbe, segmente = 20) {
  const sb = b / segmente
  for (let i = 0; i < segmente; i++) { g.fillStyle = i / segmente < anteil ? farbe : 'rgba(95,246,255,0.08)'; g.fillRect(x + i * sb + 1, y, sb - 2, h) }
}
function kurve(g, x, y, b, h, verlauf) {
  const max = Math.max(1000, ...verlauf.flatMap((v) => [v.pv, v.haus]))
  const p = (k) => verlauf.map((v, i) => [x + (b * i) / (verlauf.length - 1), y + h - (h * v[k]) / max])
  for (const [k, farbe, fl] of [['pv', GRUEN, 'rgba(93,255,138,0.25)'], ['haus', HELL, null]]) {
    const pk = p(k)
    if (fl) { const v = g.createLinearGradient(0, y, 0, y + h); v.addColorStop(0, fl); v.addColorStop(1, 'rgba(93,255,138,0)'); g.beginPath(); g.moveTo(x, y + h); pk.forEach(([a, c]) => g.lineTo(a, c)); g.lineTo(x + b, y + h); g.fillStyle = v; g.fill() }
    g.beginPath(); pk.forEach(([a, c], i) => (i ? g.lineTo(a, c) : g.moveTo(a, c))); g.strokeStyle = farbe; g.lineWidth = 1.5; g.stroke()
  }
  g.strokeStyle = 'rgba(95,246,255,0.15)'; g.beginPath(); g.moveTo(x, y + h + 0.5); g.lineTo(x + b, y + h + 0.5); g.stroke()
  for (const [i, t] of [[0, '06'], [12, '12'], [24, '18'], [36, '24']]) text(g, t, x + (b * i) / 48, y + h + 14, 10, BLASS, 'center')
}

export const ENTWUERFE = {
  /** A Leitstand: vier große Wert-Kacheln, darunter Akku-Balken und Autarkie */
  a(g, b, h, d) {
    kopf(g, b)
    const kb = (b - 42) / 2, kh = 96
    kachel(g, 14, 44, kb, kh, 'SONNE', d.pvW, 'ERZEUGT', GRUEN)
    kachel(g, 28 + kb, 44, kb, kh, 'HAUS', d.hausW, 'VERBRAUCH', HELL)
    kachel(g, 14, 52 + kh, kb, kh, 'AKKU', d.akkuW, zustandAkku(d.akkuW), CYAN)
    kachel(g, 28 + kb, 52 + kh, kb, kh, 'NETZ', d.netzW, zustandNetz(d.netzW), d.netzW > 20 ? ROT : GRUEN)
    const y = 52 + 2 * kh + 26
    text(g, `AKKU ${d.akku} %`, 14, y, 13, CYAN, 'left', 600); balken(g, 110, y - 11, b - 124, 12, d.akku / 100, CYAN)
    text(g, `AUTARKIE ${autarkie(d)} %`, 14, y + 30, 13, GRUEN, 'left', 600); balken(g, 110, y + 19, b - 124, 12, autarkie(d) / 100, GRUEN)
    text(g, 'Anteil des Hausverbrauchs ohne Netzstrom', 14, y + 52, 10, BLASS)
  },
  /** B Energiefluss groß: breite Ströme von Sonne/Akku/Netz zum Haus, Dicke nach Leistung */
  b(g, b, h, d) {
    kopf(g, b)
    const quellen = [['SONNE', d.pvW, GRUEN, 70], ['AKKU', Math.max(0, d.akkuW), CYAN, 170], ['NETZ', Math.max(0, d.netzW), ROT, 270]]
    const ziele = [['HAUS', d.hausW, HELL, 110], ['AKKU', Math.max(0, -d.akkuW), CYAN, 210], ['NETZ', Math.max(0, -d.netzW), GRUEN, 300]]
    const x0 = 120, x1 = b - 120, max = Math.max(1000, d.pvW, d.hausW)
    let yz = { 110: 0, 210: 0, 300: 0 }
    for (const [, w, farbe, y] of quellen) {
      if (w < 20) continue
      // Sonne verteilt sich auf Haus/Akku/Netz, Akku und Netz gehen ins Haus
      const ziel = y === 70 ? ziele.filter((z) => z[1] > 20) : [ziele[0]]
      for (const [, zw, , zy] of ziel) {
        const anteil = y === 70 ? Math.min(w, zw) : w, dick = Math.max(3, (anteil / max) * 70)
        const v = g.createLinearGradient(x0, 0, x1, 0); v.addColorStop(0, farbe); v.addColorStop(1, farbe + '55')
        g.beginPath(); g.moveTo(x0, y - dick / 2); g.bezierCurveTo((x0 + x1) / 2, y - dick / 2, (x0 + x1) / 2, zy + yz[zy] - dick / 2, x1, zy + yz[zy] - dick / 2)
        g.lineTo(x1, zy + yz[zy] + dick / 2); g.bezierCurveTo((x0 + x1) / 2, zy + yz[zy] + dick / 2, (x0 + x1) / 2, y + dick / 2, x0, y + dick / 2); g.closePath()
        g.globalAlpha = 0.55; g.fillStyle = v; g.fill(); g.globalAlpha = 1; yz[zy] += 0
      }
    }
    for (const [n, w, farbe, y] of quellen) { text(g, n, 14, y - 6, 11, BLASS, 'left', 600); text(g, `${kw(w)} ${einheit(w)}`, 14, y + 16, 20, farbe, 'left', 600) }
    for (const [n, w, farbe, y] of ziele) { text(g, n, b - 14, y - 6, 11, BLASS, 'right', 600); text(g, `${kw(w)} ${einheit(w)}`, b - 14, y + 16, 20, farbe, 'right', 600) }
    text(g, `AKKU ${d.akku} % · AUTARKIE ${autarkie(d)} %`, b / 2, h - 16, 13, CYAN, 'center', 600)
  },
  /** C Ringe: großer Akku-Ring in der Mitte, drei Bogen-Anzeigen für Sonne, Haus, Netz */
  c(g, b, h, d) {
    kopf(g, b)
    const cx = b / 2, cy = 34 + (h - 34) / 2 + 6, R = Math.min(b, h) * 0.3
    g.lineCap = 'round'
    const bogen = (r, von, bis, anteil, farbe, dicke) => {
      g.strokeStyle = 'rgba(95,246,255,0.1)'; g.lineWidth = dicke; g.beginPath(); g.arc(cx, cy, r, von, bis); g.stroke()
      g.strokeStyle = farbe; g.beginPath(); g.arc(cx, cy, r, von, von + (bis - von) * Math.max(0.01, Math.min(1, anteil))); g.stroke()
    }
    bogen(R, -Math.PI / 2, Math.PI * 1.5, d.akku / 100, CYAN, 12)
    text(g, `${d.akku}%`, cx, cy + 8, 40, CYAN, 'center', 600); text(g, `AKKU · ${zustandAkku(d.akkuW)} ${kw(d.akkuW)} ${einheit(d.akkuW)}`, cx, cy + 32, 11, BLASS, 'center', 600)
    const max = Math.max(5000, d.pvW, d.hausW)
    bogen(R + 30, Math.PI * 0.8, Math.PI * 1.45, d.pvW / max, GRUEN, 8)
    bogen(R + 30, Math.PI * 1.55, Math.PI * 2.2, d.hausW / max, HELL, 8)
    bogen(R + 30, Math.PI * 0.25, Math.PI * 0.75, Math.abs(d.netzW) / max, d.netzW > 20 ? ROT : GRUEN, 8)
    text(g, 'SONNE', 18, 70, 11, BLASS, 'left', 600); text(g, `${kw(d.pvW)} ${einheit(d.pvW)}`, 18, 96, 24, GRUEN, 'left', 600)
    text(g, 'HAUS', b - 18, 70, 11, BLASS, 'right', 600); text(g, `${kw(d.hausW)} ${einheit(d.hausW)}`, b - 18, 96, 24, HELL, 'right', 600)
    text(g, `NETZ · ${zustandNetz(d.netzW)}`, cx, h - 34, 11, BLASS, 'center', 600); text(g, `${kw(d.netzW)} ${einheit(d.netzW)}`, cx, h - 12, 20, d.netzW > 20 ? ROT : GRUEN, 'center', 600)
    text(g, 'AUTARKIE', 18, h - 34, 11, BLASS, 'left', 600); text(g, `${autarkie(d)} %`, 18, h - 12, 20, GRUEN, 'left', 600)
  },
  /** D Tageskurve: oben Werte-Leiste, darunter Verlauf heute (Sonne grün, Haus weiß) */
  d(g, b, h, d) {
    kopf(g, b)
    const sp = (b - 28) / 4
    for (const [i, n, w, z, f] of [[0, 'SONNE', d.pvW, '', GRUEN], [1, 'HAUS', d.hausW, '', HELL], [2, 'AKKU', d.akkuW, `${d.akku} % · ${zustandAkku(d.akkuW)}`, CYAN], [3, 'NETZ', d.netzW, zustandNetz(d.netzW), d.netzW > 20 ? ROT : GRUEN]]) {
      const x = 14 + i * sp
      text(g, n, x, 54, 11, BLASS, 'left', 600); text(g, `${kw(w)}`, x, 86, 26, f, 'left', 600)
      g.font = `600 26px ${SCHRIFT}`; text(g, einheit(w), x + g.measureText(kw(w)).width + 4, 86, 12, BLASS, 'left', 600)
      if (z) text(g, z, x, 102, 10, f, 'left', 600)
    }
    text(g, 'HEUTE', 14, 132, 11, BLASS, 'left', 600); text(g, '■ SONNE', 70, 132, 10, GRUEN, 'left', 600); text(g, '■ HAUS', 130, 132, 10, HELL, 'left', 600)
    text(g, `AUTARKIE ${autarkie(d)} %`, b - 14, 132, 11, GRUEN, 'right', 600)
    kurve(g, 14, 146, b - 28, h - 146 - 30, d.verlauf)
  },
}


// Symbole in die Entwürfe einsetzen
const altA = ENTWUERFE.a, altB = ENTWUERFE.b, altD = ENTWUERFE.d
ENTWUERFE.a = (g, b, h, d) => {
  altA(g, b, h, d)
  const kb = (b - 42) / 2
  symbol(g, 'sonne', 14 + kb - 30, 44 + 62, 40, GRUEN); symbol(g, 'haus', 28 + 2 * kb - 30, 44 + 62, 40, HELL)
  symbol(g, 'akku', 14 + kb - 30, 148 + 62, 40, CYAN, d.akku); symbol(g, 'mast', 28 + 2 * kb - 30, 148 + 62, 40, d.netzW > 20 ? ROT : GRUEN)
}
ENTWUERFE.b = (g, b, h, d) => {
  altB(g, b, h, d)
  symbol(g, 'sonne', 100, 70, 30, GRUEN); symbol(g, 'akku', 100, 170, 30, CYAN, d.akku); symbol(g, 'mast', 100, 270, 30, ROT)
  symbol(g, 'haus', b - 100, 110, 30, HELL); symbol(g, 'akku', b - 100, 210, 30, CYAN, d.akku); symbol(g, 'mast', b - 100, 300, 30, GRUEN)
}
/** C Symbol-Schema: große Linien-Symbole, Leitungen mit Lichtpunkten (im Programm bewegt), Werte groß daneben */
ENTWUERFE.c = (g, b, h, d) => {
  kopf(g, b)
  const P = { sonne: [b * 0.2, 112], haus: [b * 0.5, 230], akku: [b * 0.2, 330], mast: [b * 0.8, 230] }
  const leitung = (a, z, farbe, w) => {
    const [x1, y1] = P[a], [x2, y2] = P[z]
    g.strokeStyle = 'rgba(95,246,255,0.18)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke()
    if (w > 20) for (let i = 0; i < 6; i++) { const f = 0.15 + i * 0.14, x = x1 + (x2 - x1) * f, y = y1 + (y2 - y1) * f; const v = g.createRadialGradient(x, y, 0, x, y, 7); v.addColorStop(0, farbe); v.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = v; g.fillRect(x - 7, y - 7, 14, 14) }
  }
  leitung('sonne', 'haus', GRUEN, d.pvW); leitung('haus', 'akku', d.akkuW < 0 ? GRUEN : CYAN, Math.abs(d.akkuW)); leitung('haus', 'mast', d.netzW > 20 ? ROT : GRUEN, Math.abs(d.netzW))
  symbol(g, 'sonne', ...P.sonne, 64, GRUEN); symbol(g, 'haus', ...P.haus, 70, HELL); symbol(g, 'akku', ...P.akku, 62, CYAN, d.akku); symbol(g, 'mast', ...P.mast, 66, d.netzW > 20 ? ROT : GRUEN)
  const wert = (x, y, n, w, f, ausr = 'left', z = '') => { text(g, n, x, y, 11, BLASS, ausr, 600); text(g, `${kw(w)} ${einheit(w)}`, x, y + 26, 24, f, ausr, 600); if (z) text(g, z, x, y + 42, 10, f, ausr, 600) }
  wert(P.sonne[0] + 48, 98, 'SONNE', d.pvW, GRUEN)
  wert(P.haus[0], P.haus[1] + 52, 'HAUS', d.hausW, HELL, 'center')
  wert(P.akku[0] + 44, 312, `AKKU ${d.akku} %`, d.akkuW, CYAN, 'left', zustandAkku(d.akkuW))
  wert(P.mast[0], P.mast[1] + 50, 'NETZ', d.netzW, d.netzW > 20 ? ROT : GRUEN, 'center', zustandNetz(d.netzW))
  text(g, 'AUTARKIE', b - 18, 70, 11, BLASS, 'right', 600); text(g, `${autarkie(d)} %`, b - 18, 98, 26, GRUEN, 'right', 600)
}
ENTWUERFE.d = (g, b, h, d) => {
  altD(g, b, h, d)
  const sp = (b - 28) / 4
  for (const [i, art, f] of [[0, 'sonne', GRUEN], [1, 'haus', HELL], [2, 'akku', CYAN], [3, 'mast', d.netzW > 20 ? ROT : GRUEN]]) symbol(g, art, 14 + i * sp + sp - 30, 66, 30, f, d.akku)
}
