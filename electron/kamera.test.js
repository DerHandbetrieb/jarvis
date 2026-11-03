// Tests für die Kamera-Anbindung (electron/kamera.cjs) mit nachgebauter Kamera (03.11.2026)
import { describe, expect, it, vi } from 'vitest'
import { createRequire } from 'node:module'

const { erstelleKamera, istHeimnetz } = createRequire(import.meta.url)('./kamera.cjs')
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])
const speicher = () => { let w = null; return { lesen: vi.fn(async () => w), schreiben: vi.fn(async (t) => { w = t; return true }), loeschen: vi.fn(async () => { w = null }), wert: () => w } }
const kamera = (antworten) => {
  const aufrufe = []
  // wie holeHttps: bei abweichendem Fingerabdruck Abbruch, BEVOR die Adresse mit Zugangsdaten „gesendet“ wird
  const holen = vi.fn(async (url, { erwartet } = {}) => {
    const a = antworten.shift()
    if (a instanceof Error) throw a
    if (erwartet && a.fingerabdruck !== erwartet) throw Object.assign(new Error('fremdes Zertifikat'), { fremd: true })
    aufrufe.push(url); return a
  })
  return { holen, aufrufe }
}
const ok = (fp = 'AA:BB') => ({ status: 200, typ: 'image/jpeg', daten: JPEG, fingerabdruck: fp })

describe('Kamera-Anbindung', () => {
  it('nur Adressen aus dem Heimnetz', () => {
    expect(['192.168.1.50', '10.0.0.5', '172.16.1.1', '172.31.255.1'].map(istHeimnetz)).toEqual([true, true, true, true])
    expect(['8.8.8.8', '172.32.0.1', '192.169.0.1', 'kamera.local', '192.168.1.300', '', '192.168.1.1/x'].map(istHeimnetz)).toEqual([false, false, false, false, false, false, false])
  })
  it('einrichten: erst testen, dann verschlüsselt speichern; Status ohne Benutzer/Passwort', async () => {
    const k = kamera([ok()]), sp = speicher()
    const w = erstelleKamera({ speicher: sp, holen: k.holen })
    const r = await w.einrichten({ adresse: '192.168.1.50', benutzer: 'loki', passwort: 'g€heim&x', name: 'Carport' })
    expect(r).toMatchObject({ eingerichtet: true, name: 'Carport', fehler: '' })
    expect(r.vorschau).toMatch(/^data:image\/jpeg;base64,/)
    expect(k.aufrufe[0]).toMatch(/^https:\/\/192\.168\.1\.50\/cgi-bin\/api\.cgi\?cmd=Snap&channel=0&rs=[0-9a-f]+&user=loki&password=g%E2%82%ACheim%26x$/)
    expect(JSON.parse(sp.wert())).toMatchObject({ adresse: '192.168.1.50', benutzer: 'loki', fingerabdruck: 'AA:BB' })
    expect(JSON.stringify(w.status())).not.toMatch(/loki"|heim/)
  })
  it('falsches Passwort / fremde Adresse / unerreichbar: verständliche Meldung, nichts gespeichert', async () => {
    const sp = speicher()
    const w1 = erstelleKamera({ speicher: sp, holen: kamera([{ status: 200, daten: Buffer.from('[{"cmd":"Snap","code":1,"error":{"detail":"login failed","rspCode":-7}}]'), fingerabdruck: 'x' }]).holen })
    expect((await w1.einrichten({ adresse: '192.168.1.50', benutzer: 'loki', passwort: 'falsch' })).fehler).toContain('Passwort')
    const w2 = erstelleKamera({ speicher: sp, holen: vi.fn() })
    expect((await w2.einrichten({ adresse: '8.8.8.8', benutzer: 'a', passwort: 'b' })).fehler).toContain('Heimnetz')
    const w3 = erstelleKamera({ speicher: sp, holen: kamera([Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' })]).holen })
    expect((await w3.einrichten({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'b' })).fehler).toContain('nicht erreichbar')
    expect(sp.schreiben).not.toHaveBeenCalled()
  })
  it('Bild wird zwischengespeichert, gleichzeitige Anfragen teilen sich einen Abruf', async () => {
    let zeit = 0
    const k = kamera([ok(), ok(), ok(), ok()])
    const w = erstelleKamera({ speicher: speicher(), holen: k.holen, jetzt: () => zeit, zwischenzeit: 3000 })
    await w.einrichten({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'b' })
    expect(await w.bild()).toEqual(JPEG)
    expect(k.holen).toHaveBeenCalledTimes(1) // aus dem Zwischenspeicher
    zeit = 5000
    await Promise.all([w.bild(), w.bild(), w.bild()])
    expect(k.holen).toHaveBeenCalledTimes(2)
  })
  it('anderes Zertifikat unter derselben Adresse: Abbruch, kein Bild', async () => {
    let zeit = 0
    const k = kamera([ok('AA:BB'), ok('FREMD')])
    const w = erstelleKamera({ speicher: speicher(), holen: k.holen, jetzt: () => zeit, protokoll: () => {} })
    await w.einrichten({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'b' })
    zeit = 10_000
    expect(await w.bild()).toBeNull()
    expect(w.status().fehler).toContain('anderes Gerät')
    expect(k.aufrufe).toHaveLength(1) // Zugangsdaten nur an die echte Kamera
  })
  it('ohne Fingerabdruck wird nichts eingetragen; gespeicherte Daten ohne Fingerabdruck gelten als defekt', async () => {
    const sp = speicher()
    const w = erstelleKamera({ speicher: sp, holen: kamera([ok(null)]).holen })
    expect((await w.einrichten({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'b' })).eingerichtet).toBe(false)
    expect(sp.schreiben).not.toHaveBeenCalled()
    await sp.schreiben(JSON.stringify({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'b' }))
    const w2 = erstelleKamera({ speicher: sp, holen: vi.fn() })
    await w2.laden()
    expect(w2.status().eingerichtet).toBe(false)
  })
  it('Abruf, der nach dem Entfernen fertig wird, schreibt nichts zurück', async () => {
    let zeit = 0, loslassen
    const sp = speicher()
    const holen = vi.fn()
      .mockResolvedValueOnce(ok())
      .mockImplementationOnce(() => new Promise((f) => { loslassen = () => f(ok()) }))
    const w = erstelleKamera({ speicher: sp, holen, jetzt: () => zeit })
    await w.einrichten({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'b' })
    zeit = 10_000
    const laeuft = w.bild()
    await w.entfernen()
    loslassen()
    expect(await laeuft).toBeNull()
    expect(w.status()).toMatchObject({ eingerichtet: false, fehler: '' })
    expect(await w.bild()).toBeNull()
  })
  it('laden/entfernen: gespeicherte Kamera nach Neustart, defekte Daten werden gelöscht', async () => {
    const sp = speicher()
    await sp.schreiben(JSON.stringify({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'b', name: 'Hof', fingerabdruck: 'x' }))
    const w = erstelleKamera({ speicher: sp, holen: vi.fn() })
    await w.laden()
    expect(w.status()).toMatchObject({ eingerichtet: true, name: 'Hof' })
    await w.entfernen()
    expect(sp.wert()).toBeNull()
    await sp.schreiben('{"adresse":"8.8.8.8"}')
    const w2 = erstelleKamera({ speicher: sp, holen: vi.fn() })
    await w2.laden()
    expect(w2.status().eingerichtet).toBe(false)
    expect(sp.wert()).toBeNull()
  })
})
