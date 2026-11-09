// Tests für den Lautstärke-Regler im Audiofeld (hud5/inhalte.js), 09.11.2026
import { describe, expect, it } from 'vitest'
import { LAUT_ART, LAUT_BREITE, lautAusPunkt, lautFlaeche, lautGebremst } from './inhalte.js'

const H = 140
describe('Lautstärke-Regler: Punkt → Wert', () => {
  it('D: Keil von 0 bis 100, begrenzt', () => {
    expect(lautAusPunkt(56, 90, H, 50, false, 'd')).toBe(0)
    expect(lautAusPunkt(113, 90, H, 50, false, 'd')).toBe(50)
    expect(lautAusPunkt(170, 90, H, 50, false, 'd')).toBe(100)
    expect(lautAusPunkt(174, 90, H, 50, false, 'd')).toBe(100)
  })
  it('D: Minus und Plus wirken in 5er-Schritten nur beim Drücken, nie über die Grenzen', () => {
    expect(lautAusPunkt(34, 110, H, 50, false, 'd')).toBe(45)
    expect(lautAusPunkt(192, 110, H, 50, false, 'd')).toBe(55)
    expect(lautAusPunkt(34, 110, H, 3, false, 'd')).toBe(0)
    expect(lautAusPunkt(192, 110, H, 98, false, 'd')).toBe(100)
    expect(lautAusPunkt(34, 110, H, 50, true, 'd')).toBeNull()
    expect(lautAusPunkt(192, 110, H, 50, true, 'd')).toBeNull()
  })
  it('A, B, C: Enden und Mitte', () => {
    expect(lautAusPunkt(40, 124, H, 0, false, 'a')).toBe(0)
    expect(lautAusPunkt(40, 44, H, 0, false, 'a')).toBe(100)
    expect(lautAusPunkt(22, 90, H, 0, false, 'b')).toBe(0)
    expect(lautAusPunkt(198, 90, H, 0, false, 'b')).toBe(100)
    expect(lautAusPunkt(64, 40, H, 0, false, 'c')).toBe(50) // oben auf dem Ring
  })
  it('ein Klick hebt höchstens um 25 Punkte, nach unten frei', () => {
    expect(lautGebremst(100, 8)).toBe(33)
    expect(lautGebremst(20, 8)).toBe(20)
    expect(lautGebremst(100, 90)).toBe(100)
    expect(lautGebremst(0, 90)).toBe(0)
    expect(lautGebremst(70, null)).toBe(70)
  })
  it('die Klickfläche liegt im reservierten Platz links', () => {
    const f = lautFlaeche(H)
    expect(f.x).toBeGreaterThanOrEqual(0)
    expect(f.x + f.b).toBeLessThanOrEqual(16 + LAUT_BREITE[LAUT_ART])
    expect(f.y + f.h).toBeLessThanOrEqual(H)
  })
})
