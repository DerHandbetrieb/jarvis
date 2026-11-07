// Tests für die Medientasten (electron/medientasten.cjs), 07.11.2026
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import { EventEmitter } from 'node:events'

const { erstelleMedientasten, TASTEN } = createRequire(import.meta.url)('./medientasten.cjs')

function falscherStart() {
  const gestartet = []
  const starte = () => {
    const p = new EventEmitter(); p.exitCode = null; p.killed = false; p.geschrieben = []
    p.stdin = { writable: true, write: (z) => p.geschrieben.push(z), end() {} }; p.kill = () => { p.killed = true }
    gestartet.push(p); return p
  }
  return { starte, gestartet }
}

describe('Medientasten', () => {
  it('schickt die drei Tasten mit den Microsoft-Codes und startet nur einmal', () => {
    const f = falscherStart(), m = erstelleMedientasten({ starte: f.starte })
    expect(m.druecken('pause')).toBe(true); expect(m.druecken('vor')).toBe(true); expect(m.druecken('zurueck')).toBe(true)
    expect(f.gestartet).toHaveLength(1)
    expect(f.gestartet[0].geschrieben).toEqual(['179\n', '176\n', '177\n'])
    expect(TASTEN).toEqual({ pause: 0xb3, vor: 0xb0, zurueck: 0xb1 })
  })
  it('lehnt andere Aktionen ab', () => {
    const f = falscherStart(), m = erstelleMedientasten({ starte: f.starte })
    expect(m.druecken('lauter')).toBe(false)
    expect(f.gestartet).toHaveLength(0)
  })
  it('startet neu, wenn das Programm beendet wurde', () => {
    const f = falscherStart(), m = erstelleMedientasten({ starte: f.starte })
    m.druecken('pause'); f.gestartet[0].exitCode = 0; f.gestartet[0].emit('exit')
    m.druecken('pause')
    expect(f.gestartet).toHaveLength(2)
  })
})
