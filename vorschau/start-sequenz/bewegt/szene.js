// Szene der bewegten Start-Sequenz (03.11.2026), getrennt von der Vorschau-Seite, damit das Jarvis-Programm dieselbe Szene
// benutzt (../../../startsequenz/seite.js). Hintergrund siehe main.js: alles Aufwendige einmal vorgezeichnet, je Bild nur bewegt.
import { STILE, WERKZEUG as W } from '../standbilder/standbild.js'
import { KLEIN } from '../hud/kleinteile.js'
import { DATEN, LOKI, RUNEN_SCHRIFT, zufall, rauschen } from '../hud/zeichner.js'
import { GERUESTE, ZEIT } from '../ton/tongerueste.js'

const S = STILE.find((s) => s.name === 'Kombination'), B = W.B, H = W.H, F = W.kf(S), TON = GERUESTE.at(-1)
const klemm = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), phase = (t, a, b) => klemm((t - a) / (b - a))
const raus = (x) => 1 - Math.pow(1 - x, 3), weich = (x) => x * x * (3 - 2 * x)
const Z = ZEIT

// ---------- Vorzeichnen ----------
function leinwand(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c }
// Bild eines Ausschnitts (x0, y0, w, h) – fn zeichnet in Bildschirm-Koordinaten
function bild(x0, y0, w, h, fn) { const c = leinwand(w, h), g = c.getContext('2d'); g.translate(-x0, -y0); fn(g); return { c, x0, y0 } }
// Bild um einen Mittelpunkt (zum Drehen)
function rund(cx, cy, r, fn) { const c = leinwand(2 * r, 2 * r), g = c.getContext('2d'); g.translate(r - cx, r - cy); fn(g); return { c, cx, cy, r } }
function zeigeRund(g, sp, winkel = 0, skal = 1, dx = 0, dy = 0) { g.save(); g.translate(sp.cx + dx, sp.cy + dy); if (winkel) g.rotate(winkel); if (skal !== 1) g.scale(skal, skal); g.drawImage(sp.c, -sp.r, -sp.r); g.restore() }

// ---------- Teile mit Ein-/Ausschalt-Ablauf ----------
// Jedes Teil: Rechteck (für das Aufziehen von der Mitte), Startzeit, Versatz (Abstand zur Mitte → Welle), zeichne(g, t, k)
const teile = []
function teil(x0, y0, w, h, start, zeichne, versatz = 0) { teile.push({ x0, y0, w, h, cx: x0 + w / 2, cy: y0 + h / 2, start, zeichne, versatz }); }
function sichtbar(t, ta) {
  const an1 = phase(t, ta.start, ta.start + 0.45)
  let k = an1
  if (t >= Z.DUNKEL - 0.4) k = an1 * (1 - phase(t, Z.DUNKEL - 0.4 + ta.versatz * 0.5, Z.DUNKEL + ta.versatz * 0.5))
  if (t >= Z.EINSCHLAG) { const s2 = Z.EINSCHLAG + 0.12 + ta.versatz * 1.2; k = phase(t, s2, s2 + 0.4) }
  return k
}
const flacker = (t, i) => (Math.sin(t * 91 + i * 7.3) > 0.2 ? 1 : 0.3)
// Welle von der Mitte nach außen: Abstand zur Bildschirmgrenze zur Mitte (0 = innen, 1 = außen)
const welle = (x, links) => (links ? (B - x) / B : (x - 2 * B) / B)

// Messuhr: Lichthof, Skala, Zahl vorgezeichnet; Segmentring und Teilbögen drehen sich; Wertbogen läuft hoch
function messuhr(x, y, r, wert, titel, unter, farbe, start, versatz) {
  const fest = bild(x - r * 1.55, y - r * 1.55, r * 3.1, r * 3.1, (g) => {
    W.hof(g, S, x, y, r * 1.5, 0.18, farbe); W.skala(g, S, x, y, r + 10, 72, 4, 0.45)
    W.band(g, S, x, y, r * 0.86, r, 0, 7, { farbe, al: 0.12, kante: 0 })
    W.leuchten(g, S, 14, () => W.txt(g, titel, x, y + r * 0.12, W.fb(S.hell, 1), { gr: Math.round(r * 0.36), gew: 300, aus: 'center', sp: 0 }))
    if (unter) W.txt(g, unter, x, y + r * 0.34, W.fb(S.haupt, 0.9), { gr: Math.max(11, Math.round(r * 0.09)), aus: 'center', sp: 2 })
  })
  const seg = rund(x, y, r * 0.66, (g) => W.segmente(g, S, x, y, r * 0.58, r * 0.64, 24, 0.03, 0.7, { al: 0.6, kante: 0 }))
  const boegen = rund(x, y, r * 0.78, (g) => { W.bogen(g, S, x, y, r * 0.74, 0.3, 1.9, { al: 0.6 }); W.bogen(g, S, x, y, r * 0.7, 3.5, 4.3, { al: 0.9, b: 2, farbe: S.akzent }) })
  const rot = (x * 7 + y) % 2 ? 1 : -1
  teil(x - r * 1.1, y - r * 1.1, r * 2.2, r * 2.2, start, (g, t) => {
    g.drawImage(fest.c, fest.x0, fest.y0)
    zeigeRund(g, seg, rot * t * 0.15); zeigeRund(g, boegen, -rot * t * 0.5)
    const p = raus(phase(t, start + 0.3, start + 1.8)) * (0.97 + 0.03 * Math.sin(t * 2 + x))
    W.band(g, S, x, y, r * 0.86, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * wert * p, { farbe, al: 0.95 })
  }, versatz)
}
// Bausteine aus kleinteile.js: eigene Leinwand, wird nur neu gezeichnet, solange sie sich verändert (oder im Takt)
function kleinTeil(art, x, y, w, h, start, versatz, { bis = 6, takt = 0, nr = 0, tVersatz = 0 } = {}) {
  const c = leinwand(w, h), g2 = c.getContext('2d'); let zuletzt = -1
  teil(x, y, w, h, start, (g, t) => {
    const lokal = t - start + tVersatz
    const neu = lokal < bis ? true : takt ? Math.floor(lokal / takt) !== zuletzt : zuletzt < 0
    if (neu) { zuletzt = takt ? Math.floor(lokal / takt) : 1; g2.setTransform(1, 0, 0, 1, 0, 0); g2.clearRect(0, 0, w, h); KLEIN[art](g2, w, h, lokal, F, nr) }
    g.drawImage(c, x, y)
  }, versatz)
}
// Spektrum aus den echten Tondaten: Säulen aus einer vorgezeichneten, fein unterteilten Leiste
export const tonDaten = { gesamt: null, stimme: null, f: new Uint8Array(512), w: new Uint8Array(1024) }
function spektrumTeil(x, y, w, h, start, versatz) {
  const leiste = leinwand(5, h), lg = leiste.getContext('2d')
  for (let k = 0; k < h; k += 4) { lg.fillStyle = W.fb(k < h * 0.25 ? S.akzent : S.haupt, 0.95 - 0.6 * (k / h)); lg.fillRect(0, k, 5, 3) }
  const n = Math.floor(w / 6)
  teil(x, y, w, h, start, (g, t) => {
    if (tonDaten.gesamt) tonDaten.gesamt.getByteFrequencyData(tonDaten.f)
    for (let i = 0; i < n; i++) {
      const bin = Math.floor(Math.pow(i / n, 1.8) * 300) + 1
      let v = tonDaten.gesamt ? tonDaten.f[bin] / 255 : 0.15 + 0.25 * Math.abs(Math.sin(t * 3 + i * 0.4))
      v = Math.max(0.03, v); const hh = Math.floor((v * h) / 4) * 4
      g.globalAlpha *= 1; g.drawImage(leiste, 0, h - hh, 5, hh, x + i * 6, y + h - hh, 5, hh)
    }
    g.fillStyle = W.fb(S.haupt, 0.15); g.fillRect(x, y + h, w, 1)
  }, versatz)
}

// ---------- echte Werte (Etappe L3) ----------
// Vor aufbauen() setzen: echt = Ergebnis von startsequenz/lageDaten.js sequenzDaten() oder null (dann Beispieldaten mit
// Hinweis „Beispiel“), datum/wetter als fertige Texte. Die Kleinteile (To-do-Liste, Lager) lesen DATEN aus zeichner.js.
let ECHT = null, DATUM = 'DIENSTAG · 03.11.', WETTER = 'ÖHRINGEN · 9 °C · BEWÖLKT'
export function setzeDaten({ echt = null, datum, wetter } = {}) {
  ECHT = echt
  if (datum) DATUM = datum
  if (wetter) WETTER = wetter
  DATEN.echt = !!echt
  if (echt) {
    DATEN.aufgaben = { ...DATEN.aufgaben, offen: echt.offen, neu: echt.neu, freigaben: echt.freigaben }
    DATEN.karten = echt.karten
    DATEN.lager = echt.lager
  }
}

// ---------- Aufbau ----------
let hinter, vorn, streifen, schild
function aufbauen() {
  hinter = bild(0, 0, 3 * B, H, (g) => W.hintergrund(g, S))
  vorn = bild(0, 0, 3 * B, H, (g) => W.vordergrund(g, S))
  streifen = bild(B / 2, H / 2 - 60, 2 * B, 120, (g) => W.lichtstreifen(g, S, B + B / 2, H / 2, 2400, 0.7 * S.lichtband + 0.3))
  const s0 = Z.VISIER + 0.2, wl = (x) => s0 + welle(x, true) * 1.8, wr = (x) => s0 + welle(x, false) * 1.8

  // ----- links: Aufbau „Kreise, dicht“ (wie Hologramm-Türkis) -----
  // Hinweis oben links: echte Werkstatt-Zahlen mit Stand – oder deutlich „Beispieldaten“ (ohne Verbindung)
  const hinweisText = () => (ECHT ? `WERKSTATT · LIVE · STAND ${ECHT.stand} UHR` : 'WERKSTATT · BEISPIELDATEN')
  const hw = bild(30, 20, 420, 30, (g) => W.txt(g, hinweisText(), 40, 40, W.fb(S.hell, 0.8), { gr: 12, gew: 600, sp: 3 })); teil(30, 20, 420, 30, wl(40), (g) => g.drawImage(hw.c, 30, 20), 1)
  const anteil = (n, voll) => Math.max(0.04, Math.min(1, n / voll))
  messuhr(380, 400, 250, ECHT ? anteil(ECHT.offen, 20) : 0.62, ECHT ? String(ECHT.offen) : '11', 'AUFGABEN OFFEN', S.haupt, wl(380), welle(380, true))
  const klein4 = ECHT
    ? [[ECHT.neu, anteil(ECHT.neu, 5), 'NEU', S.haupt], [ECHT.freigaben, anteil(ECHT.freigaben, 5), 'FREIGABE', S.haupt], [ECHT.selbsttest, ECHT.selbsttest === '–' ? 0.04 : ECHT.selbsttestRot ? 0.3 : 1, 'SELBSTTEST', ECHT.selbsttestRot ? S.akzent : S.haupt], [ECHT.gestern.bestellungen, anteil(ECHT.gestern.bestellungen, 10), 'VERKÄUFE', S.haupt]]
    : [[2, 0.8, 'NEU', S.haupt], [1, 0.35, 'FREIGABE', S.haupt], ['OK', 0.92, 'SELBSTTEST', S.haupt], [3, 0.5, 'VERKÄUFE', S.haupt]]
  ;[[860, 200], [1080, 200], [860, 420], [1080, 420]].forEach(([x, y], i) => { const [ti, w, u, farbe] = klein4[i]; messuhr(x, y, 90, w, String(ti), u, farbe, wl(x) + (y > 300 ? 0.15 : 0), welle(x, true)) })
  kleinTeil('baum', 1250, 60, 640, 560, wl(1250), welle(1250, true), { bis: 9, tVersatz: 1.6 })
  for (let row = 0; row < 3; row++) { // Reihen kleiner Kreise mit kreisenden Bögen
    const y = 700 + row * 70, r = 26, n = 9, x = 60, w = 640
    const fest = bild(x - 4, y - r - 4, w + 8, 2 * r + 8, (g) => { for (let i = 0; i < n; i++) { const cx = x + r + (i * (w - 2 * r)) / (n - 1); W.bogen(g, S, cx, y, r, 0, 7, { al: 0.5 }); W.txt(g, String(20 + i * 13 + row * 3), cx, y + 4, W.fb(S.hell, 1), { gr: 13, aus: 'center', sp: 0 }) } })
    teil(x - 4, y - r - 4, w + 8, 2 * r + 8, wl(x) + row * 0.1, (g, t) => {
      g.drawImage(fest.c, fest.x0, fest.y0); g.lineWidth = r * 0.2
      for (let i = 0; i < n; i++) { const cx = x + r + (i * (w - 2 * r)) / (n - 1), a = t * (0.6 + (i % 3) * 0.3) * (i % 2 ? 1 : -1) + i; g.strokeStyle = W.fb(i === 2 + row ? S.akzent : S.haupt, 0.9); g.beginPath(); g.arc(cx, y, r * 0.7, a, a + 1 + ((i * 0.7 + row) % 4)); g.stroke() }
    }, 0.9)
  }
  kleinTeil('aufgaben', 760, 660, 560, 380, wl(760), welle(760, true), { bis: 5 })
  kleinTeil('zahlen', 1350, 660, 530, 180, wl(1350), welle(1350, true), { bis: 0, takt: 0.12 })
  spektrumTeil(1350, 860, 530, 170, wl(1350) + 0.2, welle(1350, true))

  // ----- rechts: Aufbau „frei schwebend“ (wie Silberlicht) -----
  const ox = 2 * B
  const hw2 = bild(ox + 30, 20, 420, 30, (g) => W.txt(g, hinweisText(), ox + 40, 40, W.fb(S.hell, 0.8), { gr: 12, gew: 600, sp: 3 })); teil(ox + 30, 20, 420, 30, wr(ox + 40), (g) => g.drawImage(hw2.c, ox + 30, 20), 0)
  { // Globus: Ringe vorgezeichnet, Punkte drehen sich
    const x = ox + 420, y = 420, r = 230
    const fest = bild(x - r * 1.45, y - r * 1.45, r * 2.9, r * 2.9, (g) => { W.hof(g, S, x, y, r * 1.4, 0.2); W.bogen(g, S, x, y, r + 8, 0, 7, { al: 0.4 }); W.skala(g, S, x, y, r + 30, 120, 4, 0.35) })
    const bog = rund(x, y, r + 20, (g) => W.bogen(g, S, x, y, r + 16, -0.6, 0.9, { al: 0.9, b: 2 }))
    const punkte = []; for (let b = -78; b <= 78; b += 4) for (let l = 0; l < 360; l += 4) punkte.push([(b * Math.PI) / 180, (l * Math.PI) / 180, rauschen(l * 0.07 + 1) * rauschen(b * 0.09 + 2) + 0.5 * rauschen((l + b) * 0.045 + 4) > 0.45]) // Kontinente aus überlagerten Wellen
    teil(x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4, wr(x), (g, t) => {
      g.drawImage(fest.c, fest.x0, fest.y0); zeigeRund(g, bog, t * 0.4)
      const dreh = t * 0.25
      for (const [la, lo, land] of punkte) { const a = lo + dreh, pz = Math.cos(la) * Math.cos(a); if (pz < 0) continue; g.fillStyle = land ? W.fb(S.hell, 0.5 + 0.5 * pz) : W.fb(S.haupt, 0.25 * pz); g.fillRect(x + Math.cos(la) * Math.sin(a) * r, y - Math.sin(la) * r, land ? 2 : 1, land ? 2 : 1) }
    }, welle(x, false))
    const le = bild(x + 170, 100, 380, 200, (g) => W.leit(g, S, x + 180, 260, x + 340, 140, 'BESTELLUNGEN', `${ECHT ? ECHT.gestern.bestellungen : 3} GESTERN`))
    teil(x + 170, 100, 380, 200, wr(x) + 0.6, (g) => g.drawImage(le.c, le.x0, le.y0), welle(x, false))
  }
  // Kanäle: echt = Bestellungen der letzten 14 Tage, Ring = Anteil am Umsatz; sonst Beispielwerte
  const kanaele = ECHT ? ECHT.kanaele.map((k) => [`${k.name} · 14 T`, k.bestellungen, Math.max(0.04, k.anteil), S.haupt]) : [['ETSY', 33, 1, S.haupt], ['AMAZON', 41, 0.92, S.akzent], ['SHOP', 58, 1, S.haupt]]
  kanaele.forEach(([n, a, w, farbe], i) => {
    const x = ox + 900 + i * 230, y = 330
    messuhr(x, y, 80, w, String(a), '', farbe, wr(x), welle(x, false))
    const tx = bild(x - 80, y + 104, 160, 24, (g) => W.txt(g, n, x, y + 120, W.fb(S.hell, 0.9), { gr: 12, aus: 'center', sp: 3 })); teil(x - 80, y + 104, 160, 24, wr(x) + 0.2, (g) => g.drawImage(tx.c, tx.x0, tx.y0), welle(x, false))
  })
  { // Radar: Kegel dreht sich, Punkte leuchten auf, wenn er sie überstreicht
    const x = ox + 1560, y = 640, r = 140
    const fest = bild(x - r * 1.25, y - r * 1.25, r * 2.5, r * 2.5, (g) => { W.hof(g, S, x, y, r * 1.2, 0.15); for (let k = 1; k <= 4; k++) W.bogen(g, S, x, y, (r * k) / 4, 0, 7, { al: 0.3 }); g.strokeStyle = W.fb(S.haupt, 0.25); g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.moveTo(x, y - r); g.lineTo(x, y + r); g.stroke(); W.skala(g, S, x, y, r + 14, 72, 5, 0.5) })
    const kegel = rund(x, y, r, (g) => { const v = g.createConicGradient(-1.2, x, y); v.addColorStop(0, W.fb(S.haupt, 0)); v.addColorStop(0.19, W.fb(S.haupt, 0.55)); v.addColorStop(0.191, W.fb(S.haupt, 0)); g.fillStyle = v; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = W.fb(S.hell, 1); g.beginPath(); g.moveTo(x, y); g.lineTo(x + r, y); g.stroke() })
    const z = zufall(9), ziele = Array.from({ length: 7 }, () => [z() * 7, z() * r * 0.9])
    teil(x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4, wr(x), (g, t) => {
      g.drawImage(fest.c, fest.x0, fest.y0); const a = t * 1.6; zeigeRund(g, kegel, a)
      ziele.forEach(([w, d], i) => { const ab = ((a - w) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2), hell = Math.max(0, 1 - ab / 2.5); g.fillStyle = W.fb(i === 0 ? S.akzent : S.hell, 0.15 + 0.85 * hell); g.beginPath(); g.arc(x + Math.cos(w) * d, y + Math.sin(w) * d, 3, 0, 7); g.fill() })
    }, welle(x, false))
  }
  { // Zahlenkästchen am Rand, eins nach dem anderen: echt = Bestellungen der letzten 9 Tage (Kopf = Datum), sonst Beispiel
    const kaestchen = ECHT && ECHT.tage9.length ? ECHT.tage9.map((t) => [String(t.bestellungen).padStart(2, '0'), t.tag]) : Array.from({ length: 9 }, (_, i) => [String(11 + i * 7).padStart(3, '0'), 'BSP'])
    kaestchen.forEach(([zahl, kopf], i) => { const x = ox + 1790, y = 80 + i * 100, c = bild(x - 2, y - 2, 96, 62, (g) => { g.strokeStyle = W.fb(S.haupt, 0.6); g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, 90, 56); g.fillStyle = W.fb(S.haupt, S.glas + 0.05); g.fillRect(x + 1, y + 1, 89, 18); W.txt(g, zahl, x + 8, y + 46, W.fb(S.hell, 1), { gr: 22, gew: 300, sp: 1 }); W.txt(g, kopf, x + 84, y + 14, W.fb(S.hell, 0.8), { gr: 10, aus: 'right', sp: 0 }); if (ECHT) W.txt(g, 'BEST.', x + 84, y + 46, W.fb(S.haupt, 0.7), { gr: 9, aus: 'right', sp: 1 }) }); teil(x - 2, y - 2, 96, 62, wr(x) + i * 0.08, (g) => g.drawImage(c.c, c.x0, c.y0), 1) })
  }
  { // Umsatzkurve zeichnet sich von links nach rechts
    const reihe = ECHT && ECHT.umsatz14.length >= 2 ? ECHT.umsatz14 : ECHT ? [0, 0] : [62, 88, 41, 120, 96, 74, 133, 58, 101, 87, 145, 92, 110, 123]
    const x = ox + 60, y = 780, w = 1300, h = 180, f = bild(x - 6, y - 10, w + 12, h + 16, (g) => W.flaeche(g, S, x, y, w, h, reihe, ECHT ? ECHT.umsatzMax : 160))
    const euro = (v) => v.toFixed(2).replace('.', ',')
    const unter = ECHT ? `UMSATZ · 14 TAGE · BIS ${ECHT.umsatzMax} € · GESTERN ${euro(ECHT.gestern.umsatz)} €` : 'UMSATZ · 14 TAGE · BEISPIEL'
    const tx = bild(x, 985, 900, 22, (g) => W.txt(g, unter, x, 1000, W.fb(S.haupt, 0.9), { gr: 12, sp: 3 }))
    const st = wr(x) + 0.3
    teil(x - 6, y - 10, w + 12, h + 230, st, (g, t) => { const p = raus(phase(t, st + 0.2, st + 2.2)); g.save(); g.beginPath(); g.rect(x - 6, y - 10, (w + 12) * p, h + 16); g.clip(); g.drawImage(f.c, f.x0, f.y0); g.restore(); g.drawImage(tx.c, tx.x0, tx.y0) }, 0.1)
  }
  kleinTeil('lager', ox + 900, 520, 480, 200, wr(ox + 900) + 0.3, welle(ox + 900, false), { bis: 5 })

  // ----- Mitte: Kennzeichen, Uhr, Datum (der Schild hat seinen eigenen Ablauf) -----
  const x = B + B / 2, y = H / 2
  // nur Angaben, die stimmen: Werkstatt-Verbindung, Platten des Schilds, Lokis Stimme, Amazon-Probleme
  ;[[-1, -1, 'WERKSTATT', ECHT ? 'VERBUNDEN' : 'BEISPIEL'], [1, -1, 'PLATTEN', '12 / 12'], [-1, 1, 'STIMME', 'L.O.K.I.'], [1, 1, 'AMAZON-PROBLEME', ECHT ? String(ECHT.amazonProbleme) : 'BEISPIEL']].forEach(([sx, sy, t1, t2], i) => {
    const ax = x + sx * 300, ay = y + sy * 290, bx = x + sx * 620, by = y + sy * 330
    const x0 = Math.min(ax, bx) - 170, y0 = Math.min(ay, by) - 40
    const c = bild(x0, y0, Math.abs(bx - ax) + 340, Math.abs(by - ay) + 80, (g) => {
      g.strokeStyle = W.fb(S.haupt, 0.7); g.lineWidth = 1; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx - sx * 60, by); g.lineTo(bx, by); g.stroke(); g.fillStyle = W.fb(S.hell, 1); g.beginPath(); g.arc(ax, ay, 3, 0, 7); g.fill()
      W.txt(g, t1, bx, by - 8, W.fb(S.haupt, 0.9), { gr: 12, aus: sx < 0 ? 'left' : 'right', sp: 2 }); W.leuchten(g, S, 8, () => W.txt(g, t2, bx, by + 20, W.fb(S.hell, 1), { gr: 20, gew: 300, aus: sx < 0 ? 'left' : 'right', sp: 1 }))
    })
    teil(c.x0, c.y0, c.c.width, c.c.height, Z.VERWANDLUNG + 3.6 + i * 0.25, (g) => g.drawImage(c.c, c.x0, c.y0), 0)
  })
  const datum = bild(B + B - 520, 30, 480, 70, (g) => { W.txt(g, DATUM, B + B - 60, 60, W.fb(S.hell, 0.95), { gr: 16, aus: 'right', sp: 2 }); W.txt(g, WETTER, B + B - 60, 82, W.fb(S.haupt, 0.8), { gr: 11, aus: 'right', sp: 2 }) })
  teil(datum.x0, 30, 480, 70, Z.VISIER + 1.0, (g) => g.drawImage(datum.c, datum.x0, datum.y0), 0)
  teil(B + 40, 20, 300, 90, Z.VISIER + 0.8, (g) => { // echte Uhrzeit
    const hhmm = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }) // wie Datum: deutsche Zeit
    W.leuchten(g, S, 10, () => W.txt(g, hhmm, B + 60, 76, W.fb(S.hell, 1), { gr: 44, gew: 200, sp: 4 })); W.txt(g, 'ORTSZEIT', B + 62, 96, W.fb(S.haupt, 0.8), { gr: 11, sp: 3 })
  }, 0)
  teil(x - 360, 990, 720, 60, Z.VISIER + 1.2, (g, t) => { // Lokis Stimme als Wellenbalken (echte Tondaten)
    if (tonDaten.stimme) tonDaten.stimme.getByteTimeDomainData(tonDaten.w)
    const n = 165, bx = x - 330, mitteY = 1020, v = g.createLinearGradient(0, mitteY - 24, 0, mitteY + 24); v.addColorStop(0, W.fb(S.hell, 0.15)); v.addColorStop(0.5, W.fb(S.hell, 0.95)); v.addColorStop(1, W.fb(S.hell, 0.15)); g.fillStyle = v
    for (let i = 0; i < n; i++) { let s = 0; if (tonDaten.stimme) for (let k = 0; k < 6; k++) { const a = (tonDaten.w[i * 6 + k] - 128) / 128; s += a * a } const hh = 1 + Math.min(24, Math.sqrt(s / 6) * 70); g.fillRect(bx + i * 4, mitteY - hh, 2, hh * 2) }
    let pegel = 0; if (tonDaten.stimme) for (let i = 0; i < 1024; i += 8) pegel = Math.max(pegel, Math.abs(tonDaten.w[i] - 128))
    W.txt(g, 'L.O.K.I. SPRICHT', x - 350, 1026, W.fb(pegel > 6 ? S.hell : S.haupt, pegel > 6 ? 1 : 0.6), { gr: 11, aus: 'right', sp: 3 })
  }, 0)

  schild = bauSchild(x, y, 380)
}

// ---------- Runen-Schild: Ebenen einzeln vorgezeichnet ----------
function bauSchild(x, y, R) {
  const s = { x, y, R }
  s.hof = rund(x, y, R * 1.9, (g) => { W.hof(g, S, x, y, R * 1.9, 0.35); W.hof(g, S, x, y, R * 0.9, 0.35, S.hell) })
  s.aussen = rund(x, y, R * 1.2, (g) => { W.skala(g, S, x, y, R * 1.08, 180, 5, 0.55); W.bogen(g, S, x, y, R * 1.12, -2.5, -0.6, { al: 0.95, b: 2 }); W.bogen(g, S, x, y, R * 1.12, 0.6, 2.5, { al: 0.95, b: 2 }); W.bogen(g, S, x, y, R * 1.16, 2.9, 3.4, { al: 1, b: 4, farbe: S.akzent }) })
  s.runen = rund(x, y, R * 1.02, (g) => {
    W.band(g, S, x, y, R * 0.86, R, 0, 7, { al: 0.55 })
    g.save(); g.translate(x, y); g.font = `${Math.round(R * 0.085)}px ${RUNEN_SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle'
    for (let i = 0; i < 48; i++) { g.save(); g.rotate((i / 48) * Math.PI * 2); g.fillStyle = W.fb(S.hell, i % 6 === 0 ? 1 : 0.75); g.fillText(W.RN[i % W.RN.length], 0, -R * 0.93); g.restore() }
    g.restore()
  })
  s.platten = Array.from({ length: 12 }, (_, i) => rund(x, y, R * 0.82, (g) => {
    const a = -Math.PI / 2 + (i / 12) * Math.PI * 2, m = a + Math.PI / 12
    W.band(g, S, x, y, R * 0.56, R * 0.8, a + 0.03, a + Math.PI / 6 - 0.03, { al: 0.85 })
    W.leuchten(g, S, 10, () => W.txt(g, W.RN[(i * 5) % W.RN.length], x + Math.cos(m) * R * 0.68, y + Math.sin(m) * R * 0.68 + R * 0.04, W.fb(S.hell, 1), { gr: Math.round(R * 0.12), aus: 'center', schrift: RUNEN_SCHRIFT, sp: 0 }))
  }))
  s.segment = rund(x, y, R * 0.52, (g) => W.segmente(g, S, x, y, R * 0.46, R * 0.5, 60, 0.012, 0.8, { al: 0.7, kante: 0 }))
  s.innen = rund(x, y, R * 0.44, (g) => { W.bogen(g, S, x, y, R * 0.42, 0, 7, { al: 0.5 }); W.bogen(g, S, x, y, R * 0.38, 0.4, 2.2, { al: 1, b: 3 }); W.bogen(g, S, x, y, R * 0.38, 3.6, 5.3, { al: 1, b: 3 }) })
  s.vegvisir = rund(x, y, R * 0.34, (g) => { g.strokeStyle = W.fb(S.hell, 0.85); g.lineWidth = 1.5; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.beginPath(); g.moveTo(x + Math.cos(a) * R * 0.1, y + Math.sin(a) * R * 0.1); g.lineTo(x + Math.cos(a) * R * 0.3, y + Math.sin(a) * R * 0.3); g.stroke(); g.beginPath(); g.arc(x + Math.cos(a) * R * 0.3, y + Math.sin(a) * R * 0.3, 4, 0, 7); g.stroke() } })
  s.name = bild(x - 120, y + R * 0.18, 240, 40, (g) => W.txt(g, LOKI, x, y + R * 0.24, W.fb(S.hell, 0.9), { gr: Math.round(R * 0.06), aus: 'center', schrift: RUNEN_SCHRIFT, sp: 6 }))
  return s
}
function zeichneSchild(g, t) {
  const s = schild, { x, y, R } = s, dunkel = t >= Z.DUNKEL && t < Z.EINSCHLAG, nach = t >= Z.EINSCHLAG
  const schlag = nach ? (1 - phase(t, Z.EINSCHLAG, Z.EINSCHLAG + 1)) ** 2 : 0
  const ab = dunkel ? 0.14 : 1 // im Dunkel fast aus – nur die Runen entzünden sich nacheinander
  // Drehung: langsam, während der Verwandlung schneller, nach dem Einschlag ruhig und kräftig
  const schub = weich(phase(t, Z.VERWANDLUNG, Z.DUNKEL)) * 1.6 + (nach ? 2 * (1 - phase(t, Z.EINSCHLAG, Z.EINSCHLAG + 2)) : 0)
  const drehung = t * 0.05 + schub
  g.globalAlpha = (0.3 * phase(t, Z.VISIER, Z.VISIER + 1.6) + 0.5 * phase(t, Z.VERWANDLUNG, Z.DUNKEL) + (nach ? 0.2 + 0.6 * schlag : 0)) * (dunkel ? 0.3 : 1)
  zeigeRund(g, s.hof, 0, 0.85 + 0.15 * Math.sin(t * 2) + schlag * 0.5)
  const ebene = (sp, an, winkel, skalVon = 1.15) => { const k = raus(phase(t, an, an + 0.7)); if (k <= 0) return; g.globalAlpha = k * ab * (k < 1 ? flacker(t, an * 10) : 1); zeigeRund(g, sp, winkel, skalVon + (1 - skalVon) * k) }
  ebene(s.aussen, Z.VERWANDLUNG, drehung * 0.4)
  ebene(s.runen, Z.VERWANDLUNG + 0.4, -drehung * 0.25, 1.25)
  s.platten.forEach((p, i) => { // fliegen nacheinander von außen heran und rasten ein
    const an = Z.VERWANDLUNG + 0.8 + i * 0.22, k = raus(phase(t, an, an + 0.55)); if (k <= 0) return
    const m = -Math.PI / 2 + (i / 12) * Math.PI * 2 + Math.PI / 12, weg = (1 - k) * R * 0.9
    g.globalAlpha = k * ab; zeigeRund(g, p, (1 - k) * 0.6, 1, Math.cos(m) * weg, Math.sin(m) * weg)
  })
  ebene(s.segment, Z.VERWANDLUNG + 3.4, drehung * 1.2)
  ebene(s.innen, Z.VERWANDLUNG + 3.7, -drehung * 2.2)
  ebene(s.vegvisir, Z.VERWANDLUNG + 4.0, drehung * 0.3, 0.5)
  g.globalAlpha = phase(t, Z.VERWANDLUNG + 4.0, Z.VERWANDLUNG + 4.6) * ab; g.drawImage(s.name.c, s.name.x0, s.name.y0)
  // Runen entzünden sich im Dunkel eine nach der anderen (heller Abzug des Runenbands über einem wachsenden Kreisausschnitt)
  if (t >= Z.DUNKEL + 0.1) {
    const p = nach ? 1 : phase(t, Z.DUNKEL + 0.1, Z.EINSCHLAG - 0.05), a0 = -Math.PI / 2 - drehung * 0.25
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = nach ? 0.5 * (1 - phase(t, Z.EINSCHLAG + 0.5, Z.EINSCHLAG + 3)) + 0.15 : 0.95
    g.beginPath(); g.moveTo(x, y); g.arc(x, y, R * 1.05, a0, a0 + Math.PI * 2 * p); g.closePath(); g.clip(); zeigeRund(g, s.runen, -drehung * 0.25); g.restore()
  }
  // Kern
  const kern = dunkel ? 0.25 : 0.3 + 0.4 * phase(t, Z.VERWANDLUNG, Z.DUNKEL) + (nach ? 0.35 : 0) + schlag
  g.globalAlpha = klemm(phase(t, Z.VISIER, Z.VISIER + 1) * kern)
  const v = g.createRadialGradient(x, y, 0, x, y, R * (0.2 + 0.25 * kern)); v.addColorStop(0, 'rgba(255,255,255,1)'); v.addColorStop(0.25, W.fb(S.hell, 0.8)); v.addColorStop(1, W.fb(S.haupt, 0)); g.fillStyle = v; g.fillRect(x - R, y - R, 2 * R, 2 * R)
  g.globalAlpha = 1
}

// ---------- ein Bild ----------
// ---------- Leinwand verbinden ----------
// versatzX = 1920: nur der mittlere Bildschirm (Rechner mit einem Bildschirm), sonst alle drei nebeneinander (5760×1080)
let g, versatz = 0
export function verbinde(c, { versatzX = 0 } = {}) { versatz = versatzX; c.width = versatzX ? B : 3 * B; c.height = H; g = c.getContext('2d', { alpha: false }) }
// ausBei = Beginn des Ausblendens (im Programm erst nach Lokis Gruß, also beweglich), ausDauer = Länge (Abbruch: kurz)
export function zeichne(t, ausBei = Z.AUS, ausDauer = 2) {
  g.setTransform(1, 0, 0, 1, -versatz, 0)
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
  g.fillStyle = '#000'; g.fillRect(0, 0, 3 * B, H)
  // Hintergrund: blendet ein, im Dunkel gedimmt, Einschlag hellt kurz auf
  const schlag = t >= Z.EINSCHLAG ? (1 - phase(t, Z.EINSCHLAG, Z.EINSCHLAG + 1.2)) ** 2 : 0
  g.globalAlpha = phase(t, 0.8, Z.VISIER + 1.2) * (t >= Z.DUNKEL - 0.3 && t < Z.EINSCHLAG ? 1 - 0.75 * phase(t, Z.DUNKEL - 0.3, Z.DUNKEL + 0.3) : 1)
  g.drawImage(hinter.c, 0, 0)
  // Lichtlinie zu Beginn: wächst von der Mitte über alle drei Bildschirme
  const lp = raus(phase(t, 0.15, 1.3)), la = 1 - phase(t, 1.6, 2.6)
  if (la > 0) { g.globalAlpha = la; g.fillStyle = W.fb(S.hell, 0.9); g.fillRect(1.5 * B - 1.5 * B * lp, H / 2 - 1, 3 * B * lp, 2); g.globalAlpha = la * 0.6; g.drawImage(streifen.c, 1.5 * B - B * lp, streifen.y0, 2 * B * lp, 120) }
  g.globalAlpha = (0.5 + 0.5 * schlag) * phase(t, Z.VISIER, Z.VISIER + 2) * (t >= Z.DUNKEL && t < Z.EINSCHLAG ? 0.2 : 1); g.drawImage(streifen.c, streifen.x0, streifen.y0)
  zeichneSchild(g, t)
  // Teile mit Ein-/Ausschalt-Ablauf
  teile.forEach((ta, i) => {
    const k = sichtbar(t, ta); if (k <= 0.005) return
    const sy = k < 0.3 ? 0.04 : raus((k - 0.3) / 0.7)
    g.save(); g.globalAlpha = k * (k < 1 ? flacker(t, i) : 1)
    if (sy < 1) { g.translate(0, ta.cy); g.scale(1, sy); g.translate(0, -ta.cy) }
    ta.zeichne(g, t); g.restore()
  })
  // Vordergrund (unscharfe Bögen am Außenrand)
  g.globalAlpha = 0.9 * phase(t, Z.VISIER, Z.VISIER + 2) * (t >= Z.DUNKEL && t < Z.EINSCHLAG ? 0.3 : 1); g.drawImage(vorn.c, 0, 0)
  // Einschlag: Lichtblitz und Druckwelle (bleibt auf dem mittleren Bildschirm, läuft vor dem Rand aus)
  if (t >= Z.EINSCHLAG && t < Z.EINSCHLAG + 1.5) {
    const p = phase(t, Z.EINSCHLAG, Z.EINSCHLAG + 1.2), r = 60 + raus(p) * 840
    g.save(); g.beginPath(); g.rect(B, 0, B, H); g.clip(); g.globalCompositeOperation = 'lighter'
    g.globalAlpha = (1 - p) * 0.9; g.strokeStyle = W.fb(S.hell, 1); g.lineWidth = 2 + 30 * (1 - p); g.beginPath(); g.arc(1.5 * B, H / 2, r, 0, 7); g.stroke()
    g.globalAlpha = (1 - p) * 0.4; g.lineWidth = 1; g.beginPath(); g.arc(1.5 * B, H / 2, r * 0.8, 0, 7); g.stroke(); g.restore()
    g.globalAlpha = (1 - phase(t, Z.EINSCHLAG, Z.EINSCHLAG + 0.45)) ** 3 * 0.8; g.fillStyle = '#dff3ff'; g.fillRect(0, 0, 3 * B, H) // kurzer, heller Blitz
  }
  // Ausblenden
  const aus = phase(t, ausBei, ausBei + ausDauer); if (aus > 0) { g.globalAlpha = aus; g.fillStyle = '#000'; g.fillRect(0, 0, 3 * B, H) }
  g.globalAlpha = 1
}

export { aufbauen, TON }
