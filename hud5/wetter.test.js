// Tests: Wettereffekte nach der eigenen Wetterstation (05.11.2026) – die Station hat Vorrang vor der Vorhersage
import { describe, expect, it } from 'vitest'
import { wetterArt } from './wetter.js'

describe('Gewitter und Hagel', () => {
  it('kommen aus dem Wettercode', () => {
    expect(wetterArt({ code: 95, grad: 15 })).toMatchObject({ gewitter: true, hagel: false })
    expect(wetterArt({ code: 99, grad: 12 })).toMatchObject({ gewitter: true, hagel: true })
    expect(wetterArt({ code: 2, grad: 12 })).toMatchObject({ gewitter: false, hagel: false })
  })
  it('bleiben auch mit Wetterstation erhalten', () => { expect(wetterArt({ code: 96, grad: 14, station: { grad: 14, regenRate: 4 } })).toMatchObject({ art: 'regen', gewitter: true, hagel: true }) })
})

describe('Wettereffekte nach der Wetterstation', () => {
  it('Regen nur, wenn die Station Regen misst', () => {
    expect(wetterArt({ code: 2, grad: 6, station: { grad: 6, regenRate: 3.5 } }).art).toBe('regen')
    expect(wetterArt({ code: 63, grad: 9, station: { grad: 9, regenRate: 0, feuchte: 70, wind: 8 } }).art).toBeNull()
  })
  it('Niederschlag bei höchstens 1 °C wird Schnee', () => {
    expect(wetterArt({ code: 2, grad: 0.4, station: { grad: 0.4, regenRate: 1.2 } }).art).toBe('schnee')
  })
  it('Frost nach der gemessenen Temperatur', () => {
    expect(wetterArt({ code: 2, grad: -3, station: { grad: -3, regenRate: 0 } }).frost).toBe(true)
  })
  it('Nebel wird nicht aus Feuchte und Wind geschätzt', () => {
    expect(wetterArt({ code: 2, grad: 4, station: { grad: 4, regenRate: 0, feuchte: 98, wind: 1 } }).art).toBeNull()
  })
  it('ohne Stationswerte zählt der übergebene Code', () => {
    expect(wetterArt({ code: 63, grad: 9 }).art).toBe('regen')
  })
})
