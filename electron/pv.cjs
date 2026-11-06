// PV-Anlage FENECON (FEMS) fürs Dauer-HUD (05.11.2026, Wunsch Auftraggeber, erst nur anzeigen). Offizielle Schnittstelle
// „REST/JSON lesend“ (im Standard-Lieferumfang, docs.fenecon.de/de/fems/fems-app/App_REST-JSON_read_access.html):
// GET http://<FEMS>/rest/channel/_sum/<Kanal>, Anmeldung per HTTP-Basic im Kopf (Benutzername beliebig, nur das Passwort
// zählt), Antwort JSON mit „value“. Nur lesen, nur private IPv4-Adressen, alle 5 s, Zugang verschlüsselt (safeStorage).
const KANAELE = ['EssSoc', 'EssDischargePower', 'EssActivePower', 'GridActivePower', 'ProductionActivePower', 'ConsumptionActivePower', 'State', 'GridMode']
// FEMS ist ein kleiner Rechner: gemessen beim Auftraggeber 05.11.2026 – 7 gleichzeitige Abfragen liefen in Zeitüberschreitung.
// Darum: eine Sammelabfrage (regulärer Ausdruck, laut OpenEMS-Doku erlaubt), sonst nacheinander; großzügige Zeitgrenze.
const { holeTag, heuteBerlin } = require('./pvverlauf.cjs')
const TAG_MS = 5 * 60_000 // Tagesverlauf: die Anlage rechnet in Viertelstunden, alle 5 Minuten reicht
const TAKT_MS = 5000, ZEITGRENZE_MS = 10_000, FEHLER_AB = 3

const privat = (a) => /^(10\.\d{1,3}|192\.168|172\.(1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}$/.test(String(a ?? '')) && String(a).split('.').every((o) => Number(o) <= 255)

/** speicher: { lesen(): Promise<string|null>, schreiben(text): Promise<boolean>, loeschen(): void }; holen: fetch-ähnlich */
function erstellePv({ speicher, holen = fetch, protokoll = console.error, jetzt = () => Date.now(), wsKlasse = globalThis.WebSocket }) {
  // lauf: Nummer des aktuellen Zugangs – Ergebnisse älterer Abfragen (nach Trennen/neu Eintragen) werden verworfen;
  // laeuft: nie zwei Abfragen gleichzeitig (Prüf-Agent 05.11.2026)
  let tag = null, tagUhr = null
  let zugang = null, werte = null, fehler = null, uhr = null, pause = 0, lauf = 0, laeuft = false, fehlschlaege = 0
  async function abfrage(z) {
    const kopf = { Authorization: 'Basic ' + Buffer.from('x:' + z.passwort).toString('base64') }
    const aus = {}
    // Weiterleitungen nicht folgen (nur genau dieses Gerät)
    const anfrage = async (pfad) => {
      const r = await holen(`http://${z.adresse}/rest/channel/_sum/${pfad}`, { headers: kopf, signal: AbortSignal.timeout(ZEITGRENZE_MS), redirect: 'error' })
      if (r.status === 401 || r.status === 403 || r.status === 500) {
        const t = await r.text().catch(() => '')
        if (r.status !== 500 || /Authentication failed/i.test(t)) throw new Error('Anmeldung abgelehnt – Passwort prüfen')
        throw new Error(`FEMS meldet Fehler ${r.status}`)
      }
      if (!r.ok) throw new Error(`FEMS antwortet mit ${r.status}`)
      return r.json()
    }
    let sammel = null
    try { sammel = await anfrage(encodeURIComponent('(' + KANAELE.join('|') + ')')) } catch (f) { if (/Anmeldung/.test(String(f?.message))) throw f }
    if (Array.isArray(sammel) && sammel.length) {
      for (const e of sammel) { const k = String(e?.address ?? '').split('/').pop(); if (KANAELE.includes(k)) aus[k] = typeof e?.value === 'number' ? e.value : null }
    } else {
      for (const k of KANAELE) { const d = await anfrage(k); aus[k] = typeof d?.value === 'number' ? d.value : null } // nacheinander
    }
    return {
      akku: aus.EssSoc, // %
      // + entladen, − laden. EssDischargePower = Leistung auf der Akku-Seite (bei FENECON-Hybridanlagen hängen PV und Akku am
      // selben Wechselrichter – EssActivePower enthält dann auch den Solarstrom und zeigte „entlädt“, obwohl der Akku lud;
      // Rückmeldung Auftraggeber 05.11.2026). Nur wenn die Anlage den Wert nicht kennt: EssActivePower.
      akkuW: aus.EssDischargePower ?? aus.EssActivePower,
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
    try { const w = await abfrage(zugang); if (meiner === lauf) { werte = w; fehler = null; fehlschlaege = 0 } }
    catch (f) {
      if (meiner !== lauf) return
      const m = String(f?.message ?? f), anmeldung = /Anmeldung/.test(m)
      fehlschlaege++
      // einzelne verspätete Antworten nicht melden – erst ab 3 Fehlschlägen hintereinander (bzw. sofort bei falschem Passwort)
      if (anmeldung || fehlschlaege >= FEHLER_AB) fehler = /abort|timeout/i.test(m) ? 'Die Anlage antwortet gerade nicht (Zeitüberschreitung) – L.O.K.I. versucht es weiter.' : m
      pause = jetzt() + (anmeldung ? 60_000 : 10_000); protokoll('PV:', m)
    }
    finally { laeuft = false }
  }
  async function tagHolen() {
    const z = zugang, meiner = lauf
    if (!z) return
    try { const t = await holeTag({ adresse: z.adresse, passwort: z.passwort, Ws: wsKlasse, jetzt }); if (meiner === lauf) tag = t }
    catch (f) { protokoll('PV-Verlauf:', String(f?.message ?? f)) }
  }
  function starten() { clearInterval(uhr); uhr = setInterval(() => void takt(), TAKT_MS); void takt(); clearInterval(tagUhr); tagUhr = setInterval(() => void tagHolen(), TAG_MS); void tagHolen() }
  return {
    async laden() {
      try { const t = await speicher.lesen(); const z = t ? JSON.parse(t) : null; if (z && privat(z.adresse)) { zugang = z; starten() } } catch { zugang = null }
    },
    /** Adresse + Passwort eintragen und sofort testen; gespeichert wird nur bei Erfolg */
    async einrichten({ adresse, passwort }) {
      adresse = String(adresse ?? '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
      if (!privat(adresse)) return { ...this.status(), fehler: 'Bitte eine Adresse aus dem Heimnetz eintragen (z. B. 192.168.0.10).' }
      if (!passwort) return { ...this.status(), fehler: 'Bitte das Passwort eintragen.' }
      try {
        const w = await abfrage({ adresse, passwort })
        if (!(await speicher.schreiben(JSON.stringify({ adresse, passwort })))) return { ...this.status(), fehler: 'Verschlüsselung nicht verfügbar – Zugang nicht gespeichert.' }
        lauf++; tag = null; zugang = { adresse, passwort }; werte = w; fehler = null; fehlschlaege = 0; pause = 0; starten()
        return this.status()
      } catch (f) { const m = String(f?.message ?? f); return { ...this.status(), fehler: m.includes('fetch failed') ? 'FEMS nicht erreichbar – Adresse prüfen.' : /abort|timeout/i.test(m) ? 'Die Anlage antwortet zu langsam – bitte noch einmal versuchen.' : m } }
    },
    entfernen() { lauf++; clearInterval(uhr); uhr = null; clearInterval(tagUhr); tagUhr = null; tag = null; zugang = null; werte = null; fehler = null; try { speicher.loeschen() } catch { /* nichts gespeichert */ } return this.status() },
    status() { return { eingerichtet: !!zugang, adresse: zugang?.adresse ?? null, werte, fehler } },
    /** für das Dauer-HUD: Werte (höchstens 30 s alt) oder null */
    anzeige() { return werte && jetzt() - werte.zeit < 30_000 ? { ...werte, tag: tag?.datum === heuteBerlin(jetzt()) ? tag : null } : null },
    stoppen() { clearInterval(uhr); uhr = null; clearInterval(tagUhr); tagUhr = null },
  }
}

module.exports = { erstellePv, privat, KANAELE }
