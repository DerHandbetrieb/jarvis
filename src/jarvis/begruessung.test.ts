import { describe, expect, it } from 'vitest'
import { BEGRUESSUNGEN, begruessung, sequenzGruss, waehleBegruessung } from './begruessung'

describe('Begrüßung beim Rechnerstart', () => {
  it('nie zweimal hintereinander dieselbe', () => {
    for (let letzte = 0; letzte < BEGRUESSUNGEN.length; letzte++) {
      for (const zufall of [0, 0.1, 0.5, 0.9, 0.999999]) {
        const nr = waehleBegruessung(letzte, zufall)
        expect(nr).not.toBe(letzte)
        expect(nr).toBeGreaterThanOrEqual(0)
        expect(nr).toBeLessThan(BEGRUESSUNGEN.length)
      }
    }
  })
  it('jede Begrüßung kann vorkommen, auch ohne vorherige', () => {
    const gesehen = new Set<number>()
    for (let i = 0; i < 1000; i++) gesehen.add(waehleBegruessung(-1, i / 1000))
    expect(gesehen.size).toBe(BEGRUESSUNGEN.length)
    const nachDrei = new Set<number>()
    for (let i = 0; i < 1000; i++) nachDrei.add(waehleBegruessung(3, i / 1000))
    expect(nachDrei.size).toBe(BEGRUESSUNGEN.length - 1)
  })
  it('Anrede wird eingesetzt, ohne Humor sachlich', () => {
    for (let i = 0; i < BEGRUESSUNGEN.length; i++) expect(begruessung(i, 'Chef', true)).toContain('Chef')
    expect(begruessung(0, '', false)).toBe('Willkommen zurück, Sir. Alle Systeme sind bereit.')
  })
  it('Spruch der Start-Sequenz beginnt immer mit „Willkommen zurück“, nie doppelt', () => {
    for (let i = 0; i < BEGRUESSUNGEN.length; i++) {
      const s = sequenzGruss(i, 'Sir', true)
      expect(s.startsWith('Willkommen zurück, Sir.')).toBe(true)
      expect(s.match(/Willkommen zurück/g)!.length).toBe(1)
    }
    expect(sequenzGruss(0, '', false)).toBe('Willkommen zurück, Sir. Alle Systeme sind bereit.')
  })
  it('kurz genug zum Vorlesen (ein bis drei Sätze)', () => {
    for (const b of BEGRUESSUNGEN) expect(b('Sir').length).toBeLessThan(160)
  })
})
