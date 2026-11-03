// Tests für die Werkstatt-Anbindung (electron/werkstatt.cjs) mit nachgebauter Supabase-Gegenstelle (03.11.2026)
import { describe, expect, it, vi } from 'vitest'
import { createRequire } from 'node:module'

const { erstelleWerkstatt, leseKonfig } = createRequire(import.meta.url)('./werkstatt.cjs')
const KONFIG = { url: 'https://x.supabase.co', schluessel: 'oeffentlich' }

/** nachgebaute Gegenstelle: Antworten je Pfad, merkt sich alle Aufrufe */
function gegenstelle(antworten) {
  const aufrufe = []
  const holen = vi.fn(async (url, opt) => {
    const pfad = url.replace(KONFIG.url, '')
    aufrufe.push({ pfad, opt, body: opt?.body ? JSON.parse(opt.body) : null })
    const a = typeof antworten[pfad] === 'function' ? antworten[pfad](opt) : antworten[pfad]
    if (!a) return { ok: false, status: 404, text: async () => '{}', json: async () => ({}) }
    const [status, daten] = a
    return { ok: status < 400, status, text: async () => JSON.stringify(daten), json: async () => daten }
  })
  return { holen, aufrufe }
}
function speicher() { let wert = null; return { lesen: vi.fn(async () => wert), schreiben: vi.fn(async (t) => { wert = t; return true }), loeschen: vi.fn(async () => { wert = null }), wert: () => wert } }
const sitzung = (n) => ({ access_token: `zugang${n}`, refresh_token: `erneuern${n}`, expires_in: 3600, user: { id: 'loki' } })
const LAGE = { stand: 'x', aufgaben: { offen: 3 }, verkauf: { gestern: { bestellungen: 1 } }, lagerKnapp: [], freigaben: 0 }

describe('Werkstatt-Anbindung', () => {
  it('Zugang aus .env.werkstatt lesen', () => {
    expect(leseKonfig('WERKSTATT_URL=https://a.supabase.co/\r\nWERKSTATT_SCHLUESSEL=abc=\n')).toEqual({ url: 'https://a.supabase.co', schluessel: 'abc=' })
    expect(leseKonfig('')).toBeNull()
  })

  it('erstes Verbinden: Passwort → QR-Code → Code → verbunden, Sitzung gespeichert, Lage geholt', async () => {
    const g = gegenstelle({
      '/auth/v1/token?grant_type=password': [200, sitzung(1)],
      '/auth/v1/user': [200, { id: 'loki', factors: [] }],
      '/auth/v1/factors': [200, { id: 'f1', totp: { qr_code: 'data:image/svg+xml;utf-8,<svg/>' } }],
      '/auth/v1/factors/f1/challenge': [200, { id: 'ch1' }],
      '/auth/v1/factors/f1/verify': [200, sitzung(2)],
      '/functions/v1/jarvis-lage': [200, LAGE],
    })
    const sp = speicher()
    const w = erstelleWerkstatt({ konfig: KONFIG, speicher: sp, holen: g.holen, takt: 10_000_000 })
    await w.verbinden('loki@x.de', 'geheim')
    expect(w.status()).toMatchObject({ zustand: 'einrichten', qr: expect.stringContaining('svg') })
    // das Passwort geht nur an die Anmeldung, nirgends sonst hin
    expect(g.aufrufe.filter((a) => JSON.stringify(a.body ?? '').includes('geheim')).map((a) => a.pfad)).toEqual(['/auth/v1/token?grant_type=password'])
    await w.code('12 34 56')
    expect(g.aufrufe.find((a) => a.pfad.endsWith('/verify')).body).toEqual({ challenge_id: 'ch1', code: '123456' })
    expect(w.status().zustand).toBe('verbunden')
    expect(JSON.parse(sp.wert())).toMatchObject({ access_token: 'zugang2', refresh_token: 'erneuern2' })
    expect(sp.wert()).not.toContain('geheim')
    await vi.waitFor(() => expect(w.lage()).toMatchObject({ aufgaben: { offen: 3 } }))
    const lageAufruf = g.aufrufe.find((a) => a.pfad === '/functions/v1/jarvis-lage')
    expect(lageAufruf.opt.headers.Authorization).toBe('Bearer zugang2')
    await w.trennen()
  })

  it('schon eingerichtetes Gerät: nur Code, kein neuer QR-Code', async () => {
    const g = gegenstelle({
      '/auth/v1/token?grant_type=password': [200, sitzung(1)],
      '/auth/v1/user': [200, { factors: [{ id: 'alt', factor_type: 'totp', status: 'unverified' }, { id: 'f9', factor_type: 'totp', status: 'verified' }] }],
    })
    const w = erstelleWerkstatt({ konfig: KONFIG, speicher: speicher(), holen: g.holen })
    await w.verbinden('loki@x.de', 'pw')
    expect(w.status().zustand).toBe('code')
    expect(g.aufrufe.some((a) => a.pfad === '/auth/v1/factors')).toBe(false)
  })

  it('falsches Passwort und falscher Code: verständliche Meldung, nichts gespeichert', async () => {
    const g = gegenstelle({
      '/auth/v1/token?grant_type=password': [400, { error_description: 'Invalid login credentials' }],
    })
    const sp = speicher()
    const w = erstelleWerkstatt({ konfig: KONFIG, speicher: sp, holen: g.holen })
    await w.verbinden('loki@x.de', 'falsch')
    expect(w.status()).toMatchObject({ zustand: 'fehler', fehler: 'E-Mail oder Passwort stimmt nicht.' })
    const g2 = gegenstelle({
      '/auth/v1/token?grant_type=password': [200, sitzung(1)],
      '/auth/v1/user': [200, { factors: [{ id: 'f9', factor_type: 'totp', status: 'verified' }] }],
      '/auth/v1/factors/f9/challenge': [200, { id: 'ch' }],
      '/auth/v1/factors/f9/verify': [422, { msg: 'Invalid TOTP code entered' }],
    })
    const w2 = erstelleWerkstatt({ konfig: KONFIG, speicher: sp, holen: g2.holen })
    await w2.verbinden('loki@x.de', 'pw')
    await w2.code('000000')
    expect(w2.status()).toMatchObject({ zustand: 'code', fehler: expect.stringContaining('Code stimmt nicht') })
    await w2.code('12')
    expect(w2.status().fehler).toBe('Der Code hat 6 Ziffern.')
    expect(sp.schreiben).not.toHaveBeenCalled()
  })

  it('abgelaufenes Token wird genau einmal erneuert, auch bei zwei gleichzeitigen Abrufen', async () => {
    let zeit = 0
    let erneuert = 0
    const g = gegenstelle({
      '/auth/v1/token?grant_type=refresh_token': () => { erneuert++; return [200, sitzung(3)] },
      '/functions/v1/jarvis-lage': [200, LAGE],
    })
    const sp = speicher()
    await sp.schreiben(JSON.stringify({ access_token: 'alt', refresh_token: 'r', expires_at: 30_000, user_id: 'loki' }))
    const w = erstelleWerkstatt({ konfig: KONFIG, speicher: sp, holen: g.holen, jetzt: () => zeit, takt: 10_000_000 })
    await w.laden()
    await vi.waitFor(() => expect(w.lage()).not.toBeNull())
    await Promise.all([w.holeLage(), w.holeLage()])
    expect(erneuert).toBe(1)
    expect(g.aufrufe.find((a) => a.pfad.includes('refresh_token')).body).toEqual({ refresh_token: 'r' })
    expect(JSON.parse(sp.wert()).refresh_token).toBe('erneuern3')
    await w.trennen()
  })

  it('abgelehnte Sitzung (403): wird verworfen, ehrliche Meldung; Netzfehler: alte Lage bleibt', async () => {
    let antwort = [200, LAGE]
    const g = gegenstelle({ '/functions/v1/jarvis-lage': () => antwort })
    const sp = speicher()
    await sp.schreiben(JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_at: Date.now() + 3_600_000 }))
    const w = erstelleWerkstatt({ konfig: KONFIG, speicher: sp, holen: g.holen, takt: 10_000_000 })
    await w.laden()
    await vi.waitFor(() => expect(w.lage()).not.toBeNull())
    g.holen.mockImplementationOnce(async () => { throw new Error('fetch failed') })
    await w.holeLage()
    expect(w.lage()).toMatchObject(LAGE)
    expect(w.status()).toMatchObject({ zustand: 'verbunden', fehler: expect.stringContaining('Keine Verbindung') })
    antwort = [403, { fehler: 'Kein Zugriff.' }]
    await w.holeLage()
    expect(w.status()).toMatchObject({ zustand: 'fehler', fehler: expect.stringContaining('neu verbinden') })
    expect(sp.wert()).toBeNull()
  })

  // ---------- nach Prüf-Agent ----------
  const verbundenMit = async (antworten, extra = {}) => {
    const g = gegenstelle(antworten)
    const sp = speicher()
    await sp.schreiben(JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_at: Date.now() + 3_600_000 }))
    const w = erstelleWerkstatt({ konfig: KONFIG, speicher: sp, holen: g.holen, takt: 10_000_000, protokoll: () => {}, ...extra })
    return { g, sp, w }
  }

  it('Trennen während des Erneuerns gewinnt: nicht wieder verbunden, nichts gespeichert', async () => {
    let freigeben
    const g = gegenstelle({
      '/auth/v1/token?grant_type=refresh_token': () => [200, sitzung(5)],
      '/functions/v1/jarvis-lage': [200, LAGE],
      '/auth/v1/logout?scope=local': [204, {}],
    })
    const langsam = vi.fn(async (url, opt) => { if (url.includes('refresh_token')) await new Promise((w) => { freigeben = w }); return g.holen(url, opt) })
    const sp = speicher()
    await sp.schreiben(JSON.stringify({ access_token: 'alt', refresh_token: 'r', expires_at: 0 }))
    const w = erstelleWerkstatt({ konfig: KONFIG, speicher: sp, holen: langsam, takt: 10_000_000, protokoll: () => {} })
    await w.laden()
    await vi.waitFor(() => expect(freigeben).toBeTypeOf('function'))
    await w.trennen()
    freigeben()
    await new Promise((x) => setTimeout(x, 20))
    expect(w.status().zustand).toBe('aus')
    expect(w.status().fehler).toBe('')
    expect(sp.wert()).toBeNull()
    expect(w.lage()).toBeNull()
  })

  it('401 von der Serverfunktion: einmal erneuern und wiederholen, dann klappt es', async () => {
    let erster = true
    const { w } = await verbundenMit({
      '/functions/v1/jarvis-lage': () => { if (erster) { erster = false; return [401, { fehler: 'Bitte anmelden.' }] } return [200, LAGE] },
      '/auth/v1/token?grant_type=refresh_token': [200, sitzung(6)],
    })
    await w.laden()
    await vi.waitFor(() => expect(w.lage()).toMatchObject(LAGE))
    expect(w.status().zustand).toBe('verbunden')
  })

  it('Erneuern abgelehnt (Token ungültig/schon benutzt): Sitzung verworfen, ehrliche Meldung', async () => {
    const g = gegenstelle({ '/auth/v1/token?grant_type=refresh_token': [400, { error_description: 'Invalid Refresh Token: Already Used' }] })
    const sp = speicher()
    await sp.schreiben(JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_at: 0 }))
    const w = erstelleWerkstatt({ konfig: KONFIG, speicher: sp, holen: g.holen, takt: 10_000_000, protokoll: () => {} })
    await w.laden()
    await vi.waitFor(() => expect(w.status().zustand).toBe('fehler'))
    expect(w.status().fehler).toContain('neu verbinden')
    expect(sp.wert()).toBeNull()
  })

  it('hängende Verbindung: Zeitgrenze statt ewigem Warten, alte Lage bleibt', async () => {
    const haengt = vi.fn((url, opt) => new Promise((_, nein) => opt.signal.addEventListener('abort', () => nein(opt.signal.reason))))
    const sp = speicher()
    await sp.schreiben(JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_at: Date.now() + 3_600_000 }))
    const w = erstelleWerkstatt({ konfig: KONFIG, speicher: sp, holen: haengt, takt: 10_000_000, zeitgrenze: 30, protokoll: () => {} })
    await w.laden()
    await vi.waitFor(() => expect(w.status().fehler).toContain('antwortet nicht'))
    expect(w.status().zustand).toBe('verbunden')
    expect(sp.wert()).not.toBeNull()
  })

  it('kein neues Anmelden, solange verbunden; defekte gespeicherte Sitzung wird gelöscht', async () => {
    const { g, w } = await verbundenMit({ '/functions/v1/jarvis-lage': [200, LAGE] })
    await w.laden()
    await w.verbinden('x', 'y')
    expect(g.aufrufe.some((a) => a.pfad.includes('grant_type=password'))).toBe(false)
    const sp = speicher()
    await sp.schreiben('{"kaputt": true}')
    const w2 = erstelleWerkstatt({ konfig: KONFIG, speicher: sp, holen: vi.fn() })
    await w2.laden()
    expect(w2.status().zustand).toBe('aus')
    expect(sp.wert()).toBeNull()
    await w.trennen()
  })

  it('Speichern nicht möglich (keine Verschlüsselung): verbunden, aber mit Hinweis', async () => {
    const g = gegenstelle({
      '/auth/v1/token?grant_type=password': [200, sitzung(1)],
      '/auth/v1/user': [200, { factors: [{ id: 'f9', factor_type: 'totp', status: 'verified' }] }],
      '/auth/v1/factors/f9/challenge': [200, { id: 'ch' }],
      '/auth/v1/factors/f9/verify': [200, sitzung(2)],
      '/functions/v1/jarvis-lage': [200, LAGE],
    })
    const sp = { lesen: vi.fn(async () => null), schreiben: vi.fn(async () => false), loeschen: vi.fn(async () => {}) }
    const w = erstelleWerkstatt({ konfig: KONFIG, speicher: sp, holen: g.holen, takt: 10_000_000 })
    await w.verbinden('loki@x.de', 'pw')
    await w.code('123456')
    expect(w.status().zustand).toBe('verbunden')
    await vi.waitFor(() => expect(w.lage()).not.toBeNull())
    expect(w.status().fehler).toContain('Neustart')
    await w.trennen()
  })

  it('Trennen meldet ab (logout) und unbekannte Fehler gehen nur ins Protokoll', async () => {
    const protokoll = vi.fn()
    const { g, w } = await verbundenMit({ '/functions/v1/jarvis-lage': [500, { fehler: 'Interna: Tabelle xyz' }], '/auth/v1/logout?scope=local': [204, {}] }, { protokoll })
    await w.laden()
    await vi.waitFor(() => expect(w.status().fehler).not.toBe(''))
    expect(w.status().fehler).not.toContain('xyz')
    expect(protokoll).toHaveBeenCalled()
    await w.trennen()
    expect(g.aufrufe.some((a) => a.pfad === '/auth/v1/logout?scope=local')).toBe(true)
  })

  it('Fehler 400 der Serverfunktion selbst oder unvollständige Antwort: verbunden bleiben, alte Lage behalten', async () => {
    let antwort = [200, LAGE]
    const { sp, w } = await verbundenMit({ '/functions/v1/jarvis-lage': () => antwort })
    await w.laden()
    await vi.waitFor(() => expect(w.lage()).not.toBeNull())
    antwort = [400, { fehler: 'Ungültige Anfrage.' }]
    await w.holeLage()
    antwort = [200, { stand: 'x' }]
    await w.holeLage()
    expect(w.status().zustand).toBe('verbunden')
    expect(w.lage()).toMatchObject(LAGE)
    expect(sp.wert()).not.toBeNull()
    await w.trennen()
  })

  it('Trennen während des Speicherns nach dem Code: Datei wird wieder gelöscht', async () => {
    const g = gegenstelle({
      '/auth/v1/token?grant_type=password': [200, sitzung(1)],
      '/auth/v1/user': [200, { factors: [{ id: 'f9', factor_type: 'totp', status: 'verified' }] }],
      '/auth/v1/factors/f9/challenge': [200, { id: 'ch' }],
      '/auth/v1/factors/f9/verify': [200, sitzung(2)],
      '/functions/v1/jarvis-lage': [200, LAGE],
    })
    let wert = null, freigeben
    const sp = { lesen: vi.fn(async () => wert), schreiben: vi.fn(async (t) => { await new Promise((x) => { freigeben = x }); wert = t; return true }), loeschen: vi.fn(async () => { wert = null }) }
    const w = erstelleWerkstatt({ konfig: KONFIG, speicher: sp, holen: g.holen, takt: 10_000_000 })
    await w.verbinden('loki@x.de', 'pw')
    const fertig = w.code('123456')
    await vi.waitFor(() => expect(freigeben).toBeTypeOf('function'))
    await w.trennen()
    freigeben()
    await fertig
    expect(wert).toBeNull()
    expect(w.status().zustand).toBe('aus')
    expect(g.aufrufe.some((a) => a.pfad === '/functions/v1/jarvis-lage')).toBe(false)
  })

  it('nur https-Adressen werden angenommen', () => {
    expect(leseKonfig('WERKSTATT_URL=http://a.supabase.co\nWERKSTATT_SCHLUESSEL=k')).toBeNull()
  })

  it('ohne Zugangsdaten: ehrliche Meldung statt Absturz', async () => {
    const w = erstelleWerkstatt({ konfig: null, speicher: speicher(), holen: vi.fn() })
    expect(w.status().verfuegbar).toBe(false)
    await w.verbinden('a', 'b')
    expect(w.status().fehler).toContain('.env.werkstatt')
  })
})
