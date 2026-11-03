// Dauer-HUD als Web-Wallpaper für Wallpaper Engine (03.11.2026). Holt jede Minute die Anzeige-Daten von Loki
// (Gegenstelle nur auf 127.0.0.1, Zugriffsschlüssel aus zugang.js – von Loki beim Einrichten geschrieben), zeichnet
// Entwurf A „Leitstand ruhig“. Ruhig: höchstens 30 Bilder/s, aufwendige Teile nur bei neuen Daten. Wallpaper Engine
// pausiert das Wallpaper bei Spielen/Vollbild selbst (setPaused). Über drei Bildschirme: ganze Fläche 5760×1080;
// auf einem einzelnen Bildschirm nur der mittlere Teil.
import { B, H, schildBild, zeichneHinten, zeichneVorne } from './zeichnen.js'
import { datumText, sequenzDaten, wetterText } from '../startsequenz/lageDaten.js'
import { wetterAusCode } from '../src/jarvis/wetter.ts'

const zugang = window.LOKI_HUD ?? { port: 47820, schluessel: '' }
const c = document.getElementById('flaeche'), g = c.getContext('2d', { alpha: false })
const nurMitte = innerWidth / innerHeight < 2.5
c.width = nurMitte ? B : 3 * B; c.height = H
const hinten = document.createElement('canvas'); hinten.width = 3 * B; hinten.height = H
const schild = schildBild(300)

let zustand = { verbunden: false, d: null, datum: datumText(new Date()), wetter: 'ÖHRINGEN' }, kennung = ''
function hintenNeu() {
  const k = JSON.stringify(zustand)
  if (k === kennung) return
  kennung = k
  zeichneHinten(hinten.getContext('2d'), zustand)
}
async function holen() {
  try {
    const r = await fetch(`http://127.0.0.1:${zugang.port}/hud`, { headers: { 'x-loki-schluessel': zugang.schluessel }, signal: AbortSignal.timeout(8000) })
    if (!r.ok) throw new Error(String(r.status))
    const daten = await r.json()
    const w = daten.wetter
    zustand = {
      verbunden: true,
      d: sequenzDaten(daten.werkstatt, new Date()),
      datum: datumText(new Date()),
      wetter: wetterText(w?.ort ?? 'Öhringen', w?.grad, w?.code != null ? wetterAusCode(w.code, w.wolken ?? 0) : null),
    }
  } catch {
    zustand = { ...zustand, verbunden: false, d: null, datum: datumText(new Date()) }
  }
  hintenNeu()
}

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
  zeichneVorne(g, { hinten, schild, t: ms / 1000, uhrzeit, ton: performance.now() - letzterTon < 2000 ? ton : null, versatz: nurMitte ? B : 0 })
}

hintenNeu()
void holen()
setInterval(() => void holen(), 60_000)
requestAnimationFrame(schleife)
window.dauerHud = { zustand: () => zustand }
