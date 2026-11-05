// Vier Vorschläge fürs PV-Feld (05.11.2026, Wunsch Auftraggeber): große, auf einen Blick lesbare Werte, nicht vollgeklatscht;
// Erzeugung und Speicher/Verkauf groß, Haus und Auto als ein Verbrauchsbereich. A = aktueller Stand (Drei Spalten).
import { symbol, auto } from './pv-zeichen.js'
const GR = '#5dff8a', CYAN = '#5ff6ff', ROT = '#ff4a3a', HELL = '#e8fdff', BLASS = 'rgba(165,230,240,0.62)', AUS = 'rgba(165,230,240,0.35)', MAST = 'rgba(205,225,232,0.85)', LINIE = 'rgba(95,246,255,0.14)'
const SCHRIFT = 'Bahnschrift, "Segoe UI", Arial, sans-serif'
function text(g, t, x, y, gr, farbe = HELL, ausr = 'left', gew = 600) { g.font = `${gew} ${gr}px ${SCHRIFT}`; g.fillStyle = farbe; g.textAlign = ausr; g.fillText(t, x, y) }
const kw = (w) => (w == null ? '–' : Math.abs(w) >= 1000 ? `${(Math.abs(w) / 1000).toFixed(1).replace('.', ',')} kW` : `${Math.round(Math.abs(w))} W`)
function kopf(g, b, pv) { text(g, 'ENERGIE · PV-ANLAGE', 14, 22, 13, CYAN); text(g, 'LIVE', b - 14, 22, 12, '#f2b04a', 'right'); g.strokeStyle = 'rgba(95,246,255,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(14, 30.5); g.lineTo(b - 14, 30.5); g.stroke() }
const werte = (pv) => { const netz = pv.netzW ?? 0, akku = pv.akkuW ?? 0; return { pv: Math.max(0, pv.pvW ?? 0), haus: pv.hausW, bezug: Math.max(0, netz), verkauf: Math.max(0, -netz), akku, soc: pv.akku, laedt: akku < -20, entlaedt: akku > 20, aut: pv.hausW > 0 ? Math.round(Math.max(0, Math.min(1, 1 - Math.max(0, netz) / pv.hausW)) * 100) : null } }
function punkte(g, [x1, y1], [x2, y2], w, farbe, t) {
  const an = Math.abs(w) >= 20; g.strokeStyle = an ? farbe + '55' : 'rgba(95,246,255,0.12)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke()
  if (!an) return
  const n = Math.min(8, 2 + Math.round(Math.abs(w) / 800)), v = 0.25 + Math.min(1.2, Math.abs(w) / 4000)
  for (let i = 0; i < n; i++) { let f = ((t * v + i / n) % 1) * 0.9 + 0.05; if (w < 0) f = 1 - f; const x = x1 + (x2 - x1) * f, y = y1 + (y2 - y1) * f, r = g.createRadialGradient(x, y, 0, x, y, 6); r.addColorStop(0, farbe); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(x - 6, y - 6, 12, 12) }
}

export const PV_VARIANTE = {
  /** B · Vier große Kacheln (Sonne, Netz, Akku, Verkauf) um einen Verbrauchsstreifen in der Mitte (Haus + Auto) */
  b(g, b, h, pv, t) {
    kopf(g, b, pv); const w = werte(pv)
    const kach = (x, y, kb, kh, art, name, wert, farbe, zusatz) => {
      g.fillStyle = 'rgba(95,246,255,0.04)'; g.fillRect(x, y, kb, kh); g.strokeStyle = LINIE; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, kb - 1, kh - 1)
      symbol(g, art, x + 40, y + kh / 2, 50, art === 'mast' ? MAST : farbe, w.soc ?? 0, 0.16)
      text(g, name, x + 80, y + kh / 2 - 12, 13, BLASS); text(g, kw(wert), x + 80, y + kh / 2 + 18, 30, farbe); if (zusatz) text(g, zusatz, x + kb - 10, y + 22, 11, farbe, 'right')
    }
    const kb = b * 0.34, kh = (h - 52) / 2, mx = 14 + kb + 12, mb = b - 2 * (kb + 26)
    kach(14, 40, kb, kh, 'sonne', 'SONNE', w.pv, GR); kach(14, 48 + kh, kb, kh, 'mast', 'NETZBEZUG', w.bezug, w.bezug > 20 ? ROT : AUS)
    kach(b - 14 - kb, 40, kb, kh, 'akku', w.soc != null ? `AKKU ${Math.round(w.soc)} %` : 'AKKU', w.akku, CYAN, w.laedt ? 'LÄDT' : w.entlaedt ? 'ENTLÄDT' : '')
    kach(b - 14 - kb, 48 + kh, kb, kh, 'mast', 'VERKAUF', w.verkauf, w.verkauf > 20 ? GR : AUS)
    const cx = mx + mb / 2
    symbol(g, 'haus', cx, 110, 58, HELL, 0, 0.04); text(g, kw(w.haus), cx, 172, 26, HELL, 'center'); text(g, 'HAUS', cx, 190, 11, BLASS, 'center')
    auto(g, cx, 250, 52, AUS, 0.06); text(g, '–', cx, 300, 24, AUS, 'center'); text(g, 'AUTO', cx, 318, 11, BLASS, 'center')
    if (w.aut != null) text(g, `AUTARKIE ${w.aut} %`, cx, h - 14, 12, GR, 'center')
  },
  /** C · Fluss von links nach rechts: Sonne/Netz → Verbrauch (Haus + Auto) → Akku/Verkauf, Werte sehr groß unter den Symbolen */
  c(g, b, h, pv, t) {
    kopf(g, b, pv); const w = werte(pv), cols = [b * 0.13, b * 0.5, b * 0.87], yo = 120, yu = 290
    const knoten = (x, y, art, name, wert, farbe, gr = 54, zusatz = '') => {
      if (art === 'auto') auto(g, x, y, gr, AUS, 0.06); else symbol(g, art, x, y, gr, art === 'mast' ? MAST : farbe, w.soc ?? 0, 0.16)
      text(g, kw(wert), x, y + gr * 0.6 + 26, 28, farbe, 'center'); text(g, name, x, y + gr * 0.6 + 44, 11, BLASS, 'center'); if (zusatz) text(g, zusatz, x, y + gr * 0.6 + 58, 10, farbe, 'center')
    }
    punkte(g, [cols[0] + 34, yo], [cols[1] - 70, yo + 8], w.pv, GR, t); punkte(g, [cols[0] + 34, yu], [cols[1] - 70, yo + 20], w.bezug, ROT, t)
    punkte(g, [cols[1] + 70, yo + 8], [cols[2] - 34, yo], -w.akku, w.laedt ? GR : CYAN, t); punkte(g, [cols[1] + 70, yo + 20], [cols[2] - 34, yu], w.verkauf, GR, t)
    knoten(cols[0], yo - 10, 'sonne', 'SONNE', w.pv, GR, 58); knoten(cols[0], yu - 10, 'mast', 'NETZBEZUG', w.bezug, w.bezug > 20 ? ROT : AUS, 52)
    knoten(cols[2], yo - 10, 'akku', w.soc != null ? `AKKU ${Math.round(w.soc)} %` : 'AKKU', w.akku, CYAN, 46, w.laedt ? 'LÄDT' : w.entlaedt ? 'ENTLÄDT' : '')
    knoten(cols[2], yu - 10, 'mast', 'VERKAUF', w.verkauf, w.verkauf > 20 ? GR : AUS, 52)
    // Verbrauch als Rahmen mit Haus und Auto
    const vx = cols[1] - 90, vb = 180; g.strokeStyle = LINIE; g.lineWidth = 1; g.strokeRect(vx + 0.5, 48.5, vb, h - 70); text(g, 'VERBRAUCH', cols[1], 66, 11, BLASS, 'center')
    knoten(cols[1], yo, 'haus', 'HAUS', w.haus, HELL, 56); knoten(cols[1], yu - 6, 'auto', 'AUTO', null, AUS, 50)
  },
  /** D · Große Zahlen oben (Erzeugung, Verbrauch, Akku, Netz), darunter eine schlichte Flusslinie mit kleinen Symbolen */
  d(g, b, h, pv, t) {
    kopf(g, b, pv); const w = werte(pv)
    const spalten = [['sonne', 'ERZEUGUNG', w.pv, GR, ''], ['haus', 'VERBRAUCH', w.haus, HELL, 'HAUS · AUTO –'], ['akku', w.soc != null ? `AKKU ${Math.round(w.soc)} %` : 'AKKU', w.akku, CYAN, w.laedt ? 'LÄDT' : w.entlaedt ? 'ENTLÄDT' : ''], ['mast', w.bezug > 20 ? 'NETZBEZUG' : 'VERKAUF', w.bezug > 20 ? w.bezug : w.verkauf, w.bezug > 20 ? ROT : w.verkauf > 20 ? GR : AUS, '']]
    const sb = (b - 28) / 4
    spalten.forEach(([art, name, wert, farbe, zusatz], i) => {
      const x = 14 + sb * (i + 0.5)
      symbol(g, art, x, 92, 54, art === 'mast' ? MAST : farbe, w.soc ?? 0, 0.16)
      text(g, kw(wert), x, 170, 32, farbe, 'center'); text(g, name, x, 192, 12, BLASS, 'center'); if (zusatz) text(g, zusatz, x, 210, 11, farbe, 'center')
      if (i) { g.strokeStyle = LINIE; g.beginPath(); g.moveTo(Math.round(14 + sb * i) + 0.5, 50); g.lineTo(Math.round(14 + sb * i) + 0.5, 220); g.stroke() }
    })
    const y = 290, xs = [14 + sb * 0.5, 14 + sb * 1.5, 14 + sb * 2.5, 14 + sb * 3.5]
    punkte(g, [xs[0], y], [xs[1], y], w.pv, GR, t); punkte(g, [xs[1], y], [xs[2], y], -w.akku, w.laedt ? GR : CYAN, t); punkte(g, [xs[1], y + 30], [xs[3], y + 30], -(w.bezug || -w.verkauf), w.bezug > 20 ? ROT : GR, t)
    text(g, 'SONNE → HAUS → AKKU', (xs[0] + xs[2]) / 2, y - 12, 10, BLASS, 'center'); text(g, 'HAUS ↔ NETZ', (xs[1] + xs[3]) / 2, y + 52, 10, BLASS, 'center')
    if (w.aut != null) text(g, `AUTARKIE ${w.aut} %`, b / 2, h - 12, 12, GR, 'center')
  },
}
