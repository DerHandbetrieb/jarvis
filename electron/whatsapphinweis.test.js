// Tests für den WhatsApp-Hinweis (electron/whatsapphinweis.cjs), 06.11.2026
import { describe, expect, it, vi } from 'vitest'
import { createRequire } from 'node:module'

const { badgeAuswerten, zeilenAuswerten, ueberwachen, ABFRAGE } = createRequire(import.meta.url)('./whatsapphinweis.cjs')

describe('WhatsApp-Hinweis', () => {
  it('liest die Zahl aus dem Badge', () => {
    expect(badgeAuswerten('<badge value="1"/>')).toBe(1)
    expect(badgeAuswerten('<badge version="1" value="12" />')).toBe(12)
    expect(badgeAuswerten('<badge value="none"/>')).toBe(0)
    expect(badgeAuswerten('<badge value="attention"/>')).toBe(1)
    expect(badgeAuswerten('Unsinn')).toBeNull()
  })
  it('kein Eintrag heißt nichts ungelesen', () => {
    expect(zeilenAuswerten([])).toBe(0)
    expect(zeilenAuswerten([{ inhalt: '<badge value="2"/>' }])).toBe(2)
    expect(zeilenAuswerten([{ inhalt: 'Unsinn' }])).toBeNull()
  })
  it('fragt nur Badge-Einträge von WhatsApp ab', () => {
    expect(ABFRAGE).toContain("n.Type = 'badge'")
    expect(ABFRAGE).toContain('5319275A.WhatsAppDesktop')
  })
  it('meldet nur Änderungen, kurze Sperren der Datenbank zeigen nichts an', () => {
    vi.useFakeTimers()
    const gemeldet = []
    let wert = 1, sperre = false
    const stopp = ueberwachen((n) => gemeldet.push(n), { protokoll: () => {}, lies: () => { if (sperre) throw new Error('locked'); return wert } })
    vi.advanceTimersByTime(9000)
    wert = 0; vi.advanceTimersByTime(9000)
    sperre = true; vi.advanceTimersByTime(18_000)
    expect(gemeldet).toEqual([1, 0])
    vi.advanceTimersByTime(9000)
    expect(gemeldet).toEqual([1, 0, null])
    sperre = false; vi.advanceTimersByTime(9000)
    expect(gemeldet).toEqual([1, 0, null, 0])
    stopp(); vi.useRealTimers()
  })
})
