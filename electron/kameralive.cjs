// Live-Bild der Kamera fürs Dauer-HUD (04.11.2026, Wunsch Auftraggeber: „nicht nur Standbilder, sondern das echte Bild“).
// Gemessen 04.11.2026: Der Browser in Wallpaper Engine (Chrome 146) kann KEIN H.264 abspielen (MediaSource und WebCodecs
// verneinen avc1), die Kamera liefert aber nur H.264. Lokis eigener Browser (Electron, Chrome 152) kann es. Darum spielt
// ein unsichtbares Loki-Fenster die beiden Live-Ströme ab (mpegts.js) und schickt etwa 8 JPEG-Bilder je Sekunde und
// Objektiv hierher; das Wallpaper holt sie über die Gegenstelle (GET /bild/0, /bild/1). Nur im Arbeitsspeicher.
// Das Fenster läuft nur, solange jemand Bilder will: 15 s ohne Nachfrage (Wallpaper pausiert, Spiel, Vollbild) → zu,
// damit auch die Verbindungen zur Kamera enden.
const crypto = require('node:crypto')

const RUHE_MS = 15_000, FRISCH_MS = 2_000

/** erstelleFenster(url) → BrowserWindow-ähnlich ({ webContents, close(), isDestroyed(), on }) – für Tests ersetzbar */
function erstelleKameraLive({ erstelleFenster, adresse, beimStoppen = () => {}, jetzt = () => Date.now(), protokoll = console.error }) {
  let fenster = null, schluessel = null, zuletztGefragt = 0, uhr = null
  const bilder = [null, null] // { daten: Buffer, zeit }

  function stoppen() {
    clearInterval(uhr); uhr = null
    const f = fenster; fenster = null; schluessel = null
    bilder[0] = bilder[1] = null
    try { if (f && !f.isDestroyed()) f.close() } catch { /* schon zu */ }
    beimStoppen() // offene Kamera-Ströme ausdrücklich schließen (nicht nur darauf hoffen, dass Electron sie abbricht)
  }
  function starten() {
    if (fenster) return
    schluessel = crypto.randomBytes(16).toString('hex') // nur dieses Fenster darf die Ströme öffnen
    fenster = erstelleFenster(adresse(schluessel))
    const f = fenster
    f.on('closed', () => { if (fenster === f) { fenster = null; schluessel = null; clearInterval(uhr); uhr = null; beimStoppen() } })
    uhr = setInterval(() => { if (jetzt() - zuletztGefragt > RUHE_MS) stoppen() }, 3000)
  }
  return {
    /** Wallpaper fragt nach einem Bild: startet das Fenster bei Bedarf; null, solange (noch) keins da ist */
    bild(kanal) {
      if (![0, 1].includes(kanal)) return null
      zuletztGefragt = jetzt()
      starten()
      const b = bilder[kanal]
      return b && jetzt() - b.zeit < FRISCH_MS ? b.daten : null
    },
    /** Bild vom Fenster (nur vom eigenen, geprüft über den Absender) */
    empfangen(sender, kanal, daten) {
      if (!fenster || sender !== fenster.webContents || ![0, 1].includes(kanal)) return
      const buf = Buffer.from(daten ?? [])
      if (buf.length < 4 || buf.length > 2 * 1024 * 1024 || buf[0] !== 0xff || buf[1] !== 0xd8) return
      bilder[kanal] = { daten: buf, zeit: jetzt() }
    },
    /** Darf diese Adresse den Live-Strom öffnen? (Schlüssel aus der Adresse des Fensters) */
    erlaubt: (s) => !!schluessel && typeof s === 'string' && s.length === schluessel.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(schluessel)),
    stoppen,
    _laeuft: () => !!fenster,
  }
}

module.exports = { erstelleKameraLive, RUHE_MS }
