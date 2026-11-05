// PV-Anlage FENECON (FEMS) fürs Dauer-HUD (05.11.2026, Wunsch Auftraggeber, erst nur anzeigen). Offizielle Schnittstelle
// „REST/JSON lesend“ (im Standard-Lieferumfang, docs.fenecon.de/de/fems/fems-app/App_REST-JSON_read_access.html):
// GET http://<FEMS>/rest/channel/_sum/<Kanal>, Anmeldung per HTTP-Basic im Kopf (Benutzername beliebig, nur das Passwort
// zählt), Antwort JSON mit „value“. Nur lesen, nur private IPv4-Adressen, alle 5 s, Zugang verschlüsselt (safeStorage).
const KANAELE = ['EssSoc', 'EssActivePower', 'GridActivePower', 'ProductionActivePower', 'ConsumptionActivePower', 'State', 'GridMode']
const TAKT_MS = 5000, ZEITGRENZE_MS = 4000

const privat = (a) => /^(10\.\d{1,3}|192\.168|172\.(1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}$/.test(String(a ?? '')) && String(a).split('.').every((o) => Number(o) <= 255)

/** speicher: { lesen(): Promise<string|null>, schreiben(text): Promise<boolean>, loeschen(): void }; holen: fetch-ähnlich */
function erstellePv({ speicher, holen = fetch, protokoll = console.error, jetzt = () => Date.now() }) {
  // lauf: Nummer des aktuellen Zugangs – Ergebnisse älterer Abfragen (nach Trennen/neu Eintragen) werden verworfen;
  // laeuft: nie zwei Abfragen gleichzeitig (Prüf-Agent 05.11.2026)
  let zugang = null, werte = null, fehler = null, uhr = null, pause = 0, lauf = 0, laeuft = false
  async function abfrage(z) {
    const kopf = { Authorization: 'Basic ' + Buffer.from('x:' + z.passwort).toString('base64') }
    const aus = {}
    // alle Kanäle gleichzeitig, eine gemeinsame Zeitgrenze; Weiterleitungen nicht folgen (nur genau dieses Gerät)
    const signal = AbortSignal.timeout(ZEITGRENZE_MS)
    await Promise.all(KANAELE.map(async (k) => {
      const r = await holen(`http://${z.adresse}/rest/channel/_sum/${k}`, { headers: kopf, signal, redirect: 'error' })
      if (r.status === 401 || r.status === 403 || r.status === 500) {
        const t = await r.text().catch(() => '')
        if (r.status !== 500 || /Authentication failed/i.test(t)) throw new Error('Anmeldung abgelehnt – Passwort prüfen')
        throw new Error(`FEMS meldet Fehler ${r.status}`)
      }
      if (!r.ok) throw new Error(`FEMS antwortet mit ${r.status}`)
      const d = await r.json()
      aus[k] = typeof d?.value === 'number' ? d.value : null
    }))
    return {
      akku: aus.EssSoc, // %
      akkuW: aus.EssActivePower, // + entladen, − laden (laut FENECON)
      netzW: aus.GridActivePower, // + Bezug, − Einspeisung
      pvW: aus.ProductionActivePower,
      hausW: aus.ConsumptionActivePower,
      zustand: aus.State, // 0 ok, 1 Info, 2 Warnung, 3 Störung
      inselbetrieb: aus.GridMode === 2,
      zeit: jetzt(),
    }
  }
  async function takt() {
    if (!zugang || laeuft || jetzt() < pause) return
    laeuft = true
    const meiner = lauf
    try { const w = await abfrage(zugang); if (meiner === lauf) { werte = w; fehler = null } }
    catch (f) { if (meiner === lauf) { fehler = String(f?.message ?? f); pause = jetzt() + (/Anmeldung/.test(fehler) ? 60_000 : 10_000); protokoll('PV:', fehler) } }
    finally { laeuft = false }
  }
  function starten() { clearInterval(uhr); uhr = setInterval(() => void takt(), TAKT_MS); void takt() }
  return {
    async laden() {
      try { const t = await speicher.lesen(); const z = t ? JSON.parse(t) : null; if (z && privat(z.adresse)) { zugang = z; starten() } } catch { zugang = null }
    },
    /** Adresse + Passwort eintragen und sofort testen; gespeichert wird nur bei Erfolg */
    async einrichten({ adresse, passwort }) {
      adresse = String(adresse ?? '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
      if (!privat(adresse)) return { ...this.status(), fehler: 'Bitte eine Adresse aus dem Heimnetz eintragen (z. B. 192.168.178.38).' }
      if (!passwort) return { ...this.status(), fehler: 'Bitte das Passwort eintragen.' }
      try {
        const w = await abfrage({ adresse, passwort })
        if (!(await speicher.schreiben(JSON.stringify({ adresse, passwort })))) return { ...this.status(), fehler: 'Verschlüsselung nicht verfügbar – Zugang nicht gespeichert.' }
        lauf++; zugang = { adresse, passwort }; werte = w; fehler = null; pause = 0; starten()
        return this.status()
      } catch (f) { return { ...this.status(), fehler: String(f?.message ?? f).includes('fetch failed') ? 'FEMS nicht erreichbar – Adresse prüfen.' : String(f?.message ?? f) } }
    },
    entfernen() { lauf++; clearInterval(uhr); uhr = null; zugang = null; werte = null; fehler = null; try { speicher.loeschen() } catch { /* nichts gespeichert */ } return this.status() },
    status() { return { eingerichtet: !!zugang, adresse: zugang?.adresse ?? null, werte, fehler } },
    /** für das Dauer-HUD: Werte (höchstens 30 s alt) oder null */
    anzeige() { return werte && jetzt() - werte.zeit < 30_000 ? werte : null },
    stoppen() { clearInterval(uhr); uhr = null },
  }
}

module.exports = { erstellePv, privat, KANAELE }
