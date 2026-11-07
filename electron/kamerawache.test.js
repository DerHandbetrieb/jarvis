// Tests für die Kamera-Wache (electron/kamerawache.cjs, 04.11.2026)
import { describe, expect, it, vi } from 'vitest'
import { createRequire } from 'node:module'

const { erstelleKamerawache, RUHE_MS, LEBENSZEICHEN_MS } = createRequire(import.meta.url)('./kamerawache.cjs')

describe('Kamera-Wache', () => {
  it('meldet beim Auftauchen einer Person, nicht dauernd, und erst nach 2 Minuten Ruhe erneut', () => {
    let t = 0
    const ereignisse = []
    const w = erstelleKamerawache({ abfragen: async () => false, beimEreignis: (e) => ereignisse.push(e), jetzt: () => t })
    w._schritt(false); t = 1000
    w._schritt(true); t = 3000 // Person taucht auf → Meldung
    w._schritt(true); t = 5000 // bleibt stehen → keine weitere
    w._schritt(false); t = 30_000 // kurz weg
    w._schritt(true) // wieder da, aber keine 2 Minuten Ruhe → keine Meldung
    expect(ereignisse.length).toBe(1)
    t = 30_000 + RUHE_MS + 1
    w._schritt(false); w._schritt(true) // nach 2 Minuten ohne Person → neue Meldung
    expect(ereignisse.map((e) => e.art)).toEqual(['person', 'person'])
  })
  it('meldet Autos eigenständig neben Personen', () => {
    let t = 0
    const arten = []
    const w = erstelleKamerawache({ abfragen: async () => false, beimEreignis: (e) => arten.push(e.art), jetzt: () => t })
    w._schritt({ person: false, auto: true }); t = 2000
    w._schritt({ person: true, auto: true }); t = 4000
    w._schritt({ person: false, auto: false }); t = 6000
    w._schritt({ person: false, auto: true })
    expect(arten).toEqual(['auto', 'person'])
    t = 6000 + RUHE_MS + 1
    w._schritt({ person: false, auto: false }); w._schritt({ person: false, auto: true })
    expect(arten).toEqual(['auto', 'person', 'auto'])
  })
  it('bei Fehlern: Pause wird länger, danach geht es weiter; stoppen beendet die Schleife', async () => {
    const pausen = []
    let n = 0
    const protokoll = vi.fn()
    let w
    const abfragen = vi.fn(async () => { n++; if (n <= 2) throw new Error('Zeitüberschreitung'); if (n >= 4) w.stoppen(); return false })
    w = erstelleKamerawache({ abfragen, beimEreignis: () => {}, protokoll, warte: async (ms) => { pausen.push(ms) } })
    w.starten()
    await vi.waitFor(() => expect(w.laeuft()).toBe(false))
    expect(pausen.slice(0, 3)).toEqual([10_000, 20_000, 2000])
    expect(w.stand()).toMatchObject({ fehler: 2, abfragen: 1 }) // die letzte Abfrage lief beim Stoppen noch – zählt nicht mehr
    expect(protokoll.mock.calls.some((c) => String(c[0]).includes('wieder erreichbar'))).toBe(true)
  })
  it('schreibt Erkennungen innerhalb der Ruhezeit ins Protokoll, ohne sie anzusagen', () => {
    let t = 0
    const ereignisse = [], zeilen = []
    const w = erstelleKamerawache({ abfragen: async () => false, beimEreignis: (e) => ereignisse.push(e), protokoll: (z) => zeilen.push(z), jetzt: () => t })
    w._schritt({ person: false, auto: true }); t = 10_000
    w._schritt({ person: false, auto: false }); t = 20_000
    w._schritt({ person: false, auto: true })
    expect(ereignisse).toHaveLength(1)
    expect(zeilen.some((z) => z.includes('Auto erneut erkannt'))).toBe(true)
  })
  it('meldet sich stündlich mit einem Lebenszeichen', async () => {
    let t = 0, n = 0
    const zeilen = []
    let w
    w = erstelleKamerawache({ abfragen: async () => { n++; if (n >= 3) w.stoppen(); return false }, beimEreignis: () => {}, protokoll: (z) => zeilen.push(z), jetzt: () => t, warte: async () => { t += LEBENSZEICHEN_MS } })
    w.starten()
    await vi.waitFor(() => expect(w.laeuft()).toBe(false))
    expect(zeilen.some((z) => z.startsWith('Kamera-Wache läuft'))).toBe(true)
  })
})
