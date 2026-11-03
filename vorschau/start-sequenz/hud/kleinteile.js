// Kleinteile für die Seitenbildschirme – Runde 5 (03.11.2026). Rückmeldung zu Runde 4: „noch zu grob, viel kleinteiliger,
// mehr kleine Details wie in den Vorbild-Bildern“. Darum: viele kleine Bausteine statt weniger großer Anzeigen, jeder in
// exakter Bildschirm-Auflösung (1 Leinwand-Pixel = 1 Bildschirm-Pixel → gestochen scharf), feine Schrift (9–11 px),
// 1-px-Linien, Mikro-Beschriftungen, Zahlenkolonnen, Segmentbalken, Teilbögen.
// Signatur aller Bausteine: (g, w, h, t, f, nr) in echten Pixeln; f = { haupt, akzent } (THREE.Color).
import { DATEN, RUNEN, LOKI, RUNEN_SCHRIFT, klemm, phase, raus, rauschen, zufall, css } from './zeichner.js'

const SCHRIFT = 'Bahnschrift, "Segoe UI", sans-serif'
const MONO = 'Consolas, "Cascadia Mono", monospace'
function t9(g, s, x, y, f, { a = 0.75, gr = 9, farbe, aus = 'left', schrift = SCHRIFT, gew = 400, sp = 0.8 } = {}) {
  g.font = `${gew} ${gr}px ${schrift}`; g.textAlign = aus; g.fillStyle = css(farbe ?? f.haupt, a); g.letterSpacing = `${sp}px`; g.fillText(s, x, y); g.letterSpacing = '0px'
}
function l1(g, f, a = 0.6, farbe) { g.strokeStyle = css(farbe ?? f.haupt, a); g.lineWidth = 1 }
const px = (v) => Math.round(v) + 0.5 // auf Pixelmitte → scharfe 1-px-Linien

// kleiner Kopf: Titel + Kennung + feine Linie
function kopf(g, w, f, titel, kennung) {
  t9(g, titel, 2, 10, f, { a: 0.95, gew: 600, sp: 1.4 })
  if (kennung) t9(g, kennung, w - 2, 10, f, { a: 0.45, aus: 'right', schrift: MONO, sp: 0 })
  l1(g, f, 0.5); g.beginPath(); g.moveTo(0, px(15)); g.lineTo(w, px(15)); g.stroke()
  g.fillStyle = css(f.haupt, 0.9); g.fillRect(0, 14, 18, 2)
}

export const KLEIN = {
  // Mini-Verlauf mit Wert
  mikroGraph(g, w, h, t, f, nr) {
    const namen = ['NETZ', 'DATENBANK', 'SHOP-API', 'BILLBEE', 'ETSY-API', 'AMAZON-API', 'SPEICHER', 'LÜFTER']
    const name = namen[nr % namen.length], wert = 40 + rauschen(t * 0.8 + nr * 3) * 18
    kopf(g, w, f, name, `BSP · K${String(nr).padStart(2, '0')}`)
    l1(g, f, 0.1); for (let y = 22; y < h; y += 6) { g.beginPath(); g.moveTo(0, px(y)); g.lineTo(w, px(y)); g.stroke() }
    const v = g.createLinearGradient(0, 20, 0, h); v.addColorStop(0, css(f.haupt, 0.35)); v.addColorStop(1, css(f.haupt, 0))
    g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 2) g.lineTo(x, 22 + (h - 26) * (0.55 - 0.35 * rauschen(x * 0.06 + t * 1.6 + nr) / 1.75)); g.lineTo(w, h); g.closePath(); g.fillStyle = v; g.fill()
    l1(g, f, 1); g.beginPath(); for (let x = 0; x <= w; x += 2) g.lineTo(x, 22 + (h - 26) * (0.55 - 0.35 * rauschen(x * 0.06 + t * 1.6 + nr) / 1.75)); g.stroke()
    t9(g, `${wert.toFixed(1)}`, w - 2, h - 3, f, { a: 1, gr: 11, schrift: MONO, aus: 'right', farbe: nr % 4 === 0 ? f.akzent : f.haupt, sp: 0 })
  },
  // fein segmentierte Balken mit Prozent
  segmentBalken(g, w, h, t, f, nr) {
    const sets = [[['ETSY', 0.66], ['AMAZON', 0.41], ['SHOP', 0.28], ['KASUWA', 0.08]], [['BETON', 0.72], ['HOLZ', 0.55], ['KERAMIK', 0.31], ['FILZ', 0.18]], [['CPU', 0.23], ['RAM', 0.29], ['GPU', 0.41], ['VRAM', 0.33]]]
    const d = sets[nr % sets.length], titel = ['UMSATZANTEIL', 'MATERIALVERBRAUCH', 'AUSLASTUNG'][nr % 3]
    kopf(g, w, f, titel, 'BSP')
    const zeile = (h - 20) / d.length
    d.forEach(([n, v], i) => {
      const y = 22 + i * zeile, wert = klemm(v + 0.03 * rauschen(t + i + nr)) * klemm((t - 1.8) / 1.5)
      t9(g, n, 0, y + 8, f, { a: 0.7 }); t9(g, `${Math.round(wert * 100)}%`, w, y + 8, f, { a: 0.95, aus: 'right', schrift: MONO, sp: 0, farbe: i === 0 ? f.akzent : f.haupt })
      const x0 = 58, bw = w - 58 - 34, n2 = Math.floor(bw / 4)
      for (let s = 0; s < n2; s++) { g.fillStyle = css(i === 0 ? f.akzent : f.haupt, s / n2 < wert ? 0.85 : 0.1); g.fillRect(x0 + s * 4, y + 2, 3, 7) }
    })
  },
  // kleiner Ring mit Skala, Teilbögen und Wert
  ringMini(g, w, h, t, f, nr) {
    const namen = ['KERN', 'FELD', 'PULS', 'TAKT', 'SYNC', 'LAST'], x = w / 2, y = h / 2 - 2, r = Math.min(w, h) * 0.34, v = klemm(0.55 + 0.35 * rauschen(t * 0.9 + nr * 2) / 1.75)
    l1(g, f, 0.35); for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, l = i % 5 ? 2 : 5; g.beginPath(); g.moveTo(x + Math.cos(a) * (r + 6), y + Math.sin(a) * (r + 6)); g.lineTo(x + Math.cos(a) * (r + 6 - l), y + Math.sin(a) * (r + 6 - l)); g.stroke() }
    g.lineWidth = 3; g.strokeStyle = css(f.haupt, 0.12); g.beginPath(); g.arc(x, y, r - 2, 0, 7); g.stroke()
    g.strokeStyle = css(nr % 3 === 0 ? f.akzent : f.haupt, 0.95); g.beginPath(); g.arc(x, y, r - 2, -Math.PI / 2, -Math.PI / 2 + v * Math.PI * 2); g.stroke()
    l1(g, f, 0.6); g.beginPath(); g.arc(x, y, r - 9, t * 0.8 + nr, t * 0.8 + nr + 1.4); g.stroke(); g.beginPath(); g.arc(x, y, r - 13, -t * 0.5 + nr, -t * 0.5 + nr + 0.7); g.stroke()
    t9(g, `${Math.round(v * 100)}`, x, y + 4, f, { a: 1, gr: Math.round(r * 0.5), aus: 'center', gew: 300, sp: 0 })
    t9(g, namen[nr % namen.length], x, h - 2, f, { a: 0.6, aus: 'center', sp: 1.5 })
  },
  // Zahlenkolonnen (Speicher/Koordinaten), laufen langsam durch
  zahlen(g, w, h, t, f, nr) {
    kopf(g, w, f, ['SPEICHERABBILD', 'KOORDINATEN', 'PROTOKOLL'][nr % 3], 'LIVE')
    g.font = `9px ${MONO}`; g.textAlign = "left"; const zeilen = Math.floor((h - 20) / 11), start = Math.floor(t * 4)
    for (let i = 0; i < zeilen; i++) {
      const z = zufall((start + i) * 31 + nr * 7), y = 28 + i * 11, hell = (start + i) % 7 === 0
      let s = (0x3a00 + (start + i) * 16).toString(16).toUpperCase() + '  '
      const spalten = Math.floor((w - 40) / 30)
      for (let k = 0; k < spalten; k++) s += Math.floor(z() * 65535).toString(16).padStart(4, '0').toUpperCase() + ' '
      g.fillStyle = css(hell ? f.akzent : f.haupt, hell ? 1 : 0.5); g.fillText(s, 0, y)
    }
  },
  // Datenstreifen: mehrere dünne Strichcodes mit Kennung, einer wird gerade gelesen
  strichcode(g, w, h, t, f, nr) {
    kopf(g, w, f, 'DATENSTREIFEN', `${LOKI}`)
    const zeilen = Math.max(1, Math.floor((h - 20) / 22)), lesen = Math.floor(t * 0.7) % zeilen
    for (let k = 0; k < zeilen; k++) {
      const y = 22 + k * 22, z = zufall(nr * 13 + k * 7 + (k === lesen ? Math.floor(t * 3) : 0))
      t9(g, `${(4711 + nr * 97 + k * 13).toString(16).toUpperCase()}`, 0, y + 9, f, { a: k === lesen ? 1 : 0.5, schrift: MONO, sp: 0, gr: 8, farbe: k === lesen ? f.akzent : f.haupt })
      let x = 34; while (x < w - 30) { const b = 1 + Math.floor(z() * 2); g.fillStyle = css(f.haupt, z() < 0.55 ? (k === lesen ? 0.85 : 0.45) : 0.08); g.fillRect(x, y + 2, b, 10); x += b + 1 + Math.floor(z() * 2) }
      t9(g, k === lesen ? 'LESEN' : 'OK', w, y + 9, f, { a: 0.6, aus: 'right', gr: 8, farbe: k === lesen ? f.akzent : f.haupt })
      if (k === lesen) { const sx = 34 + ((t * 300) % (w - 64)); g.fillStyle = css(f.akzent, 0.9); g.fillRect(sx, y, 1, 14) }
    }
  },
  // Punktraster mit leuchtenden Treffern
  punkte(g, w, h, t, f, nr) {
    kopf(g, w, f, 'BESTELLUNGEN · KARTE', 'GEO')
    const z = zufall(nr + 3)
    // Landflächen aus zwei überlagerten Wellen (wirkt wie Kontinente), feine 1-px-Punkte im 4-px-Raster
    for (let y = 24; y < h - 2; y += 4) for (let x = 2; x < w - 2; x += 4) { const land = rauschen(x * 0.021 + nr) * rauschen(y * 0.043 + 2.1) + rauschen((x + y) * 0.013 + 5) * 0.6 > 0.55; g.fillStyle = css(f.haupt, land ? 0.55 : 0.07); g.fillRect(x, y, land ? 1.5 : 1, land ? 1.5 : 1) }
    for (let i = 0; i < 6; i++) { const x = 10 + z() * (w - 20), y = 28 + z() * (h - 36), puls = (t * 1.5 + i * 0.4) % 1; g.strokeStyle = css(i === 0 ? f.akzent : f.haupt, 1 - puls); g.lineWidth = 1; g.beginPath(); g.arc(x, y, 2 + puls * 9, 0, 7); g.stroke(); g.fillStyle = css(i === 0 ? f.akzent : f.haupt, 1); g.fillRect(x - 1, y - 1, 3, 3) }
  },
  // Statuszeilen „Name ........ Wert“
  status(g, w, h, t, f, nr) {
    const sets = [
      ['WERKSTATT', [['AUFGABEN OFFEN', DATEN.aufgaben.offen], ['NEU SEIT GESTERN', DATEN.aufgaben.neu], ['FREIGABEN', DATEN.aufgaben.freigaben], ['SELBSTTEST NACHT', 'OK'], ['SYNC', 'AUSSTEHEND']]],
      ['SHOPS', [['ETSY ANGEBOTE', 33], ['AMAZON ANGEBOTE', 41], ['SHOP ARTIKEL', 58], ['AMAZON-FÄLLE', 1], ['BILLBEE', 'VERBUNDEN']]],
      ['LOKI', [['STIMMKERN', 'QWEN3 0.6B'], ['OHREN', 'WHISPER'], ['SARKASMUS', '100 %'], ['GEDULD', '3 %'], ['BENUTZER', 'ANWESEND']]],
    ]
    const [titel, zeilen] = sets[nr % sets.length]; kopf(g, w, f, titel, 'BEISPIEL')
    zeilen.forEach(([n, v], i) => {
      const y = 30 + i * ((h - 26) / zeilen.length), a = klemm((t - 1.6 - i * 0.12) * 4)
      t9(g, n, 0, y, f, { a: 0.7 * a }); t9(g, String(v), w, y, f, { a: a, aus: 'right', schrift: MONO, sp: 0, farbe: /AUSSTEHEND|1$|3 %/.test(String(v)) ? f.akzent : f.haupt })
      g.fillStyle = css(f.haupt, 0.25 * a); const tw = g.measureText(String(v)).width; for (let x = 112; x < w - tw - 10; x += 4) g.fillRect(x, y - 3, 1, 1)
    })
  },
  // Kreisdiagramm (Kanäle)
  torte(g, w, h, t, f, nr) {
    kopf(g, w, f, 'BESTELLUNGEN NACH KANAL', '30 T · BSP')
    const x = h * 0.42 + 6, y = h / 2 + 8, r = h * 0.32, teile = [0.48, 0.31, 0.15, 0.06], namen = ['ETSY', 'AMAZON', 'SHOP', 'KASUWA']
    let a = -Math.PI / 2; const zeig = klemm((t - 2) / 1.5)
    teile.forEach((p, i) => { const b = p * Math.PI * 2 * zeig; if (b < 0.07) { a += b; return } g.strokeStyle = css(i === 0 ? f.akzent : f.haupt, 0.9 - i * 0.18); g.lineWidth = 8; g.beginPath(); g.arc(x, y, r, a + 0.03, a + b - 0.03); g.stroke(); a += b })
    l1(g, f, 0.3); g.beginPath(); g.arc(x, y, r - 9, 0, 7); g.stroke(); g.beginPath(); g.arc(x, y, r + 7, 0, 7); g.stroke()
    namen.forEach((n, i) => { const yy = 30 + i * 13; g.fillStyle = css(i === 0 ? f.akzent : f.haupt, 0.9 - i * 0.18); g.fillRect(x + r + 18, yy - 6, 6, 6); t9(g, n, x + r + 28, yy, f, { a: 0.75 }); t9(g, `${Math.round(teile[i] * 100)}%`, w, yy, f, { a: 0.95, aus: 'right', schrift: MONO, sp: 0 }) })
  },
  // Oszilloskop klein
  oszi(g, w, h, t, f, nr) {
    kopf(g, w, f, ['SIGNAL', 'STIMMKANAL', 'ENERGIEFELD'][nr % 3], `${(50 + nr * 3.7).toFixed(1)} Hz`)
    l1(g, f, 0.12); for (let x = 0; x < w; x += 12) { g.beginPath(); g.moveTo(px(x), 18); g.lineTo(px(x), h); g.stroke() }
    l1(g, f, 0.95); g.beginPath(); for (let x = 0; x <= w; x++) g.lineTo(x, (h + 18) / 2 + Math.sin(x * 0.12 + t * 6 + nr) * Math.sin(x * 0.013 + t) * (h - 24) * 0.4); g.stroke()
    l1(g, f, 0.5, f.akzent); g.beginPath(); for (let x = 0; x <= w; x++) g.lineTo(x, (h + 18) / 2 + Math.sin(x * 0.05 - t * 3) * (h - 24) * 0.18); g.stroke()
  },
  // Lineal mit Zahlen und laufender Marke
  lineal(g, w, h, t, f, nr) {
    l1(g, f, 0.6); g.beginPath(); g.moveTo(0, px(h - 1)); g.lineTo(w, px(h - 1)); g.stroke()
    for (let x = 0, i = 0; x < w; x += 5, i++) { const lang = i % 10 === 0 ? h - 10 : i % 5 === 0 ? 7 : 3; g.beginPath(); g.moveTo(px(x), h - 1); g.lineTo(px(x), h - 1 - lang); g.stroke(); if (i % 10 === 0) t9(g, String(i * 5 + nr * 100), x + 2, 8, f, { a: 0.5, schrift: MONO, sp: 0 }) }
    const m = (w * 0.5 + Math.sin(t * 0.7 + nr) * w * 0.4); g.fillStyle = css(f.akzent, 1); g.beginPath(); g.moveTo(m, h - 1); g.lineTo(m - 4, h - 8); g.lineTo(m + 4, h - 8); g.fill()
  },
  // Aufgaben-Karten (klein, dicht)
  aufgaben(g, w, h, t, f, nr) {
    kopf(g, w, f, 'TO-DO · OBERSTE KARTEN', `BEISPIEL · ${DATEN.aufgaben.offen} OFFEN`)
    const zeile = (h - 20) / DATEN.karten.length
    DATEN.karten.forEach(([titel, bereich, fort], i) => {
      const y = 20 + i * zeile, a = raus(klemm((t - 2 - i * 0.18) * 3))
      g.globalAlpha = a
      l1(g, f, i === 0 ? 0.8 : 0.3); g.beginPath(); g.moveTo(px(6), px(y + 2)); g.lineTo(w - 1, px(y + 2)); g.lineTo(w - 1, y + zeile - 3); g.lineTo(0, y + zeile - 3); g.lineTo(0, y + 8); g.closePath(); g.stroke()
      g.fillStyle = css(i < 2 ? f.akzent : f.haupt, 0.95); g.fillRect(3, y + 6, 2, zeile - 12)
      t9(g, titel.toUpperCase(), 10, y + zeile * 0.45, f, { a: 0.95, gr: 10, gew: 500 }); t9(g, bereich.toUpperCase(), 10, y + zeile * 0.45 + 10, f, { a: 0.45, gr: 8 })
      // Kleindetails wie in den Vorbildern: Kartennummer, Fälligkeit, Mini-Teilstriche
      t9(g, `K-${String(142 + i * 7).padStart(4, '0')}`, w * 0.48, y + zeile * 0.45, f, { a: 0.4, gr: 8, schrift: MONO, sp: 0 })
      t9(g, i < 2 ? 'FÄLLIG HEUTE' : `FÄLLIG ${4 + i}.11.`, w * 0.48, y + zeile * 0.45 + 10, f, { a: i < 2 ? 0.85 : 0.4, gr: 8, farbe: i < 2 ? f.akzent : f.haupt })
      l1(g, f, 0.25); for (let k = 0; k < 12; k++) { g.beginPath(); g.moveTo(px(w - 4 - k * 3), y + zeile - 3); g.lineTo(px(w - 4 - k * 3), y + zeile - 6); g.stroke() }
      const bx = w - 92; for (let s = 0; s < 20; s++) { g.fillStyle = css(f.haupt, s / 20 < fort ? 0.85 : 0.12); g.fillRect(bx + s * 4, y + zeile * 0.32, 3, 5) }
      t9(g, `${Math.round(fort * 100)}%`, w - 4, y + zeile * 0.45 + 10, f, { a: 0.6, aus: 'right', schrift: MONO, sp: 0, gr: 8 })
      g.globalAlpha = 1
    })
  },
  // Umsatz-Flächendiagramm (fein)
  umsatz(g, w, h, t, f) {
    kopf(g, w, f, 'UMSATZ · 14 TAGE · €', 'BEISPIEL')
    const d = DATEN.umsatz14, x0 = 26, x1 = w - 4, y0 = 24, y1 = h - 14, max = 160, zeig = klemm((t - 1.8) / 2)
    l1(g, f, 0.1); for (let k = 0; k <= 4; k++) { const y = px(y1 - (k / 4) * (y1 - y0)); g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); t9(g, `${k * 40}`, x0 - 4, y + 3, f, { a: 0.45, aus: 'right', schrift: MONO, sp: 0, gr: 8 }) }
    const p = d.map((v, i) => [x0 + (i / (d.length - 1)) * (x1 - x0), y1 - (v / max) * (y1 - y0) * zeig])
    const v = g.createLinearGradient(0, y0, 0, y1); v.addColorStop(0, css(f.haupt, 0.4)); v.addColorStop(1, css(f.haupt, 0))
    g.beginPath(); g.moveTo(x0, y1); p.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(x1, y1); g.closePath(); g.fillStyle = v; g.fill()
    l1(g, f, 1); g.beginPath(); p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke()
    p.forEach(([x, y], i) => { g.fillStyle = css(i === d.length - 1 ? f.akzent : f.haupt, 1); g.fillRect(x - 1.5, y - 1.5, 3, 3); if (i % 2 === 0) t9(g, `-${d.length - 1 - i}`, x, h - 2, f, { a: 0.4, aus: 'center', schrift: MONO, sp: 0, gr: 8 }) })
    const [lx, ly] = p.at(-1); t9(g, `${DATEN.verkauf.umsatz.toFixed(2).replace('.', ',')} €`, lx - 4, ly + 14, f, { a: 1, aus: 'right', gr: 11, farbe: f.akzent, gew: 600, sp: 0 })
  },
  // Lager knapp (fein)
  lager(g, w, h, t, f) {
    kopf(g, w, f, 'LAGER · WIRD KNAPP', 'BEISPIEL')
    const zeile = (h - 20) / DATEN.lager.length
    DATEN.lager.forEach(([n, ist, soll], i) => {
      const y = 22 + i * zeile + 8, a = klemm((t - 2.2 - i * 0.15) / 1)
      t9(g, n.toUpperCase(), 0, y, f, { a: 0.85, gr: 9 }); t9(g, `${ist}/${soll}`, w, y, f, { a: 1, aus: 'right', schrift: MONO, sp: 0, farbe: ist <= 2 ? f.akzent : f.haupt })
      l1(g, f, 0.25); g.strokeRect(px(0), px(y + 3), w - 1, 5); g.fillStyle = css(ist <= 2 ? f.akzent : f.haupt, 0.85); g.fillRect(1, y + 4, (w - 3) * (ist / soll) * a, 3)
    })
  },
  // Verkäufe gestern: große, dünne Zahl + Kanäle
  verkauf(g, w, h, t, f) {
    kopf(g, w, f, 'VERKÄUFE GESTERN', 'BEISPIEL')
    const v = DATEN.verkauf, a = klemm((t - 2) / 1.2)
    t9(g, String(Math.round(v.bestellungen * a)), 0, h * 0.78, f, { a: 1, gr: Math.round(h * 0.62), gew: 200, sp: 0 })
    t9(g, 'BESTELLUNGEN', h * 0.5, h * 0.42, f, { a: 0.6, gr: 9 }); t9(g, `${v.artikel} ARTIKEL`, h * 0.5, h * 0.42 + 12, f, { a: 0.85, gr: 10 }); t9(g, `${v.umsatz.toFixed(2).replace('.', ',')} €`, h * 0.5, h * 0.42 + 26, f, { a: 1, gr: 12, farbe: f.akzent, gew: 600, sp: 0 })
  },
  // Yggdrasil (fein, Krone + Wurzeln, neun Welten) – gefiel dem Auftraggeber
  baum(g, w, h, t, f) {
    kopf(g, w, f, 'YGGDRASIL · WELTENBAUM', 'DATENSTRUKTUR')
    const wachs = klemm((t - 1.6) / 6.5), mx = w / 2, boden = h * 0.66
    l1(g, f, 0.2); g.beginPath(); g.arc(mx, boden, h * 0.5, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.arc(mx, boden, h * 0.55, Math.PI * 1.15, Math.PI * 1.85); g.stroke()
    let nr = 0
    const ast = (x, y, laenge, winkel, tiefe, max, richtung) => {
      if (tiefe > max) return
      const p = klemm(wachs * (max + 1.5) - tiefe); if (p <= 0) return
      const x2 = x + Math.cos(winkel) * laenge * p, y2 = y + Math.sin(winkel) * laenge * p
      g.strokeStyle = css(f.haupt, klemm(0.95 - tiefe * 0.08)); g.lineWidth = Math.max(0.8, 2.6 - tiefe * 0.35); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + x2) / 2 + rauschen(tiefe * 3 + winkel) * laenge * 0.15, (y + y2) / 2, x2, y2); g.stroke()
      const id = nr++
      if (p >= 1 && tiefe >= max - 1) { const hell = Math.sin(t * 2.2 + id * 1.7) > 0.6; g.fillStyle = css(hell ? f.akzent : f.haupt, hell ? 1 : 0.6); g.fillRect(x2 - 1, y2 - 1, hell ? 3 : 2, hell ? 3 : 2) }
      ast(x2, y2, laenge * 0.74, winkel - (richtung > 0 ? 0.42 : 0.5), tiefe + 1, max, richtung); ast(x2, y2, laenge * 0.74, winkel + (richtung > 0 ? 0.42 : 0.5), tiefe + 1, max, richtung)
      if (tiefe === 1 && richtung > 0) ast(x2, y2, laenge * 0.7, winkel, tiefe + 1, max, richtung)
    }
    ast(mx, boden, h * 0.17, -Math.PI / 2, 0, 7, 1); ast(mx, boden, h * 0.08, Math.PI / 2, 0, 4, -1)
    const welten = [['ASGARD', 0.5, 0.08], ['VANAHEIM', 0.18, 0.2], ['ALFHEIM', 0.82, 0.2], ['MIDGARD', 0.08, 0.5], ['JÖTUNHEIM', 0.92, 0.5], ['MUSPELHEIM', 0.14, 0.78], ['NIFLHEIM', 0.86, 0.78], ['SVARTALFHEIM', 0.3, 0.95], ['HELHEIM', 0.7, 0.95]]
    welten.forEach(([n, u, v], i) => { const a = klemm((wachs - 0.3 - i * 0.06) * 4); if (a <= 0) return; const x = u * w, y = 20 + v * (h - 26); t9(g, n, x, y, f, { a: 0.75 * a, gr: 8, aus: 'center', sp: 1.4, farbe: i === 0 ? f.akzent : f.haupt }); t9(g, RUNEN[(i * 5) % RUNEN.length], x, y + 12, f, { a: 0.6 * a, gr: 11, aus: 'center', schrift: RUNEN_SCHRIFT, sp: 0 }) })
  },
  // Shop-Ringe (fein)
  shops(g, w, h, t, f) {
    kopf(g, w, f, 'SHOPS · STATUS', 'BEISPIEL')
    DATEN.shops.forEach(([n, ang, ges], i) => {
      const x = w * (0.17 + i * 0.33), y = h * 0.52 + 4, r = Math.min(h * 0.3, w * 0.12), a = klemm((t - 2 - i * 0.25) / 1.4)
      l1(g, f, 0.35); for (let k = 0; k < 72; k++) { const w2 = (k / 72) * Math.PI * 2, l = k % 6 ? 2 : 4; g.beginPath(); g.moveTo(x + Math.cos(w2) * (r + 7), y + Math.sin(w2) * (r + 7)); g.lineTo(x + Math.cos(w2) * (r + 7 - l), y + Math.sin(w2) * (r + 7 - l)); g.stroke() }
      for (let s = 0; s < 40; s++) { const a0 = -Math.PI / 2 + (s / 40) * Math.PI * 2; g.strokeStyle = css(ges < 1 ? f.akzent : f.haupt, s / 40 < ges * a ? 0.9 : 0.1); g.lineWidth = 3; g.beginPath(); g.arc(x, y, r, a0, a0 + Math.PI / 20 - 0.04); g.stroke() }
      l1(g, f, 0.6); g.beginPath(); g.arc(x, y, r - 7, t * 0.6 + i, t * 0.6 + i + 1.2); g.stroke()
      t9(g, String(Math.round(ang * a)), x, y + 4, f, { a: 1, gr: Math.round(r * 0.55), gew: 300, aus: 'center', sp: 0 })
      t9(g, n, x, y + r + 18, f, { a: 0.9, gr: 9, gew: 600, aus: 'center', sp: 1.5 }); t9(g, ges < 1 ? '1 FALL' : 'ONLINE', x, y + r + 28, f, { a: 0.7, gr: 8, aus: 'center', farbe: ges < 1 ? f.akzent : f.haupt })
    })
  },
  // Runen-Inschrift mit Übersetzung
  inschrift(g, w, h, t, f, nr) {
    kopf(g, w, f, 'RUNENSCHRIFT', LOKI)
    g.font = `14px ${RUNEN_SCHRIFT}`; g.textAlign = "left"; const zeilen = Math.floor((h - 24) / 16)
    for (let z = 0; z < zeilen; z++) { let s = ''; const r = zufall(z * 17 + nr + Math.floor(t * 0.8)); for (let i = 0; i < Math.floor(w / 13); i++) s += RUNEN[Math.floor(r() * RUNEN.length)]; g.fillStyle = css(z === 1 ? f.akzent : f.haupt, z === 1 ? 0.95 : 0.45); g.fillText(s, 0, 32 + z * 16) }
  },
}
