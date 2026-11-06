// Vier Vorschläge fürs PV-Feld (05.11.2026, Wunsch Auftraggeber): große, auf einen Blick lesbare Werte, nicht vollgeklatscht;
// Erzeugung und Speicher/Verkauf groß, Haus und Auto als ein Verbrauchsbereich. A = aktueller Stand (Drei Spalten).
import { symbol, auto } from './pv-zeichen.js'
import { tagAufPuffer } from './pv-tag.js'
const GR = '#5dff8a', CYAN = '#5ff6ff', ROT = '#ff4a3a', HELL = '#e8fdff', BLASS = 'rgba(165,230,240,0.62)', AUS = 'rgba(165,230,240,0.35)', MAST = 'rgba(205,225,232,0.85)', LINIE = 'rgba(95,246,255,0.14)'
const SCHRIFT = 'Bahnschrift, "Segoe UI", Arial, sans-serif'
function text(g, t, x, y, gr, farbe = HELL, ausr = 'left', gew = 600) { g.font = `${gew} ${gr}px ${SCHRIFT}`; g.fillStyle = farbe; g.textAlign = ausr; g.fillText(t, x, y) }
const kw = (w) => (w == null ? '–' : Math.abs(w) >= 1000 ? `${(Math.abs(w) / 1000).toFixed(1).replace('.', ',')} kW` : `${Math.round(Math.abs(w))} W`)
function kopf(g, b, pv) { text(g, 'ENERGIE · PV-ANLAGE', 28, 22, 13, CYAN); text(g, 'LIVE', b - 14, 22, 12, '#f2b04a', 'right'); g.strokeStyle = 'rgba(95,246,255,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(14, 30.5); g.lineTo(b - 14, 30.5); g.stroke() }
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
  /** D · Große Zahlen oben (Wahl Auftraggeber 05.11.2026), darunter die „Verkabelung“ – Varianten 1–4 (unten) */
  d(g, b, h, pv, t, unten = 1, mitKopf = true) {
    if (mitKopf) kopf(g, b, pv)
    const w = werte(pv ?? {}), kwz = (x) => (pv ? kw(x) : '–') // ohne Verbindung Striche statt 0 W
    const spalten = [['sonne', 'ERZEUGUNG', w.pv, GR, ''], ['haus', 'HAUS', w.haus, HELL, ''], ['akku', w.soc != null ? `AKKU ${Math.round(w.soc)} %` : 'AKKU', w.akku, w.soc != null && w.soc < 15 ? ROT : CYAN, w.laedt ? 'LÄDT' : w.entlaedt ? 'ENTLÄDT' : ''], ['mast', w.bezug > 20 ? 'NETZBEZUG' : 'VERKAUF', w.bezug > 20 ? w.bezug : w.verkauf, w.bezug > 20 ? ROT : w.verkauf > 20 ? GR : AUS, '']]
    const sb = (b - 28) / 4, xs = spalten.map((_, i) => 14 + sb * (i + 0.5))
    if (unten === 3) { // zusammengerückt, unten der Tagesverlauf (Wahl Auftraggeber 06.11.2026: Entwurf D)
      spalten.forEach(([art, name, wert, farbe, zusatz], i) => {
        const x = xs[i]
        symbol(g, art, x, 74, 52, art === 'mast' ? MAST : farbe, w.soc ?? 0, 0.16)
        text(g, kwz(wert), x, 136, 30, farbe, 'center'); text(g, name, x, 153, 12, BLASS, 'center'); if (zusatz) text(g, zusatz, x, 167, 11, farbe, 'center')
        if (i) { g.strokeStyle = LINIE; g.beginPath(); g.moveTo(Math.round(14 + sb * i) + 0.5, 44); g.lineTo(Math.round(14 + sb * i) + 0.5, 170); g.stroke() }
      })
      const k = [b / 2, 196]
      g.strokeStyle = 'rgba(95,246,255,0.5)'; g.lineWidth = 1.4; g.beginPath(); g.arc(k[0], k[1], 11, 0, Math.PI * 2); g.stroke()
      punkte(g, [xs[0], 174], k, w.pv, GR, t); punkte(g, k, [xs[1], 174], w.haus, HELL, t); punkte(g, k, [xs[2], 174], -w.akku, w.laedt ? GR : CYAN, t); punkte(g, [xs[3], 174], k, w.bezug - w.verkauf, w.bezug > 20 ? ROT : GR, t)
      punkte(g, [k[0] + 11, k[1]], [b - 118, k[1]], 0, AUS, t); auto(g, b - 96, k[1], 30, AUS, 0.05); text(g, 'AUTO –', b - 74, k[1] + 4, 11, AUS, 'left')
      if (pv?.tag) { g.drawImage(tagAufPuffer(b - 44, h - 236, pv.tag), 22, 224); if (pv.tag.beispiel) text(g, 'BEISPIEL', b - 24, 236, 10, '#f2b04a', 'right') }
      else if (pv) text(g, 'TAGESVERLAUF WIRD GELADEN', b / 2, 300, 12, BLASS, 'center')
      return
    }
    spalten.forEach(([art, name, wert, farbe, zusatz], i) => {
      const x = xs[i]
      symbol(g, art, x, 100, 66, art === 'mast' ? MAST : farbe, w.soc ?? 0, 0.16) // größer: Hauptfokus (Wunsch 05.11.2026)
      text(g, kwz(wert), x, 190, 36, farbe, 'center'); text(g, name, x, 212, 14, BLASS, 'center'); if (zusatz) text(g, zusatz, x, 230, 12, farbe, 'center')
      if (i) { g.strokeStyle = LINIE; g.beginPath(); g.moveTo(Math.round(14 + sb * i) + 0.5, 46); g.lineTo(Math.round(14 + sb * i) + 0.5, 236); g.stroke() }
    })
    UNTEN[unten](g, b, h, w, t, xs)
  },
}

// Verbindungen unter D. xs = Mitte der vier Spalten (Sonne, Haus, Akku, Netz); Auto hängt am Haus
const autoKlein = (g, x, y) => { auto(g, x, y, 34, AUS, 0.05); text(g, 'AUTO –', x + 26, y + 5, 11, AUS, 'left') }
const UNTEN = {
  /** 1 · Sammelschiene: waagerechte Leitung, jede Spalte hängt mit einer senkrechten Leitung daran; Auto unter dem Haus */
  1(g, b, h, w, t, xs) {
    const yS = 262
    g.strokeStyle = 'rgba(95,246,255,0.32)'; g.lineWidth = 2; g.beginPath(); g.moveTo(xs[0], yS); g.lineTo(xs[3], yS); g.stroke()
    const hoch = 206
    punkte(g, [xs[0], hoch], [xs[0], yS], w.pv, GR, t)
    punkte(g, [xs[1], yS], [xs[1], hoch], w.haus, HELL, t)
    punkte(g, [xs[2], yS], [xs[2], hoch], -w.akku, w.laedt ? GR : CYAN, t)
    punkte(g, [xs[3], hoch], [xs[3], yS], w.bezug - w.verkauf, w.bezug > 20 ? ROT : GR, t)
    // Strom auf der Schiene: von der Sonne zu den Abnehmern
    punkte(g, [xs[0], yS], [xs[3], yS], w.pv, GR, t)
    punkte(g, [xs[1], yS], [xs[1], 312], 0, AUS, t); autoKlein(g, xs[1], 326)
    for (const x of xs) { g.fillStyle = CYAN; g.beginPath(); g.arc(x, yS, 3.5, 0, Math.PI * 2); g.fill() }
    text(g, 'SAMMELSCHIENE', xs[0], yS + 18, 10, BLASS, 'left')
  },
  /** 2 · Bögen: von der Quelle im Bogen zum Ziel, je dicker und schneller, je mehr fließt */
  2(g, b, h, w, t, xs) {
    const y0 = 214, bogen = (i, j, wert, farbe, tief) => {
      const x1 = xs[i], x2 = xs[j], mx = (x1 + x2) / 2, my = y0 + tief, an = Math.abs(wert) >= 20
      g.strokeStyle = an ? farbe + '66' : 'rgba(95,246,255,0.1)'; g.lineWidth = an ? 1.5 + Math.min(3, Math.abs(wert) / 1500) : 1
      g.beginPath(); g.moveTo(x1, y0); g.quadraticCurveTo(mx, my, x2, y0); g.stroke()
      if (!an) return
      const n = Math.min(8, 2 + Math.round(Math.abs(wert) / 800)), v = 0.25 + Math.min(1, Math.abs(wert) / 4000)
      for (let k = 0; k < n; k++) { let f = ((t * v + k / n) % 1); if (wert < 0) f = 1 - f; const x = (1 - f) ** 2 * x1 + 2 * (1 - f) * f * mx + f * f * x2, y = (1 - f) ** 2 * y0 + 2 * (1 - f) * f * my + f * f * y0, r = g.createRadialGradient(x, y, 0, x, y, 6); r.addColorStop(0, farbe); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(x - 6, y - 6, 12, 12) }
    }
    bogen(0, 1, Math.min(w.pv, w.haus ?? 0), GR, 50)
    bogen(0, 2, w.laedt ? -w.akku : 0, GR, 95)
    bogen(0, 3, w.verkauf, GR, 140)
    bogen(2, 1, w.entlaedt ? w.akku : 0, CYAN, 50)
    bogen(3, 1, w.bezug, ROT, 95)
    autoKlein(g, xs[1], 340); g.strokeStyle = 'rgba(95,246,255,0.12)'; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(xs[1], y0); g.lineTo(xs[1], 322); g.stroke(); g.setLineDash([])
  },
  /** 3 · Knoten: ein Verteilerpunkt in der Mitte unten, alle Teilnehmer laufen sternförmig hinein, das Auto hängt darunter */
  3(g, b, h, w, t, xs) {
    const k = [b / 2, 338]
    g.strokeStyle = 'rgba(95,246,255,0.5)'; g.lineWidth = 1.4; g.beginPath(); g.arc(k[0], k[1], 16, 0, Math.PI * 2); g.stroke()
    text(g, 'VERTEILER', k[0], k[1] + 34, 10, BLASS, 'center')
    punkte(g, [xs[0], 244], k, w.pv, GR, t)
    punkte(g, k, [xs[1], 244], w.haus, HELL, t)
    punkte(g, k, [xs[2], 244], -w.akku, w.laedt ? GR : CYAN, t)
    punkte(g, [xs[3], 244], k, w.bezug - w.verkauf, w.bezug > 20 ? ROT : GR, t)
    const r = g.createRadialGradient(k[0], k[1], 0, k[0], k[1], 16); r.addColorStop(0, 'rgba(95,246,255,0.5)'); r.addColorStop(1, 'rgba(95,246,255,0)'); g.fillStyle = r; g.fillRect(k[0] - 16, k[1] - 16, 32, 32)
    punkte(g, [k[0] + 16, k[1]], [b - 150, k[1]], 0, AUS, t); autoKlein(g, b - 120, k[1])
  },
  /** 4 · Bilanz-Bänder: oben „woher kommt der Strom“, unten „wohin geht er“ – Anteile als Balken mit laufendem Lichtschimmer */
  4(g, b, h, w, t, xs) {
    const x0 = 24, bb = b - 48, band = (y, titel, teile) => {
      text(g, titel, x0, y - 8, 11, BLASS)
      const s = Math.max(1, teile.reduce((a, c) => a + c[1], 0)); let x = x0
      for (const [n, v, f] of teile) {
        if (v < 20) continue
        const tb = (bb * v) / s; g.fillStyle = f + '30'; g.fillRect(x + 1, y, tb - 2, 30); g.fillStyle = f; g.fillRect(x + 1, y, tb - 2, 2)
        const sx = x + ((t * 60) % tb); const r = g.createLinearGradient(sx - 30, 0, sx + 30, 0); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.5, f + '55'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(Math.max(x + 1, sx - 30), y + 2, Math.min(60, x + tb - sx + 30), 28)
        if (tb > 70) text(g, `${n} ${kw(v)}`, x + 10, y + 20, 13, f)
        x += tb
      }
    }
    band(226, 'WOHER KOMMT DER STROM?', [['SONNE', w.pv, GR], ['AKKU', w.entlaedt ? w.akku : 0, CYAN], ['NETZ', w.bezug, ROT]])
    band(296, 'WOHIN GEHT ER?', [['HAUS', w.haus ?? 0, HELL], ['AUTO', 0, AUS], ['AKKU', w.laedt ? -w.akku : 0, CYAN], ['VERKAUF', w.verkauf, GR]])
  },
}
