import { describe, expect, it } from 'vitest'
import { morgenLage, uhrzeit, zahl, euro, type LageEingabe, BAUSTEINE, SPITZEN, spitze, tagNummer } from './morgenlage'
import { fuerStimme, leseEigene } from './aussprache'
import { befehl, codewort, vereinfachen } from './befehle'

const basis = (x: Partial<LageEingabe> = {}): LageEingabe => ({
  jetzt: new Date(2026, 10, 3, 7, 30), anrede: 'Sir', humor: false, bausteine: new Set(BAUSTEINE.map((b) => b.schluessel)), ...x,
})

describe('Morgen-Lage', () => {
  it('begrüßt mit Uhrzeit und endet mit dem Schlusssatz', () => {
    const s = morgenLage(basis())
    expect(s[0]).toBe('Guten Morgen, Sir. Es ist 7 Uhr 30.')
    expect(s.at(-1)).toMatch(/Das wäre alles/)
  })
  it('Aufgaben, Probleme, Lager, Verkauf, Freigaben', () => {
    const s = morgenLage(basis({
      wetter: { grad: 4.2, text: 'Nieselregen' },
      aufgaben: { anzahl: 11, wichtigste: ['Kerzenständer produzieren', 'Tassen schließen'], neu: 2 },
      probleme: { amazon: ['Kuh-Kucks-Uhr'], selbsttestRot: false },
      lager: { namen: ['A', 'B', 'C', 'D', 'E'] },
      verkauf: { bestellungen: 3, stueck: 4, umsatzCent: 12349 },
      freigaben: 1,
    })).join(' ')
    expect(s).toContain('Draußen sind es 4 Grad und Nieselregen.')
    expect(s).toContain('Auf Ihrer Liste stehen elf Aufgaben, zwei davon sind seit gestern neu.')
    expect(s).toContain('Ganz oben: Kerzenständer produzieren; Tassen schließen.')
    expect(s).toContain('Amazon meldet Probleme bei Kuh-Kucks-Uhr.')
    expect(s).toContain('Knapp werden: A, B, C und zwei weitere.')
    expect(s).toContain('Gestern kamen drei Bestellungen mit vier Artikeln, zusammen etwa 123 Euro.')
    expect(s).toContain('wartet ein Vorschlag auf Ihre Freigabe')
  })
  it('abgeschaltete Bausteine fehlen, Humor nur wenn an', () => {
    const s = morgenLage(basis({ bausteine: new Set(['aufgaben']), wetter: { grad: 1, text: null }, aufgaben: { anzahl: 0, wichtigste: [], neu: 0 } }))
    expect(s.join(' ')).not.toContain('Grad')
    expect(s.join(' ')).toContain('nichts Dringendes')
    const mitHumor = morgenLage(basis({ humor: true, jetzt: new Date(2026, 10, 2, 8, 0) }))
    const ohne = morgenLage(basis({ humor: false, jetzt: new Date(2026, 10, 2, 8, 0) }))
    expect(mitHumor.length).toBeGreaterThanOrEqual(ohne.length)
  })
  it('mit Humor: nach jedem Sachsatz ein Seitenhieb, Anrede überall eingesetzt (Wunsch „noch bissiger“, 03.11.2026)', () => {
    const daten = {
      aufgaben: { anzahl: 11, wichtigste: ['Tassen'], neu: 0 },
      probleme: { amazon: ['Uhr'], selbsttestRot: false },
      lager: { namen: ['A'] },
      verkauf: { bestellungen: 2, stueck: 2, umsatzCent: 5000 },
      freigaben: 1,
    }
    const tag = new Date(2026, 10, 3, 5, 30)
    const mit = morgenLage(basis({ humor: true, anrede: 'Chef', jetzt: tag, ...daten }))
    const ohne = morgenLage(basis({ humor: false, anrede: 'Chef', jetzt: tag, ...daten }))
    const t = tagNummer(tag)
    for (const liste of [SPITZEN.frueh, SPITZEN.vieleAufgaben, SPITZEN.probleme, SPITZEN.lager, SPITZEN.wenigVerkauft, SPITZEN.freigaben]) expect(mit).toContain(spitze(liste, t).replace(/\bSir\b/g, 'Chef'))
    expect(mit.join(' ')).not.toMatch(/\bSir\b/)
    expect(mit.at(-1)).toMatch(/^Das wäre alles/)
    expect(ohne.some((s) => Object.values(SPITZEN).flat().includes(s))).toBe(false)
  })
  it('Hilfsfunktionen', () => {
    expect(uhrzeit(new Date(2026, 0, 1, 9, 0))).toBe('9 Uhr')
    expect(zahl(1)).toBe('eine'); expect(zahl(1, false)).toBe('ein'); expect(zahl(20)).toBe('20')
    expect(euro(123456)).toBe('1.235 Euro')
  })
})

describe('Aussprache', () => {
  it('englische Wörter, nur ganze Wörter, eigene Einträge gewinnen', () => {
    expect(fuerStimme('Guten Morgen, Sir. Amazon und Etsy.')).toBe('Guten Morgen, Sörr. Ämmasonn und Ettsi.')
    expect(fuerStimme('Shopping im Shop')).toBe('Shopping im Schopp')
    expect(fuerStimme('Billbee', { billbee: 'Bill-Bie' })).toBe('Bill-Bie')
    expect(leseEigene('Kasuwa = Kasuwa\nfalsch\n Amazon=Ämäson ')).toEqual({ kasuwa: 'Kasuwa', amazon: 'Ämäson' })
  })
})

describe('Codewörter und Befehle', () => {
  it('erkennt „Guten Morgen, Jarvis“ auch in anderen Schreibweisen', () => {
    expect(codewort('Guten Morgen, Jarvis!')).toEqual({ art: 'morgen' })
    expect(codewort('guten morgen tschawis')).toEqual({ art: 'morgen' })
    expect(codewort('Guten Morgen zusammen')).toBeNull()
    // echte Whisper-Ausgaben aus dem lokalen Test (03.11.2026)
    expect(codewort('Guten Morgen, Chavis.')).toEqual({ art: 'morgen' })
    expect(codewort('High-Jawis öffnet das Lager')).toEqual({ art: 'hey', rest: 'oeffnet das lager' })
    expect(codewort('Hi Javi, was ist knapp?')).toEqual({ art: 'hey', rest: 'was ist knapp' })
    expect(codewort('Hayavis was ist knapp')).toBeNull() // zusammengezogen – lieber nicht auslösen
    expect(codewort('Hi Jarvis, wie viele Tassen haben wir gestern verkauft?')).toMatchObject({ art: 'hey' })
    expect(codewort('Guten Morgen, Jana')).toBeNull()
    // echte Stimme des Auftraggebers (03.11.2026)
    expect(codewort('Guten Morgen, Tchaovis.')).toEqual({ art: 'morgen' })
    expect(codewort('Hey, Chavez!')).toEqual({ art: 'hey', rest: '' })
    expect(codewort('Highjavis, öffne das Lager')).toEqual({ art: 'hey', rest: 'oeffne das lager' })
  })
  it('erkennt den Rufnamen Loki (Whisper-Ausgaben aus loki-test.cjs, 03.11.2026)', () => {
    expect(codewort('Guten Morgen, Loki.')).toEqual({ art: 'morgen' })
    expect(codewort('High Loki befindet das Lager.')).toMatchObject({ art: 'hey' })
    expect(codewort('High-Luki öffnet das Lager.')).toEqual({ art: 'hey', rest: 'oeffnet das lager' })
    expect(codewort('Heiloki.')).toEqual({ art: 'hey', rest: '' })
    expect(codewort('Hi Loki.')).toEqual({ art: 'hey', rest: '' })
    expect(codewort('Logi, was steht heute an?')).toEqual({ art: 'hey', rest: 'was steht heute an' })
    expect(codewort('Hallo, Luki, wie viele Tassen haben wir verkauft?')).toMatchObject({ art: 'hey', rest: 'wie viele tassen haben wir verkauft' })
    // keine Fehlauslöser
    expect(codewort('Wir sitzen in der Loge')).toBeNull()
    expect(codewort('Luke, ich bin dein Vater')).toBeNull()
    expect(codewort('Lucky ist mein Hund')).toBeNull()
    expect(codewort('Locky, komm her')).toBeNull()
    expect(codewort('Hallo Lucky')).toBeNull()
    expect(codewort('Lokal ist besser')).toBeNull()
    expect(codewort('Ich habe Loki gesagt')).toBeNull()
  })
  it('erkennt „Hey Jarvis“ mit Rest', () => {
    expect(codewort('Hey Jarvis, öffne das Lager.')).toEqual({ art: 'hey', rest: 'oeffne das lager' })
    expect(codewort('Javis was ist knapp')).toEqual({ art: 'hey', rest: 'was ist knapp' })
    expect(codewort('Ich habe Jarvis gesagt')).toBeNull()
  })
  it('feste Befehle', () => {
    expect(befehl('öffnet das Lager')).toMatchObject({ pfad: '/lager' }); expect(befehl('öffne das Lager')).toEqual({ art: 'oeffnen', pfad: '/lager', name: 'Lager' })
    expect(befehl('zeig mir die Aufgaben')).toMatchObject({ pfad: '/abarbeiten' })
    expect(befehl('was gibt es Neues')).toEqual({ art: 'lage' })
    expect(befehl('stopp')).toEqual({ art: 'stopp' })
    expect(befehl('Wann ist Pause?')).toMatchObject({ art: 'frage' })
    expect(befehl('zeig den Lagerbestand')).toMatchObject({ pfad: '/lager' })
    expect(codewort('Was steht morgen an, Jarvis?')).toBeNull()
    expect(codewort('Gratis Versand')).toBeNull()
    expect(befehl('Wie viele Tassen haben wir verkauft?')).toEqual({ art: 'frage', text: 'Wie viele Tassen haben wir verkauft?' })
    expect(vereinfachen('Grüße, Öl!')).toBe('gruesse oel')
  })
})
