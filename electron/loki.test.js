// Tests für die Verbindung zu Lokis Stimme (electron/loki.cjs) mit einem nachgebauten Python-Programm (03.11.2026)
import { describe, expect, it, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { createRequire } from 'node:module'

const { erstelleLoki, satzZeit } = createRequire(import.meta.url)('./loki.cjs')
const SKRIPT = new URL('../stimme/loki_stimme.py', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

/** Nachgebautes Stimm-Programm: merkt sich Aufträge, antwortet nur, wenn der Test es sagt */
function falschesProgramm() {
  const p = new EventEmitter()
  p.stdin = new PassThrough(); p.stdout = new PassThrough(); p.stderr = new PassThrough()
  p.auftraege = []
  p.stdin.on('data', (d) => String(d).split('\n').filter(Boolean).forEach((z) => p.auftraege.push(JSON.parse(z))))
  p.sende = (d) => p.stdout.write(JSON.stringify(d) + '\n')
  p.kill = vi.fn(() => p.emit('exit', null))
  return p
}
const warte = () => new Promise((w) => setTimeout(w, 10))

/** je Start ein neues nachgebautes Programm; p = das erste (schon vorab angelegt), programme = alle gestarteten */
function aufbauen(python = 'python.exe') {
  const p = falschesProgramm()
  const programme = []
  const starten = vi.fn(() => { const neu = programme.length ? falschesProgramm() : p; programme.push(neu); return neu })
  const loki = erstelleLoki({ python: () => python, skript: SKRIPT, starten })
  return { p, programme, starten, loki }
}

describe('Lokis Stimme (Verbindung)', () => {
  it('fehlt, wenn keine Python-Umgebung eingerichtet ist', () => {
    const { loki, starten } = aufbauen(null)
    loki.starten()
    expect(loki.status().zustand).toBe('fehlt')
    expect(starten).not.toHaveBeenCalled()
  })

  it('lädt, wird bereit und liefert den Ton als Zahlen', async () => {
    const { p, loki, starten } = aufbauen()
    loki.starten(); loki.starten() // doppelt starten startet nur einmal
    expect(starten).toHaveBeenCalledTimes(1)
    expect(loki.status().zustand).toBe('laedt')
    await expect(loki.sprechen('zu früh')).rejects.toThrow()
    p.sende({ bereit: true, sekunden: 12 })
    await warte()
    expect(loki.status().zustand).toBe('bereit')
    const antwort = loki.sprechen('Sehr wohl, Sir. Grüße an Emma.')
    await warte()
    expect(p.auftraege[0].text).toBe('Sehr wohl, Sir. Grüße an Emma.')
    const ton = new Float32Array([0.5, -0.25, 0])
    p.sende({ id: p.auftraege[0].id, sr: 24000, ton: Buffer.from(ton.buffer).toString('base64') })
    const a = await antwort
    expect(a.sampleRate).toBe(24000)
    expect(Array.from(a.samples)).toEqual([0.5, -0.25, 0])
  })

  it('ordnet Antworten der richtigen Anfrage zu und meldet Fehler je Satz', async () => {
    const { p, loki } = aufbauen()
    loki.starten(); p.sende({ bereit: true }); await warte()
    const eins = loki.sprechen('eins'), zwei = loki.sprechen('zwei')
    await warte()
    p.sende({ id: p.auftraege[1].id, sr: 24000, ton: '' })
    p.sende({ id: p.auftraege[0].id, fehler: 'kaputt' })
    await expect(eins).rejects.toThrow('kaputt')
    expect((await zwei).samples.length).toBe(0)
  })

  it('bricht offene Sätze ab, wenn das Programm abstürzt, und kann neu starten', async () => {
    const { p, loki, starten } = aufbauen()
    loki.starten(); p.sende({ bereit: true }); await warte()
    const satz = loki.sprechen('hallo')
    p.emit('exit', 1)
    await expect(satz).rejects.toThrow()
    expect(loki.status().zustand).toBe('fehler')
    loki.starten()
    expect(starten).toHaveBeenCalledTimes(2)
  })

  it('meldet einen Ladefehler des Programms', async () => {
    const { p, loki } = aufbauen()
    loki.starten(); p.sende({ fehler: 'CUDA fehlt' }); await warte()
    expect(loki.status()).toEqual({ zustand: 'fehler', fehler: 'CUDA fehlt' })
  })

  it('beenden gibt alles frei und zählt nicht als Störung', async () => {
    const { p, loki } = aufbauen()
    loki.starten(); p.sende({ bereit: true }); await warte()
    loki.beenden()
    expect(p.kill).toHaveBeenCalled()
    expect(loki.status().zustand).toBe('aus')
  })

  it('hängt ein Satz, wird die Stimme beendet und einmal neu gestartet – Piper übernimmt solange', async () => {
    vi.useFakeTimers()
    try {
      const { p, programme, loki } = aufbauen()
      loki.starten(); p.sende({ bereit: true }); await vi.advanceTimersByTimeAsync(10)
      const satz = loki.sprechen('Sehr wohl.')
      const fertig = expect(satz).rejects.toThrow('antwortet nicht')
      await vi.advanceTimersByTimeAsync(satzZeit('Sehr wohl.') + 1)
      await fertig
      expect(loki.status().zustand).toBe('fehler')
      expect(p.kill).toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(3_100)
      expect(programme.length).toBe(2)
      expect(loki.status().zustand).toBe('laedt')
      // stürzt die neue Stimme schon beim Laden ab, gibt es keinen zweiten automatischen Neustart
      programme[1].emit('exit', 1)
      await vi.advanceTimersByTimeAsync(10_000)
      expect(programme.length).toBe(2)
    } finally { vi.useRealTimers() }
  })

  it('lädt sie zu lange, gilt das als Störung', async () => {
    vi.useFakeTimers()
    try {
      const { p, loki } = aufbauen()
      loki.starten()
      await vi.advanceTimersByTimeAsync(180_001)
      expect(loki.status().zustand).toBe('fehler')
      expect(p.kill).toHaveBeenCalled()
    } finally { vi.useRealTimers() }
  })

  it('ignoriert Reste des alten Programms nach Aus und Ein', async () => {
    const { programme, loki } = aufbauen()
    loki.starten(); loki.beenden(); loki.starten()
    programme[0].sende({ bereit: true })
    await warte()
    expect(loki.status().zustand).toBe('laedt')
    programme[1].sende({ bereit: true })
    await warte()
    expect(loki.status().zustand).toBe('bereit')
  })

  it('fehlt das Modell, heißt es „nicht eingerichtet“ statt Störung', async () => {
    const { p, loki } = aufbauen()
    loki.starten(); p.sende({ fehlt: 'Sprachmodell fehlt' }); await warte()
    expect(loki.status().zustand).toBe('fehlt')
    expect(p.kill).toHaveBeenCalled()
  })

  it('Wartezeit je Satz wächst mit der Länge, höchstens 60 s', () => {
    expect(satzZeit('kurz')).toBeLessThan(6_000)
    expect(satzZeit('x'.repeat(2000))).toBe(60_000)
  })

  it('startet je Einschalten nur einmal von selbst neu, auch wenn die neue Stimme vorher bereit war', async () => {
    vi.useFakeTimers()
    try {
      const { programme, loki } = aufbauen()
      loki.starten(); programme[0].sende({ bereit: true }); await vi.advanceTimersByTimeAsync(10)
      programme[0].emit('exit', 1)
      await vi.advanceTimersByTimeAsync(3_100)
      expect(programme.length).toBe(2)
      programme[1].sende({ bereit: true }); await vi.advanceTimersByTimeAsync(10)
      programme[1].emit('exit', 1)
      await vi.advanceTimersByTimeAsync(10_000)
      expect(programme.length).toBe(2)
      expect(loki.status().zustand).toBe('fehler')
      // Jarvis aus und wieder ein → wieder ein Neustart frei
      loki.beenden(); loki.starten(); programme[2].sende({ bereit: true }); await vi.advanceTimersByTimeAsync(10)
      programme[2].emit('exit', 1)
      await vi.advanceTimersByTimeAsync(3_100)
      expect(programme.length).toBe(4)
    } finally { vi.useRealTimers() }
  })

  it('Ausschalten während des Neustart-Weckers verhindert den Neustart', async () => {
    vi.useFakeTimers()
    try {
      const { programme, loki } = aufbauen()
      loki.starten(); programme[0].sende({ bereit: true }); await vi.advanceTimersByTimeAsync(10)
      programme[0].emit('exit', 1)
      loki.beenden()
      await vi.advanceTimersByTimeAsync(10_000)
      expect(programme.length).toBe(1)
      expect(loki.status().zustand).toBe('aus')
    } finally { vi.useRealTimers() }
  })

  it('Ende und Lade-Wecker des alten Programms stören das neue nach Aus und Ein nicht', async () => {
    vi.useFakeTimers()
    try {
      const { programme, loki } = aufbauen()
      loki.starten()
      await vi.advanceTimersByTimeAsync(100_000)
      loki.beenden(); loki.starten()
      programme[0].emit('exit', 1)
      await vi.advanceTimersByTimeAsync(90_000) // Lade-Wecker des alten Programms wäre jetzt abgelaufen
      expect(loki.status().zustand).toBe('laedt')
      expect(programme[1].kill).not.toHaveBeenCalled()
    } finally { vi.useRealTimers() }
  })
})
