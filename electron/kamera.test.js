// Tests für die Kamera-Anbindung (electron/kamera.cjs) mit nachgebauter Kamera (03.11.2026, Anmeldung per Token 04.11.2026)
import { describe, expect, it, vi } from 'vitest'
import { createRequire } from 'node:module'

const { erstelleKamera, istHeimnetz } = createRequire(import.meta.url)('./kamera.cjs')
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])
const json = (x, fp = 'AA:BB') => ({ status: 200, typ: 'text/html', daten: Buffer.from(JSON.stringify(x)), fingerabdruck: fp })
const anmeldungOk = (fp = 'AA:BB', name = 'tok1') => json([{ cmd: 'Login', code: 0, value: { Token: { leaseTime: 3600, name } } }], fp)
const anmeldungFalsch = () => json([{ cmd: 'Login', code: 1, error: { detail: 'login failed', rspCode: -7 } }])
const ok = (fp = 'AA:BB') => ({ status: 200, typ: 'image/jpeg', daten: JPEG, fingerabdruck: fp })
const speicher = () => { let w = null; return { lesen: vi.fn(async () => w), schreiben: vi.fn(async (t) => { w = t; return true }), loeschen: vi.fn(async () => { w = null }), wert: () => w } }
/** nachgebaute Kamera: antworten der Reihe nach (Anmeldung und Bild); wie holeHttps bei fremdem Fingerabdruck Abbruch VOR dem Senden */
const kamera = (antworten) => {
  const gesendet = []
  const holen = vi.fn(async (url, { erwartet, koerper } = {}) => {
    const a = antworten.shift()
    if (a instanceof Error) throw a
    if (erwartet && a.fingerabdruck !== erwartet) throw Object.assign(new Error('fremdes Zertifikat'), { fremd: true })
    gesendet.push({ url, koerper }); return a
  })
  return { holen, gesendet }
}

describe('Kamera-Anbindung', () => {
  it('nur Adressen aus dem Heimnetz', () => {
    expect(['192.168.1.50', '10.0.0.5', '172.16.1.1', '172.31.255.1'].map(istHeimnetz)).toEqual([true, true, true, true])
    expect(['8.8.8.8', '172.32.0.1', '192.169.0.1', 'kamera.local', '192.168.1.300', '', '192.168.1.1/x'].map(istHeimnetz)).toEqual([false, false, false, false, false, false, false])
  })
  it('einrichten: anmelden (Passwort nur im Inhalt), Bild per Token, verschlüsselt speichern; Status ohne Benutzer/Passwort', async () => {
    const k = kamera([anmeldungOk(), ok()]), sp = speicher()
    const w = erstelleKamera({ speicher: sp, holen: k.holen })
    const r = await w.einrichten({ adresse: '192.168.1.50', benutzer: 'loki', passwort: 'g€heim&x"', name: 'Carport' })
    expect(r).toMatchObject({ eingerichtet: true, name: 'Carport', fehler: '' })
    expect(r.vorschau).toMatch(/^data:image\/jpeg;base64,/)
    expect(k.gesendet[0].url).toBe('https://192.168.1.50/cgi-bin/api.cgi?cmd=Login')
    expect(JSON.parse(k.gesendet[0].koerper)[0].param.User).toEqual({ Version: '0', userName: 'loki', password: 'g€heim&x"' })
    expect(k.gesendet[1].url).toMatch(/^https:\/\/192\.168\.1\.50\/cgi-bin\/api\.cgi\?cmd=Snap&channel=0&rs=[0-9a-f]+&token=tok1$/)
    expect(k.gesendet.map((g) => g.url).join()).not.toMatch(/heim|password/)
    expect(JSON.parse(sp.wert())).toMatchObject({ adresse: '192.168.1.50', benutzer: 'loki', fingerabdruck: 'AA:BB' })
    expect(JSON.stringify(w.status())).not.toMatch(/loki"|heim|tok1/)
  })
  it('falsches Passwort / fremde Adresse / unerreichbar: verständliche Meldung, nichts gespeichert', async () => {
    const sp = speicher()
    const w1 = erstelleKamera({ speicher: sp, holen: kamera([anmeldungFalsch()]).holen })
    const f1 = (await w1.einrichten({ adresse: '192.168.1.50', benutzer: 'loki', passwort: 'falsch' })).fehler
    expect(f1).toContain('Passwort')
    expect(f1).toContain('login failed')
    const w2 = erstelleKamera({ speicher: sp, holen: vi.fn() })
    expect((await w2.einrichten({ adresse: '8.8.8.8', benutzer: 'a', passwort: 'b' })).fehler).toContain('Heimnetz')
    const w3 = erstelleKamera({ speicher: sp, holen: kamera([Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' })]).holen })
    expect((await w3.einrichten({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'b' })).fehler).toContain('nicht erreichbar')
    expect(sp.schreiben).not.toHaveBeenCalled()
  })
  it('gesperrtes Konto wird als Sperre gemeldet', async () => {
    const w = erstelleKamera({ speicher: speicher(), holen: kamera([json([{ cmd: 'Login', code: 1, error: { detail: 'login locked', rspCode: -31 } }])]).holen })
    expect((await w.einrichten({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'b' })).fehler).toContain('gesperrt')
  })
  it('Token wird wiederverwendet, Bild zwischengespeichert, gleichzeitige Anfragen teilen sich einen Abruf', async () => {
    let zeit = 0
    const k = kamera([anmeldungOk(), ok(), ok(), ok()])
    const w = erstelleKamera({ speicher: speicher(), holen: k.holen, jetzt: () => zeit, zwischenzeit: 3000 })
    await w.einrichten({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'b' })
    expect(await w.bild()).toEqual(JPEG)
    expect(k.holen).toHaveBeenCalledTimes(2) // aus dem Zwischenspeicher
    zeit = 5000
    await Promise.all([w.bild(), w.bild(), w.bild()])
    expect(k.holen).toHaveBeenCalledTimes(3) // nur ein Bild, keine neue Anmeldung
    expect(k.gesendet.filter((g) => g.koerper)).toHaveLength(1)
  })
  it('abgelaufenes Token (-6): einmal neu anmelden, dann Bild', async () => {
    let zeit = 0
    const k = kamera([anmeldungOk(), ok(), json([{ cmd: 'Snap', code: 1, error: { detail: 'please login first', rspCode: -6 } }]), anmeldungOk('AA:BB', 'tok2'), ok()])
    const w = erstelleKamera({ speicher: speicher(), holen: k.holen, jetzt: () => zeit })
    await w.einrichten({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'b' })
    zeit = 10_000
    expect(await w.bild()).toEqual(JPEG)
    expect(k.gesendet.at(-1).url).toContain('token=tok2')
  })
  it('nach abgelehnter Anmeldung 60 s Pause (keine Kontosperre durch Dauerversuche)', async () => {
    let zeit = 0
    const sp = speicher()
    await sp.schreiben(JSON.stringify({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'alt', name: 'Hof', fingerabdruck: 'AA:BB' }))
    const k = kamera([anmeldungFalsch(), anmeldungOk(), ok()])
    const w = erstelleKamera({ speicher: sp, holen: k.holen, jetzt: () => zeit })
    await w.laden()
    expect(await w.bild()).toBeNull()
    zeit = 10_000
    expect(await w.bild()).toBeNull()
    expect(k.holen).toHaveBeenCalledTimes(1)
    expect(w.status().fehler).toContain('Passwort')
    zeit = 70_000
    expect(await w.bild()).toEqual(JPEG)
  })
  it('schnelles Neu-Eintragen mit falschem Passwort: Pause statt weiterer Fehlversuche', async () => {
    let zeit = 0
    const k = kamera([anmeldungFalsch()])
    const w = erstelleKamera({ speicher: speicher(), holen: k.holen, jetzt: () => zeit })
    await w.einrichten({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'x' })
    zeit = 5000
    expect((await w.einrichten({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'y' })).fehler).toContain('55 s')
    expect(k.holen).toHaveBeenCalledTimes(1)
  })
  it('keine Kamera-Antwort (404/HTML): keine Passwort-Meldung, keine Pause', async () => {
    const k = kamera([{ status: 404, daten: Buffer.from('<html>nicht da</html>'), fingerabdruck: 'AA:BB' }, anmeldungOk(), ok()])
    const w = erstelleKamera({ speicher: speicher(), holen: k.holen })
    const f = (await w.einrichten({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'b' })).fehler
    expect(f).toContain('HTTP 404')
    expect(f).not.toContain('Passwort')
    expect((await w.einrichten({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'b' })).eingerichtet).toBe(true)
  })
  it('anderer Bildfehler als -6: Token bleibt, keine neue Anmeldung', async () => {
    let zeit = 0
    const k = kamera([anmeldungOk(), ok(), json([{ cmd: 'Snap', code: 1, error: { detail: 'busy', rspCode: -12 } }]), ok()])
    const w = erstelleKamera({ speicher: speicher(), holen: k.holen, jetzt: () => zeit })
    await w.einrichten({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'b' })
    zeit = 10_000
    expect(await w.bild()).toBeNull()
    zeit = 20_000
    expect(await w.bild()).toEqual(JPEG)
    expect(k.gesendet.filter((g) => g.koerper)).toHaveLength(1)
  })
  it('Neu-Eintragen, während ein Abruf des alten Kontos läuft: altes Token wird nie fürs neue Konto benutzt', async () => {
    let zeit = 0, alteAnmeldung
    const sp = speicher()
    await sp.schreiben(JSON.stringify({ adresse: '192.168.1.50', benutzer: 'alt', passwort: 'p', fingerabdruck: 'AA:BB' }))
    const gesendet = []
    const holen = vi.fn(async (url, { koerper } = {}) => {
      gesendet.push(url)
      if (koerper && JSON.parse(koerper)[0].param.User.userName === 'alt') return new Promise((f) => { alteAnmeldung = () => f(anmeldungOk('AA:BB', 'ALT')) })
      if (koerper) return anmeldungOk('AA:BB', 'NEU')
      return ok()
    })
    const w = erstelleKamera({ speicher: sp, holen, jetzt: () => zeit })
    await w.laden()
    const alt = w.bild() // hängt in der Anmeldung
    const neu = w.einrichten({ adresse: '192.168.1.50', benutzer: 'neu', passwort: 'q' })
    alteAnmeldung()
    expect(await alt).toBeNull()
    expect((await neu).eingerichtet).toBe(true)
    zeit = 10_000
    await w.bild()
    expect(gesendet.filter((u) => u.includes('cmd=Snap')).at(-1)).toContain('token=NEU')
  })
  it('anderes Zertifikat unter derselben Adresse: Abbruch, keine Zugangsdaten gesendet', async () => {
    let zeit = 0
    const sp = speicher()
    await sp.schreiben(JSON.stringify({ adresse: '192.168.1.50', benutzer: 'a', passwort: 'b', fingerabdruck: 'AA:BB' }))
    const k = kamera([anmeldungOk('FREMD')])
    const w = erstelleKamera({ speicher: sp, holen: k.holen, jetzt: () => zeit, protokoll: () => {} })
    await w.laden()
    expect(await w.bild()).toBeNull()
    expect(w.status().fehler).toContain('anderes Gerät')
    expect(k.gesendet).toHaveLength(0)
  })
  it('ohne Fingerabdruck wird nichts eingetragen; gespeicherte Daten ohne Fingerabdruck gelten als defekt', async () => {
    const sp = speicher()
    const w = erstelleKamera({ speicher: sp, holen: kamera([anmeldungOk(null)]).holen })
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
      .mockResolvedValueOnce(anmeldungOk())
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
