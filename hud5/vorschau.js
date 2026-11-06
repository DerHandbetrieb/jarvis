// Vorschau der Szene mit Bildrate (Regel: Bildrate selbst messen, bevor gezeigt wird – CLAUDE.md Etappe 13)
import { B, H, ladeSzene, zeichneSzene } from './szene.js'
import { ausHud } from './inhalte.js'
import { erstelleTafeln, kameraGross, zeichneTafeln, SPIEGEL } from './tafeln.js'
import { erstelleFrost, frostStellen, frostGrad } from './frost.js'
import { beispielTag } from './pv-tag.js'
import { KANTE } from './rahmen.js'
import { sequenzDaten } from '../startsequenz/lageDaten.js'

const c = document.getElementById('flaeche'), g = c.getContext('2d', { alpha: false }), info = document.getElementById('info')
const s = await ladeSzene('./ebenen/', { ring: new URLSearchParams(location.search).get('ring') ?? undefined, knoten: new URLSearchParams(location.search).get('knoten') ?? undefined, schrift: new URLSearchParams(location.search).get('schrift') ?? undefined, name: new URLSearchParams(location.search).get('name') ?? undefined, rand: new URLSearchParams(location.search).get('rand') ?? undefined, praegung: new URLSearchParams(location.search).get('praegung') ?? undefined, loki: new URLSearchParams(location.search).get('loki-stil') ?? undefined })
let loki = new URLSearchParams(location.search).get('loki') ?? 'hoert', zoom = false, stopp = false
// Testlauf Entladung (06.11.2026): ?plasma=a|b|c|d zeigt den mittleren Bildschirm, Impulse alle paar Sekunden, Knöpfe zum Umschalten
const plasmaWahl = new URLSearchParams(location.search).get('plasma')
if (plasmaWahl) {
  s.plasmaArt = plasmaWahl; s.plasmaTempo = plasmaWahl === 'b' ? 5 : 4; zoom = true; c.width = 1920; c.style.width = '100vw'
  document.getElementById('tafeln').style.display = 'none'
  const leiste = document.createElement('div')
  leiste.style.cssText = 'position:fixed;left:50%;bottom:72px;transform:translateX(-50%);display:flex;gap:8px;z-index:9'
  const namen = { a: 'A Plasmakugel', b: 'B Tesla-Spule', c: 'C Schlange', d: 'D Stoß', alt: 'Bisher' }
  for (const [k, n] of Object.entries(namen)) {
    const b = document.createElement('button'); b.textContent = n
    b.style.cssText = 'padding:9px 16px;font:600 15px system-ui;background:#04222bcc;color:#7ff0ff;border:1px solid #5ff6ff88;border-radius:6px;cursor:pointer'
    b.onclick = () => { s.plasmaArt = k === 'alt' ? null : k; s.plasmaNaechst = 0; s.naechsterBlitz = 0; for (const x of leiste.children) x.style.background = '#04222bcc'; b.style.background = '#0d5a6b' }
    if (k === plasmaWahl) b.style.background = '#0d5a6b'
    leiste.appendChild(b)
  }
  document.body.appendChild(leiste)
}
// Prüfhilfe ?wetter=regen|schnee|nebel|frost
const probeWetter = { regen: { code: 63, grad: 8 }, schnee: { code: 73, grad: -2 }, nebel: { code: 45, grad: 3 }, frost: { code: 0, grad: -4 }, gewitter: { code: 95, grad: 16 }, hagel: { code: 99, grad: 12 } }[new URLSearchParams(location.search).get('wetter')] ?? { code: 2, grad: 9 }
const stationProbe = { regen: { grad: 6, regenRate: 3.5, feuchte: 92, wind: 5 }, schnee: { grad: 0.4, regenRate: 1.2, feuchte: 95, wind: 4 }, frost: { grad: -3, regenRate: 0, feuchte: 80, wind: 2 }, trocken: { grad: 9, regenRate: 0, feuchte: 70, wind: 8 } }[new URLSearchParams(location.search).get('station')]
if (stationProbe) Object.assign(probeWetter, { grad: stationProbe.grad, station: stationProbe })
const frage = new URLSearchParams(location.search)
if (frage.get('eis')) probeWetter.eis = Number(frage.get('eis')) // Prüfhilfe ?eis=0.5|1
if (frage.get('kante')) KANTE.art = frage.get('kante')
if (frage.get('spiegel')) SPIEGEL.abstand = Number(frage.get('spiegel'))
const tafeln = erstelleTafeln(document.getElementById('tafeln'), 0, frage.get('gross') ? { skala: Number(frage.get('gross')) } : {})
const beispiel = ausHud({ wetter: { ort: 'Obersontheim', grad: 9.4, wolken: 70 }, pv: { akku: 64, akkuW: -1200, netzW: -850, pvW: 4300, hausW: 2250, zustand: 0, inselbetrieb: false, zeit: Date.now(), tag: { punkte: beispielTag(), summen: null, zeit: 1, beispiel: true } } }, new Date(), sequenzDaten, () => 'BEWÖLKT')
addEventListener('keydown', (e) => {
  loki = { 1: 'hoert', 2: 'denkt', 3: 'spricht', 4: 'aus' }[e.key] ?? loki
  if (e.key === 'z' || e.key === 'Z') { zoom = !zoom; c.width = zoom ? 1920 : B; c.style.width = zoom ? '1920px' : '100vw' }
})
const zeiten = []
let vorher = performance.now(), laengste = 0
function schleife(ms) {
  window.letzteZeit = ms / 1000
  if (stopp) return
  requestAnimationFrame(schleife)
  const a = performance.now()
  const pegel = loki === 'spricht' ? 0.5 + 0.5 * Math.abs(Math.sin(ms / 130) * Math.sin(ms / 370)) : 0
  // Prüfhilfe ?beat=120: simulierter Bass-Schlag (Schläge pro Minute) für den Reaktor
  const bpm = Number(new URLSearchParams(location.search).get('beat')) || 0, ph = bpm ? ((ms / 1000) % (60 / bpm)) : 9
  const beatTon = bpm ? Array.from({ length: 128 }, (_, i) => { const j = i % 64; return j < 5 ? 0.45 + Math.exp(-ph / 0.08) * 0.4 : j < 20 ? 0.3 + 0.25 * Math.max(0, Math.sin(ms / 170)) : 0.2 + 0.3 * Math.exp(-((ph + 0.25) % (60 / bpm)) / 0.05) }) : null // laut wie echte Musik: Grundpegel + Schlag
  zeichneSzene(g, s, ms / 1000, { loki, pegel, wetter: probeWetter, versatz: zoom ? 1920 : 0, ton: beatTon, aus: (new URLSearchParams(location.search).get('aus') ?? '').split(',') })
  // Inhalte mit Beispieldaten (in der Vorschau gibt es keine Gegenstelle); Ton: Kunstwerte
  const ton = Array.from({ length: 128 }, (_, i) => Math.max(0, Math.sin(ms / 300 + i * 0.3) * Math.exp(-((i % 64) / 20)) * 0.8))
  const fv = s.wetter?.sichtbar?.frost ?? 0; if (fv > 0 && !window.frostE) { const d = document.createElement('div'); c.parentElement.appendChild(d); window.frostE = erstelleFrost(d, zoom ? 1920 : 0) } if (window.frostE) { frostStellen(window.frostE, fv); frostGrad(window.frostE, Number(new URLSearchParams(location.search).get('grad') ?? -4)) }
  if (new URLSearchParams(location.search).has('kamgross')) kameraGross(tafeln, 0)
  zeichneTafeln(tafeln, { ...beispiel, ton, loki: { zustand: { hoert: 'bereit', denkt: 'denkt', spricht: 'spricht', aus: 'aus' }[loki], mikrofon: loki !== 'aus', whatsapp: Number(new URLSearchParams(location.search).get('wa') ?? 0) } }, ms / 1000)
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
window.plasmaStand = () => { const l = s.plasmaListe ?? []; return l.length ? performance.now() / 1000 - l[l.length - 1].von - (performance.now() / 1000 - (window.letzteZeit ?? performance.now() / 1000)) : null }
