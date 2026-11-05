// Tests PV-Anlage FENECON (05.11.2026): Werte, Vorzeichen, falsches Passwort, nur private Adressen, keine Überlappung
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
const { erstellePv, privat } = createRequire(import.meta.url)('./pv.cjs')

const speicher = () => { let d = null; return { lesen: async () => d, schreiben: async (t) => { d = t; return true }, loeschen: () => { d = null } } }
const antwort = (werte, status = 200) => async (url) => {
  const k = url.split('/').pop()
  return { status, ok: status === 200, json: async () => ({ value: werte[k] ?? null }), text: async () => (status === 500 ? 'Authentication failed' : '') }
}

describe('PV-Anlage FENECON', () => {
  it('liest die Summen-Kanäle und gibt sie mit Bedeutung zurück', async () => {
    const pv = erstellePv({ speicher: speicher(), holen: antwort({ EssSoc: 64, EssActivePower: -1200, GridActivePower: -850, ProductionActivePower: 4300, ConsumptionActivePower: 2250, State: 0, GridMode: 1 }), protokoll: () => {} })
    const s = await pv.einrichten({ adresse: '192.168.178.38', passwort: 'geheim' })
    pv.stoppen()
    expect(s.eingerichtet).toBe(true)
    expect(s.werte).toMatchObject({ akku: 64, akkuW: -1200, netzW: -850, pvW: 4300, hausW: 2250, zustand: 0, inselbetrieb: false })
    expect(JSON.stringify(s)).not.toContain('geheim') // Passwort nie in der Antwort
  })
  it('nutzt die Sammelabfrage, wenn die Anlage eine Liste liefert (eine Anfrage statt sieben)', async () => {
    const adressen = []
    const holen = async (url) => { adressen.push(url); return { status: 200, ok: true, json: async () => (url.includes('%7C') ? [{ address: '_sum/EssSoc', value: 80 }, { address: '_sum/GridActivePower', value: 300 }, { address: '_sum/EssActivePower', value: 2500 }, { address: '_sum/EssDischargePower', value: -1800 }] : { value: null }), text: async () => '' } }
    const pv = erstellePv({ speicher: speicher(), holen, protokoll: () => {} })
    const s = await pv.einrichten({ adresse: '192.168.178.38', passwort: 'x' }); pv.stoppen()
    expect(adressen.every((u) => u.includes('%7C'))).toBe(true) // jede Abfrage ist eine Sammelabfrage, keine Einzelkanäle
    expect(s.werte).toMatchObject({ akku: 80, netzW: 300, akkuW: -1800 }) // Akku-Seite hat Vorrang (Hybridanlage)
  })
  it('meldet ein falsches Passwort und speichert nichts', async () => {
    const sp = speicher()
    const pv = erstellePv({ speicher: sp, holen: antwort({}, 500), protokoll: () => {} })
    const s = await pv.einrichten({ adresse: '192.168.178.38', passwort: 'falsch' })
    expect(s.eingerichtet).toBe(false)
    expect(s.fehler).toMatch(/Passwort/)
    expect(await sp.lesen()).toBeNull()
  })
  it('nimmt nur Adressen aus dem Heimnetz', async () => {
    expect(privat('192.168.178.38')).toBe(true)
    expect(privat('10.999.1.1')).toBe(false)
    expect(privat('8.8.8.8')).toBe(false)
    const pv = erstellePv({ speicher: speicher(), holen: async () => { throw new Error('darf nicht abfragen') }, protokoll: () => {} })
    expect((await pv.einrichten({ adresse: 'example.com', passwort: 'x' })).fehler).toMatch(/Heimnetz/)
  })
})
