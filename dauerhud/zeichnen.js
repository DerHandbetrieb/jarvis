// Dauer-HUD, Entwurf A „Leitstand ruhig“ (Wahl Auftraggeber 03.11.2026) mit echten Daten. Zwei Ebenen: „hinten“ wird nur
// neu gezeichnet, wenn sich Daten oder das Datum ändern (aufwendig: Leuchten, Verläufe); „vorne“ je Bild nur der langsam
// drehende Runen-Schild, die Uhr und das Ton-Spektrum. Ohne Verbindung zu Loki: Striche statt Zahlen, nie Beispielwerte.
import { STILE, WERKZEUG as W } from '../vorschau/start-sequenz/standbilder/standbild.js'
import { DATEN } from '../vorschau/start-sequenz/hud/zeichner.js'

export const S = STILE.find((s) => s.name === 'Kombination')
export const B = W.B, H = W.H
const ohne = '–'

/** Kamerakachel – bis Etappe 5 ohne Bild („Kein Signal“) */
function kamera(g, x, y, w, h, name) {
  W.glas(g, S, x, y, w, h, `KAMERA · ${name}`, 'FOLGT')
  const ix = x + 12, iy = y + 26, iw = w - 24, ih = h - 38
  const v = g.createLinearGradient(0, iy, 0, iy + ih); v.addColorStop(0, '#0b1a24'); v.addColorStop(1, '#05090d'); g.fillStyle = v; g.fillRect(ix, iy, iw, ih)
  for (let z = iy; z < iy + ih; z += 3) { g.fillStyle = 'rgba(255,255,255,0.02)'; g.fillRect(ix, z, iw, 1) }
  g.strokeStyle = W.fb(S.hell, 0.7); g.lineWidth = 2
  for (const [ex, ey, sx, sy] of [[ix, iy, 1, 1], [ix + iw, iy, -1, 1], [ix, iy + ih, 1, -1], [ix + iw, iy + ih, -1, -1]]) { g.beginPath(); g.moveTo(ex + sx * 22, ey); g.lineTo(ex, ey); g.lineTo(ex, ey + sy * 22); g.stroke() }
  W.txt(g, 'KEIN SIGNAL', ix + iw / 2, iy + ih / 2, W.fb(S.hell, 0.7), { gr: 22, gew: 600, aus: 'center', sp: 3 })
  W.txt(g, 'KAMERA WIRD NOCH ANGEBUNDEN', ix + iw / 2, iy + ih / 2 + 30, W.fb(S.haupt, 0.55), { gr: 13, aus: 'center', sp: 2 })
}

/**
 * Hintere Ebene zeichnen. d = sequenzDaten(…) aus startsequenz/lageDaten.js oder null; verbunden = Loki antwortet;
 * datum/wetter = fertige Texte.
 */
export function zeichneHinten(g, { d, verbunden, datum, wetter }) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 3 * B, H)
  W.hintergrund(g, S)
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, 3 * B, H)
  const hinweis = !verbunden ? 'LOKI NICHT VERBUNDEN – KEINE DATEN' : d ? `WERKSTATT · LIVE · STAND ${d.stand} UHR` : 'WERKSTATT NICHT VERBUNDEN – KEINE ZAHLEN'
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
  kamera(g, 2 * B + 40, 60, 900, 520, 'CARPORT'); kamera(g, 2 * B + 980, 60, 900, 520, 'HOF')
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
export function zeichneVorne(g, { hinten, schild, t, uhrzeit, ton, versatz = 0 }) {
  g.setTransform(1, 0, 0, 1, -versatz, 0) // versatz = 1920: nur der mittlere Bildschirm
  g.drawImage(hinten, 0, 0)
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
}
