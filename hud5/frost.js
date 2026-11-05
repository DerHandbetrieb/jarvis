// Frost am Rand (neu 05.11.2026, Rückmeldung Auftraggeber: die gezeichneten Eiskristalle sahen aus wie Tannenzweige;
// gewünscht: flächig, milchig, dahinter unscharf – wie eine vereiste Scheibe; nur am ÄUSSEREN Rand der Gesamtfläche:
// links oben/links/unten, rechts oben/rechts/unten, Mitte nur oben und unten).
// Umsetzung wie „Frosted Glass“: eine Ebene über allem (auch über den Fenstern) zeichnet das Dahinterliegende unscharf
// (CSS backdrop-filter), darüber milchiger Schleier mit feinem Eiskorn. Eine Maske bestimmt, wo Frost ist: am Rand
// dicht, nach innen unregelmäßig auslaufend, in den vier Außenecken dicker (dort wächst Frost zuerst und am stärksten).
import { B, H } from './szene.js'

const hs = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s) }
function wert(x, y) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return (hs(ix, iy) * (1 - u) + hs(ix + 1, iy) * u) * (1 - v) + (hs(ix, iy + 1) * (1 - u) + hs(ix + 1, iy + 1) * u) * v }
function fbm(x, y, o = 4) { let s = 0, a = 0.5; for (let i = 0; i < o; i++) { s += a * wert(x, y); x = x * 2.03 + 11.3; y = y * 2.03 + 7.1; a *= 0.5 } return s }
const glatt = (a, b, x) => { const v = Math.max(0, Math.min(1, (x - a) / (b - a))); return v * v * (3 - 2 * v) }

/** Frost-Dichte 0..1 an einem Szenenpunkt (x, y in 5760×1080) */
export function frostDichte(x, y) {
  const rausch = (fbm(x / 140, y / 140) - 0.5) * 70 + (fbm(x / 35, y / 35) - 0.5) * 22 // unregelmäßige, leicht flockige Kante
  const tiefe = (base, t) => base * (0.6 + 0.9 * fbm(t / 380, base))
  const ecke = (cx, cy) => 260 * Math.exp(-Math.hypot(x - cx, y - cy) / 330)
  const ecken = ecke(0, 0) + ecke(0, H) + ecke(B, 0) + ecke(B, H)
  const kante = (d, t, base) => 1 - glatt(0.15, 1, (d + rausch) / (tiefe(base, t) + ecken))
  const a = [kante(y, x, 95), kante(H - y, x + 999, 105), kante(x, y + 333, 150), kante(B - x, y + 777, 150)]
  return 1 - a.reduce((p, k) => p * (1 - Math.max(0, k)), 1)
}

/** Ebene anlegen (einmal). huelle: Element über Szene und Fenstern; versatz 1920 = nur mittlerer Bildschirm */
export function erstelleFrost(huelle, versatz = 0) {
  const S = 4 // Maske in Viertel-Auflösung reicht (weiche Kante), Schleier in halber Auflösung
  const m = document.createElement('canvas'); m.width = B / S; m.height = H / S
  const mg = m.getContext('2d'), md = mg.createImageData(m.width, m.height)
  const tex = document.createElement('canvas'); tex.width = B / 2; tex.height = H / 2
  const tg = tex.getContext('2d'), td = tg.createImageData(tex.width, tex.height)
  for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) { const i = (y * m.width + x) * 4; md.data[i] = md.data[i + 1] = md.data[i + 2] = 255; md.data[i + 3] = Math.round(frostDichte(x * S, y * S) * 255) }
  mg.putImageData(md, 0, 0)
  // Schleier: milchig-bläuliches Weiß, wolkig ungleichmäßig, dazu feines Eiskorn und vereinzelte Glitzerpunkte
  for (let y = 0; y < tex.height; y++) for (let x = 0; x < tex.width; x++) {
    const X = x * 2, Y = y * 2, d = md.data[((Math.min(m.height - 1, Math.floor(Y / S)) * m.width) + Math.min(m.width - 1, Math.floor(X / S))) * 4 + 3] / 255
    if (d <= 0.003) continue
    const wolke = 0.55 + 0.7 * fbm(X / 90, Y / 90, 3), korn = hs(X * 0.73, Y * 1.31), glitzer = korn > 0.9965 ? 1 : 0
    const a = Math.min(1, d * (0.36 * wolke + 0.12 * korn * korn * korn) + glitzer * d * 0.6)
    const i = (y * tex.width + x) * 4; td.data[i] = 222 + glitzer * 33; td.data[i + 1] = 238 + glitzer * 17; td.data[i + 2] = 246 + glitzer * 9; td.data[i + 3] = Math.round(a * 255)
  }
  tg.putImageData(td, 0, 0)
  const maske = `url(${m.toDataURL('image/png')})`

  const flaeche = document.createElement('div')
  Object.assign(flaeche.style, {
    position: 'absolute', left: '0', top: '0', width: B + 'px', height: H + 'px', transformOrigin: '0 0', pointerEvents: 'none', opacity: '0',
    backdropFilter: 'blur(9px) saturate(0.75) brightness(1.12)', webkitBackdropFilter: 'blur(9px) saturate(0.75) brightness(1.12)',
    maskImage: maske, webkitMaskImage: maske, maskSize: '100% 100%', webkitMaskSize: '100% 100%', maskRepeat: 'no-repeat', webkitMaskRepeat: 'no-repeat',
  })
  Object.assign(tex.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' })
  flaeche.appendChild(tex)
  Object.assign(huelle.style, { position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none' })
  huelle.appendChild(flaeche)
  const passen = () => { const f = (huelle.clientHeight || innerHeight) / H; flaeche.style.transform = `scale(${f}) translateX(${-versatz}px)` }
  passen(); addEventListener('resize', passen)
  return { flaeche, stand: -1 }
}

/** Stärke 0..1 (weiches Ein-/Ausblenden kommt aus der Szene: s.wetter.sichtbar.frost) */
export function frostStellen(fr, staerke) {
  const v = Math.round(Math.max(0, Math.min(1, staerke)) * 100) / 100
  if (v === fr.stand) return
  fr.stand = v; fr.flaeche.style.opacity = String(v); fr.flaeche.style.display = v > 0 ? '' : 'none'
}
