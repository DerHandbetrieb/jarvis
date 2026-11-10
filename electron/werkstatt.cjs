// Werkstatt-Anbindung, Etappe L1/L2 (03.11.2026, Entscheidungen Auftraggeber in CLAUDE.md Abschnitt 6): Loki meldet sich
// mit seinem eigenen Konto (loki@…, ohne Tabellenzugriff) und Zwei-Faktor an und holt nur die fertige Lage aus der
// lesenden Serverfunktion „jarvis-lage“ der Werkstatt-Datenbank (Supabase). Alles läuft im Hauptprozess – die Oberfläche
// bekommt nur Zustand und fertige Zahlen, nie Tokens. Die Sitzung wird mit Electron safeStorage (Windows-DPAPI,
// asynchrone Funktionen) verschlüsselt gespeichert; das Passwort wird nie gespeichert.
// Schnittstelle laut offizieller Beschreibung von Supabase Auth (github.com/supabase/auth, openapi.yaml):
// POST /token?grant_type=password|refresh_token, GET /user (factors), POST /factors (Einrichtung, totp.qr_code),
// DELETE /factors/{id}, POST /factors/{id}/challenge, POST /factors/{id}/verify (neue Sitzung mit aal2), POST /logout.
// Nach Prüf-Agent: jede Anfrage mit Zeitgrenze; „Trennen“ gewinnt immer gegen laufende Abrufe (Durchgangsnummer);
// Erneuerungs-Token nie doppelt gleichzeitig (gilt nur einmal); bei 401 einmal erneuern, dann erst trennen.

const ZEITGRENZE = 15_000
const ZWISCHEN_GILT = 10 * 60_000 // so lange darf man sich mit dem QR-/Code-Schritt Zeit lassen

/** Zustände: aus (nicht verbunden), einrichten (QR-Code scannen), code (Code eingeben), verbunden, fehler */
function erstelleWerkstatt({ konfig, speicher, holen = fetch, jetzt = () => Date.now(), takt = 5 * 60_000, aktiv = () => true, pruefTakt = 60_000, protokoll = console.error, zeitgrenze = ZEITGRENZE }) {
  let sitzung = null // { access_token, refresh_token, expires_at (ms), user_id }
  let zwischen = null // nach dem Passwort, vor dem Code: { access_token, faktorId, bis }
  let zustand = { zustand: 'aus', fehler: '', qr: '', schluessel: '', stand: null }
  let lage = null, erneuern = null, abruf = null, timer = null, beschaeftigt = false
  let durchgang = 0 // steigt bei Verbinden/Trennen – ältere, noch laufende Vorgänge verwerfen dann ihr Ergebnis
  const zuhoerer = new Set()
  const lageHoerer = new Set() // bekommen jede frisch geholte Lage (Neuigkeiten, 04.11.2026)
  const setze = (z) => { zustand = { ...zustand, ...z }; zuhoerer.forEach((f) => f(oeffentlich())) }
  const oeffentlich = () => ({ ...zustand, verfuegbar: !!(konfig?.url && konfig?.schluessel) })

  async function anfrage(url, { methode = 'POST', token, body } = {}) {
    const r = await holen(url, {
      method: methode,
      headers: { apikey: konfig.schluessel, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(zeitgrenze),
    })
    const text = await r.text()
    let d = null
    try { d = text ? JSON.parse(text) : null } catch { d = null }
    if (!r.ok) {
      const f = new Error(String(d?.fehler ?? d?.msg ?? d?.message ?? d?.error_description ?? d?.error ?? `Fehler ${r.status}`)); f.status = r.status; throw f
    }
    return d
  }
  const auth = (pfad, opt) => anfrage(`${konfig.url}/auth/v1${pfad}`, opt)
  const ausAntwort = (d) => {
    if (!d?.access_token || !d?.refresh_token) throw new Error('Antwort ohne Sitzung')
    return { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: jetzt() + Number(d.expires_in ?? 3600) * 1000, user_id: d.user?.id ?? null }
  }
  /** verständliche Meldung statt Fachsprache; Unbekanntes nur ins Protokoll, nicht in die Oberfläche */
  function klartext(f, beimCode = false) {
    const m = String(f?.message ?? f)
    if (/invalid login credentials/i.test(m)) return 'E-Mail oder Passwort stimmt nicht.'
    if (beimCode && (f?.status === 400 || f?.status === 422 || /code/i.test(m))) return 'Der Code stimmt nicht oder ist abgelaufen – bitte den aktuellen Code aus der App eingeben.'
    if (f?.name === 'TimeoutError' || f?.name === 'AbortError') return 'Die Werkstatt-Datenbank antwortet nicht (Zeitüberschreitung).'
    if (/fetch failed|network|ENOTFOUND|ECONN|socket|other side closed/i.test(m)) return 'Keine Verbindung zur Werkstatt-Datenbank (Internet?).'
    if (f?.status === 401 || f?.status === 403) return 'Die Anmeldung ist abgelaufen oder nicht freigegeben – bitte neu verbinden.'
    if (f?.status === 429) return 'Zu viele Versuche – bitte kurz warten.'
    protokoll('Werkstatt-Verbindung:', m)
    return 'Unerwarteter Fehler bei der Werkstatt-Verbindung (Details im Protokoll).'
  }
  // Speichern läuft immer hintereinander; wurde währenddessen getrennt (durchgang geändert), wird gleich wieder gelöscht –
  // sonst wäre Loki nach einem Neustart wieder verbunden, obwohl getrennt wurde (Prüf-Agent)
  let schreibkette = Promise.resolve()
  const SPEICHER_FEHLER = 'Die Anmeldung konnte nicht verschlüsselt gespeichert werden – nach einem Neustart bitte neu verbinden.'
  function speichern(meiner) {
    const text = JSON.stringify(sitzung)
    schreibkette = schreibkette.then(async () => {
      let ok = false
      try { ok = !!(await speicher.schreiben(text)) } catch (f) { protokoll('Werkstatt-Sitzung speichern:', f?.message) }
      if (meiner !== durchgang) { try { await speicher.loeschen() } catch { /* egal */ } return }
      if (ok && zustand.fehler === SPEICHER_FEHLER) setze({ fehler: '' })
      if (!ok) setze({ fehler: SPEICHER_FEHLER })
    })
    return schreibkette
  }

  /** Schritt 1: E-Mail + Passwort → Zwei-Faktor einrichten (QR) oder Code verlangen */
  async function verbinden(email, passwort) {
    if (!konfig?.url) return setze({ zustand: 'fehler', fehler: 'Zugangsdaten der Werkstatt fehlen in diesem Programm (.env.werkstatt).' })
    if (beschaeftigt || zustand.zustand === 'verbunden') return // erst trennen; nie zwei Anmeldungen gleichzeitig
    beschaeftigt = true
    const meiner = ++durchgang
    try {
      const d = await auth('/token?grant_type=password', { body: { email: String(email).trim(), password: String(passwort) } })
      const nutzer = await auth('/user', { methode: 'GET', token: d.access_token })
      const totp = (nutzer?.factors ?? []).filter((f) => f.factor_type === 'totp')
      const fertig = totp.find((f) => f.status === 'verified')
      if (meiner !== durchgang) return
      if (fertig) {
        zwischen = { access_token: d.access_token, faktorId: fertig.id, bis: jetzt() + ZWISCHEN_GILT }
        return setze({ zustand: 'code', fehler: '', qr: '', schluessel: '' })
      }
      // halb eingerichtete Geräte aus früheren Versuchen aufräumen (sonst sammeln sie sich an), dann neu einrichten
      for (const f of totp.filter((x) => x.status !== 'verified')) { try { await auth(`/factors/${f.id}`, { methode: 'DELETE', token: d.access_token }) } catch { /* egal */ } }
      const neu = await auth('/factors', { token: d.access_token, body: { factor_type: 'totp', friendly_name: `Loki ${new Date(jetzt()).toISOString().slice(0, 19)}`, issuer: 'Loki' } })
      if (meiner !== durchgang) return
      zwischen = { access_token: d.access_token, faktorId: neu.id, bis: jetzt() + ZWISCHEN_GILT }
      setze({ zustand: 'einrichten', fehler: '', qr: qrAlsBild(neu?.totp?.qr_code), schluessel: String(neu?.totp?.secret ?? '') })
    } catch (f) { if (meiner === durchgang) { zwischen = null; setze({ zustand: 'fehler', fehler: klartext(f), qr: '', schluessel: '' }) } } finally { beschaeftigt = false }
  }

  /** Schritt 2: 6-stelliger Code → Sitzung mit Zwei-Faktor (aal2), verschlüsselt speichern, Lage holen */
  async function code(c) {
    if (beschaeftigt) return
    if (!zwischen || zwischen.bis < jetzt()) { zwischen = null; return setze({ zustand: 'fehler', fehler: 'Bitte zuerst (wieder) E-Mail und Passwort eingeben.', qr: '', schluessel: '' }) }
    const ziffern = String(c).replace(/\D/g, '')
    if (ziffern.length !== 6) return setze({ fehler: 'Der Code hat 6 Ziffern.' })
    beschaeftigt = true
    const meiner = durchgang, z = zwischen
    try {
      const ch = await auth(`/factors/${z.faktorId}/challenge`, { token: z.access_token, body: {} })
      const d = await auth(`/factors/${z.faktorId}/verify`, { token: z.access_token, body: { challenge_id: ch.id, code: ziffern } })
      if (meiner !== durchgang) return // inzwischen abgebrochen → nicht verbinden
      sitzung = ausAntwort(d); zwischen = null
      setze({ zustand: 'verbunden', fehler: '', qr: '', schluessel: '' })
      await speichern(meiner)
      if (meiner === durchgang) starten()
    } catch (f) { if (meiner === durchgang) setze({ fehler: klartext(f, true) }) } finally { beschaeftigt = false }
  }

  /** Sitzung verwerfen (Speicher löschen) und melden – z. B. wenn der Server sie nicht mehr annimmt */
  async function verwerfen(meldung) {
    durchgang++; stoppen(); sitzung = null; lage = null
    try { await speicher.loeschen() } catch { /* egal */ }
    setze({ zustand: 'fehler', fehler: meldung, stand: null, qr: '', schluessel: '' })
  }

  /** gültiges Zugangs-Token; erneuert rechtzeitig (oder erzwungen), nie doppelt gleichzeitig */
  async function token(erzwingen = false) {
    if (!sitzung) throw Object.assign(new Error('nicht verbunden'), { status: 401 })
    if (!erzwingen && sitzung.expires_at - jetzt() > 60_000) return sitzung.access_token
    if (!erneuern) {
      const meiner = durchgang, alt = sitzung
      erneuern = (async () => {
        try {
          let d
          // nur ein abgelehntes Erneuern (4xx) bedeutet „Sitzung ungültig“ – merken für holeLage
          try { d = await auth('/token?grant_type=refresh_token', { body: { refresh_token: alt.refresh_token } }) } catch (f) { if (f?.status >= 400 && f?.status < 500) f.erneuernAbgelehnt = true; throw f }
          if (meiner !== durchgang) throw Object.assign(new Error('getrennt'), { getrennt: true })
          sitzung = ausAntwort(d)
          await speichern(meiner)
        } finally { erneuern = null }
      })()
    }
    await erneuern
    if (!sitzung) throw Object.assign(new Error('getrennt'), { getrennt: true })
    return sitzung.access_token
  }

  async function lageAbrufen(meiner) {
    let versuch = 0
    for (;;) {
      try {
        return await anfrage(`${konfig.url}/functions/v1/jarvis-lage`, { token: await token(versuch > 0), body: {} })
      } catch (f) {
        // 401 einmal mit erneuertem Token wiederholen (Uhr ungenau, Token gerade abgelaufen)
        if (f?.status === 401 && versuch === 0 && meiner === durchgang) { versuch++; continue }
        throw f
      }
    }
  }

  /** Lage aus der Serverfunktion holen; läuft schon ein Abruf, wird dieser mitbenutzt */
  function holeLage() {
    if (!sitzung) return Promise.resolve(lage)
    if (abruf) return abruf
    const meiner = durchgang
    abruf = (async () => {
      try {
        const d = await lageAbrufen(meiner)
        if (meiner !== durchgang) return lage
        // nur eine vollständige Antwort übernehmen (andere/kaputte Fassung der Serverfunktion → alte Lage behalten)
        if (!d || typeof d.aufgaben !== 'object' || typeof d.verkauf?.gestern !== 'object' || !Array.isArray(d.lagerKnapp) || typeof d.freigaben !== 'number') throw new Error('Antwort der Serverfunktion unvollständig')
        lage = { ...d, geholt: jetzt() }
        for (const f of lageHoerer) { try { f(lage) } catch (x) { protokoll('Werkstatt-Lage weitergeben:', x?.message) } }
        setze({ zustand: 'verbunden', fehler: zustand.fehler === SPEICHER_FEHLER ? zustand.fehler : '', stand: lage.geholt })
      } catch (f) {
        if (f?.getrennt || meiner !== durchgang) return lage
        // Server nimmt die Sitzung nicht mehr an (Erneuern abgelehnt, 401 auch nach Erneuern, 403 = kein Loki-Konto) → trennen;
        // andere Fehler (Netz, 5xx, 400 der Funktion selbst) → alte Lage behalten
        if (f?.erneuernAbgelehnt || f?.status === 401 || f?.status === 403) await verwerfen(klartext({ status: 401 }))
        else setze({ fehler: klartext(f) })
      } finally { abruf = null }
      return lage
    })()
    return abruf
  }
  // Abruf höchstens alle `takt` und nur, solange der PC benutzt wird (aktiv); jede Minute nachsehen, damit nach der Rückkehr
  // schnell frische Daten da sind (10.11.2026: Supabase-Kontingent knapp, jarvis-lage antwortet ohnehin 10 Minuten gleich)
  const faellig = () => aktiv() && (!lage || jetzt() - lage.geholt >= takt - 5000)
  function starten() { stoppen(); void holeLage(); timer = setInterval(() => { if (faellig()) void holeLage() }, Math.min(takt, pruefTakt)) }
  function stoppen() { if (timer) clearInterval(timer); timer = null }

  /** beim Programmstart: gespeicherte Sitzung laden (bleibt verbunden); defekte Datei wird gelöscht */
  async function laden() {
    let roh = null
    try { roh = await speicher.lesen() } catch (f) { protokoll('Werkstatt-Sitzung lesen:', f?.message) }
    if (!roh) return
    try {
      const s = JSON.parse(roh)
      if (typeof s?.access_token !== 'string' || typeof s?.refresh_token !== 'string' || !Number.isFinite(s?.expires_at)) throw new Error('unvollständig')
      sitzung = s
      setze({ zustand: 'verbunden', fehler: '' })
      starten()
    } catch { sitzung = null; try { await speicher.loeschen() } catch { /* egal */ } }
  }
  async function trennen() {
    durchgang++; stoppen()
    const alt = sitzung; sitzung = null; zwischen = null; lage = null; abruf = null // ein alter Abruf verwirft sein Ergebnis selbst
    try { await speicher.loeschen() } catch { /* egal */ }
    setze({ zustand: 'aus', fehler: '', qr: '', schluessel: '', stand: null })
    if (alt) { try { await auth('/logout?scope=local', { token: alt.access_token }) } catch { /* schon ungültig – egal */ } }
  }
  /** Lage für Anzeige/Morgen-Lage: aus dem Zwischenspeicher, wenn jünger als `hoechstensAlt` ms, sonst frisch */
  async function aktuelleLage(hoechstensAlt = 120_000) {
    return lage && jetzt() - lage.geholt < hoechstensAlt ? lage : holeLage()
  }
  return {
    status: oeffentlich, verbinden, code, trennen, laden, holeLage, aktuelleLage, lage: () => lage,
    beiAenderung: (f) => { zuhoerer.add(f); return () => zuhoerer.delete(f) },
    /** jede frisch geholte, vollständige Lage (nicht die zwischengespeicherte) */
    beiLage: (f) => { lageHoerer.add(f); return () => lageHoerer.delete(f) },
  }
}

/**
 * QR-Code von Supabase als sicher darstellbares Bild: Supabase liefert „data:image/svg+xml;utf-8,<svg …>“ mit
 * unkodiertem SVG-Text – das zeigt Chromium nicht an (kaputtes Bild, Rückmeldung Auftraggeber 03.11.2026). Darum den
 * SVG-Text herauslösen (auch falls er URL-kodiert oder Base64 ist) und als Base64-Bild neu verpacken.
 */
function qrAlsBild(qr) {
  const roh = String(qr ?? '')
  if (!roh.startsWith('data:image/svg+xml')) return ''
  const komma = roh.indexOf(',')
  if (komma < 0) return ''
  const kopf = roh.slice(0, komma), inhalt = roh.slice(komma + 1)
  let svg = inhalt
  if (/;base64/i.test(kopf)) svg = Buffer.from(inhalt, 'base64').toString('utf8')
  else if (!inhalt.trimStart().startsWith('<')) { try { svg = decodeURIComponent(inhalt) } catch { svg = inhalt } }
  if (!/<svg[\s>/]/i.test(svg)) return ''
  return 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64')
}

/** Zugang aus der Datei .env.werkstatt lesen (WERKSTATT_URL nur https, WERKSTATT_SCHLUESSEL = der öffentliche Schlüssel) */
function leseKonfig(text) {
  const w = Object.fromEntries(String(text ?? '').split(/\r?\n/).filter((z) => z.includes('=')).map((z) => [z.slice(0, z.indexOf('=')).trim(), z.slice(z.indexOf('=') + 1).trim()]))
  return w.WERKSTATT_URL?.startsWith('https://') && w.WERKSTATT_SCHLUESSEL ? { url: w.WERKSTATT_URL.replace(/\/+$/, ''), schluessel: w.WERKSTATT_SCHLUESSEL } : null
}

module.exports = { erstelleWerkstatt, leseKonfig, qrAlsBild }
