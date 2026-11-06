import { describe, expect, it } from 'vitest'
import { fragenVerbinden, istAnschlussFrage, istWerkstattFrage, werkstattAntwort, type LageMitEreignissen } from './werkstattAntwort'

const JETZT = new Date(2026, 10, 6, 6, 4)
const LAGE: LageMitEreignissen = {
  stand: '', geholt: JETZT.getTime() - 60_000,
  aufgaben: { offen: 3, neu: 1, wichtigste: [{ titel: 'Abarbeiten: Vorschläge freigeben', faellig: null }, { titel: 'Regal fertigen', faellig: null }], amazonProbleme: [] },
  lagerKnapp: [{ name: 'Buche', variante: '80 cm', bestand: 1, meldebestand: 3 }],
  verkauf: {
    gestern: { tag: '2026-11-05', bestellungen: 2, stueck: 3, umsatzCent: 12400, kanaele: [{ kanal: 'Etsy', bestellungen: 2, stueck: 3, umsatzCent: 12400 }] },
    tage: [{ tag: '2026-11-04', bestellungen: 1, stueck: 1, umsatzCent: 3000 }, { tag: '2026-11-05', bestellungen: 2, stueck: 3, umsatzCent: 12400 }, { tag: '2026-11-06', bestellungen: 0, stueck: 0, umsatzCent: 0 }],
    kanaele14: [],
  },
  freigaben: 2, selbsttest: { am: '2026-11-06T03:00:00Z', rot: 0 },
  ereignisse: { bestellungen: [
    { am: new Date(2026, 10, 5, 9).toISOString(), kanal: 'Etsy', stueck: 2, cent: 8900, artikel: ['2× Wandregal Buche'] },
    { am: new Date(2026, 10, 5, 15).toISOString(), kanal: 'Etsy', stueck: 1, cent: 3500, artikel: ['1× Schlüsselbrett'] },
    { am: new Date(2026, 10, 4, 15).toISOString(), kanal: 'Amazon', stueck: 1, cent: 3000, artikel: ['1× Tasse'] },
  ] },
}
const text = (f: string, l: LageMitEreignissen | null = LAGE) => werkstattAntwort(f, l, JETZT, 'Sir').saetze.join(' ')

describe('Werkstatt-Antworten nur aus echten Daten', () => {
  it('erkennt Werkstatt-Fragen, aber keine freie Plauderei', () => {
    expect(istWerkstattFrage('Kannst du mir sagen, was für Bestellungen wir gestern hatten?')).toBe(true)
    expect(istWerkstattFrage('Wie viel Umsatz auf Etsy?')).toBe(true)
    expect(istWerkstattFrage('Erzähl mir einen Witz über Emma')).toBe(false)
    expect(istAnschlussFrage('Und welche Artikel?')).toBe(true)
  })
  it('nennt die wirklichen Bestellungen von gestern mit Artikeln', () => {
    const t = text('Was für Bestellungen hatten wir gestern?')
    expect(t).toContain('zwei Bestellungen')
    expect(t).toContain('124 Euro')
    expect(t).toContain('2 mal Wandregal Buche')
    expect(t).toContain('Schlüsselbrett')
    expect(t).not.toContain('Tasse')
  })
  it('sagt ehrlich, wenn heute nichts da war', () => { expect(text('Bestellungen heute?')).toContain('keine Bestellung') })
  it('kennt die Woche nur als Summe der echten Tage', () => { expect(text('Umsatz diese Woche')).toContain('154 Euro') })
  it('rät nicht ohne oder mit alten Daten', () => {
    expect(text('Bestellungen gestern?', null)).toContain('keine aktuellen Daten')
    expect(text('Bestellungen gestern?', { ...LAGE, geholt: JETZT.getTime() - 2 * 3_600_000 })).toContain('keine aktuellen Daten')
  })
  it('sagt, dass einzelne Artikel fehlen, statt welche zu erfinden', () => { expect(text('Bestellungen gestern', { ...LAGE, ereignisse: undefined })).toContain('liegen mir dazu nicht vor') })
  it('Sammelkarte gilt nicht als wichtigste Aufgabe', () => { const t = text('Welche Aufgaben sind offen?'); expect(t).toContain('Regal fertigen'); expect(t).not.toContain('Vorschläge') })
  it('Zeitraum ohne Zahlen: sagt das, statt Gestern zu nennen', () => { const t = text('Bestellungen letzten Monat'); expect(t).toContain('keine Zahlen'); expect(t).not.toContain('Gestern') })
  it('vorgestern nur die Summe, keine lückenhafte Liste', () => { const t = text('Bestellungen vorgestern'); expect(t).toContain('eine Bestellung'); expect(t).not.toContain('Tasse') })
  it('Weitere kommen aus der Summe', () => {
    const v = { ...LAGE.verkauf, tage: LAGE.verkauf.tage.map((x) => (x.tag === '2026-11-05' ? { ...x, bestellungen: 9 } : x)) }
    expect(text('Bestellungen gestern', { ...LAGE, verkauf: v })).toContain('sieben weitere')
  })
  it('Nachfragen: Wetter gehört nicht dazu, neue Zeitangabe gilt', () => {
    expect(istAnschlussFrage('Und wie wird das Wetter?')).toBe(false)
    expect(fragenVerbinden('Bestellungen gestern', 'und heute')).not.toContain('gestern')
  })
  it('Thema außerhalb der Daten: ehrlich', () => { expect(text('Was steht auf der Rechnung?')).toContain('steht nicht in den Daten') })
  it('Wortteile sind keine Werkstattfrage', () => {
    for (const f of ['Wie viele Sekunden sind das?', 'Magst du Schlager?', 'Wie lang ist der Amazonas?', 'Was ist ein Bestandteil?', 'Wie war der Workshop?']) expect(istWerkstattFrage(f)).toBe(false)
    for (const f of ['Was ist im Lager?', 'Was macht Amazon?', 'Wie läuft der Shop?']) expect(istWerkstattFrage(f)).toBe(true)
  })
  it('fragt man nach einem Kanal, kommt nur dieser', () => {
    expect(text('Umsatz gestern auf Etsy?')).toContain('Gestern bei Etsy: zwei Bestellungen')
    expect(text('Bestellungen gestern bei Amazon?')).toContain('Gestern gab es bei Amazon keine Bestellung')
  })
  it('Lagerfrage mit dem Wort Artikel bleibt beim Lager', () => {
    const t = text('Welche Artikel sind im Lager knapp?')
    expect(t).toContain('Knapp im Lager'); expect(t).not.toContain('Bestellung')
  })
})
