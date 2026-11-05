// Vorschau der Szene mit Bildrate (Regel: Bildrate selbst messen, bevor gezeigt wird – CLAUDE.md Etappe 13)
import { B, H, ladeSzene, zeichneSzene } from './szene.js'

const c = document.getElementById('flaeche'), g = c.getContext('2d', { alpha: false }), info = document.getElementById('info')
const s = await ladeSzene('./ebenen/')
let loki = 'hoert', zoom = false
addEventListener('keydown', (e) => {
  loki = { 1: 'hoert', 2: 'denkt', 3: 'spricht', 4: 'aus' }[e.key] ?? loki
  if (e.key === 'z' || e.key === 'Z') { zoom = !zoom; c.width = zoom ? 1920 : B; c.style.width = zoom ? '1920px' : '100vw' }
})
const zeiten = []
let vorher = performance.now(), laengste = 0
function schleife(ms) {
  requestAnimationFrame(schleife)
  const a = performance.now()
  const pegel = loki === 'spricht' ? 0.5 + 0.5 * Math.abs(Math.sin(ms / 130) * Math.sin(ms / 370)) : 0
  zeichneSzene(g, s, ms / 1000, { loki, pegel, versatz: zoom ? 1920 : 0 })
  const dauer = performance.now() - a
  zeiten.push(dauer); if (zeiten.length > 120) zeiten.shift()
  laengste = Math.max(laengste * 0.995, ms - vorher); vorher = ms
}
setInterval(() => {
  const mittel = zeiten.reduce((x, y) => x + y, 0) / Math.max(1, zeiten.length)
  info.textContent = `Loki: ${loki} · Zeichnen ${mittel.toFixed(1)} ms · längster Abstand ${laengste.toFixed(1)} ms · Fläche ${c.width}×${H}`
  window.messung = { mittel, laengste }
}, 500)
requestAnimationFrame(schleife)
