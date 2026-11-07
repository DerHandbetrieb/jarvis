// Tests für das Benennen der Autos (electron/autobesuche.cjs), 07.11.2026
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const { erstelleAutobesuche, zeitText } = createRequire(import.meta.url)('./autobesuche.cjs')

function speicherFs(namen) {
  const dateien = new Map(namen.map((n) => [`x/${n}`, Buffer.from([0xff, 0xd8])]))
  return {
    dateien,
    mkdirSync() {},
    writeFileSync(p, d) { dateien.set(p.replace(/\\/g, '/'), d) },
    renameSync(a, b) { a = a.replace(/\\/g, '/'); dateien.set(b.replace(/\\/g, '/'), dateien.get(a)); dateien.delete(a) },
    readFileSync(p) { const d = dateien.get(p.replace(/\\/g, '/')); if (d === undefined) throw new Error('fehlt'); return d },
    readdirSync() { return [...dateien.keys()].map((p) => p.split('/').pop()) },
  }
}

describe('Autos benennen', () => {
  const bilder = ['2026-11-07_14-03-22_1.jpg', '2026-11-07_14-03-22_2.jpg', '2026-11-07_14-03-22_3.jpg', '2026-11-08_08-00-01_1.jpg', 'stand.json']
  it('fasst Bilder zu Besuchen zusammen, neueste zuerst', () => {
    const a = erstelleAutobesuche({ ordner: 'x', fs: speicherFs(bilder) })
    const b = a.besuche()
    expect(b.map((x) => x.id)).toEqual(['2026-11-08_08-00-01', '2026-11-07_14-03-22'])
    expect(b[1].bilder).toEqual([1, 2, 3])
    expect(a.offen()).toBe(2)
  })
  it('merkt sich Namen und „kein Auto“', () => {
    const fs = speicherFs(bilder)
    const a = erstelleAutobesuche({ ordner: 'x', fs })
    expect(a.benennen('2026-11-07_14-03-22', '  Chrissy  ')).toBe(true)
    expect(a.benennen('2026-11-08_08-00-01', '', true)).toBe(true)
    const b = erstelleAutobesuche({ ordner: 'x', fs }).besuche()
    expect(b[1]).toMatchObject({ name: 'Chrissy', erledigt: true })
    expect(b[0]).toMatchObject({ name: null, keinAuto: true, erledigt: true })
    expect(a.offen()).toBe(0)
    expect(a.bekannte()).toEqual(['Chrissy'])
    a.benennen('2026-11-07_14-03-22', '')
    expect(a.offen()).toBe(1)
  })
  it('lehnt fremde Pfade ab', () => {
    const a = erstelleAutobesuche({ ordner: 'x', fs: speicherFs(bilder) })
    expect(a.bild('../geheim', 1)).toBeNull()
    expect(a.bild('2026-11-07_14-03-22', 4)).toBeNull()
    expect(a.bild('2026-11-07_14-03-22', 1)).toMatch(/^data:image\/jpeg;base64,/)
    expect(a.benennen('../x', 'a')).toBe(false)
  })
  it('Zeit lesbar', () => expect(zeitText('2026-11-07_14-03-22')).toBe('07.11.2026, 14:03 Uhr'))
})
