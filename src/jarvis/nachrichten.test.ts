// Tests für die Deutschlandfunk-Nachrichten (nachrichten.ts, Befehl in befehle.ts), 10.11.2026
import { describe, expect, it } from 'vitest'
import { nachrichtenSaetze } from './nachrichten'
import { befehl } from './befehle'
import { PAUSE } from './sprechtext'
import { nachschub } from './nachschub'

const JETZT = new Date('2026-11-10T07:00:00+01:00')
const M = [
  { titel: 'Mögliche Spionageaffäre - Trump: FBI ermittelt', text: 'Die US-Bundespolizei FBI hat Ermittlungen aufgenommen. Weitere Einzelheiten nannte sie nicht.' },
  { titel: 'Wetter - Im Norden Wolken oder Nebel, im Süden Regen', text: 'Der Wetterbericht, die Lage: Der Einfluss des Hochs schwächt sich ab.' },
  { titel: 'Literatur - Booker Prize geht an John Harrison', text: '' },
]

describe('Nachrichten vorlesen', () => {
  it('Einleitung, Meldungen wortgetreu mit Pausen, ohne Wetterbericht, Schlusssatz', () => {
    const s = nachrichtenSaetze({ meldungen: M, stand: '2026-11-10T05:01:12.000Z' }, { jetzt: JETZT, anrede: 'Sir', einleitung: 'Hier die Nachrichten, Sir.' })
    expect(s).toEqual([
      'Hier die Nachrichten, Sir.',
      PAUSE, 'Mögliche Spionageaffäre - Trump: FBI ermittelt.', 'Die US-Bundespolizei FBI hat Ermittlungen aufgenommen. Weitere Einzelheiten nannte sie nicht.',
      PAUSE, 'Literatur - Booker Prize geht an John Harrison.',
      PAUSE, 'Das waren die Nachrichten des Deutschlandfunks.',
    ])
  })
  it('ohne Humor sachlich; alter Stand wird genannt', () => {
    const s = nachrichtenSaetze({ meldungen: M, stand: '2026-11-09T20:30:00.000Z' }, { jetzt: JETZT, anrede: 'Sir', einleitung: null })
    expect(s[0]).toBe('Die Nachrichten des Deutschlandfunks.')
    expect(s[1]).toBe('Der Stand ist von gestern, 21 Uhr 30.')
    expect(nachrichtenSaetze({ meldungen: M, stand: '2026-11-08T09:00:00.000Z' }, { jetzt: JETZT, anrede: 'Sir', einleitung: null })[1]).toBe('Der Stand ist von 8. November, 10 Uhr.')
  })
  it('Fehler und leerer Feed werden ehrlich gesagt', () => {
    expect(nachrichtenSaetze({ fehler: 'Antwort 404' }, { jetzt: JETZT, anrede: 'Sir', einleitung: 'x' })[0]).toMatch(/nicht abrufen, Sir/)
    expect(nachrichtenSaetze({ meldungen: [M[1]], stand: null }, { jetzt: JETZT, anrede: 'Sir', einleitung: 'x' })[0]).toMatch(/keine Meldungen/)
  })
  it('Befehl „Loki, Nachrichten“ und Varianten; die Lage bleibt die Lage', () => {
    for (const t of ['Nachrichten', 'die Nachrichten bitte', 'was gibt es Neues in der Welt', 'lies mir die Nachrichten vor', 'Deutschlandfunk', 'Schlagzeilen']) expect(befehl(t).art).toBe('nachrichten')
    for (const t of ['Lage', 'was gibt es Neues', 'Morgenlage']) expect(befehl(t).art).toBe('lage')
    for (const t of ['schreib eine Nachricht an Tom', 'hab ich neue WhatsApp-Nachrichten', 'welche Nachricht hat Etsy geschickt', 'ich hab gerade eine Nachricht vom Kunden bekommen, was soll ich antworten', 'was bedeutet die Nachricht']) expect(befehl(t).art, t).not.toBe('nachrichten')
    for (const t of ['was gibt es für Nachrichten', 'die aktuellen Nachrichten', 'spiel die Nachrichten']) expect(befehl(t).art, t).toBe('nachrichten')
  })
  it('36 Einleitungen mit Anrede, keine verspricht eine Zusammenfassung', () => {
    const e = (nachschub().nachrichten ?? []).map((f) => f('Sir'))
    expect(e).toHaveLength(36)
    for (const t of e) { expect(t).not.toMatch(/\{a\}|fasse zusammen/); expect(t.split(/\s+/).length).toBeLessThanOrEqual(25) }
  })
})
