// Tests der Bestellfrist (14.11.2026) – Beispiele aus der Werkstatt (docs/startseite.md Abschnitt 2)
import { describe, expect, it } from 'vitest'
import { einordnen, feiertageBW, fristFuer, tagKurz } from './frist.js'

const um = (tag, uhr = '10:00') => new Date(`${tag}T${uhr}:00+01:00`).toISOString()

describe('Bestellfrist', () => {
  it('2 Zähltage, Sonntag zählt nicht', () => {
    expect(fristFuer(um('2026-11-16'))).toBe('2026-11-18') // Mo → Mi
    expect(fristFuer(um('2026-11-19'))).toBe('2026-11-21') // Do → Sa
    expect(fristFuer(um('2026-11-20'))).toBe('2026-11-23') // Fr → Mo
    expect(fristFuer(um('2026-11-21'))).toBe('2026-11-24') // Sa → Di
    expect(fristFuer(um('2026-11-22'))).toBe('2026-11-24') // So → Di
  })
  it('Feiertage BW zählen nicht', () => {
    expect(fristFuer(um('2026-12-23'))).toBe('2026-12-28')
    expect(feiertageBW(2026)).toContain('2026-04-03') // Karfreitag
    expect(feiertageBW(2026)).toContain('2026-06-04') // Fronleichnam
  })
  it('deutsche Zeit: kurz nach Mitternacht zählt der neue Tag', () => {
    expect(fristFuer('2026-11-15T23:30:00Z')).toBe('2026-11-18') // = Mo 16.11. 00:30 in Deutschland
  })
  it('einordnen: überfällig, heute, später', () => {
    const jetzt = new Date(um('2026-11-18', '10:30'))
    expect(einordnen({ am: um('2026-11-13'), kanal: 'Amazon' }, jetzt).gruppe).toBe('ueberfaellig') // Fr → Mo
    expect(einordnen({ am: um('2026-11-16'), kanal: 'Etsy' }, jetzt).gruppe).toBe('heute')
    expect(einordnen({ am: um('2026-11-17'), kanal: 'Etsy' }, jetzt)).toEqual({ gruppe: 'spaeter', frist: '2026-11-19' })
  })
  it('eigener Shop: Frist ab Zahlung; ohne Zahlungsangabe ab Bestelltag', () => {
    const jetzt = new Date(um('2026-11-18', '10:30'))
    expect(einordnen({ am: um('2026-11-13'), kanal: 'Eigener Shop', bezahlt: null }, jetzt).gruppe).toBe('zahlung')
    expect(einordnen({ am: um('2026-11-13'), kanal: 'Eigener Shop', bezahlt: um('2026-11-17') }, jetzt).frist).toBe('2026-11-19')
    expect(einordnen({ am: um('2026-11-13'), kanal: 'Eigener Shop' }, jetzt).gruppe).toBe('ueberfaellig')
    expect(einordnen({ am: um('2026-11-13'), kanal: 'Amazon', bezahlt: um('2026-11-17') }, jetzt).gruppe).toBe('ueberfaellig') // Marktplatz: Bestelltag
  })
  it('Kurzform', () => { expect(tagKurz('2026-11-17')).toBe('DI 17.11.') })
})

describe('Bestellfeld bei vielen Bestellungen (Prüf-Agent 14.11.2026)', async () => {
  const { bestellPlan } = await import('./inhalte.js')
  const jetzt = new Date(um('2026-11-18', '10:30'))
  const viele = (tag, n) => Array.from({ length: n }, (_, i) => ({ am: um(tag), kanal: 'Etsy', artikel: `Artikel ${i}`, cent: 100 }))
  it('alle drei Abschnitte bleiben sichtbar, Rest als „weitere“', () => {
    const plan = bestellPlan([...viele('2026-11-13', 10), ...viele('2026-11-16', 10), ...viele('2026-11-17', 10)], jetzt, 274)
    expect(plan.gruppen.map((g) => g.art)).toEqual(['ueberfaellig', 'heute', 'spaeter'])
    expect(plan.weg).toBe(0)
    const gezeigt = plan.gruppen.flatMap((g) => g.zeilen).reduce((s, z) => s + (z.x ? 1 : z.teil.length), 0)
    expect(gezeigt).toBe(30)
    const hoehe = plan.gruppen.reduce((s, g) => s + 20 + g.zeilen.length * 24 + 6, 0)
    expect(hoehe).toBeLessThanOrEqual(274)
  })
  it('wenige Bestellungen: jede eine Zeile', () => {
    const plan = bestellPlan(viele('2026-11-17', 3), jetzt, 274)
    expect(plan.gruppen[0].zeilen.every((z) => z.x)).toBe(true)
  })
})
