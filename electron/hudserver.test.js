// Tests für die Gegenstelle des Dauer-HUD (electron/hudserver.cjs) – echte Verbindungen auf 127.0.0.1 (03.11.2026)
import { afterEach, describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const { erstelleHudServer, hudSchluessel } = createRequire(import.meta.url)('./hudserver.cjs')
const SCHLUESSEL = 'a'.repeat(64)
let s = null
afterEach(async () => { await s?.stop(); s = null })
async function starten(daten = async () => ({ zeit: 'x', werkstatt: { aufgaben: { offen: 3 } } })) {
  s = erstelleHudServer({ port: 0, schluessel: SCHLUESSEL, daten, protokoll: () => {} })
  const port = await s.start()
  return (pfad, opt = {}) => fetch(`http://127.0.0.1:${port}${pfad}`, opt)
}

describe('Dauer-HUD-Gegenstelle', () => {
  it('liefert die Daten nur mit richtigem Schlüssel', async () => {
    const hole = await starten()
    const r = await hole('/hud', { headers: { 'x-loki-schluessel': SCHLUESSEL } })
    expect(r.status).toBe(200)
    expect(r.headers.get('access-control-allow-origin')).toBe('*')
    expect(await r.json()).toMatchObject({ werkstatt: { aufgaben: { offen: 3 } } })
    expect((await hole('/hud')).status).toBe(403)
    expect((await hole('/hud', { headers: { 'x-loki-schluessel': 'b'.repeat(64) } })).status).toBe(403)
    expect((await hole('/hud', { headers: { 'x-loki-schluessel': 'kurz' } })).status).toBe(403)
  })
  it('nur GET /hud – alles andere 404, Vorab-Anfrage (CORS) 204', async () => {
    const hole = await starten()
    expect((await hole('/anderes', { headers: { 'x-loki-schluessel': SCHLUESSEL } })).status).toBe(404)
    expect((await hole('/hud', { method: 'POST', headers: { 'x-loki-schluessel': SCHLUESSEL } })).status).toBe(404)
    expect((await hole('/kamera', { method: 'POST', headers: { 'x-loki-schluessel': SCHLUESSEL } })).status).toBe(404)
    const vorab = await hole('/hud', { method: 'OPTIONS' })
    expect(vorab.status).toBe(204)
    expect(vorab.headers.get('access-control-allow-headers')).toContain('x-loki-schluessel')
  })
  it('fremder Host-Kopf (DNS-Rebinding) wird abgewiesen, localhost angenommen', async () => {
    s = erstelleHudServer({ port: 0, schluessel: SCHLUESSEL, daten: async () => ({ ok: 1 }), protokoll: () => {} })
    const port = await s.start()
    const http = await import('node:http')
    const status = (host) => new Promise((fertig) => {
      const req = http.request({ host: '127.0.0.1', port, path: '/hud', headers: { host, 'x-loki-schluessel': SCHLUESSEL } })
      req.on('response', (r) => { r.resume(); fertig(r.statusCode) }); req.on('error', () => fertig(0)); req.end()
    })
    expect(await status(`boese.example:${port}`)).toBe(403)
    expect(await status(`localhost:${port}`)).toBe(200)
    expect(await status(`127.0.0.1:${port}`)).toBe(200)
  })
  it('Kamerabild: nur mit Schlüssel, 204 wenn keins da', async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 1])
    let da = true
    s = erstelleHudServer({ port: 0, schluessel: SCHLUESSEL, daten: async () => ({}), kamera: async () => (da ? jpeg : null), protokoll: () => {} })
    const port = await s.start()
    const hole = (opt) => fetch(`http://127.0.0.1:${port}/kamera`, opt)
    expect((await hole()).status).toBe(403)
    const r = await hole({ headers: { 'x-loki-schluessel': SCHLUESSEL } })
    expect(r.headers.get('content-type')).toBe('image/jpeg')
    expect(Buffer.from(await r.arrayBuffer())).toEqual(jpeg)
    da = false
    expect((await hole({ headers: { 'x-loki-schluessel': SCHLUESSEL } })).status).toBe(204)
  })
  it('roter Knopf: POST /stumm nur mit Schlüssel', async () => {
    let n = 0
    s = erstelleHudServer({ port: 0, schluessel: SCHLUESSEL, daten: async () => ({}), stumm: async () => ({ mikrofon: ++n % 2 === 0 }), protokoll: () => {} })
    const port = await s.start()
    const hole = (opt) => fetch(`http://127.0.0.1:${port}/stumm`, { method: 'POST', ...opt })
    expect((await hole()).status).toBe(403)
    expect(n).toBe(0)
    expect(await (await hole({ headers: { 'x-loki-schluessel': SCHLUESSEL } })).json()).toEqual({ mikrofon: false })
    expect((await fetch(`http://127.0.0.1:${port}/stumm`, { headers: { 'x-loki-schluessel': SCHLUESSEL } })).status).toBe(404)
  })
  it('Fehler beim Datenholen: 500 ohne Interna', async () => {
    const hole = await starten(async () => { throw new Error('geheime Interna') })
    const r = await hole('/hud', { headers: { 'x-loki-schluessel': SCHLUESSEL } })
    expect(r.status).toBe(500)
    expect(await r.text()).toBe('')
  })
  it('lauscht nur auf 127.0.0.1 – über die Netzwerk-Adresse des PCs nicht erreichbar', async () => {
    s = erstelleHudServer({ port: 0, schluessel: SCHLUESSEL, daten: async () => ({}), protokoll: () => {} })
    const port = await s.start()
    const ip = Object.values(os.networkInterfaces()).flat().find((n) => n && n.family === 'IPv4' && !n.internal)?.address
    if (!ip) return // ohne Netzwerkkarte nichts zu prüfen
    await expect(fetch(`http://${ip}:${port}/hud`, { headers: { 'x-loki-schluessel': SCHLUESSEL }, signal: AbortSignal.timeout(2000) })).rejects.toThrow()
  })
  it('Schlüssel: einmal zufällig erzeugt und danach wiederverwendet', () => {
    const datei = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'hud-')), 'schluessel')
    const a = hudSchluessel(fs, datei)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(hudSchluessel(fs, datei)).toBe(a)
  })
})
