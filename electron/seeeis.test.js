// Tests für den zugefrorenen See (electron/seeeis.cjs), 06.11.2026
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const { eisStufe } = createRequire(import.meta.url)('./seeeis.cjs')

describe('See friert zu', () => {
  it('ein oder zwei kalte Tage reichen nicht für den ganzen See', () => {
    expect(eisStufe([5, 4, -1])).toBe(0)
    expect(eisStufe([5, -1, -2])).toBe(0.5)
    expect(eisStufe([5, -1, -2, -3])).toBe(1)
  })
  it('nur durchgehender Frost zählt; gefrorenes Eis übersteht einen knappen Plustag, ein milder Tag taut an', () => {
    expect(eisStufe([-1, 1, -2])).toBe(0)
    expect(eisStufe([-1, -2, 0.5, -3])).toBe(0)
    expect(eisStufe([-1, -2, -3, 0.5, -4])).toBe(1)
    expect(eisStufe([-1, -2, -3, -4, 6])).toBe(0.5)
    expect(eisStufe([-1, -2, -3, -4, 6, 7])).toBe(0)
  })
  it('kommt ohne Daten aus', () => {
    expect(eisStufe(null)).toBe(0)
    expect(eisStufe([null, null])).toBe(0)
  })
})
