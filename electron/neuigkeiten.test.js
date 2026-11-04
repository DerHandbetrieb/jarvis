// Tests für den Abgleich der Werkstatt-Neuigkeiten (electron/neuigkeiten.cjs, 04.11.2026)
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const { erstelleNeuigkeiten, MERKEN_MS } = createRequire(import.meta.url)('./neuigkeiten.cjs')

function speicher(start = null) {
  let wert = start
  return { lesen: () => wert, schreiben: (t) => { wert = t }, wert: () => wert }
}
const lage = (e = {}, extra = {}) => ({ ereignisse: { bestellungen: [], karten: [], freigaben: [], ...e }, lagerKnapp: [], selbsttest: null, ...extra })
const best = (id) => ({ id, am: '2026-11-04T08:00:00Z', kanal: 'Etsy', stueck: 2, cent: 3980, artikel: ['2× Klettertasse'] })

describe('Neuigkeiten aus der Werkstatt', () => {
  it('erster Abgleich meldet nichts (merkt nur), danach nur Neues', () => {
    const sp = speicher()
    const n = erstelleNeuigkeiten({ speicher: sp })
    expect(n.abgleichen(lage({ bestellungen: [best(1)] }))).toEqual([])
    expect(n.abgleichen(lage({ bestellungen: [best(1)] }))).toEqual([])
    const neu = n.abgleichen(lage({ bestellungen: [best(1), best(2)], karten: [{ id: 'k', titel: 'Amazon-Problem: Bild', von: 'u2', amazon: true, faellig: null }] }))
    expect(neu).toEqual([
      { art: 'bestellung', kanal: 'Etsy', stueck: 2, cent: 3980, artikel: ['2× Klettertasse'] },
      { art: 'amazon', titel: 'Amazon-Problem: Bild', von: 'u2', faellig: null },
    ])
  })
  it('nach einem Neustart gilt Bekanntes weiter als bekannt', () => {
    const sp = speicher()
    erstelleNeuigkeiten({ speicher: sp }).abgleichen(lage({ freigaben: [{ id: 'f1', titel: 'Etsy-Entwurf' }] }))
    const n2 = erstelleNeuigkeiten({ speicher: sp })
    expect(n2.abgleichen(lage({ freigaben: [{ id: 'f1', titel: 'Etsy-Entwurf' }, { id: 'f2', titel: 'Neu' }] }))).toEqual([{ art: 'freigabe', titel: 'Neu' }])
  })
  it('Lager knapp und Selbsttest rot: neu = neu; pendelt ein Artikel, kommt er erst nach 72 h wieder', () => {
    let t = 0
    const n = erstelleNeuigkeiten({ speicher: speicher(), jetzt: () => t })
    n.abgleichen(lage())
    const knapp = { lagerKnapp: [{ name: 'Tasse', variante: 'Rot', bestand: 2, meldebestand: 5 }], selbsttest: { am: '2026-11-04T03:00:00Z', rot: 2 } }
    expect(n.abgleichen(lage({}, knapp))).toEqual([{ art: 'knapp', name: 'Tasse', variante: 'Rot', bestand: 2 }, { art: 'selbsttest', rot: 2 }])
    t = 1000; n.abgleichen(lage()) // wieder aufgefüllt
    t = 2000; expect(n.abgleichen(lage({}, knapp))).toEqual([]) // pendelt zurück – keine zweite Meldung
    t = 2000 + MERKEN_MS + 1; n.abgleichen(lage())
    t += 1000; expect(n.abgleichen(lage({}, knapp)).length).toBe(2)
  })
  it('Selbsttest ohne Rot und ältere Serverfunktion ohne Ereignisse melden nichts', () => {
    const n = erstelleNeuigkeiten({ speicher: speicher() })
    n.abgleichen(lage())
    expect(n.abgleichen(lage({}, { selbsttest: { am: 'x', rot: 0 } }))).toEqual([])
    expect(n.abgleichen({ aufgaben: {}, lagerKnapp: [{ name: 'Neu', variante: null, bestand: 0 }] })).toEqual([])
  })
  it('kaputte Merkdatei: wie beim ersten Mal (nichts melden)', () => {
    const n = erstelleNeuigkeiten({ speicher: speicher('{kaputt') })
    expect(n.abgleichen(lage({ bestellungen: [best(9)] }))).toEqual([])
  })
})
