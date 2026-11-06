// Tests für die Niesen-Erkennung (electron/niesen.cjs), 06.11.2026
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const { erstelleNiesWache } = createRequire(import.meta.url)('./niesen.cjs')
const leise = (n = 1600) => new Float32Array(n)
const laut = (n = 1600) => new Float32Array(n).fill(0.3)

function aufbau(wert = 0.5) {
  let zeit = 0
  const stuecke = [], meldungen = []
  const w = erstelleNiesWache({ auswerten: (s) => { stuecke.push(s); return wert }, melden: (x) => meldungen.push(x), jetzt: () => zeit })
  return { w, stuecke, meldungen, setzeZeit: (z) => { zeit = z } }
}
const dreiSekunden = (w) => { for (let i = 0; i < 40; i++) w.ton(laut()) }

describe('Niesen-Wache', () => {
  it('rechnet bei Stille nichts', () => {
    const a = aufbau()
    for (let i = 0; i < 100; i++) a.w.ton(leise())
    expect(a.stuecke.length).toBe(0)
  })
  it('wertet nach einem lauten Geräusch ein 3-s-Stück mit Vorlauf aus', () => {
    const a = aufbau()
    for (let i = 0; i < 10; i++) a.w.ton(leise())
    dreiSekunden(a.w)
    expect(a.stuecke[0].length).toBe(48000)
    expect(a.stuecke[0][7999]).toBe(0) // Vorlauf (Stille)
    expect(a.stuecke[0][8000]).toBeCloseTo(0.3)
    expect(a.meldungen).toEqual([0.5])
  })
  it('meldet unter der Schwelle nicht', () => {
    const a = aufbau(0.1); dreiSekunden(a.w)
    expect(a.stuecke.length).toBeGreaterThan(0)
    expect(a.meldungen.length).toBe(0)
  })
  it('meldet höchstens alle zwei Minuten', () => {
    const a = aufbau(); dreiSekunden(a.w)
    a.setzeZeit(60_000); dreiSekunden(a.w); expect(a.meldungen.length).toBe(1)
    a.setzeZeit(121_000); dreiSekunden(a.w); expect(a.meldungen.length).toBe(2)
  })
  it('verwirft eine angefangene Aufnahme beim Zurücksetzen', () => {
    const a = aufbau()
    for (let i = 0; i < 20; i++) a.w.ton(laut())
    a.w.zuruecksetzen()
    for (let i = 0; i < 5; i++) a.w.ton(leise())
    expect(a.stuecke.length).toBe(0)
  })
  it('ein Fehler im Modell stört nicht', () => {
    const notizen = []
    const w = erstelleNiesWache({ auswerten: () => { throw new Error('kaputt') }, melden: () => {}, notiz: (t) => notizen.push(t) })
    expect(() => dreiSekunden(w)).not.toThrow()
    expect(notizen[0]).toContain('kaputt')
  })
})
