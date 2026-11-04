// Unsichtbares Kamera-Fenster (04.11.2026): spielt beide Objektive der Reolink Duo PoE live ab (FLV über
// app://jarvis/kamera-strom/<kanal>, mpegts.js, Apache-2.0) und schickt etwa 8 JPEG-Bilder je Sekunde an Loki.
// Hängt ein Strom (10 s kein neues Bild), wird er neu aufgebaut.
import mpegts from 'mpegts.js'

const schluessel = new URLSearchParams(location.search).get('s') ?? ''
const TAKT_MS = 125
const leinwand = document.createElement('canvas'), g = leinwand.getContext('2d')
const ob = [null, null] // { spieler, video, zeit, stand }
const wiederAb = [0, 0] // nach einem Abbruch 5 s warten, bevor neu verbunden wird (Kamera nicht mit Anfragen überhäufen)

function starten(k) {
  const video = document.createElement('video'); video.muted = true; video.playsInline = true
  const spieler = mpegts.createPlayer({ type: 'flv', isLive: true, hasAudio: false, url: `app://jarvis/kamera-strom/${k}?s=${schluessel}` },
    { enableStashBuffer: false, liveBufferLatencyChasing: true, liveBufferLatencyMaxLatency: 1.5, liveBufferLatencyMinRemain: 0.3 })
  spieler.attachMediaElement(video)
  spieler.on(mpegts.Events.ERROR, () => { stoppen(k) })
  ob[k] = { spieler, video, zeit: -1, stand: performance.now() }
  try { spieler.load(); void video.play()?.catch(() => {}) } catch { stoppen(k) }
}
function stoppen(k) {
  const o = ob[k]; ob[k] = null
  if (!o) return
  wiederAb[k] = performance.now() + 5000
  try { o.spieler.pause(); o.spieler.unload(); o.spieler.detachMediaElement(); o.spieler.destroy() } catch { /* schon zu */ }
}

let laeuft = [false, false]
setInterval(() => {
  for (const k of [0, 1]) {
    const o = ob[k]
    if (!o) { if (performance.now() >= wiederAb[k]) starten(k); continue }
    const v = o.video
    if (v.currentTime !== o.zeit) { o.zeit = v.currentTime; o.stand = performance.now() } else if (performance.now() - o.stand > 10_000) { stoppen(k); continue }
    if (laeuft[k] || v.readyState < 2 || !v.videoWidth) continue
    laeuft[k] = true
    leinwand.width = v.videoWidth; leinwand.height = v.videoHeight
    g.drawImage(v, 0, 0)
    leinwand.toBlob(async (b) => {
      try { if (b) window.kameraFenster?.bild(k, new Uint8Array(await b.arrayBuffer())) } finally { laeuft[k] = false }
    }, 'image/jpeg', 0.8)
  }
}, TAKT_MS)
