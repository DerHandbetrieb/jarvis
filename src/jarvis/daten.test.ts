import { describe, expect, it } from 'vitest'
import { ausWerkstatt } from './daten'
import { morgenLage } from './morgenlage'
import type { WerkstattLage } from './desktop'

const JETZT = new Date('2026-11-03T08:00:00Z')
const LAGE: WerkstattLage = {
  stand: '2026-11-03T07:59:00Z', geholt: JETZT.getTime() - 60_000,
  aufgaben: { offen: 11, neu: 2, wichtigste: [{ titel: 'Kerzenständer nachproduzieren', faellig: null }, { titel: 'Tassen schließen', faellig: null }, { titel: 'Etsy-Fotos', faellig: null }, { titel: 'Vierte', faellig: null }], amazonProbleme: ['Amazon-Problem: Bild fehlt'] },
  lagerKnapp: [{ name: 'Tasse', variante: 'Emma', bestand: 2, meldebestand: 10 }, { name: 'Kerzenständer Beton', variante: null, bestand: 3, meldebestand: 5 }],
  verkauf: { gestern: { tag: '2026-11-02', bestellungen: 3, stueck: 4, umsatzCent: 12349, kanaele: [] }, tage: [], kanaele14: [] },
  freigaben: 1,
  selbsttest: { am: '2026-11-03T03:00:00Z', rot: 1 },
}

describe('Werkstatt-Daten für die Morgen-Lage', () => {
  it('rechnet die Antwort der Serverfunktion in die Bausteine um', () => {
    expect(ausWerkstatt(LAGE, JETZT)).toEqual({
      aufgaben: { anzahl: 11, neu: 2, wichtigste: ['Kerzenständer nachproduzieren', 'Tassen schließen', 'Etsy-Fotos'] },
      probleme: { amazon: ['Amazon-Problem: Bild fehlt'], selbsttestRot: true },
      lager: { namen: ['Tasse Emma', 'Kerzenständer Beton'] },
      verkauf: { bestellungen: 3, stueck: 4, umsatzCent: 12349 },
      freigaben: 1,
    })
  })
  it('ohne Verbindung oder mit Daten älter als eine Stunde: nichts (Loki erfindet nichts)', () => {
    const leer = { aufgaben: null, probleme: null, lager: null, verkauf: null, freigaben: null }
    expect(ausWerkstatt(null, JETZT)).toEqual(leer)
    expect(ausWerkstatt({ ...LAGE, geholt: JETZT.getTime() - 61 * 60_000 }, JETZT)).toEqual(leer)
  })
  it('die Freigabe-Sammelkarte ist keine „wichtigste Aufgabe“ (Werkstatt 0.148.0)', () => {
    const l = { ...LAGE, aufgaben: { ...LAGE.aufgaben, wichtigste: [{ titel: 'Abarbeiten: Vorschläge freigeben', faellig: null }, { titel: 'Marketing: Vorschläge freigeben (3)', faellig: null }, ...LAGE.aufgaben.wichtigste] } }
    expect(ausWerkstatt(l, JETZT).aufgaben?.wichtigste).toEqual(['Kerzenständer nachproduzieren', 'Tassen schließen', 'Etsy-Fotos'])
  })
  it('alter Selbsttest (über 24 Stunden) gilt nicht als Störung', () => {
    expect(ausWerkstatt({ ...LAGE, selbsttest: { am: '2026-11-01T03:00:00Z', rot: 2 } }, JETZT).probleme?.selbsttestRot).toBe(false)
  })
  it('die Morgen-Lage nennt die echten Zahlen (Aufgaben, Lager, Umsatz)', () => {
    const text = morgenLage({ jetzt: JETZT, anrede: 'Sir', humor: false, bausteine: new Set(['aufgaben', 'probleme', 'lager', 'verkauf', 'freigaben']), wetter: null, ...ausWerkstatt(LAGE, JETZT) }).join(' ')
    expect(text).toMatch(/elf/i)
    expect(text).toContain('Tasse Emma')
    expect(text).toMatch(/123/)
  })
})
