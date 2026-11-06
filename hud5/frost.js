// Frost am Rand (dritte Fassung 06.11.2026, Rückmeldung Auftraggeber: Korn sah aus wie ein Sternenhimmel; gewünscht:
// wie die Eisfläche eines zugefrorenen Sees, dahinter das Originalbild leicht verschwommen und milchig, dazu hier und
// da Eisblumen am Rand). Nur am ÄUSSEREN Rand der Gesamtfläche: links oben/links/unten, rechts oben/rechts/unten,
// Mitte nur oben und unten.
// Aufbau: eine Ebene über allem (auch über den Fenstern) zeichnet das Dahinterliegende unscharf (CSS backdrop-filter).
// Darüber Echtbilder (Magnific, ebenen/frost-*.webp): Seeeis mit Rissen, Eisblumen in den Außenecken und entlang der
// Ränder. Helle Bildteile werden zu deckendem Eis, dunkle bleiben durchsichtig – so bleibt die Szene dahinter sichtbar.
import { B, H } from './szene.js'

const hs = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s) }
function wert(x, y) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return (hs(ix, iy) * (1 - u) + hs(ix + 1, iy) * u) * (1 - v) + (hs(ix, iy + 1) * (1 - u) + hs(ix + 1, iy + 1) * u) * v }
function fbm(x, y, o = 4) { let s = 0, a = 0.5; for (let i = 0; i < o; i++) { s += a * wert(x, y); x = x * 2.03 + 11.3; y = y * 2.03 + 7.1; a *= 0.5 } return s }
const glatt = (a, b, x) => { const v = Math.max(0, Math.min(1, (x - a) / (b - a))); return v * v * (3 - 2 * v) }

/** Frost-Dichte 0..1 an einem Szenenpunkt (x, y in 5760×1080): am Rand dicht, nach innen unregelmäßig auslaufend */
export function frostDichte(x, y) {
  const rausch = (fbm(x / 170, y / 170) - 0.5) * 110
  const tiefe = (base, t) => base * (0.6 + 0.9 * fbm(t / 420, base))
  const ecke = (cx, cy) => 300 * Math.exp(-Math.hypot(x - cx, y - cy) / 340)
  const ecken = ecke(0, 0) + ecke(0, H) + ecke(B, 0) + ecke(B, H)
  const kante = (d, t, base) => 1 - glatt(0.1, 1, (d + rausch) / (tiefe(base, t) + ecken))
  const a = [kante(y, x, 130), kante(H - y, x + 999, 150), kante(x, y + 333, 200), kante(B - x, y + 777, 200)]
  return 1 - a.reduce((p, k) => p * (1 - Math.max(0, k)), 1)
}

const laden = (u) => new Promise((ok, f) => { const i = new Image(); i.onload = () => ok(i); i.onerror = f; i.src = u })
// Eisblumen: [x, y, Größe, spiegelnX, spiegelnY, Bild] – die Bilder wachsen von der linken unteren Ecke nach rechts oben
const BLUMEN = [
  [0, H, 560, false, false, 1], [0, 0, 500, false, true, 2], [B, H, 560, true, false, 3], [B, 0, 500, true, true, 1],
  [1240, H, 300, false, false, 2], [3620, H, 260, false, false, 1], [4520, H, 300, true, false, 3],
  [820, 0, 240, false, true, 3], [2560, 0, 200, false, true, 1], [4960, 0, 240, true, true, 2],
]

async function schleierBauen(tex, maske, basis) {
  const [eis, ...blumen] = await Promise.all(['frost-eis', 'frost-blume1', 'frost-blume2', 'frost-blume3'].map((n) => laden(`${basis}${n}.webp`)))
  const W = tex.width, HH = tex.height, S = W / B // Schleier in halber Auflösung
  // Seeeis gekachelt und abwechselnd gespiegelt (keine Nähte)
  const e = document.createElement('canvas'); e.width = W; e.height = HH; const eg = e.getContext('2d', { willReadFrequently: true })
  const kb = 2100 * S, kh = (kb * eis.height) / eis.width
  for (let iy = 0, y = 0; y < HH; iy++, y += kh) for (let ix = 0, x = 0; x < W; ix++, x += kb) {
    eg.save(); eg.translate(x + (ix % 2 ? kb : 0), y + (iy % 2 ? kh : 0)); eg.scale(ix % 2 ? -1 : 1, iy % 2 ? -1 : 1); eg.drawImage(eis, 0, 0, kb, kh); eg.restore()
  }
  const ed = eg.getImageData(0, 0, W, HH).data
  // Eisblumen: Helligkeit wird zu Deckkraft, schwarzer Bildgrund ist wirklich durchsichtig; zum Bildrand weich auslaufend
  const f = document.createElement('canvas'); f.width = W; f.height = HH; const fg = f.getContext('2d', { willReadFrequently: true })
  const N = 512
  const freistellen = (bild, frei) => { // frei = mitten am Rand: auch links weich auslaufen (Ecken sitzen am Bildschirmrand)
    const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(bild, 0, 0, N, N)
    const d = g.getImageData(0, 0, N, N), p = d.data
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4, l = (p[i] + p[i + 1] + p[i + 2]) / 765
      const rand = glatt(0, 1, Math.min(N - 1 - x, y) / 70) * (frei ? glatt(20, 190, x) : 1) // rechts und oben im Bild läuft die Blume aus
      p[i] = p[i + 1] = p[i + 2] = 255; p[i + 3] = Math.round(glatt(0.16, 0.7, l) * rand * 255)
    }
    g.putImageData(d, 0, 0); return c
  }
  const ecke = blumen.map((b) => freistellen(b, false)), mitte = blumen.map((b) => freistellen(b, true))
  BLUMEN.forEach(([x, y, gr, sx, sy, nr], i) => { fg.save(); fg.translate(x * S, y * S); fg.scale(sx ? -1 : 1, sy ? -1 : 1); fg.drawImage((i < 4 ? ecke : mitte)[nr - 1], 0, -gr * S, gr * S, gr * S); fg.restore() })
  const fd = fg.getImageData(0, 0, W, HH).data
  const tg = tex.getContext('2d'), td = tg.createImageData(W, HH)
  const mb = maske.width, mg = maske.getContext('2d'), md = mg.getImageData(0, 0, mb, maske.height).data, st = W / mb
  for (let y = 0; y < HH; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, dichte = md[(Math.min(maske.height - 1, Math.floor(y / st)) * mb + Math.min(mb - 1, Math.floor(x / st))) * 4 + 3] / 255
    const riss = glatt(0.18, 0.85, ed[i] / 255), blume = fd[i + 3] / 255
    const a = Math.max(dichte * (0.2 + 0.72 * riss), blume * 0.95) // milchiger Grund + Risse, darüber Eisblumen
    if (a <= 0.003) continue
    td.data[i] = 214 + 30 * blume; td.data[i + 1] = 232 + 18 * blume; td.data[i + 2] = 244 + 10 * blume; td.data[i + 3] = Math.round(a * 255)
  }
  tg.putImageData(td, 0, 0)
  // die Unschärfe auch unter den Eisblumen: Blumen weich in die Maske übernehmen
  mg.globalCompositeOperation = 'lighter'; mg.filter = 'blur(3px)'; mg.drawImage(tex, 0, 0, mb, maske.height); mg.filter = 'none'
}

/** Ebene anlegen (einmal). huelle: Element über Szene und Fenstern; versatz 1920 = nur mittlerer Bildschirm */
export function erstelleFrost(huelle, versatz = 0, basis = './ebenen/') {
  const fr = { flaeche: null, stand: -1, ziel: 0, bereit: false }
  const S = 4
  const m = document.createElement('canvas'); m.width = B / S; m.height = H / S
  const mg = m.getContext('2d', { willReadFrequently: true }), md = mg.createImageData(m.width, m.height)
  for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) { const i = (y * m.width + x) * 4; md.data[i] = md.data[i + 1] = md.data[i + 2] = 255; md.data[i + 3] = Math.round(frostDichte(x * S, y * S) * 255) }
  mg.putImageData(md, 0, 0)
  const tex = document.createElement('canvas'); tex.width = B / 2; tex.height = H / 2
  const flaeche = document.createElement('div'); fr.flaeche = flaeche
  Object.assign(flaeche.style, {
    position: 'absolute', left: '0', top: '0', width: B + 'px', height: H + 'px', transformOrigin: '0 0', pointerEvents: 'none', opacity: '0',
    backdropFilter: 'blur(5px) saturate(0.85) brightness(1.06)', webkitBackdropFilter: 'blur(5px) saturate(0.85) brightness(1.06)',
  })
  Object.assign(tex.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' })
  flaeche.appendChild(tex)
  Object.assign(huelle.style, { position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none' })
  huelle.appendChild(flaeche)
  const passen = () => { const f = (huelle.clientHeight || innerHeight) / H; flaeche.style.transform = `scale(${f}) translateX(${-versatz}px)` }
  passen(); addEventListener('resize', passen)
  schleierBauen(tex, m, basis).then(() => {
    const u = `url(${m.toDataURL('image/png')})`
    Object.assign(flaeche.style, { maskImage: u, webkitMaskImage: u, maskSize: '100% 100%', webkitMaskSize: '100% 100%', maskRepeat: 'no-repeat', webkitMaskRepeat: 'no-repeat' })
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
