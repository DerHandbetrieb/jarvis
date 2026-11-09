// Tests für die Windows-Lautstärke (electron/lautstaerke.cjs), 09.11.2026
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import { EventEmitter } from 'node:events'

const { erstelleLautstaerke } = createRequire(import.meta.url)('./lautstaerke.cjs')

function falscherStart() {
  const gestartet = []
  const starte = () => {
    const p = new EventEmitter(); p.exitCode = null; p.killed = false; p.geschrieben = []
    p.stdout = new EventEmitter(); p.stderr = new EventEmitter()
    p.stdin = { writable: true, write: (z) => p.geschrieben.push(z), end() {} }; p.kill = () => { p.killed = true }
    gestartet.push(p); return p
  }
  return { starte, gestartet }
}

describe('Lautstärke', () => {
  it('liest und setzt, Antworten kommen dem richtigen Auftrag zu, auch stückweise', async () => {
    const f = falscherStart(), l = erstelleLautstaerke({ starte: f.starte })
    const a = l.lesen(), b = l.setzen(40)
    expect(f.gestartet).toHaveLength(1)
    await Promise.resolve()
    expect(f.gestartet[0].geschrieben).toEqual(['?\n', '40\n'])
    f.gestartet[0].stdout.emit('data', '72 0\r\n4')
    f.gestartet[0].stdout.emit('data', '0 1\r\n')
    expect(await a).toEqual({ wert: 72, stumm: false })
    expect(await b).toEqual({ wert: 40, stumm: true })
  })
  it('lehnt alles außer ganzen Zahlen von 0 bis 100 ab und schickt nichts', async () => {
    const f = falscherStart(), l = erstelleLautstaerke({ starte: f.starte })
    for (const n of [-1, 101, 5.5, '50', NaN, null]) expect(await l.setzen(n)).toBeNull()
    expect(f.gestartet).toHaveLength(0)
  })
  it('meldet „F“ als null, behält aber den letzten guten Stand für die Zeitgrenze', async () => {
    const f = falscherStart(), l = erstelleLautstaerke({ starte: f.starte, zeitgrenze: 10 })
    const a = l.lesen(); f.gestartet[0].stdout.emit('data', '30 0\n'); await a
    const b = l.lesen(); f.gestartet[0].stdout.emit('data', 'F\n')
    expect(await b).toBeNull()
    expect(await l.lesen()).toEqual({ wert: 30, stumm: false }) // keine Antwort → Zeitgrenze
  })
  it('eine späte Antwort landet nicht beim nächsten Auftrag', async () => {
    const f = falscherStart(), l = erstelleLautstaerke({ starte: f.starte, zeitgrenze: 5 })
    expect(await l.lesen()).toBeNull() // Zeitgrenze, noch nichts bekannt
    const b = l.setzen(50)
    f.gestartet[0].stdout.emit('data', '10 0\n50 0\n')
    expect(await b).toEqual({ wert: 50, stumm: false })
  })
  it('nach drei Zeitüberschreitungen wird das Programm neu gestartet; setzen meldet dann null', async () => {
    const f = falscherStart(), l = erstelleLautstaerke({ starte: f.starte, zeitgrenze: 2 })
    const a = l.lesen(); f.gestartet[0].stdout.emit('data', '30 0\n'); await a
    expect(await l.setzen(50)).toBeNull()
    expect(await l.lesen()).toEqual({ wert: 30, stumm: false })
    expect(await l.lesen()).toEqual({ wert: 30, stumm: false })
    expect(f.gestartet[0].killed).toBe(true)
    const b = l.lesen()
    expect(f.gestartet).toHaveLength(2)
    f.gestartet[1].stdout.emit('data', '31 0\n')
    expect(await b).toEqual({ wert: 31, stumm: false })
  })
  it('startet nach dem Ende neu und lässt niemanden hängen', async () => {
    const f = falscherStart(), l = erstelleLautstaerke({ starte: f.starte, zeitgrenze: 5000 })
    const a = l.lesen()
    f.gestartet[0].exitCode = 1; f.gestartet[0].emit('exit')
    expect(await a).toBeNull()
    void l.lesen()
    expect(f.gestartet).toHaveLength(2)
    l.beenden()
  })
})
