// Tests für das Live-Bild (electron/kameralive.cjs) mit nachgebautem Fenster (04.11.2026)
import { describe, expect, it, vi } from 'vitest'
import { createRequire } from 'node:module'

const { erstelleKameraLive, RUHE_MS } = createRequire(import.meta.url)('./kameralive.cjs')
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2])
function aufbau() {
  let zeit = 0
  const fenster = []
  const erstelleFenster = vi.fn((url) => {
    const f = { url, zu: false, webContents: {}, griffe: {}, isDestroyed: () => f.zu, close: () => { f.zu = true; f.griffe.closed?.() }, on: (n, fn) => { f.griffe[n] = fn } }
    fenster.push(f); return f
  })
  const live = erstelleKameraLive({ erstelleFenster, adresse: (s) => `app://jarvis/kamera-live.html?s=${s}`, jetzt: () => zeit })
  return { live, fenster, erstelleFenster, setze: (t) => { zeit = t } }
}

describe('Live-Bild der Kamera', () => {
  it('startet das Fenster erst bei Nachfrage, liefert nur frische Bilder nur vom eigenen Fenster', () => {
    vi.useFakeTimers()
    const { live, fenster, erstelleFenster, setze } = aufbau()
    expect(erstelleFenster).not.toHaveBeenCalled()
    expect(live.bild(0)).toBeNull()
    expect(fenster).toHaveLength(1)
    const s = new URL(fenster[0].url).searchParams.get('s')
    expect(live.erlaubt(s)).toBe(true)
    expect(live.erlaubt('falsch')).toBe(false)
    live.empfangen({}, 0, JPEG) // fremder Absender
    expect(live.bild(0)).toBeNull()
    live.empfangen(fenster[0].webContents, 0, new Uint8Array([1, 2, 3, 4])) // kein JPEG
    expect(live.bild(0)).toBeNull()
    live.empfangen(fenster[0].webContents, 0, JPEG)
    expect(Buffer.from(live.bild(0))).toEqual(Buffer.from(JPEG))
    expect(live.bild(2)).toBeNull()
    setze(5000)
    expect(live.bild(0)).toBeNull() // zu alt
    expect(erstelleFenster).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
  it('bildNach: wartet auf das nächste Bild, liefert es mit Nummer, sofort wenn schon neuer', async () => {
    const { live, fenster } = aufbau()
    const warten = live.bildNach(0, 0)
    live.empfangen(fenster[0].webContents, 0, JPEG)
    expect(await warten).toMatchObject({ nr: 1 })
    expect(await live.bildNach(0, 0)).toMatchObject({ nr: 1 }) // schon neuer als 0 → sofort
    expect(await live.bildNach(0, 7)).toMatchObject({ nr: 1 }) // Wallpaper „voraus“ (Loki neu gestartet) → aktuelles Bild
    const zweites = live.bildNach(0, 1)
    live.empfangen(fenster[0].webContents, 0, JPEG)
    expect(await zweites).toMatchObject({ nr: 2 })
    live.stoppen()
  })
  it('schließt nach Ruhe und danach gilt der alte Schlüssel nicht mehr', () => {
    vi.useFakeTimers()
    const { live, fenster, setze } = aufbau()
    live.bild(1)
    const s = new URL(fenster[0].url).searchParams.get('s')
    setze(RUHE_MS + 1000)
    vi.advanceTimersByTime(3000)
    expect(fenster[0].zu).toBe(true)
    expect(live._laeuft()).toBe(false)
    expect(live.erlaubt(s)).toBe(false)
    live.bild(1)
    expect(fenster).toHaveLength(2)
    live.stoppen()
    expect(fenster[1].zu).toBe(true)
    vi.useRealTimers()
  })
})
