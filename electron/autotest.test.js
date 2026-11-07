// Tests für die Testbilder der Auto-Erkennung (electron/autotest.cjs), 07.11.2026
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const { erstelleAutotest, dateiname, MAX_BILDER, TAGE } = createRequire(import.meta.url)('./autotest.cjs')

/** kleines Dateisystem im Speicher */
function speicherFs() {
  const dateien = new Map()
  return {
    dateien,
    mkdirSync() {},
    writeFileSync(p, d) { dateien.set(p.replace(/\\/g, '/'), d) },
    readFileSync(p) { const d = dateien.get(p.replace(/\\/g, '/')); if (d === undefined) throw new Error('fehlt'); return String(d) },
    readdirSync() { return [...dateien.keys()].map((p) => p.split('/').pop()) },
  }
}
const jpeg = Buffer.from([0xff, 0xd8, 1])

describe('Auto-Test', () => {
  it('legt je Meldung drei Bilder ab', async () => {
    const fs = speicherFs()
    const t = erstelleAutotest({ ordner: 'x', bild: async () => jpeg, fs, warte: async () => {}, jetzt: () => 1_000 })
    expect(await t.autoGemeldet()).toBe(3)
    expect([...fs.dateien.keys()].filter((p) => p.endsWith('.jpg'))).toHaveLength(3)
  })
  it('überspringt fehlende Bilder', async () => {
    let n = 0
    const t = erstelleAutotest({ ordner: 'x', bild: async () => (++n === 2 ? null : jpeg), fs: speicherFs(), warte: async () => {} })
    expect(await t.autoGemeldet()).toBe(2)
  })
  it('hört nach dem Enddatum auf', async () => {
    let jetzt = 0
    const t = erstelleAutotest({ ordner: 'x', bild: async () => jpeg, fs: speicherFs(), warte: async () => {}, jetzt: () => jetzt })
    await t.autoGemeldet()
    jetzt = TAGE * 86_400_000 + 1
    expect(await t.autoGemeldet()).toBe(0)
  })
  it('hält die Höchstzahl ein', async () => {
    const fs = speicherFs()
    for (let i = 0; i < MAX_BILDER; i++) fs.dateien.set(`x/${i}.jpg`, jpeg)
    const t = erstelleAutotest({ ordner: 'x', bild: async () => jpeg, fs, warte: async () => {} })
    expect(await t.autoGemeldet()).toBe(0)
  })
  it('nimmt keine zweite Serie gleichzeitig auf', async () => {
    const t = erstelleAutotest({ ordner: 'x', bild: async () => jpeg, fs: speicherFs(), warte: () => new Promise((r) => setTimeout(r, 5)) })
    const erste = t.autoGemeldet()
    expect(await t.autoGemeldet()).toBe(0)
    expect(await erste).toBe(3)
  })
  it('Dateiname mit Datum und Nummer', () => {
    expect(dateiname(new Date(2026, 10, 7, 14, 3, 22).getTime(), 2)).toBe('2026-11-07_14-03-22_2.jpg')
  })
  it('nimmt die Fotos vom Objektiv, das das Auto erkannt hat', async () => {
    const kanaele = []
    const t = erstelleAutotest({ ordner: 'x', bild: async (k) => { kanaele.push(k); return Buffer.from([0xff, 0xd8, 1, 2]) }, fs: speicherFs(), warte: async () => {} })
    await t.autoGemeldet(1_000, 1)
    expect(kanaele).toEqual([1, 1, 1])
  })
})
