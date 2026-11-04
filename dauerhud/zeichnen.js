// Dauer-HUD, Entwurf A „Leitstand ruhig“ (Wahl Auftraggeber 03.11.2026) mit echten Daten. Zwei Ebenen: „hinten“ wird nur
// neu gezeichnet, wenn sich Daten oder das Datum ändern (aufwendig: Leuchten, Verläufe); „vorne“ je Bild nur der langsam
// drehende Runen-Schild, die Uhr und das Ton-Spektrum. Ohne Verbindung zu Loki: Striche statt Zahlen, nie Beispielwerte.
import { STILE, WERKZEUG as W } from '../vorschau/start-sequenz/standbilder/standbild.js'
import { DATEN } from '../vorschau/start-sequenz/hud/zeichner.js'

export const S = STILE.find((s) => s.name === 'Kombination')
export const B = W.B, H = W.H
const ohne = '–'

/** Bildfläche der Kamerakachel (rechter Bildschirm); das Bild selbst zeichnet zeichneVorne, sobald es da ist */
export const KAMERA_FELD = { x: 2 * B + 52, y: 86, w: 1816, h: 482 }
/** Kamerakachel: Rahmen hinten; ohne Bild „Kein Signal“ (nicht eingetragen bzw. nicht erreichbar) */
function kamera(g, name, zustand) {
  const { x: ix, y: iy, w: iw, h: ih } = KAMERA_FELD
  W.glas(g, S, ix - 12, iy - 26, iw + 24, ih + 38, `KAMERA · ${name}`, zustand === 'bild' ? 'LIVE' : zustand === 'aus' ? 'FOLGT' : 'STÖRUNG')
  const v = g.createLinearGradient(0, iy, 0, iy + ih); v.addColorStop(0, '#0b1a24'); v.addColorStop(1, '#05090d'); g.fillStyle = v; g.fillRect(ix, iy, iw, ih)
  for (let z = iy; z < iy + ih; z += 3) { g.fillStyle = 'rgba(255,255,255,0.02)'; g.fillRect(ix, z, iw, 1) }
  g.strokeStyle = W.fb(S.hell, 0.7); g.lineWidth = 2
  for (const [ex, ey, sx, sy] of [[ix, iy, 1, 1], [ix + iw, iy, -1, 1], [ix, iy + ih, 1, -1], [ix + iw, iy + ih, -1, -1]]) { g.beginPath(); g.moveTo(ex + sx * 22, ey); g.lineTo(ex, ey); g.lineTo(ex, ey + sy * 22); g.stroke() }
  if (zustand === 'bild') return
  W.txt(g, 'KEIN SIGNAL', ix + iw / 2, iy + ih / 2, W.fb(S.hell, 0.7), { gr: 22, gew: 600, aus: 'center', sp: 3 })
  W.txt(g, zustand === 'aus' ? 'IN DEN EINSTELLUNGEN VON L.O.K.I. EINTRAGEN' : 'KAMERA NICHT ERREICHBAR', ix + iw / 2, iy + ih / 2 + 30, W.fb(S.haupt, 0.55), { gr: 13, aus: 'center', sp: 2 })
}

/**
 * Hintere Ebene zeichnen. d = sequenzDaten(…) aus startsequenz/lageDaten.js oder null; verbunden = Loki antwortet;
 * datum/wetter = fertige Texte.
 */
export function zeichneHinten(g, { d, verbunden, datum, wetter, kam = null, kamBild = false }) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 3 * B, H)
  W.hintergrund(g, S)
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, 3 * B, H)
  const hinweis = !verbunden ? 'L.O.K.I. NICHT VERBUNDEN – KEINE DATEN' : d ? `WERKSTATT · LIVE · STAND ${d.stand} UHR` : 'WERKSTATT NICHT VERBUNDEN – KEINE ZAHLEN'
  const farbe = verbunden && d ? W.fb(S.hell, 0.8) : W.fb(S.akzent, 0.95)
  for (const ox of [0, 2 * B]) W.txt(g, hinweis, ox + 40, 40, farbe, { gr: 13, gew: 600, sp: 3 })
  // ----- links: Aufgaben, Uhren, Yggdrasil, To-do, Lager -----
  W.anzeige(g, S, 330, 330, 210, d ? Math.max(0.04, Math.min(1, d.offen / 20)) : 0.04, d ? String(d.offen) : ohne, 'AUFGABEN OFFEN')
  const vier = d
    ? [[d.neu, d.neu / 5, 'NEU'], [d.freigaben, d.freigaben / 5, 'FREIGABE'], [d.selbsttest, d.selbsttest === '–' ? 0 : d.selbsttestRot ? 0.3 : 1, 'SELBSTTEST', d.selbsttestRot], [d.gestern.bestellungen, d.gestern.bestellungen / 10, 'VERKÄUFE']]
    : [[ohne, 0, 'NEU'], [ohne, 0, 'FREIGABE'], [ohne, 0, 'SELBSTTEST'], [ohne, 0, 'VERKÄUFE']]
  vier.forEach(([t, w, u, rot], i) => W.anzeige(g, S, 720 + (i % 2) * 190, 200 + Math.floor(i / 2) * 190, 70, Math.max(0.04, Math.min(1, w)), String(t), u, rot ? S.akzent : S.haupt))
  W.klein(g, S, 'baum', 1160, 60, 720, 560)
  // Kleinteile lesen DATEN (zeichner.js): echte Karten/Lager oder leer
  DATEN.echt = true
  DATEN.aufgaben = { ...DATEN.aufgaben, offen: d ? d.offen : ohne }
  DATEN.karten = d ? d.karten : []
  DATEN.lager = d ? d.lager : []
  W.klein(g, S, 'aufgaben', 60, 650, 900, 390)
  W.klein(g, S, 'lager', 1000, 660, 880, 200)
  // ----- Mitte: Datum/Wetter (Uhr und Schild sind vorne) -----
  W.txt(g, datum, 2 * B - 60, 60, W.fb(S.hell, 0.95), { gr: 16, aus: 'right', sp: 2 })
  W.txt(g, wetter, 2 * B - 60, 82, W.fb(S.haupt, 0.8), { gr: 11, aus: 'right', sp: 2 })
  // ----- rechts: Kameras, Umsatz, Bestellungen je Tag -----
  kamera(g, kam ? String(kam.name).toUpperCase() : 'CARPORT', !kam ? 'aus' : kamBild ? 'bild' : 'stoerung')
  const reihe = d && d.umsatz14.length >= 2 ? d.umsatz14 : [0, 0]
  W.flaeche(g, S, 2 * B + 60, 660, 1300, 260, reihe, d ? d.umsatzMax : 10)
  W.txt(g, d ? `UMSATZ · 14 TAGE · BIS ${d.umsatzMax} € · GESTERN ${d.gestern.umsatz.toFixed(2).replace('.', ',')} €` : 'UMSATZ · 14 TAGE · KEINE DATEN', 2 * B + 60, 960, W.fb(S.haupt, 0.9), { gr: 12, sp: 3 })
  const tage = d ? d.tage9.slice(-4) : []
  for (let i = 0; i < 4; i++) {
    const x = 2 * B + 1500, y = 640 + i * 100, t = tage[i]
    g.strokeStyle = W.fb(S.haupt, 0.6); g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, 90, 56); g.fillStyle = W.fb(S.haupt, S.glas + 0.05); g.fillRect(x + 1, y + 1, 89, 18)
    W.txt(g, t ? String(t.bestellungen).padStart(2, '0') : ohne, x + 8, y + 46, W.fb(S.hell, 1), { gr: 22, gew: 300, sp: 1 }); W.txt(g, t ? t.tag : '', x + 84, y + 14, W.fb(S.hell, 0.8), { gr: 10, aus: 'right', sp: 0 }); if (t) W.txt(g, 'BEST.', x + 84, y + 46, W.fb(S.haupt, 0.7), { gr: 9, aus: 'right', sp: 1 })
  }
  W.txt(g, 'BESTELLUNGEN JE TAG', 2 * B + 1500, 1050, W.fb(S.haupt, 0.7), { gr: 10, sp: 2 })
  W.vordergrund(g, S)
}

/** Runen-Schild einmal vorzeichnen (wird vorne langsam gedreht) */
export function schildBild(R = 300) {
  // groß genug für den Lichthof (Radius 1,9 R) – sonst sieht man beim Drehen ein Viereck
  const c = document.createElement('canvas'); c.width = c.height = Math.ceil(R * 4)
  const g = c.getContext('2d'); W.schild(g, S, c.width / 2, c.height / 2, R)
  return c
}

/** Vordere Ebene je Bild: Schild (langsam drehend), Uhr, Spektrum (Ton des PCs über Wallpaper Engine, sonst ruhig) */
/** roter Stumm-Knopf unten mittig auf dem mittleren Bildschirm */
export const STUMM_KNOPF = { x: B + B / 2, y: H - 120, r: 42 }
function stummKnopf(g, t, loki) {
  const { x, y, r } = STUMM_KNOPF
  const hoert = !!loki?.mikrofon, da = !!loki && loki.zustand !== 'aus'
  const rot = '#ff3b30', puls = hoert ? 0.75 : 0.55 + 0.4 * Math.abs(Math.sin(t * 2))
  g.save()
  g.shadowColor = rot; g.shadowBlur = hoert ? 14 : 28 * puls
  const v = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r)
  v.addColorStop(0, hoert ? '#ff7a70' : '#c0322a'); v.addColorStop(1, hoert ? '#b3140c' : '#4a0805')
  g.fillStyle = v; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill()
  g.shadowBlur = 0; g.strokeStyle = W.fb(rot, puls); g.lineWidth = 2; g.beginPath(); g.arc(x, y, r + 7, 0, Math.PI * 2); g.stroke()
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.beginPath(); g.moveTo(x + Math.cos(a) * (r + 11), y + Math.sin(a) * (r + 11)); g.lineTo(x + Math.cos(a) * (r + (i % 6 ? 15 : 20)), y + Math.sin(a) * (r + (i % 6 ? 15 : 20))); g.stroke() }
  // Mikrofon-Zeichen, durchgestrichen wenn stumm
  g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 3
  g.beginPath(); g.roundRect(x - 7, y - 20, 14, 24, 7); g.fill()
  g.beginPath(); g.arc(x, y - 4, 13, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke()
  g.beginPath(); g.moveTo(x, y + 9); g.lineTo(x, y + 17); g.moveTo(x - 8, y + 17); g.lineTo(x + 8, y + 17); g.stroke()
  if (!hoert) { g.lineWidth = 4; g.beginPath(); g.moveTo(x - 20, y - 22); g.lineTo(x + 20, y + 20); g.stroke() }
  g.restore()
  W.txt(g, !loki ? 'L.O.K.I. NICHT VERBUNDEN' : hoert ? 'L.O.K.I. HÖRT ZU · KLICK = STUMM' : loki.zustand === 'laedt' ? 'L.O.K.I. STARTET …' : da ? 'L.O.K.I. STUMM · KLICK = AN' : 'L.O.K.I. AUS · KLICK = AN', x, y + r + 40, W.fb(hoert ? S.hell : rot, 0.95), { gr: 12, gew: 600, aus: 'center', sp: 3 })
}

export function zeichneVorne(g, { hinten, schild, t, uhrzeit, ton, versatz = 0, kamBilder = [], loki = null }) {
  g.setTransform(1, 0, 0, 1, -versatz, 0) // versatz = 1920: nur der mittlere Bildschirm
  g.drawImage(hinten, 0, 0)
  if (versatz === 0 && kamBilder.some(Boolean)) {
    // zwei Objektive nebeneinander (Duo PoE), je ganzes Bild eingepasst; nur eins da → es bekommt die ganze Kachel
    const f = KAMERA_FELD, da = kamBilder.filter(Boolean), spalt = 16, bw = da.length > 1 ? (f.w - spalt) / 2 : f.w
    da.forEach((q, i) => {
      const qw = q.videoWidth || q.width, qh = q.videoHeight || q.height
      if (!qw || !qh) return
      const m = Math.min(bw / qw, f.h / qh), w = qw * m, h = qh * m, x0 = f.x + i * (bw + spalt)
      g.drawImage(q, x0 + (bw - w) / 2, f.y + (f.h - h) / 2, w, h)
    })
  }
  g.save(); g.globalAlpha = 0.55; g.translate(B + B / 2, H / 2); g.rotate(t * 0.01); g.drawImage(schild, -schild.width / 2, -schild.height / 2); g.restore()
  W.leuchten(g, S, 10, () => W.txt(g, uhrzeit, B + 60, 76, W.fb(S.hell, 1), { gr: 44, gew: 200, sp: 4 })); W.txt(g, 'ORTSZEIT', B + 62, 96, W.fb(S.haupt, 0.8), { gr: 11, sp: 3 })
  // Spektrum links unten (1000, 880, 880×150)
  const x0 = 1000, y0 = 880, w = 880, h = 150, n = Math.floor(w / 6)
  for (let i = 0; i < n; i++) {
    const v = ton ? Math.min(1, (ton[Math.floor((i / n) * 64)] ?? 0) * 1.6) : 0.08 + 0.06 * Math.abs(Math.sin(t * 0.8 + i * 0.3))
    const hh = Math.max(3, Math.floor((v * h) / 4) * 4)
    for (let k = 0; k < hh; k += 4) { g.fillStyle = W.fb(k > h * 0.75 ? S.akzent : S.haupt, 0.25 + 0.7 * (k / h)); g.fillRect(x0 + i * 6, y0 + h - k - 3, 5, 3) }
  }
  W.txt(g, ton ? 'TON DES PCS' : 'TON (KEINE QUELLE)', x0, y0 - 8, W.fb(S.haupt, 0.7), { gr: 10, sp: 2 })
  stummKnopf(g, t, loki)
}
