// Tagesverlauf unten im PV-Feld (06.11.2026, Wunsch Auftraggeber: wie „Energiemonitor“ in der FEMS-App, 0 bis 24 Uhr).
// Wahl Auftraggeber: Entwurf D (Kurve + Tagessummen). tag = { punkte: 96 Viertelstunden { pv, haus, netz } in Watt oder null
// (netz + = Bezug), summen: { erzeugt, verbraucht, bezug, verkauf } in kWh oder null, zeit }. Daten: electron/pvverlauf.cjs.
// Vorgezeichnet, neu nur bei neuen Daten oder zur vollen Minute (Strich „jetzt“).
const GR = '#5dff8a', CYAN = '#5ff6ff', ROT = '#ff5a4a', GOLD = '#f2b04a', HELL = '#e8fdff', BLASS = 'rgba(165,230,240,0.62)', LINIE = 'rgba(95,246,255,0.14)'
const SCHRIFT = 'Bahnschrift, "Segoe UI", Arial, sans-serif'
const text = (g, t, x, y, gr, farbe, ausr = 'left', gew = 500) => { g.font = `${gew} ${gr}px ${SCHRIFT}`; g.fillStyle = farbe; g.textAlign = ausr; g.fillText(t, x, y) }

/** Beispieltag: Novembersonne bis gut 4 kW, Morgen- und Abendspitze im Haus, Akku fängt auf */
export function beispielTag() {
  const a = []; let soc = 22
  for (let i = 0; i < 96; i++) {
    const h = i / 4, sonne = h > 7.6 && h < 16.6 ? 4400 * Math.sin(((h - 7.6) / 9) * Math.PI) ** 1.5 * (0.82 + 0.18 * Math.sin(i * 1.7)) : 0
    const haus = 380 + 1500 * Math.exp(-((h - 7.2) ** 2) / 0.7) + 1250 * Math.exp(-((h - 12.2) ** 2) / 0.5) + 1900 * Math.exp(-((h - 18.4) ** 2) / 1.6) + 90 * Math.sin(i * 2.3)
    let akku = 0; const ueber = sonne - haus
    if (ueber > 0 && soc < 100) akku = -Math.min(ueber, 2500); else if (ueber < 0 && soc > 10) akku = Math.min(-ueber, 2500)
    soc = Math.min(100, Math.max(10, soc - (akku * 0.25) / 100))
    a.push({ pv: sonne, haus, akku, netz: haus - sonne - akku, soc })
  }
  return a
}

function achse(g, x, y, b, h) { // Stunden unten, feine Hilfslinien
  g.lineWidth = 1
  for (const s of [0, 6, 12, 18, 24]) {
    const px = Math.round(x + (b * s) / 24) + 0.5
    g.strokeStyle = LINIE; g.beginPath(); g.moveTo(px, y); g.lineTo(px, y + h); g.stroke()
    text(g, String(s).padStart(2, '0'), px, y + h + 12, 10, BLASS, s === 0 ? 'left' : s === 24 ? 'right' : 'center')
  }
}
function jetztStrich(g, x, y, b, h, anteil) {
  const px = Math.round(x + b * anteil) + 0.5
  g.strokeStyle = GOLD; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(px, y); g.lineTo(px, y + h); g.stroke(); g.setLineDash([])
}
const legende = (g, x, y, teile) => { for (const [n, f] of teile) { g.fillStyle = f; g.fillRect(x, y - 7, 10, 3); text(g, n, x + 14, y - 2, 10, BLASS); g.font = `500 10px ${SCHRIFT}`; x += 26 + g.measureText(n).width } }
const summe = (tag, f) => tag.reduce((a, p) => a + Math.max(0, f(p)) * 0.25, 0) / 1000
const kwh = (v) => `${v.toFixed(1).replace('.', ',')} kWh`

function linie(g, tag, n, px, py) { g.beginPath(); for (let i = 0; i < n; i++) g.lineTo(px(i), py(tag[i])) }
function flaeche(g, tag, n, px, py, y0, farbe, staerke = 0.42) {
  const v = g.createLinearGradient(0, y0 - 100, 0, y0); v.addColorStop(0, farbe + Math.round(staerke * 255).toString(16).padStart(2, '0')); v.addColorStop(1, farbe + '08')
  linie(g, tag, n, px, py); g.lineTo(px(n - 1), y0); g.lineTo(px(0), y0); g.closePath(); g.fillStyle = v; g.fill()
}
const leuchtend = (g, farbe, breite, f) => { g.save(); g.strokeStyle = farbe; g.lineWidth = breite; g.lineJoin = 'round'; g.shadowColor = farbe; g.shadowBlur = 6; f(); g.stroke(); g.restore() }

function kurveMitSummen(g, x, y, b, h, tag, anteil) {
  // Lücken mit dem letzten Wert füllen, sonst erscheinen sie als falscher Einbruch auf 0 W
  let vorher = { pv: 0, haus: 0, netz: 0 }
  const roh = tag.punkte, letzter = roh.reduce((l, p, i) => (p ? i : l), 0), n = Math.min(roh.length, letzter + 1), punkte = roh.map((p) => { vorher = p ?? vorher; return vorher }), bis = punkte.slice(0, n)
  const oben = 16, br = 150, bk = b - br - 14, hu = h - 16 - oben, max = Math.max(1000, ...bis.map((p) => Math.max(p.pv, p.haus))), ende = Math.max(95, punkte.length - 1)
  // Beschriftung bekommt eine eigene Zeile über dem Graphen (war abgeschnitten, Rückmeldung 06.11.2026)
  legende(g, x + 4, y + 10, [['ERZEUGUNG', GR], ['VERBRAUCH', HELL]])
  y += oben
  achse(g, x, y, bk, hu)
  const px = (i) => x + (bk * i) / ende, py = (w) => y + hu - (hu * w) / max / 1.08
  flaeche(g, punkte, n, px, (p) => py(p.pv), y + hu, GR)
  leuchtend(g, GR, 1.5, () => linie(g, punkte, n, px, (p) => py(p.pv)))
  leuchtend(g, HELL, 1.3, () => linie(g, punkte, n, px, (p) => py(p.haus)))
  jetztStrich(g, x, y, bk, hu, anteil)
  y -= oben
  const xr = x + bk + 14
  g.strokeStyle = LINIE; g.lineWidth = 1; g.beginPath(); g.moveTo(xr - 7.5, y); g.lineTo(xr - 7.5, y + h); g.stroke()
  const zeile = (i, name, wert, f) => { const zy = y + 18 + i * ((h - 22) / 4); text(g, name, xr, zy, 10, BLASS); text(g, wert, x + b, zy, 14, f, 'right', 600) } // eine Zeile je Wert: der Graph ist flacher
  const su = tag.summen ?? { erzeugt: summe(bis, (p) => p.pv), verbraucht: summe(bis, (p) => p.haus), bezug: summe(bis, (p) => p.netz), verkauf: summe(bis, (p) => -p.netz) }
  zeile(0, 'ERZEUGT', kwh(su.erzeugt), GR)
  zeile(1, 'VERBRAUCHT', kwh(su.verbraucht), HELL)
  zeile(2, 'NETZBEZUG', kwh(su.bezug), ROT)
  zeile(3, 'VERKAUFT', kwh(su.verkauf), CYAN)
}

let puffer = null, kennung = ''
/** m: Maßstab der Ziel-Leinwand. Ohne ihn wäre der Puffer gröber als das Feld und der Graph unscharf (Rückmeldung 06.11.2026) */
export function tagAufPuffer(b, h, tag, m = 1) {
  const j = new Date(), anteil = (j.getHours() * 60 + j.getMinutes()) / 1440, k = `${tag.zeit}|${b}|${h}|${m}|${j.getHours()}:${j.getMinutes()}`
  if (k === kennung && puffer) return puffer
  kennung = k
  const pb = Math.ceil(b * m), ph = Math.ceil(h * m)
  if (!puffer || puffer.width !== pb || puffer.height !== ph) { puffer = document.createElement('canvas'); puffer.width = pb; puffer.height = ph }
  const g = puffer.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, pb, ph); g.setTransform(m, 0, 0, m, 0, 0)
  kurveMitSummen(g, 0, 0, b, h, tag, anteil)
  return puffer
}
