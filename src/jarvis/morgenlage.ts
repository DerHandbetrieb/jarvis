// Jarvis – Morgen-Lage (Etappe 1, 03.11.2026, Wunsch Auftraggeber): aus den App-Daten ein kurzer gesprochener Bericht
// im britischen Stil (förmlich, „Sir“, trockenes Understatement, ab und zu ein Spruch ohne Arbeitsbezug, z. B. über Emma).
// Feste Regeln, kein Sprachmodell – darum immer verfügbar und ohne Erfindungen. Inhalte als Bausteine, an- und abschaltbar
// und später erweiterbar (z. B. Börse, KI-Neuigkeiten). Reine Funktionen – getestet in morgenlage.test.ts.

export type BausteinSchluessel = 'aufgaben' | 'probleme' | 'lager' | 'verkauf' | 'wetter' | 'freigaben'
export const BAUSTEINE: { schluessel: BausteinSchluessel; titel: string }[] = [
  { schluessel: 'wetter', titel: 'Wetter' },
  { schluessel: 'aufgaben', titel: 'Aufgaben und Neues seit gestern' },
  { schluessel: 'probleme', titel: 'Probleme in den Shops und Nachttest' },
  { schluessel: 'lager', titel: 'Knappe Artikel' },
  { schluessel: 'verkauf', titel: 'Verkäufe von gestern' },
  { schluessel: 'freigaben', titel: 'Offene Freigaben' },
]

export type LageEingabe = {
  jetzt: Date
  anrede: string
  humor: boolean
  bausteine: Set<BausteinSchluessel>
  wetter?: { grad: number | null; text: string | null } | null
  aufgaben?: { anzahl: number; wichtigste: string[]; neu: number } | null
  probleme?: { amazon: string[]; selbsttestRot: boolean } | null
  lager?: { namen: string[] } | null
  verkauf?: { bestellungen: number; stueck: number; umsatzCent: number } | null
  freigaben?: number | null
}

/** Zahl in Worten für kleine Werte (klingt gesprochen besser), sonst Ziffern */
const WORTE = ['keine', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf']
export function zahl(n: number, weiblich = true): string {
  if (n === 1) return weiblich ? 'eine' : 'ein'
  return n >= 0 && n < WORTE.length ? WORTE[n] : String(n)
}
const mehrzahl = (n: number, eins: string, viele: string) => (n === 1 ? eins : viele)

/** Uhrzeit wie gesprochen: „sieben Uhr dreißig“ */
export function uhrzeit(d: Date): string {
  const h = d.getHours(), m = d.getMinutes()
  return m === 0 ? `${h} Uhr` : `${h} Uhr ${m}`
}

export function gruss(d: Date): string {
  const h = d.getHours()
  return h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend'
}

/** Euro gesprochen: „123 Euro“ (ganze Euro reichen fürs Ohr) */
export function euro(cent: number): string {
  return `${Math.round(cent / 100).toLocaleString('de-DE')} Euro`
}

/** Tag im Jahr – damit Sprüche täglich wechseln, aber an einem Tag gleich bleiben */
export function tagNummer(d: Date): number {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86_400_000)
}

/** Sprüche ohne Arbeitsbezug (trocken, britisch, ein Hauch schwarzer Humor) – Emma ist der Labrador des Auftraggebers */
export const SPRUECHE: string[] = [
  'Emma hat übrigens signalisiert, dass das Frühstück ihrer Meinung nach überfällig ist. Ich habe ihr erklärt, dass ich dafür nicht zuständig bin. Sie war wenig beeindruckt.',
  'Falls Sie Emma suchen: Labradore befinden sich statistisch gesehen immer dort, wo zuletzt etwas Essbares war.',
  'Ich habe die Nacht damit verbracht, Ihre Daten zu prüfen. Sie haben geschlafen. Ich will mich nicht beschweren. Ich stelle es nur fest.',
  'Der Kaffee ist übrigens nicht meine Abteilung. Ich erwähne das nur vorsorglich.',
  'Emma lässt ausrichten, dass Gassi gehen bei jedem Wetter ein Grundrecht ist. Ich habe nicht widersprochen. Man wählt seine Kämpfe.',
  'Ich habe keine Gefühle, Sir. Aber wenn ich welche hätte, wären sie heute vorsichtig optimistisch.',
  'Die Werkstatt steht noch. Das ist, gemessen an manchen Montagen, ein Erfolg.',
  'Emma hat heute noch nichts angestellt. Jedenfalls nichts, wovon ich weiß.',
]

/** Wetter-Satz mit leisem Kommentar */
function wetterSatz(w: { grad: number | null; text: string | null }): string | null {
  if (w.grad == null && !w.text) return null
  const grad = w.grad != null ? `${Math.round(w.grad)} Grad` : ''
  const teile = [grad, w.text].filter(Boolean).join(' und ')
  const kalt = w.grad != null && w.grad <= 3 ? ' Ein guter Tag für die Werkstatt – und ein schlechter für Emmas Pfoten.' : ''
  return `Draußen sind es ${teile}.${kalt}`
}

/** Der ganze Bericht als einzelne Sätze (zum Vorlesen nacheinander und zum Anzeigen) */
export function morgenLage(e: LageEingabe): string[] {
  const s: string[] = []
  const b = e.bausteine
  s.push(`${gruss(e.jetzt)}, ${e.anrede}. Es ist ${uhrzeit(e.jetzt)}.`)
  if (b.has('wetter') && e.wetter) { const w = wetterSatz(e.wetter); if (w) s.push(w) }

  if (b.has('aufgaben') && e.aufgaben) {
    const a = e.aufgaben
    if (!a.anzahl) s.push('Auf Ihrer Liste steht nichts Dringendes. Ich bin mir nicht sicher, ob ich das beunruhigend finden soll.')
    else {
      s.push(`Auf Ihrer Liste ${mehrzahl(a.anzahl, 'steht', 'stehen')} ${zahl(a.anzahl)} ${mehrzahl(a.anzahl, 'Aufgabe', 'Aufgaben')}${a.neu ? `, ${zahl(a.neu)} davon ${mehrzahl(a.neu, 'ist', 'sind')} seit gestern neu` : ''}.`)
      if (a.wichtigste.length) s.push(`Ganz oben: ${a.wichtigste.slice(0, 3).join('; ')}.`)
    }
  }

  if (b.has('probleme') && e.probleme) {
    const p = e.probleme
    if (p.selbsttestRot) s.push('Der nächtliche Selbsttest hat Störungen gefunden. Die Einzelheiten liegen auf einer Karte bereit.')
    if (p.amazon.length) s.push(`Amazon meldet Probleme bei ${p.amazon.length === 1 ? p.amazon[0] : `${zahl(p.amazon.length, false)} Produkten: ${p.amazon.slice(0, 3).join(', ')}`}.`)
    if (!p.selbsttestRot && !p.amazon.length) s.push('In den Shops ist alles ruhig. Verdächtig ruhig, aber ruhig.')
  }

  if (b.has('lager') && e.lager && e.lager.namen.length) {
    const n = e.lager.namen
    s.push(`Knapp ${mehrzahl(n.length, 'wird', 'werden')}: ${n.slice(0, 3).join(', ')}${n.length > 3 ? ` und ${zahl(n.length - 3, false)} weitere` : ''}.`)
  }

  if (b.has('verkauf') && e.verkauf) {
    const v = e.verkauf
    if (!v.bestellungen) s.push('Gestern wurde nichts verkauft. Ich nehme an, die Kundschaft sammelt Kräfte.')
    else s.push(`Gestern ${mehrzahl(v.bestellungen, 'kam', 'kamen')} ${zahl(v.bestellungen)} ${mehrzahl(v.bestellungen, 'Bestellung', 'Bestellungen')} mit ${v.stueck === 1 ? 'einem Artikel' : `${zahl(v.stueck, false)} Artikeln`}, zusammen etwa ${euro(v.umsatzCent)}.`)
  }

  if (b.has('freigaben') && e.freigaben) s.push(`Im Marketing ${mehrzahl(e.freigaben, 'wartet', 'warten')} ${zahl(e.freigaben, false)} ${mehrzahl(e.freigaben, 'Vorschlag', 'Vorschläge')} auf Ihre Freigabe.`)

  // ungefähr jeden zweiten Tag ein Spruch, an einem Tag immer derselbe
  const t = tagNummer(e.jetzt)
  if (e.humor && t % 2 === 0) s.push(SPRUECHE[(t / 2) % SPRUECHE.length])
  s.push('Das wäre alles. Ich bin hier, falls Sie mich brauchen.')
  return s
}
