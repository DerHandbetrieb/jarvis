// Tests für die Modell-Prüfung (electron/modellpruefung.cjs) mit nachgebautem Ollama und Verzeichnis (04.11.2026)
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import crypto from 'node:crypto'

const { pruefeModell, zerlege } = createRequire(import.meta.url)('./modellpruefung.cjs')
const MANIFEST = Buffer.from('{"schemaVersion":2}')
const sha = crypto.createHash('sha256').update(MANIFEST).digest('hex')
const holen = (lokal, status = 200) => async (url) => url.includes('/api/tags')
  ? { json: async () => ({ models: lokal ? [{ name: 'qwen3:8b', digest: lokal }] : [] }) }
  : { ok: status === 200, status, arrayBuffer: async () => MANIFEST }

describe('Modell-Prüfung', () => {
  it('zerlegt Modellnamen', () => {
    expect(zerlege('qwen3:8b')).toEqual({ pfad: 'library/qwen3', tag: '8b' })
    expect(zerlege('qwen3')).toEqual({ pfad: 'library/qwen3', tag: 'latest' })
    expect(zerlege('nutzer/modell:q4')).toEqual({ pfad: 'nutzer/modell', tag: 'q4' })
    expect(zerlege('../böse')).toBeNull()
  })
  it('erkennt aktuell, neuer, fehlt, unerreichbar', async () => {
    expect((await pruefeModell('qwen3:8b', { holen: holen(sha) })).stand).toBe('aktuell')
    expect((await pruefeModell('qwen3:8b', { holen: holen('alt') })).stand).toBe('neuer')
    expect((await pruefeModell('qwen3:8b', { holen: holen(null) })).stand).toBe('fehlt')
    expect((await pruefeModell('qwen3:8b', { holen: holen(sha, 503) })).stand).toBe('unbekannt')
    expect((await pruefeModell('qwen3:8b', { holen: async () => { throw new Error('aus') } })).stand).toBe('unbekannt')
  })
})
