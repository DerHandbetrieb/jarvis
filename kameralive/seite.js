// Unsichtbares Kamera-Fenster (04.11.2026): spielt beide Objektive der Reolink Duo PoE live ab (FLV über
// app://jarvis/kamera-strom/<kanal>, mpegts.js, Apache-2.0) und schickt JEDES neue Bild verkleinert als JPEG an Loki.
// Rückmeldung Auftraggeber 04.11.2026 („Framerate wirklich beschissen“): Hauptstrom (25 Bilder/s) statt Unterstrom
// (10 Bilder/s), jedes Bild weiterreichen statt alle 125 ms eins. Hängt ein Strom (8 s kein neues Bild), wird er neu aufgebaut.
import mpegts from 'mpegts.js'

const schluessel = new URLSearchParams(location.search).get('s') ?? ''
const MAX_BREITE = 960 // Kachel je Objektiv ≈ 857×482 Pixel – größer bringt nichts
const ob = [null, null] // { spieler, video, zeit, stand, leinwand, g, laeuft }
const wiederAb = [0, 0] // nach einem Abbruch 5 s warten, bevor neu verbunden wird (Kamera nicht mit Anfragen überhäufen)

function starten(k) {
  const video = document.createElement('video'); video.muted = true; video.playsInline = true
  const spieler = mpegts.createPlayer({ type: 'flv', isLive: true, hasAudio: false, url: `app://jarvis/kamera-strom/${k}?s=${schluessel}` },
    { enableStashBuffer: false, liveBufferLatencyChasing: true, liveBufferLatencyMaxLatency: 1.5, liveBufferLatencyMinRemain: 0.3 })
  spieler.attachMediaElement(video)
  spieler.on(mpegts.Events.ERROR, () => { stoppen(k) })
  const leinwand = document.createElement('canvas')
  ob[k] = { spieler, video, zeit: -1, stand: performance.now(), leinwand, g: leinwand.getContext('2d'), laeuft: false }
  try { spieler.load(); void video.play()?.catch(() => {}) } catch { stoppen(k) }
}
function stoppen(k) {
  const o = ob[k]; ob[k] = null
  if (!o) return
  wiederAb[k] = performance.now() + 5000
  try { o.spieler.pause(); o.spieler.unload(); o.spieler.detachMediaElement(); o.spieler.destroy() } catch { /* schon zu */ }
}

// alle 20 ms nachsehen, ob ein neues Bild dekodiert ist (25 Bilder/s = alle 40 ms) – so geht keins verloren
setInterval(() => {
  for (const k of [0, 1]) {
    const o = ob[k]
    if (!o) { if (performance.now() >= wiederAb[k]) starten(k); continue }
    const v = o.video
    // hängt: 8 s kein neues Bild – auch wenn von Anfang an keins kam (Prüf-Agent)
    if (v.currentTime === o.zeit || v.readyState < 2 || !v.videoWidth) { if (performance.now() - o.stand > 8000) stoppen(k); continue }
    if (o.laeuft) continue
    o.zeit = v.currentTime; o.stand = performance.now()
    o.laeuft = true
    const b = Math.min(MAX_BREITE, v.videoWidth), h = Math.round((b * v.videoHeight) / v.videoWidth)
    if (o.leinwand.width !== b || o.leinwand.height !== h) { o.leinwand.width = b; o.leinwand.height = h }
    o.g.drawImage(v, 0, 0, b, h)
    o.leinwand.toBlob(async (blob) => {
      try { if (blob) window.kameraFenster?.bild(k, new Uint8Array(await blob.arrayBuffer())) } finally { o.laeuft = false }
    }, 'image/jpeg', 0.8)
  }
}, 20)
