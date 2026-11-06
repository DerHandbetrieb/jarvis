// Tagesverlauf unten im PV-Feld (06.11.2026, Wunsch Auftraggeber: wie „Energiemonitor“ in der FEMS-App, 0 bis 24 Uhr).
// Vier Entwürfe a–d zur Wahl, vorerst mit Beispieldaten. tag = 96 Viertelstunden { pv, haus, akku, netz } in Watt,
// akku + = entladen, netz + = Bezug; soc in Prozent; nur Werte bis „jetzt“ (Anteil des Tages) sind da.
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

export const PV_TAG = {
  /** A · Flächen: Erzeugung als grüne Fläche, Verbrauch weiße Linie, Akkustand feine Punktlinie */
  a(g, x, y, b, h, tag, anteil) {
    const hu = h - 16, n = Math.max(2, Math.floor(96 * anteil)), max = Math.max(1000, ...tag.map((p) => Math.max(p.pv, p.haus)))
    achse(g, x, y, b, hu)
    const px = (i) => x + (b * i) / 95, py = (w) => y + hu - (hu * w) / max / 1.08
    flaeche(g, tag, n, px, (p) => py(p.pv), y + hu, GR)
    leuchtend(g, GR, 1.5, () => linie(g, tag, n, px, (p) => py(p.pv)))
    leuchtend(g, HELL, 1.3, () => linie(g, tag, n, px, (p) => py(p.haus)))
    g.save(); g.setLineDash([1, 3]); g.strokeStyle = CYAN; g.lineWidth = 1.2; linie(g, tag, n, px, (p) => y + hu - (hu * p.soc) / 104); g.stroke(); g.restore()
    jetztStrich(g, x, y, b, hu, anteil)
    legende(g, x + 4, y + 8, [['ERZEUGUNG', GR], ['VERBRAUCH', HELL], ['AKKU %', CYAN]])
  },
  /** B · Spiegel: oben was reinkommt (Erzeugung), unten was rausgeht (Verbrauch) */
  b(g, x, y, b, h, tag, anteil) {
    const hu = h - 16, n = Math.max(2, Math.floor(96 * anteil)), mi = y + hu * 0.56, max = Math.max(1000, ...tag.map((p) => Math.max(p.pv, p.haus)))
    achse(g, x, y, b, hu)
    const px = (i) => x + (b * i) / 95
    flaeche(g, tag, n, px, (p) => mi - ((hu * 0.54) * p.pv) / max, mi, GR)
    leuchtend(g, GR, 1.5, () => linie(g, tag, n, px, (p) => mi - ((hu * 0.54) * p.pv) / max))
    linie(g, tag, n, px, (p) => mi + ((hu * 0.42) * p.haus) / max); g.lineTo(px(n - 1), mi); g.lineTo(px(0), mi); g.closePath(); g.fillStyle = 'rgba(232,253,255,0.16)'; g.fill()
    leuchtend(g, HELL, 1.3, () => linie(g, tag, n, px, (p) => mi + ((hu * 0.42) * p.haus) / max))
    g.strokeStyle = 'rgba(95,246,255,0.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, Math.round(mi) + 0.5); g.lineTo(x + b, Math.round(mi) + 0.5); g.stroke()
    jetztStrich(g, x, y, b, hu, anteil)
    legende(g, x + 4, y + 8, [['ERZEUGUNG', GR], ['VERBRAUCH', HELL]])
  },
  /** C · Säulen: je Viertelstunde eine feine Säule, gefärbt nach Herkunft des Stroms (Sonne, Akku, Netz) */
  c(g, x, y, b, h, tag, anteil) {
    const hu = h - 16, n = Math.max(2, Math.floor(96 * anteil)), max = Math.max(1000, ...tag.map((p) => p.haus)), sb = b / 96
    achse(g, x, y, b, hu)
    for (let i = 0; i < 96; i++) {
      const sx = x + i * sb
      if (i >= n) { g.fillStyle = 'rgba(95,246,255,0.05)'; g.fillRect(sx, y + hu - 2, sb - 2, 2); continue }
      const p = tag[i], sonne = Math.min(p.haus, p.pv), akku = Math.max(0, Math.min(p.haus - sonne, p.akku)), netz = Math.max(0, p.haus - sonne - akku); let oben = y + hu
      for (const [w, f] of [[sonne, GR], [akku, CYAN], [netz, ROT]]) { const sh = (hu * 0.94 * w) / max; if (sh < 0.3) continue; oben -= sh; g.fillStyle = f; g.globalAlpha = 0.78; g.fillRect(sx, oben, sb - 2, sh); g.globalAlpha = 1 }
    }
    jetztStrich(g, x, y, b, hu, anteil)
    legende(g, x + 4, y + 8, [['SONNE', GR], ['AKKU', CYAN], ['NETZ', ROT]])
  },
  /** D · Kurve + Bilanz: wie A, rechts daneben die Tagessummen in kWh */
  d(g, x, y, b, h, tag, anteil) {
    const br = 150, bk = b - br - 14, hu = h - 16, n = Math.max(2, Math.floor(96 * anteil)), jetzt = tag.slice(0, n), max = Math.max(1000, ...tag.map((p) => Math.max(p.pv, p.haus)))
    achse(g, x, y, bk, hu)
    const px = (i) => x + (bk * i) / 95, py = (w) => y + hu - (hu * w) / max / 1.08
    flaeche(g, tag, n, px, (p) => py(p.pv), y + hu, GR)
    leuchtend(g, GR, 1.5, () => linie(g, tag, n, px, (p) => py(p.pv)))
    leuchtend(g, HELL, 1.3, () => linie(g, tag, n, px, (p) => py(p.haus)))
    jetztStrich(g, x, y, bk, hu, anteil)
    legende(g, x + 4, y + 8, [['ERZEUGUNG', GR], ['VERBRAUCH', HELL]])
    const xr = x + bk + 14
    g.strokeStyle = LINIE; g.lineWidth = 1; g.beginPath(); g.moveTo(xr - 7.5, y); g.lineTo(xr - 7.5, y + h); g.stroke()
    const zeile = (i, name, wert, f) => { const zy = y + 12 + i * 33; text(g, name, xr, zy, 10, BLASS); text(g, wert, xr, zy + 16, 16, f, 'left', 600) }
    zeile(0, 'ERZEUGT', kwh(summe(jetzt, (p) => p.pv)), GR)
    zeile(1, 'VERBRAUCHT', kwh(summe(jetzt, (p) => p.haus)), HELL)
    zeile(2, 'NETZBEZUG', kwh(summe(jetzt, (p) => p.netz)), ROT)
    zeile(3, 'VERKAUFT', kwh(summe(jetzt, (p) => -p.netz)), CYAN)
  },
}
