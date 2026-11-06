// Tests: Wetter allein aus der eigenen Station (electron/himmel.cjs), 06.11.2026
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const { wetterAusStation, klarhimmel } = createRequire(import.meta.url)('./himmel.cjs')
const MITTAG = Date.UTC(2026, 10, 6, 12, 30), NACHT = Date.UTC(2026, 10, 6, 22, 0)
const station = (x, zeit = MITTAG) => ({ grad: 7, regenRate: 0, sonne: 295, feuchte: 71, wind: 7, zeit, ...x })
const code = (st, t = MITTAG) => wetterAusStation(st, t).code

describe('Wetter aus der Station', () => {
  it('Fall vom 06.11.2026: trocken mit voller Sonne = sonnig', () => {
    expect(wetterAusStation(station({}), MITTAG)).toMatchObject({ code: 0, grad: 7 })
  })
  it('Klarhimmel-Wert passt zur Messung bei voller Sonne', () => {
    expect(klarhimmel(MITTAG)).toBeGreaterThan(300)
    expect(klarhimmel(MITTAG)).toBeLessThan(380)
    expect(klarhimmel(NACHT)).toBeNull()
  })
  it('der Himmel folgt der gemessenen Sonne', () => {
    expect(code(station({ sonne: 200 }))).toBe(1)
    expect(code(station({ sonne: 140 }))).toBe(2)
    expect(code(station({ sonne: 40 }))).toBe(3)
  })
  it('nachts behauptet er nichts über den Himmel', () => {
    expect(code(station({ sonne: 0 }, NACHT), NACHT)).toBeNull()
  })
  it('Regen nur, wenn die Station ihn misst, die Stärke nach der Regenrate', () => {
    expect(code(station({ regenRate: 1, sonne: 30 }))).toBe(61)
    expect(code(station({ regenRate: 3, sonne: 30 }))).toBe(63)
    expect(code(station({ regenRate: 9, sonne: 30 }))).toBe(65)
    expect(code(station({ regenRate: 1, sonne: 0 }, NACHT), NACHT)).toBe(61)
  })
  it('gemessener Niederschlag bei Kälte = Schnee', () => {
    expect(code(station({ grad: 0.5, regenRate: 1, sonne: 20 }))).toBe(71)
  })
  it('Nebel wird nicht geschätzt: hohe Feuchte und Windstille allein ändern nichts', () => {
    expect(code(station({ feuchte: 98, wind: 1 }))).toBe(0)
    expect(code(station({ feuchte: 98, wind: 1, sonne: 0 }, NACHT), NACHT)).toBeNull()
  })
  it('ohne Regenmessung wird nachts nichts behauptet, tags zählt die Sonne', () => {
    expect(code(station({ regenRate: null, sonne: 0 }, NACHT), NACHT)).toBeUndefined()
    expect(code(station({ regenRate: null }))).toBe(0)
  })
  it('die Messzeit der Station zählt, nicht die Zeit der Abfrage', () => {
    expect(wetterAusStation(station({ gemessen: MITTAG - 16 * 60_000 }), MITTAG)).toBeNull()
    expect(wetterAusStation(station({ gemessen: MITTAG - 60_000 }), MITTAG)).not.toBeNull()
  })
  it('reicht die Messwerte für Lokis Antworten weiter', () => {
    expect(wetterAusStation(station({ boe: 9, regenHeute: 2 }), MITTAG)).toMatchObject({ wind: 7, boe: 9, feuchte: 71, regenRate: 0, regenHeute: 2 })
  })
  it('ohne frische Station gibt es keine Wetterangabe', () => {
    expect(wetterAusStation(station({}, MITTAG - 16 * 60_000), MITTAG)).toBeNull()
    expect(wetterAusStation(null, MITTAG)).toBeNull()
    expect(wetterAusStation(station({ grad: null }), MITTAG)).toBeNull()
  })
})
