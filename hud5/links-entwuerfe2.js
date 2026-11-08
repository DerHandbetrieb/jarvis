// Zweite Runde linke Tafel (08.11.2026, Rückmeldung Auftraggeber): Statistik darf mehr Platz nehmen, leicht animiert
// mit kleinen Symbolen wie rechts; eigene Felder für Abarbeiten, Nachproduzieren und Bestellungen; Nachproduzieren-Karten
// (Kategorie system_key „nachproduzieren“) erscheinen NICHT mehr bei Abarbeiten; Listen brauchen Luft für mehr Einträge.
// Keine Termine, keine „besten Artikel“. Flach in Tafelgröße 1240 × 760, Beispielwerte nach echten Zahlen vom 08.11.2026.
import { RAHMEN_STILE } from './rahmen.js'
import { ikone } from './ikonen.js'

const CYAN = '#5ff6ff', GOLD = '#f2b04a', ROT = '#ff5a4a', GRUEN = '#7dffb0', HELL = '#e8fdff', BLASS = 'rgba(165,230,240,0.62)'
const SCHRIFT = 'Bahnschrift, "Segoe UI", Arial, sans-serif'
const STIL = RAHMEN_STILE[1]

const B = {
  heute: 19.85, heuteBest: 1, gestern: 130.69,
  tage: [83.6, 47.71, 69.89, 0, 83.6, 131.59, 50.78, 132.59, 69.68, 30.8, 62.7, 41.8, 130.69, 19.85],
  kanaele: [['ETSY', 558.86, 14], ['AMAZON', 323.82, 17], ['SHOP', 51.7, 2]],
  offen: 7, freigaben: 0,
  karten: [['Schlüsselanhänger bei Amazon prüfen', 'HEUTE', 'amazon'], ['Amazon-Problem: 5er Set Schlüsselanhänger Klettern', 'HEUTE', 'amazon'],
    ['Recherche Kerzenteller', '', 'todo'], ['Recherche Haken Schlüsselbrett', '', 'todo'], ['Billbee: Lücken bei den Shop-Verknüpfungen', '', 'todo'],
    ['Datenwächter: Widersprüche in den Produktdaten', 'DI 10.11.', 'hintergrund']],
  lager: [['Kerzenständer aus Wurzelholz für 4 Kerzen', 0, 2], ['Tetrapod Lampe aus Beton mit Edison LED', 1, 2], ['Kletteraffen Pocket Fingertrainer Set', 3, 3], ['Kuh-Kucks-Uhr · Schwarz Weiß Braun', 2, 2]],
  bestellungen: [['06.11.', 'ETSY', 'Kaffeetasse mit Boulderstein', 20.9], ['06.11.', 'AMAZON', 'Kaffeetasse mit Boulderstein', 20.9], ['07.11.', 'ETSY', 'Boulderstein-Kaffeetasse', 20.9],
    ['07.11.', 'AMAZON', 'Klettergriff Schlüsselanhänger', 9.99], ['07.11.', 'ETSY', 'Schlüsselbrett Wurzelholz', 59.9], ['07.11.', 'SHOP', 'Klettergriff Magnete 5er', 19.9], ['08.11.', 'AMAZON', 'Boulderstein-Kaffeetasse', 19.85]],
}
const euro = (v, nk = false) => `${v.toLocaleString('de-DE', { minimumFractionDigits: nk ? 2 : 0, maximumFractionDigits: nk ? 2 : 0 })} €`
const s7 = B.tage.slice(-7).reduce((a, x) => a + x, 0), v7 = B.tage.slice(0, 7).reduce((a, x) => a + x, 0), s14 = B.tage.reduce((a, x) => a + x, 0)
const nb14 = B.kanaele.reduce((a, k) => a + k[2], 0)

function text(g, t, x, y, gr, farbe = HELL, ausr = 'left', gew = 400) {
  g.font = `${gew} ${gr}px ${SCHRIFT}`; g.fillStyle = farbe; g.textAlign = ausr; g.textBaseline = 'alphabetic'; g.fillText(t, x, y)
}
function kuerzen(g, t, breite) {
  if (g.measureText(t).width <= breite) return t
  while (t.length > 1 && g.measureText(t + '…').width > breite) t = t.slice(0, -1)
  return t + '…'
}
function kopf(g, titel, rechts, b) {
  text(g, titel, 22, 24, 14, CYAN, 'left', 600)
  if (rechts) text(g, rechts, b - 14, 24, 14, GOLD, 'right', 600)
  g.strokeStyle = 'rgba(95,246,255,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(14, 32.5); g.lineTo(b - 14, 32.5); g.stroke()
}
const welle = (t, f = 1) => 0.5 + 0.5 * Math.sin(t * f)

// ---------- Inhalte (alle mit Zeit t für die Bewegung) ----------
const Z = {
  heute(g, b, h, t) {
    kopf(g, 'WARENWERT · HEUTE', '', b)
    ikone(g, 'muenze', 46, 34 + (h - 34) / 2, Math.min(48, h * 0.3), GOLD, t)
    const gr = Math.min(44, h * 0.26)
    text(g, euro(B.heute, true), 84, 34 + (h - 34) / 2 + gr * 0.15, gr, HELL, 'left', 600)
    text(g, `${B.heuteBest} BESTELLUNG · GESTERN ${euro(B.gestern)}`, 84, 34 + (h - 34) / 2 + gr * 0.15 + 24, 12, CYAN, 'left', 600)
  },
  verlauf(g, b, h, t) {
    const pz = Math.round((s7 / v7 - 1) * 100)
    kopf(g, 'VERKÄUFE · 14 TAGE', euro(s14), b)
    ikone(g, 'kurve', 40, 56, 26, CYAN, t)
    text(g, `7 TAGE ${euro(s7)}`, 64, 62, 15, HELL, 'left', 600)
    text(g, `${pz >= 0 ? '▲' : '▼'} ${Math.abs(pz)} % ZUR VORWOCHE`, b - 14, 62, 12, pz >= 0 ? GRUEN : ROT, 'right', 600)
    const x0 = 22, x1 = b - 16, y0 = 76, y1 = h - 26, m = Math.max(...B.tage)
    const p = B.tage.map((u, i) => [x0 + ((x1 - x0) * i) / (B.tage.length - 1), y1 - ((y1 - y0) * u) / m])
    const v = g.createLinearGradient(0, y0, 0, y1); v.addColorStop(0, 'rgba(95,246,255,0.42)'); v.addColorStop(1, 'rgba(95,246,255,0)')
    g.beginPath(); g.moveTo(x0, y1); p.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(x1, y1); g.closePath(); g.fillStyle = v; g.fill()
    g.beginPath(); p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = CYAN; g.lineWidth = 1.5; g.stroke()
    // Lichtpunkt läuft die Kurve entlang
    const f = (t * 0.12) % 1, i = Math.min(p.length - 2, Math.floor(f * (p.length - 1))), u = f * (p.length - 1) - i
    const lx = p[i][0] + (p[i + 1][0] - p[i][0]) * u, ly = p[i][1] + (p[i + 1][1] - p[i][1]) * u
    g.save(); g.shadowColor = CYAN; g.shadowBlur = 12; g.fillStyle = HELL; g.beginPath(); g.arc(lx, ly, 3, 0, Math.PI * 2); g.fill(); g.restore()
    const [ex, ey] = p.at(-1); g.fillStyle = GOLD; g.beginPath(); g.arc(ex, ey, 3.5 + welle(t, 3), 0, Math.PI * 2); g.fill()
    ;['26.10.', '01.11.', '08.11.'].forEach((d, k) => text(g, d, x0 + ((x1 - x0) * [0, 6, 13][k]) / 13, h - 10, 10, BLASS, ['left', 'center', 'right'][k]))
  },
  kanaele(g, b, h, t) {
    kopf(g, 'KANÄLE · 14 TAGE', `${nb14} BEST.`, b)
    const sum = B.kanaele.reduce((a, k) => a + k[1], 0), farben = [CYAN, GOLD, '#9b8cff']
    const r = Math.min((h - 60) / 2, b * 0.22), cx = 26 + r, cy = 34 + (h - 34) / 2
    let a = -Math.PI / 2 + Math.sin(t * 0.3) * 0.05
    B.kanaele.forEach(([, v], i) => { const d = (v / sum) * Math.PI * 2; g.beginPath(); g.arc(cx, cy, r, a + 0.04, a + d - 0.04); g.strokeStyle = farben[i]; g.lineWidth = r * 0.3; g.stroke(); a += d })
    g.save(); g.strokeStyle = 'rgba(95,246,255,0.35)'; g.lineWidth = 1; g.setLineDash([3, 5]); g.lineDashOffset = -t * 12; g.beginPath(); g.arc(cx, cy, r * 0.62, 0, Math.PI * 2); g.stroke(); g.restore()
    const zeile = Math.min(30, (h - 50) / 3)
    B.kanaele.forEach(([n, v, best], i) => {
      const y = cy - zeile + i * zeile + 5
      g.fillStyle = farben[i]; g.fillRect(cx + r + 22, y - 9, 9, 9)
      text(g, n, cx + r + 38, y, 13, HELL, 'left', 600); text(g, `${best} · ${euro(v)}`, b - 14, y, 12, farben[i], 'right', 600)
    })
  },
  stand(g, b, h, t) {
    kopf(g, 'STAND', '', b)
    const werte = [['paket', 'OFFEN', B.offen, GOLD], ['saege', 'PRODUZIEREN', B.lager.length, ROT], ['stempel', 'FREIGABEN', B.freigaben, CYAN]]
    const zeile = (h - 44) / werte.length
    werte.forEach(([ik, n, v, f], i) => {
      const y = 40 + zeile * i + zeile / 2
      ikone(g, ik, 40, y, Math.min(28, zeile * 0.7), f, t + i)
      text(g, n, 66, y + 5, 12, BLASS, 'left', 600); text(g, String(v), b - 18, y + 9, Math.min(28, zeile * 0.7), f, 'right', 600)
    })
  },
  /** Abarbeiten ohne Nachproduzieren-Karten, Zeilen 26, Platz bis ca. 20 Karten */
  aufgaben(g, b, h, t, spalten = 1) {
    kopf(g, 'ABARBEITEN · DRINGEND ZUERST', `${B.karten.length} OFFEN`, b)
    ikone(g, 'haken', b - 110, 20, 14, CYAN, t)
    const zeile = 26, pro = Math.floor((h - 44) / zeile), sb = (b - 16) / spalten
    B.karten.forEach(([titel, faellig, art], i) => {
      const sp = Math.floor(i / pro); if (sp >= spalten) return
      const x = 8 + sp * sb, y = 40 + (i % pro) * zeile, m = y + zeile / 2
      const f = art === 'amazon' ? GOLD : art === 'hintergrund' ? BLASS : CYAN
      g.strokeStyle = f; g.globalAlpha = 0.8; g.lineWidth = 1.2; g.strokeRect(x + 14.5, m - 6.5, 13, 13); g.globalAlpha = 1
      if (faellig === 'HEUTE') { g.fillStyle = `rgba(242,176,74,${0.12 + 0.12 * welle(t, 2.5)})`; g.fillRect(x + 6, y + 2, sb - 12, zeile - 4) }
      g.font = `400 14px ${SCHRIFT}`; text(g, kuerzen(g, titel, sb - 130), x + 38, m + 5, 14, HELL)
      if (faellig) text(g, faellig === 'HEUTE' ? 'FÄLLIG HEUTE' : faellig, x + sb - 12, m + 4, 11, faellig === 'HEUTE' ? GOLD : BLASS, 'right', 600)
      g.strokeStyle = 'rgba(95,246,255,0.07)'; g.beginPath(); g.moveTo(x + 14, y + zeile - 0.5); g.lineTo(x + sb - 12, y + zeile - 0.5); g.stroke()
    })
  },
  /** Nachproduzieren mit Füllbalken Bestand / Meldebestand */
  lager(g, b, h, t) {
    kopf(g, 'NACHPRODUZIEREN', `${B.lager.length} ARTIKEL`, b)
    ikone(g, 'saege', b - 130, 19, 18, ROT, t)
    const zeile = 40
    B.lager.forEach(([name, ist, soll], i) => {
      const y = 40 + i * zeile
      if (y + zeile > h - 6) return
      g.font = `400 14px ${SCHRIFT}`; text(g, kuerzen(g, name, b - 110), 22, y + 17, 14, HELL)
      text(g, `${ist} / ${soll}`, b - 16, y + 17, 13, ist === 0 ? ROT : GOLD, 'right', 600)
      const bx = 22, bb = b - 38, anteil = Math.min(1, ist / Math.max(1, soll))
      g.fillStyle = 'rgba(95,246,255,0.1)'; g.fillRect(bx, y + 25, bb, 5)
      g.fillStyle = ist === 0 ? `rgba(255,90,74,${0.5 + 0.5 * welle(t, 3)})` : GOLD; g.fillRect(bx, y + 25, Math.max(4, bb * anteil), 5)
    })
  },
  bestellungen(g, b, h, t) {
    kopf(g, 'AKTUELLE BESTELLUNGEN', `${B.offen} OFFEN`, b)
    ikone(g, 'paket', b - 120, 18, 18, GOLD, t)
    const zeile = 26, n = Math.min(B.bestellungen.length, Math.floor((h - 44) / zeile))
    B.bestellungen.slice(0, n).forEach(([tag, kanal, art, w], i) => {
      const y = 40 + i * zeile + zeile / 2 + 5
      text(g, tag, 22, y, 12, BLASS); text(g, kanal, 70, y, 11, CYAN, 'left', 600)
      g.font = `400 13px ${SCHRIFT}`; text(g, kuerzen(g, art, b - 230), 140, y, 13, HELL); text(g, euro(w), b - 16, y, 13, GOLD, 'right', 600)
    })
    if (B.bestellungen.length > n) text(g, `+ ${B.bestellungen.length - n} WEITERE`, b - 16, h - 8, 10, BLASS, 'right', 600)
  },
  /** schmale Zahlenkacheln (Variante 4) */
  zahl(g, b, h, t, [ik, titel, wert, unter, farbe]) {
    kopf(g, titel, '', b)
    ikone(g, ik, 38, 34 + (h - 34) / 2, Math.min(30, h * 0.25), farbe, t)
    text(g, wert, 66, 34 + (h - 34) / 2 + 10, Math.min(34, h * 0.24), HELL, 'left', 600)
    text(g, unter, 66, 34 + (h - 34) / 2 + 30, 11, farbe, 'left', 600)
  },
}

// ---------- vier Aufteilungen (Felder: [inhalt, x, y, b, h, extra]) ----------
export const ENTWUERFE2 = {
  1: { name: '1 · Statistik-Band oben', text: 'Oben vier große, bewegte Statistikfelder (220 hoch). Unten drei gleich wichtige Spalten: Abarbeiten, Nachproduzieren, Bestellungen – je Platz für etwa 18 Einträge.',
    felder: [['heute', 0, 0, 250, 220], ['verlauf', 265, 0, 440, 220], ['kanaele', 720, 0, 300, 220], ['stand', 1035, 0, 205, 220],
      ['aufgaben', 0, 240, 520, 520], ['lager', 535, 240, 335, 520], ['bestellungen', 885, 240, 355, 520]] },
  2: { name: '2 · Statistik-Säule links', text: 'Links eine Säule mit den Statistiken untereinander. Rechts oben Abarbeiten breit, darunter Nachproduzieren und Bestellungen nebeneinander.',
    felder: [['heute', 0, 0, 340, 170], ['verlauf', 0, 185, 340, 300], ['kanaele', 0, 500, 340, 260],
      ['aufgaben', 355, 0, 885, 380], ['lager', 355, 395, 420, 365], ['bestellungen', 790, 395, 450, 365]] },
  3: { name: '3 · Abarbeiten im Mittelpunkt', text: 'Oben die Statistik in drei Feldern. Abarbeiten bekommt die größte Fläche in der Mitte, rechts daneben Nachproduzieren und Bestellungen übereinander.',
    felder: [['heute', 0, 0, 300, 200], ['verlauf', 315, 0, 560, 200], ['kanaele', 890, 0, 350, 200],
      ['aufgaben', 0, 215, 700, 545], ['lager', 715, 215, 525, 260], ['bestellungen', 715, 490, 525, 270]] },
  4: { name: '4 · Kachelreihe + zwei Spalten Abarbeiten', text: 'Oben fünf Zahlenkacheln mit bewegten Symbolen und der 14-Tage-Kurve. Abarbeiten in zwei Spalten über die volle Breite, unten Nachproduzieren und Bestellungen.',
    felder: [['zahl', 0, 0, 230, 150, ['muenze', 'HEUTE', euro(B.heute, true), '1 BESTELLUNG', GOLD]], ['zahl', 245, 0, 230, 150, ['kurve', '7 TAGE', euro(s7), '▼ 4 % VORWOCHE', CYAN]],
      ['zahl', 490, 0, 230, 150, ['ring', 'ETSY · 14 TAGE', '60 %', '14 BESTELLUNGEN', CYAN]], ['zahl', 735, 0, 250, 150, ['paket', 'OFFEN', String(B.offen), 'BESTELLUNGEN', GOLD]],
      ['zahl', 1000, 0, 240, 150, ['saege', 'NACHPRODUZIEREN', String(B.lager.length), 'ARTIKEL', ROT]],
      ['aufgaben', 0, 165, 1240, 300, 2], ['lager', 0, 480, 560, 280], ['bestellungen', 575, 480, 665, 280]] },
}

export function zeichneEntwurf2(g, schluessel, t) {
  g.fillStyle = '#05121a'; g.fillRect(0, 0, 1240, 760)
  for (const [id, x, y, b, h, extra] of ENTWUERFE2[schluessel].felder) {
    g.save(); g.translate(x, y); STIL.zeichne(g, b, h)
    if (id === 'zahl') Z.zahl(g, b, h, t, extra); else Z[id](g, b, h, t, extra)
    g.restore()
  }
}
