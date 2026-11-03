// Anzeigen der Start-Sequenz (Runde 3, 03.11.2026): jede Funktion zeichnet eine Anzeige auf eine Leinwand, die als
// Textur auf einer 3D-Fläche liegt. Signatur: (g, w, h, t, f, nr) – f = { haupt, akzent } (THREE.Color), nr = laufende Nummer.
// Werte sind Beispielwerte; Runen nur aus der unbedenklichen Auswahl (siehe CLAUDE.md, Runen-Regel).

export const RUNEN = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛒᛖᛗᛚᛜᛞᚴ'
export const LOKI = 'ᛚᚢᚴᛁ'
export const RUNEN_SCHRIFT = '"Segoe UI Historic", "Segoe UI Symbol", serif'
const SCHRIFT = 'Bahnschrift, "Segoe UI", sans-serif'

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

function raster(g, w, h, f, schritt = 32) {
  g.strokeStyle = css(f.haupt, 0.1); g.lineWidth = 1
  for (let x = 0; x < w; x += schritt) { g.beginPath(); g.moveTo(x, 30); g.lineTo(x, h); g.stroke() }
  for (let y = 30; y < h; y += schritt) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke() }
}
function titel(g, w, f, text, wert) {
  g.fillStyle = css(f.haupt, 0.9); g.font = `600 15px ${SCHRIFT}`; g.textAlign = 'left'; g.fillText(text, 14, 22)
  if (wert) { g.textAlign = 'right'; g.fillStyle = css(f.akzent, 1); g.fillText(wert, w - 14, 22); g.textAlign = 'left' }
}
export function rahmen(g, w, h, f, art = 'ecken') {
  g.strokeStyle = css(f.haupt, 0.85); g.lineWidth = 3
  const e = 22
  for (const [x, y, sx, sy] of [[2, 2, 1, 1], [w - 2, 2, -1, 1], [w - 2, h - 2, -1, -1], [2, h - 2, 1, -1]]) { g.beginPath(); g.moveTo(x, y + sy * e); g.lineTo(x, y); g.lineTo(x + sx * e, y); g.stroke() }
  g.strokeStyle = css(f.haupt, 0.22); g.lineWidth = 1; g.strokeRect(6, 6, w - 12, h - 12)
  if (art === 'flecht') { // Wikinger-Flechtband oben und unten
    g.strokeStyle = css(f.haupt, 0.45); g.lineWidth = 2
    for (const y of [11, h - 11]) for (let x = 40; x < w - 40; x += 24) { g.beginPath(); g.moveTo(x, y - 5); g.bezierCurveTo(x + 8, y + 7, x + 16, y - 7, x + 24, y + 5); g.stroke() }
  }
  if (art === 'schraegen') { // abgeschrägte Ecken wie bei Rüstungsplatten
    g.strokeStyle = css(f.haupt, 0.5); g.lineWidth = 2; g.beginPath(); g.moveTo(30, 6); g.lineTo(w - 30, 6); g.lineTo(w - 6, 30); g.lineTo(w - 6, h - 30); g.lineTo(w - 30, h - 6); g.lineTo(30, h - 6); g.lineTo(6, h - 30); g.lineTo(6, 30); g.closePath(); g.stroke()
  }
}
function zahnrad(g, x, y, r, zaehne, winkel, f, fuellen = 0.12) {
  g.save(); g.translate(x, y); g.rotate(winkel)
  g.beginPath()
  for (let i = 0; i < zaehne * 2; i++) { const a = (i / (zaehne * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 0.86; const a2 = a + Math.PI / zaehne; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); g.lineTo(Math.cos(a2 - 0.08) * rr, Math.sin(a2 - 0.08) * rr) }
  g.closePath(); g.fillStyle = css(f.haupt, fuellen); g.fill(); g.strokeStyle = css(f.haupt, 0.9); g.lineWidth = 2; g.stroke()
  g.beginPath(); g.arc(0, 0, r * 0.3, 0, 7); g.stroke()
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3); g.lineTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7); g.stroke() }
  g.restore()
}

export const ZEICHNER = {
  graph(g, w, h, t, f) {
    raster(g, w, h, f)
    ;[[f.haupt, 1.0, 0.9], [f.akzent, 1.7, 0.6], [f.haupt, 2.6, 0.4]].forEach(([farbe, tempo, a], k) => {
      g.strokeStyle = css(farbe, a); g.lineWidth = k ? 2 : 3; g.beginPath()
      for (let x = 0; x <= w; x += 6) g.lineTo(x, h * 0.58 + rauschen(x * 0.02 + t * tempo + k * 9) * h * 0.17 - k * 18)
      g.stroke()
    })
    titel(g, w, f, 'NETZLAST · KANAL 3', `${(42 + rauschen(t) * 7).toFixed(1)} Mb/s`)
  },
  spektrum(g, w, h, t, f) {
    const n = 40, frq = tonQuelle().frequenz
    for (let i = 0; i < n; i++) {
      const v = frq ? frq[Math.floor((i / n) * frq.length * 0.6)] / 255 : 0.5 + 0.45 * Math.sin(t * (2 + i * 0.13) + i)
      const bh = Math.max(4, v * h * 0.68)
      g.fillStyle = css(i % 7 === 0 ? f.akzent : f.haupt, 0.85); g.fillRect(10 + i * ((w - 20) / n), h * 0.86 - bh, (w - 20) / n - 4, bh)
    }
    titel(g, w, f, 'FREQUENZANALYSE', `${(18.2 + rauschen(t * 2) * 2).toFixed(1)} kHz`)
  },
  tacho(g, w, h, t, f) {
    ;[['PROZESSOR', 0.23], ['SPEICHER', 0.29], ['GRAFIK', 0.41]].forEach(([name, v], i) => {
      const x = w * (0.18 + i * 0.32), y = h * 0.55, r = h * 0.28, wert = klemm(v + 0.05 * rauschen(t * 1.5 + i))
      g.lineWidth = 12; g.strokeStyle = css(f.haupt, 0.18); g.beginPath(); g.arc(x, y, r, Math.PI * 0.75, Math.PI * 2.25); g.stroke()
      g.strokeStyle = css(i === 2 ? f.akzent : f.haupt, 0.95); g.beginPath(); g.arc(x, y, r, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * wert)); g.stroke()
      g.fillStyle = css(f.haupt, 1); g.font = `600 30px ${SCHRIFT}`; g.textAlign = 'center'; g.fillText(Math.round(wert * 100), x, y + 10)
      g.font = `14px ${SCHRIFT}`; g.fillStyle = css(f.haupt, 0.7); g.fillText(name, x, y + r + 30); g.textAlign = 'left'
    })
    titel(g, w, f, 'SYSTEMLAST', '')
  },
  tabelle(g, w, h, t, f) {
    g.font = '15px Consolas, monospace'
    const versatz = (t * 3) % 1, start = Math.floor(t * 3)
    for (let i = 0; i < 11; i++) {
      const z = zufall((start + i) * 97), y = 42 + (i - versatz) * 20
      if (y < 32 || y > h - 10) continue
      const hex = Array.from({ length: 6 }, () => Math.floor(z() * 65535).toString(16).padStart(4, '0').toUpperCase()).join(' ')
      g.fillStyle = css((start + i) % 9 === 0 ? f.akzent : f.haupt, (start + i) % 9 === 0 ? 1 : 0.65)
      g.fillText(`${(0x4f00 + (start + i) * 16).toString(16).toUpperCase()}  ${hex}`, 14, y)
    }
    titel(g, w, f, 'SPEICHERABBILD', 'LIVE')
  },
  oszi(g, w, h, t, f) {
    raster(g, w, h, f)
    g.strokeStyle = css(f.haupt, 0.95); g.lineWidth = 2.5; g.beginPath()
    for (let i = 0; i <= 400; i++) { const a = (i / 400) * Math.PI * 2; g.lineTo(w / 2 + Math.sin(a * 3 + t * 1.3) * w * 0.32, h / 2 + 8 + Math.sin(a * 4 + t * 0.9) * h * 0.3) }
    g.stroke(); titel(g, w, f, 'PHASENBILD', `${(3.14 + rauschen(t) * 0.1).toFixed(3)} rad`)
  },
  radar(g, w, h, t, f) {
    const x = w / 2, y = h / 2 + 10, r = h * 0.38
    g.strokeStyle = css(f.haupt, 0.35); g.lineWidth = 1.5
    for (const k of [0.33, 0.66, 1]) { g.beginPath(); g.arc(x, y, r * k, 0, 7); g.stroke() }
    g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.moveTo(x, y - r); g.lineTo(x, y + r); g.stroke()
    const a = t * 2.2, v = g.createConicGradient(a - 1.0, x, y); v.addColorStop(0, css(f.haupt, 0)); v.addColorStop(0.159, css(f.haupt, 0.55)); v.addColorStop(0.16, css(f.haupt, 0))
    g.fillStyle = v; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill()
    const z = zufall(4)
    for (let i = 0; i < 7; i++) { const wa = z() * 6.28, wr = r * (0.2 + z() * 0.75), frisch = ((a - wa) % 6.283 + 6.283) % 6.283 < 1.2; g.fillStyle = css(f.akzent, frisch ? 1 : 0.25); g.beginPath(); g.arc(x + Math.cos(wa) * wr, y + Math.sin(wa) * wr, 5, 0, 7); g.fill() }
    titel(g, w, f, 'UMGEBUNG', '7 KONTAKTE')
  },
  hex(g, w, h, t, f) {
    const s = 18, z = zufall(Math.floor(t * 4))
    for (let r = 0; r < 9; r++) for (let c = 0; c < 15; c++) {
      const x = 24 + c * s * 1.75 + (r % 2) * s * 0.87, y = 40 + r * s * 1.5
      if (x > w - 10 || y > h - 10) continue
      const an = z() < 0.12
      g.strokeStyle = css(f.haupt, 0.4); g.fillStyle = css(an ? f.akzent : f.haupt, an ? 0.7 : 0.06)
      g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k + Math.PI / 6; g.lineTo(x + Math.cos(a) * s * 0.9, y + Math.sin(a) * s * 0.9) } g.closePath(); g.fill(); g.stroke()
    }
    titel(g, w, f, 'SEKTOREN', `${Math.floor(60 + rauschen(t) * 20)} AKTIV`)
  },
  log(g, w, h, t, f, nr, start = 1.6) {
    const zeilen = ['LOKI KERN 3.0 · KALTSTART', 'Sprachkern Qwen3 0.6B ........ OK', 'Ohren Whisper small .......... OK', 'Runen-Matrix ................. OK', 'Grafik RTX 4080 · 16 GB ...... OK', 'Bildschirme 3 × 1920 × 1080 .. OK', 'Sarkasmus-Modul ........ MAXIMAL', 'Benutzerkompetenz ...... UNKLAR']
    g.font = '16px Consolas, monospace'
    zeilen.forEach((z, i) => {
      const p = phase(t, start + i * 0.42, start + 0.3 + i * 0.42); if (p <= 0) return
      g.fillStyle = css(/UNKLAR|MAXIMAL/.test(z) ? f.akzent : f.haupt, 0.9); g.fillText(z.slice(0, Math.ceil(z.length * p)), 14, 46 + i * 25)
    })
    titel(g, w, f, 'STARTPROTOKOLL', '')
  },
  ziel(g, w, h, t, f) {
    const x = w / 2, y = h / 2 + 8, r = h * 0.3
    g.save(); g.translate(x, y); g.rotate(t * 0.8); g.strokeStyle = css(f.haupt, 0.9); g.lineWidth = 3
    for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.arc(0, 0, r, 0.15, 1.2); g.stroke(); g.beginPath(); g.moveTo(r + 6, 0); g.lineTo(r + 24, 0); g.stroke() }
    g.restore()
    const enge = 1 - weich(phase(t % 3, 0, 1.4)), b = r * (0.5 + enge * 0.6)
    g.strokeStyle = css(f.akzent, 1); g.lineWidth = 2.5
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { g.beginPath(); g.moveTo(x + sx * b, y + sy * (b - 14)); g.lineTo(x + sx * b, y + sy * b); g.lineTo(x + sx * (b - 14), y + sy * b); g.stroke() }
    g.fillStyle = css(f.akzent, 1); g.font = '14px Consolas'; g.fillText(enge < 0.05 ? 'ZIEL ERFASST' : 'SUCHE …', x + r + 30, y - 6); g.fillText(`${(1.82 + rauschen(t) * 0.2).toFixed(2)} m`, x + r + 30, y + 14)
    titel(g, w, f, 'ZIELERFASSUNG', '')
  },
  histo(g, w, h, t, f) {
    raster(g, w, h, f)
    for (let i = 0; i < 18; i++) {
      const a = 0.3 + 0.3 * (rauschen(i * 0.7 + t * 0.6) + 1.75) / 3.5, b = a * (0.4 + 0.3 * Math.sin(i + t))
      const x = 16 + i * ((w - 32) / 18), bw = (w - 32) / 18 - 6
      g.fillStyle = css(f.haupt, 0.75); g.fillRect(x, h * 0.86 - a * h * 0.6, bw, a * h * 0.6)
      g.fillStyle = css(f.akzent, 0.9); g.fillRect(x, h * 0.86 - b * h * 0.6, bw, b * h * 0.6)
    }
    titel(g, w, f, 'VERKÄUFE · 18 TAGE', 'BEISPIEL')
  },
  runen(g, w, h, t, f) {
    g.font = `34px ${RUNEN_SCHRIFT}`; g.fillStyle = css(f.haupt, 0.95)
    for (let zeile = 0; zeile < 4; zeile++) {
      let txt = ''; const z = zufall(zeile * 31 + Math.floor(t * 1.5))
      for (let i = 0; i < 16; i++) txt += RUNEN[Math.floor(z() * RUNEN.length)]
      g.globalAlpha = zeile === 1 ? 1 : 0.55; g.fillText(txt, 16, 72 + zeile * 44)
    }
    g.globalAlpha = 1; g.font = '14px Consolas'; g.fillStyle = css(f.akzent, 1); g.fillText(`${LOKI} = LOKI · WÄCHTER DER WERKSTATT`, 16, h - 16)
    titel(g, w, f, 'RUNENSCHRIFT', '')
  },
  uhr(g, w, h, t, f) {
    const d = new Date()
    g.textAlign = 'center'; g.fillStyle = css(f.haupt, 1); g.font = `300 ${Math.round(h * 0.55)}px ${SCHRIFT}`; g.fillText(d.toLocaleTimeString('de-DE'), w / 2, h * 0.62)
    g.font = `${Math.round(h * 0.13)}px ${SCHRIFT}`; g.fillStyle = css(f.haupt, 0.75)
    g.fillText(`${d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' }).toUpperCase()}   ·   ÖHRINGEN 6 °C NIESELREGEN`, w / 2, h * 0.9); g.textAlign = 'left'
  },
  welle(g, w, h, t, f) {
    const dat = tonQuelle().welle
    g.strokeStyle = css(f.haupt, 1); g.lineWidth = 3; g.beginPath()
    for (let i = 0; i <= 256; i++) { const v = dat ? (dat[Math.floor((i / 256) * dat.length)] - 128) / 128 : 0.06 * Math.sin(i * 0.3 + t * 8) * Math.sin(i * 0.05); g.lineTo((i / 256) * w, h / 2 + v * h * 0.42) }
    g.stroke(); g.fillStyle = css(f.akzent, 1); g.font = '14px Consolas'; g.fillText(dat ? 'LOKI SPRICHT' : 'STIMME BEREIT', 12, 20)
  },
  mini(g, w, h, t, f, nr) {
    const namen = ['KERN', 'FELD', 'PULS', 'NETZ'], v = klemm(0.55 + 0.35 * rauschen(t * 1.2 + nr * 3) / 1.75)
    g.lineWidth = 10; g.strokeStyle = css(f.haupt, 0.2); g.beginPath(); g.arc(w * 0.28, h / 2, h * 0.32, 0, 7); g.stroke()
    g.strokeStyle = css(nr % 2 ? f.akzent : f.haupt, 1); g.beginPath(); g.arc(w * 0.28, h / 2, h * 0.32, -Math.PI / 2, -Math.PI / 2 + v * 6.283); g.stroke()
    g.fillStyle = css(f.haupt, 1); g.font = `600 40px ${SCHRIFT}`; g.fillText(`${Math.round(v * 100)}%`, w * 0.54, h * 0.56)
    g.font = `16px ${SCHRIFT}`; g.fillStyle = css(f.haupt, 0.7); g.fillText(namen[nr % 4], w * 0.54, h * 0.78)
  },
  ticker(g, w, h, t, f) {
    g.font = `22px ${RUNEN_SCHRIFT}`
    const text = `   ${LOKI}  ·  SYSTEMSTATUS NOMINAL  ·  RUNEN-MATRIX STABIL  ·  ENERGIEKERN ${Math.round(97 + rauschen(t))} %  ·  WERKSTATT-VERBINDUNG AUSSTEHEND  ·  BENUTZER ANWESEND – LEIDER  ·`
    const breite = g.measureText(text).width, x = -((t * 120) % breite)
    g.fillStyle = css(f.haupt, 0.8); for (let k = 0; k < 4; k++) g.fillText(text, x + k * breite, h * 0.72)
  },

  // ---- neu in Runde 3 ----
  zahnraeder(g, w, h, t, f) {
    // drei ineinandergreifende Zahnräder – Drehzahlen passend zu den Radien
    const a = t * 0.9, r1 = h * 0.3, r2 = h * 0.2, r3 = h * 0.14
    zahnrad(g, w * 0.3, h * 0.58, r1, 18, a, f)
    zahnrad(g, w * 0.3 + r1 + r2 * 0.92, h * 0.58 - r2 * 0.35, r2, 12, -a * (r1 / r2) + 0.13, f)
    zahnrad(g, w * 0.3 + r1 + r2 * 1.84 + r3 * 0.9, h * 0.58 + r3 * 0.6, r3, 9, a * (r1 / r3) + 0.2, f, 0.3)
    g.fillStyle = css(f.akzent, 1); g.font = '14px Consolas'; g.fillText(`${Math.round(1200 + rauschen(t) * 80)} U/min`, w - 120, h - 18)
    titel(g, w, f, 'GETRIEBE · KERNANTRIEB', '')
  },
  zeiger(g, w, h, t, f, nr) {
    // zwei analoge Zeigerinstrumente mit rotem Bereich
    ;[0, 1].forEach((k) => {
      const x = w * (0.27 + k * 0.46), y = h * 0.78, r = h * 0.48, v = klemm(0.45 + 0.35 * rauschen(t * (0.8 + k * 0.5) + nr) / 1.75)
      g.lineWidth = 2; g.strokeStyle = css(f.haupt, 0.6); g.beginPath(); g.arc(x, y, r, Math.PI, Math.PI * 2); g.stroke()
      g.strokeStyle = css(f.akzent, 0.8); g.lineWidth = 6; g.beginPath(); g.arc(x, y, r - 8, Math.PI * 1.8, Math.PI * 2); g.stroke()
      for (let i = 0; i <= 20; i++) { const a = Math.PI + (i / 20) * Math.PI, l = i % 5 ? 8 : 16; g.strokeStyle = css(f.haupt, 0.8); g.lineWidth = i % 5 ? 1.5 : 3; g.beginPath(); g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.lineTo(x + Math.cos(a) * (r - l), y + Math.sin(a) * (r - l)); g.stroke() }
      const a = Math.PI + v * Math.PI; g.strokeStyle = css(f.akzent, 1); g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * (r - 12), y + Math.sin(a) * (r - 12)); g.stroke()
      g.fillStyle = css(f.haupt, 1); g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill()
      g.font = `13px ${SCHRIFT}`; g.textAlign = 'center'; g.fillText(['DRUCK', 'TEMPERATUR'][k], x, y - r * 0.35); g.textAlign = 'left'
    })
    titel(g, w, f, 'HYDRAULIK', '')
  },
  rollzaehler(g, w, h, t, f) {
    // mechanisches Rollenzählwerk: Ziffern rollen nach oben weg
    const wert = 4711 + t * 37.3, stellen = 6, bw = (w - 60) / stellen, y0 = h * 0.35, hh = h * 0.42
    g.font = `600 ${Math.round(hh * 0.8)}px Consolas, monospace`; g.textAlign = 'center'
    for (let s = 0; s < stellen; s++) {
      const teil = wert / Math.pow(10, stellen - 1 - s), ziffer = Math.floor(teil) % 10, rest = s === stellen - 1 ? teil % 1 : phase(teil % 1, 0.9, 1)
      const x = 30 + s * bw
      g.strokeStyle = css(f.haupt, 0.6); g.lineWidth = 2; g.strokeRect(x + 4, y0, bw - 8, hh)
      g.save(); g.beginPath(); g.rect(x + 4, y0, bw - 8, hh); g.clip()
      g.fillStyle = css(s >= stellen - 2 ? f.akzent : f.haupt, 1)
      g.fillText(String(ziffer), x + bw / 2, y0 + hh * 0.82 - rest * hh); g.fillText(String((ziffer + 1) % 10), x + bw / 2, y0 + hh * 1.82 - rest * hh)
      g.restore()
    }
    g.textAlign = 'left'; g.font = `14px ${SCHRIFT}`; g.fillStyle = css(f.haupt, 0.7); g.fillText('BETRIEBSSTUNDEN DER WERKSTATT · BEISPIEL', 30, h - 16)
    titel(g, w, f, 'ZÄHLWERK', '')
  },
  kompass(g, w, h, t, f) {
    const x = w / 2, y = h / 2 + 10, r = h * 0.38, kurs = (t * 9) % 360
    g.save(); g.translate(x, y); g.rotate(-kurs * Math.PI / 180)
    for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2, l = i % 9 === 0 ? 16 : 7; g.strokeStyle = css(f.haupt, 0.8); g.lineWidth = i % 9 === 0 ? 3 : 1; g.beginPath(); g.moveTo(Math.cos(a) * r, Math.sin(a) * r); g.lineTo(Math.cos(a) * (r - l), Math.sin(a) * (r - l)); g.stroke() }
    g.font = `600 18px ${SCHRIFT}`; g.fillStyle = css(f.haupt, 1); g.textAlign = 'center'
    ;['N', 'O', 'S', 'W'].forEach((n, i) => { g.save(); g.rotate((i * Math.PI) / 2); g.fillText(n, 0, -r + 34); g.restore() })
    g.restore()
    g.strokeStyle = css(f.akzent, 1); g.lineWidth = 3; g.beginPath(); g.moveTo(x, y - r - 6); g.lineTo(x - 8, y - r - 20); g.lineTo(x + 8, y - r - 20); g.closePath(); g.stroke()
    g.fillStyle = css(f.akzent, 1); g.font = '16px Consolas'; g.fillText(`${kurs.toFixed(1)}°`, x, y + 6); g.textAlign = 'left'
    titel(g, w, f, 'KURS', '')
  },
  ladering(g, w, h, t, f, nr) {
    const x = w * 0.3, y = h / 2 + 8, r = h * 0.34, p = klemm((t - 1.5 - nr * 0.3) / 7)
    for (let i = 0; i < 36; i++) { const a0 = (i / 36) * Math.PI * 2 - Math.PI / 2; g.strokeStyle = css(i / 36 < p ? f.haupt : f.haupt, i / 36 < p ? 0.95 : 0.15); g.lineWidth = 14; g.beginPath(); g.arc(x, y, r, a0 + 0.03, a0 + Math.PI * 2 / 36 - 0.03); g.stroke() }
    g.fillStyle = css(f.haupt, 1); g.font = `600 44px ${SCHRIFT}`; g.textAlign = 'center'; g.fillText(`${Math.round(p * 100)}`, x, y + 14); g.textAlign = 'left'
    g.font = `16px ${SCHRIFT}`; g.fillStyle = css(f.akzent, 1); g.fillText(['ENERGIEKERN', 'RUNEN-MATRIX', 'SPRACHKERN'][nr % 3], w * 0.58, y - 6); g.fillStyle = css(f.haupt, 0.7); g.fillText(p < 1 ? 'LÄDT …' : 'BEREIT', w * 0.58, y + 18)
    titel(g, w, f, 'LADEZUSTAND', '')
  },
  gelaende(g, w, h, t, f) {
    // pseudo-3D-Höhenlinien (Gelände-Scan), Zeilen laufen auf den Betrachter zu
    for (let z = 0; z < 16; z++) {
      const tiefe = ((z + (t * 1.5) % 1) / 16), s = 0.3 + tiefe * 0.9, y = h * 0.3 + tiefe * h * 0.62
      g.strokeStyle = css(f.haupt, 0.15 + tiefe * 0.8); g.lineWidth = 1 + tiefe; g.beginPath()
      for (let x = -w / 2; x <= w / 2; x += 8) { const hoehe = (rauschen(x * 0.012 + z * 0.7 - t * 1.5) + 1.75) * 18 * s; g.lineTo(w / 2 + x * s, y - hoehe) }
      g.stroke()
    }
    titel(g, w, f, 'GELÄNDESCAN', `${Math.round(320 + rauschen(t) * 40)} m`)
  },
  schaltplan(g, w, h, t, f) {
    const z = zufall(77), wege = []
    for (let i = 0; i < 14; i++) { let x = 20, y = 40 + z() * (h - 60); const p = [[x, y]]; while (x < w - 20) { x += 30 + z() * 60; if (z() < 0.5) y = klemm(y + (z() - 0.5) * 80, 40, h - 20); p.push([Math.min(x, w - 20), y]) } wege.push(p) }
    wege.forEach((p, i) => {
      g.strokeStyle = css(f.haupt, 0.35); g.lineWidth = 2; g.beginPath(); p.forEach(([x, y], k) => { if (k) { g.lineTo(x, p[k - 1][1]); g.lineTo(x, y) } else g.moveTo(x, y) }); g.stroke()
      const lauf = ((t * 0.4 + i * 0.13) % 1) * (p.length - 1), k = Math.floor(lauf), q = lauf - k
      if (p[k + 1]) { const x = p[k][0] + (p[k + 1][0] - p[k][0]) * q, y = p[k][1]; g.fillStyle = css(i % 4 ? f.haupt : f.akzent, 1); g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill() }
      g.fillStyle = css(f.haupt, 0.8); p.forEach(([x, y]) => g.fillRect(x - 2, y - 2, 4, 4))
    })
    titel(g, w, f, 'SCHALTKREIS · KERN', 'AKTIV')
  },
  sternkarte(g, w, h, t, f) {
    const z = zufall(5), sterne = Array.from({ length: 60 }, () => [z() * w, 34 + z() * (h - 40), z()])
    g.save(); g.translate(w / 2, h / 2); g.rotate(t * 0.04); g.translate(-w / 2, -h / 2)
    sterne.forEach(([x, y, s]) => { g.fillStyle = css(f.haupt, 0.4 + s * 0.6); g.beginPath(); g.arc(x, y, 1 + s * 2.5, 0, 7); g.fill() })
    g.strokeStyle = css(f.akzent, 0.6); g.lineWidth = 1.5; g.beginPath(); [3, 9, 14, 22, 30, 31].forEach((i, k) => (k ? g.lineTo(...sterne[i]) : g.moveTo(...sterne[i]))); g.stroke()
    g.restore()
    titel(g, w, f, 'STERNKARTE · ASGARD-SEKTOR', '')
  },
  matrix(g, w, h, t, f) {
    g.font = '15px Consolas, monospace'; const z = zufall(Math.floor(t * 6))
    for (let r = 0; r < 9; r++) for (let c = 0; c < 10; c++) { const hell = z() < 0.08; g.fillStyle = css(hell ? f.akzent : f.haupt, hell ? 1 : 0.5); g.fillText(Math.floor(z() * 100).toString().padStart(2, '0'), 18 + c * ((w - 30) / 10), 48 + r * 22) }
    titel(g, w, f, 'KORRELATIONSMATRIX', '')
  },
  herz(g, w, h, t, f) {
    raster(g, w, h, f, 24)
    g.strokeStyle = css(f.haupt, 1); g.lineWidth = 2.5; g.beginPath()
    for (let x = 0; x <= w; x += 3) { const p = ((x / w) * 3 + t * 1.2) % 1; let y = 0; if (p > 0.4 && p < 0.44) y = -60 * Math.sin(((p - 0.4) / 0.04) * Math.PI); else if (p > 0.44 && p < 0.47) y = 25 * Math.sin(((p - 0.44) / 0.03) * Math.PI); else if (p > 0.6 && p < 0.7) y = -12 * Math.sin(((p - 0.6) / 0.1) * Math.PI); g.lineTo(x, h * 0.6 + y) }
    g.stroke(); titel(g, w, f, 'PULS DES BENUTZERS', `${Math.round(72 + rauschen(t) * 4)} /min`)
  },
  helix(g, w, h, t, f) {
    for (let i = 0; i < 60; i++) {
      const x = 20 + (i / 60) * (w - 40), a = i * 0.32 + t * 2, y1 = h / 2 + 8 + Math.sin(a) * h * 0.3, y2 = h / 2 + 8 - Math.sin(a) * h * 0.3, tiefe = (Math.cos(a) + 1) / 2
      g.strokeStyle = css(f.haupt, 0.25); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y1); g.lineTo(x, y2); g.stroke()
      g.fillStyle = css(f.haupt, 0.3 + tiefe * 0.7); g.beginPath(); g.arc(x, y1, 2 + tiefe * 3, 0, 7); g.fill()
      g.fillStyle = css(f.akzent, 0.3 + (1 - tiefe) * 0.7); g.beginPath(); g.arc(x, y2, 2 + (1 - tiefe) * 3, 0, 7); g.fill()
    }
    titel(g, w, f, 'IDENTITÄTSMUSTER', 'BENUTZER ERKANNT')
  },
  baum(g, w, h, t, f, nr) {
    // Weltenbaum Yggdrasil als wachsender Datenbaum
    const wachstum = klemm((t - 1.6 - nr * 0.4) / 5)
    const ast = (x, y, laenge, winkel, tiefe, id) => {
      if (tiefe > 6) return
      const p = klemm(wachstum * 7 - tiefe); if (p <= 0) return
      const x2 = x + Math.cos(winkel) * laenge * p, y2 = y + Math.sin(winkel) * laenge * p
      g.strokeStyle = css(f.haupt, 0.9 - tiefe * 0.1); g.lineWidth = Math.max(1, 6 - tiefe); g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke()
      if (p >= 1) { const leuchten = Math.sin(t * 3 + id) > 0.6; g.fillStyle = css(leuchten ? f.akzent : f.haupt, leuchten ? 1 : 0.6); g.beginPath(); g.arc(x2, y2, 3, 0, 7); g.fill() }
      ast(x2, y2, laenge * 0.72, winkel - 0.45, tiefe + 1, id * 2 + 1); ast(x2, y2, laenge * 0.72, winkel + 0.45, tiefe + 1, id * 2 + 2)
    }
    ast(w / 2, h - 14, h * 0.24, -Math.PI / 2, 0, 1)
    titel(g, w, f, 'YGGDRASIL · DATENBAUM', `${Math.round(wachstum * 127)} KNOTEN`)
  },
  runenkreis(g, w, h, t, f) {
    const x = w / 2, y = h / 2 + 10, r = h * 0.38
    g.save(); g.translate(x, y)
    for (const [rr, tempo, n] of [[r, 0.2, 24], [r * 0.7, -0.35, 16], [r * 0.42, 0.6, 8]]) {
      g.strokeStyle = css(f.haupt, 0.5); g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, rr + 12, 0, 7); g.stroke()
      g.save(); g.rotate(t * tempo); g.font = `${Math.round(rr * 0.22)}px ${RUNEN_SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle'
      for (let k = 0; k < n; k++) { g.save(); g.rotate((k / n) * Math.PI * 2); g.fillStyle = css(k % 4 === 0 ? f.akzent : f.haupt, 0.9); g.fillText(RUNEN[(k * 5 + n) % RUNEN.length], 0, -rr); g.restore() }
      g.restore()
    }
    g.restore(); titel(g, w, f, 'RUNENKREIS', LOKI)
  },
  balkenwand(g, w, h, t, f) {
    const n = 64, frq = tonQuelle().frequenz
    for (let i = 0; i < n; i++) {
      const v = frq ? frq[Math.floor((i / n) * frq.length * 0.5)] / 255 : (Math.sin(t * 3 + i * 0.4) * 0.5 + 0.5) * (0.4 + 0.6 * Math.sin(i * 0.15 + t))
      const bh = Math.max(3, v * (h - 50)), x = 10 + i * ((w - 20) / n)
      g.fillStyle = css(i % 8 === 0 ? f.akzent : f.haupt, 0.85); g.fillRect(x, h / 2 + 10 - bh / 2, (w - 20) / n - 3, bh)
    }
    titel(g, w, f, 'ENERGIEFLUSS', '')
  },
}
