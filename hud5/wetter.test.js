// Tests: Wettereffekte nach der eigenen Wetterstation (05.11.2026) – die Station hat Vorrang vor der Vorhersage
import { describe, expect, it } from 'vitest'
import { wetterArt } from './wetter.js'

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
  it('Nebel bei gesättigter Luft und Windstille', () => {
    expect(wetterArt({ code: 2, grad: 4, station: { grad: 4, regenRate: 0, feuchte: 98, wind: 1 } }).art).toBe('nebel')
  })
  it('ohne Station gilt weiter die Vorhersage', () => {
    expect(wetterArt({ code: 63, grad: 9 }).art).toBe('regen')
  })
})
