// Tests der Bestellfrist – feste Regel des Auftraggebers vom 20.11.2026: nächster DHL-Abholtag (Mo/Mi/Fr) nach dem Bestelltag,
// Feiertage bewusst nicht berücksichtigt
import { describe, expect, it } from 'vitest'
import { einordnen, fristFuer, naechsteAbholung, tagKurz } from './frist.js'

const um = (tag, uhr = '10:00') => new Date(`${tag}T${uhr}:00+01:00`).toISOString()

describe('Bestellfrist', () => {
  it('Mo → Mi, Di → Mi, Mi → Fr, Do → Fr, Fr/Sa/So → Mo', () => {
    expect(fristFuer(um('2026-11-16'))).toBe('2026-11-18') // Mo → Mi
    expect(fristFuer(um('2026-11-17'))).toBe('2026-11-18') // Di → Mi
    expect(fristFuer(um('2026-11-18'))).toBe('2026-11-20') // Mi → Fr
    expect(fristFuer(um('2026-11-19'))).toBe('2026-11-20') // Do → Fr
    expect(fristFuer(um('2026-11-20'))).toBe('2026-11-23') // Fr → Mo
    expect(fristFuer(um('2026-11-21'))).toBe('2026-11-23') // Sa → Mo
    expect(fristFuer(um('2026-11-22'))).toBe('2026-11-23') // So → Mo
  })
  it('Feiertage zählen nicht anders (feste Regel das ganze Jahr)', () => {
    expect(fristFuer(um('2026-12-23'))).toBe('2026-12-25') // Mi → Fr, auch am 1. Weihnachtstag
  })
  it('deutsche Zeit: kurz nach Mitternacht zählt der neue Tag', () => {
    expect(fristFuer('2026-11-15T23:30:00Z')).toBe('2026-11-18') // = Mo 16.11. 00:30 in Deutschland
  })
  it('einordnen: überfällig, heute, später', () => {
    const jetzt = new Date(um('2026-11-18', '10:30')) // Mittwoch
    expect(einordnen({ am: um('2026-11-13'), kanal: 'Amazon' }, jetzt).gruppe).toBe('ueberfaellig') // Fr → Mo
    expect(einordnen({ am: um('2026-11-16'), kanal: 'Etsy' }, jetzt).gruppe).toBe('heute')
    expect(einordnen({ am: um('2026-11-17'), kanal: 'Etsy' }, jetzt).gruppe).toBe('heute')
    expect(einordnen({ am: um('2026-11-18'), kanal: 'Etsy' }, jetzt)).toEqual({ gruppe: 'spaeter', frist: '2026-11-20' })
  })
  it('eigener Shop: Frist ab Zahlung; ohne Zahlungsangabe ab Bestelltag', () => {
    const jetzt = new Date(um('2026-11-18', '10:30'))
    expect(einordnen({ am: um('2026-11-13'), kanal: 'Eigener Shop', bezahlt: null }, jetzt).gruppe).toBe('zahlung')
    expect(einordnen({ am: um('2026-11-13'), kanal: 'Eigener Shop', bezahlt: um('2026-11-18') }, jetzt).frist).toBe('2026-11-20')
    expect(einordnen({ am: um('2026-11-13'), kanal: 'Eigener Shop' }, jetzt).gruppe).toBe('ueberfaellig')
    expect(einordnen({ am: um('2026-11-13'), kanal: 'Amazon', bezahlt: um('2026-11-17') }, jetzt).gruppe).toBe('ueberfaellig') // Marktplatz: Bestelltag
  })
  it('nächste Abholung ab heute', () => {
    expect(naechsteAbholung(new Date(um('2026-11-18')))).toBe('2026-11-18')
    expect(naechsteAbholung(new Date(um('2026-11-21')))).toBe('2026-11-23')
  })
  it('Kurzform', () => { expect(tagKurz('2026-11-17')).toBe('DI 17.11.') })
})

describe('Bestellfeld bei vielen Bestellungen (Prüf-Agent 14.11.2026)', async () => {
  const { bestellPlan } = await import('./inhalte.js')
  const jetzt = new Date(um('2026-11-18', '10:30'))
  const viele = (tag, n) => Array.from({ length: n }, (_, i) => ({ am: um(tag), kanal: 'Etsy', artikel: `Artikel ${i}`, cent: 100 }))
  it('alle drei Abschnitte bleiben sichtbar, Rest als „weitere“', () => {
    const plan = bestellPlan([...viele('2026-11-13', 10), ...viele('2026-11-16', 10), ...viele('2026-11-18', 10)], jetzt, 274)
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
