// Vorschau der Intro-Varianten mit Ton und Bildrate (05.11.2026). Bild folgt der Tonuhr (wie die bisherige Start-Sequenz).
import { B, H, ladeSzene, zeichneSzene } from './szene.js'
import { ausHud } from './inhalte.js'
import { erstelleTafeln, zeichneTafeln, tafelnStellen } from './tafeln.js'
import { VARIANTEN, introZustand, zeichneIntroLicht, ZEIT } from './intro.js'
import { TON5, rauchHinten } from './intro5.js'
import { sequenzDaten } from '../startsequenz/lageDaten.js'
import { vorbereiten, starten, jetzt, verzoegerung, GERUESTE } from '../vorschau/start-sequenz/ton/tongerueste.js'

const frage = new URLSearchParams(location.search)
const c = document.getElementById('flaeche'), g = c.getContext('2d', { alpha: false }), info = document.getElementById('info')
const s = await ladeSzene('./ebenen/')
const tafeln = erstelleTafeln(document.getElementById('tafeln'), 0)
const daten = ausHud({ wetter: { ort: 'Obersontheim', grad: 9.4, wolken: 70 }, pv: { akku: 64, akkuW: -1200, netzW: -850, pvW: 4300, hausW: 2250, zustand: 0, inselbetrieb: false, zeit: Date.now() } }, new Date(), sequenzDaten, () => 'BEWÖLKT')
const TON = GERUESTE.at(-1)
let variante = Number(frage.get('v')) || 1, ton = null, tonBereit = false, ohneTon = frage.has('stumm'), t0Bild = performance.now()

async function los(nr) {
  variante = nr
  ton?.stopp(); ton = null; festT = null
  if (tonBereit && !ohneTon) ton = starten(variante === 5 ? TON5 : TON, { lautstaerke: 0.8 })
  t0Bild = performance.now()
}
let festT = null
const zeit = () => festT ?? (ton ? Math.max(0, jetzt() - ton.t0 - verzoegerung()) : (performance.now() - t0Bild) / 1000)

addEventListener('keydown', (e) => {
  if (VARIANTEN[e.key]) los(Number(e.key))
  if (e.key === 'r' || e.key === 'R' || e.key === ' ') los(variante)
})
document.getElementById('start').addEventListener('click', async (e) => {
  e.currentTarget.remove()
  if (!ohneTon) { await vorbereiten(1 + Math.floor(Math.random() * 4)); tonBereit = true }
  los(variante)
})
if (frage.has('auto')) { document.getElementById('start').remove(); info.style.visibility = 'hidden'; if (!ohneTon) { await vorbereiten(1); tonBereit = true } los(variante) }

const zeiten = []
let vorher = performance.now(), laengste = 0
function schleife(ms) {
  requestAnimationFrame(schleife)
  const a = performance.now(), t = zeit(), z = introZustand(variante, t)
  zeichneSzene(g, s, t, { loki: 'hoert', an: z.an, wetter: { code: 2, grad: 9 }, aus: (frage.get('aus') ?? '').split(','), aufbau: z.aufbau, hinten: z.v5 ? (gg) => rauchHinten(gg, s, t) : null })
  zeichneIntroLicht(g, s, t, z)
  tafelnStellen(tafeln, z.tafeln.art, z.tafeln)
  if (z.tafeln.links > 0 || z.tafeln.rechts > 0) zeichneTafeln(tafeln, { ...daten, ton: Array.from({ length: 128 }, (_, i) => Math.max(0, Math.sin(t * 3.3 + i * 0.3) * Math.exp(-((i % 64) / 20)) * 0.8)), loki: { zustand: 'bereit', mikrofon: true } }, t)
  zeiten.push(performance.now() - a); if (zeiten.length > 120) zeiten.shift()
  laengste = Math.max(laengste * 0.995, ms - vorher); vorher = ms
}
setInterval(() => {
  const m = zeiten.reduce((x, y) => x + y, 0) / Math.max(1, zeiten.length)
  info.textContent = `Variante ${variante} · ${VARIANTEN[variante].name} · ${zeit().toFixed(1)} s · Zeichnen ${m.toFixed(1)} ms · längster Abstand ${laengste.toFixed(1)} ms · Tasten 1–4, R`
  window.messung = { mittel: m, laengste }
}, 250)
// Prüfhilfe für Standbilder (intro-bilder.cjs): Zeit festhalten
window.halt = (nr, t) => { variante = nr; ton?.stopp(); ton = null; festT = t; return new Promise((w) => requestAnimationFrame(() => requestAnimationFrame(() => w(true)))) }
requestAnimationFrame(schleife)
void B; void H; void ZEIT
