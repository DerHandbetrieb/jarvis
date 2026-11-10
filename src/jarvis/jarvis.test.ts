import { describe, expect, it } from 'vitest'
import { lageKennungen } from './neuigkeiten'
import { lageSchluessel, morgenLage, uhrzeit, zahl, euro, type LageEingabe, BAUSTEINE, SPITZEN, spitze, tagNummer } from './morgenlage'
import { fuerStimme, leseEigene } from './aussprache'
import { befehl, codewort, istNachfrage, istWiederholung, vereinfachen } from './befehle'
import { verstaerkung } from './dienst'

const basis = (x: Partial<LageEingabe> = {}): LageEingabe => ({
  jetzt: new Date(2026, 10, 3, 7, 30), anrede: 'Sir', humor: false, bausteine: new Set(BAUSTEINE.map((b) => b.schluessel)), ...x,
})

describe('Morgen-Lage', () => {
  it('nur Neues: was gestern schon vorkam, wird nicht wiederholt (08.11.2026)', () => {
    const gestern = basis({
      aufgaben: { anzahl: 9, wichtigste: ['Kerzenständer produzieren', 'Tassen schließen'], neu: 0 },
      offen: { anzahl: 1, liste: [{ kanal: 'Etsy', artikel: ['Tasse'] }] },
      lager: { namen: ['Lampe'] }, probleme: { amazon: ['Kuh-Kucks-Uhr'], selbsttestRot: false }, freigaben: 2,
    })
    const heute = basis({
      aufgaben: { anzahl: 10, wichtigste: ['Kerzenständer produzieren', 'Uhr reparieren'], neu: 1 },
      offen: { anzahl: 2, liste: [{ kanal: 'Etsy', artikel: ['Tasse'] }, { kanal: 'Amazon', artikel: ['Lampe'] }] },
      lager: { namen: ['Lampe'] }, probleme: { amazon: ['Kuh-Kucks-Uhr'], selbsttestRot: false }, freigaben: 2,
      verkauf: { bestellungen: 1, stueck: 1, umsatzCent: 2000 },
    })
    const s = morgenLage({ ...heute, bekannt: new Set(lageSchluessel(gestern)) }).join(' ')
    expect(s).toContain('Neu unter Abarbeiten: eine Karte. Insgesamt sind zehn offen.')
    expect(s).toContain('Uhr reparieren.')
    expect(s).not.toContain('Kerzenständer')
    expect(s).toContain('Neue offene Bestellungen: eine.')
    expect(s).toContain('Amazon: Lampe.')
    expect(s).not.toContain('Etsy')
    expect(s).not.toContain('Neu zum Nachproduzieren')
    expect(s).toContain('Zum Nachproduzieren steht immer noch ein Artikel an.')
    expect(s).not.toContain('Kuh-Kucks-Uhr')
    expect(s).toContain('Bei Amazon ist weiterhin ein Fall offen.')
    expect(s).not.toContain('Zu den Freigaben')
    expect(s).toContain('Zwei Vorschläge warten noch auf Ihre Freigabe.')
    expect(s).toContain('Zum gestrigen Tag')
    expect(s).not.toContain('nichts Neues')
    const nichts = morgenLage({ ...gestern, bekannt: new Set(lageSchluessel(gestern)) }).join(' ')
    expect(nichts).toContain('Seit gestern gibt es nichts Neues.')
    expect(nichts).toContain('Unter Abarbeiten sind noch neun Karten offen.')
    expect(nichts).not.toContain('Kerzenständer')
    expect(nichts).toContain('Auf den Versand wartet weiterhin eine Bestellung.')
    expect(nichts).not.toContain('Lampe')
    // Freigaben nur, wenn es mehr wurden; ohne Werkstatt-Daten kein „nichts Neues“
    expect(morgenLage({ ...gestern, freigaben: 1, bekannt: new Set(lageSchluessel(gestern)) }).join(' ')).not.toContain('Zu den Freigaben')
    expect(morgenLage({ ...gestern, freigaben: 3, bekannt: new Set(lageSchluessel(gestern)) }).join(' ')).toContain('Zu den Freigaben')
    expect(morgenLage({ ...basis(), bekannt: new Set(lageSchluessel(gestern)) }).join(' ')).not.toContain('nichts Neues')
  })
  it('nur Neues: nicht Vorgelesenes kommt am nächsten Tag, Bestellungen zählen nach Nummer (09.11.2026)', () => {
    const karten = ['A', 'B', 'C', 'D', 'E']
    const alt = new Set(['aufgabe:A'])
    const e = basis({ aufgaben: { anzahl: 5, wichtigste: karten, neu: 0 } })
    const s = morgenLage({ ...e, bekannt: alt }).join(' ')
    expect(s).toContain('Neu unter Abarbeiten: vier Karten.')
    expect(s).toContain('Drittens: D.')
    expect(s).not.toContain('E.')
    const gemerkt = lageSchluessel(e, alt)
    expect(gemerkt).toContain('aufgabe:D')
    expect(gemerkt).not.toContain('aufgabe:E')
    const morgen = morgenLage({ ...e, bekannt: new Set(gemerkt) }).join(' ')
    expect(morgen).toContain('Neu unter Abarbeiten: eine Karte.')
    expect(morgen).toContain('E.')
    // gleicher Artikel, andere Nummer = neue Bestellung
    const b1 = basis({ offen: { anzahl: 1, liste: [{ id: 1, kanal: 'Etsy', artikel: ['Tasse'] }] } })
    const b2 = basis({ offen: { anzahl: 2, liste: [{ id: 1, kanal: 'Etsy', artikel: ['Tasse'] }, { id: 2, kanal: 'Etsy', artikel: ['Tasse'] }] } })
    expect(morgenLage({ ...b2, bekannt: new Set(lageSchluessel(b1)) }).join(' ')).toContain('Neue offene Bestellungen: eine.')
    expect(lageKennungen({ art: 'bestellung', id: 2, kanal: 'Etsy', stueck: 1, cent: 100, artikel: [] })).toEqual(['bestellung:2'])
    expect(lageKennungen({ art: 'knapp', name: 'Uhr', variante: 'Braun', bestand: 1 })).toEqual(['lager:Uhr Braun'])
  })
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
    expect(s).toContain('Kommen wir zum Abarbeiten: elf Karten sind offen, zwei davon sind neu.')
    expect(s).toContain('Erstens: Kerzenständer produzieren.')
    expect(s).toContain('Zweitens: Tassen schließen.')
    expect(s).toContain('Bei Amazon ist ein Fall offen.')
    expect(s).toContain('Es geht um Kuh-Kucks-Uhr.')
    expect(s).toContain('Zum Nachproduzieren haben wir folgende Artikel.')
    expect(s).toContain('E.')
    expect(s).toContain('Zum gestrigen Tag: Es kamen drei Bestellungen mit vier Artikeln für')
    expect(s).toContain('Zu den Freigaben: Es wartet ein Vorschlag auf Sie.')
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
    expect(mit.at(-1)).toBe(spitze(SPITZEN.schluss, t).replace(/\bSir\b/g, 'Chef'))
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
    // kein Morgengruß, aber seit 04.11.2026 ein Ruf (Name am Satzende, ohne „Hey“)
    expect(codewort('Was steht morgen an, Jarvis?')).toEqual({ art: 'hey', rest: 'was steht morgen an' })
    expect(codewort('Wie spät ist es, Loki?')).toEqual({ art: 'hey', rest: 'wie spaet ist es' })
    expect(codewort('Loki, wie spät ist es?')).toEqual({ art: 'hey', rest: 'wie spaet ist es' })
    expect(codewort('Ich habe Loki gesagt, dass er leise sein soll')).toBeNull()
    expect(codewort('Wie wird das Wetter morgen, Loki?')).toEqual({ art: 'hey', rest: 'wie wird das wetter morgen' })
    expect(codewort('Hallo, guten Morgen, Loki!')).toEqual({ art: 'morgen' })
    expect(codewort('Dann kämpfen Thor und Loki.')).toBeNull()
    // Wiederholungs-Sperre im Gespräch (echter Fall 04.11.2026: dritte Antwort wortgleich mit der zweiten)
    const zweite = 'Ah, die Arbeit – wie ein untreu gewordenes Liebhaberkind. Sie wird nicht warten, solange Sie Ihren Labrador in den Park schicken.'
    expect(istWiederholung(zweite, ['Ein Spaziergang ist eine gute Idee.', zweite])).toBe(true)
    expect(istWiederholung('Ah, die Arbeit. Sie wird nicht warten, solange Sie Ihren Labrador in den Park schicken, Sir.', [zweite])).toBe(true)
    expect(istWiederholung('Eine weise Entscheidung, Sir. Emma wird es Ihnen nie verzeihen, aber sie verzeiht Ihnen ja ohnehin alles.', [zweite])).toBe(false)
    expect(istWiederholung('Gern.', ['Gern.'])).toBe(true)
    expect(istWiederholung('Gern.', ['Sehr wohl.'])).toBe(false)
    expect(codewort('Gratis Versand')).toBeNull()
    expect(befehl('Wie viele Tassen haben wir verkauft?')).toEqual({ art: 'frage', text: 'Wie viele Tassen haben wir verkauft?' })
    expect(vereinfachen('Grüße, Öl!')).toBe('gruesse oel')
  })
})

describe('Nachfrage ohne Codewort (freies Gespräch)', () => {
  it('nimmt echte Sätze, verwirft Whisper-Floskeln und Ein-Wort-Fetzen', () => {
    expect(istNachfrage('Und was hältst du davon?')).toBe(true)
    expect(istNachfrage('Erzähl mir mehr über Emma.')).toBe(true)
    for (const f of ['Vielen Dank.', 'Untertitel im Auftrag des ZDF, 2020', 'Danke fürs Zuschauen!', 'Ja.', 'Tschüss', 'Bis zum nächsten Mal.', 'Untertitelung. BR 2018', 'www.feyyaz.tv', 'www.youtube.com']) expect(istNachfrage(f)).toBe(false)
  })
})

describe('Spruch-Fundus', () => {
  it('zieht ohne Wiederholung, bis drei Viertel des Fundus dran waren', async () => {
    const { ziehe, FUNDUS } = await import('./fundus')
    const gesamt = Object.values(FUNDUS).flat().length
    expect(gesamt).toBeGreaterThanOrEqual(400)
    const daten: Record<string, string> = {}
    const sp = { getItem: (k: string) => daten[k] ?? null, setItem: (k: string, v: string) => { daten[k] = v } }
    const gesehen = new Set<string>()
    for (let i = 0; i < Math.floor(gesamt * 0.75 / 3); i++) for (const s of ziehe(3, 'Sir', Math.random, sp)) { expect(gesehen.has(s)).toBe(false); gesehen.add(s) }
    expect(ziehe(3, 'Sir', Math.random, sp)).toHaveLength(3)
    expect(ziehe(1, 'Mylord', () => 0, { getItem: () => 'kaputt', setItem: () => {} })[0]).toBeTypeOf('string')
  })
})

describe('Neuigkeiten ansagen (04.11.2026)', () => {
  it('eine Bestellung, mehrere Bestellungen, Beträge zum Sprechen', async () => {
    const { ansage, euro } = await import('./neuigkeiten')
    expect(euro(3980)).toBe('39 Euro 80'); expect(euro(4000)).toBe('40 Euro'); expect(euro(1205)).toBe('12 Euro 05')
    const o = { anrede: 'Sir', humor: false, weg: false }
    expect(ansage([{ art: 'bestellung', kanal: 'Etsy', stueck: 2, cent: 3980, artikel: ['2× Klettertasse'] }], o)).toEqual(['Neue Bestellung bei Etsy: 2 mal Klettertasse, 39 Euro 80.'])
    expect(ansage([
      { art: 'bestellung', kanal: 'Etsy', stueck: 1, cent: 2000, artikel: ['1× Tasse'] },
      { art: 'bestellung', kanal: 'Amazon', stueck: 1, cent: 1990, artikel: [] },
      { art: 'bestellung', kanal: 'Etsy', stueck: 1, cent: 1000, artikel: [] },
    ], o)).toEqual(['Drei neue Bestellungen über zusammen 49 Euro 90: zwei bei Etsy und eine bei Amazon.'])
  })
  it('Probleme zuerst; weg = Zusammenfassung; mit Humor genau ein Seitenhieb', async () => {
    const { ansage } = await import('./neuigkeiten')
    const liste = [
      { art: 'freigabe' as const, titel: 'Etsy-Entwurf' }, { art: 'freigabe' as const, titel: 'Zweiter' },
      { art: 'amazon' as const, titel: 'Amazon-Problem: Bild fehlt', von: null, faellig: null },
      { art: 'bestellung' as const, kanal: 'Etsy', stueck: 1, cent: 1500, artikel: [] },
    ]
    expect(ansage(liste, { anrede: 'Sir', humor: false, weg: false })).toEqual(['Neues Amazon-Problem: Bild fehlt.', 'Neue Bestellung bei Etsy, 15 Euro.', 'Zwei neue Freigaben warten unter Abarbeiten auf Sie.'])
    const weg = ansage(liste, { anrede: 'Sir', humor: true, weg: true, spitze: (b) => `SPITZE ${b}` })
    expect(weg).toEqual(['Während Sie weg waren, Sir: eine neue Bestellung über 15 Euro und zwei neue Freigaben.', 'Neues Amazon-Problem: Bild fehlt.', 'SPITZE zurueck'])
  })
  it('eigene Karten (Konto Alex) und abgewählte Arten fallen weg', async () => {
    const { auswaehlen, EIGENES_KONTO } = await import('./neuigkeiten')
    const liste = [
      { art: 'aufgabe' as const, titel: 'Eigene', von: EIGENES_KONTO, faellig: null },
      { art: 'aufgabe' as const, titel: 'Von Pöp', von: 'anderer', faellig: null },
      { art: 'knapp' as const, name: 'Tasse', variante: null, bestand: 1 },
      { art: 'freigabe' as const, titel: 'x' },
    ]
    expect(auswaehlen(liste, ['aufgabe', 'problem']).map((n) => n.art === 'aufgabe' ? n.titel : n.art)).toEqual(['Von Pöp', 'knapp'])
  })
  it('die Sammelkarte „Abarbeiten: Vorschläge freigeben“ ist keine neue Aufgabe (Werkstatt 0.148.0)', async () => {
    const { auswaehlen } = await import('./neuigkeiten')
    const liste = [
      { art: 'aufgabe' as const, titel: 'Abarbeiten: Vorschläge freigeben', von: null, faellig: null },
      { art: 'aufgabe' as const, titel: 'Marketing: Vorschläge freigeben', von: null, faellig: null },
      { art: 'aufgabe' as const, titel: 'Werbeberichte prüfen (Amazon)', von: null, faellig: null },
      { art: 'freigabe' as const, titel: 'Etsy-Entwurf' },
    ]
    expect(auswaehlen(liste, ['aufgabe', 'freigabe']).map((n) => n.art === 'aufgabe' || n.art === 'freigabe' ? n.titel : n.art)).toEqual(['Werbeberichte prüfen (Amazon)', 'Etsy-Entwurf'])
  })
  it('alle Seitenhiebe: Platzhalter, kurz, keine Zahlen', async () => {
    const { NEU_SPITZEN } = await import('./neuSpitzen')
    for (const [bereich, liste] of Object.entries(NEU_SPITZEN)) {
      expect(liste.length, bereich).toBeGreaterThanOrEqual(20)
      for (const s of liste) { expect(s).toContain('{anrede}'); expect(s.split(/\s+/).length, s).toBeLessThanOrEqual(22); expect(/\d/.test(s), s).toBe(false) }
    }
  })
})

describe('Benutzte Sprüche nach hinten (rotation.ts, 04.11.2026)', () => {
  const speicher = () => { const d: Record<string, string> = {}; return { getItem: (k: string) => d[k] ?? null, setItem: (k: string, v: string) => { d[k] = v } } }
  it('erst kommt jeder einmal dran, danach nur die am längsten nicht benutzten', async () => {
    const { waehle } = await import('./rotation')
    const sp = speicher(), texte = Array.from({ length: 20 }, (_, i) => `Spruch ${i}`)
    const erste = Array.from({ length: 20 }, () => waehle('t', texte, 1, Math.random, sp)[0])
    expect(new Set(erste).size).toBe(20)
    // die nächsten 5 dürfen nur aus dem ältesten Viertel kommen (die ersten 5 der Runde)
    const naechste = waehle('t', texte, 1, () => 0.99, sp)[0]
    expect(erste.slice(0, 5)).toContain(naechste)
  })
  it('neue Sprüche (Nachschub) kommen zuerst dran, entfernte werden vergessen', async () => {
    const { waehle, stand } = await import('./rotation')
    const sp = speicher()
    const alt = ['a', 'b', 'c']
    for (let i = 0; i < 3; i++) waehle('t', alt, 1, Math.random, sp)
    expect(stand({ t: alt }, sp).t).toEqual({ gesamt: 3, unbenutzt: 0 })
    const mitNeu = ['a', 'b', 'c', 'neu']
    expect(stand({ t: mitNeu }, sp).t.unbenutzt).toBe(1)
    expect(mitNeu[waehle('t', mitNeu, 1, Math.random, sp)[0]]).toBe('neu')
    expect(waehle('t', [], 1, Math.random, sp)).toEqual([])
    expect(waehle('kaputt', ['x'], 1, Math.random, { getItem: () => '{kaputt', setItem: () => {} })).toEqual([0])
  })
  it('Begrüßung: nie dieselbe wie zuletzt, jede kommt dran, bevor sich eine wiederholt', async () => {
    const { naechsteBegruessung, BEGRUESSUNGEN } = await import('./begruessung')
    const sp = speicher(), gehoert: number[] = []
    let letzte = -1
    for (let i = 0; i < BEGRUESSUNGEN.length; i++) { const nr = naechsteBegruessung(letzte, Math.random, sp); expect(nr).not.toBe(letzte); gehoert.push(nr); letzte = nr }
    expect(new Set(gehoert).size).toBe(BEGRUESSUNGEN.length)
  })
  it('Nachschub: jede Zeile „bereich|Text“ hat einen bekannten Bereich und den Platzhalter {a}', async () => {
    const { NACHSCHUB_TEXT } = await import('./nachschub')
    const { FUNDUS } = await import('./fundus')
    const { SPITZEN } = await import('./morgenlage')
    const bereiche = new Set([...Object.keys(FUNDUS), 'begruessung', ...['bestellung', 'aufgabe', 'problem', 'knapp', 'freigabe', 'zurueck', 'kamera', 'kamera-zurueck', 'auto', 'auto-zurueck'].map((b) => `neu-${b}`),
      ...Object.keys(SPITZEN).map((k) => `lage-${k}`), 'lage-sprueche', 'nachrichten'])
    for (const z of NACHSCHUB_TEXT.split(/\r?\n/).filter((x) => x.trim() && !x.trimStart().startsWith('#'))) {
      const [b, t] = [z.slice(0, z.indexOf('|')), z.slice(z.indexOf('|') + 1)]
      expect(bereiche.has(b), z).toBe(true)
      if (b === 'nachrichten') continue // Nachrichten-Einleitung: Anrede nicht in jedem Satz, bis 25 Wörter (eigener Test in nachrichten.test.ts)
      if (!b.startsWith('lage-')) expect(t, z).toContain('{a}') // Morgen-Lage: Anrede als festes „Sir“
      else expect(t, z).not.toContain('{a}')
      expect(/\d|`|\$\{/.test(t), z).toBe(false)
      expect(t.split(/\s+/).length, z).toBeLessThanOrEqual(22)
    }
  })
})

describe('Kamera-Wache: Ansage (04.11.2026)', () => {
  it('Person zuerst, mehrere zusammengefasst, weg = Zusammenfassung, eigener Seitenhieb', async () => {
    const { ansage, auswaehlen } = await import('./neuigkeiten')
    const p = { art: 'person' as const, seite: 'links' as const }
    const o = { anrede: 'Sir', humor: false, weg: false }
    expect(ansage([p], o)).toEqual(['Sir, eine Person nähert sich dem Grundstück.'])
    expect(ansage([p, p], o)).toEqual(['Sir, an der Kamera war gerade zweimal jemand.'])
    expect(ansage([{ art: 'bestellung', kanal: 'Etsy', stueck: 1, cent: 1000, artikel: [] }, p], o)[0]).toBe('Sir, eine Person nähert sich dem Grundstück.')
    const weg = ansage([p, p], { anrede: 'Sir', humor: true, weg: true, spitze: (b) => `SPITZE ${b}` })
    expect(weg).toEqual(['Während Sie weg waren, Sir: zweimal war jemand vor der Kamera.', 'SPITZE kamera-zurueck'])
    expect(ansage([p], { ...o, humor: true, spitze: (b) => `SPITZE ${b}` }).at(-1)).toBe('SPITZE kamera')
    expect(auswaehlen([p], ['bestellung'])).toEqual([])
    expect(auswaehlen([p], ['kamera'])).toEqual([p])
  })
  it('Morgen-Lage bekommt ihren Nachschub (Spitzen und Sprüche wachsen)', async () => {
    const { SPITZEN, SPRUECHE } = await import('./morgenlage')
    expect(SPITZEN.spaet.length).toBeGreaterThanOrEqual(10)
    expect(SPRUECHE.length).toBeGreaterThanOrEqual(25)
  })
})

describe('Lautstärke der Ansagen', () => {
  it('hebt leise Sätze auf die Ziel-Lautheit an, höchstens 6-fach, nie leiser', () => {
    const leise = Array.from({ length: 1000 }, (_, i) => 0.04 * Math.sin(i / 5))
    expect(verstaerkung(leise)).toBeCloseTo(0.16 / (0.04 / Math.SQRT2), 0)
    expect(verstaerkung(Array(1000).fill(0.001))).toBe(6)
    expect(verstaerkung(Array(1000).fill(0.5))).toBe(1)
    expect(verstaerkung([])).toBe(1)
  })
})

describe('Rufname als Low-Key verstanden', () => {
  it('reagiert auf alle Schreibweisen', () => {
    expect(codewort('Low-Key, was steht an?')).toEqual({ art: 'hey', rest: 'was steht an' })
    expect(codewort('Hey Low Key, wie spät ist es?')).toEqual({ art: 'hey', rest: 'wie spaet ist es' })
    expect(codewort('Guten Morgen, Lowkey.')).toEqual({ art: 'morgen' })
    expect(codewort('Was steht heute an, Low-Key?')).toEqual({ art: 'hey', rest: 'was steht heute an' })
    expect(codewort('Das Low-Budget ist knapp')).toBeNull()
    for (const n of ['Lowki', 'Lokie', 'Lookie', 'Lohki', 'Loggy', 'Lukie', 'Lokey', 'Lowkey', 'Lo Ki', 'Low Kee', 'Lo-Key']) expect(codewort(`${n}, was steht an?`)).toEqual({ art: 'hey', rest: 'was steht an' })
    for (const n of ['Lucky', 'Locky', 'Lokal', 'Logik', 'Luke', 'Loge', 'Logo']) expect(codewort(`${n}, was steht an?`)).toBeNull()
  })
})

describe('Auto an der Kamera (06.11.2026)', () => {
  it('sagt das Auto an, wählt die Sprüche fürs Auto und gehört zur Gruppe Kamera', async () => {
    const { ansage, auswaehlen } = await import('./neuigkeiten')
    const n = { art: 'auto', seite: 'links' } as const, bereiche: string[] = []
    expect(ansage([n], { anrede: 'Sir', humor: true, weg: false, spitze: (b: string) => { bereiche.push(b); return null } })).toEqual(['Sir, ein Auto fährt auf das Grundstück.'])
    expect(bereiche).toEqual(['auto'])
    expect(auswaehlen([n], ['kamera'])).toEqual([n])
    expect(ansage([n], { anrede: 'Sir', humor: true, weg: true, spitze: (b: string) => { bereiche.push(b); return null } }).join(' ')).toContain('ein Auto auf dem Grundstück')
    expect(bereiche).toEqual(['auto', 'auto-zurueck'])
  })
  it('erinnert ans Benennen, wenn Fotos abgelegt wurden', async () => {
    const { ansage } = await import('./neuigkeiten')
    const n = { art: 'auto', seite: 'links', foto: true } as const
    expect(ansage([n], { anrede: 'Sir', humor: false, weg: false })).toEqual(['Sir, ein Auto fährt auf das Grundstück.', 'Ich habe es fotografiert. Einen Namen dürfen Sie ihm im Loki-Fenster geben.'])
    expect(ansage([n], { anrede: 'Sir', humor: false, weg: true }).join(' ')).toContain('wartet im Loki-Fenster auf einen Namen')
    expect(ansage([{ art: 'auto', seite: 'links' }], { anrede: 'Sir', humor: false, weg: false }).join(' ')).not.toContain('fotografiert')
  })
})

describe('Kamera auf Zuruf', () => {
  it('zeig den Carport / Kamera weg', async () => {
    const { befehl } = await import('./befehle')
    expect(befehl('zeig den Carport')).toEqual({ art: 'kamera', kanal: 0 })
    expect(befehl('zeig die rechte Kamera')).toEqual({ art: 'kamera', kanal: 1 })
    expect(befehl('Kamera wieder weg')).toEqual({ art: 'kamera', kanal: null })
    expect(befehl('wie hoch ist die Einfahrt')).toEqual({ art: 'frage', text: 'wie hoch ist die Einfahrt' })
    for (const v of ['Zeuge Carport', 'Zeigekamera, Carport', 'zeigt den Carport', 'Zeigen Sie die Kamera', 'Carport', 'die Kamera bitte']) expect(befehl(v)).toEqual({ art: 'kamera', kanal: 0 })
    expect(befehl('Was kostet eine Kamera aus dem Baumarkt')).toMatchObject({ art: 'frage' })
    expect(befehl('Wie komme ich zum Hof zu Fuß')).toMatchObject({ art: 'frage' })
  })
})
