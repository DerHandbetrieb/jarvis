// Kamera-Anbindung, Etappe 5 (03.11.2026): Standbild der Reolink Duo PoE fürs Dauer-HUD, alle paar Sekunden neu.
// Weg laut Reolink-HTTP-Schnittstelle (Camera HTTP API User Guide v8): erst POST …/api.cgi?cmd=Login (Benutzer/Passwort im
// Inhalt, nicht in der Adresse) → Token (value.Token.name, leaseTime in s), dann …/api.cgi?cmd=Snap&channel=0&rs=<zufall>&token=<token>.
// (Bis 0.7.1 standen Benutzer/Passwort in der Snap-Adresse – support.reolink.com Artikel 360007011233; die Kamera des
// Auftraggebers lehnte das am 04.11.2026 mit „invalid user“ ab.) Nach einer abgelehnten Anmeldung 60 s Pause, damit die
// Kamera das Konto nicht wegen vieler Fehlversuche sperrt.
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
function holeHttps(url, { erwartet = null, zeitgrenze = 8000, koerper = null } = {}) {
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
      req = http.request({ host: u.hostname, port: Number(u.port || 443), path: u.pathname + u.search, method: koerper == null ? 'GET' : 'POST', createConnection: () => sock,
        headers: koerper == null ? {} : { 'content-type': 'application/json', 'content-length': Buffer.byteLength(koerper) } }, (res) => {
        const teile = []
        let laenge = 0
        res.on('data', (d) => { laenge += d.length; if (laenge > 8 * 1024 * 1024) { ende(new Error('Bild zu groß')); return } teile.push(d) })
        res.on('end', () => { ende(null, { status: res.statusCode, typ: String(res.headers['content-type'] ?? ''), daten: Buffer.concat(teile), fingerabdruck: fp }); sock.destroy() })
        res.on('error', (f) => ende(f))
      })
      req.on('error', (f) => ende(f))
      req.end(koerper ?? undefined)
    })
  })
}

/**
 * Live-Strom öffnen (04.11.2026, Wunsch Auftraggeber: „nicht nur Standbilder, sondern das echte Bild“): wie holeHttps
 * erst Zertifikat prüfen, dann über genau diese Verbindung anfragen; liefert die Antwort, sobald die Kopfzeilen da sind
 * (danach läuft der Strom ohne Zeitgrenze, bis abbrechen() oder die Gegenseite ihn beendet).
 * → { status, typ, strom (lesbar), abbrechen() }
 */
function oeffneStrom(url, { erwartet, zeitgrenze = 8000 } = {}) {
  const u = new URL(url)
  return new Promise((fertig, fehler) => {
    let erledigt = false
    const sock = tls.connect({ host: u.hostname, port: Number(u.port || 443), rejectUnauthorized: false })
    const ende = (f) => { if (erledigt) return; erledigt = true; clearTimeout(uhr); sock.destroy(); fehler(f) }
    const uhr = setTimeout(() => ende(Object.assign(new Error('Zeitüberschreitung'), { name: 'TimeoutError' })), zeitgrenze)
    sock.once('error', (f) => ende(f))
    sock.once('secureConnect', () => {
      const fp = sock.getPeerCertificate()?.fingerprint256 || null
      if (!fp || fp !== erwartet) { ende(Object.assign(new Error('fremdes Zertifikat'), { fremd: true })); return }
      const req = http.request({ host: u.hostname, port: Number(u.port || 443), path: u.pathname + u.search, method: 'GET', createConnection: () => sock }, (res) => {
        if (erledigt) { sock.destroy(); return }
        erledigt = true; clearTimeout(uhr)
        fertig({ status: res.statusCode, typ: String(res.headers['content-type'] ?? ''), strom: res, abbrechen: () => { req.destroy(); sock.destroy() } })
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
function erstelleKamera({ speicher, holen = holeHttps, oeffneStromFn = oeffneStrom, jetzt = () => Date.now(), zwischenzeit = 3000, protokoll = console.error }) {
  let konto = null // { adresse, benutzer, passwort, name, fingerabdruck }
  let zuletzt = { bild: null, zeit: 0 }, laeuft = null
  // Anmeldung je Konto-Objekt (ein alter, noch laufender Abruf kann so nie das Token eines neu eingetragenen Kontos
  // überschreiben – Prüf-Agent 04.11.2026); Pause je Adresse+Benutzer, gilt auch fürs Eintragen (Kontosperre der Kamera)
  const sitzungen = new WeakMap() // konto → { wert, bis, fingerabdruck }
  const pausen = new Map() // 'adresse|benutzer' → Zeitpunkt
  const pausenSchluessel = (k) => `${k.adresse}|${k.benutzer}`
  let zustand = { eingerichtet: false, name: '', adresse: '', fehler: '', stand: null }
  const oeffentlich = () => ({ ...zustand }) // nie Benutzer/Passwort

  const snapUrl = (k, t) => `https://${k.adresse}/cgi-bin/api.cgi?cmd=Snap&channel=0&rs=${crypto.randomBytes(6).toString('hex')}&token=${encodeURIComponent(t)}`
  /** Fehlerantwort der Kamera lesen: { rspCode, detail } oder null */
  function kameraFehler(text) {
    try { const e = JSON.parse(text)?.[0]?.error; return e ? { rspCode: Number(e.rspCode), detail: String(e.detail ?? '').slice(0, 60) } : null } catch { return null }
  }
  function klartext(f) {
    if (f?.name === 'TimeoutError' || /timeout|Zeitüberschreitung/i.test(String(f?.message))) return 'Die Kamera antwortet nicht (Zeitüberschreitung). Ist der Weg zur Kamera frei (VPN, Windows-Route)?'
    if (/ECONNREFUSED|EHOSTUNREACH|ENETUNREACH|ECONNRESET/i.test(String(f?.code ?? f?.message))) return 'Die Kamera ist nicht erreichbar (Adresse richtig? Weg zur Kamera frei?).'
    if (f?.fremd) return 'Unter dieser Adresse meldet sich ein anderes Gerät als beim Einrichten – Abruf abgebrochen. Bei Bedarf Kamera neu eintragen.'
    if (f?.pause) return `Nach einer abgelehnten Anmeldung wartet L.O.K.I. kurz, damit die Kamera das Konto nicht sperrt – bitte in ${f.pause} s noch einmal versuchen.`
    if (f?.unerwartet) return `Unter dieser Adresse antwortet keine Reolink-Kamera wie erwartet (HTTP ${f.unerwartet}).`
    const e = f?.kamera
    if (e) {
      const meldet = e.detail ? ` (Kamera meldet „${e.detail}“, Code ${e.rspCode})` : ` (Code ${e.rspCode})`
      if (/lock/i.test(e.detail)) return `Die Kamera hat die Anmeldung nach Fehlversuchen vorübergehend gesperrt – bitte etwa eine Stunde warten${meldet}.`
      if (f.anmeldung && (e.rspCode === -7 || e.rspCode === -27 || /login failed|password|invalid user/i.test(e.detail))) return `Benutzer oder Passwort der Kamera stimmt nicht${meldet}.`
      if (f.anmeldung) return `Die Kamera hat die Anmeldung abgelehnt${meldet}.`
      return `Die Kamera hat den Abruf abgelehnt${meldet}.`
    }
    protokoll('Kamera:', f?.message ?? f)
    return 'Kamerabild konnte nicht geholt werden (Details im Protokoll).'
  }

  /** Anmelden (POST, Zugangsdaten im Inhalt); erwartet = gemerkter Fingerabdruck, holen prüft ihn VOR dem Senden */
  async function anmelden(k, erwartet) {
    const rest = (pausen.get(pausenSchluessel(k)) ?? 0) - jetzt()
    if (rest > 0) throw Object.assign(new Error('Anmeldepause'), { pause: Math.ceil(rest / 1000) })
    const koerper = JSON.stringify([{ cmd: 'Login', param: { User: { Version: '0', userName: k.benutzer, password: k.passwort } } }])
    const r = await holen(`https://${k.adresse}/cgi-bin/api.cgi?cmd=Login`, { erwartet, koerper })
    if (!r.fingerabdruck) throw Object.assign(new Error('ohne Zertifikat'), { fremd: true })
    const text = r.daten.toString('utf8', 0, Math.min(2000, r.daten.length))
    let wert = null, dauer = 3600
    try { const t = JSON.parse(text)?.[0]?.value?.Token; wert = t?.name ? String(t.name) : null; dauer = Number(t?.leaseTime) || 3600 } catch { /* unten */ }
    if (!wert) {
      const e = kameraFehler(text)
      if (!e) throw Object.assign(new Error(`unerwartete Antwort (${r.status})`), { unerwartet: r.status })
      // echte Ablehnung durch die Kamera → 60 s keine neuen Versuche
      pausen.set(pausenSchluessel(k), jetzt() + 60_000)
      throw Object.assign(new Error('Anmeldung abgelehnt'), { kamera: e, anmeldung: true })
    }
    // eine Minute vor Ablauf neu anmelden
    return { wert, bis: jetzt() + Math.max(60, dauer - 60) * 1000, fingerabdruck: r.fingerabdruck }
  }

  /** Sitzung des Kontos (Token) holen; gleichzeitige Aufrufe teilen sich EINE laufende Anmeldung */
  const anmeldungen = new WeakMap() // konto → laufende Anmeldung
  async function sitzungHolen(k, erwartet) {
    const t = sitzungen.get(k)
    if (t && jetzt() < t.bis) return t
    let lauf = anmeldungen.get(k)
    if (!lauf) {
      lauf = anmelden(k, erwartet).then((neu) => { sitzungen.set(k, neu); return neu }).finally(() => anmeldungen.delete(k))
      anmeldungen.set(k, lauf)
    }
    return lauf
  }

  /** Bild holen: Token des Kontos wiederverwenden (die Kamera erlaubt nur wenige gleichzeitige Anmeldungen),
   *  nur bei -6 („please login first“) verwerfen und einmal neu anmelden */
  async function abrufen(k, erwartet) {
    for (let versuch = 0; versuch < 2; versuch++) {
      const t = await sitzungHolen(k, erwartet)
      const r = await holen(snapUrl(k, t.wert), { erwartet: t.fingerabdruck })
      const istJpeg = r.status === 200 && r.daten.length > 3 && r.daten[0] === 0xff && r.daten[1] === 0xd8
      if (istJpeg) return { ...r, fingerabdruck: t.fingerabdruck }
      const e = kameraFehler(r.daten.toString('utf8', 0, Math.min(400, r.daten.length)))
      if (e?.rspCode === -6) { if (sitzungen.get(k) === t) sitzungen.delete(k); if (versuch === 0) continue }
      throw Object.assign(new Error(`kein Bild (${r.status})`), e ? { kamera: e } : { unerwartet: r.status })
    }
    throw new Error('kein Bild')
  }

  /** Kamera eintragen: erst testen, nur bei Erfolg (Bild da) verschlüsselt speichern; gibt ein Vorschaubild zurück */
  async function einrichten({ adresse, benutzer, passwort, name }) {
    const k = { adresse: String(adresse ?? '').trim(), benutzer: String(benutzer ?? ''), passwort: String(passwort ?? ''), name: String(name ?? 'Kamera').trim().slice(0, 30) || 'Kamera' }
    if (!istHeimnetz(k.adresse)) { zustand = { ...zustand, fehler: 'Bitte die Adresse aus dem Heimnetz eintragen (z. B. 192.168.x.x).' }; return { ...oeffentlich(), vorschau: null } }
    if (!k.benutzer || !k.passwort) { zustand = { ...zustand, fehler: 'Benutzer und Passwort der Kamera fehlen.' }; return { ...oeffentlich(), vorschau: null } }
    try {
      const r = await abrufen(k, null)
      const neu = { ...k, fingerabdruck: r.fingerabdruck }
      sitzungen.set(neu, sitzungen.get(k)) // eigene Anmeldung weiter nutzen
      konto = neu; laeuft = null; liveSchliessen() // Ströme des alten Kontos zu
      const gespeichert = await speicher.schreiben(JSON.stringify(neu)).catch(() => false)
      if (konto !== neu) return { ...oeffentlich(), vorschau: null } // inzwischen entfernt oder neu eingetragen
      zuletzt = { bild: r.daten, zeit: jetzt() }
      zustand = { eingerichtet: true, name: k.name, adresse: k.adresse, fehler: gespeichert ? '' : 'Verbunden, aber nicht verschlüsselt speicherbar – nach einem Neustart neu eintragen.', stand: jetzt() }
      return { ...oeffentlich(), vorschau: `data:image/jpeg;base64,${r.daten.toString('base64')}` }
    } catch (f) {
      zustand = { ...zustand, fehler: klartext(f) }
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
          // während der Pause die eigentliche Meldung (z. B. „Passwort stimmt nicht“) stehen lassen
          if (!f?.pause) zustand = { ...zustand, fehler: klartext(f) }
          zuletzt = { bild: null, zeit: 0 }
        } finally { if (laeuft === lauf) laeuft = null }
        return zuletzt.bild
      })()
      laeuft = lauf
    }
    return laeuft
  }

  /**
   * Live-Strom eines Objektivs (kanal 0/1, Duo PoE: zwei Kanäle laut GetChannelstatus, Test 04.11.2026) als FLV –
   * so zeigt auch die Reolink-Weboberfläche das Live-Bild (support.reolink.com Artikel 360003452893). „main“ = Hauptstrom
   * (2560×1440, 25 Bilder/s) – der „sub“-Strom (640×360, 10 Bilder/s) ruckelte zu sehr (Auftraggeber 04.11.2026). Je Objektiv höchstens ein Strom. → { typ, strom, abbrechen } oder null
   */
  // offene Ströme (zum ausdrücklichen Schließen) und Pause nach Fehlschlägen, die mit jedem weiteren länger wird
  // (Prüf-Agent 04.11.2026: ohne Pause hätte sich Loki bei abgeschaltetem FLV-Anschluss ~24-mal je Minute neu angemeldet)
  // Rückmeldung Auftraggeber 04.11.2026 („wieder nur ein Bild da“): früher höchstens 4 Ströme insgesamt – blieb ein alter
  // Strom hängen (Abbruch kam nicht an), bekam ein Objektiv keinen neuen mehr. Jetzt je Objektiv genau einer: ein neuer
  // Strom schließt den alten desselben Objektivs, so kann sich nichts ansammeln.
  const offen = new Set()
  const jeObjektiv = [null, null]
  const anfrageNr = [0, 0] // nur die jüngste Anfrage je Objektiv bekommt einen Strom (Prüf-Agent: kein Wettlauf)
  // je Objektiv getrennt – ein gestörtes Objektiv bremst das andere nicht (Rückmeldung Auftraggeber 04.11.2026: „das zweite ist weg“)
  const livePauseBis = [0, 0], liveFehler = [0, 0]
  const liveFehlschlag = (k) => { liveFehler[k]++; livePauseBis[k] = jetzt() + Math.min(60_000, 5_000 * 2 ** (liveFehler[k] - 1)) }
  /** ersten Teil einer Fehlerantwort lesen (höchstens 1 s / 2 kB), um „bitte neu anmelden“ (-6) zu erkennen */
  const fehlerText = (strom) => new Promise((fertig) => {
    let text = ''
    const ende = () => { clearTimeout(u); fertig(text) }
    const u = setTimeout(ende, 1000)
    strom.on('data', (d) => { text += d.toString('utf8'); if (text.length > 2000) ende() })
    strom.once('end', ende); strom.once('error', ende)
  })
  async function live(kanal) {
    const k = konto
    if (!k || ![0, 1].includes(kanal) || jetzt() < livePauseBis[kanal]) return null
    jeObjektiv[kanal]?.abbrechen() // alter Strom dieses Objektivs (ggf. hängend) zuerst zu
    const meine = ++anfrageNr[kanal]
    for (let versuch = 0; versuch < 2; versuch++) {
      let t, s
      try {
        t = await sitzungHolen(k, k.fingerabdruck)
        s = await oeffneStromFn(`https://${k.adresse}/flv?port=1935&app=bcs&stream=channel${kanal}_main.bcs&token=${encodeURIComponent(t.wert)}`, { erwartet: t.fingerabdruck })
      } catch (f) { liveFehlschlag(kanal); throw f }
      if (konto !== k || meine !== anfrageNr[kanal]) { s.abbrechen(); return null } // inzwischen entfernt/neu eingetragen oder eine neuere Anfrage läuft
      if (s.status === 200 && /flv/i.test(s.typ)) {
        liveFehler[kanal] = 0
        const fertig = () => { offen.delete(eintrag); if (jeObjektiv[kanal] === eintrag) jeObjektiv[kanal] = null }
        const eintrag = { abbrechen: () => { s.abbrechen(); fertig() } }
        offen.add(eintrag); jeObjektiv[kanal] = eintrag
        s.strom.once('close', fertig); s.strom.once('end', fertig); s.strom.once('error', fertig)
        return { typ: 'video/x-flv', strom: s.strom, abbrechen: eintrag.abbrechen }
      }
      const e = kameraFehler(await fehlerText(s.strom))
      s.abbrechen()
      // nur ein abgelaufenes Token (-6 „please login first“) verwerfen und einmal neu anmelden; sonst Pause
      if (e?.rspCode === -6 && versuch === 0) { if (sitzungen.get(k) === t) sitzungen.delete(k); continue }
      liveFehlschlag(kanal)
      protokoll('Kamera-Live:', `kein Strom (HTTP ${s.status}${e ? `, Code ${e.rspCode}` : ''})`)
      return null
    }
    return null
  }
  /** alle offenen Live-Ströme schließen (Kamera-Fenster zu, Kamera entfernt) */
  function liveSchliessen() { for (const e of [...offen]) e.abbrechen() }

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
    konto = null; zuletzt = { bild: null, zeit: 0 }; laeuft = null; liveSchliessen(); livePauseBis.fill(0); liveFehler.fill(0)
    try { await speicher.loeschen() } catch { /* egal */ }
    zustand = { eingerichtet: false, name: '', adresse: '', fehler: '', stand: null }
    return oeffentlich()
  }
  return { status: oeffentlich, einrichten, bild, live, liveSchliessen, laden, entfernen }
}

module.exports = { erstelleKamera, istHeimnetz, holeHttps, oeffneStrom }
