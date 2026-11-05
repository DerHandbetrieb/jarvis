// Vorschau der Intro-Varianten (Runde 2, 05.11.2026) mit Ton, Rauch-Simulation und Bildrate. Bild folgt der Tonuhr.
// Tasten 1–4 = Variante (startet neu), R/Leertaste = noch einmal. ?v=1..4, ?auto (ohne Klick), ?stumm (ohne Ton).
import { ladeSzene, zeichneSzene } from './szene.js'
import { ausHud } from './inhalte.js'
import { erstelleTafeln, zeichneTafeln, tafelnStellen } from './tafeln.js'
import { zeichneIntroLicht } from './intro.js'
import { VARIANTEN, introZustand, reaktorTeile, zeichneReaktorTeile, rauchFuehren, tonFuer } from './intro2.js'
import { erstelleRauch } from './rauch-sim.js'
import { sequenzDaten } from '../startsequenz/lageDaten.js'
import { vorbereiten, starten, jetzt, verzoegerung } from '../vorschau/start-sequenz/ton/tongerueste.js'

const frage = new URLSearchParams(location.search)
const c = document.getElementById('flaeche'), g = c.getContext('2d', { alpha: false }), info = document.getElementById('info')
const s = await ladeSzene('./ebenen/')
await reaktorTeile(s)
const rauch = erstelleRauch()
const tafeln = erstelleTafeln(document.getElementById('tafeln'), 0)
const daten = ausHud({ wetter: { ort: 'Obersontheim', grad: 9.4, wolken: 70 }, pv: { akku: 64, akkuW: -1200, netzW: -850, pvW: 4300, hausW: 2250, zustand: 0, inselbetrieb: false, zeit: Date.now() } }, new Date(), sequenzDaten, () => 'BEWÖLKT')
let variante = Number(frage.get('v')) || 1, ton = null, tonBereit = false, festT = null, t0Bild = performance.now()
const ohneTon = frage.has('stumm')

function los(nr) {
  variante = nr; festT = null
  ton?.stopp(); ton = null
  if (tonBereit && !ohneTon) ton = starten(tonFuer(nr), { lautstaerke: 0.8 })
  t0Bild = performance.now()
}
const zeit = () => festT ?? (ton ? Math.max(0, jetzt() - ton.t0 - verzoegerung()) : (performance.now() - t0Bild) / 1000)

addEventListener('keydown', (e) => { if (VARIANTEN[e.key]) los(Number(e.key)); if (e.key === 'r' || e.key === 'R' || e.key === ' ') los(variante) })
document.getElementById('start').addEventListener('click', async (e) => {
  e.currentTarget.remove()
  if (!ohneTon) { await vorbereiten(1 + Math.floor(Math.random() * 4)); tonBereit = true }
  los(variante)
})
if (frage.has('auto')) { document.getElementById('start').remove(); info.style.visibility = 'hidden'; if (!ohneTon) { await vorbereiten(1); tonBereit = true } los(variante) }

const tonWelle = (t) => Array.from({ length: 128 }, (_, i) => Math.max(0, Math.sin(t * 3.3 + i * 0.3) * Math.exp(-((i % 64) / 20)) * 0.8))
const zeiten = []
let vorher = performance.now(), laengste = 0
function bild(t) {
  const z = introZustand(variante, t, s), k = s.geo.reaktor
  rauchFuehren(rauch, variante, t, s)
  const hell = t >= 10.5 ? 1 : 0.4 + 0.6 * z.s
  zeichneSzene(g, s, t, {
    loki: 'hoert', an: z.an, wetter: { code: 2, grad: 9 },
    reaktorZeichnen: z.reaktorTeile ? (gg) => zeichneReaktorTeile(gg, s, z.reaktorTeile, hell) : null,
    hinten: rauch ? (gg) => { const bildR = rauch.zeigen(k.x / 5760, k.y / 1080, z.rauchHell, t); gg.save(); gg.globalCompositeOperation = 'source-over'; gg.drawImage(bildR, 0, 0, 5760, 1080); gg.restore() } : null,
  })
  zeichneIntroLicht(g, s, t, z)
  tafelnStellen(tafeln, z.tafeln.art, z.tafeln)
  if (z.tafeln.links > 0 || z.tafeln.rechts > 0) zeichneTafeln(tafeln, { ...daten, ton: tonWelle(t), loki: { zustand: 'bereit', mikrofon: true } }, t)
}
function schleife(ms) {
  requestAnimationFrame(schleife)
  const a = performance.now(); bild(zeit())
  zeiten.push(performance.now() - a); if (zeiten.length > 120) zeiten.shift()
  laengste = Math.max(laengste * 0.995, ms - vorher); vorher = ms
}
setInterval(() => {
  const m = zeiten.reduce((x, y) => x + y, 0) / Math.max(1, zeiten.length)
  info.textContent = `Variante ${variante} · ${VARIANTEN[variante].name} · ${zeit().toFixed(1)} s · Zeichnen ${m.toFixed(1)} ms · längster Abstand ${laengste.toFixed(1)} ms · Rauch ${rauch ? 'an' : 'AUS (kein WebGL2)'} · Tasten 1–4, R`
  window.messung = { mittel: m, laengste }
}, 250)
// Prüfhilfe für Standbilder (grafik/intro-bilder.cjs): Zeit festhalten
window.halt = (nr, t) => { variante = nr; ton?.stopp(); ton = null; festT = t; return new Promise((w) => requestAnimationFrame(() => requestAnimationFrame(() => w(true)))) }
requestAnimationFrame(schleife)
