// Vorschau der Szene mit Bildrate (Regel: Bildrate selbst messen, bevor gezeigt wird – CLAUDE.md Etappe 13)
import { B, H, ladeSzene, zeichneSzene } from './szene.js'
import { ausHud } from './inhalte.js'
import { erstelleTafeln, zeichneTafeln, SPIEGEL } from './tafeln.js'
import { KANTE } from './rahmen.js'
import { sequenzDaten } from '../startsequenz/lageDaten.js'

const c = document.getElementById('flaeche'), g = c.getContext('2d', { alpha: false }), info = document.getElementById('info')
const s = await ladeSzene('./ebenen/', { ring: new URLSearchParams(location.search).get('ring') ?? undefined, knoten: new URLSearchParams(location.search).get('knoten') ?? undefined, schrift: new URLSearchParams(location.search).get('schrift') ?? undefined, name: new URLSearchParams(location.search).get('name') ?? undefined, rand: new URLSearchParams(location.search).get('rand') ?? undefined, praegung: new URLSearchParams(location.search).get('praegung') ?? undefined })
let loki = new URLSearchParams(location.search).get('loki') ?? 'hoert', zoom = false, stopp = false
// Prüfhilfe ?wetter=regen|schnee|nebel|frost
const probeWetter = { regen: { code: 63, grad: 8 }, schnee: { code: 73, grad: -2 }, nebel: { code: 45, grad: 3 }, frost: { code: 0, grad: -4 } }[new URLSearchParams(location.search).get('wetter')] ?? { code: 2, grad: 9 }
const frage = new URLSearchParams(location.search)
if (frage.get('kante')) KANTE.art = frage.get('kante')
if (frage.get('spiegel')) SPIEGEL.abstand = Number(frage.get('spiegel'))
const tafeln = erstelleTafeln(document.getElementById('tafeln'), 0, frage.get('gross') ? { skala: Number(frage.get('gross')) } : {})
const beispiel = ausHud({ wetter: { ort: 'Öhringen', grad: 9.4, wolken: 70 }, pv: { akku: 64, akkuW: -1200, netzW: -850, pvW: 4300, hausW: 2250, zustand: 0, inselbetrieb: false, zeit: Date.now() } }, new Date(), sequenzDaten, () => 'BEWÖLKT')
addEventListener('keydown', (e) => {
  loki = { 1: 'hoert', 2: 'denkt', 3: 'spricht', 4: 'aus' }[e.key] ?? loki
  if (e.key === 'z' || e.key === 'Z') { zoom = !zoom; c.width = zoom ? 1920 : B; c.style.width = zoom ? '1920px' : '100vw' }
})
const zeiten = []
let vorher = performance.now(), laengste = 0
function schleife(ms) {
  if (stopp) return
  requestAnimationFrame(schleife)
  const a = performance.now()
  const pegel = loki === 'spricht' ? 0.5 + 0.5 * Math.abs(Math.sin(ms / 130) * Math.sin(ms / 370)) : 0
  // Prüfhilfe ?beat=120: simulierter Bass-Schlag (Schläge pro Minute) für den Reaktor
  const bpm = Number(new URLSearchParams(location.search).get('beat')) || 0, ph = bpm ? ((ms / 1000) % (60 / bpm)) : 9
  const beatTon = bpm ? Array.from({ length: 128 }, (_, i) => ((i % 64) < 6 ? Math.exp(-ph / 0.07) * 0.9 : 0.05)) : null
  zeichneSzene(g, s, ms / 1000, { loki, pegel, wetter: probeWetter, versatz: zoom ? 1920 : 0, ton: beatTon, aus: (new URLSearchParams(location.search).get('aus') ?? '').split(',') })
  // Inhalte mit Beispieldaten (in der Vorschau gibt es keine Gegenstelle); Ton: Kunstwerte
  const ton = Array.from({ length: 128 }, (_, i) => Math.max(0, Math.sin(ms / 300 + i * 0.3) * Math.exp(-((i % 64) / 20)) * 0.8))
  zeichneTafeln(tafeln, { ...beispiel, ton, loki: { zustand: { hoert: 'bereit', denkt: 'denkt', spricht: 'spricht', aus: 'aus' }[loki], mikrofon: loki !== 'aus' } }, ms / 1000)
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
// Prüfhilfe: Blitz erzwingen und ein Bild in einer bestimmten Phase zeichnen (für messen.cjs)
window.blitzProbe = (phase) => {
  stopp = true
  const t = 1000; s.blitze = []; s.naechsterBlitz = t
  zeichneSzene(g, s, t, { loki })
  const b = s.blitze[0], z = phase === 'vorlauf' ? b.vorlauf * 0.6 : b.vorlauf + 0.02
  zeichneSzene(g, s, t + z, { loki })
  const k = document.createElement('canvas'); k.width = 900; k.height = 900
  k.getContext('2d').drawImage(c, 2880 - 450 - (zoom ? 1920 : 0), 494 - 450, 900, 900, 0, 0, 900, 900)
  return k.toDataURL('image/png')
}
// Prüfhilfe: Standbild zu festem Zeitpunkt, Ausschnitt als PNG (für Vorschlags-Bilder)
window.ausschnitt = (t, x, y, b, h) => {
  stopp = true
  zeichneSzene(g, s, t, { loki })
  const k = document.createElement('canvas'); k.width = b; k.height = h
  k.getContext('2d').drawImage(c, x, y, b, h, 0, 0, b, h)
  return k.toDataURL('image/png')
}
