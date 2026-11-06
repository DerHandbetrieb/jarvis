// Frost am Rand (dritte Fassung 06.11.2026, Rückmeldung Auftraggeber: Korn sah aus wie ein Sternenhimmel; gewünscht:
// wie die Eisfläche eines zugefrorenen Sees, dahinter das Originalbild leicht verschwommen und milchig, dazu hier und
// da Eisblumen am Rand). Nur am ÄUSSEREN Rand der Gesamtfläche: links oben/links/unten, rechts oben/rechts/unten,
// Mitte nur oben und unten.
// Aufbau: eine Ebene über allem (auch über den Fenstern) zeichnet das Dahinterliegende unscharf (CSS backdrop-filter).
// Darüber Echtbilder (Magnific, ebenen/frost-*.webp): Seeeis mit Rissen, Eisblumen in den Außenecken und entlang der
// Ränder. Helle Bildteile werden zu deckendem Eis, dunkle bleiben durchsichtig – so bleibt die Szene dahinter sichtbar.
import { B, H } from './szene.js'

// Unten liegt auf allen drei Bildschirmen die Windows-Taskleiste (48 Bildpunkte): der Rand beginnt darüber, sonst wäre er verdeckt
// (Hinweis Auftraggeber 06.11.2026)
const UNTEN = H - 48

const hs = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s) }
function wert(x, y) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return (hs(ix, iy) * (1 - u) + hs(ix + 1, iy) * u) * (1 - v) + (hs(ix, iy + 1) * (1 - u) + hs(ix + 1, iy + 1) * u) * v }
function fbm(x, y, o = 4) { let s = 0, a = 0.5; for (let i = 0; i < o; i++) { s += a * wert(x, y); x = x * 2.03 + 11.3; y = y * 2.03 + 7.1; a *= 0.5 } return s }
const glatt = (a, b, x) => { const v = Math.max(0, Math.min(1, (x - a) / (b - a))); return v * v * (3 - 2 * v) }

// Der Rand wächst mit der Kälte (Wunsch Auftraggeber 06.11.2026): bei −1 °C nur Ansätze, bei −2,7 °C noch schmal, voll bei
// −8 °C und kälter. Darum keine gerade Linie, sondern erst langsam, dann schneller.
export const frostStufe = (grad) => Math.max(0, Math.min(1, -grad / 8)) ** 1.6
export const frostFaktor = (grad) => 0.12 + 1.28 * frostStufe(grad)
/** feste Zufallsanteile eines Szenenpunkts (einmal rechnen; ändert sich nur der Faktor, geht das Neuzeichnen schnell) */
const FELDER = 10
function punkt(x, y) {
  const ecke = (cx, cy, st) => st * Math.exp(-Math.hypot(x - cx, y - cy) / 340)
  const q = (base, t) => base * (0.6 + 0.9 * fbm(t / 420, base))
  const uhrFrei = 1 - 0.8 * Math.exp(-(((x - B / 2) / 620) ** 2)) // oben in der Mitte schmal: Uhrzeit im Ring bleibt lesbar
  return [(fbm(x / 170, y / 170) - 0.5) * 110, q(130, x) * uhrFrei, q(150, x + 999), q(200, y + 333), q(200, y + 777),
    ecke(0, 0, 340) + ecke(0, UNTEN, 170) + ecke(B, 0, 70) + ecke(B, UNTEN, 260), // jede Ecke anders (Wunsch Auftraggeber 06.11.2026)
    fbm(x / 240, 3.1, 3), fbm(x / 240, 9.7, 3), fbm(y / 200, 5.3, 3), fbm(y / 200, 12.9, 3)] // Flecken je Kante, siehe dichteAus
}
function dichteAus(x, y, w, o, f) {
  const rausch = w[o], q0 = w[o + 1], q1 = w[o + 2], q2 = w[o + 3], q3 = w[o + 4], ecken = w[o + 5]
  // Wenig Frost soll keine durchgehende Linie sein (Rückmeldung 06.11.2026): je wärmer, desto mehr Lücken zwischen vereisten Stellen
  const fleck = (v) => 1 + (glatt(0.4, 0.56, v) * 1.9 - 1) * Math.max(0, 1 - f)
  const r = rausch * (0.55 + 0.45 * Math.min(1, f)), kante = (d, q, v) => Math.max(0, 1 - glatt(0.1, 1, (d + r) / ((q * fleck(v) + ecken) * f))) * (1 - (1 - glatt(0.44, 0.54, v)) * Math.max(0, 1 - f) ** 0.5)
  return 1 - (1 - kante(y, q0, w[o + 6])) * (1 - kante(Math.max(0, UNTEN - y), q1, w[o + 7])) * (1 - kante(x, q2, w[o + 8])) * (1 - kante(B - x, q3, w[o + 9]))
}
/** Frost-Dichte 0..1 an einem Szenenpunkt (x, y in 5760×1080): am Rand dicht, nach innen unregelmäßig auslaufend. f: Faktor der Tiefe */
export function frostDichte(x, y, f = 1) { return dichteAus(x, y, punkt(x, y), 0, f) }

const laden = (u) => new Promise((ok, f) => { const i = new Image(); i.onload = () => ok(i); i.onerror = f; i.src = u })
// Eisblumen: [x, y, Größe, Drehung in Grad, Bild, frei]. Die Bilder wachsen von ihrer linken unteren Ecke nach rechts oben.
// Gedreht statt gespiegelt und jede anders groß – nichts soll wie ein Rorschach-Bild aussehen (Rückmeldung 06.11.2026).
// Ecken: oben links groß, unten links mittel, oben rechts nur ein kleines Eck, unten rechts groß.
const BLUMEN = [
  [0, 0, 660, 90, 1, false], [0, UNTEN, 380, 0, 3, false], [B, 0, 170, 180, 4, false], [B, UNTEN, 560, 270, 2, false],
  [1120, UNTEN + 30, 330, -14, 2, true], [2230, UNTEN + 20, 170, 22, 4, true], [3700, UNTEN + 30, 250, -32, 1, true], [4780, UNTEN + 20, 210, 12, 3, true],
  [640, -20, 210, 164, 4, true], [2540, -20, 150, 196, 3, true], [4300, -30, 290, 172, 2, true],
  [-20, 610, 230, 74, 2, true], [B + 20, 330, 190, 256, 1, true],
  // kleine, die schon bei wenig Frost da sind (letzte Zahl: ab dieser Kältestufe, Wunsch 06.11.2026)
  [300, -8, 125, 170, 1, true, 0.02], [1480, -6, 95, 190, 3, true, 0.06], [3980, -8, 140, 165, 2, true, 0.03], [5050, -6, 105, 185, 4, true, 0.09],
  [1760, UNTEN + 6, 115, -10, 1, true, 0.05], [4250, UNTEN + 8, 130, 18, 3, true, 0.02], [-6, 320, 100, 80, 4, true, 0.08], [B + 6, 760, 120, 262, 2, true, 0.04],
]

async function schleierBauen(tex, basis) {
  const eisBilder = await Promise.all(['frost-eis', 'frost-eis2', 'frost-eis3', 'frost-eis4'].map((n) => laden(`${basis}${n}.webp`)))
  const blumen = await Promise.all(['frost-blume1', 'frost-blume2', 'frost-blume3', 'frost-blume4'].map((n) => laden(`${basis}${n}.webp`)))
  const W = tex.width, HH = tex.height, S = W / B // Schleier in halber Auflösung
  // Seeeis: verschiedene Bilder und Ausschnitte nebeneinander, Übergänge weich überblendet – nichts gespiegelt
  const e = document.createElement('canvas'); e.width = W; e.height = HH; const eg = e.getContext('2d', { willReadFrequently: true })
  const kb = 1500 * S, kh = 800 * S, ub = 260 * S
  const kachel = document.createElement('canvas'); kachel.width = Math.ceil(kb + ub); kachel.height = Math.ceil(kh + ub); const kg = kachel.getContext('2d')
  const weich = (g, b, h, r) => { // Kachel ringsum ausblenden
    g.globalCompositeOperation = 'destination-in'
    const x = g.createLinearGradient(0, 0, b, 0); x.addColorStop(0, 'rgba(0,0,0,0)'); x.addColorStop(r / b, '#000'); x.addColorStop(1 - r / b, '#000'); x.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = x; g.fillRect(0, 0, b, h)
    const y = g.createLinearGradient(0, 0, 0, h); y.addColorStop(0, 'rgba(0,0,0,0)'); y.addColorStop(r / h, '#000'); y.addColorStop(1 - r / h, '#000'); y.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = y; g.fillRect(0, 0, b, h)
    g.globalCompositeOperation = 'source-over'
  }
  eg.globalCompositeOperation = 'lighter'
  let n = 0
  for (let y = -ub / 2; y < HH; y += kh) for (let x = -ub / 2; x < W; x += kb, n++) {
    const bild = eisBilder[(n * 3 + Math.floor(hs(n, 4.2) * 4)) % 4], vz = hs(n, 9.1) > 0.5 ? Math.PI : 0 // anderes Bild je Kachel, teils auf dem Kopf
    const qb = bild.width * (0.45 + 0.3 * hs(n, 1.3)), qh = (qb * kachel.height) / kachel.width, qx = hs(n, 2.7) * (bild.width - qb), qy = hs(n, 3.9) * Math.max(0, bild.height - qh)
    kg.globalCompositeOperation = 'source-over'; kg.clearRect(0, 0, kachel.width, kachel.height)
    kg.save(); kg.translate(kachel.width / 2, kachel.height / 2); kg.rotate(vz); kg.drawImage(bild, qx, qy, qb, qh, -kachel.width / 2, -kachel.height / 2, kachel.width, kachel.height); kg.restore()
    weich(kg, kachel.width, kachel.height, ub * 0.9)
    eg.drawImage(kachel, x, y)
  }
  const ed = eg.getImageData(0, 0, W, HH).data
  // Eisblumen: Helligkeit wird zu Deckkraft, schwarzer Bildgrund ist wirklich durchsichtig. Der Rand läuft unregelmäßig
  // aus (Rauschen), sonst wirkt eine Blume wie abgeschnitten (Rückmeldung 06.11.2026)
  const N = 512
  const freistellen = (bild, frei, saat) => {
    const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(bild, 0, 0, N, N)
    const d = g.getImageData(0, 0, N, N), p = d.data
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4, l = (p[i] + p[i + 1] + p[i + 2]) / 765, kraus = 0.72 + 0.56 * fbm(x / 70 + saat, y / 70, 3)
      // frei: rund um die Blumenmitte auslaufen; Ecke: vom Eckpunkt aus nach innen auslaufen
      const r = frei ? Math.hypot(x - N * 0.42, y - N * 0.6) / (N * 0.46 * kraus) : Math.hypot(x, N - y) / (N * 0.98 * kraus)
      p[i] = 236; p[i + 1] = 246; p[i + 2] = 252; p[i + 3] = Math.round(glatt(0.16, 0.7, l) * (1 - glatt(0.62, 1, r)) * 255)
    }
    g.putImageData(d, 0, 0); return c
  }
  const fertig = BLUMEN.map(([, , , , nr, frei], i) => freistellen(blumen[nr - 1], frei, i * 3.7))
  const tg = tex.getContext('2d'), td = tg.createImageData(W, HH)
  for (let y = 0; y < HH; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, a = 0.2 + 0.72 * glatt(0.18, 0.85, ed[i] / 255) // milchiger Grund + Risse; die Form kommt aus der Maske
    td.data[i] = 214; td.data[i + 1] = 232; td.data[i + 2] = 244; td.data[i + 3] = Math.round(a * 255)
  }
  tg.putImageData(td, 0, 0)
  return fertig
}

/** Eisblumen je nach Kälte: Eck-Blumen wachsen mit, die übrigen kommen nach und nach dazu */
function blumenZeichnen(lage, fertig, stufe) {
  const g = lage.getContext('2d'), S = lage.width / B
  g.clearRect(0, 0, lage.width, lage.height)
  BLUMEN.forEach(([x, y, gr, dreh, , frei, ab], i) => {
    const schwelle = ab ?? 0.2 + ((i - 4) / 9) * 0.7, sichtbar = frei ? glatt(schwelle, schwelle + 0.1, stufe) : 1, gross = gr * S * (frei ? 1 : 0.12 + 0.63 * stufe)
    if (sichtbar <= 0.01) return
    g.save(); g.globalAlpha = 0.95 * sichtbar; g.translate(x * S, y * S); g.rotate((dreh * Math.PI) / 180)
    if (frei) g.translate(-gross * 0.42, gross * 0.1) // freie Blumen um ihre Mitte, nicht um die Bildecke
    g.drawImage(fertig[i], 0, -gross, gross, gross); g.restore()
  })
}

/** Ebene anlegen (einmal). huelle: Element über Szene und Fenstern; versatz 1920 = nur mittlerer Bildschirm */
export function erstelleFrost(huelle, versatz = 0, basis = './ebenen/') {
  const fr = { flaeche: null, stand: -1, ziel: 0, bereit: false, gradStand: null, gradZiel: -4 }
  const S = 4
  const m = document.createElement('canvas'); m.width = B / S; m.height = H / S
  const mg = m.getContext('2d', { willReadFrequently: true })
  // stückweise rechnen, sonst steht das Wallpaper beim ersten Frost gut zwei Sekunden still
  const feld = new Float32Array(m.width * m.height * FELDER)
  const feldBauen = async () => {
    for (let y = 0, o = 0; y < m.height; y++) {
      for (let x = 0; x < m.width; x++, o += FELDER) feld.set(punkt(x * S, y * S), o)
      if (y % 8 === 7) await new Promise((w) => setTimeout(w))
    }
  }
  const tex = document.createElement('canvas'); tex.width = B / 2; tex.height = H / 2
  const flaeche = document.createElement('div'); fr.flaeche = flaeche
  Object.assign(flaeche.style, {
    position: 'absolute', left: '0', top: '0', width: B + 'px', height: H + 'px', transformOrigin: '0 0', pointerEvents: 'none', opacity: '0',
    backdropFilter: 'blur(5px) saturate(0.85) brightness(1.06)', webkitBackdropFilter: 'blur(5px) saturate(0.85) brightness(1.06)',
  })
  Object.assign(tex.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' })
  const lage = document.createElement('canvas'); lage.width = B / 2; lage.height = H / 2
  Object.assign(lage.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' })
  flaeche.appendChild(tex); flaeche.appendChild(lage)
  Object.assign(huelle.style, { position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none' })
  huelle.appendChild(flaeche)
  const passen = () => { const f = (huelle.clientHeight || innerHeight) / H; flaeche.style.transform = `scale(${f}) translateX(${-versatz}px)` }
  passen(); addEventListener('resize', passen)
  Promise.all([schleierBauen(tex, basis), feldBauen()]).then(([blumen]) => {
    fr.zeichnen = (grad) => {
      const f = frostFaktor(grad), stufe = frostStufe(grad)
      blumenZeichnen(lage, blumen, stufe)
      const md = mg.createImageData(m.width, m.height)
      for (let y = 0, i = 0; y < m.height; y++) for (let x = 0; x < m.width; x++, i++) { md.data[i * 4] = md.data[i * 4 + 1] = md.data[i * 4 + 2] = 255; md.data[i * 4 + 3] = Math.round(dichteAus(x * S, y * S, feld, i * FELDER, f) * 255) }
      mg.globalCompositeOperation = 'source-over'; mg.putImageData(md, 0, 0)
      // die Unschärfe auch unter den Eisblumen: Blumen weich in die Maske übernehmen
      mg.globalCompositeOperation = 'lighter'; mg.filter = 'blur(3px)'; mg.drawImage(lage, 0, 0, m.width, m.height); mg.filter = 'none'
      const u = `url(${m.toDataURL('image/png')})`
      Object.assign(flaeche.style, { maskImage: u, webkitMaskImage: u, maskSize: '100% 100%', webkitMaskSize: '100% 100%', maskRepeat: 'no-repeat', webkitMaskRepeat: 'no-repeat' })
    }
    fr.zeichnen(fr.gradZiel); fr.gradStand = fr.gradZiel
    fr.bereit = true; fr.stand = -1; frostStellen(fr, fr.ziel)
  }).catch((f) => console.error('Frost:', f))
  return fr
}

/** Stärke 0..1 (weiches Ein-/Ausblenden kommt aus der Szene: s.wetter.sichtbar.frost) */
export function frostStellen(fr, staerke) {
  const v = Math.round(Math.max(0, Math.min(1, staerke)) * 100) / 100
  fr.ziel = v
  if (!fr.bereit || v === fr.stand) return
  fr.stand = v; fr.flaeche.style.opacity = String(v); fr.flaeche.style.display = v > 0 ? '' : 'none'
}

/** Temperatur nachführen; neu gezeichnet erst ab 0,5 Grad Unterschied, damit der Rand bei schwankenden Werten nicht zuckt */
export function frostGrad(fr, grad) {
  if (!Number.isFinite(grad)) return
  fr.gradZiel = grad
  if (!fr.bereit || (fr.gradStand != null && Math.abs(grad - fr.gradStand) < 0.5)) return
  fr.gradStand = grad; fr.zeichnen(grad)
}
