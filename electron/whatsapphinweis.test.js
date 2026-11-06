// Tests für den WhatsApp-Hinweis (electron/whatsapphinweis.cjs), 06.11.2026
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const { zeileAuswerten, SKRIPT } = createRequire(import.meta.url)('./whatsapphinweis.cjs')

describe('WhatsApp-Hinweis', () => {
  it('liest die Anzahl, kaputte Zeilen und -1 gelten als nicht lesbar', () => {
    expect(zeileAuswerten('0')).toBe(0)
    expect(zeileAuswerten(' 3\r')).toBe(3)
    expect(zeileAuswerten('-1')).toBeNull()
    expect(zeileAuswerten('')).toBeNull()
    expect(zeileAuswerten('Fehler')).toBeNull()
  })
  it('fasst Inhalt und Absender der Mitteilungen nie an', () => {
    expect(SKRIPT).not.toMatch(/GetTextElements|GetBinding|\.Visual|\.Notification\b/)
  })
})
