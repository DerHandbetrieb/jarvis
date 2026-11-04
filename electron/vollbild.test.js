// Tests für die Vollbild-Erkennung (electron/vollbild.cjs), 04.11.2026
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const { erstelleEntscheider } = createRequire(import.meta.url)('./vollbild.cjs')

describe('Vollbild-Spiel erkennen', () => {
  it('erst nach 60 s Vollbild am Stück, zurück sofort; kurzes Vollbild löst nichts aus', () => {
    let zeit = 0
    const e = erstelleEntscheider({ jetzt: () => zeit })
    expect(e(5)).toBeNull()
    zeit = 10_000; expect(e(3)).toBeNull()
    zeit = 40_000; expect(e(5)).toBeNull() // nur 30 s Vollbild
    zeit = 50_000; expect(e(2)).toBeNull()
    zeit = 100_000; expect(e(2)).toBeNull()
    zeit = 110_000; expect(e(3)).toBe(true) // 60 s am Stück (2 und 3 zählen beide)
    zeit = 120_000; expect(e(3)).toBeNull()
    zeit = 130_000; expect(e(5)).toBe(false)
    expect(e(5)).toBeNull()
    expect(e(Number.NaN)).toBeNull()
  })
})
