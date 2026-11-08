// Inhalte in den Fenstern der Szene „Mystic Aurora“ (05.11.2026, Belegung vom Auftraggeber bestätigt, siehe
// recherche/grafik-v5-bestand-2026-11-05.md). Die Fenster sind schräg gestellte Vierecke (Perspektive): jeder Inhalt
// wird flach in eine eigene Leinwand gezeichnet und dann in senkrechten Streifen in sein Viereck gelegt. Alles wird
// live gezeichnet – gestochen scharf, egal wie die Grafik darunter aussieht. Ruhige Inhalte werden nur bei neuen Daten
// neu gezeichnet, Tonwellen und Kameras jedes Bild.
// Links Werkstatt: Verkäufe (groß), Umsatz, Tonwellen, Abarbeiten, letzte Bestellungen.
// Rechts Haus (gespiegelte Fenster): CAM 01, CAM 02, Energie (FENECON), Wetter, Systemstatus.

const B = 5760, H = 1080
import { PV_VARIANTE } from './pv-varianten.js'
import { WETTER_ENTWURF, wetterKopf } from './wetter-entwuerfe.js'
import { leistenSymbol, knoten } from './pv-zeichen.js'
import { ikone } from './ikonen.js'
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
  text(g, titel, 28, 24, 14, CYAN, 'left', 600) /* 28 statt 14: Abstand zur Schräge links (Wunsch 05.11.2026) */
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
/** auf eine glatte Achsen-Obergrenze aufrunden, durch 4 teilbar: 133 → 160, 164 → 200, 480 → 500, 57 → 60 */
export function glatt(x) {
  // nur ganze Euro-Schritte, damit die Beschriftung nicht gerundet wird (Prüf-Agent)
  const schritt = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((f) => f * 10 ** Math.floor(Math.log10(x / 4))).find((st) => Number.isInteger(st) && st * 4 >= x) ?? Math.max(1, 10 ** Math.ceil(Math.log10(x / 4)))
  return schritt * 4
}
function verkaeufe(g, b, h, d) {
  const tage = d.tage ?? [], summe7 = tage.slice(-7).reduce((s, t) => s + t.umsatz, 0)
  kopf(g, 'VERKÄUFE · 14 TAGE', `7 TAGE ${euro(summe7)}`, b)
  const x0 = 46, x1 = b - 18, y0 = 44, y1 = h - 30, n = Math.max(1, tage.length)
  // Skala passt sich dem stärksten Tag an und rundet auf eine glatte Zahl auf (08.11.2026: Achse soll mitwachsen, 4 Teilstriche)
  const maxU = glatt(Math.max(10, ...tage.map((t) => t.umsatz))), maxB = Math.max(1, ...tage.map((t) => t.bestellungen))
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
  text(g, '▮ WARENWERT', x0, y0 - 2 + 12, 10, CYAN); text(g, '● BESTELLUNGEN', x0 + 80, y0 + 10, 10, GOLD)
}
function umsatz(g, b, h, d) {
  // heute statt gestern (Wunsch Auftraggeber 05.11.2026: gestern steht schon in den Verkäufen daneben)
  kopf(g, 'WARENWERT · HEUTE', d.stand ? `STAND ${d.stand}` : '', b)
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
  kopf(g, 'OFFENE BESTELLUNGEN', o ? `${o.anzahl} OFFEN` : '', b)
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
function tonwellen(g, b, h, ton, t, loki, tonStatus, medien, gespiegelt = false) {
  const pegel = ton ? Math.max(...Array.from(ton, Number).map((v) => (Number.isFinite(v) ? v : 0))) : 0
  const spricht = loki?.zustand === 'spricht'
  // Lied ausblenden, wenn der Player ohne Stopp-Meldung verschwunden ist (Position weit über der Dauer, Prüf-Agent)
  const lied = liedSichtbar(medien) ? medien : null
  kopf(g, 'AUDIO', spricht ? 'L.O.K.I. SPRICHT' : ton && pegel > 0.01 ? 'PC-TON' : tonStatus ?? 'STILLE', b)
  const platz = lied ? schallplatte(g, b, h, lied, t, gespiegelt) : 0, links = gespiegelt ? 0 : platz
  const jetzt = performance.now(), dt = Math.min(0.1, Math.max(0.005, (jetzt - (letztesBild || jetzt)) / 1000)); letztesBild = jetzt
  const x0 = 16 + links, x1 = b - 16 - (gespiegelt ? platz : 0), unten = h - 12, oben = 42, hoehe = unten - oben, breite = (x1 - x0) / BALKEN
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

/**
 * Laufendes Lied (07.11.2026, Wahl Auftraggeber: Entwurf D „Schallplatte“, hud5/audio-entwuerfe.js): Cover als Etikett einer
 * schwarzen Platte, die sich beim Abspielen dreht; daneben Titel, Interpret · Album, Fortschritt. Liefert die belegte Breite –
 * die Tonbalken rücken nach rechts. Daten aus der Medien-Schnittstelle von Wallpaper Engine (dauer-hud.html).
 */
/** Lied anzeigen? Nicht bei Stopp, abgeschalteter Integration oder wenn der Player ohne Stopp-Meldung verschwunden ist
 *  (Position weit über der Dauer, Prüf-Agent) */
export function liedSichtbar(m) {
  if (!m || !m.titel || m.zustand === 'stopp' || m.aktiv === false) return false
  const ueber = m.dauer > 0 && m.position != null && m.zustand === 'spielt' && m.position + (performance.now() - m.posZeit) / 1000 > m.dauer + 10
  return !ueber
}
/** Knöpfe Zurück / Pause-Weiter / Vor im Audiofeld (07.11.2026, Wunsch Auftraggeber) – Mittelpunkte in Feld-Einheiten,
 *  gemessen ab der Innenkante des Felds; tafeln.js legt genau darüber unsichtbare Klickflächen */
export const MEDIEN_KNOEPFE = [['zurueck', 486, 80], ['pause', 534, 80], ['vor', 582, 80]]
export const KNOPF_RADIUS = 19
/** Mittelpunkte der Knöpfe im Audiofeld; gespiegelt (rechter Bildschirm, Wunsch 08.11.2026) von der rechten Kante aus */
export function knopfListe(b, gespiegelt = false) {
  if (!gespiegelt) return MEDIEN_KNOEPFE
  return [['zurueck', b - 582, 80], ['pause', b - 534, 80], ['vor', b - 486, 80]]
}
export const knopfBlitz = { id: null, zeit: 0 } // kurzes Aufleuchten nach dem Klick
function medienKnopf(g, art, x, y, spielt) {
  const blitz = knopfBlitz.id === art ? Math.max(0, 1 - (performance.now() - knopfBlitz.zeit) / 400) : 0
  g.save()
  g.beginPath(); g.arc(x, y, KNOPF_RADIUS, 0, Math.PI * 2)
  g.fillStyle = `rgba(95,246,255,${0.06 + blitz * 0.35})`; g.fill()
  g.strokeStyle = art === 'pause' ? GOLD : 'rgba(95,246,255,0.55)'; g.lineWidth = 1.2; g.stroke()
  g.fillStyle = art === 'pause' ? GOLD : HELL
  const dreieck = (x0, rechts) => { g.beginPath(); g.moveTo(x0, y - 6); g.lineTo(x0 + (rechts ? 9 : -9), y); g.lineTo(x0, y + 6); g.closePath(); g.fill() }
  if (art === 'pause') { if (spielt) { g.fillRect(x - 5, y - 7, 3.5, 14); g.fillRect(x + 1.5, y - 7, 3.5, 14) } else dreieck(x - 3.5, true) }
  else if (art === 'vor') { dreieck(x - 7, true); dreieck(x + 1, true); g.fillRect(x + 9, y - 6, 2, 12) }
  else { dreieck(x + 7, false); dreieck(x - 1, false); g.fillRect(x - 11, y - 6, 2, 12) }
  g.restore()
}
let plattenWinkel = 0, plattenZeit = 0
const zeitText = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
function schallplatte(g, b, h, m, t, gespiegelt = false) {
  const s = h - 50, x = gespiegelt ? b - 30 - s : 30, y = 40, cx = x + s / 2, cy = y + s / 2
  if (m.zustand === 'spielt') plattenWinkel += Math.min(0.1, Math.max(0, t - plattenZeit)) * 0.9
  plattenZeit = t
  const farbe = typeof m.farbe === 'string' && m.farbe ? m.farbe : CYAN
  g.save()
  g.shadowColor = farbe; g.shadowBlur = 18
  g.beginPath(); g.arc(cx, cy, s / 2, 0, Math.PI * 2); g.fillStyle = '#050505'; g.fill(); g.shadowBlur = 0
  g.translate(cx, cy); g.rotate(plattenWinkel)
  for (let r = s / 2 - 3; r > s * 0.31; r -= 3) { g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke() }
  g.strokeStyle = 'rgba(255,255,255,0.13)'; g.beginPath(); g.arc(0, 0, s * 0.42, -0.6, 0.2); g.stroke() // Glanz, dreht mit
  g.beginPath(); g.arc(0, 0, s * 0.3, 0, Math.PI * 2); g.clip()
  if (m.cover) g.drawImage(m.cover, -s * 0.3, -s * 0.3, s * 0.6, s * 0.6)
  else { g.fillStyle = farbe; g.globalAlpha = 0.5; g.fillRect(-s * 0.3, -s * 0.3, s * 0.6, s * 0.6); g.globalAlpha = 1 }
  g.restore()
  g.fillStyle = '#081820'; g.beginPath(); g.arc(cx, cy, 3, 0, Math.PI * 2); g.fill()
  const tb = 420, tt = 290 // tt: Textbreite neben den Knöpfen
  // gespiegelt: Text rechtsbündig links neben der Platte, Fortschritt endet an der Platte
  const tx = gespiegelt ? x - 22 : x + s + 22, ausr = gespiegelt ? 'right' : 'left'
  text(g, m.zustand === 'pause' ? 'PAUSIERT' : 'JETZT LÄUFT', tx, 56, 11, GOLD, ausr, 600)
  g.font = `600 26px ${SCHRIFT}`; text(g, kuerzen(g, m.titel, tt), tx, 86, 26, HELL, ausr, 600)
  const unter = [m.kuenstler, m.album].filter(Boolean).join(' · ')
  if (unter) { g.font = `400 16px ${SCHRIFT}`; text(g, kuerzen(g, unter, tt), tx, 110, 16, CYAN, ausr) }
  if (m.dauer > 0 && m.position != null) {
    const pos = Math.min(m.dauer, m.position + (m.zustand === 'spielt' ? (performance.now() - m.posZeit) / 1000 : 0)), f = pos / m.dauer, bb = 360
    const bx = gespiegelt ? tx - bb : tx
    g.fillStyle = 'rgba(95,246,255,0.12)'; g.fillRect(bx, h - 20, bb, 3)
    g.fillStyle = CYAN; g.fillRect(bx, h - 20, bb * f, 3); g.beginPath(); g.arc(bx + bb * f, h - 18.5, 4, 0, Math.PI * 2); g.fill()
    text(g, zeitText(m.dauer - pos) + ' übrig', gespiegelt ? tx - tb : tx + tb, h - 15, 11, BLASS, gespiegelt ? 'left' : 'right', 600)
  }
  for (const [art, kx, ky] of knopfListe(b, gespiegelt)) medienKnopf(g, art, kx, ky, m.zustand === 'spielt')
  return gespiegelt ? b - (tx - tb) + 34 : tx + tb + 14
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
    g.fillStyle = 'rgba(120,10,0,0.55)'; g.fillRect(0, h - 30, b, 30); text(g, alarm === 'auto' ? 'AUTO ERKANNT' : 'PERSON ERKANNT', b / 2, h - 10, 14, HELL, 'center', 600)
  }
}
/**
 * Energiefluss der PV-Anlage (FENECON, 05.11.2026, Werte von L.O.K.I. über /hud → pv): PV, Akku, Haus, Netz als Knoten;
 * Lichtpunkte laufen in Flussrichtung, umso schneller und dichter, je mehr Leistung fließt. Akku als Ring mit Ladestand.
 * Vorzeichen laut FENECON: Akku + = entladen, − = laden; Netz + = Bezug, − = Einspeisung.
 */
/** PV-Anlage (Wahl Auftraggeber 05.11.2026: Vorschlag D3) – oben groß Erzeugung, Haus, Akku, Netz; darunter laufen alle
 *  Leitungen sternförmig in einen Verteiler, das Auto hängt daran (Wallbox folgt). Zeichnung in pv-varianten.js. */
function energie(g, b, h, pv, t) {
  const stoerung = pv && pv.zustand >= 3, warnung = pv && pv.zustand === 2
  kopf(g, 'ENERGIE · PV-ANLAGE', !pv ? 'NICHT VERBUNDEN' : stoerung ? 'STÖRUNG' : warnung ? 'WARNUNG' : pv.inselbetrieb ? 'INSELBETRIEB' : 'LIVE', b)
  verkleinert(g, b, h, (bb, hh) => PV_VARIANTE.d(g, bb, hh, pv, t ?? 0, 3, false))
}
/** Inhalt unter dem Kopf gleichmäßig verkleinern, wenn das Feld flacher ist als die 396 Einheiten, für die es gebaut ist
 *  (08.11.2026: rechts kommt das Audiofeld dazu, PV und Wetter behalten Angaben und Aufbau) */
function verkleinert(g, b, h, zeichne, voll = 396, kopfH = 36) {
  const f = Math.min(1, (h - kopfH) / (voll - kopfH))
  if (f >= 1) return zeichne(b, h)
  g.save(); g.translate(0, kopfH); g.scale(f, f); g.translate(0, -kopfH); zeichne(b / f, kopfH + (h - kopfH) / f); g.restore()
}
/** Wetter (Wahl Auftraggeber 05.11.2026: Entwurf B) – Temperatur groß mit Himmel-Symbol, darunter Feuchte, Wind, Böen,
 *  Regen als Symbol-Reihe; alle Werte aus der eigenen Station */
function wetter(g, b, h, w, t = 0) {
  if (!w || !Number.isFinite(w.grad)) { kopf(g, 'WETTER · OBERSONTHEIM', '', b); text(g, 'Keine Wetterdaten', 16, 70, 14, BLASS); return }
  wetterKopf(g, b, w); verkleinert(g, b, h, (bb, hh) => WETTER_ENTWURF.b(g, bb, hh, { ...w, station: w.station ?? {} }, t, false))
}
const SYSTEM_SYMBOL = { STATUS: 'stimme', MIKROFON: 'mikrofon', WERKSTATT: 'zahnrad', KAMERA: 'kamera', SELBSTTEST: 'schild', WHATSAPP: 'whatsapp' }
/** Statuszeile nur aus Symbolen, Farbe = Zustand (Wunsch Auftraggeber 08.11.2026: „Status“-Wort weg, türkis = hört zu,
 *  rot = hört nicht zu; Mikrofon an türkis / aus rot; Werkstatt und Kamera grün / rot; WhatsApp grün = neue Nachricht,
 *  rot = keine). Eine Zeile: L.O.K.I., sechs Symbole, rechts Datum und Uhr. */
const GRUEN_S = '#7dffb0'
function statusSymbole(g, x0, x1, my, d, gr = 22, mitNamen = false) {
  const z = d.loki?.zustand ?? 'aus', wa = d.loki?.whatsapp
  const liste = [
    ['stimme', ['bereit', 'spricht', 'denkt', 'laedt'].includes(z) ? CYAN : ROT, '', 'STATUS'],
    ['mikrofon', d.loki?.mikrofon ? CYAN : ROT, '', 'MIKROFON'],
    ['zahnrad', d.verbunden ? GRUEN_S : ROT, '', 'WERKSTATT'],
    ['kamera', d.kamera ? GRUEN_S : ROT, '', 'KAMERA'],
    ['schild', d.selbsttestRot ? ROT : GRUEN_S, '', 'SELBSTTEST'],
    ['whatsapp', wa > 0 ? GRUEN_S : ROT, wa > 0 ? String(wa) : '', 'WHATSAPP'],
  ]
  const sp = (x1 - x0) / liste.length
  liste.forEach(([art, farbe, zahl, name], i) => {
    // mit Namen: Symbol + Wort in der Zustandsfarbe (Wunsch 08.11.2026: Wörter wie „hört zu“ weg, die Namen bleiben)
    g.font = `600 11px ${SCHRIFT}`
    const nb = mitNamen ? g.measureText(name).width + 8 : 0, x = x0 + sp * (i + 0.5) - nb / 2
    g.save(); g.shadowColor = farbe; g.shadowBlur = 6; leistenSymbol(g, art, x, my, gr, farbe)
    if (mitNamen) text(g, name, x + gr * 0.6 + 4, my + 4, 11, farbe, 'left', 600)
    g.restore()
    if (zahl) text(g, zahl, x + gr * 0.6 + 6 + nb, my + 4, 11, farbe, 'left', 600)
  })
}
function statusZeile(g, b, h, d) {
  const my = h / 2, j = new Date(), zwei = (n) => String(n).padStart(2, '0')
  knoten(g, 24, my, 16, GOLD); text(g, 'L.O.K.I.', 38, my + 5, 13, CYAN, 'left', 600); knoten(g, 104, my, 16, GOLD)
  g.save(); g.shadowColor = GOLD; g.shadowBlur = 6; text(g, `${zwei(j.getHours())}:${zwei(j.getMinutes())}:${zwei(j.getSeconds())}`, b - 16, my + 7, 20, GOLD, 'right', 600); g.restore()
  text(g, `${zwei(j.getDate())}.${zwei(j.getMonth() + 1)}.${j.getFullYear()}`, b - 112, my + 5, 12, BLASS, 'right', 500)
  statusSymbole(g, 130, b - 200, my, d)
}
/** Audio + Statuszeile in einem Feld: lage = 'oben' | 'unten' (eigene Zeile, hauchdünne Linie) oder 'kopf' (Symbole in der Audio-Kopfzeile) */
function tonMitStatus(g, b, h, d, t, lage) {
  const sd = { ...(d.werkstatt ?? {}), loki: d.loki, verbunden: !d.beispiel && !d.veraltet, kamera: d.kamera }
  if (lage === 'kopf') {
    tonwellen(g, b, h, d.ton, t, d.loki, d.tonStatus, d.medien, true)
    const x1 = b - 110; g.fillStyle = 'rgba(4,19,26,1)'; g.fillRect(110, 6, x1 - 110, 24) // Platz zwischen „AUDIO“ und „PC-TON“
    statusSymbole(g, 96, x1 - 120, 18, sd, 16, true)
    const j = new Date(), zwei = (n) => String(n).padStart(2, '0')
    text(g, `${zwei(j.getHours())}:${zwei(j.getMinutes())}:${zwei(j.getSeconds())}`, x1 - 10, 24, 16, GOLD, 'right', 600)
    return
  }
  const SH = 32, sy = lage === 'oben' ? 0 : h - SH, ty = lage === 'oben' ? SH : 0
  g.save(); g.translate(0, sy); statusZeile(g, b, SH, sd); g.restore()
  g.save(); g.translate(0, ty); g.beginPath(); g.rect(0, 0, b, h - SH); g.clip(); ZEICHNER.ton(g, b, h - SH, d, t); g.restore()
  const ly = (lage === 'oben' ? SH : h - SH) + 0.5
  g.strokeStyle = 'rgba(95,246,255,0.22)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(14, ly); g.lineTo(b - 14, ly); g.stroke()
}
function system(g, b, h, d) {
  const z = d.loki?.zustand ?? 'aus', wa = d.loki?.whatsapp
  const zeilen = [
    ['STATUS', { bereit: 'HÖRT ZU', spricht: 'SPRICHT', denkt: 'DENKT NACH', laedt: 'LÄDT', aus: 'AUS', fehler: 'STÖRUNG' }[z] ?? z.toUpperCase(), z === 'fehler' ? ROT : CYAN],
    ['MIKROFON', d.loki?.mikrofon ? 'AN' : 'AUS', d.loki?.mikrofon ? CYAN : GOLD],
    ['WERKSTATT', d.verbunden ? `VERBUNDEN · ${d.stand ?? ''}` : 'NICHT VERBUNDEN', d.verbunden ? CYAN : GOLD],
    ['KAMERA', d.kamera ? 'BEREIT' : 'NICHT EINGERICHTET', d.kamera ? CYAN : BLASS],
    ['SELBSTTEST', d.selbsttest ?? '–', d.selbsttestRot ? ROT : CYAN],
    ['WHATSAPP', wa == null ? '–' : wa > 0 ? `${wa} NEU` : 'NICHTS NEUES', wa > 0 ? GOLD : BLASS],
  ]
  if (h < 120) { // schmaler Streifen (rechter Bildschirm): alles in einer Zeile, je Angabe ein Linien-Symbol (Wunsch 06.11.2026)
    const my = h / 2, fein = (t, gr, gew) => { g.font = `${gew} ${gr}px ${SCHRIFT}`; return g.measureText(t).width }
    let x = 26 // Abstand zur Schräge links; „SYSTEM“ entfällt (Wunsch 06.11.2026)
    const trenner = (px) => { g.strokeStyle = 'rgba(95,246,255,0.22)'; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.round(px) + 0.5, 12); g.lineTo(Math.round(px) + 0.5, h - 12); g.stroke() }
    knoten(g, x, my, 20, GOLD); x += 18
    text(g, 'L.O.K.I.', x, my + 5, 14, CYAN, 'left', 600); x += fein('L.O.K.I.', 14, 600) + 18
    knoten(g, x, my, 20, GOLD); x += 12
    // Uhr mit Sekunden und Datum in Zahlen (Wunsch 06.11.2026); Breite aus fester Vorlage, damit nichts mit den Ziffern wandert
    const j = new Date(), zwei = (n) => String(n).padStart(2, '0'), uhr = `${zwei(j.getHours())}:${zwei(j.getMinutes())}:${zwei(j.getSeconds())}`, datum = `${zwei(j.getDate())}.${zwei(j.getMonth() + 1)}.${j.getFullYear()}`
    const uhrB = fein('00:00:00', 30, 600) + 8 + fein('00.00.0000', 15, 500) + 28, breiten = zeilen.map(([n, wert]) => 30 + Math.max(fein(n, 10, 400), fein(wert, 13, 600)))
    const rest = b - uhrB - 24 - x - breiten.reduce((a, c) => a + c, 0), luecke = Math.max(6, rest / (zeilen.length + 1)) // gleichmäßig über die ganze Breite (Wunsch Auftraggeber 06.11.2026)
    zeilen.forEach(([n, wert, farbe], i) => {
      trenner(x + luecke / 2); x += luecke
      if (n === 'WHATSAPP' && wa > 0) { g.fillStyle = 'rgba(242,176,74,0.16)'; g.fillRect(x - 6, 7, breiten[i] + 12, h - 14); g.strokeStyle = GOLD; g.lineWidth = 1; g.strokeRect(x - 5.5, 7.5, breiten[i] + 11, h - 15) } // neue Nachricht: fällt schon im Augenwinkel auf
      leistenSymbol(g, SYSTEM_SYMBOL[n], x + 11, my, 22, farbe)
      text(g, n, x + 30, my - 4, 10, BLASS); text(g, wert, x + 30, my + 13, 13, farbe, 'left', 600)
      x += breiten[i]
    })
    trenner(b - uhrB - 18)
    g.save(); g.shadowColor = GOLD; g.shadowBlur = 8; text(g, uhr, b - 18, my + 11, 30, GOLD, 'right', 600); g.restore()
    text(g, datum, b - 18 - fein('00:00:00', 30, 600) - 14, my + 6, 15, BLASS, 'right', 500)
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
  tonwellen(tg, ton.c.width, ton.c.height, daten.ton, t, daten.loki, daten.tonStatus, daten.medien); verzerren(g, ton.c, ton.innen)
  const alarm = daten.kamera?.alarm ? daten.kamera.alarmArt ?? 'person' : null
  for (const [k, id, name] of [[0, 'kamera1', 'CAM 01 · LINKS'], [1, 'kamera2', 'CAM 02 · RECHTS']]) {
    const p = st.fl[id], cg = p.c.getContext('2d')
    kamera(cg, p.c.width, p.c.height, daten.kamBilder?.[k] ?? null, name, alarm && k === (daten.kamera?.alarmKanal ?? 0), t); verzerren(g, p.c, p.innen)
  }
  g.restore()
}

/** Antwort der Gegenstelle (/hud) in die Anzeige-Daten umrechnen; ohne Werkstatt-Daten → Beispiel (klar markiert) */
export function ausHud(antwort, jetzt, sequenzDaten, wetterText) {
  const roh = antwort?.werkstatt ?? null
  const lage = roh ?? BEISPIEL_LAGE(jetzt)
  const d = sequenzDaten({ ...lage, geholt: roh ? lage.geholt : jetzt.getTime() }, jetzt)
  const w = antwort?.wetter
  // alles aus der Wetterstation (Ecowitt), Himmel seit 06.11.2026 in electron/himmel.cjs daraus abgeleitet
  const wetterDaten = (() => { const st = antwort?.station; const grad = Number.isFinite(st?.grad) ? st.grad : w?.grad; if (!Number.isFinite(grad)) return null
      return { ort: w?.ort ?? 'Obersontheim', grad, code: w?.code, wolken: w?.wolken, text: w ? wetterText?.(w) ?? '' : '', station: st ? { feuchte: st.feuchte, wind: st.wind, boe: st.boe, richtung: st.richtung, druck: st.druck, regenHeute: st.regenHeute, regenRate: st.regenRate, gefuehlt: st.gefuehlt, sonne: st.sonne } : null } })()
  // echte, aber veraltete/unvollständige Daten: keine Zahlen zeigen, die wie aktuelle aussehen (Prüf-Agent)
  if (roh && !d) return { beispiel: false, veraltet: true, werkstatt: {}, wetter: wetterDaten, kamera: antwort?.kamera ?? null, pv: antwort?.pv ?? null, loki: antwort?.loki ?? null, uhr: jetzt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }) }
  const tage = (lage.verkauf?.tage ?? []).map((t) => ({ tag: `${String(t.tag).slice(8, 10)}.${String(t.tag).slice(5, 7)}`, umsatz: (Number(t.umsatzCent) || 0) / 100, bestellungen: Number(t.bestellungen) || 0, stueck: Number(t.stueck) || 0 }))
  // letzter Tag der Liste ist heute (Serverfunktion zählt bis heute, deutsche Zeit) – nur nehmen, wenn das Datum stimmt
  const heuteTag = jetzt.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' }), letzter = (lage.verkauf?.tage ?? []).at(-1)
  const heute = letzter && String(letzter.tag).slice(0, 10) === heuteTag ? tage.at(-1) : { umsatz: 0, bestellungen: 0, stueck: 0 }
  return {
    beispiel: !roh,
    werkstatt: { ...d, stand: roh ? d.stand : null, tage, heute, offeneBestellungen: lage.offeneBestellungen ?? null }, // Beispiel: ohne „Stand“
    wetter: wetterDaten,
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
// ---------- linke Tafel, Entwurf 2 (Wahl Auftraggeber 08.11.2026: „Statistik-Säule links“, nur Arbeit) ----------
const GRUEN = '#7dffb0'
const welleZ = (t, f = 1) => 0.5 + 0.5 * Math.sin(t * f)
const euroNk = (v) => `${(Number(v) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
function statHeute(g, b, h, d, t) {
  kopf(g, 'WARENWERT · HEUTE', d.stand ? `STAND ${d.stand}` : '', b)
  const heute = d.heute ?? { umsatz: 0, bestellungen: 0 }, my = 34 + (h - 34) / 2, gr = Math.min(40, h * 0.24)
  ikone(g, 'muenze', 46, my, Math.min(44, h * 0.28), GOLD, t)
  text(g, euroNk(heute.umsatz), 84, my + gr * 0.2, gr, HELL, 'left', 600)
  const v = new Date(Date.now() - 86_400_000), gTag = v.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' }).replace(/\.$/, '')
  const gestern = (d.tage ?? []).find((x) => x.tag === gTag)
  text(g, `${heute.bestellungen} ${heute.bestellungen === 1 ? 'BESTELLUNG' : 'BESTELLUNGEN'}${gestern ? ` · GESTERN ${euro(gestern.umsatz)}` : ''}`, 84, my + gr * 0.2 + 24, 12, CYAN, 'left', 600)
}
function statVerlauf(g, b, h, d, t) {
  const tage = d.tage ?? [], u = tage.map((x) => x.umsatz), s14 = u.reduce((a, x) => a + x, 0), s7 = u.slice(-7).reduce((a, x) => a + x, 0), v7 = u.slice(-14, -7).reduce((a, x) => a + x, 0)
  kopf(g, 'VERKÄUFE · 14 TAGE', euro(s14), b)
  ikone(g, 'kurve', 38, 56, 24, CYAN, t)
  text(g, `7 TAGE ${euro(s7)}`, 60, 62, 15, HELL, 'left', 600)
  if (v7 > 0) { const pz = Math.round((s7 / v7 - 1) * 100); text(g, `${pz >= 0 ? '▲' : '▼'} ${Math.abs(pz)} %`, b - 14, 62, 12, pz >= 0 ? GRUEN : ROT, 'right', 600); text(g, 'ZUR VORWOCHE', b - 14, 76, 9, BLASS, 'right', 600) }
  if (u.length < 2) return
  const x0 = 22, x1 = b - 16, y0 = 96, y1 = h - 28, m = Math.max(10, ...u)
  const p = u.map((v, i) => [x0 + ((x1 - x0) * i) / (u.length - 1), y1 - ((y1 - y0) * v) / m])
  const v = g.createLinearGradient(0, y0, 0, y1); v.addColorStop(0, 'rgba(95,246,255,0.42)'); v.addColorStop(1, 'rgba(95,246,255,0)')
  g.beginPath(); g.moveTo(x0, y1); p.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(x1, y1); g.closePath(); g.fillStyle = v; g.fill()
  g.beginPath(); p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = CYAN; g.lineWidth = 1.5; g.stroke()
  // Lichtpunkt läuft die Kurve entlang, der heutige Tag pulsiert golden
  const f = (t * 0.12) % 1, i = Math.min(p.length - 2, Math.floor(f * (p.length - 1))), w = f * (p.length - 1) - i
  g.save(); g.shadowColor = CYAN; g.shadowBlur = 12; g.fillStyle = HELL; g.beginPath(); g.arc(p[i][0] + (p[i + 1][0] - p[i][0]) * w, p[i][1] + (p[i + 1][1] - p[i][1]) * w, 3, 0, Math.PI * 2); g.fill(); g.restore()
  const [ex, ey] = p.at(-1); g.fillStyle = GOLD; g.beginPath(); g.arc(ex, ey, 3.5 + welleZ(t, 3), 0, Math.PI * 2); g.fill()
  // Höchstwert als feine Linie mit Betrag – die Kurve wächst mit dem stärksten Tag mit
  g.strokeStyle = 'rgba(95,246,255,0.18)'; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(x0, y0 + 0.5); g.lineTo(x1, y0 + 0.5); g.stroke(); g.setLineDash([])
  text(g, `MAX ${euro(m)}`, x0, y0 - 4, 9, BLASS, 'left', 600)
  ;[[0, 'left'], [Math.floor((tage.length - 1) / 2), 'center'], [tage.length - 1, 'right']].forEach(([k, a]) => text(g, tage[k]?.tag ?? '', x0 + ((x1 - x0) * k) / (tage.length - 1), h - 10, 10, BLASS, a))
}
function statKanaele(g, b, h, d, t) {
  const k = d.kanaele ?? [], farben = [CYAN, GOLD, '#9b8cff'], n = k.reduce((a, x) => a + (x.bestellungen || 0), 0)
  kopf(g, 'KANÄLE · 14 TAGE', `${n} BEST.`, b)
  if (!k.length) { text(g, 'Keine Verkäufe', 22, 70, 13, BLASS); return }
  const r = Math.min((h - 70) / 2, b * 0.2), cx = 26 + r, cy = 34 + (h - 34) / 2
  let a = -Math.PI / 2 + Math.sin(t * 0.3) * 0.05
  k.forEach((x, i) => { const dd = (x.anteil || 0) * Math.PI * 2; if (dd > 0.09) { g.beginPath(); g.arc(cx, cy, r, a + 0.04, a + dd - 0.04); g.strokeStyle = farben[i]; g.lineWidth = r * 0.3; g.stroke() } a += dd })
  g.save(); g.strokeStyle = 'rgba(95,246,255,0.35)'; g.lineWidth = 1; g.setLineDash([3, 5]); g.lineDashOffset = -t * 12; g.beginPath(); g.arc(cx, cy, r * 0.62, 0, Math.PI * 2); g.stroke(); g.restore()
  const zeile = Math.min(30, (h - 50) / 3)
  k.forEach((x, i) => {
    const y = cy - zeile + i * zeile + 5
    g.fillStyle = farben[i]; g.fillRect(cx + r + 20, y - 9, 9, 9)
    g.font = `600 13px ${SCHRIFT}`; text(g, kuerzen(g, String(x.name).toUpperCase(), b - cx - r - 110), cx + r + 36, y, 13, HELL, 'left', 600)
    text(g, `${Math.round((x.anteil || 0) * 100)} % · ${x.bestellungen}`, b - 14, y, 12, farben[i], 'right', 600)
  })
}
/** Abarbeiten ohne Nachproduzieren-Karten (eigenes Feld), dringendste zuerst; zwei Spalten, wenn es viele werden */
function abarbeitenListe(g, b, h, d, t) {
  const karten = (d.karten ?? []).filter((k) => k[4] !== 'nachproduzieren')
  kopf(g, 'ABARBEITEN · DRINGEND ZUERST', `${d.abarbeitenOffen ?? karten.length} OFFEN`, b)
  ikone(g, 'haken', b - 110, 20, 14, CYAN, t)
  if (!karten.length) { text(g, 'Nichts Dringendes – erstaunlich.', 22, 66, 14, BLASS); return }
  const zeile = 26, pro = Math.max(1, Math.floor((h - 44) / zeile)), spalten = karten.length > pro ? 2 : 1, sb = (b - 16) / spalten
  karten.slice(0, pro * spalten).forEach(([titel, , , faellig, art], i) => {
    const sp = Math.floor(i / pro), x = 8 + sp * sb, y = 40 + (i % pro) * zeile, m = y + zeile / 2
    const f = art === 'amazon_fall' ? GOLD : art === 'hintergrund' ? BLASS : CYAN
    g.strokeStyle = f; g.globalAlpha = 0.8; g.lineWidth = 1.2; g.strokeRect(x + 14.5, m - 6.5, 13, 13); g.globalAlpha = 1
    if (faellig === 'ÜBERFÄLLIG' || faellig === 'FÄLLIG HEUTE') { g.fillStyle = faellig === 'ÜBERFÄLLIG' ? `rgba(255,90,74,${0.1 + 0.1 * welleZ(t, 2.5)})` : `rgba(242,176,74,${0.1 + 0.12 * welleZ(t, 2.5)})`; g.fillRect(x + 6, y + 2, sb - 12, zeile - 4) }
    g.font = `600 11px ${SCHRIFT}`; const fb = faellig ? g.measureText(faellig).width + 14 : 0
    g.font = `400 14px ${SCHRIFT}`; text(g, kuerzen(g, String(titel), sb - 60 - fb), x + 38, m + 5, 14, HELL)
    if (faellig) text(g, faellig, x + sb - 12, m + 4, 11, faellig === 'ÜBERFÄLLIG' ? ROT : faellig === 'FÄLLIG HEUTE' ? GOLD : BLASS, 'right', 600)
    g.strokeStyle = 'rgba(95,246,255,0.07)'; g.beginPath(); g.moveTo(x + 14, y + zeile - 0.5); g.lineTo(x + sb - 12, y + zeile - 0.5); g.stroke()
  })
  if (karten.length > pro * spalten) text(g, `+ ${karten.length - pro * spalten} WEITERE`, 22, h - 8, 10, BLASS, 'left', 600)
}
/** Nachproduzieren: Lager knapp mit Füllbalken Bestand / Meldebestand, leere Artikel pulsieren rot */
function nachproduzieren(g, b, h, d, t) {
  const l = d.lager ?? []
  kopf(g, 'NACHPRODUZIEREN', `${l.length} ARTIKEL`, b)
  ikone(g, 'saege', b - 120, 19, 18, l.length ? ROT : BLASS, t)
  if (!l.length) { text(g, 'Lager voll. Ein seltener Anblick.', 22, 66, 14, BLASS); return }
  const zeile = Math.min(40, Math.max(30, (h - 44) / l.length)), n = Math.floor((h - 44) / zeile)
  l.slice(0, n).forEach(([name, ist, soll], i) => {
    const y = 40 + i * zeile
    g.font = `400 14px ${SCHRIFT}`; text(g, kuerzen(g, String(name), b - 110), 22, y + 17, 14, HELL)
    text(g, `${ist} / ${soll}`, b - 16, y + 17, 13, ist <= 0 ? ROT : GOLD, 'right', 600)
    if (zeile >= 36) { const bb = b - 38, anteil = Math.min(1, Math.max(0, ist) / Math.max(1, soll)); g.fillStyle = 'rgba(95,246,255,0.1)'; g.fillRect(22, y + 25, bb, 5)
      g.fillStyle = ist <= 0 ? `rgba(255,90,74,${0.5 + 0.5 * welleZ(t, 3)})` : GOLD; g.fillRect(22, y + 25, Math.max(4, bb * anteil), 5) }
  })
  if (l.length > n) text(g, `+ ${l.length - n} WEITERE`, 22, h - 8, 10, BLASS, 'left', 600)
}
/** aktuelle Bestellungen, kompakt: Datum, Kanal, Artikel, Betrag */
function bestellungen2(g, b, h, d, t) {
  const o = d.offeneBestellungen
  kopf(g, 'OFFENE BESTELLUNGEN', o ? `${o.anzahl} OFFEN` : '', b)
  ikone(g, 'paket', b - 118, 18, 18, GOLD, t)
  if (!o) { text(g, 'Noch keine Daten aus Billbee.', 22, 66, 13, BLASS); return }
  const liste = o.liste ?? []
  if (!liste.length) { text(g, 'Alles versendet – die Werkstatt hat Pause. Theoretisch.', 22, 66, 13, BLASS); return }
  const zeile = 26, n = Math.min(liste.length, Math.floor((h - 44) / zeile))
  liste.slice(0, n).forEach((x, i) => {
    const y = 40 + i * zeile + zeile / 2 + 5, am = new Date(x.am)
    const tag = Number.isFinite(am.getTime()) ? am.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' }) : ''
    text(g, tag, 22, y, 12, BLASS); g.font = `600 11px ${SCHRIFT}`; text(g, kuerzen(g, String(x.kanal).toUpperCase(), 64), 70, y, 11, CYAN, 'left', 600)
    g.font = `400 13px ${SCHRIFT}`; text(g, kuerzen(g, String(x.artikel || '–'), b - 230), 144, y, 13, HELL); text(g, euro(x.cent / 100), b - 16, y, 13, GOLD, 'right', 600)
  })
  if ((o.anzahl ?? liste.length) > n) text(g, `+ ${(o.anzahl ?? liste.length) - n} WEITERE`, 22, h - 8, 10, BLASS, 'left', 600)
}

export const ZEICHNER = {
  statHeute: (g, b, h, d, t) => statHeute(g, b, h, d.werkstatt ?? {}, t),
  statVerlauf: (g, b, h, d, t) => statVerlauf(g, b, h, d.werkstatt ?? {}, t),
  statKanaele: (g, b, h, d, t) => statKanaele(g, b, h, d.werkstatt ?? {}, t),
  abarbeiten: (g, b, h, d, t) => abarbeitenListe(g, b, h, d.werkstatt ?? {}, t),
  nachproduzieren: (g, b, h, d, t) => nachproduzieren(g, b, h, d.werkstatt ?? {}, t),
  bestellungen2: (g, b, h, d, t) => bestellungen2(g, b, h, d.werkstatt ?? {}, t),
  verkaeufe: (g, b, h, d) => verkaeufe(g, b, h, d.werkstatt ?? {}),
  umsatz: (g, b, h, d) => umsatz(g, b, h, d.werkstatt ?? {}),
  ton: (g, b, h, d, t) => tonwellen(g, b, h, d.ton, t, d.loki, d.tonStatus, d.medien),
  // Probe 08.11.2026 (Idee Auftraggeber): Audio und L.O.K.I.-Zeile in EINEM Feld, getrennt durch eine hauchdünne Linie
  tonSystemOben: (g, b, h, d, t) => tonMitStatus(g, b, h, d, t, 'oben'),
  tonSystemUnten: (g, b, h, d, t) => tonMitStatus(g, b, h, d, t, 'unten'),
  tonSystemKopf: (g, b, h, d, t) => tonMitStatus(g, b, h, d, t, 'kopf'),
  aufgaben: (g, b, h, d) => abarbeiten(g, b, h, d.werkstatt ?? {}),
  bestellungen: (g, b, h, d) => bestellungen(g, b, h, d.werkstatt ?? {}),
  kamera1: (g, b, h, d, t) => kamera(g, b, h, d.kamBilder?.[0] ?? null, 'CAM 01 · LINKS', d.kamera?.alarm && (d.kamera.alarmKanal ?? 0) === 0 ? d.kamera.alarmArt ?? 'person' : null, t),
  kamera2: (g, b, h, d, t) => kamera(g, b, h, d.kamBilder?.[1] ?? null, 'CAM 02 · RECHTS', d.kamera?.alarm && d.kamera.alarmKanal === 1 ? d.kamera.alarmArt ?? 'person' : null, t),
  energie: (g, b, h, d, t) => energie(g, b, h, d.pv, t),
  wetter: (g, b, h, d, t) => wetter(g, b, h, d.wetter, t),
  system: (g, b, h, d) => system(g, b, h, { ...(d.werkstatt ?? {}), loki: d.loki, verbunden: !d.beispiel && !d.veraltet, kamera: d.kamera, uhr: d.uhr }),
}
