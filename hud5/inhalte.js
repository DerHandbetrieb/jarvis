// Inhalte in den Fenstern der Szene „Mystic Aurora“ (05.11.2026, Belegung vom Auftraggeber bestätigt, siehe
// recherche/grafik-v5-bestand-2026-11-05.md). Die Fenster sind schräg gestellte Vierecke (Perspektive): jeder Inhalt
// wird flach in eine eigene Leinwand gezeichnet und dann in senkrechten Streifen in sein Viereck gelegt. Alles wird
// live gezeichnet – gestochen scharf, egal wie die Grafik darunter aussieht. Ruhige Inhalte werden nur bei neuen Daten
// neu gezeichnet, Tonwellen und Kameras jedes Bild.
// Links Werkstatt: Verkäufe (groß), Umsatz, Tonwellen, Abarbeiten, letzte Bestellungen.
// Rechts Haus (gespiegelte Fenster): CAM 01, CAM 02, Energie (FENECON), Wetter, Systemstatus.

const B = 5760, H = 1080
import { symbol, auto } from './pv-zeichen.js'
const CYAN = '#5ff6ff', GOLD = '#f2b04a', ROT = '#ff5a4a', HELL = '#e8fdff', BLASS = 'rgba(165,230,240,0.62)'
const SCHRIFT = 'Bahnschrift, "Segoe UI", Arial, sans-serif'

// Fenster links, vermessen an den Inhalts-Ebenen des Grafikpakets (Ecken: oben-links, oben-rechts, unten-rechts, unten-links)
const LINKS = {
  verkaeufe: [[350, 177], [924, 221], [942, 433], [350, 409]],
  umsatz: [[984, 238], [1446, 288], [1480, 451], [986, 407]],
  ton: [[354, 476], [1491, 499], [1503, 630], [354, 624]],
  aufgaben: [[356, 680], [944, 682], [970, 934], [364, 944]],
  bestellungen: [[1010, 678], [1533, 692], [1567, 928], [1014, 942]],
}
/** rechter Bildschirm = gespiegelter linker: Ecken spiegeln und Reihenfolge wieder auf oben-links… bringen */
const spiegel = (q) => [[B - q[1][0], q[1][1]], [B - q[0][0], q[0][1]], [B - q[3][0], q[3][1]], [B - q[2][0], q[2][1]]]
export const FENSTER = {
  ...LINKS,
  kamera1: spiegel(LINKS.umsatz), // oben innen
  kamera2: spiegel(LINKS.verkaeufe), // oben außen
  energie: spiegel(LINKS.ton),
  wetter: spiegel(LINKS.bestellungen), // unten innen
  system: spiegel(LINKS.aufgaben), // unten außen
}
const EINZUG = 9 // Abstand des Inhalts vom Rahmen

function leinwand(b, h) { const c = document.createElement('canvas'); c.width = Math.round(b); c.height = Math.round(h); return c }
const lerp = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
/** Viereck etwas nach innen ziehen */
function einziehen(q, d) {
  const m = q.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0])
  return q.map(([x, y]) => { const l = Math.hypot(x - m[0], y - m[1]); return [x + ((m[0] - x) / l) * d * 1.4, y + ((m[1] - y) / l) * d] })
}
/** flache Größe eines Fensters (Pixel) */
function groesse(q) {
  return [Math.max(Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]), Math.hypot(q[2][0] - q[3][0], q[2][1] - q[3][1])),
    Math.max(Math.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]), Math.hypot(q[2][0] - q[1][0], q[2][1] - q[1][1]))]
}
/** flache Leinwand in das schräge Viereck legen (senkrechte Streifen, je Streifen oben/unten an den Kanten) */
function verzerren(g, quelle, q, streifen = 36) {
  const b = quelle.width, h = quelle.height
  for (let i = 0; i < streifen; i++) {
    const u0 = i / streifen, u1 = (i + 1) / streifen
    const o0 = lerp(q[0], q[1], u0), o1 = lerp(q[0], q[1], u1), n0 = lerp(q[3], q[2], u0), n1 = lerp(q[3], q[2], u1)
    const x = (o0[0] + n0[0]) / 2, xb = (o1[0] + n1[0]) / 2, y = (o0[1] + o1[1]) / 2, yb = (n0[1] + n1[1]) / 2
    g.drawImage(quelle, u0 * b, 0, (u1 - u0) * b, h, x, y, xb - x + 0.6, yb - y)
  }
}
/** dunkle Glasfläche im Fenster (deckt die gemalten Platzhalter ab) */
function glas(g, q) {
  g.save(); g.beginPath(); q.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath()
  const v = g.createLinearGradient(q[0][0], q[0][1], q[3][0], q[3][1])
  v.addColorStop(0, 'rgba(6,26,34,0.9)'); v.addColorStop(1, 'rgba(2,12,18,0.94)')
  g.fillStyle = v; g.fill()
  g.strokeStyle = 'rgba(95,246,255,0.18)'; g.lineWidth = 1; g.stroke(); g.restore()
}

// ---------- kleine Zeichenhelfer ----------
function text(g, t, x, y, groesse, farbe = HELL, ausr = 'left', gewicht = 400) {
  g.font = `${gewicht} ${groesse}px ${SCHRIFT}`; g.fillStyle = farbe; g.textAlign = ausr; g.textBaseline = 'alphabetic'; g.fillText(t, x, y)
}
function kopf(g, titel, rechts, b) {
  text(g, titel, 14, 24, 14, CYAN, 'left', 600)
  if (rechts) text(g, rechts, b - 14, 24, 14, GOLD, 'right', 600)
  g.strokeStyle = 'rgba(95,246,255,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(14, 32.5); g.lineTo(b - 14, 32.5); g.stroke()
}
const euro = (v) => `${Math.round(v).toLocaleString('de-DE')} €`
function kuerzen(g, t, breite) {
  if (g.measureText(t).width <= breite) return t
  while (t.length > 1 && g.measureText(t + '…').width > breite) t = t.slice(0, -1)
  return t + '…'
}
function beispielMarke(g, b, h, wort = 'BEISPIEL') { text(g, wort, b - 14, h - 10, 12, 'rgba(242,176,74,0.9)', 'right', 600) }

// ---------- Inhalte links (Werkstatt) ----------
function verkaeufe(g, b, h, d) {
  const tage = d.tage ?? [], summe7 = tage.slice(-7).reduce((s, t) => s + t.umsatz, 0)
  kopf(g, 'VERKÄUFE · 14 TAGE', `7 TAGE ${euro(summe7)}`, b)
  const x0 = 46, x1 = b - 18, y0 = 44, y1 = h - 30, n = Math.max(1, tage.length)
  const maxU = Math.max(10, ...tage.map((t) => t.umsatz)), maxB = Math.max(1, ...tage.map((t) => t.bestellungen))
  g.strokeStyle = 'rgba(95,246,255,0.1)'
  for (let i = 0; i <= 4; i++) { const y = Math.round(y1 - ((y1 - y0) * i) / 4) + 0.5; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); if (i) text(g, euro((maxU * i) / 4), x0 - 6, y + 4, 10, BLASS, 'right') }
  const sb = (x1 - x0) / n
  tage.forEach((t, i) => { // Balken = Umsatz je Tag
    const hb = ((y1 - y0) * t.umsatz) / maxU, x = x0 + i * sb + sb * 0.18
    const v = g.createLinearGradient(0, y1 - hb, 0, y1); v.addColorStop(0, 'rgba(95,246,255,0.95)'); v.addColorStop(1, 'rgba(30,120,150,0.35)')
    g.fillStyle = v; g.fillRect(x, y1 - hb, sb * 0.64, hb)
    if (i % 2 === n % 2) text(g, t.tag, x + sb * 0.32, h - 12, 10, BLASS, 'center')
  })
  // Linie = Bestellungen je Tag (Gold)
  g.strokeStyle = GOLD; g.lineWidth = 1.6; g.beginPath()
  tage.forEach((t, i) => { const x = x0 + (i + 0.5) * sb, y = y1 - ((y1 - y0) * 0.92 * t.bestellungen) / maxB; i ? g.lineTo(x, y) : g.moveTo(x, y) }); g.stroke()
  g.fillStyle = GOLD; tage.forEach((t, i) => { const x = x0 + (i + 0.5) * sb, y = y1 - ((y1 - y0) * 0.92 * t.bestellungen) / maxB; g.beginPath(); g.arc(x, y, 2.4, 0, Math.PI * 2); g.fill() })
  text(g, '▮ UMSATZ  ', x0, y0 - 2 + 12, 10, CYAN); text(g, '● BESTELLUNGEN', x0 + 64, y0 + 10, 10, GOLD)
}
function umsatz(g, b, h, d) {
  // heute statt gestern (Wunsch Auftraggeber 05.11.2026: gestern steht schon in den Verkäufen daneben)
  kopf(g, 'UMSATZ · HEUTE', d.stand ? `STAND ${d.stand}` : '', b)
  const heute = d.heute ?? { umsatz: 0, bestellungen: 0, stueck: 0 }, nb = heute.bestellungen
  text(g, euro(heute.umsatz), 16, 94, 36, HELL, 'left', 600)
  text(g, `${nb} ${nb === 1 ? 'BESTELLUNG' : 'BESTELLUNGEN'} · ${heute.stueck} STÜCK`, 16, 116, 12, CYAN)
  // Mini-Verlauf 14 Tage (Fläche)
  const tage = d.tage ?? [], x0 = 16, x1 = b - 16, y0 = 124, y1 = h - 14, maxU = Math.max(10, ...tage.map((t) => t.umsatz))
  if (tage.length > 1) {
    const pkt = tage.map((t, i) => [x0 + ((x1 - x0) * i) / (tage.length - 1), y1 - ((y1 - y0) * t.umsatz) / maxU])
    const v = g.createLinearGradient(0, y0, 0, y1); v.addColorStop(0, 'rgba(95,246,255,0.45)'); v.addColorStop(1, 'rgba(95,246,255,0)')
    g.beginPath(); g.moveTo(x0, y1); pkt.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(x1, y1); g.closePath(); g.fillStyle = v; g.fill()
    g.beginPath(); pkt.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = CYAN; g.lineWidth = 1.4; g.stroke()
  }
}
function abarbeiten(g, b, h, d) {
  kopf(g, 'ABARBEITEN · DRINGEND ZUERST', `${d.offen ?? 0} OFFEN`, b)
  // bis zu 10 Karten (Wunsch Auftraggeber 05.11.2026); Zeilenhöhe passt sich an, Schrift bleibt ≥ 13 px
  const karten = (d.karten ?? []).slice(0, 10), zeile = Math.min(36, Math.max(24, (h - 46) / Math.max(1, karten.length)))
  const gross = Math.round(Math.min(15, Math.max(13, zeile * 0.52)))
  if (!karten.length) text(g, 'Nichts Dringendes – erstaunlich.', 16, 64, 14, BLASS)
  karten.forEach(([titel, , , faellig], i) => {
    const y = 40 + i * zeile, mitte = y + zeile / 2, kb = Math.round(gross * 0.8)
    g.strokeStyle = 'rgba(95,246,255,0.55)'; g.lineWidth = 1.2; g.strokeRect(16.5, Math.round(mitte - kb / 2) + 0.5, kb, kb)
    g.font = `600 11px ${SCHRIFT}`
    const farbe = faellig === 'ÜBERFÄLLIG' ? ROT : faellig === 'FÄLLIG HEUTE' ? GOLD : BLASS
    const badgeB = faellig ? g.measureText(faellig).width + 18 : 0
    g.font = `400 ${gross}px ${SCHRIFT}`
    text(g, kuerzen(g, String(titel), b - 52 - badgeB), 36, mitte + gross * 0.36, gross, HELL)
    if (faellig) text(g, faellig, b - 16, mitte + 4, 11, farbe, 'right', 600)
    g.strokeStyle = 'rgba(95,246,255,0.08)'; g.beginPath(); g.moveTo(16, y + zeile - 0.5); g.lineTo(b - 16, y + zeile - 0.5); g.stroke()
  })
}
/** aktuelle Bestellungen: alles, was in Billbee noch nicht versendet ist (Wunsch Auftraggeber 05.11.2026), älteste zuerst */
function bestellungen(g, b, h, d) {
  const o = d.offeneBestellungen
  kopf(g, 'AKTUELLE BESTELLUNGEN', o ? `${o.anzahl} OFFEN` : '', b)
  const liste = (o?.liste ?? []).slice(0, 10)
  if (!o) { text(g, 'Noch keine Daten aus Billbee.', 16, 64, 13, BLASS); return }
  if (!liste.length) { text(g, 'Alles versendet – die Werkstatt hat Pause. Theoretisch.', 16, 64, 13, BLASS); return }
  const zeile = Math.min(36, Math.max(24, (h - 46) / liste.length)), gross = Math.round(Math.min(14, Math.max(13, zeile * 0.5)))
  liste.forEach((x, i) => {
    const y = 40 + i * zeile, grund = y + zeile / 2 + gross * 0.36, am = new Date(x.am)
    const tag = Number.isFinite(am.getTime()) ? am.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' }) : ''
    const st = String(x.status)
    text(g, tag, 16, grund, 12, BLASS)
    text(g, String(x.kanal).toUpperCase().slice(0, 8), 62, grund, 11, CYAN, 'left', 600)
    text(g, st.slice(0, 11), 134, grund, 10, st === 'GEPACKT' ? CYAN : st.includes('MAHNUNG') || st.includes('ERINNERUNG') ? ROT : GOLD, 'left', 600)
    g.font = `400 ${gross}px ${SCHRIFT}`
    text(g, kuerzen(g, x.artikel || '–', b - 330), 232, grund, gross, HELL)
    text(g, euro(x.cent / 100), b - 16, grund, gross, GOLD, 'right', 600)
    g.strokeStyle = 'rgba(95,246,255,0.08)'; g.beginPath(); g.moveTo(16, y + zeile - 0.5); g.lineTo(b - 16, y + zeile - 0.5); g.stroke()
  })
}
/**
 * PC-Ton als Balken von unten nach oben (Wunsch Auftraggeber 05.11.2026: „wie man das kennt“, flüssig statt ruckig).
 * 48 Balken, Bass links, Höhen rechts (Tonbereiche logarithmisch verteilt). Die Werte kommen nur etwa 20–30-mal je
 * Sekunde – darum wird jedes Bild weich nachgeführt: schnell hoch, langsam runter; dazu fallende Spitzen-Marken.
 * Spricht L.O.K.I., leuchten die Balken golden.
 */
const BALKEN = 48, anzeige = new Float32Array(BALKEN), spitze = new Float32Array(BALKEN)
let letztesBild = 0
function tonwellen(g, b, h, ton, t, loki, tonStatus) {
  const pegel = ton ? Math.max(...Array.from(ton, Number).map((v) => (Number.isFinite(v) ? v : 0))) : 0
  const spricht = loki?.zustand === 'spricht'
  kopf(g, 'AUDIO', spricht ? 'L.O.K.I. SPRICHT' : ton && pegel > 0.01 ? 'PC-TON' : tonStatus ?? 'STILLE', b)
  const jetzt = performance.now(), dt = Math.min(0.1, Math.max(0.005, (jetzt - (letztesBild || jetzt)) / 1000)); letztesBild = jetzt
  const x0 = 16, x1 = b - 16, unten = h - 12, oben = 42, hoehe = unten - oben, breite = (x1 - x0) / BALKEN
  for (let i = 0; i < BALKEN; i++) {
    // Tonbereich i: gestaucht über die 64 Bänder (Bass bekommt mehr Balken, jeder Balken eigene Bänder)
    const a = Math.floor(Math.pow(i / BALKEN, 1.6) * 63), e = Math.max(a + 1, Math.floor(Math.pow((i + 1) / BALKEN, 1.6) * 63))
    let ziel = 0
    if (ton) for (let k = a; k < e; k++) ziel = Math.max(ziel, Math.min(1, ((Number(ton[k]) || 0) + (Number(ton[64 + k]) || 0)) / 2))
    if (spricht && !ton) ziel = 0.25 + 0.35 * Math.abs(Math.sin(t * 6 + i * 0.4) * Math.sin(t * 2.3 + i * 0.13))
    ziel = Math.pow(ziel, 0.8) // leise Töne etwas sichtbarer
    const k = ziel > anzeige[i] ? 1 - Math.exp(-dt * 28) : 1 - Math.exp(-dt * 5) // schnell hoch, langsam runter
    anzeige[i] += (ziel - anzeige[i]) * k
    spitze[i] = Math.max(anzeige[i], spitze[i] - dt * 0.35)
  }
  // Farbe je Tonbereich (Wunsch Auftraggeber 05.11.2026): Bässe dunkelrot, Mitten Türkis (Hausfarbe), Höhen weiß – weich verlaufend
  const mische = (a, b, f) => a.map((v, k) => Math.round(v + (b[k] - v) * f))
  const farbeVon = (i) => { const f = i / (BALKEN - 1); return spricht ? [242, 176, 74] : f < 0.5 ? mische([150, 18, 32], [95, 246, 255], f / 0.5) : mische([95, 246, 255], [240, 250, 255], (f - 0.5) / 0.5) }
  g.save()
  for (let i = 0; i < BALKEN; i++) {
    const x = x0 + i * breite + 1, bw = Math.max(1, breite - 3), hb = Math.max(1.5, anzeige[i] * hoehe), farbe = farbeVon(i)
    const v = g.createLinearGradient(0, unten - hb, 0, unten)
    v.addColorStop(0, `rgba(${farbe},0.95)`); v.addColorStop(1, `rgba(${farbe},0.25)`)
    g.fillStyle = v; g.fillRect(x, unten - hb, bw, hb)
    if (spitze[i] > 0.02) { g.fillStyle = `rgba(${farbe},0.9)`; g.fillRect(x, unten - spitze[i] * hoehe - 3, bw, 2) }
  }
  g.restore()
  g.strokeStyle = 'rgba(95,246,255,0.25)'; g.beginPath(); g.moveTo(x0, unten + 0.5); g.lineTo(x1, unten + 0.5); g.stroke()
}

// ---------- Inhalte rechts (Haus) ----------
function kamera(g, b, h, bild, name, alarm, t) {
  g.fillStyle = '#020a0e'; g.fillRect(0, 0, b, h)
  if (bild) { // Bild füllt das Fenster (mittig beschnitten)
    const f = Math.max(b / bild.width, h / bild.height), bw = bild.width * f, bh = bild.height * f
    g.drawImage(bild, (b - bw) / 2, (h - bh) / 2, bw, bh)
  } else {
    text(g, 'KEIN SIGNAL', b / 2, h / 2 + 6, 18, BLASS, 'center', 600)
  }
  // ohne Namenszeile und dunklen Balken (Wunsch Auftraggeber 05.11.2026) – nur „LIVE“ oben rechts, mit Schatten lesbar
  if (bild) {
    g.save(); g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 6
    g.fillStyle = ROT; g.beginPath(); g.arc(b - 50, 15, 4, 0, Math.PI * 2); g.fill(); text(g, 'LIVE', b - 14, 20, 12, HELL, 'right', 600)
    g.restore()
  }
  if (alarm) {
    const p = 0.5 + 0.5 * Math.sin(t * 6)
    g.strokeStyle = `rgba(255,90,74,${0.5 + 0.5 * p})`; g.lineWidth = 4; g.strokeRect(2, 2, b - 4, h - 4)
    g.fillStyle = 'rgba(120,10,0,0.55)'; g.fillRect(0, h - 30, b, 30); text(g, 'PERSON ERKANNT', b / 2, h - 10, 14, HELL, 'center', 600)
  }
}
/**
 * Energiefluss der PV-Anlage (FENECON, 05.11.2026, Werte von L.O.K.I. über /hud → pv): PV, Akku, Haus, Netz als Knoten;
 * Lichtpunkte laufen in Flussrichtung, umso schneller und dichter, je mehr Leistung fließt. Akku als Ring mit Ladestand.
 * Vorzeichen laut FENECON: Akku + = entladen, − = laden; Netz + = Bezug, − = Einspeisung.
 */
const kw = (w) => (w == null ? '–' : Math.abs(w) >= 1000 ? `${(Math.abs(w) / 1000).toFixed(1).replace('.', ',')} kW` : `${Math.round(Math.abs(w))} W`)
/** PV-Anlage (Wahl Auftraggeber 05.11.2026: Entwurf 7 „Drei Spalten“) – links Erzeugung, in der breiten Mitte groß das
 *  Haus (kaum Leuchten), rechts Speicher/Verkauf/Auto. Lichtpunkte laufen in Flussrichtung, Farbe nach Herkunft: Sonnenstrom
 *  grün, Akku türkis, Netzbezug rot; der Strommast selbst bleibt grau. Auto: Wallbox kommt später (Werte dann aus FENECON). */
function energie(g, b, h, pv, t) {
  const stoerung = pv && pv.zustand >= 3, warnung = pv && pv.zustand === 2
  kopf(g, 'ENERGIE · PV-ANLAGE', !pv ? 'NICHT VERBUNDEN' : stoerung ? 'STÖRUNG' : warnung ? 'WARNUNG' : pv.inselbetrieb ? 'INSELBETRIEB' : 'LIVE', b)
  const GR = '#5dff8a', NETZROT = '#ff4a3a', MASTF = 'rgba(205,225,232,0.85)', AUS = 'rgba(165,230,240,0.35)'
  const s1 = b * 0.24, s2 = b * 0.76, xl = s1 / 2, xm = b / 2, xr = (s2 + b) / 2, o = 34, hh = h - o, zeile = (f) => o + hh * f
  for (const [x, n] of [[xl, 'ERZEUGUNG'], [xm, 'HAUS'], [xr, 'SPEICHER & ABGABE']]) text(g, n, x, o + 18, 10, BLASS, 'center', 600)
  g.strokeStyle = 'rgba(95,246,255,0.1)'; g.lineWidth = 1
  for (const x of [s1, s2]) { g.beginPath(); g.moveTo(Math.round(x) + 0.5, o + 8); g.lineTo(Math.round(x) + 0.5, h - 8); g.stroke() }
  const zahl = (w) => (pv ? kw(w) : '–'), pvW = Math.max(0, pv?.pvW ?? 0), akkuW = pv?.akkuW ?? 0, netzW = pv?.netzW ?? 0, soc = pv?.akku
  const yH = zeile(0.46), hausGr = Math.min(s2 - s1 - 70, hh * 0.56), rand = hausGr * 0.42
  // Fluss: Linie + Lichtpunkte; w > 0 läuft von a nach z, w < 0 zurück
  const fluss = ([x1, y1], [x2, y2], w, farbe) => {
    const an = Math.abs(w) >= 20
    g.strokeStyle = an ? farbe + '55' : 'rgba(95,246,255,0.12)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke()
    if (!an) return
    const anzahl = Math.min(8, 2 + Math.round(Math.abs(w) / 800)), tempo = 0.25 + Math.min(1.2, Math.abs(w) / 4000)
    for (let i = 0; i < anzahl; i++) {
      let f = ((t * tempo + i / anzahl) % 1) * 0.9 + 0.05; if (w < 0) f = 1 - f
      const x = x1 + (x2 - x1) * f, y = y1 + (y2 - y1) * f, v = g.createRadialGradient(x, y, 0, x, y, 6)
      v.addColorStop(0, farbe); v.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = v; g.fillRect(x - 6, y - 6, 12, 12)
    }
  }
  const eintrag = (art, x, y, gr, farbe, name, w, wertFarbe, zusatz = '') => {
    if (art === 'auto') auto(g, x, y, gr, farbe, 0.12); else symbol(g, art, x, y, gr, farbe, soc ?? 0, 0.18)
    text(g, name, x, y + gr * 0.62 + 12, 10, BLASS, 'center', 600)
    text(g, zahl(w), x, y + gr * 0.62 + 31, 17, wertFarbe, 'center', 600)
    if (zusatz) text(g, zusatz, x, y + gr * 0.62 + 44, 9, wertFarbe, 'center', 600)
  }
  // links: Erzeugung
  const ySo = zeile(0.3), yNb = zeile(0.72), bezug = Math.max(0, netzW)
  fluss([xl + 30, ySo], [xm - rand, yH - hausGr * 0.08], pvW, GR); fluss([xl + 30, yNb], [xm - rand, yH + hausGr * 0.2], bezug, NETZROT)
  eintrag('sonne', xl, ySo - 10, 44, GR, 'SONNE', pvW, GR)
  eintrag('mast', xl, yNb - 10, 42, MASTF, 'NETZBEZUG', bezug, bezug > 20 ? NETZROT : AUS)
  // rechts: Speicher und Abgabe
  const yAk = zeile(0.2), yVk = zeile(0.5), yAu = zeile(0.8), verkauf = Math.max(0, -netzW), laedt = akkuW < -20, entlaedt = akkuW > 20
  const akkuF = soc != null && soc < 15 ? ROT : CYAN
  fluss([xm + rand, yH - hausGr * 0.12], [xr - 30, yAk], -akkuW, laedt ? GR : CYAN)
  fluss([xm + rand, yH + hausGr * 0.04], [xr - 30, yVk], verkauf, GR)
  fluss([xm + rand, yH + hausGr * 0.2], [xr - 30, yAu], 0, AUS)
  eintrag('akku', xr, yAk - 8, 36, akkuF, soc != null ? `AKKU ${Math.round(soc)} %` : 'AKKU', akkuW, akkuF, laedt ? 'LÄDT' : entlaedt ? 'ENTLÄDT' : '')
  eintrag('mast', xr, yVk - 8, 36, MASTF, 'VERKAUF', verkauf, verkauf > 20 ? GR : AUS)
  eintrag('auto', xr, yAu - 8, 40, AUS, 'AUTO', 0, AUS, 'NICHT VERBUNDEN')
  // Mitte: Haus groß, kaum Leuchten
  symbol(g, 'haus', xm, yH - 8, hausGr, HELL, 0, 0.04)
  text(g, zahl(pv?.hausW), xm, yH + hausGr * 0.42 + 22, 26, HELL, 'center', 600)
  const aut = pv && pv.hausW > 0 ? Math.round(Math.max(0, Math.min(1, 1 - bezug / pv.hausW)) * 100) : null
  text(g, aut != null ? `VERBRAUCH · AUTARKIE ${aut} %` : 'VERBRAUCH', xm, yH + hausGr * 0.42 + 40, 10, BLASS, 'center', 600)
}
function wetter(g, b, h, w) {
  kopf(g, 'WETTER · ' + (w?.ort ?? 'ÖHRINGEN').toUpperCase(), '', b)
  if (!w || !Number.isFinite(w.grad)) { text(g, 'Keine Wetterdaten', 16, 70, 14, BLASS); return }
  text(g, `${Math.round(w.grad)}°`, 18, 112, 56, HELL, 'left', 300)
  text(g, w.text ?? '', 130, 78, 16, CYAN, 'left', 600)
  const st = w.station, k = (v, e) => (v == null ? '–' : `${String(Math.round(v * 10) / 10).replace('.', ',')} ${e}`)
  if (st) {
    const zeilen = [['FEUCHTE', k(st.feuchte, '%')], ['WIND', `${k(st.wind, 'km/h')}${st.boe != null ? ' · Böen ' + k(st.boe, '') : ''}`], ['LUFTDRUCK', k(st.druck, 'hPa')], ['REGEN HEUTE', k(st.regenHeute, 'mm')]]
    zeilen.forEach(([n, v], i) => { const y = 150 + i * 30; text(g, n, 18, y, 11, BLASS); text(g, v, b - 16, y, 14, HELL, 'right', 600) })
    text(g, 'Quelle: eigene Wetterstation (Ecowitt)', 16, h - 14, 11, BLASS)
  } else {
    text(g, w.wolken != null ? `Bewölkung ${Math.round(w.wolken)} %` : '', 130, 100, 13, BLASS)
    text(g, 'Wetterstation: noch nicht verbunden · Quelle Open-Meteo', 16, h - 14, 11, BLASS)
  }
}
function system(g, b, h, d) {
  const z = d.loki?.zustand ?? 'aus'
  const zeilen = [
    ['L.O.K.I.', { bereit: 'HÖRT ZU', spricht: 'SPRICHT', denkt: 'DENKT NACH', laedt: 'LÄDT', aus: 'AUS', fehler: 'STÖRUNG' }[z] ?? z.toUpperCase(), z === 'fehler' ? ROT : CYAN],
    ['MIKROFON', d.loki?.mikrofon ? 'AN' : 'AUS', d.loki?.mikrofon ? CYAN : GOLD],
    ['WERKSTATT', d.verbunden ? `VERBUNDEN · ${d.stand ?? ''}` : 'NICHT VERBUNDEN', d.verbunden ? CYAN : GOLD],
    ['KAMERA', d.kamera ? 'BEREIT' : 'NICHT EINGERICHTET', d.kamera ? CYAN : BLASS],
    ['SELBSTTEST', d.selbsttest ?? '–', d.selbsttestRot ? ROT : CYAN],
  ]
  if (h < 120) { // schmaler Streifen (rechter Bildschirm, 05.11.2026): alles in einer Zeile
    text(g, 'SYSTEM · L.O.K.I.', 16, h / 2 + 5, 13, CYAN, 'left', 600)
    const x0 = 190, sp = (b - x0 - 90) / zeilen.length
    zeilen.forEach(([n, wert, farbe], i) => {
      const x = x0 + i * sp
      text(g, n, x, h / 2 - 4, 10, BLASS); text(g, wert, x, h / 2 + 13, 13, farbe, 'left', 600)
    })
    text(g, d.uhr ?? '', b - 16, h / 2 + 6, 15, GOLD, 'right', 600)
    return
  }
  kopf(g, 'SYSTEM · L.O.K.I.', d.uhr ?? '', b)
  zeilen.forEach(([n, wert, farbe], i) => {
    const y = 60 + i * 36
    text(g, n, 16, y, 13, BLASS); text(g, wert, b - 16, y, 14, farbe, 'right', 600)
    g.strokeStyle = 'rgba(95,246,255,0.08)'; g.beginPath(); g.moveTo(16, y + 12.5); g.lineTo(b - 16, y + 12.5); g.stroke()
  })
}

// ---------- Ablauf ----------
export function erstelleInhalte() {
  const fl = {}
  for (const [id, q] of Object.entries(FENSTER)) {
    const innen = einziehen(q, EINZUG), [b, h] = groesse(innen)
    fl[id] = { q, innen, c: leinwand(b, h) }
  }
  return { fl, ruhig: leinwand(B, H), kennung: '' }
}

/**
 * Inhalte zeichnen (nach zeichneSzene). daten = {
 *   werkstatt: Ausgabe von sequenzDaten() bzw. Beispiel, beispiel: bool, wetter: {ort, grad, text, wolken},
 *   kamera: {name, alarm} | null, kamBilder: [Bild|null, Bild|null], ton: 128 Werte | null, loki: {zustand, mikrofon},
 *   uhr: 'HH:MM' }
 */
export function zeichneInhalte(g, st, daten, t, versatz = 0) {
  const w = daten.werkstatt ?? {}
  // ruhige Inhalte nur bei neuen Daten neu (in eine Lage über alle drei Bildschirme)
  const kennung = JSON.stringify([w, daten.wetter, daten.kamera?.name ?? null, daten.loki, daten.uhr, daten.beispiel, daten.veraltet])
  if (kennung !== st.kennung) {
    st.kennung = kennung
    const rg = st.ruhig.getContext('2d'); rg.clearRect(0, 0, B, H)
    const ruhig = {
      verkaeufe: (c) => verkaeufe(c.getContext('2d'), c.width, c.height, w),
      umsatz: (c) => umsatz(c.getContext('2d'), c.width, c.height, w),
      aufgaben: (c) => abarbeiten(c.getContext('2d'), c.width, c.height, w),
      bestellungen: (c) => bestellungen(c.getContext('2d'), c.width, c.height, w),
      energie: (c) => energie(c.getContext('2d'), c.width, c.height),
      wetter: (c) => wetter(c.getContext('2d'), c.width, c.height, daten.wetter),
      system: (c) => system(c.getContext('2d'), c.width, c.height, { ...w, loki: daten.loki, verbunden: !daten.beispiel && !daten.veraltet, kamera: daten.kamera, uhr: daten.uhr }),
    }
    for (const [id, f] of Object.entries(ruhig)) {
      const p = st.fl[id], cg = p.c.getContext('2d')
      cg.clearRect(0, 0, p.c.width, p.c.height); f(p.c)
      if ((daten.beispiel || daten.veraltet) && ['verkaeufe', 'umsatz', 'aufgaben', 'bestellungen'].includes(id)) beispielMarke(cg, p.c.width, p.c.height, daten.veraltet ? 'KEINE AKTUELLEN DATEN' : 'BEISPIEL')
      glas(rg, p.q); verzerren(rg, p.c, p.innen)
    }
    for (const id of ['ton', 'kamera1', 'kamera2']) glas(rg, st.fl[id].q)
  }
  g.save(); g.setTransform(1, 0, 0, 1, -versatz, 0)
  g.drawImage(st.ruhig, 0, 0)
  // bewegte Inhalte jedes Bild
  const ton = st.fl.ton, tg = ton.c.getContext('2d'); tg.clearRect(0, 0, ton.c.width, ton.c.height)
  tonwellen(tg, ton.c.width, ton.c.height, daten.ton, t, daten.loki); verzerren(g, ton.c, ton.innen)
  const alarm = !!daten.kamera?.alarm
  for (const [k, id, name] of [[0, 'kamera1', 'CAM 01 · LINKS'], [1, 'kamera2', 'CAM 02 · RECHTS']]) {
    const p = st.fl[id], cg = p.c.getContext('2d')
    kamera(cg, p.c.width, p.c.height, daten.kamBilder?.[k] ?? null, name, alarm && k === 0, t); verzerren(g, p.c, p.innen)
  }
  g.restore()
}

/** Antwort der Gegenstelle (/hud) in die Anzeige-Daten umrechnen; ohne Werkstatt-Daten → Beispiel (klar markiert) */
export function ausHud(antwort, jetzt, sequenzDaten, wetterText) {
  const roh = antwort?.werkstatt ?? null
  const lage = roh ?? BEISPIEL_LAGE(jetzt)
  const d = sequenzDaten({ ...lage, geholt: roh ? lage.geholt : jetzt.getTime() }, jetzt)
  // echte, aber veraltete/unvollständige Daten: keine Zahlen zeigen, die wie aktuelle aussehen (Prüf-Agent)
  if (roh && !d) return { beispiel: false, veraltet: true, werkstatt: {}, wetter: null, kamera: antwort?.kamera ?? null, pv: antwort?.pv ?? null, loki: antwort?.loki ?? null, uhr: jetzt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }) }
  const tage = (lage.verkauf?.tage ?? []).map((t) => ({ tag: `${String(t.tag).slice(8, 10)}.${String(t.tag).slice(5, 7)}`, umsatz: (Number(t.umsatzCent) || 0) / 100, bestellungen: Number(t.bestellungen) || 0, stueck: Number(t.stueck) || 0 }))
  // letzter Tag der Liste ist heute (Serverfunktion zählt bis heute, deutsche Zeit) – nur nehmen, wenn das Datum stimmt
  const heuteTag = jetzt.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' }), letzter = (lage.verkauf?.tage ?? []).at(-1)
  const heute = letzter && String(letzter.tag).slice(0, 10) === heuteTag ? tage.at(-1) : { umsatz: 0, bestellungen: 0, stueck: 0 }
  const w = antwort?.wetter
  return {
    beispiel: !roh,
    werkstatt: { ...d, stand: roh ? d.stand : null, tage, heute, offeneBestellungen: lage.offeneBestellungen ?? null }, // Beispiel: ohne „Stand“
    // Wetterstation (Ecowitt) hat Vorrang für die Messwerte; Himmel/Bewölkung weiter von Open-Meteo (05.11.2026)
    wetter: (() => { const st = antwort?.station; const grad = Number.isFinite(st?.grad) ? st.grad : w?.grad; if (!Number.isFinite(grad)) return null
      return { ort: w?.ort ?? 'Öhringen', grad, wolken: w?.wolken, text: w ? wetterText?.(w) ?? '' : '', station: st ? { feuchte: st.feuchte, wind: st.wind, boe: st.boe, druck: st.druck, regenHeute: st.regenHeute } : null } })(),
    kamera: antwort?.kamera ?? null,
    pv: antwort?.pv ?? null,
    loki: antwort?.loki ?? null,
    uhr: jetzt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }),
  }
}

/** Beispieldaten (nur wenn L.O.K.I. keine Werkstatt-Daten liefert – überall als „BEISPIEL“ markiert) */
function BEISPIEL_LAGE(jetzt) {
  const tag = (minus) => new Date(jetzt.getTime() - minus * 86_400_000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
  const tage = Array.from({ length: 14 }, (_, i) => ({ tag: tag(13 - i), bestellungen: [3, 5, 2, 6, 4, 7, 5, 3, 8, 6, 4, 9, 7, 5][i], umsatzCent: [9200, 15400, 6100, 18800, 12100, 21900, 14800, 9900, 24800, 17600, 12500, 27900, 20300, 15600][i] }))
  return {
    aufgaben: { offen: 7, neu: 2, amazonAnzahl: 0, wichtigste: [
      { titel: 'Kerzenständer Eiche – 12 Stück fertigen', faellig: tag(1) },
      { titel: 'Etsy-Anzeige Garderobe überarbeiten', faellig: tag(0) },
      { titel: 'Lieferung Buche einlagern', faellig: tag(-2) },
      { titel: 'Fotos Wandregal neu aufnehmen', faellig: null },
      { titel: 'Steuerunterlagen an Büro', faellig: tag(-5) }] },
    verkauf: { gestern: { bestellungen: 5, stueck: 7, umsatzCent: 15600 }, tage, kanaele14: [] },
    freigaben: 2, selbsttest: { am: jetzt.toISOString(), rot: 0 },
    offeneBestellungen: { anzahl: 3, liste: [
      { am: new Date(jetzt.getTime() - 26 * 3_600_000).toISOString(), kanal: 'Shop', status: 'GEPACKT', stueck: 1, cent: 8900, artikel: '1× Wandregal Buche 80 cm' },
      { am: new Date(jetzt.getTime() - 5 * 3_600_000).toISOString(), kanal: 'Amazon', status: 'BEZAHLT', stueck: 1, cent: 3490, artikel: '1× Schlüsselbrett Nussbaum' },
      { am: new Date(jetzt.getTime() - 40 * 60_000).toISOString(), kanal: 'Etsy', status: 'BESTELLT', stueck: 2, cent: 5980, artikel: '2× Kerzenständer Eiche, 3-armig' },
    ] },
  }
}

/** einzelne Inhalte zum Wiederverwenden (z. B. Rahmen-Entwürfe): (g, breite, höhe, daten, t) */
export const ZEICHNER = {
  verkaeufe: (g, b, h, d) => verkaeufe(g, b, h, d.werkstatt ?? {}),
  umsatz: (g, b, h, d) => umsatz(g, b, h, d.werkstatt ?? {}),
  ton: (g, b, h, d, t) => tonwellen(g, b, h, d.ton, t, d.loki, d.tonStatus),
  aufgaben: (g, b, h, d) => abarbeiten(g, b, h, d.werkstatt ?? {}),
  bestellungen: (g, b, h, d) => bestellungen(g, b, h, d.werkstatt ?? {}),
  kamera1: (g, b, h, d, t) => kamera(g, b, h, d.kamBilder?.[0] ?? null, 'CAM 01 · LINKS', !!d.kamera?.alarm, t),
  kamera2: (g, b, h, d, t) => kamera(g, b, h, d.kamBilder?.[1] ?? null, 'CAM 02 · RECHTS', false, t),
  energie: (g, b, h, d, t) => energie(g, b, h, d.pv, t),
  wetter: (g, b, h, d) => wetter(g, b, h, d.wetter),
  system: (g, b, h, d) => system(g, b, h, { ...(d.werkstatt ?? {}), loki: d.loki, verbunden: !d.beispiel && !d.veraltet, kamera: d.kamera, uhr: d.uhr }),
}
