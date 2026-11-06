import { describe, expect, it } from 'vitest'
import { amazonArtikel, ohneLangeNummern } from './sprechtext'

describe('keine langen Nummern beim Vorlesen', () => {
  it('nimmt Fallnummern und Bestellnummern heraus', () => {
    expect(ohneLangeNummern('Fall 1234567890 Wandregal Eiche')).toBe('Wandregal Eiche')
    expect(ohneLangeNummern('Bestellung 306-1234567-1234567 ist offen.')).toBe('Bestellung ist offen.')
    expect(ohneLangeNummern('Prüfen, Nr. 998877665 wartet')).toBe('Prüfen, wartet')
    expect(ohneLangeNummern('Artikel B0ABCDEF12 fehlt')).toBe('Artikel fehlt')
  })
  it('lässt kurze Zahlen und Beträge in Ruhe', () => {
    expect(ohneLangeNummern('2 mal Regal 80 cm für 1234 Euro im Jahr 2026.')).toBe('2 mal Regal 80 cm für 1234 Euro im Jahr 2026.')
  })
  it('Sonderfälle', () => {
    expect(ohneLangeNummern('Fall Nr. 123456 Tasse')).toBe('Tasse')
    expect(ohneLangeNummern('1234567,50 Euro Umsatz')).toBe('1234567,50 Euro Umsatz')
    expect(ohneLangeNummern('Stand 2026-11-06')).toBe('Stand 2026-11-06')
    expect(ohneLangeNummern('Fall 1234567')).toBe('')
  })
  it('Amazon-Fall: nur der Artikel bleibt', () => {
    expect(amazonArtikel('Amazon-Problem: Fall 1234567890 Klettertasse')).toBe('Klettertasse')
    expect(amazonArtikel('Amazon-Problem: Fall 1234567890')).toBe('')
  })
})
