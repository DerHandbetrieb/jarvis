// Dauer-HUD als Web-Wallpaper für Wallpaper Engine (03.11.2026). Holt jede Minute die Anzeige-Daten von Loki
// (Gegenstelle nur auf 127.0.0.1, Zugriffsschlüssel aus zugang.js – von Loki beim Einrichten geschrieben), zeichnet
// Entwurf A „Leitstand ruhig“. Ruhig: höchstens 30 Bilder/s, aufwendige Teile nur bei neuen Daten. Wallpaper Engine
// pausiert das Wallpaper bei Spielen/Vollbild selbst (setPaused). Über drei Bildschirme: ganze Fläche 5760×1080;
// auf einem einzelnen Bildschirm nur der mittlere Teil.
import { B, H, STUMM_KNOPF, schildBild, zeichneHinten, zeichneVorne } from './zeichnen.js'
import { datumText, sequenzDaten, wetterText } from '../startsequenz/lageDaten.js'
import { wetterAusCode } from '../src/jarvis/wetter.ts'

const zugang = window.LOKI_HUD ?? { port: 47820, schluessel: '' }
const c = document.getElementById('flaeche'), g = c.getContext('2d', { alpha: false })
const nurMitte = innerWidth / innerHeight < 2.5
c.width = nurMitte ? B : 3 * B; c.height = H
const hinten = document.createElement('canvas'); hinten.width = 3 * B; hinten.height = H
const schild = schildBild(300)

let zustand = { verbunden: false, d: null, datum: datumText(new Date()), wetter: 'ÖHRINGEN', kam: null, kamBild: false }, kennung = ''
let kamBild = null // letztes Kamerabild (ImageBitmap), nur im Arbeitsspeicher
let loki = null // { zustand, mikrofon } – für den roten Knopf
function hintenNeu() {
  const k = JSON.stringify(zustand)
  if (k === kennung) return
  kennung = k
  zeichneHinten(hinten.getContext('2d'), zustand)
}
let klickNr = 0 // Stand von vor einem Klick auf den roten Knopf nicht mehr übernehmen
async function holen() {
  const nr = klickNr
  try {
    const r = await fetch(`http://127.0.0.1:${zugang.port}/hud`, { headers: { 'x-loki-schluessel': zugang.schluessel }, signal: AbortSignal.timeout(8000) })
    if (!r.ok) throw new Error(String(r.status))
    const daten = await r.json()
    if (nr === klickNr) loki = daten.loki ?? null
    const w = daten.wetter
    zustand = {
      ...zustand,
      kam: daten.kamera ?? null,
      verbunden: true,
      d: sequenzDaten(daten.werkstatt, new Date()),
      datum: datumText(new Date()),
      wetter: wetterText(w?.ort ?? 'Öhringen', w?.grad, w?.code != null ? wetterAusCode(w.code, w.wolken ?? 0) : null),
    }
  } catch {
    zustand = { ...zustand, verbunden: false, d: null, datum: datumText(new Date()), kam: null }
    if (nr === klickNr) loki = null
  }
  hintenNeu()
}

// Kamera: alle 3 Sekunden ein frisches Standbild (Ersatz, solange kein Live-Bild läuft) von Loki (der holt es von der Kamera; nichts wird gespeichert)
let kamLaeuft = false
async function kameraHolen() {
  if (pausiert || kamLaeuft || liveFrisch(0)) return
  kamLaeuft = true
  try {
    const r = await fetch(`http://127.0.0.1:${zugang.port}/kamera`, { headers: { 'x-loki-schluessel': zugang.schluessel }, signal: AbortSignal.timeout(8000) })
    const neu = r.status === 200 ? await createImageBitmap(await r.blob()) : null
    kamBild?.close?.(); kamBild = neu
    // 204 = keine Kamera eingetragen bzw. kein Bild; 200 = Kamera da (auch ohne auf holen() zu warten)
    if (r.status === 200 && !zustand.kam) zustand = { ...zustand, kam: { name: 'Kamera' } }
  } catch { kamBild?.close?.(); kamBild = null } finally { kamLaeuft = false }
  bildDa()
}
/** Kachel-Rahmen „LIVE“ statt „KEIN SIGNAL“, sobald Standbild oder Live-Bild da ist */
function bildDa() {
  const an = !!kamBild || liveFrisch(0) || liveFrisch(1)
  if (zustand.kamBild !== an) { zustand = { ...zustand, kamBild: an }; hintenNeu() }
}

// Live-Bild beider Objektive (Wunsch Auftraggeber 04.11.2026: „nicht nur Standbilder, sondern das echte Bild“).
// Wallpaper Engine kann kein H.264 (gemessen 04.11.2026) – darum spielt Loki die Ströme selbst ab und liefert hier
// fertige JPEG-Bilder (GET /bild/0 und /bild/1, etwa 8 je Sekunde). Bei Pause fragt das Wallpaper nicht mehr; Loki
// schließt die Kamera-Verbindung dann nach 15 s von selbst. Ohne Live-Bild bleibt das Standbild (alle 3 s) als Ersatz.
const live = [null, null] // { bild: ImageBitmap, zeit }
const liveHolt = [false, false]
async function liveHolen(k) {
  if (pausiert || liveHolt[k] || !zustand.kam) return
  liveHolt[k] = true
  try {
    const r = await fetch(`http://127.0.0.1:${zugang.port}/bild/${k}`, { headers: { 'x-loki-schluessel': zugang.schluessel }, signal: AbortSignal.timeout(4000) })
    if (r.status === 200) { const neu = await createImageBitmap(await r.blob()); live[k]?.bild.close?.(); live[k] = { bild: neu, zeit: performance.now() } }
  } catch { /* nächster Versuch gleich wieder */ } finally { liveHolt[k] = false }
}
const liveFrisch = (k) => live[k] && performance.now() - live[k].zeit < 3000
/** Bildquelle je Objektiv: Live-Bild, sonst (nur Objektiv 1) das letzte Standbild */
function kamQuellen() { return liveFrisch(0) || liveFrisch(1) ? [liveFrisch(0) ? live[0].bild : null, liveFrisch(1) ? live[1].bild : null] : [kamBild] }
setInterval(() => { void liveHolen(0); void liveHolen(1) }, 120)
setInterval(() => bildDa(), 2000)

// Roter Knopf (Wunsch Auftraggeber 03.11.2026): Klick = Loki stumm (Mikrofon aus, hört nichts mehr), nochmal = wieder an.
// Wallpaper Engine gibt Klicks auf den freien Desktop an das Wallpaper weiter.
let knopfSperre = 0
c.addEventListener('click', async (ev) => {
  const x = (ev.clientX * c.width) / innerWidth + (nurMitte ? B : 0), y = (ev.clientY * c.height) / innerHeight
  if (Math.hypot(x - STUMM_KNOPF.x, y - STUMM_KNOPF.y) > STUMM_KNOPF.r + 10 || performance.now() < knopfSperre) return
  knopfSperre = performance.now() + 800 // kein Doppelklick-Flackern
  klickNr++
  try {
    const r = await fetch(`http://127.0.0.1:${zugang.port}/stumm`, { method: 'POST', headers: { 'x-loki-schluessel': zugang.schluessel }, signal: AbortSignal.timeout(5000) })
    if (r.ok) loki = await r.json()
  } catch { /* Loki läuft nicht – Knopf zeigt „nicht verbunden“ */ }
  setTimeout(() => void holen(), 1500) // echten Stand nachholen
})

// Ton des PCs (Wallpaper-Engine-Schnittstelle: 128 Werte, links 0–63, rechts 64–127)
let ton = null, letzterTon = 0
if (typeof window.wallpaperRegisterAudioListener === 'function') window.wallpaperRegisterAudioListener((a) => { ton = a; letzterTon = performance.now() })
let pausiert = false
window.wallpaperPropertyListener = { setPaused: (p) => { const war = pausiert; pausiert = !!p; if (war && !pausiert) requestAnimationFrame(schleife) } } // nie zwei Schleifen

let letztes = 0
function schleife(ms) {
  if (pausiert) return
  requestAnimationFrame(schleife)
  if (ms - letztes < 1000 / 30) return // höchstens 30 Bilder/s – es soll ruhig sein
  letztes = ms
  const jetzt = new Date()
  const uhrzeit = jetzt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })
  if (datumText(jetzt) !== zustand.datum) { zustand = { ...zustand, datum: datumText(jetzt) }; hintenNeu() }
  zeichneVorne(g, { hinten, schild, t: ms / 1000, uhrzeit, ton: performance.now() - letzterTon < 2000 ? ton : null, versatz: nurMitte ? B : 0, kamBilder: kamQuellen(), loki })
}

hintenNeu()
void holen().then(kameraHolen)
setInterval(() => void holen(), 5000) // kurz, damit der rote Knopf den echten Stand zeigt (Daten selbst ändern sich selten)
setInterval(() => void kameraHolen(), 3000)
requestAnimationFrame(schleife)
window.dauerHud = { zustand: () => zustand }
