// Acht grundverschiedene Aufbauten fürs PV-Feld (05.11.2026, Rückmeldung Auftraggeber: Symbole wirkten „reingewürfelt“,
// es fehlt eine klare Struktur). Jeder Entwurf ordnet Sonne, Haus, Akku, Netz und Auto nach einem anderen Prinzip.
import { symbol } from './pv-entwuerfe.js'
import { auto } from './pv-symbole.js'
const GRUEN = '#5dff8a', CYAN = '#5ff6ff', ROT = '#ff4a3a', HELL = '#e8fdff', BLASS = 'rgba(165,230,240,0.62)', GRAU = 'rgba(165,230,240,0.35)', MAST = 'rgba(205,225,232,0.85)', LINIE = 'rgba(95,246,255,0.22)'
const SCHRIFT = 'Bahnschrift, "Segoe UI", Arial, sans-serif'
const kw = (w) => (w == null ? '–' : Math.abs(w) >= 1000 ? `${(Math.abs(w) / 1000).toFixed(1).replace('.', ',')} kW` : `${Math.round(Math.abs(w))} W`)
function text(g, t, x, y, gr, farbe = HELL, ausr = 'left', gew = 600) { g.font = `${gew} ${gr}px ${SCHRIFT}`; g.fillStyle = farbe; g.textAlign = ausr; g.fillText(t, x, y) }
const aut = (d) => (d.hausW > 0 ? Math.round(Math.max(0, Math.min(1, 1 - Math.max(0, d.netzW) / d.hausW)) * 100) : 100)
const netzF = (w) => (w > 20 ? ROT : GRUEN), akkuT = (w) => (w < -20 ? 'LÄDT' : w > 20 ? 'ENTLÄDT' : 'RUHT'), netzT = (w) => (w > 20 ? 'BEZUG' : w < -20 ? 'VERKAUF' : '±0')
function kopf(g, b, d) {
  text(g, 'ENERGIE · PV-ANLAGE', 14, 24, 14, CYAN); text(g, `AUTARKIE ${aut(d)} %`, b - 14, 24, 14, GRUEN, 'right')
  g.strokeStyle = 'rgba(95,246,255,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(14, 32.5); g.lineTo(b - 14, 32.5); g.stroke()
}
function punkte(g, pfad, w, farbe, t = 0.3) { // Lichtpunkte entlang eines Polygonzugs
  if (Math.abs(w) < 20) return
  const l = []; let s = 0; for (let i = 1; i < pfad.length; i++) { const d = Math.hypot(pfad[i][0] - pfad[i - 1][0], pfad[i][1] - pfad[i - 1][1]); l.push(d); s += d }
  const n = Math.max(3, Math.round(s / 40))
  for (let k = 0; k < n; k++) {
    let f = ((t * 0.5 + k / n) % 1) * s; if (w < 0) f = s - f
    let i = 0; while (i < l.length - 1 && f > l[i]) { f -= l[i]; i++ }
    const q = f / l[i], x = pfad[i][0] + (pfad[i + 1][0] - pfad[i][0]) * q, y = pfad[i][1] + (pfad[i + 1][1] - pfad[i][1]) * q
    const v = g.createRadialGradient(x, y, 0, x, y, 6); v.addColorStop(0, farbe); v.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = v; g.fillRect(x - 6, y - 6, 12, 12)
  }
}
function zug(g, pfad, farbe = LINIE, breite = 2) { g.strokeStyle = farbe; g.lineWidth = breite; g.beginPath(); pfad.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke() }
function knoten(g, x, y, f = CYAN) { g.fillStyle = f; g.beginPath(); g.arc(x, y, 3.5, 0, Math.PI * 2); g.fill() }
function etikett(g, x, y, titel, w, farbe, zusatz = '', ausr = 'left') { text(g, titel, x, y, 11, BLASS, ausr); text(g, kw(w), x, y + 24, 22, farbe, ausr); if (zusatz) text(g, zusatz, x, y + 40, 10, farbe, ausr) }

export const STRUKTUR = {
  /** 1 Schaltplan: waagerechte Sammelschiene, alle Teilnehmer hängen mit rechtwinkligen Leiterbahnen daran */
  1(g, b, h, d) {
    kopf(g, b, d)
    const yS = 196, xs = [b * 0.12, b * 0.31, b * 0.69, b * 0.88], H = [b * 0.5, 268]
    zug(g, [[xs[0], yS], [xs[3], yS]], 'rgba(95,246,255,0.5)', 3)
    const teile = [['sonne', xs[0], 'oben', d.pvW, GRUEN, 'SONNE'], ['mast', xs[3], 'oben', d.netzW, netzF(d.netzW), 'NETZ'], ['akku', xs[1], 'unten', d.akkuW, d.akkuW < 0 ? GRUEN : CYAN, `AKKU ${d.akku} %`], ['auto', xs[2], 'unten', 0, GRAU, 'AUTO']]
    for (const [art, x, lage, w, f, n] of teile) {
      const yI = lage === 'oben' ? 92 : 318, pfad = lage === 'oben' ? [[x, yI + 30], [x, yS]] : [[x, yS], [x, yI - 30]]
      zug(g, pfad); knoten(g, x, yS); punkte(g, pfad, art === 'akku' ? -w : w, f)
      if (art === 'auto') auto(g, x, yI, 56, GRAU); else symbol(g, art, x, yI, 54, art === 'mast' ? MAST : art === 'akku' ? CYAN : GRUEN, d.akku)
      const rechtsAussen = x > b * 0.8; etikett(g, rechtsAussen ? x - 38 : x + 38, yI - 10, n, w, f, art === 'akku' ? akkuT(w) : art === 'mast' ? netzT(w) : art === 'auto' ? 'NICHT VERBUNDEN' : '', rechtsAussen ? 'right' : 'left')
    }
    zug(g, [[H[0], yS], [H[0], H[1] - 60]]); knoten(g, H[0], yS); punkte(g, [[H[0], yS], [H[0], H[1] - 60]], d.hausW, HELL)
    symbol(g, 'haus', H[0], H[1], 110, HELL); etikett(g, H[0] + 70, H[1] - 10, 'HAUS', d.hausW, HELL)
    text(g, 'SAMMELSCHIENE', xs[0], yS - 8, 9, BLASS)
  },
  /** 2 Querschnitt: großes Haus als Rahmen – Solarfläche auf dem Dach, Akku im Keller, Auto in der Garage, Netzkabel vom Mast */
  2(g, b, h, d) {
    kopf(g, b, d)
    const L = b * 0.12, R = b * 0.66, oben = 120, dach = 52, unten = h - 24, keller = h - 96, G = R + 8
    zug(g, [[L - 16, oben], [(L + R) / 2, oben - dach], [R + 16, oben]], HELL, 3); zug(g, [[L, oben], [L, unten], [R, unten], [R, oben]], HELL, 3)
    zug(g, [[L, keller], [R, keller]], 'rgba(232,253,255,0.35)', 1.5)
    { const [ax, ay, ex, ey] = [L - 16, oben, (L + R) / 2, oben - dach], n = Math.hypot(ex - ax, ey - ay), nx = (ey - ay) / n * 7, ny = -(ex - ax) / n * 7
      g.strokeStyle = GRUEN; g.lineWidth = 6; for (let i = 0; i < 5; i++) { const f0 = 0.12 + i * 0.16, f1 = f0 + 0.13; g.beginPath(); g.moveTo(ax + (ex - ax) * f0 + nx, ay + (ey - ay) * f0 + ny); g.lineTo(ax + (ex - ax) * f1 + nx, ay + (ey - ay) * f1 + ny); g.stroke() } }
    symbol(g, 'sonne', L + 10, 56, 40, GRUEN); etikett(g, L + 40, 46, 'SONNE AUF DEM DACH', d.pvW, GRUEN)
    symbol(g, 'haus', (L + R) / 2, (oben + keller) / 2 + 8, 70, 'rgba(232,253,255,0.5)'); etikett(g, (L + R) / 2 + 52, oben + 44, 'WOHNEN', d.hausW, HELL)
    symbol(g, 'akku', L + 50, (keller + unten) / 2, 40, CYAN, d.akku); etikett(g, L + 80, keller + 22, `KELLER · AKKU ${d.akku} %`, d.akkuW, CYAN, akkuT(d.akkuW))
    zug(g, [[G, unten], [G, keller - 20], [b - 24, keller - 20], [b - 24, unten]], GRAU, 2); auto(g, (G + b - 24) / 2, unten - 26, 50, GRAU); text(g, 'GARAGE · NICHT VERBUNDEN', (G + b - 24) / 2, keller - 28, 9, GRAU, 'center')
    symbol(g, 'mast', b - 44, 92, 50, MAST); const kabel = [[b - 44, 120], [b - 44, 150], [R, 150]]; zug(g, kabel); punkte(g, kabel, -d.netzW, netzF(d.netzW))
    etikett(g, b - 76, 60, 'NETZ', d.netzW, netzF(d.netzW), netzT(d.netzW), 'right')
  },
  /** 3 Säulen: jede Größe als eigene Säule (Symbol oben, Leistung als Balken, Wert unten), Haus als breite Mittelsäule */
  3(g, b, h, d) {
    kopf(g, b, d)
    const spalten = [['sonne', d.pvW, GRUEN, 'SONNE', ''], ['akku', d.akkuW, CYAN, `AKKU ${d.akku} %`, akkuT(d.akkuW)], ['haus', d.hausW, HELL, 'HAUS', ''], ['mast', d.netzW, netzF(d.netzW), 'NETZ', netzT(d.netzW)], ['auto', 0, GRAU, 'AUTO', '—']]
    const max = Math.max(1000, ...spalten.map((s) => Math.abs(s[1]))), breiten = [1, 1, 1.6, 1, 1], summe = breiten.reduce((a, c) => a + c), y0 = 112, y1 = h - 64
    let x = 18
    spalten.forEach(([art, w, f, n, z], i) => {
      const sb = ((b - 36) * breiten[i]) / summe, mx = x + sb / 2
      g.fillStyle = 'rgba(95,246,255,0.04)'; g.fillRect(x + 6, 40, sb - 12, h - 52)
      if (art === 'auto') auto(g, mx, 76, art === 'haus' ? 60 : 46, GRAU); else symbol(g, art, mx, 76, art === 'haus' ? 60 : 44, art === 'mast' ? MAST : art === 'akku' ? CYAN : f, d.akku)
      const hb = ((y1 - y0) * Math.abs(w)) / max, bb = sb * 0.36
      g.fillStyle = 'rgba(95,246,255,0.08)'; g.fillRect(mx - bb / 2, y0, bb, y1 - y0)
      const v = g.createLinearGradient(0, y1 - hb, 0, y1); v.addColorStop(0, f); v.addColorStop(1, 'rgba(0,0,0,0.1)'); g.fillStyle = v; g.fillRect(mx - bb / 2, y1 - hb, bb, hb)
      text(g, n, mx, y1 + 16, 10, BLASS, 'center'); text(g, kw(w), mx, y1 + 38, art === 'haus' ? 22 : 18, f, 'center'); if (z) text(g, z, mx, y1 + 52, 9, f, 'center')
      x += sb
    })
  },
  /** 4 Versorgungsring: Haus in der Mitte, Ring zeigt, woher der Strom fürs Haus gerade kommt (Anteile), Quellen am Ring */
  4(g, b, h, d) {
    kopf(g, b, d)
    const cx = b * 0.36, cy = 34 + (h - 34) / 2, R = 128
    const vonPv = Math.min(d.pvW, d.hausW), vonAkku = Math.max(0, d.akkuW), vonNetz = Math.max(0, d.netzW), summe = Math.max(1, vonPv + vonAkku + vonNetz)
    let w = -Math.PI / 2
    g.lineWidth = 18; g.lineCap = 'butt'
    for (const [anteil, f] of [[vonPv, GRUEN], [vonAkku, CYAN], [vonNetz, ROT]]) { const e = w + (Math.PI * 2 * anteil) / summe; if (anteil > 0) { g.strokeStyle = f; g.beginPath(); g.arc(cx, cy, R, w + 0.02, e - 0.02); g.stroke() } w = e }
    g.lineWidth = 1; g.strokeStyle = LINIE; g.beginPath(); g.arc(cx, cy, R - 18, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(cx, cy, R + 18, 0, Math.PI * 2); g.stroke()
    symbol(g, 'haus', cx, cy - 10, 110, HELL); text(g, kw(d.hausW), cx, cy + 66, 24, HELL, 'center'); text(g, 'VERBRAUCH HAUS', cx, cy + 82, 10, BLASS, 'center')
    const zeilen = [['sonne', 'SONNE', d.pvW, GRUEN, `${Math.round((vonPv / summe) * 100)} % DES VERBRAUCHS`], ['akku', `AKKU ${d.akku} %`, d.akkuW, CYAN, akkuT(d.akkuW)], ['mast', 'NETZ', d.netzW, netzF(d.netzW), netzT(d.netzW)], ['auto', 'AUTO', 0, GRAU, 'NICHT VERBUNDEN']]
    zeilen.forEach(([art, n, wv, f, z], i) => {
      const y = 76 + i * 80, x = b * 0.7
      if (art === 'auto') auto(g, x, y, 44, GRAU); else symbol(g, art, x, y, 44, art === 'mast' ? MAST : f, d.akku)
      etikett(g, x + 36, y - 12, n, wv, f, z)
    })
  },
  /** 5 Bilanz-Bänder: oben „Woher kommt der Strom?“, unten „Wohin geht er?“ – zwei Balken in Anteilen, Symbole darin */
  5(g, b, h, d) {
    kopf(g, b, d)
    const x0 = 20, x1 = b - 20, bb = x1 - x0
    const quelle = [['sonne', 'SONNE', Math.max(0, d.pvW), GRUEN], ['akku', 'AKKU', Math.max(0, d.akkuW), CYAN], ['mast', 'NETZ', Math.max(0, d.netzW), ROT]].filter((q) => q[2] > 20)
    const ziel = [['haus', 'HAUS', d.hausW, HELL], ['akku', 'AKKU LÄDT', Math.max(0, -d.akkuW), CYAN], ['mast', 'VERKAUF', Math.max(0, -d.netzW), GRUEN], ['auto', 'AUTO', 0, GRAU]].filter((q) => q[2] > 20)
    const band = (y, titel, teile) => {
      text(g, titel, x0, y - 10, 12, BLASS)
      const MIN = 150, s = Math.max(1, teile.reduce((a, c) => a + c[2], 0)), roh = teile.map((t) => (bb * t[2]) / s), klein = roh.filter((r) => r < MIN).length, gross = roh.filter((r) => r >= MIN).reduce((a, c) => a + c, 0), rest = bb - klein * MIN; let x = x0
      for (const [i, [art, n, w, f]] of teile.entries()) {
        const tb = roh[i] < MIN ? MIN : (roh[i] * rest) / Math.max(1, gross); g.fillStyle = f + '33'; g.fillRect(x + 2, y, tb - 4, 92); g.fillStyle = f; g.fillRect(x + 2, y, tb - 4, 3)
        if (tb > 80) { symbol(g, art, x + 34, y + 46, 38, art === 'mast' ? MAST : f, d.akku); text(g, n, x + 62, y + 34, 11, BLASS); text(g, kw(w), x + 62, y + 60, 20, f) }
        x += tb
      }
    }
    band(66, 'WOHER KOMMT DER STROM?', quelle); band(232, 'WOHIN GEHT ER?', ziel)
    text(g, `AKKU ${d.akku} %`, x1, h - 14, 12, CYAN, 'right')
  },
  /** 6 Kacheln: Haus als hohe Kachel links, rechts ein Raster aus Kacheln mit großem, blassem Symbol im Hintergrund */
  6(g, b, h, d) {
    kopf(g, b, d)
    const kachel = (x, y, kb, kh, art, n, w, f, z) => {
      g.fillStyle = 'rgba(95,246,255,0.05)'; g.fillRect(x, y, kb, kh); g.strokeStyle = 'rgba(95,246,255,0.2)'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, kb - 1, kh - 1)
      g.save(); g.globalAlpha = 0.28; if (art === 'auto') auto(g, x + kb * 0.72, y + kh * 0.55, kh * 0.75, f); else symbol(g, art, x + kb * 0.72, y + kh * 0.55, kh * 0.8, art === 'mast' ? MAST : f, d.akku); g.restore()
      text(g, n, x + 14, y + 22, 11, BLASS); text(g, kw(w), x + 14, y + kh - (z ? 30 : 16), Math.min(34, kh * 0.3), f); if (z) text(g, z, x + 14, y + kh - 12, 10, f)
    }
    const y0 = 44, gh = h - y0 - 12, lb = b * 0.36, rb = b - lb - 40, kb = (rb - 10) / 2, kh = (gh - 10) / 2
    kachel(14, y0, lb, gh, 'haus', 'HAUS · VERBRAUCH', d.hausW, HELL, `AUTARKIE ${aut(d)} %`)
    kachel(24 + lb, y0, kb, kh, 'sonne', 'SONNE', d.pvW, GRUEN, '')
    kachel(34 + lb + kb, y0, kb, kh, 'akku', `AKKU ${d.akku} %`, d.akkuW, CYAN, akkuT(d.akkuW))
    kachel(24 + lb, y0 + kh + 10, kb, kh, 'mast', 'NETZ', d.netzW, netzF(d.netzW), netzT(d.netzW))
    kachel(34 + lb + kb, y0 + kh + 10, kb, kh, 'auto', 'AUTO', 0, GRAU, 'NICHT VERBUNDEN')
  },
  /** 7 Drei Spalten: ERZEUGUNG | HAUS | VERBRAUCH & SPEICHER – Pfeile von links durch das Haus nach rechts */
  7(g, b, h, d) {
    kopf(g, b, d)
    const xl = b * 0.14, xm = b * 0.5, xr = b * 0.86
    for (const [x, t] of [[xl, 'ERZEUGUNG'], [xm, 'HAUS'], [xr, 'SPEICHER & ABGABE']]) text(g, t, x, 54, 11, BLASS, 'center')
    zug(g, [[b * 0.32, 44], [b * 0.32, h - 14]], 'rgba(95,246,255,0.12)', 1); zug(g, [[b * 0.68, 44], [b * 0.68, h - 14]], 'rgba(95,246,255,0.12)', 1)
    const links = [['sonne', 120, d.pvW, GRUEN, 'SONNE'], ['mast', 270, Math.max(0, d.netzW), ROT, 'NETZBEZUG']], rechts = [['akku', 100, Math.max(0, -d.akkuW), CYAN, `AKKU ${d.akku} %`], ['mast', 200, Math.max(0, -d.netzW), GRUEN, 'VERKAUF'], ['auto', 300, 0, GRAU, 'AUTO']]
    for (const [art, y, w, f, n] of links) { symbol(g, art, xl, y, 48, art === 'mast' ? MAST : f); text(g, n, xl, y + 40, 10, BLASS, 'center'); text(g, kw(w), xl, y + 60, 18, f, 'center'); const p = [[xl + 34, y], [xm - 74, 200]]; zug(g, p); punkte(g, p, w, f) }
    for (const [art, y, w, f, n] of rechts) { if (art === 'auto') auto(g, xr, y, 46, GRAU); else symbol(g, art, xr, y, 44, art === 'mast' ? MAST : f, d.akku); text(g, n, xr, y + 38, 10, BLASS, 'center'); text(g, kw(w), xr, y + 56, 16, f, 'center'); const p = [[xm + 74, 200], [xr - 34, y]]; zug(g, p); punkte(g, p, w, f) }
    symbol(g, 'haus', xm, 190, 130, HELL); text(g, kw(d.hausW), xm, 296, 26, HELL, 'center'); text(g, 'VERBRAUCH', xm, 314, 10, BLASS, 'center')
    if ((d.akkuW ?? 0) > 20) text(g, `AKKU ENTLÄDT ${kw(d.akkuW)}`, xm, h - 18, 11, CYAN, 'center')
  },
  /** 8 Waben: Haus in der großen Mittelwabe, die anderen in angrenzenden Waben; Ströme laufen über die gemeinsamen Kanten */
  8(g, b, h, d) {
    kopf(g, b, d)
    const r = 70, cx = b * 0.42, cy = 34 + (h - 34) / 2, dx = r * Math.sqrt(3), wabe = (x, y, rr, f, alpha = 0.06) => {
      g.beginPath(); for (let i = 0; i < 6; i++) { const w = Math.PI / 6 + (i * Math.PI) / 3; g.lineTo(x + rr * Math.cos(w), y + rr * Math.sin(w)) } g.closePath()
      g.fillStyle = `rgba(95,246,255,${alpha})`; g.fill(); g.strokeStyle = f; g.lineWidth = 1.5; g.stroke()
    }
    const um = [['sonne', -dx / 2 - dx * 0.0, -r * 1.5, d.pvW, GRUEN, 'SONNE'], ['mast', dx / 2, -r * 1.5, d.netzW, netzF(d.netzW), 'NETZ'], ['akku', -dx / 2, r * 1.5, d.akkuW, CYAN, `AKKU ${d.akku} %`], ['auto', dx / 2, r * 1.5, 0, GRAU, 'AUTO']]
    wabe(cx, cy, r, 'rgba(232,253,255,0.6)', 0.1)
    for (const [art, ox, oy, w, f, n] of um) {
      const x = cx + ox, y = cy + oy; wabe(x, y, r * 0.92, f === GRAU ? GRAU : f)
      const p = [[x, y], [cx, cy]]; punkte(g, [[x + (cx - x) * 0.45, y + (cy - y) * 0.45], [x + (cx - x) * 0.65, y + (cy - y) * 0.65]], art === 'akku' ? w : w, f)
      if (art === 'auto') auto(g, x, y - 8, 40, GRAU); else symbol(g, art, x, y - 10, 38, art === 'mast' ? MAST : f, d.akku)
      text(g, kw(w), x, y + 28, 15, f, 'center'); text(g, n, x, y + 42, 9, BLASS, 'center')
      void p
    }
    symbol(g, 'haus', cx, cy - 8, 66, HELL); text(g, kw(d.hausW), cx, cy + 40, 16, HELL, 'center')
    etikett(g, b * 0.78, 90, 'ERZEUGUNG', d.pvW, GRUEN); etikett(g, b * 0.78, 170, 'AKKU', d.akkuW, CYAN, akkuT(d.akkuW)); etikett(g, b * 0.78, 260, 'NETZ', d.netzW, netzF(d.netzW), netzT(d.netzW))
  },
}
