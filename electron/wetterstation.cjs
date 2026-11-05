// Wetterstation Ecowitt GW2000A (05.11.2026, Wunsch Auftraggeber): steht im Netz des Nachbarn, darum über die Ecowitt-
// Cloud (API v3, GET https://api.ecowitt.net/api/v3/device/real_time) mit Application Key, API Key und MAC der Station.
// Quellen: Meteoclimatic-Wiki „Cloud Ecowitt.net“, TapHome-Anleitung (offizielle Doku doc.ecowitt.net nicht direkt lesbar –
// Antwortformat beim Bauen an der echten Antwort geprüft). Nur lesen, einmal je Minute (die Station lädt etwa minütlich hoch),
// Zugang verschlüsselt (safeStorage), Werte nur im Arbeitsspeicher. Einheiten fest: °C, hPa, km/h, mm.
const TAKT_MS = 60_000, ZEITGRENZE_MS = 15_000, FEHLER_AB = 3
const API = 'https://api.ecowitt.net/api/v3/device/real_time'

const zahl = (o) => { const v = Number(o?.value); return o && o.value !== '' && Number.isFinite(v) ? v : null }
const macOk = (m) => /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(m)
/** MAC in die Form AA:BB:CC:DD:EE:FF bringen (Eingabe auch mit - oder ohne Trenner) */
function macNorm(m) {
  const h = String(m ?? '').toUpperCase().replace(/[^0-9A-F]/g, '')
  return h.length === 12 ? h.match(/../g).join(':') : ''
}

/** Antwort der Cloud in Anzeige-Werte umrechnen (wirft bei Fehlermeldung der Cloud) */
function auswerten(j, jetzt) {
  if (!j || j.code !== 0) {
    const m = String(j?.msg ?? 'unbekannte Antwort')
    throw new Error(/key|auth|sign|permission/i.test(m) ? `Ecowitt lehnt den Zugang ab (${m}) – Schlüssel und MAC prüfen` : `Ecowitt meldet: ${m}`)
  }
  const d = j.data ?? {}
  if (!Object.keys(d).length) throw new Error('Ecowitt liefert keine Werte – stimmt die MAC-Adresse der Station?')
  const o = d.outdoor ?? {}, w = d.wind ?? {}, p = d.pressure ?? {}, r = d.rainfall_piezo ?? d.rainfall ?? {}, s = d.solar_and_uvi ?? {}
  return {
    grad: zahl(o.temperature), gefuehlt: zahl(o.feels_like), taupunkt: zahl(o.dew_point), feuchte: zahl(o.humidity),
    wind: zahl(w.wind_speed), boe: zahl(w.wind_gust), richtung: zahl(w.wind_direction),
    druck: zahl(p.relative) ?? zahl(p.absolute),
    regenRate: zahl(r.rain_rate), regenHeute: zahl(r.daily), sonne: zahl(s.solar), uv: zahl(s.uvi),
    innen: zahl(d.indoor?.temperature),
    zeit: jetzt(),
  }
}

/** speicher: { lesen, schreiben, loeschen }; holen: fetch-ähnlich */
function erstelleWetterstation({ speicher, holen = fetch, protokoll = console.error, jetzt = () => Date.now() }) {
  let zugang = null, werte = null, fehler = null, uhr = null, pause = 0, lauf = 0, laeuft = false, fehlschlaege = 0
  async function abfrage(z) {
    const q = new URLSearchParams({ application_key: z.appKey, api_key: z.apiKey, mac: z.mac, call_back: 'all', temp_unitid: '1', pressure_unitid: '3', wind_speed_unitid: '7', rainfall_unitid: '12', solar_irradiance_unitid: '16' })
    const r = await holen(`${API}?${q}`, { signal: AbortSignal.timeout(ZEITGRENZE_MS), redirect: 'error' })
    if (!r.ok) throw new Error(`Ecowitt antwortet mit ${r.status}`)
    return auswerten(await r.json(), jetzt)
  }
  async function takt() {
    if (!zugang || laeuft || jetzt() < pause) return
    laeuft = true
    const meiner = lauf
    try { const w = await abfrage(zugang); if (meiner === lauf) { werte = w; fehler = null; fehlschlaege = 0 } }
    catch (f) {
      if (meiner !== lauf) return
      const m = String(f?.message ?? f), abgelehnt = /lehnt/.test(m)
      fehlschlaege++
      if (abgelehnt || fehlschlaege >= FEHLER_AB) fehler = /abort|timeout/i.test(m) ? 'Ecowitt antwortet gerade nicht – L.O.K.I. versucht es weiter.' : m
      // bei Fehlern länger warten (1, 2, 4 … höchstens 15 Minuten), bei abgelehntem Zugang 30 Minuten
      pause = jetzt() + (abgelehnt ? 30 * 60_000 : Math.min(15 * 60_000, 60_000 * 2 ** Math.min(4, fehlschlaege - 1)))
      protokoll('Wetterstation:', m)
    } finally { laeuft = false }
  }
  function starten() { clearInterval(uhr); uhr = setInterval(() => void takt(), TAKT_MS); void takt() }
  return {
    async laden() {
      try { const t = await speicher.lesen(); const z = t ? JSON.parse(t) : null; if (z?.appKey && z?.apiKey && macOk(z.mac)) { zugang = z; starten() } } catch { zugang = null }
    },
    /** Schlüssel + MAC eintragen und sofort testen; gespeichert wird nur bei Erfolg */
    async einrichten({ appKey, apiKey, mac }) {
      appKey = String(appKey ?? '').trim(); apiKey = String(apiKey ?? '').trim(); mac = macNorm(mac)
      if (!appKey || !apiKey) return { ...this.status(), fehler: 'Bitte Application Key und API Key eintragen.' }
      if (!macOk(mac)) return { ...this.status(), fehler: 'Bitte die MAC-Adresse der Station eintragen (12 Zeichen, z. B. AA:BB:CC:DD:EE:FF).' }
      try {
        const w = await abfrage({ appKey, apiKey, mac })
        if (!(await speicher.schreiben(JSON.stringify({ appKey, apiKey, mac })))) return { ...this.status(), fehler: 'Verschlüsselung nicht verfügbar – Zugang nicht gespeichert.' }
        lauf++; zugang = { appKey, apiKey, mac }; werte = w; fehler = null; fehlschlaege = 0; pause = 0; starten()
        return this.status()
      } catch (f) { const m = String(f?.message ?? f); return { ...this.status(), fehler: m.includes('fetch failed') ? 'Ecowitt nicht erreichbar – Internetverbindung prüfen.' : /abort|timeout/i.test(m) ? 'Ecowitt antwortet zu langsam – bitte noch einmal versuchen.' : m } }
    },
    entfernen() { lauf++; clearInterval(uhr); uhr = null; zugang = null; werte = null; fehler = null; try { speicher.loeschen() } catch { /* nichts gespeichert */ } return this.status() },
    /** für die Oberfläche: nie die Schlüssel, von der MAC nur das Ende */
    status() { return { eingerichtet: !!zugang, station: zugang ? '…' + zugang.mac.slice(-5) : null, werte, fehler } },
    /** fürs Dauer-HUD: Werte (höchstens 5 Minuten alt) oder null */
    anzeige() { return werte && jetzt() - werte.zeit < 5 * 60_000 ? werte : null },
    stoppen() { clearInterval(uhr); uhr = null },
  }
}

module.exports = { erstelleWetterstation, auswerten, macNorm }
