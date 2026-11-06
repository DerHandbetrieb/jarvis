// Tests: Wetterwort im Ring (hud5/ringschrift.js) – nur, was die Station hergibt (06.11.2026)
import { describe, expect, it } from 'vitest'
import { wetterArt } from './ringschrift.js'

describe('Wetterwort im Ring', () => {
  it('ohne Daten nichts behaupten', () => { expect(wetterArt(undefined)[1]).toBe('KEINE DATEN') })
  it('Himmel nicht messbar: nur trocken, kein Sonnen- oder Mondsymbol', () => {
    expect(wetterArt(null, true)).toEqual(['trocken', 'TROCKEN'])
    expect(wetterArt(null, false)).toEqual(['trocken', 'TROCKEN'])
  })
  it('null wird nicht zu sonnig', () => { expect(wetterArt(null)[1]).not.toBe('SONNIG') })
  it('gleiche Worte wie Lokis Sätze', () => {
    expect(wetterArt(0)[1]).toBe('SONNIG')
    expect(wetterArt(1)[1]).toBe('SONNIG')
    expect(wetterArt(2)[1]).toBe('HEITER')
    expect(wetterArt(3)[1]).toBe('BEWÖLKT')
    expect(wetterArt(61)[1]).toBe('REGEN')
    expect(wetterArt(71)[1]).toBe('SCHNEE')
  })
})
