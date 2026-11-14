// Tests für den PC-Status-Balken (14.11.2026)
import { describe, expect, it, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { erstellePcStatus, gpuZeile, obenZeile, cpuAnteil } = require('./pcstatus.cjs')

const kern = (user, idle) => ({ times: { user, nice: 0, sys: 0, idle, irq: 0 } })
function falschesKind() { const k = new EventEmitter(); k.stdout = new EventEmitter(); k.stderr = new EventEmitter(); k.kill = vi.fn(() => { k.killed = true }); k.exitCode = null; return k }

describe('PC-Status', () => {
  it('liest nvidia-smi-Zeilen', () => {
    expect(gpuZeile('41, 7400, 12282, 61')).toEqual({ gpu: 41, vramMb: 7400, vramGesamtMb: 12282, gpuGrad: 61 })
    expect(gpuZeile('[N/A], 7400, 12282, 61')).toBeNull()
    expect(gpuZeile('')).toBeNull()
  })
  it('liest die Zeile „was gerade rechnet“', () => {
    expect(obenZeile('Ollama 18\r')).toBe('ollama 18 % CPU')
    expect(obenZeile('chrome 0')).toBeNull()
    expect(obenZeile('-')).toBeNull()
  })
  it('rechnet die CPU-Auslastung aus zwei Messungen', () => {
    expect(cpuAnteil([kern(0, 0), kern(0, 0)], [kern(25, 75), kern(25, 75)])).toBe(25)
    expect(cpuAnteil(null, [kern(1, 1)])).toBeNull()
  })
  it('fragt die GPU einzeln, sperrt bei Fehlern, beendet das Hilfsprogramm nach Ruhe', () => {
    vi.useFakeTimers()
    const kinder = []
    const starte = vi.fn((exe) => { const k = falschesKind(); k.exe = exe; k.stdin = { writable: true, write: vi.fn(), end: vi.fn(), on: vi.fn() }; kinder.push(k); return k })
    let n = 0
    const os = { cpus: () => [kern(n * 50, n * 50)], totalmem: () => 32 * 1073741824, freemem: () => 16 * 1073741824 }
    const pc = erstellePcStatus({ starte, os })
    pc.lesen(); n++
    const gpu1 = kinder.find((k) => k.exe === 'nvidia-smi'), ps = kinder.find((k) => k.exe === 'powershell.exe')
    expect(ps.stdin.write).toHaveBeenCalledWith('?\n')
    gpu1.stdout.emit('data', '40, 6000, 12000, 55\n41, 1, 2, 3\n'); gpu1.emit('exit', 0)
    ps.stdout.emit('data', 'ollama 20\n')
    const w = pc.lesen()
    expect(w.cpu).toBe(50)
    expect(w.ramMb).toBe(16384)
    expect(w.gpu).toBe(40)
    expect(w.oben).toBe('ollama 20 % CPU')
    expect(w.verlauf.vram).toEqual([50])
    expect(kinder.filter((k) => k.exe === 'powershell.exe')).toHaveLength(1)
    const gpu2 = kinder.filter((k) => k.exe === 'nvidia-smi')[1]; gpu2.emit('exit', 9)
    pc.lesen(); pc.lesen()
    expect(kinder.filter((k) => k.exe === 'nvidia-smi')).toHaveLength(2) // nach Fehler gesperrt
    vi.advanceTimersByTime(31_000)
    expect(ps.kill).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
