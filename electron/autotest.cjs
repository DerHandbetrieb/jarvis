// Testbilder für die Auto-Erkennung (07.11.2026, Freigabe Auftraggeber: Machbarkeitstest „Kennzeichen und Farbe lesbar?“,
// ausdrücklich als Ausnahme von „nur live, keine Aufnahme“). Meldet die Kamera-Wache ein Auto am linken Objektiv, legt
// L.O.K.I. drei Standbilder im Abstand von gut 3 Sekunden ab (das Auto bewegt sich, auf einem ist das Kennzeichen am
// ehesten lesbar). Nur lokal in %APPDATA%\Jarvis\auto-test, nichts verlässt den PC.
// Grenzen: läuft nur bis zum Enddatum (TAGE nach dem ersten Bild), höchstens MAX_BILDER Bilder; danach nimmt es nichts mehr
// auf. Nach der Auswertung werden die Bilder gelöscht (Plan). Ohne Electron-Abhängigkeit (autotest.test.js).
const path = require('node:path')

const TAGE = 7, MAX_BILDER = 400, ABSTAND_MS = 3200, JE_EREIGNIS = 3

/** Dateiname aus der Zeit (deutsche Ortszeit des PCs), z. B. 2026-11-07_14-03-22_2.jpg */
function dateiname(zeit, nr) {
  const d = new Date(zeit), z = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}_${z(d.getHours())}-${z(d.getMinutes())}-${z(d.getSeconds())}_${nr}.jpg`
}

/**
 * @param {{ ordner: string, bild: () => Promise<Buffer | null>, fs?: typeof import('node:fs'), jetzt?: () => number,
 *   warte?: (ms: number) => Promise<void>, protokoll?: (...a: any[]) => void }} o
 */
function erstelleAutotest({ ordner, bild, fs = require('node:fs'), jetzt = () => Date.now(), warte = (ms) => new Promise((r) => setTimeout(r, ms)), protokoll = () => {} }) {
  const standDatei = path.join(ordner, 'stand.json')
  let laeuft = false

  function stand() {
    try { return JSON.parse(fs.readFileSync(standDatei, 'utf8')) } catch { return null }
  }
  function anzahl() {
    try { return fs.readdirSync(ordner).filter((d) => d.endsWith('.jpg')).length } catch { return 0 }
  }
  /** darf jetzt noch aufgenommen werden? (Enddatum, Höchstzahl) */
  function erlaubt() {
    const s = stand()
    if (s && jetzt() > s.bis) return false
    return anzahl() < MAX_BILDER
  }

  /** bei einer Auto-Meldung: drei Bilder ablegen (läuft schon eine Serie, wird nichts doppelt aufgenommen) */
  async function autoGemeldet(zeit = jetzt()) {
    if (laeuft || !erlaubt()) return 0
    laeuft = true
    let gespeichert = 0
    try {
      fs.mkdirSync(ordner, { recursive: true })
      if (!stand()) fs.writeFileSync(standDatei, JSON.stringify({ von: zeit, bis: zeit + TAGE * 86_400_000 }))
      for (let nr = 1; nr <= JE_EREIGNIS; nr++) {
        if (nr > 1) await warte(ABSTAND_MS)
        if (anzahl() >= MAX_BILDER) break
        const daten = await bild().catch(() => null)
        if (!daten) continue
        fs.writeFileSync(path.join(ordner, dateiname(zeit, nr)), daten)
        gespeichert++
      }
      protokoll(`Auto-Test: ${gespeichert} Bild(er) abgelegt`)
    } catch (f) {
      protokoll('Auto-Test: Fehler beim Ablegen', f?.message ?? f)
    } finally { laeuft = false }
    return gespeichert
  }

  return { autoGemeldet, erlaubt, anzahl }
}

module.exports = { erstelleAutotest, dateiname, TAGE, MAX_BILDER, ABSTAND_MS }
