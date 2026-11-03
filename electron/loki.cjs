// Verbindung zu Lokis Stimme (03.11.2026, Entscheidung Auftraggeber: Probe S): startet stimme/loki_stimme.py als
// Hintergrund-Programm und spricht mit ihm nur über Ein- und Ausgabe (je Zeile ein JSON) – kein Netzwerk-Anschluss.
// Ohne Electron-Abhängigkeit, damit die Tests (loki.test.js) es mit einem nachgebauten Programm prüfen können.
// Zustände: aus → laedt → bereit; „fehlt“ = Python-Umgebung, Skript, Vorlage oder Modell nicht da; „fehler“ = abgestürzt,
// hängt oder Laden misslungen. Nach einem Absturz im Betrieb startet die Stimme einmal von selbst neu (Prüf-Agent).
const fs = require('node:fs')
const path = require('node:path')
const readline = require('node:readline')

const LADE_ZEIT_MS = 180_000 // Modell laden + aufwärmen dauert 10–33 s – mehr als 3 Minuten heißt: hängt
const NEUSTART_MS = 3_000
/** längste Wartezeit je Satz: gemessen ca. 18 ms Rechenzeit je Zeichen – reichlich Luft, danach spricht Piper.
 *  Obergrenze 60 s, damit auch ein Satz mit 2.000 Zeichen (lange Antwort ohne Satzzeichen) nicht als Störung gilt */
const satzZeit = (text) => Math.min(60_000, 5_000 + 60 * text.length)

/**
 * @param {{ python: () => string | null, skript: string, starten: (befehl: string, argumente: string[], optionen: object) => any,
 *   toeten?: (p: any) => void, log?: (...a: any[]) => void }} o
 */
function erstelleLoki(o) {
  let prozess = null
  let zustand = 'aus'
  let fehler = ''
  let nr = 0
  let ladeWecker = null
  let neustartWecker = null
  // höchstens ein automatischer Neustart je Einschalten (erst nach erfolgreichem Laden) – sonst bei einem Fehler, der
  // jedes Mal wiederkommt, endlos „laden → Absturz → laden“; erst beenden() (Jarvis aus/ein) gibt wieder einen frei
  let neustartErlaubt = false
  let neustartVerbraucht = false
  const wartend = new Map() // id → { fertig, abbruch, wecker }
  const log = o.log ?? (() => {})
  // Windows: python.exe der Umgebung ist nur ein Starter – darum den ganzen Prozessbaum beenden (siehe jarvis.cjs)
  const toeten = o.toeten ?? ((p) => p.kill())

  function allesAbbrechen(grund) {
    for (const w of wartend.values()) { clearTimeout(w.wecker); w.abbruch(new Error(grund)) }
    wartend.clear()
  }

  /** Störung: Programm beenden, Piper übernimmt; im Betrieb einmal von selbst neu starten */
  function stoerung(grund) {
    zustand = 'fehler'
    fehler = grund
    log('Loki-Stimme:', grund)
    const p = prozess
    prozess = null
    clearTimeout(ladeWecker)
    allesAbbrechen(grund)
    if (p) { try { p.stdin.end() } catch { /* schon zu */ } toeten(p) }
    if (neustartErlaubt && !neustartVerbraucht) {
      neustartErlaubt = false
      neustartVerbraucht = true
      neustartWecker = setTimeout(() => { if (zustand === 'fehler') starten() }, NEUSTART_MS)
    }
  }

  function zeileVerarbeiten(zeile) {
    let d
    try { d = JSON.parse(zeile) } catch { log('Loki-Stimme, unlesbare Antwort:', zeile.slice(0, 200)); return }
    if (d.bereit) { clearTimeout(ladeWecker); zustand = 'bereit'; neustartErlaubt = true; log(`Loki-Stimme bereit nach ${d.sekunden} s`); return }
    if (d.id == null) {
      if (d.fehlt) { clearTimeout(ladeWecker); zustand = 'fehlt'; fehler = String(d.fehlt); beendenStill(); return }
      if (d.fehler) stoerung(String(d.fehler))
      return
    }
    const w = wartend.get(d.id)
    if (!w) return // zu spät (Wartezeit schon abgelaufen)
    wartend.delete(d.id)
    clearTimeout(w.wecker)
    if (d.fehler) return w.abbruch(new Error(String(d.fehler)))
    const b = Buffer.from(String(d.ton ?? ''), 'base64')
    // eigene Kopie, damit die Werte sauber an 4 Byte ausgerichtet sind
    const samples = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength - (b.byteLength % 4)))
    w.fertig({ samples, sampleRate: Number(d.sr) || 24000 })
  }

  /** Hintergrund-Programm starten (nur einmal; kehrt sofort zurück, Laden läuft weiter) */
  function starten() {
    clearTimeout(neustartWecker)
    if (prozess) return
    const py = o.python()
    const vorlage = path.join(path.dirname(o.skript), 'loki-vorlage.wav')
    if (!py || !fs.existsSync(o.skript) || !fs.existsSync(vorlage)) { zustand = 'fehlt'; fehler = 'Lokis Stimme ist auf diesem PC nicht eingerichtet (stimme/einrichten.ps1).'; return }
    zustand = 'laedt'
    fehler = ''
    // HF_HUB_OFFLINE: zur Laufzeit nie etwas aus dem Internet nachladen
    const p = o.starten(py, ['-I', o.skript], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HF_HUB_OFFLINE: '1' } })
    prozess = p
    // nur Zeilen des aktuellen Programms zählen – nach Aus/Ein können noch Reste des alten ankommen (Prüf-Agent)
    readline.createInterface({ input: p.stdout }).on('line', (z) => { if (prozess === p) zeileVerarbeiten(z) })
    let letzte = []
    readline.createInterface({ input: p.stderr }).on('line', (z) => { letzte = [...letzte.slice(-19), z] })
    p.stdin.on('error', () => {}) // Programm schon beendet – das meldet „exit“
    p.on('error', (e) => { if (prozess === p) stoerung(e.message) })
    p.on('exit', (code) => {
      if (prozess !== p) return
      log('Loki-Stimme beendet:', code, letzte.join('\n'))
      stoerung(`Lokis Stimme hat sich beendet (Code ${code}).`)
    })
    ladeWecker = setTimeout(() => { if (prozess === p && zustand === 'laedt') stoerung('Lokis Stimme lädt zu lange.') }, LADE_ZEIT_MS)
  }

  function beendenStill() {
    clearTimeout(ladeWecker)
    const p = prozess
    prozess = null
    allesAbbrechen('Lokis Stimme wurde ausgeschaltet.')
    if (p) { try { p.stdin.end() } catch { /* schon zu */ } toeten(p) }
  }

  /** Hintergrund-Programm beenden (gibt den Grafikspeicher frei) */
  function beenden() {
    clearTimeout(neustartWecker)
    neustartErlaubt = false
    neustartVerbraucht = false
    if (zustand !== 'fehlt') { zustand = 'aus'; fehler = '' }
    beendenStill()
  }

  /** Einen Satz sprechen lassen → { samples, sampleRate }; wirft, wenn Loki nicht bereit ist oder zu lange braucht */
  function sprechen(text) {
    if (zustand !== 'bereit' || !prozess) return Promise.reject(new Error('Lokis Stimme ist nicht bereit.'))
    const t = String(text).slice(0, 2000)
    const id = ++nr
    return new Promise((fertig, abbruch) => {
      // hängt die Stimme, warten sonst alle folgenden Sätze dahinter – darum Störung + Neustart, Piper übernimmt (Prüf-Agent)
      const wecker = setTimeout(() => { wartend.delete(id); abbruch(new Error('Lokis Stimme antwortet nicht.')); stoerung('Lokis Stimme hat nicht rechtzeitig geantwortet.') }, satzZeit(t))
      wartend.set(id, { fertig, abbruch, wecker })
      prozess.stdin.write(JSON.stringify({ id, text: t }) + '\n')
    })
  }

  return { starten, beenden, sprechen, status: () => ({ zustand, fehler }) }
}

module.exports = { erstelleLoki, satzZeit }
