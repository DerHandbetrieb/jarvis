// PV-Feld nur mit Symbolen (05.11.2026, Wunsch Auftraggeber): Haus groß als Hauptobjekt, Sonne, Akku, Strommast (rot –
// Netzstrom ist teuer; Lichtpunkte rot beim Bezug, grün beim Verkauf), Auto schon eingeplant (Wallbox kommt in den
// nächsten Monaten, Werte dann ebenfalls aus der FENECON-Anlage). Vier Anordnungen zur Auswahl.
import { symbol, auto } from './pv-zeichen.js'
export { auto }
const GRUEN = '#5dff8a', CYAN = '#5ff6ff', ROT = '#ff4a3a', HELL = '#e8fdff', BLASS = 'rgba(165,230,240,0.62)', GOLD = '#f2b04a', GRAU = 'rgba(165,230,240,0.35)'
const MAST = 'rgba(205,225,232,0.85)' // Strommast neutral grau (Rückmeldung 05.11.2026) – nur die Leitung zeigt Bezug (rot) / Verkauf (grün)
const SCHRIFT = 'Bahnschrift, "Segoe UI", Arial, sans-serif'
const kw = (w) => (w == null ? '–' : Math.abs(w) >= 1000 ? `${(Math.abs(w) / 1000).toFixed(1).replace('.', ',')} kW` : `${Math.round(Math.abs(w))} W`)
function text(g, t, x, y, gr, farbe = HELL, ausr = 'left', gew = 600) { g.font = `${gew} ${gr}px ${SCHRIFT}`; g.fillStyle = farbe; g.textAlign = ausr; g.fillText(t, x, y) }
const autarkie = (d) => (d.hausW > 0 ? Math.round(Math.max(0, Math.min(1, 1 - Math.max(0, d.netzW) / d.hausW)) * 100) : 100)


/** Leitung mit Lichtpunkten in Flussrichtung (t = Zeit; im Entwurf fest) */
function leitung(g, [x1, y1], [x2, y2], w, farbe, t = 0, bogen = 0) {
  const p = (f) => [x1 + (x2 - x1) * f + bogen * Math.sin(f * Math.PI) * (y2 - y1) / 400, y1 + (y2 - y1) * f - bogen * Math.sin(f * Math.PI)]
  g.strokeStyle = 'rgba(95,246,255,0.16)'; g.lineWidth = 2; g.beginPath()
  for (let i = 0; i <= 24; i++) { const [x, y] = p(i / 24); i ? g.lineTo(x, y) : g.moveTo(x, y) }
  g.stroke()
  if (Math.abs(w) < 20) return
  const anzahl = Math.min(8, 3 + Math.round(Math.abs(w) / 1000)), tempo = 0.25 + Math.min(1, Math.abs(w) / 4000)
  for (let i = 0; i < anzahl; i++) {
    const f = ((t * tempo + i / anzahl) % 1) * 0.84 + 0.08, [x, y] = p(w >= 0 ? f : 1 - f)
    const v = g.createRadialGradient(x, y, 0, x, y, 7); v.addColorStop(0, farbe); v.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = v; g.fillRect(x - 7, y - 7, 14, 14)
  }
}
function wert(g, x, y, titel, w, farbe, ausr = 'left', zusatz = '') {
  text(g, titel, x, y, 11, BLASS, ausr); text(g, kw(w), x, y + 24, 22, farbe, ausr)
  if (zusatz) text(g, zusatz, x, y + 40, 10, farbe, ausr)
}
function kopf(g, b, d) {
  text(g, 'ENERGIE · PV-ANLAGE', 14, 24, 14, CYAN); text(g, `AUTARKIE ${autarkie(d)} %`, b - 14, 24, 14, GRUEN, 'right')
  g.strokeStyle = 'rgba(95,246,255,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(14, 32.5); g.lineTo(b - 14, 32.5); g.stroke()
}
// Flüsse aus Sicht des Hauses: + = zum Haus hin
const fluss = (d) => ({
  sonne: d.pvW ?? 0,
  akku: d.akkuW ?? 0, // + entlädt ins Haus, − lädt
  netz: d.netzW ?? 0, // + Bezug (rot), − Einspeisung (grün)
  auto: -(d.autoW ?? 0), // Laden = vom Haus weg
})
const netzFarbe = (w) => (w > 20 ? ROT : GRUEN)
const akkuText = (w) => (w < -20 ? 'LÄDT' : w > 20 ? 'ENTLÄDT' : 'RUHT')
const netzText = (w) => (w > 20 ? 'BEZUG' : w < -20 ? 'VERKAUF' : '±0')

export const SYMBOL_ENTWUERFE = {
  /** 1 Haus zentral: Haus groß in der Mitte, Sonne oben, Akku links, Netz rechts, Auto unten */
  1(g, b, h, d, t = 0) {
    kopf(g, b, d); const f = fluss(d)
    const H = [b * 0.5, h * 0.5], S = [b * 0.5, 76], A = [b * 0.15, h * 0.62], N = [b * 0.85, h * 0.62], C = [b * 0.5, h - 34]
    leitung(g, S, [H[0], H[1] - 70], f.sonne, GRUEN, t); leitung(g, A, [H[0] - 80, H[1]], f.akku, f.akku < 0 ? GRUEN : CYAN, t); leitung(g, N, [H[0] + 80, H[1]], f.netz, netzFarbe(f.netz), t)
    symbol(g, 'haus', ...H, 150, HELL); symbol(g, 'sonne', ...S, 56, GRUEN); symbol(g, 'akku', ...A, 64, CYAN, d.akku); symbol(g, 'mast', ...N, 66, MAST); auto(g, C[0] + 110, C[1], 54, GRAU)
    wert(g, H[0], H[1] + 92, 'HAUS', d.hausW, HELL, 'center')
    wert(g, S[0] + 46, 70, 'SONNE', d.pvW, GRUEN)
    wert(g, A[0], A[1] + 48, `AKKU ${d.akku} %`, d.akkuW, CYAN, 'center', akkuText(d.akkuW))
    wert(g, N[0], N[1] + 48, 'NETZ', d.netzW, netzFarbe(d.netzW), 'center', netzText(d.netzW))
    text(g, 'AUTO · NOCH NICHT VERBUNDEN', C[0] + 150, C[1] + 5, 10, GRAU)
  },
  /** 2 Quellen oben, Verbraucher unten: Sonne und Netz oben, Haus groß unten Mitte, Akku links, Auto rechts */
  2(g, b, h, d, t = 0) {
    kopf(g, b, d); const f = fluss(d)
    const S = [b * 0.2, 90], N = [b * 0.8, 90], H = [b * 0.5, h * 0.62], A = [b * 0.15, h * 0.75], C = [b * 0.85, h * 0.78]
    leitung(g, S, [H[0] - 60, H[1] - 60], f.sonne, GRUEN, t); leitung(g, N, [H[0] + 60, H[1] - 60], f.netz, netzFarbe(f.netz), t)
    leitung(g, A, [H[0] - 90, H[1] + 20], f.akku, f.akku < 0 ? GRUEN : CYAN, t); leitung(g, C, [H[0] + 90, H[1] + 20], f.auto, GRUEN, t)
    symbol(g, 'haus', ...H, 170, HELL); symbol(g, 'sonne', ...S, 60, GRUEN); symbol(g, 'mast', ...N, 66, MAST); symbol(g, 'akku', ...A, 66, CYAN, d.akku); auto(g, ...C, 64, GRAU)
    wert(g, H[0], H[1] + 100, 'HAUS', d.hausW, HELL, 'center')
    wert(g, S[0] + 44, 80, 'SONNE', d.pvW, GRUEN); wert(g, N[0] - 44, 80, 'NETZ', d.netzW, netzFarbe(d.netzW), 'right', netzText(d.netzW))
    wert(g, A[0], A[1] + 50, `AKKU ${d.akku} %`, d.akkuW, CYAN, 'center', akkuText(d.akkuW)); text(g, 'AUTO', C[0], C[1] + 50, 11, GRAU, 'center'); text(g, 'NICHT VERBUNDEN', C[0], C[1] + 66, 10, GRAU, 'center')
  },
  /** 3 Querschnitt: großes Haus mit Sonne über dem Dach, Akku im Keller (im Haus), Auto daneben, Netz rechts außen */
  3(g, b, h, d, t = 0) {
    kopf(g, b, d); const f = fluss(d)
    const H = [b * 0.42, h * 0.6], S = [b * 0.42, 70], A = [b * 0.42, h * 0.72], C = [b * 0.66, h * 0.8], N = [b * 0.88, h * 0.5]
    symbol(g, 'haus', ...H, 230, HELL)
    leitung(g, S, [H[0], H[1] - 110], f.sonne, GRUEN, t); leitung(g, [H[0] + 100, H[1]], N, -f.netz, netzFarbe(f.netz), t); leitung(g, [H[0] + 100, h * 0.8], C, -f.auto, GRUEN, t)
    symbol(g, 'sonne', ...S, 52, GRUEN); symbol(g, 'akku', ...A, 56, CYAN, d.akku); symbol(g, 'mast', ...N, 76, MAST); auto(g, ...C, 64, GRAU)
    wert(g, S[0] + 40, 62, 'SONNE', d.pvW, GRUEN)
    wert(g, A[0] - 140, A[1] + 10, `AKKU ${d.akku} %`, d.akkuW, CYAN, 'right', akkuText(d.akkuW))
    wert(g, H[0] - 140, H[1] - 60, 'HAUS', d.hausW, HELL, 'right')
    wert(g, N[0], N[1] + 54, 'NETZ', d.netzW, netzFarbe(d.netzW), 'center', netzText(d.netzW)); text(g, 'AUTO · NICHT VERBUNDEN', C[0], C[1] + 48, 10, GRAU, 'center')
  },
  /** 4 Kreuz: Haus groß in der Mitte, vier Symbole in den Ecken mit Bögen, Werte außen */
  4(g, b, h, d, t = 0) {
    kopf(g, b, d); const f = fluss(d)
    const H = [b * 0.5, h * 0.55], S = [b * 0.13, 84], N = [b * 0.87, 84], A = [b * 0.13, h - 110], C = [b * 0.87, h - 110]
    leitung(g, S, [H[0] - 70, H[1] - 40], f.sonne, GRUEN, t, 30); leitung(g, N, [H[0] + 70, H[1] - 40], f.netz, netzFarbe(f.netz), t, 30)
    leitung(g, A, [H[0] - 70, H[1] + 40], f.akku, f.akku < 0 ? GRUEN : CYAN, t, -30); leitung(g, C, [H[0] + 70, H[1] + 40], f.auto, GRUEN, t, -30)
    // Autarkie als Ring um das Haus
    g.lineWidth = 6; g.lineCap = 'round'; g.strokeStyle = 'rgba(93,255,138,0.12)'; g.beginPath(); g.arc(H[0], H[1], 115, 0, Math.PI * 2); g.stroke()
    g.strokeStyle = GRUEN; g.beginPath(); g.arc(H[0], H[1], 115, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * autarkie(d) / 100); g.stroke()
    symbol(g, 'haus', ...H, 150, HELL); symbol(g, 'sonne', ...S, 56, GRUEN); symbol(g, 'mast', ...N, 64, MAST); symbol(g, 'akku', ...A, 62, CYAN, d.akku); auto(g, ...C, 58, GRAU)
    wert(g, H[0], H[1] + 72, 'HAUS', d.hausW, HELL, 'center')
    wert(g, S[0], S[1] + 44, 'SONNE', d.pvW, GRUEN, 'center'); wert(g, N[0], N[1] + 46, 'NETZ', d.netzW, netzFarbe(d.netzW), 'center', netzText(d.netzW))
    wert(g, A[0], A[1] + 46, `AKKU ${d.akku} %`, d.akkuW, CYAN, 'center', akkuText(d.akkuW)); text(g, 'AUTO', C[0], C[1] + 44, 11, GRAU, 'center'); text(g, 'NICHT VERBUNDEN', C[0], C[1] + 60, 10, GRAU, 'center')
  },
}
