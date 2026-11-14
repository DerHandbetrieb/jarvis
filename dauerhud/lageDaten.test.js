import { describe, expect, it } from 'vitest'
import { datumText, faelligText, sequenzDaten, wetterText } from './lageDaten.js'

const JETZT = new Date('2026-11-03T08:00:00Z') // Dienstag, 09:00 in Deutschland
const LAGE = {
  stand: 'x', geholt: JETZT.getTime() - 5 * 60_000,
  aufgaben: { offen: 7, neu: 2, wichtigste: [{ titel: 'Tassen schließen', faellig: '2026-11-02' }, { titel: 'Kerzenständer', faellig: '2026-11-03' }, { titel: 'Fotos', faellig: '2026-11-05' }, { titel: 'Ohne Datum', faellig: null }], amazonProbleme: ['Amazon-Problem: X'] },
  lagerKnapp: [{ name: 'Tasse', variante: 'Emma', bestand: 1, meldebestand: 10 }, { name: 'Lampe', variante: null, bestand: 0, meldebestand: 2 }],
  verkauf: {
    gestern: { tag: '2026-11-02', bestellungen: 4, stueck: 6, umsatzCent: 15990, kanaele: [] },
    tage: Array.from({ length: 14 }, (_, i) => ({ tag: `t${i}`, bestellungen: 1, stueck: 1, umsatzCent: i * 1000 + 50 })),
    kanaele14: [{ kanal: 'Etsy', bestellungen: 9, stueck: 9, umsatzCent: 30000 }, { kanal: 'Eigener Shop', bestellungen: 3, stueck: 3, umsatzCent: 10000 }],
  },
  freigaben: 2,
  selbsttest: { am: '2026-11-03T03:00:00Z', rot: 0 },
}

describe('Start-Sequenz: echte Werte', () => {
  it('rechnet die Werkstatt-Lage in die Anzeigen um', () => {
    const d = sequenzDaten(LAGE, JETZT)
    expect(d).toMatchObject({ stand: '08:55', offen: 7, neu: 2, freigaben: 2, amazonProbleme: 1, selbsttest: 'OK', selbsttestRot: false, gestern: { bestellungen: 4, stueck: 6, umsatz: 159.9 } })
    expect(d.kanaele).toEqual([{ name: 'ETSY', bestellungen: 9, anteil: 0.75 }, { name: 'SHOP', bestellungen: 3, anteil: 0.25 }])
    expect(d.umsatz14).toHaveLength(14)
    expect(d.umsatz14[13]).toBe(130.5)
    expect(d.umsatzMax).toBe(150)
    expect(d.karten[0]).toEqual(['Tassen schließen', 'AUFGABE', null, 'ÜBERFÄLLIG', null])
    expect(d.karten[1][3]).toBe('FÄLLIG HEUTE')
    expect(d.karten[2][3]).toBe('FÄLLIG 05.11.')
    expect(d.karten[3]).toEqual(['Ohne Datum', 'AUFGABE', null, '', null])
    expect(sequenzDaten({ ...LAGE, aufgaben: { ...LAGE.aufgaben, offen: 7, wichtigste: [{ titel: 'Lampe produzieren', faellig: null, art: 'nachproduzieren' }] } }, JETZT)).toMatchObject({ abarbeitenOffen: 6, karten: [['Lampe produzieren', 'AUFGABE', null, '', 'nachproduzieren']] }) // 08.11.2026: Kartenart
    expect(d.lager).toEqual([['Tasse Emma', 1, 10], ['Lampe', 0, 2]])
  })
  it('ohne Verbindung, veraltet oder unvollständig: null (dann Beispieldaten mit Hinweis)', () => {
    expect(sequenzDaten(null, JETZT)).toBeNull()
    expect(sequenzDaten({ ...LAGE, geholt: JETZT.getTime() - 61 * 60_000 }, JETZT)).toBeNull()
    expect(sequenzDaten({ geholt: JETZT.getTime() }, JETZT)).toBeNull()
  })
  it('Selbsttest: rot zählt nur aus den letzten 24 Stunden', () => {
    expect(sequenzDaten({ ...LAGE, selbsttest: { am: '2026-11-03T03:00:00Z', rot: 2 } }, JETZT)).toMatchObject({ selbsttest: '2', selbsttestRot: true })
    expect(sequenzDaten({ ...LAGE, selbsttest: { am: '2026-10-30T03:00:00Z', rot: 2 } }, JETZT).selbsttest).toBe('–')
  })
  it('leere Werkstatt: keine Kanäle, Umsatz-Skala trotzdem sinnvoll', () => {
    const d = sequenzDaten({ ...LAGE, verkauf: { gestern: { bestellungen: 0, stueck: 0, umsatzCent: 0 }, tage: [], kanaele14: [] }, lagerKnapp: [], aufgaben: { offen: 0, neu: 0, wichtigste: [], amazonProbleme: [] } }, JETZT)
    expect(d.kanaele).toEqual([])
    expect(d.umsatzMax).toBe(10)
    expect(d.karten).toEqual([])
  })
  it('Kästchen: Bestellungen der letzten 9 Tage; fehlende Werte werden 0 statt NaN', () => {
    const tage = Array.from({ length: 14 }, (_, i) => ({ tag: `2026-10-${String(21 + i).padStart(2, '0')}`, bestellungen: i, umsatzCent: undefined }))
    const d = sequenzDaten({ ...LAGE, verkauf: { ...LAGE.verkauf, tage }, lagerKnapp: [{ name: 'X', variante: null, bestand: null, meldebestand: 3 }] }, JETZT)
    expect(d.tage9).toHaveLength(9)
    expect(d.tage9[0]).toEqual({ tag: '26.10', bestellungen: 5 })
    expect(d.umsatz14.every((v) => v === 0)).toBe(true)
    expect(d.lager[0]).toEqual(['X', 0, 3])
    expect(faelligText('2026-11-03T10:00:00Z', '2026-11-03')).toBe('FÄLLIG HEUTE')
  })
  it('Datum, Wetter und Fälligkeit als Text', () => {
    expect(datumText(JETZT)).toBe('DIENSTAG · 03.11.')
    expect(datumText(new Date('2026-11-03T23:30:00Z'))).toBe('MITTWOCH · 04.11.') // nach Mitternacht in Deutschland
    expect(wetterText('Öhringen', 8.6, 'wolkig')).toBe('ÖHRINGEN · 9 °C · BEWÖLKT')
    expect(wetterText('Öhringen', null, null)).toBe('ÖHRINGEN')
    expect(faelligText(null, '2026-11-03')).toBe('')
  })
})
