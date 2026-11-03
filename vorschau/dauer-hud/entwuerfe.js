// Vier Entwürfe fürs Dauer-HUD (03.11.2026, Plan Etappe 2): ruhige Fassungen der abgenommenen Start-Sequenz
// („Kombination“: Farbe Schwarzglas, links Kreise, rechts schwebend) als Web-Wallpaper über alle drei Bildschirme.
// Das HUD liegt HINTER den Fenstern; auf dem mittleren Bildschirm arbeitet der Auftraggeber – darum unterscheiden sich
// die Entwürfe vor allem darin, wie viel in der Mitte los ist und wo die zwei Kamerabilder (Reolink Duo PoE) sitzen.
// Kamerabilder und Werkstatt-Zahlen sind hier Platzhalter bzw. Beispiele (deutlich gekennzeichnet).
import { STILE, WERKZEUG as W } from '../start-sequenz/standbilder/standbild.js'
import { DATEN } from '../start-sequenz/hud/zeichner.js'

const S = STILE.find((s) => s.name === 'Kombination'), B = W.B, H = W.H
const UMSATZ = DATEN.umsatz14

/** Kamerakachel (Platzhalter): Glasrahmen, dunkles „Bild“ mit Umrissen, Zeitstempel, Eckmarken, feine Bildzeilen */
function kamera(g, x, y, w, h, name, { gross = true } = {}) {
  W.glas(g, S, x, y, w, h, `KAMERA · ${name}`, 'PLATZHALTER')
  const ix = x + 12, iy = y + 26, iw = w - 24, ih = h - 38
  const v = g.createLinearGradient(0, iy, 0, iy + ih); v.addColorStop(0, '#0b1a24'); v.addColorStop(1, '#05090d'); g.fillStyle = v; g.fillRect(ix, iy, iw, ih)
  // angedeutete Szene (Carport-Dach, Boden, Auto) – nur Umrisse
  g.strokeStyle = W.fb(S.haupt, 0.25); g.lineWidth = 1.5
  g.beginPath(); g.moveTo(ix + iw * 0.05, iy + ih * 0.32); g.lineTo(ix + iw * 0.5, iy + ih * 0.18); g.lineTo(ix + iw * 0.95, iy + ih * 0.32); g.stroke()
  g.beginPath(); g.moveTo(ix, iy + ih * 0.78); g.lineTo(ix + iw, iy + ih * 0.7); g.stroke()
  g.strokeRect(ix + iw * 0.3, iy + ih * 0.5, iw * 0.32, ih * 0.22)
  for (let z = iy; z < iy + ih; z += 3) { g.fillStyle = 'rgba(255,255,255,0.025)'; g.fillRect(ix, z, iw, 1) }
  // Eckmarken + Mitte
  g.strokeStyle = W.fb(S.hell, 0.8); g.lineWidth = 2
  for (const [ex, ey, sx, sy] of [[ix, iy, 1, 1], [ix + iw, iy, -1, 1], [ix, iy + ih, 1, -1], [ix + iw, iy + ih, -1, -1]]) { g.beginPath(); g.moveTo(ex + sx * 22, ey); g.lineTo(ex, ey); g.lineTo(ex, ey + sy * 22); g.stroke() }
  // kein „LIVE“, keine Uhrzeit – es ist ein Platzhalter (Prüf-Agent)
  W.txt(g, 'KEIN SIGNAL · PLATZHALTER', ix + iw / 2, iy + ih / 2, W.fb(S.hell, 0.8), { gr: gross ? 22 : 14, gew: 600, aus: 'center', sp: 3 })
  W.txt(g, `HIER KOMMT DAS LIVEBILD ${name}`, ix + iw / 2, iy + ih / 2 + (gross ? 30 : 20), W.fb(S.haupt, 0.6), { gr: gross ? 13 : 11, aus: 'center', sp: 2 })
}
const uhr = (g, x, y, gr = 44, aus = 'left') => { W.leuchten(g, S, 10, () => W.txt(g, '07:42', x, y, W.fb(S.hell, 1), { gr, gew: 200, aus, sp: 4 })); W.txt(g, 'ORTSZEIT', x + (aus === 'left' ? 2 : 0), y + 20, W.fb(S.haupt, 0.8), { gr: 11, aus, sp: 3 }) }
const datum = (g, x, y, aus = 'right') => { W.txt(g, 'DIENSTAG · 03.11.', x, y, W.fb(S.hell, 0.95), { gr: 16, aus, sp: 2 }); W.txt(g, 'ÖHRINGEN · 9 °C · BEWÖLKT', x, y + 22, W.fb(S.haupt, 0.8), { gr: 11, aus, sp: 2 }) }
const hinweis = (g, x, y) => W.txt(g, 'ENTWURF · ALLE ZAHLEN, UHRZEIT UND WETTER SIND BEISPIELE · KAMERAS PLATZHALTER', x, y, W.fb(S.akzent, 0.9), { gr: 16, gew: 600, sp: 3 })
const vier = (g, ox, oy, r = 70, abst = 200) => [[2, 0.8, 'NEU'], [1, 0.35, 'FREIGABE'], ['OK', 1, 'SELBSTTEST'], [3, 0.5, 'VERKÄUFE']].forEach(([t, w, u], i) => W.anzeige(g, S, ox + (i % 2) * abst, oy + Math.floor(i / 2) * abst, r, w, String(t), u))
const dimmen = (g, a) => { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, 3 * B, H) }

export const ENTWUERFE = [
  {
    name: 'Leitstand ruhig', text: 'Wie die Start-Sequenz, nur still: links Werkstatt-Zahlen, Mitte gedämpfter Runen-Schild mit Uhr, rechts beide Kameras nebeneinander über der Umsatzkurve.',
    zeichne(g) {
      W.hintergrund(g, S); dimmen(g, 0.25)
      hinweis(g, 40, 40)
      W.anzeige(g, S, 330, 330, 210, 0.55, '11', 'AUFGABEN OFFEN'); vier(g, 720, 200, 70, 190)
      W.klein(g, S, 'baum', 1160, 60, 720, 560)
      W.klein(g, S, 'aufgaben', 60, 650, 900, 390); W.klein(g, S, 'lager', 1000, 660, 880, 200); W.spektrum(g, S, 1000, 880, 880, 150)
      g.save(); g.globalAlpha = 0.55; W.schild(g, S, B + B / 2, H / 2, 300); g.restore()
      uhr(g, B + 60, 76); datum(g, 2 * B - 60, 60)
      kamera(g, 2 * B + 40, 60, 900, 520, 'CARPORT'); kamera(g, 2 * B + 980, 60, 900, 520, 'HOF')
      W.flaeche(g, S, 2 * B + 60, 660, 1300, 260, UMSATZ, 160); W.txt(g, 'UMSATZ · 14 TAGE · BEISPIEL', 2 * B + 60, 960, W.fb(S.haupt, 0.9), { gr: 12, sp: 3 })
      W.chips(g, S, 2 * B + 1500, 640, 4)
      W.vordergrund(g, S)
    },
  },
  {
    name: 'Mitte frei', text: 'Der mittlere Bildschirm bleibt fast leer (nur ein schwaches Runen-Wasserzeichen und die Uhr) – Ruhe für die Arbeit. Links die Kameras übereinander, rechts alle Werkstatt-Zahlen.',
    zeichne(g) {
      W.hintergrund(g, S); dimmen(g, 0.35)
      hinweis(g, 40, 40)
      kamera(g, 40, 60, 900, 480, 'CARPORT'); kamera(g, 40, 570, 900, 480, 'HOF')
      W.klein(g, S, 'baum', 980, 60, 900, 600); W.kreisReihe(g, S, 1000, 800, 860, 8, 34)
      g.save(); g.globalAlpha = 0.18; W.schild(g, S, B + B / 2, H / 2, 420); g.restore()
      uhr(g, 2 * B - 60, 990, 40, 'right'); datum(g, B + 60, 970, 'left')
      W.anzeige(g, S, 2 * B + 300, 300, 200, 0.55, '11', 'AUFGABEN OFFEN'); vier(g, 2 * B + 680, 180, 70, 190)
      W.klein(g, S, 'aufgaben', 2 * B + 1080, 60, 800, 520)
      W.flaeche(g, S, 2 * B + 60, 640, 1000, 240, UMSATZ, 160); W.txt(g, 'UMSATZ · 14 TAGE · BEISPIEL', 2 * B + 60, 920, W.fb(S.haupt, 0.9), { gr: 12, sp: 3 })
      W.klein(g, S, 'lager', 2 * B + 1100, 640, 780, 240)
      W.vordergrund(g, S)
    },
  },
  {
    name: 'Werkstatt-Tafel', text: 'Die Mitte wird zur großen Tafel: To-do-Karten und Verkäufe groß im Glas, der Runen-Schild klein als Wappen darüber. Links Yggdrasil und Uhren, rechts die Kameras übereinander mit Lager darunter.',
    zeichne(g) {
      W.hintergrund(g, S); dimmen(g, 0.25)
      hinweis(g, 40, 40)
      W.klein(g, S, 'baum', 40, 60, 900, 640); W.anzeige(g, S, 1380, 300, 220, 0.55, '11', 'AUFGABEN OFFEN'); vier(g, 1100, 700, 70, 190)
      W.kreisReihe(g, S, 60, 800, 860, 8, 34); W.kreisReihe(g, S, 60, 920, 860, 8, 34)
      W.schild(g, S, B + B / 2, 150, 110)
      W.glas(g, S, B + 80, 300, 860, 700, '', ''); W.klein(g, S, 'aufgaben', B + 100, 330, 820, 650)
      W.glas(g, S, B + 980, 300, 860, 700, 'VERKÄUFE · UMSATZ', 'BEISPIEL'); W.flaeche(g, S, B + 1010, 380, 800, 320, UMSATZ, 160); W.spektrum(g, S, B + 1010, 760, 800, 200)
      uhr(g, B + 60, 76); datum(g, 2 * B - 60, 60)
      kamera(g, 2 * B + 40, 60, 1240, 440, 'CARPORT'); kamera(g, 2 * B + 40, 530, 1240, 440, 'HOF')
      W.klein(g, S, 'lager', 2 * B + 1320, 60, 560, 400); W.globus(g, S, 2 * B + 1600, 760, 200)
      W.vordergrund(g, S)
    },
  },
  {
    name: 'Kino-Minimal', text: 'Sehr dunkel und still: nur feine Linien und große, dünne Zahlen. Mitte nur der äußere Runenring und die Uhr, Kameras als zwei kleine Kacheln rechts unten.',
    zeichne(g) {
      W.hintergrund(g, S); dimmen(g, 0.6)
      hinweis(g, 40, 40)
      W.leuchten(g, S, 14, () => W.txt(g, '11', 60, 380, W.fb(S.hell, 1), { gr: 260, gew: 100, sp: 0 })); W.txt(g, 'AUFGABEN OFFEN · 2 NEU · 1 FREIGABE · BEISPIEL', 70, 430, W.fb(S.haupt, 0.9), { gr: 16, sp: 4 })
      DATEN.karten.slice(0, 4).forEach(([t], i) => { W.txt(g, `— ${t.toUpperCase()}`, 70, 520 + i * 44, W.fb(S.hell, 0.85 - i * 0.12), { gr: 18, gew: 300, sp: 2 }) })
      g.strokeStyle = W.fb(S.haupt, 0.4); g.lineWidth = 1; g.beginPath(); g.moveTo(60, 470); g.lineTo(1860, 470); g.stroke()
      W.audio(g, S, 60, 900, 1800, 100, 3, { balken: 1, luecke: 4 })
      g.save(); g.globalAlpha = 0.35; W.skala(g, S, B + B / 2, H / 2, 380, 180, 6, 0.6); W.bogen(g, S, B + B / 2, H / 2, 400, -2.4, -0.7, { al: 0.8, b: 1 }); W.bogen(g, S, B + B / 2, H / 2, 400, 0.7, 2.4, { al: 0.8, b: 1 }); g.restore()
      W.leuchten(g, S, 16, () => W.txt(g, '07:42', B + B / 2, H / 2 + 40, W.fb(S.hell, 1), { gr: 140, gew: 100, aus: 'center', sp: 8 })); W.txt(g, 'DIENSTAG · 03.11. · ÖHRINGEN 9 °C', B + B / 2, H / 2 + 90, W.fb(S.haupt, 0.8), { gr: 14, aus: 'center', sp: 4 })
      W.flaeche(g, S, 2 * B + 60, 120, 1800, 300, UMSATZ, 160); W.txt(g, 'UMSATZ · 14 TAGE · BEISPIEL', 2 * B + 60, 460, W.fb(S.haupt, 0.9), { gr: 12, sp: 3 })
      W.leuchten(g, S, 12, () => W.txt(g, '3', 2 * B + 60, 700, W.fb(S.hell, 1), { gr: 160, gew: 100, sp: 0 })); W.txt(g, 'BESTELLUNGEN GESTERN · 123,49 € · BEISPIEL', 2 * B + 180, 690, W.fb(S.haupt, 0.9), { gr: 14, sp: 3 })
      kamera(g, 2 * B + 980, 760, 440, 280, 'CARPORT', { gross: false }); kamera(g, 2 * B + 1440, 760, 440, 280, 'HOF', { gross: false })
    },
  },
]

export function zeichneEntwurf(c, nr) { c.width = 3 * B; c.height = H; ENTWUERFE[nr].zeichne(c.getContext('2d')) }
