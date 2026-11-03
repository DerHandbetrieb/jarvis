// Anzeigen der Start-Sequenz – Runde 4 (03.11.2026), neuer Stil nach den Vorbild-Bildern des Auftraggebers:
// haarfeine Linien, doppelte Auflösung, abgeschrägte Ecken und Reiter statt dicker Kästen, segmentierte Ringe mit
// Teilbögen und Skalenstrichen, Flächendiagramme mit Verlaufsfüllung, viele kleine Beschriftungen, Cyan mit sparsamen
// Orange-Akzenten. Inhalte: Werkstatt-Lage (Aufgaben, Verkäufe, Umsatz, Lager, Shops) – vorerst BEISPIELDATEN, später
// aus der Werkstatt-App (Abschnitt 6 der CLAUDE.md, vor dem Bau abstimmen).
// Jede Zeichenfunktion arbeitet in einem Entwurfsraum von 800 Einheiten Breite (Höhe nach Seitenverhältnis); die
// Leinwand selbst ist doppelt so groß wie die Anzeige auf dem Bildschirm, darum bleiben 1-Einheit-Linien gestochen scharf.

export const RUNEN = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛒᛖᛗᛚᛜᛞᚴ' // nur unbedenkliche Runen (CLAUDE.md, Runen-Regel)
export const LOKI = 'ᛚᚢᚴᛁ'
export const RUNEN_SCHRIFT = '"Segoe UI Historic", "Segoe UI Symbol", serif'
const DUENN = 'Bahnschrift, "Segoe UI", sans-serif'
const MONO = 'Consolas, "Cascadia Mono", monospace'

export const klemm = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
export const phase = (t, a, b) => klemm((t - a) / (b - a))
export const weich = (x) => x * x * (3 - 2 * x)
export const raus = (x) => 1 - Math.pow(1 - x, 3)
export const zurueck = (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2) }
export const rauschen = (x) => Math.sin(x * 1.3) + 0.5 * Math.sin(x * 2.7 + 1.1) + 0.25 * Math.sin(x * 5.3 + 2.3)
export function zufall(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) }
export const css = (c, a = 1) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`

let tonQuelle = () => ({})
export function setzeTonQuelle(fn) { tonQuelle = fn }

// BEISPIELDATEN – später aus der Werkstatt-App
export const DATEN = {
  aufgaben: { offen: 11, neu: 2, freigaben: 1, probleme: 1 },
  karten: [['Kerzenständer produzieren', 'Produktion', 0.8], ['Tassen schließen', 'Lager', 0.55], ['Amazon-Fall Klettergriff', 'Shop', 0.35], ['Etsy-Fotos Lichtkästen', 'Marketing', 0.2], ['Beton-Gießform reinigen', 'Werkstatt', 0.65]],
  verkauf: { bestellungen: 3, artikel: 4, umsatz: 123.49, kanaele: [['ETSY', 2, 0.66], ['AMAZON', 1, 0.33], ['EIGENER SHOP', 0, 0]] },
  umsatz14: [62, 88, 41, 120, 96, 74, 133, 58, 101, 87, 145, 92, 110, 123],
  lager: [['Kerzenständer Beton', 2, 12], ['Tasse „Emma“', 3, 20], ['Klettergriff-Anhänger', 4, 25], ['Lichtkasten MM01', 5, 15]],
  shops: [['ETSY', 33, 1], ['AMAZON', 41, 0.92], ['SHOP', 58, 1]],
}

// ---------- Grundbausteine ----------
export function entwurf(g, c) { const s = c.width / 800; g.setTransform(s, 0, 0, s, 0, 0); return { w: 800, h: c.height / s } }
function linie(g, f, a = 0.9, b = 1) { g.strokeStyle = css(f.haupt, a); g.lineWidth = b }
function text(g, s, x, y, { groesse = 11, farbe, a = 0.85, gewicht = 400, schrift = DUENN, ausrichtung = 'left', abstand = 0 } = {}) {
  g.font = `${gewicht} ${groesse}px ${schrift}`; g.textAlign = ausrichtung; g.fillStyle = css(farbe, a)
  if (abstand) g.letterSpacing = `${abstand}px`
  g.fillText(s, x, y); if (abstand) g.letterSpacing = '0px'
}
// HUD-Rahmen: abgeschrägte Ecken, Reiter mit Titel, Skalenstriche unten, zarte Verlaufsfläche
export function hudRahmen(g, w, h, f, titel, kennung = '') {
  const k = 16, verlauf = g.createLinearGradient(0, 0, 0, h)
  verlauf.addColorStop(0, css(f.haupt, 0.07)); verlauf.addColorStop(1, css(f.haupt, 0.015))
  g.beginPath(); g.moveTo(1, 26); g.lineTo(1, h - k); g.lineTo(k, h - 1); g.lineTo(w - 1, h - 1); g.lineTo(w - 1, 26 + k); g.lineTo(w - k - 1, 26); g.closePath()
  g.fillStyle = verlauf; g.fill(); linie(g, f, 0.35, 1); g.stroke()
  // Reiter
  const tb = Math.min(w * 0.55, 30 + titel.length * 7.6)
  g.beginPath(); g.moveTo(1, 26); g.lineTo(1, 6); g.lineTo(8, 1); g.lineTo(tb, 1); g.lineTo(tb + 18, 19); g.lineTo(tb + 18, 26)
  g.fillStyle = css(f.haupt, 0.12); g.fill(); linie(g, f, 0.8, 1); g.stroke()
  text(g, titel, 12, 17, { groesse: 11, farbe: f.haupt, a: 0.95, gewicht: 600, abstand: 1.2 })
  if (kennung) text(g, kennung, w - 8, 17, { groesse: 9, farbe: f.haupt, a: 0.5, schrift: MONO, ausrichtung: 'right' })
  // helle Eckwinkel
  linie(g, f, 1, 1.5)
  g.beginPath(); g.moveTo(w - 1, h - 22); g.lineTo(w - 1, h - 1); g.lineTo(w - 22, h - 1); g.stroke()
  g.beginPath(); g.moveTo(w - k - 1, 26); g.lineTo(w - 1, 26 + k); g.stroke()
  // Skalenstriche unten
  linie(g, f, 0.35, 1); for (let x = k + 8; x < w - 30; x += 8) { g.beginPath(); g.moveTo(x, h - 1); g.lineTo(x, h - (x % 40 === 0 ? 7 : 4)); g.stroke() }
}
// segmentierter Ring mit Teilbögen (wie in den Vorbildern)
function segmentRing(g, x, y, r, anteil, f, { segmente = 48, dicke = 6, luecke = 0.035, start = -Math.PI / 2, farbe } = {}) {
  for (let i = 0; i < segmente; i++) {
    const a0 = start + (i / segmente) * Math.PI * 2, a1 = a0 + (Math.PI * 2) / segmente - luecke, an = i / segmente < anteil
    g.strokeStyle = css(an ? (farbe ?? f.haupt) : f.haupt, an ? 0.9 : 0.12); g.lineWidth = dicke
    g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke()
  }
}
function skala(g, x, y, r, f, n = 72, lang = 6, a = 0.5) {
  linie(g, f, a, 1); for (let i = 0; i < n; i++) { const w = (i / n) * Math.PI * 2, l = i % 6 === 0 ? lang : lang / 2; g.beginPath(); g.moveTo(x + Math.cos(w) * r, y + Math.sin(w) * r); g.lineTo(x + Math.cos(w) * (r - l), y + Math.sin(w) * (r - l)); g.stroke() }
}
function teilbogen(g, x, y, r, a0, a1, f, a = 0.8, b = 1) { linie(g, f, a, b); g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke() }

// ---------- Anzeigen ----------
export const ZEICHNER = {
  // Werkstatt-Lage: große, dünne Zahlen
  lage(g, c, t, f) {
    const { w, h } = entwurf(g, c); hudRahmen(g, w, h, f, 'LAGE DER WERKSTATT', 'WS-01 · BEISPIELDATEN')
    const d = DATEN.aufgaben, felder = [['OFFENE AUFGABEN', d.offen, f.haupt], ['NEU SEIT GESTERN', d.neu, f.haupt], ['FREIGABEN', d.freigaben, f.akzent], ['PROBLEME', d.probleme, f.akzent]]
    felder.forEach(([name, wert, farbe], i) => {
      // je Feld: Ring links, Zahl rechts daneben, Beschriftung darunter – nichts überlappt
      const fw = (w - 40) / 4, x = 20 + i * fw, y = 40 + (h - 60) / 2, zaehl = Math.round(wert * klemm((t - 1.8 - i * 0.2) / 1.2)), rr = Math.min(26, fw * 0.16)
      skala(g, x + rr + 4, y, rr + 6, f, 36, 3, 0.35); segmentRing(g, x + rr + 4, y, rr, klemm(wert / 12), f, { segmente: 24, dicke: 3, farbe })
      text(g, String(zaehl).padStart(2, '0'), x + rr * 2 + 16, y + 18, { groesse: 52, gewicht: 200, farbe, a: 1 })
      linie(g, f, 0.5, 1); g.beginPath(); g.moveTo(x, y + rr + 14); g.lineTo(x + fw - 14, y + rr + 14); g.stroke()
      text(g, name, x, y + rr + 28, { groesse: 10, farbe: f.haupt, a: 0.7, abstand: 1.2 })
    })
    text(g, `STAND ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} · SYNC AUSSTEHEND`, w - 14, h - 14, { groesse: 9, farbe: f.haupt, a: 0.45, schrift: MONO, ausrichtung: 'right' })
  },
  // To-do-Karten als schräge Kacheln
  karten(g, c, t, f) {
    const { w, h } = entwurf(g, c); hudRahmen(g, w, h, f, 'AUFGABEN · OBERSTE KARTEN', 'TD-05')
    const zeilenH = (h - 46) / DATEN.karten.length
    DATEN.karten.forEach(([titel, bereich, fortschritt], i) => {
      const y = 36 + i * zeilenH, ein = raus(phase(t, 2 + i * 0.25, 2.6 + i * 0.25)), x0 = 14 + (1 - ein) * 40
      g.globalAlpha = ein
      g.beginPath(); g.moveTo(x0 + 10, y); g.lineTo(w - 16, y); g.lineTo(w - 16, y + zeilenH - 12); g.lineTo(x0, y + zeilenH - 12); g.lineTo(x0, y + 10); g.closePath()
      g.fillStyle = css(f.haupt, i === 0 ? 0.12 : 0.05); g.fill(); linie(g, f, i === 0 ? 0.8 : 0.35, 1); g.stroke()
      g.fillStyle = css(i < 2 ? f.akzent : f.haupt, 0.95); g.fillRect(x0 + 2, y + 12, 3, zeilenH - 26)
      text(g, titel.toUpperCase(), x0 + 16, y + zeilenH * 0.42, { groesse: 13, farbe: f.haupt, a: 0.95, gewicht: 500, abstand: 0.6 })
      text(g, bereich.toUpperCase(), x0 + 16, y + zeilenH * 0.42 + 15, { groesse: 9, farbe: f.haupt, a: 0.5, abstand: 1.2 })
      const bx = w - 190, bw = 150
      for (let s = 0; s < 20; s++) { g.fillStyle = css(f.haupt, s / 20 < fortschritt * klemm((t - 2.4 - i * 0.2) / 1.5) ? 0.85 : 0.12); g.fillRect(bx + s * (bw / 20), y + zeilenH * 0.3, bw / 20 - 2, 7) }
      text(g, `${Math.round(fortschritt * 100)} %`, w - 24, y + zeilenH * 0.42 + 15, { groesse: 10, farbe: f.haupt, a: 0.7, schrift: MONO, ausrichtung: 'right' })
      g.globalAlpha = 1
    })
  },
  // Yggdrasil: wächst mit Wurzeln und Krone, Knoten tragen Runen, die neun Welten als Beschriftung
  baum(g, c, t, f) {
    const { w, h } = entwurf(g, c); hudRahmen(g, w, h, f, 'YGGDRASIL · WELTENBAUM', 'DATENSTRUKTUR')
    const wachs = klemm((t - 1.6) / 6.5), mx = w / 2, boden = h * 0.62
    teilbogen(g, mx, boden - 10, h * 0.42, Math.PI * 1.08, Math.PI * 1.92, f, 0.25); teilbogen(g, mx, boden - 10, h * 0.46, Math.PI * 1.15, Math.PI * 1.85, f, 0.15)
    let nr = 0
    const ast = (x, y, laenge, winkel, tiefe, max, richtung) => {
      if (tiefe > max) return
      const p = klemm(wachs * (max + 1.5) - tiefe); if (p <= 0) return
      const x2 = x + Math.cos(winkel) * laenge * p, y2 = y + Math.sin(winkel) * laenge * p
      const krumm = (rauschen(tiefe * 3 + winkel) * 0.15) * laenge
      linie(g, f, klemm(0.95 - tiefe * 0.09), Math.max(0.8, 3.2 - tiefe * 0.45)); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + x2) / 2 + krumm, (y + y2) / 2, x2, y2); g.stroke()
      const id = nr++
      if (p >= 1 && tiefe >= max - 1) { const hell = Math.sin(t * 2.2 + id * 1.7) > 0.55; g.fillStyle = css(hell ? f.akzent : f.haupt, hell ? 1 : 0.65); g.beginPath(); g.arc(x2, y2, hell ? 2.6 : 1.8, 0, 7); g.fill() }
      const spreiz = richtung > 0 ? 0.42 : 0.5
      ast(x2, y2, laenge * 0.74, winkel - spreiz, tiefe + 1, max, richtung); ast(x2, y2, laenge * 0.74, winkel + spreiz, tiefe + 1, max, richtung)
      if (tiefe === 1 && richtung > 0) ast(x2, y2, laenge * 0.7, winkel, tiefe + 1, max, richtung)
    }
    ast(mx, boden, h * 0.16, -Math.PI / 2, 0, 6, 1) // Krone
    ast(mx, boden, h * 0.07, Math.PI / 2, 0, 4, -1) // Wurzeln
    const welten = [['ASGARD', 0.5, 0.1], ['VANAHEIM', 0.2, 0.2], ['ALFHEIM', 0.8, 0.2], ['MIDGARD', 0.12, 0.48], ['JÖTUNHEIM', 0.88, 0.48], ['MUSPELHEIM', 0.18, 0.78], ['NIFLHEIM', 0.82, 0.78], ['SVARTALFHEIM', 0.32, 0.92], ['HELHEIM', 0.68, 0.92]]
    welten.forEach(([n, u, v], i) => { const a = klemm((wachs - 0.3 - i * 0.06) * 4); if (a <= 0) return; text(g, n, u * w, 30 + v * (h - 40), { groesse: 9, farbe: i === 0 ? f.akzent : f.haupt, a: 0.75 * a, ausrichtung: 'center', abstand: 1.5 }); text(g, RUNEN[(i * 5) % RUNEN.length], u * w, 30 + v * (h - 40) + 14, { groesse: 13, farbe: f.haupt, a: 0.6 * a, schrift: RUNEN_SCHRIFT, ausrichtung: 'center' }) })
    text(g, `${Math.round(wachs * 127)} KNOTEN · ${Math.round(wachs * 9)} WELTEN`, w - 14, h - 14, { groesse: 9, farbe: f.haupt, a: 0.5, schrift: MONO, ausrichtung: 'right' })
  },
  // Umsatz 14 Tage: Flächendiagramm mit Verlauf
  umsatz(g, c, t, f) {
    const { w, h } = entwurf(g, c); hudRahmen(g, w, h, f, 'UMSATZ · LETZTE 14 TAGE', 'BEISPIELDATEN')
    const d = DATEN.umsatz14, x0 = 48, x1 = w - 20, y0 = 44, y1 = h - 34, max = 160, zeig = klemm((t - 1.8) / 2)
    linie(g, f, 0.12, 1); for (let k = 0; k <= 4; k++) { const y = y1 - (k / 4) * (y1 - y0); g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); text(g, `${k * 40}`, x0 - 8, y + 3, { groesse: 9, farbe: f.haupt, a: 0.45, schrift: MONO, ausrichtung: 'right' }) }
    const punkte = d.map((v, i) => [x0 + (i / (d.length - 1)) * (x1 - x0), y1 - (v / max) * (y1 - y0) * zeig])
    const verlauf = g.createLinearGradient(0, y0, 0, y1); verlauf.addColorStop(0, css(f.haupt, 0.45)); verlauf.addColorStop(1, css(f.haupt, 0.0))
    g.beginPath(); g.moveTo(x0, y1); punkte.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(x1, y1); g.closePath(); g.fillStyle = verlauf; g.fill()
    linie(g, f, 1, 1.5); g.beginPath(); punkte.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke()
    punkte.forEach(([x, y], i) => { g.fillStyle = css(i === d.length - 1 ? f.akzent : f.haupt, 1); g.beginPath(); g.arc(x, y, i === d.length - 1 ? 3.5 : 1.8, 0, 7); g.fill(); if (i % 2 === 0) text(g, `T-${d.length - 1 - i}`, x, y1 + 14, { groesse: 8, farbe: f.haupt, a: 0.45, schrift: MONO, ausrichtung: 'center' }) })
    const [lx, ly] = punkte.at(-1), dy = ly < 80 ? 26 : -22 // Beschriftung unter die Linie, wenn der Punkt oben liegt
    linie(g, f, 0.6, 1); g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx - 40, ly + dy); g.lineTo(lx - 150, ly + dy); g.stroke()
    text(g, `GESTERN ${DATEN.verkauf.umsatz.toFixed(2).replace('.', ',')} €`, lx - 150, ly + dy - 5, { groesse: 11, farbe: f.akzent, a: 1, gewicht: 600 })
  },
  // Verkäufe gestern: große Zahl + segmentierte Kanal-Balken
  verkauf(g, c, t, f) {
    const { w, h } = entwurf(g, c); hudRahmen(g, w, h, f, 'VERKÄUFE GESTERN', 'SH-02')
    const v = DATEN.verkauf, a = klemm((t - 2) / 1.2)
    text(g, String(Math.round(v.bestellungen * a)), 26, 118, { groesse: 92, gewicht: 200, farbe: f.haupt, a: 1 })
    text(g, 'BESTELLUNGEN', 30, 136, { groesse: 10, farbe: f.haupt, a: 0.65, abstand: 1.5 }); text(g, `${v.artikel} ARTIKEL · ${v.umsatz.toFixed(2).replace('.', ',')} €`, 30, 152, { groesse: 10, farbe: f.akzent, a: 0.9, abstand: 1 })
    v.kanaele.forEach(([name, n, anteil], i) => {
      const x = w * 0.42, y = 52 + i * 38, bw = w * 0.52
      text(g, name, x, y, { groesse: 10, farbe: f.haupt, a: 0.75, abstand: 1.2 }); text(g, String(n), x + bw, y, { groesse: 12, farbe: f.haupt, a: 0.95, schrift: MONO, ausrichtung: 'right' })
      for (let s = 0; s < 32; s++) { g.fillStyle = css(i === 0 ? f.akzent : f.haupt, s / 32 < anteil * a ? 0.85 : 0.1); g.fillRect(x + s * (bw / 32), y + 7, bw / 32 - 2, 9) }
    })
  },
  // Lager knapp: Liste mit Füllstand
  lager(g, c, t, f) {
    const { w, h } = entwurf(g, c); hudRahmen(g, w, h, f, 'LAGER · WIRD KNAPP', 'LG-04')
    DATEN.lager.forEach(([name, ist, soll], i) => {
      const y = 50 + i * ((h - 60) / DATEN.lager.length), a = klemm((t - 2.2 - i * 0.2) / 1)
      text(g, name.toUpperCase(), 18, y, { groesse: 11, farbe: f.haupt, a: 0.9, gewicht: 500, abstand: 0.5 })
      text(g, `${ist} / ${soll}`, w - 18, y, { groesse: 11, farbe: ist <= 2 ? f.akzent : f.haupt, a: 0.95, schrift: MONO, ausrichtung: 'right' })
      const bw = w - 36; linie(g, f, 0.25, 1); g.strokeRect(18, y + 7, bw, 8)
      g.fillStyle = css(ist <= 2 ? f.akzent : f.haupt, 0.85); g.fillRect(19, y + 8, (bw - 2) * (ist / soll) * a, 6)
    })
  },
  // Shops: drei segmentierte Ringe
  shops(g, c, t, f) {
    const { w, h } = entwurf(g, c); hudRahmen(g, w, h, f, 'SHOPS · STATUS', 'NET')
    DATEN.shops.forEach(([name, angebote, gesund], i) => {
      const x = w * (0.18 + i * 0.32), y = h * 0.55, r = Math.min(h * 0.3, 70), a = klemm((t - 2 - i * 0.25) / 1.4)
      skala(g, x, y, r + 10, f, 60, 5, 0.35)
      segmentRing(g, x, y, r, gesund * a, f, { segmente: 40, dicke: 5, farbe: gesund < 1 ? f.akzent : f.haupt })
      teilbogen(g, x, y, r - 12, t * 0.6 + i, t * 0.6 + i + 1.2, f, 0.7); teilbogen(g, x, y, r - 18, -t * 0.4 + i, -t * 0.4 + i + 0.6, f, 0.5)
      text(g, String(Math.round(angebote * a)), x, y + 6, { groesse: 26, gewicht: 300, farbe: f.haupt, a: 1, ausrichtung: 'center' })
      text(g, 'ANGEBOTE', x, y + 20, { groesse: 8, farbe: f.haupt, a: 0.55, ausrichtung: 'center', abstand: 1.2 })
      text(g, name, x, y + r + 26, { groesse: 11, farbe: f.haupt, a: 0.9, gewicht: 600, ausrichtung: 'center', abstand: 1.5 })
      text(g, gesund < 1 ? '1 FALL OFFEN' : 'ONLINE', x, y + r + 40, { groesse: 9, farbe: gesund < 1 ? f.akzent : f.haupt, a: 0.8, ausrichtung: 'center', abstand: 1 })
    })
  },
  // System: feine Ringe CPU/RAM/GPU + Kurve
  system(g, c, t, f) {
    const { w, h } = entwurf(g, c); hudRahmen(g, w, h, f, 'SYSTEM', 'RTX 4080 · 64 GB')
    ;[['CPU', 0.23], ['RAM', 0.29], ['GPU', 0.41]].forEach(([n, v], i) => {
      const x = 70 + i * 120, y = h * 0.52, r = 42, wert = klemm(v + 0.04 * rauschen(t * 1.3 + i))
      skala(g, x, y, r + 8, f, 48, 4, 0.3); segmentRing(g, x, y, r, wert, f, { segmente: 36, dicke: 4, farbe: i === 2 ? f.akzent : f.haupt })
      text(g, String(Math.round(wert * 100)), x, y + 7, { groesse: 20, gewicht: 300, farbe: f.haupt, ausrichtung: 'center', a: 1 }); text(g, n, x, y + r + 22, { groesse: 10, farbe: f.haupt, a: 0.7, ausrichtung: 'center', abstand: 1.5 })
    })
    const x0 = 420, x1 = w - 18, y0 = 50, y1 = h - 24
    linie(g, f, 0.12, 1); for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(x0, y0 + k * (y1 - y0) / 4); g.lineTo(x1, y0 + k * (y1 - y0) / 4); g.stroke() }
    linie(g, f, 0.95, 1); g.beginPath(); for (let x = x0; x <= x1; x += 3) g.lineTo(x, (y0 + y1) / 2 + rauschen(x * 0.04 + t * 2) * (y1 - y0) * 0.22); g.stroke()
    g.strokeStyle = css(f.akzent, 0.8); g.beginPath(); for (let x = x0; x <= x1; x += 3) g.lineTo(x, (y0 + y1) / 2 + 20 + rauschen(x * 0.07 + t * 3 + 5) * (y1 - y0) * 0.12); g.stroke()
  },
  // gepunkteter Globus (orthografisch)
  globus(g, c, t, f) {
    const { w, h } = entwurf(g, c); hudRahmen(g, w, h, f, 'NETZ · KUNDEN WELTWEIT', 'GEO')
    const x = w * 0.36, y = h * 0.56, r = Math.min(h * 0.36, w * 0.25), dreh = t * 0.35
    teilbogen(g, x, y, r + 10, 0, 7, f, 0.2); teilbogen(g, x, y, r + 16, dreh, dreh + 1.6, f, 0.6, 1.5)
    for (let br = -80; br <= 80; br += 8) for (let la = 0; la < 360; la += 6) {
      const b = (br * Math.PI) / 180, l = (la * Math.PI) / 180 + dreh, z = Math.cos(b) * Math.cos(l)
      if (z < 0) continue
      const px = x + r * Math.cos(b) * Math.sin(l), py = y - r * Math.sin(b), land = rauschen(la * 0.05 + br * 0.08) > 0.4
      g.fillStyle = css(land ? f.haupt : f.haupt, land ? 0.35 + z * 0.6 : 0.08 + z * 0.12); g.fillRect(px - 0.9, py - 0.9, land ? 2 : 1.4, land ? 2 : 1.4)
    }
    ;[['ÖHRINGEN', 9.5, 49.2, f.akzent], ['ETSY · USA', -95, 38, f.haupt], ['AMAZON · EU', 4, 50, f.haupt]].forEach(([n, la, br, farbe], i) => {
      const b = (br * Math.PI) / 180, l = (la * Math.PI) / 180 + dreh, z = Math.cos(b) * Math.cos(l); if (z < 0) return
      const px = x + r * Math.cos(b) * Math.sin(l), py = y - r * Math.sin(b)
      g.strokeStyle = css(farbe, 0.9); g.lineWidth = 1; g.beginPath(); g.arc(px, py, 4 + (t * 3 + i) % 4, 0, 7); g.stroke()
      g.beginPath(); g.moveTo(px, py); g.lineTo(w * 0.7, 48 + i * 30); g.lineTo(w - 20, 48 + i * 30); g.stroke()
      text(g, n, w - 20, 44 + i * 30, { groesse: 10, farbe, a: 0.9, ausrichtung: 'right', abstand: 1 })
    })
  },
  // Schaltkreis-Bahnen mit leuchtenden Knoten (wie Vorbild 1)
  schaltkreis(g, c, t, f) {
    const { w, h } = entwurf(g, c); hudRahmen(g, w, h, f, 'DATENFLUSS · KERN ↔ WERKSTATT', 'BUS')
    const z = zufall(31)
    for (let i = 0; i < 9; i++) {
      const y = 46 + i * ((h - 60) / 9), knick = 120 + z() * (w - 260), ziel = 46 + z() * (h - 70)
      const p = [[14, y], [knick, y], [knick + Math.abs(ziel - y) * 0.6, ziel], [w - 18, ziel]]
      linie(g, f, 0.35, 1); g.beginPath(); p.forEach(([x, yy], k) => (k ? g.lineTo(x, yy) : g.moveTo(x, yy))); g.stroke()
      g.strokeStyle = css(f.haupt, 0.9); g.beginPath(); g.arc(14, y, 3, 0, 7); g.stroke(); g.beginPath(); g.arc(w - 18, ziel, 3, 0, 7); g.stroke()
      const q = (t * 0.45 + i * 0.17) % 1, laenge = [0, 1, 2].reduce((s, k) => s + Math.hypot(p[k + 1][0] - p[k][0], p[k + 1][1] - p[k][1]), 0)
      let rest = q * laenge
      for (let k = 0; k < 3; k++) { const d = Math.hypot(p[k + 1][0] - p[k][0], p[k + 1][1] - p[k][1]); if (rest <= d) { const u = rest / d, x = p[k][0] + (p[k + 1][0] - p[k][0]) * u, yy = p[k][1] + (p[k + 1][1] - p[k][1]) * u; const lp = g.createRadialGradient(x, yy, 0, x, yy, 10); lp.addColorStop(0, css(i % 3 ? f.haupt : f.akzent, 1)); lp.addColorStop(1, css(f.haupt, 0)); g.fillStyle = lp; g.fillRect(x - 10, yy - 10, 20, 20); break } rest -= d }
    }
  },
  // Lokis Stimme (unten Mitte)
  welle(g, c, t, f) {
    const { w, h } = entwurf(g, c), dat = tonQuelle().welle
    for (const [spiegel, a] of [[1, 1], [-1, 0.35]]) {
      linie(g, f, a, 1.2); g.beginPath()
      for (let i = 0; i <= 200; i++) { const v = dat ? (dat[Math.floor((i / 200) * dat.length)] - 128) / 128 : 0.05 * Math.sin(i * 0.35 + t * 7) * Math.sin(i * 0.05); const huell = Math.sin((i / 200) * Math.PI); g.lineTo((i / 200) * w, h / 2 + spiegel * v * h * 0.45 * huell) }
      g.stroke()
    }
    text(g, dat ? 'LOKI SPRICHT' : 'STIMMKERN BEREIT', 8, 12, { groesse: 10, farbe: f.akzent, a: 0.9, abstand: 1.5 })
  },
  uhr(g, c, t, f) {
    const { w, h } = entwurf(g, c), d = new Date()
    text(g, d.toLocaleTimeString('de-DE'), w / 2, h * 0.62, { groesse: h * 0.6, gewicht: 200, farbe: f.haupt, a: 1, ausrichtung: 'center', abstand: 4 })
    text(g, `${d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' }).toUpperCase()}  ·  ÖHRINGEN 6 °C  NIESELREGEN`, w / 2, h * 0.92, { groesse: h * 0.14, farbe: f.haupt, a: 0.7, ausrichtung: 'center', abstand: 2 })
  },
  // kleine Kennzeichnungen am Reaktor mit Leitlinie zur Mitte
  marke(g, c, t, f, nr) {
    const { w, h } = entwurf(g, c), links = nr % 2 === 0, oben = nr < 2
    const namen = [['KERN', `${Math.round(97 + rauschen(t))} %`], ['RUNEN-MATRIX', 'STABIL'], ['SCHILDWALL', 'AKTIV'], ['STIMMKERN', 'BEREIT']][nr]
    const ax = links ? w - 6 : 6, ay = oben ? h - 6 : 6, kx = links ? w * 0.55 : w * 0.45
    linie(g, f, 0.7, 1); g.beginPath(); g.moveTo(ax, ay); g.lineTo(kx, h / 2); g.lineTo(links ? 10 : w - 10, h / 2); g.stroke()
    g.fillStyle = css(f.akzent, 1); g.beginPath(); g.arc(ax, ay, 3, 0, 7); g.fill()
    text(g, namen[0], links ? 10 : w - 10, h / 2 - 8, { groesse: 16, farbe: f.haupt, a: 0.9, gewicht: 600, ausrichtung: links ? 'left' : 'right', abstand: 2 })
    text(g, namen[1], links ? 10 : w - 10, h / 2 + 22, { groesse: 18, farbe: f.akzent, a: 1, schrift: MONO, ausrichtung: links ? 'left' : 'right' })
  },
  band(g, c, t, f) {
    const { w, h } = entwurf(g, c)
    g.font = `14px ${RUNEN_SCHRIFT}`; g.letterSpacing = '3px'
    const s = `${LOKI} · SYSTEME NOMINAL · RUNEN-MATRIX STABIL · WERKSTATT-SYNC AUSSTEHEND · ${RUNEN} · BENUTZER ANWESEND – LEIDER · `
    const b = g.measureText(s).width, x = -((t * 60) % b)
    g.fillStyle = css(f.haupt, 0.55); for (let k = 0; k < Math.ceil(w / b) + 2; k++) g.fillText(s, x + k * b, h * 0.72)
    g.letterSpacing = '0px'
    linie(g, f, 0.3, 1); g.beginPath(); g.moveTo(0, 1); g.lineTo(w, 1); g.stroke()
  },
}
