// Vier Entwürfe für den Umbau der linken Tafel (08.11.2026, Wunsch Auftraggeber: Statistik oben niedriger und als
// mehrere kleine Felder/Kuchen statt 14-Tage-Balken, Nachtrag: Audiofeld wandert nach rechts, links nur Arbeit; Bestellungen gekürzt), unten mehr Platz für Abarbeiten-Karten und
// Termine, Zeilen enger). Flach gezeichnet in der Größe der Tafel (1240 × 760 Einheiten). Werte = Beispiel nach
// echten Zahlen vom 08.11.2026 (Warenwert ohne Versand, Wahl Auftraggeber).
import { RAHMEN_STILE } from './rahmen.js'

const CYAN = '#5ff6ff', GOLD = '#f2b04a', ROT = '#ff5a4a', HELL = '#e8fdff', BLASS = 'rgba(165,230,240,0.62)'
const SCHRIFT = 'Bahnschrift, "Segoe UI", Arial, sans-serif'
const STIL = RAHMEN_STILE[1]

export const BEISPIEL = {
  heute: { wert: 19.85, bestellungen: 1 },
  tage: [83.6, 47.71, 69.89, 0, 83.6, 131.59, 50.78, 132.59, 69.68, 30.8, 62.7, 41.8, 130.69, 19.85],
  bestellTage: [4, 2, 2, 0, 1, 5, 4, 4, 3, 1, 1, 2, 4, 1],
  kanaele: [['Etsy', 558.86], ['Amazon', 323.82], ['Shop', 51.7]],
  top: [['Boulderstein-Kaffeetasse', 23, 480.7], ['Klettergriff Schlüsselanhänger', 12, 119.52], ['Schlüsselbrett Wurzelholz', 2, 119.8], ['Kerzenständer Wurzelholz', 2, 99.8], ['Klettergriff Magnete 5er', 5, 99.5]],
  offen: 7, lagerKnapp: 4, freigaben: 0,
  karten: [
    ['Schlüsselanhänger bei Amazon prüfen', 'FÄLLIG HEUTE'], ['Amazon-Problem: 5er Set Schlüsselanhänger Klettern', 'FÄLLIG HEUTE'],
    ['Tetrapod Lampe aus Beton mit Edison LED produzieren', ''], ['Kletteraffen Pocket Fingertrainer Set produzieren', ''],
    ['Recherche Kerzenteller', ''], ['Recherche Haken Schlüsselbrett', ''], ['Kerzenständer Wurzelholz für 4 Kerzen produzieren', ''],
    ['Kuh-Kucks-Uhr · Schwarz Weiß Braun produzieren', ''], ['Billbee: Lücken bei den Shop-Verknüpfungen', ''], ['Datenwächter: Widersprüche in den Produktdaten', 'DI 10.11.'],
  ],
  termine: [['MO 09.11.', '10:00', 'Termin (Beispiel)'], ['DI 10.11.', '', 'Datenwächter prüfen'], ['MI 11.11.', '', 'Produkt-Termin (Beispiel)'], ['FR 13.11.', '', 'Abholung DHL (Beispiel)']],
  bestellungen: [['06.11.', 'ETSY', 'Kaffeetasse mit Boulderstein', 20.9], ['06.11.', 'AMAZON', 'Kaffeetasse mit Boulderstein', 20.9], ['07.11.', 'ETSY', 'Boulderstein-Kaffeetasse', 20.9],
    ['07.11.', 'AMAZON', 'Klettergriff Schlüsselanhänger', 9.99], ['07.11.', 'ETSY', 'Schlüsselbrett Wurzelholz', 59.9], ['07.11.', 'SHOP', 'Klettergriff Magnete 5er', 19.9], ['08.11.', 'AMAZON', 'Boulderstein-Kaffeetasse', 19.85]],
}
const B = BEISPIEL
const euro = (v) => `${Math.round(v).toLocaleString('de-DE')} €`

function text(g, t, x, y, gr, farbe = HELL, ausr = 'left', gew = 400) {
  g.font = `${gew} ${gr}px ${SCHRIFT}`; g.fillStyle = farbe; g.textAlign = ausr; g.textBaseline = 'alphabetic'; g.fillText(t, x, y)
}
function kuerzen(g, t, breite) {
  if (g.measureText(t).width <= breite) return t
  while (t.length > 1 && g.measureText(t + '…').width > breite) t = t.slice(0, -1)
  return t + '…'
}
function kopf(g, titel, rechts, b, klein = false) {
  const gr = klein ? 12 : 14, y = klein ? 20 : 24
  text(g, titel, 22, y, gr, CYAN, 'left', 600)
  if (rechts) text(g, rechts, b - 14, y, gr, GOLD, 'right', 600)
  g.strokeStyle = 'rgba(95,246,255,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(14, y + 8.5); g.lineTo(b - 14, y + 8.5); g.stroke()
}

// ---------- Kacheln ----------
const ZEICHNER = {
  /** große Zahl: Warenwert heute */
  heute(g, b, h) {
    kopf(g, 'WARENWERT · HEUTE', '', b, true)
    const gr = Math.min(40, h * 0.34)
    text(g, euro(B.heute.wert), 22, 32 + gr, gr, HELL, 'left', 600)
    text(g, `${B.heute.bestellungen} BESTELLUNG`, 22, Math.min(h - 12, 50 + gr), 11, CYAN, 'left', 600)
  },
  /** 14 Tage als Fläche (Sparkline) + Summe */
  verlauf(g, b, h) {
    const s14 = B.tage.reduce((a, x) => a + x, 0), s7 = B.tage.slice(-7).reduce((a, x) => a + x, 0), v7 = B.tage.slice(0, 7).reduce((a, x) => a + x, 0)
    kopf(g, '14 TAGE', euro(s14), b, true)
    const pz = Math.round((s7 / v7 - 1) * 100)
    text(g, `7 TAGE ${euro(s7)}`, 22, 50, 13, HELL, 'left', 600)
    text(g, `${pz >= 0 ? '▲' : '▼'} ${Math.abs(pz)} % ZUR VORWOCHE`, b - 14, 50, 11, pz >= 0 ? CYAN : ROT, 'right', 600)
    const x0 = 22, x1 = b - 14, y0 = 60, y1 = h - 12, m = Math.max(...B.tage)
    const p = B.tage.map((u, i) => [x0 + ((x1 - x0) * i) / (B.tage.length - 1), y1 - ((y1 - y0) * u) / m])
    const v = g.createLinearGradient(0, y0, 0, y1); v.addColorStop(0, 'rgba(95,246,255,0.45)'); v.addColorStop(1, 'rgba(95,246,255,0)')
    g.beginPath(); g.moveTo(x0, y1); p.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(x1, y1); g.closePath(); g.fillStyle = v; g.fill()
    g.beginPath(); p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = CYAN; g.lineWidth = 1.4; g.stroke()
    g.fillStyle = GOLD; const [lx, ly] = p.at(-1); g.beginPath(); g.arc(lx, ly, 3, 0, Math.PI * 2); g.fill()
  },
  /** Kanäle 14 Tage als Ring */
  kanaele(g, b, h) {
    kopf(g, 'KANÄLE · 14 TAGE', '', b, true)
    const sum = B.kanaele.reduce((a, [, v]) => a + v, 0), farben = [CYAN, GOLD, '#9b8cff']
    const r = Math.min((h - 46) / 2, b * 0.2), cx = 22 + r, cy = 34 + (h - 34) / 2
    let a = -Math.PI / 2
    B.kanaele.forEach(([, v], i) => { const d = (v / sum) * Math.PI * 2; g.beginPath(); g.arc(cx, cy, r, a + 0.03, a + d - 0.03); g.strokeStyle = farben[i]; g.lineWidth = r * 0.36; g.stroke(); a += d })
    const zeile = Math.min(22, (h - 40) / B.kanaele.length)
    B.kanaele.forEach(([n, v], i) => {
      const y = cy - (zeile * (B.kanaele.length - 1)) / 2 + i * zeile + 4
      g.fillStyle = farben[i]; g.fillRect(cx + r + 16, y - 8, 8, 8)
      text(g, n.toUpperCase(), cx + r + 30, y, 11, HELL, 'left', 600); text(g, `${Math.round((v / sum) * 100)} %`, b - 14, y, 11, farben[i], 'right', 600)
    })
  },
  /** Top-Artikel 14 Tage als Balken */
  top(g, b, h) {
    const n = Math.max(3, Math.min(5, Math.floor((h - 40) / 26)))
    kopf(g, 'BESTE ARTIKEL · 14 TAGE', '', b, true)
    const liste = B.top.slice(0, n), m = liste[0][2], zeile = Math.min(28, (h - 40) / liste.length)
    liste.forEach(([name, st, w], i) => {
      const y = 40 + i * zeile
      g.fillStyle = 'rgba(95,246,255,0.14)'; g.fillRect(22, y + 2, (b - 36) * (w / m), zeile - 6)
      g.font = `400 12px ${SCHRIFT}`; text(g, kuerzen(g, name, b - 130), 28, y + zeile / 2 + 3, 12, HELL)
      text(g, `${st}× · ${euro(w)}`, b - 18, y + zeile / 2 + 3, 11, GOLD, 'right', 600)
    })
  },
  /** kleine Zählerkacheln nebeneinander */
  zaehler(g, b, h) {
    kopf(g, 'STAND', '', b, true)
    const werte = [['OFFEN', B.offen, GOLD], ['LAGER', B.lagerKnapp, ROT], ['FREIG.', B.freigaben, CYAN]], sp = (b - 28) / werte.length
    werte.forEach(([n, v, f], i) => { const x = 14 + sp * (i + 0.5); text(g, String(v), x, 34 + (h - 34) * 0.55, Math.min(32, h * 0.3), f, 'center', 600); text(g, n, x, h - 12, 10, BLASS, 'center', 600) })
  },
  /** schmale Kennzahlen-Zeile (Entwurf C) */
  kennzahlen(g, b, h) {
    const s7 = B.tage.slice(-7).reduce((a, x) => a + x, 0), s14 = B.tage.reduce((a, x) => a + x, 0), nb = B.bestellTage.reduce((a, x) => a + x, 0)
    const werte = [['HEUTE', euro(B.heute.wert)], ['7 TAGE', euro(s7)], ['14 TAGE', euro(s14)], ['Ø BESTELLUNG', euro(s14 / nb)], ['OFFEN', String(B.offen)], ['LAGER KNAPP', String(B.lagerKnapp)], ['ETSY', '60 %'], ['AMAZON', '35 %']]
    const sp = (b - 28) / werte.length
    werte.forEach(([n, v], i) => {
      const x = 14 + sp * i + sp / 2
      text(g, v, x, h * 0.52, Math.min(26, h * 0.32), i === 0 ? GOLD : HELL, 'center', 600); text(g, n, x, h * 0.52 + 20, 10, CYAN, 'center', 600)
      if (i) { g.strokeStyle = 'rgba(95,246,255,0.15)'; g.beginPath(); g.moveTo(14 + sp * i + 0.5, 16); g.lineTo(14 + sp * i + 0.5, h - 14); g.stroke() }
    })
  },
  ton(g, b, h) {
    kopf(g, 'AUDIO · PC-TON', 'BLEIBT WIE HEUTE', b)
    g.strokeStyle = CYAN; g.lineWidth = 1.4; g.beginPath()
    for (let x = 20; x < b - 20; x += 3) { const y = h / 2 + 12 + Math.sin(x * 0.05) * Math.sin(x * 0.011) * (h * 0.3); x === 20 ? g.moveTo(x, y) : g.lineTo(x, y) }
    g.stroke()
  },
  /** Abarbeiten mit engen Zeilen (22 statt 36) */
  aufgaben(g, b, h) {
    kopf(g, 'ABARBEITEN · DRINGEND ZUERST', `${B.karten.length} OFFEN`, b)
    const zeile = 23, n = Math.min(B.karten.length, Math.floor((h - 42) / zeile))
    B.karten.slice(0, n).forEach(([t, f], i) => {
      const y = 38 + i * zeile, m = y + zeile / 2
      g.strokeStyle = 'rgba(95,246,255,0.55)'; g.lineWidth = 1.1; g.strokeRect(22.5, m - 5.5, 11, 11)
      g.font = `400 13px ${SCHRIFT}`; text(g, kuerzen(g, t, b - 150), 42, m + 4.5, 13, HELL)
      if (f) text(g, f, b - 16, m + 4, 10, f.startsWith('FÄLLIG') ? GOLD : BLASS, 'right', 600)
    })
  },
  termine(g, b, h) {
    kopf(g, 'TERMINE · NÄCHSTE 14 TAGE', '', b)
    const zeile = Math.min(44, (h - 42) / B.termine.length)
    B.termine.forEach(([tag, uhr, was], i) => {
      const y = 40 + i * zeile
      g.fillStyle = i === 0 ? 'rgba(242,176,74,0.18)' : 'rgba(95,246,255,0.08)'; g.fillRect(20, y + 3, 78, zeile - 8)
      text(g, tag, 59, y + zeile / 2 + 4, 12, i === 0 ? GOLD : CYAN, 'center', 600)
      g.font = `400 13px ${SCHRIFT}`; text(g, kuerzen(g, was, b - 130 - (uhr ? 44 : 0)), 110, y + zeile / 2 + 4.5, 13, HELL)
      if (uhr) text(g, uhr, b - 16, y + zeile / 2 + 4, 12, GOLD, 'right', 600)
    })
  },
  /** Termine als Wochenleiste (Entwurf D) */
  woche(g, b, h) {
    kopf(g, 'WOCHE · TERMINE UND FÄLLIGES', 'KW 46', b, true)
    const tage = ['SO 08.', 'MO 09.', 'DI 10.', 'MI 11.', 'DO 12.', 'FR 13.', 'SA 14.'], sp = (b - 28) / 7
    const inhalt = { 0: ['2 Amazon-Fälle'], 1: ['Termin (Beispiel)'], 2: ['Datenwächter'], 3: ['Produkt-Termin'], 5: ['Abholung DHL'] }
    tage.forEach((t, i) => {
      const x = 14 + sp * i
      if (i === 0) { g.fillStyle = 'rgba(242,176,74,0.12)'; g.fillRect(x + 2, 32, sp - 4, h - 40) }
      text(g, t, x + sp / 2, 46, 11, i === 0 ? GOLD : CYAN, 'center', 600)
      ;(inhalt[i] ?? []).forEach((e, k) => { g.font = `400 12px ${SCHRIFT}`; text(g, kuerzen(g, e, sp - 12), x + sp / 2, 66 + k * 16, 12, HELL, 'center') })
      if (i) { g.strokeStyle = 'rgba(95,246,255,0.12)'; g.beginPath(); g.moveTo(x + 0.5, 34); g.lineTo(x + 0.5, h - 10); g.stroke() }
    })
  },
  /** Bestellungen kompakt (Zeile 22) */
  bestellungen(g, b, h) {
    kopf(g, 'AKTUELLE BESTELLUNGEN', `${B.offen} OFFEN`, b, h < 220)
    const oben = h < 220 ? 34 : 38, zeile = 22, n = Math.min(5, B.bestellungen.length, Math.floor((h - oben - 6) / zeile)) // gekürzt auf höchstens fünf (Wunsch 08.11.2026)
    B.bestellungen.slice(0, n).forEach(([tag, kanal, art, w], i) => {
      const y = oben + i * zeile + zeile / 2 + 4
      text(g, tag, 22, y, 11, BLASS); text(g, kanal, 66, y, 10, CYAN, 'left', 600)
      g.font = `400 12px ${SCHRIFT}`; text(g, kuerzen(g, art, b - 220), 130, y, 12, HELL); text(g, euro(w), b - 16, y, 12, GOLD, 'right', 600)
    })
    if (B.bestellungen.length > n) text(g, `+ ${B.bestellungen.length - n} WEITERE`, b - 16, h - 8, 10, BLASS, 'right', 600)
  },
}

// ---------- Aufteilungen (x, y, Breite, Höhe auf der 1240 × 760-Tafel) ----------
export const ENTWUERFE = {
  a: { name: 'A · Kennzahlen-Leiste', text: 'Oben fünf kleine Felder (130 hoch statt 260). Darunter Abarbeiten über die volle Höhe, rechts Termine und die gekürzten Bestellungen.',
    felder: [['heute', 0, 0, 190, 130], ['verlauf', 205, 0, 300, 130], ['kanaele', 520, 0, 250, 130], ['top', 785, 0, 300, 130], ['zaehler', 1100, 0, 140, 130],
      ['aufgaben', 0, 150, 640, 610], ['termine', 660, 150, 580, 330], ['bestellungen', 660, 500, 580, 260]] },
  b: { name: 'B · Bestellungen nach oben', text: 'Oben Warenwert heute, Kanäle und die Bestellungen kompakt (höchstens fünf). Darunter nur Abarbeiten und Termine, beide groß, dazu die besten Artikel.',
    felder: [['heute', 0, 0, 180, 170], ['kanaele', 195, 0, 260, 170], ['bestellungen', 470, 0, 770, 170],
      ['aufgaben', 0, 190, 780, 570], ['termine', 800, 190, 440, 380], ['top', 800, 590, 440, 170]] },
  c: { name: 'C · Schmale Zahlenzeile', text: 'Oben nur eine flache Zeile mit acht Zahlen (90 hoch). Darunter am meisten Platz: Abarbeiten links, Termine und Bestellungen rechts.',
    felder: [['kennzahlen', 0, 0, 1240, 90], ['aufgaben', 0, 110, 700, 650], ['termine', 720, 110, 520, 380], ['bestellungen', 720, 510, 520, 250]] },
  d: { name: 'D · Wochenblick', text: 'Oben vier Felder mit Statistik, darunter eine Wochenleiste mit Terminen und Fälligem je Tag, unten Abarbeiten, Bestellungen und beste Artikel.',
    felder: [['heute', 0, 0, 180, 130], ['verlauf', 195, 0, 330, 130], ['kanaele', 540, 0, 260, 130], ['zaehler', 815, 0, 425, 130],
      ['woche', 0, 150, 1240, 120], ['aufgaben', 0, 290, 640, 470], ['bestellungen', 660, 290, 580, 230], ['top', 660, 540, 580, 220]] },
}

/** einen Entwurf flach in eine Leinwand zeichnen (k = Bildpunkte je Einheit) */
export function zeichneEntwurf(c, schluessel, k = 1) {
  const e = ENTWUERFE[schluessel], g = c.getContext('2d')
  c.width = 1240 * k; c.height = 760 * k
  g.fillStyle = '#05121a'; g.fillRect(0, 0, c.width, c.height)
  for (const [id, x, y, b, h] of e.felder) {
    g.save(); g.translate(x * k, y * k); g.scale(k, k)
    STIL.zeichne(g, b, h); ZEICHNER[id](g, b, h)
    g.restore()
  }
}
