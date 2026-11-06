// Eis auf dem See (06.11.2026, Wunsch Auftraggeber: friert erst nach mehreren Tagen Dauerfrost, Stufe aus electron/seeeis.cjs).
// Die Spiegelung bleibt sichtbar, nur die Wellen legen sich (szene.js); darüber Risse und ein Hauch Schnee aus demselben
// Eisbild wie der Rand, perspektivisch auf die Seefläche gelegt: am Horizont fein, vorn groß. Stufe 0,5: nur vom Ufer her.
const hs = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s) }
function wert(x, y) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return (hs(ix, iy) * (1 - u) + hs(ix + 1, iy) * u) * (1 - v) + (hs(ix, iy + 1) * (1 - u) + hs(ix + 1, iy + 1) * u) * v }
function fbm(x, y, o = 4) { let s = 0, a = 0.5; for (let i = 0; i < o; i++) { s += a * wert(x, y); x = x * 2.03 + 11.3; y = y * 2.03 + 7.1; a *= 0.5 } return s }
const glatt = (a, b, x) => { const v = Math.max(0, Math.min(1, (x - a) / (b - a))); return v * v * (3 - 2 * v) }
const leinwand = (b, h) => { const c = document.createElement('canvas'); c.width = b; c.height = h; return c }

function bauen(lage, bild) {
  const { b, h } = lage, S = 2, w = Math.ceil(b / S), hh = h // waagerecht halbe Auflösung reicht
  const c = leinwand(w, hh), g = c.getContext('2d', { willReadFrequently: true })
  const muster = g.createPattern(bild, 'repeat')
  for (let y = 0; y < hh; y++) {
    const d = (y + 1) / hh, sk = 0.16 + 1.5 * d // perspektivisch: am Horizont klein, vorn groß
    muster.setTransform(new DOMMatrix().translate(w / 2, y).scale(sk, sk * 0.3).translate(0, -(1 / (d + 0.06)) * 260))
    g.fillStyle = muster; g.fillRect(0, y, w, 1)
  }
  const dat = g.getImageData(0, 0, w, hh), p = dat.data
  for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, d = y / hh, riss = glatt(0.2, 0.8, p[i] / 255), schnee = glatt(0.5, 0.72, fbm((x * S) / 420, y / (14 + 50 * d))), rand = 1 - glatt(0.9, 1, Math.abs(x * 2 / w - 1))
    const a = (0.1 + 0.4 * riss * (0.45 + 0.55 * d) + 0.2 * schnee) * glatt(0, 0.03, d) * rand
    p[i] = 205; p[i + 1] = 232; p[i + 2] = 246; p[i + 3] = Math.round(Math.min(1, a) * 255)
  }
  g.putImageData(dat, 0, 0)
  // volles Eis in Originalbreite bereitlegen
  const voll = leinwand(b, h); voll.getContext('2d').drawImage(c, 0, 0, b, h)
  // Stufe 0,5: vom Ufer her (außen), zur Mitte unregelmäßig auslaufend
  const uh = leinwand(w, hh), ug = uh.getContext('2d', { willReadFrequently: true }), m = ug.createImageData(w, hh)
  for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, aussen = Math.abs(x * 2 / w - 1), naehe = aussen + 0.5 * (fbm((x * S) / 300, y / 30) - 0.5) + 0.22 * (1 - y / hh)
    m.data[i + 3] = Math.round(glatt(0.5, 0.68, naehe) * 255)
  }
  ug.putImageData(m, 0, 0)
  const halb = leinwand(b, h), hg = halb.getContext('2d'); hg.drawImage(voll, 0, 0); hg.globalCompositeOperation = 'destination-in'; hg.drawImage(uh, 0, 0, b, h)
  lage.voll = voll; lage.halb = halb
}

/** lädt das Eisbild und baut die Ebene (einmal, im Hintergrund) */
export function erstelleSeeEis(basis, b, h) {
  const lage = { b, h, voll: null, halb: null }
  const bild = new Image()
  bild.onload = () => { try { bauen(lage, bild) } catch (f) { console.error('See-Eis:', f) } }
  bild.onerror = () => console.error('See-Eis: Bild fehlt')
  bild.src = `${basis}frost-eis.webp`
  return lage
}

export function seeEisBild(lage, eis) { return eis > 0.75 ? lage.voll : lage.halb ?? lage.voll }
