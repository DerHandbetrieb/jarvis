// Tests: Tagebuch der Wetterstation und See-Eis daraus (electron/wettertage.cjs), 06.11.2026
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const { erstelleWettertage, eintragen, eisAusTagen, tagVon } = createRequire(import.meta.url)('./wettertage.cjs')
const frost = (...tage) => Object.fromEntries(tage.map((t) => [t, { hoechst: -2, tiefst: -6, nachmittag: true }]))

function speicher(inhalt) {
  const d = { x: inhalt }
  return { d, readFileSync: () => { if (d.x == null) throw new Error('fehlt'); return d.x }, writeFileSync: (_, s) => { d.neu = s }, renameSync: () => { d.x = d.neu } }
}

describe('Tagebuch', () => {
  it('merkt Höchst- und Tiefstwert', () => {
    const t = {}
    expect(eintragen(t, '2026-11-06', 3)).toBe(true)
    expect(eintragen(t, '2026-11-06', 7)).toBe(true)
    expect(eintragen(t, '2026-11-06', -1)).toBe(true)
    expect(eintragen(t, '2026-11-06', 2)).toBe(false)
    expect(t['2026-11-06']).toEqual({ hoechst: 7, tiefst: -1, nachmittag: false })
    expect(eintragen(t, '2026-11-06', 2, true)).toBe(true)
    expect(t['2026-11-06'].nachmittag).toBe(true)
  })
  it('Tag läuft nach deutscher Zeit', () => {
    expect(tagVon(Date.UTC(2026, 10, 6, 23, 30))).toBe('2026-11-07')
  })
  it('behält die Werte nach einem Neustart', () => {
    const fs = speicher(null), jetzt = () => Date.UTC(2026, 10, 6, 12)
    erstelleWettertage({ datei: 'x', fs, jetzt }).erfassen(5)
    expect(JSON.parse(fs.d.x)['2026-11-06']).toEqual({ hoechst: 5, tiefst: 5, nachmittag: true })
    const neu = erstelleWettertage({ datei: 'x', fs, jetzt })
    neu.erfassen(9)
    expect(JSON.parse(fs.d.x)['2026-11-06']).toEqual({ hoechst: 9, tiefst: 5, nachmittag: true })
  })
  it('hält nur die letzten 21 Tage', () => {
    const fs = speicher(null)
    let t = Date.UTC(2026, 10, 1, 12)
    const w = erstelleWettertage({ datei: 'x', fs, jetzt: () => t })
    for (let i = 0; i < 30; i++) { w.erfassen(i); t += 86_400_000 }
    expect(Object.keys(JSON.parse(fs.d.x))).toHaveLength(21)
  })
  it('beschädigte Datei stört nicht', () => {
    expect(erstelleWettertage({ datei: 'x', fs: speicher('{kaputt'), jetzt: () => Date.UTC(2026, 10, 6, 12) }).eis()).toBe(0)
  })
})

describe('See-Eis aus dem Tagebuch', () => {
  it('ein Frosttag reicht nicht, zwei vom Ufer her, drei ganzer See', () => {
    expect(eisAusTagen(frost('2026-12-01'), '2026-12-02')).toBe(0)
    expect(eisAusTagen(frost('2026-12-01', '2026-12-02'), '2026-12-03')).toBe(0.5)
    expect(eisAusTagen(frost('2026-12-01', '2026-12-02', '2026-12-03'), '2026-12-04')).toBe(1)
  })
  it('der laufende Tag zählt nicht als Frosttag, solange er nicht vorbei ist', () => {
    expect(eisAusTagen({ ...frost('2026-12-01'), '2026-12-02': { hoechst: -3, tiefst: -5 } }, '2026-12-02')).toBe(0)
  })
  it('wird es heute wärmer als 0 °C, ist die Frostserie sofort unterbrochen', () => {
    expect(eisAusTagen({ ...frost('2026-12-01', '2026-12-02'), '2026-12-03': { hoechst: 1, tiefst: -2 } }, '2026-12-03')).toBe(0)
  })
  it('Abende allein ergeben keinen Frosttag', () => {
    const abend = { hoechst: -1, tiefst: -2, nachmittag: false }
    expect(eisAusTagen({ '2026-12-01': abend, '2026-12-02': abend, '2026-12-03': abend }, '2026-12-04')).toBe(0)
  })
  it('nach einer langen Lücke ist das alte Eis weg', () => {
    expect(eisAusTagen(frost('2026-12-20', '2026-12-21', '2026-12-22'), '2027-01-07')).toBe(0)
    expect(eisAusTagen({ ...frost('2026-12-20', '2026-12-21', '2026-12-22'), ...frost('2027-01-05', '2027-01-06') }, '2027-01-07')).toBe(0.5)
  })
  it('ein fehlender Tag (PC aus) unterbricht die Serie nicht', () => {
    expect(eisAusTagen(frost('2026-12-01', '2026-12-03', '2026-12-04'), '2026-12-05')).toBe(1)
  })
})
