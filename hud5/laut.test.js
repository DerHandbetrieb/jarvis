// Tests für den Lautstärke-Regler im Audiofeld (hud5/inhalte.js), 09.11.2026
import { describe, expect, it } from 'vitest'
import { LAUT_BREITE, lautAusPunkt, lautFlaeche, lautGebremst } from './inhalte.js'

const H = 140
describe('Lautstärke-Regler: Punkt → Wert', () => {
  it('Keil von 0 bis 100, begrenzt', () => {
    expect(lautAusPunkt(56, 50)).toBe(0)
    expect(lautAusPunkt(113, 50)).toBe(50)
    expect(lautAusPunkt(170, 50)).toBe(100)
    expect(lautAusPunkt(174, 50)).toBe(100)
  })
  it('Minus und Plus wirken in 5er-Schritten nur beim Drücken, nie über die Grenzen', () => {
    expect(lautAusPunkt(34, 50)).toBe(45)
    expect(lautAusPunkt(192, 50)).toBe(55)
    expect(lautAusPunkt(34, 3)).toBe(0)
    expect(lautAusPunkt(192, 98)).toBe(100)
    expect(lautAusPunkt(34, 50, true)).toBeNull()
    expect(lautAusPunkt(192, 50, true)).toBeNull()
  })
  it('ein Klick hebt höchstens um 25 Punkte, nach unten frei', () => {
    expect(lautGebremst(100, 8)).toBe(33)
    expect(lautGebremst(20, 8)).toBe(20)
    expect(lautGebremst(100, 90)).toBe(100)
    expect(lautGebremst(0, 90)).toBe(0)
    expect(lautGebremst(70, null)).toBe(70)
  })
  it('die Klickfläche deckt Plus und Minus und bleibt im reservierten Platz', () => {
    const f = lautFlaeche(H)
    expect(f.x).toBeLessThanOrEqual(34 - 15)
    expect(f.x + f.b).toBeGreaterThanOrEqual(192 + 15)
    expect(f.x + f.b).toBeLessThanOrEqual(16 + LAUT_BREITE)
    expect(f.y + f.h).toBeLessThanOrEqual(H)
  })
})
