// Kamera-Anbindung, Etappe 5 (03.11.2026): Standbild der Reolink Duo PoE fürs Dauer-HUD, alle paar Sekunden neu.
// Offizieller Weg laut Reolink (support.reolink.com Artikel 360007011233 „How to Capture Live JPEG Image …“):
//   https://<adresse>/cgi-bin/api.cgi?cmd=Snap&channel=0&rs=<zufall>&user=<benutzer>&password=<passwort>
// Entscheidungen Auftraggeber: nur live, keine Aufnahme durch Loki; nur eigenes Grundstück im Bild.
// Sicherheit: nur HTTPS; die Kamera hat ein selbst ausgestelltes Zertifikat → beim ersten erfolgreichen Abruf wird sein
// Fingerabdruck gemerkt und danach verlangt (fremdes Gerät mit derselben Adresse → Abbruch); nur Adressen aus privaten
// Heimnetzen; Zugangsdaten nur verschlüsselt (safeStorage, Hauptprozess), nie in die Oberfläche oder ins Protokoll;
// Bilder bleiben im Arbeitsspeicher (nichts wird gespeichert).
const http = require('node:http')
const tls = require('node:tls')
const crypto = require('node:crypto')

/** nur private IPv4-Adressen (10.x, 172.16–31.x, 192.168.x) – Loki spricht nie mit Kameras im Internet */
function istHeimnetz(adresse) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(String(adresse ?? '').trim())
  if (!m) return false
  const [a, b] = [Number(m[1]), Number(m[2])]
  if (m.slice(1).some((x) => Number(x) > 255)) return false
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
}

/**
 * Abruf über HTTPS. Erst die verschlüsselte Verbindung aufbauen und den Fingerabdruck des Zertifikats prüfen, DANN die
 * Anfrage (mit Benutzer/Passwort in der Adresse) über genau diese Verbindung schicken – ein fremdes Gerät bekommt so
 * nie die Zugangsdaten. erwartet = gemerkter Fingerabdruck (null nur beim ersten Einrichten).
 * Liefert { status, typ, daten (Buffer), fingerabdruck }.
 */
function holeHttps(url, { erwartet = null, zeitgrenze = 8000 } = {}) {
  const u = new URL(url)
  return new Promise((fertig, fehler) => {
    let sock = null, req = null, erledigt = false
    const ende = (f, w) => { if (erledigt) return; erledigt = true; clearTimeout(uhr); if (f) { req?.destroy(); sock?.destroy(); fehler(f) } else fertig(w) }
    // feste Gesamt-Zeitgrenze (auch wenn ein Gerät nur tröpfchenweise Daten schickt)
    const uhr = setTimeout(() => ende(Object.assign(new Error('Zeitüberschreitung'), { name: 'TimeoutError' })), zeitgrenze)
    sock = tls.connect({ host: u.hostname, port: Number(u.port || 443), rejectUnauthorized: false })
    sock.once('error', (f) => ende(f))
    sock.once('secureConnect', () => {
      const fp = sock.getPeerCertificate()?.fingerprint256 || null
      if (!fp || (erwartet && fp !== erwartet)) { ende(Object.assign(new Error('fremdes Zertifikat'), { fremd: true })); return }
      // http.request über die fertige TLS-Verbindung (https.request würde eine eigene, ungeprüfte aufbauen)
      req = http.request({ host: u.hostname, port: Number(u.port || 443), path: u.pathname + u.search, method: 'GET', createConnection: () => sock }, (res) => {
        const teile = []
        let laenge = 0
        res.on('data', (d) => { laenge += d.length; if (laenge > 8 * 1024 * 1024) { ende(new Error('Bild zu groß')); return } teile.push(d) })
        res.on('end', () => { ende(null, { status: res.statusCode, typ: String(res.headers['content-type'] ?? ''), daten: Buffer.concat(teile), fingerabdruck: fp }); sock.destroy() })
        res.on('error', (f) => ende(f))
      })
      req.on('error', (f) => ende(f))
      req.end()
    })
  })
}

/**
 * speicher: { lesen(): Promise<string|null>, schreiben(text): Promise<boolean>, loeschen() } (verschlüsselt im Hauptprozess)
 * holen: Abruf-Funktion (für Tests ersetzbar)
 */
function erstelleKamera({ speicher, holen = holeHttps, jetzt = () => Date.now(), zwischenzeit = 3000, protokoll = console.error }) {
  let konto = null // { adresse, benutzer, passwort, name, fingerabdruck }
  let zuletzt = { bild: null, zeit: 0 }, laeuft = null
  let zustand = { eingerichtet: false, name: '', adresse: '', fehler: '', stand: null }
  const oeffentlich = () => ({ ...zustand }) // nie Benutzer/Passwort

  const url = (k) => `https://${k.adresse}/cgi-bin/api.cgi?cmd=Snap&channel=0&rs=${crypto.randomBytes(6).toString('hex')}&user=${encodeURIComponent(k.benutzer)}&password=${encodeURIComponent(k.passwort)}`
  function klartext(f, antwort) {
    if (f?.name === 'TimeoutError' || /timeout|Zeitüberschreitung/i.test(String(f?.message))) return 'Die Kamera antwortet nicht (Zeitüberschreitung). Ist Loki im VPN ausgenommen?'
    if (/ECONNREFUSED|EHOSTUNREACH|ENETUNREACH|ECONNRESET/i.test(String(f?.code ?? f?.message))) return 'Die Kamera ist nicht erreichbar (Adresse? NordVPN-Ausnahme für Loki?).'
    if (f?.fremd) return 'Unter dieser Adresse meldet sich ein anderes Gerät als beim Einrichten – Abruf abgebrochen. Bei Bedarf Kamera neu eintragen.'
    if (antwort && /"rspCode"\s*:\s*-?\d+/.test(antwort)) return /login|password|invalid user|"rspCode"\s*:\s*-(6|7|27)\b/i.test(antwort) ? 'Benutzer oder Passwort der Kamera stimmt nicht.' : 'Die Kamera hat den Abruf abgelehnt.'
    protokoll('Kamera:', f?.message ?? f)
    return 'Kamerabild konnte nicht geholt werden (Details im Protokoll).'
  }

  /** erwartet = gemerkter Fingerabdruck; holen prüft ihn, bevor die Zugangsdaten gesendet werden */
  async function abrufen(k, erwartet) {
    const r = await holen(url(k), { erwartet })
    if (!r.fingerabdruck) throw Object.assign(new Error('ohne Zertifikat'), { fremd: true })
    const istJpeg = r.status === 200 && r.daten.length > 3 && r.daten[0] === 0xff && r.daten[1] === 0xd8
    if (!istJpeg) { const text = r.daten.toString('utf8', 0, Math.min(400, r.daten.length)); throw Object.assign(new Error(`kein Bild (${r.status})`), { antwort: text }) }
    return r
  }

  /** Kamera eintragen: erst testen, nur bei Erfolg (Bild da) verschlüsselt speichern; gibt ein Vorschaubild zurück */
  async function einrichten({ adresse, benutzer, passwort, name }) {
    const k = { adresse: String(adresse ?? '').trim(), benutzer: String(benutzer ?? ''), passwort: String(passwort ?? ''), name: String(name ?? 'Kamera').trim().slice(0, 30) || 'Kamera' }
    if (!istHeimnetz(k.adresse)) { zustand = { ...zustand, fehler: 'Bitte die Adresse aus dem Heimnetz eintragen (z. B. 192.168.x.x).' }; return { ...oeffentlich(), vorschau: null } }
    if (!k.benutzer || !k.passwort) { zustand = { ...zustand, fehler: 'Benutzer und Passwort der Kamera fehlen.' }; return { ...oeffentlich(), vorschau: null } }
    try {
      const r = await abrufen(k, null)
      konto = { ...k, fingerabdruck: r.fingerabdruck }
      const gespeichert = await speicher.schreiben(JSON.stringify(konto)).catch(() => false)
      zuletzt = { bild: r.daten, zeit: jetzt() }
      zustand = { eingerichtet: true, name: k.name, adresse: k.adresse, fehler: gespeichert ? '' : 'Verbunden, aber nicht verschlüsselt speicherbar – nach einem Neustart neu eintragen.', stand: jetzt() }
      return { ...oeffentlich(), vorschau: `data:image/jpeg;base64,${r.daten.toString('base64')}` }
    } catch (f) {
      zustand = { ...zustand, fehler: klartext(f, f?.antwort) }
      return { ...oeffentlich(), vorschau: null }
    }
  }

  /** aktuelles Bild (höchstens `zwischenzeit` alt); mehrere gleichzeitige Anfragen teilen sich einen Abruf */
  async function bild() {
    if (!konto) return null
    if (zuletzt.bild && jetzt() - zuletzt.zeit < zwischenzeit) return zuletzt.bild
    if (!laeuft) {
      const k = konto
      const lauf = (async () => {
        try {
          const r = await abrufen(k, k.fingerabdruck)
          if (konto !== k) return null // inzwischen entfernt oder neu eingetragen
          zuletzt = { bild: r.daten, zeit: jetzt() }
          zustand = { ...zustand, fehler: '', stand: zuletzt.zeit }
        } catch (f) {
          if (konto !== k) return null
          zustand = { ...zustand, fehler: klartext(f, f?.antwort) }; zuletzt = { bild: null, zeit: 0 }
        } finally { if (laeuft === lauf) laeuft = null }
        return zuletzt.bild
      })()
      laeuft = lauf
    }
    return laeuft
  }

  async function laden() {
    try {
      const roh = await speicher.lesen()
      if (!roh) return
      const k = JSON.parse(roh)
      if (!istHeimnetz(k?.adresse) || !k?.benutzer || !k?.passwort || !k?.fingerabdruck) throw new Error('unvollständig')
      konto = k
      zustand = { eingerichtet: true, name: k.name ?? 'Kamera', adresse: k.adresse, fehler: '', stand: null }
    } catch { konto = null; try { await speicher.loeschen() } catch { /* egal */ } }
  }
  async function entfernen() {
    konto = null; zuletzt = { bild: null, zeit: 0 }; laeuft = null
    try { await speicher.loeschen() } catch { /* egal */ }
    zustand = { eingerichtet: false, name: '', adresse: '', fehler: '', stand: null }
    return oeffentlich()
  }
  return { status: oeffentlich, einrichten, bild, laden, entfernen }
}

module.exports = { erstelleKamera, istHeimnetz, holeHttps }
