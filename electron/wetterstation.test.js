// Tests Wetterstation Ecowitt (05.11.2026): Werte, Fehlermeldungen der Cloud, MAC-Prüfung, Schlüssel nie in der Antwort
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
const { erstelleWetterstation, auswerten, macNorm } = createRequire(import.meta.url)('./wetterstation.cjs')

const speicher = () => { let d = null; return { lesen: async () => d, schreiben: async (t) => { d = t; return true }, loeschen: () => { d = null } } }
const BEISPIEL = { code: 0, msg: 'success', data: { outdoor: { temperature: { unit: '℃', value: '9.4' }, humidity: { unit: '%', value: '81' } }, wind: { wind_speed: { value: '7.2' }, wind_gust: { value: '12.6' }, wind_direction: { value: '230' } }, pressure: { relative: { value: '1013.2' } }, rainfall_piezo: { rain_rate: { value: '0.0' }, daily: { value: '1.2' } } } }
const antwort = (j, status = 200) => async () => ({ status, ok: status === 200, json: async () => j })

describe('Wetterstation Ecowitt', () => {
  it('wertet die Cloud-Antwort aus', () => {
    expect(auswerten(BEISPIEL, () => 1)).toMatchObject({ grad: 9.4, feuchte: 81, wind: 7.2, boe: 12.6, richtung: 230, druck: 1013.2, regenHeute: 1.2 })
  })
  it('merkt die Messzeit der Station, nicht nur die Abrufzeit', async () => {
    const mit = JSON.parse(JSON.stringify(BEISPIEL)); mit.data.outdoor.temperature.time = '1793968000'
    expect(auswerten(mit, () => 1).gemessen).toBe(1793968000000)
    expect(auswerten(BEISPIEL, () => 1).gemessen).toBeNull()
    let t = 1793968000000 + 20 * 60_000
    const st = erstelleWetterstation({ speicher: speicher(), holen: antwort(mit), protokoll: () => {}, jetzt: () => t })
    await st.einrichten({ appKey: 'a', apiKey: 'b', mac: 'aabbccddeeff' }); st.stoppen()
    expect(st.anzeige()).toBeNull()
  })
  it('meldet abgelehnte Schlüssel verständlich und speichert nichts', async () => {
    const sp = speicher()
    const st = erstelleWetterstation({ speicher: sp, holen: antwort({ code: 40010, msg: 'Illegal Application_Key Parameter' }), protokoll: () => {} })
    const s = await st.einrichten({ appKey: 'a', apiKey: 'b', mac: 'aa-bb-cc-dd-ee-ff' })
    expect(s.eingerichtet).toBe(false); expect(s.fehler).toMatch(/Schlüssel/); expect(await sp.lesen()).toBeNull()
  })
  it('speichert bei Erfolg, zeigt die Schlüssel nie', async () => {
    const st = erstelleWetterstation({ speicher: speicher(), holen: antwort(BEISPIEL), protokoll: () => {} })
    const s = await st.einrichten({ appKey: 'GEHEIM-APP', apiKey: 'GEHEIM-API', mac: 'aabbccddeeff' }); st.stoppen()
    expect(s.eingerichtet).toBe(true); expect(s.werte.grad).toBe(9.4)
    expect(JSON.stringify(s)).not.toMatch(/GEHEIM/)
  })
  it('prüft die MAC-Adresse', () => {
    expect(macNorm('a4:cf:12:34:56:78')).toBe('A4:CF:12:34:56:78')
    expect(macNorm('A4-CF-12-34-56-78')).toBe('A4:CF:12:34:56:78')
    expect(macNorm('123')).toBe('')
  })
})
