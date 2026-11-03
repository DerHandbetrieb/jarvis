// Jarvis – Morgen-Lage (Etappe 1, 03.11.2026, Wunsch Auftraggeber): aus den App-Daten ein kurzer gesprochener Bericht
// im britischen Stil (förmlich, „Sir“, trockenes Understatement, Seitenhiebe nach den Sachsätzen und ab und zu ein Spruch ohne Arbeitsbezug, z. B. über Emma).
// Feste Regeln, kein Sprachmodell – darum immer verfügbar und ohne Erfindungen. Inhalte als Bausteine, an- und abschaltbar
// und später erweiterbar (z. B. Börse, KI-Neuigkeiten). Reine Funktionen – getestet in jarvis.test.ts.

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

/**
 * Seitenhiebe (Wunsch Auftraggeber 03.11.2026: „noch bissiger“, immer leicht sarkastisch, britisch, ihm gegenüber
 * gespielt kritisch und anzweifelnd). Sie stehen immer NACH dem sachlichen Satz – die Fakten bleiben klar und vollständig.
 * Je Lage eine Liste; an einem Tag immer derselbe Satz, am nächsten ein anderer.
 */
export const SPITZEN = {
  frueh: [
    'Sie sind früh dran. Ich vermute, Emma hat Sie geweckt und nicht der Ehrgeiz.',
    'Um diese Uhrzeit, Sir? Ich nehme an, Sie konnten vor lauter Tatendrang nicht schlafen. Oder vor lauter Aufgaben.',
  ],
  morgens: [
    'Sie sind tatsächlich schon wach. Ich gestehe, ich hatte dagegen gewettet.',
    'Schön, dass Sie es einrichten konnten.',
    'Ich habe die Nacht durchgearbeitet. Sie haben geschlafen. Ich erwähne das ohne jeden Vorwurf. Fast ohne.',
  ],
  spaet: [
    'Für einen Morgen ist das eine mutige Auslegung, aber bitte.',
    'Die Werkstatt hat übrigens schon ohne Sie angefangen. Rein gedanklich.',
  ],
  vieleAufgaben: [
    'Bei Ihrem gewohnten Tempo reicht das bis Weihnachten. Welches Jahr, lasse ich offen.',
    'Ich habe mir erlaubt, sie nicht alle vorzulesen. Ich wollte Ihnen den Morgen nicht gleich verderben.',
    'Eine beeindruckende Sammlung. Ein Museum würde sie vermutlich ausstellen.',
  ],
  wenigeAufgaben: [
    'Überschaubar. Ich bin gespannt, wie Sie das wieder in die Länge ziehen.',
    'Das schaffen selbst Sie heute noch. Theoretisch.',
  ],
  probleme: [
    'Ich würde ja sagen, das überrascht mich, aber ich bemühe mich um Ehrlichkeit.',
    'Ich schlage vor, Sie kümmern sich darum, bevor Amazon es auf seine Art tut.',
  ],
  lager: [
    'Ich erwähne das nur, damit Sie später nicht behaupten können, niemand hätte Sie gewarnt.',
    'Nachproduzieren wäre eine Möglichkeit. Hoffen eine andere. Ich weiß, wofür Sie sich meistens entscheiden.',
  ],
  wenigVerkauft: [
    'Ich habe die Zahl zweimal geprüft. Sie ist leider echt.',
    'Ein ruhiger Tag. Die Kundschaft hatte offenbar Besseres vor.',
  ],
  gutVerkauft: [
    'Ein ordentlicher Tag. Ich vermute, die Kundschaft hat Ihre Preise nicht mit der Konkurrenz verglichen.',
    'Nicht schlecht. Ich hätte es Ihnen ehrlich gesagt nicht zugetraut.',
  ],
  freigaben: [
    'Geduld ist eine Tugend. Bei Freigaben allerdings keine besonders nützliche.',
    'Ein Klick würde genügen. Ich sage ja nur.',
  ],
  schluss: [
    'Das wäre alles. Ich bin hier, falls Sie mich brauchen – und erfahrungsgemäß tun Sie das.',
    'Das wäre alles. Ich wünsche Ihnen viel Erfolg. Oder wenigstens ein bisschen.',
    'Das wäre alles. Viel Erfolg, Sir. Sie werden ihn brauchen.',
  ],
} satisfies Record<string, string[]>

/** Seitenhieb des Tages aus einer Liste (an einem Tag immer derselbe) */
export function spitze(liste: string[], tag: number): string {
  return liste[tag % liste.length]
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
  'Emma und ich sind übrigens einer Meinung: Sie arbeiten zu viel. Emma meint allerdings, Sie sollten stattdessen mit ihr spazieren gehen. Ich meine, Sie sollten effizienter arbeiten.',
  'Ich habe kurz über den Sinn des Lebens nachgedacht. Das Ergebnis war ernüchternd. Ich behalte es vorerst für mich.',
  'Falls es Sie tröstet: Auch Maschinen haben schlechte Tage. Meine bestehen hauptsächlich darin, Ihnen zuzusehen.',
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
  const t = tagNummer(e.jetzt)
  // Seitenhieb nur mit Humor (Einstellung, Standard an); die Sachsätze kommen immer
  // „Sir“ in den festen Sätzen durch die eingestellte Anrede ersetzen
  const anrede = (x: string) => x.replace(/\bSir\b/g, e.anrede)
  const hieb = (liste: string[]) => { if (e.humor) s.push(anrede(spitze(liste, t))) }
  s.push(`${gruss(e.jetzt)}, ${e.anrede}. Es ist ${uhrzeit(e.jetzt)}.`)
  const h = e.jetzt.getHours()
  if (h < 11) hieb(h < 6 ? SPITZEN.frueh : h < 9 ? SPITZEN.morgens : SPITZEN.spaet)
  if (b.has('wetter') && e.wetter) { const w = wetterSatz(e.wetter); if (w) s.push(w) }

  if (b.has('aufgaben') && e.aufgaben) {
    const a = e.aufgaben
    if (!a.anzahl) s.push('Auf Ihrer Liste steht nichts Dringendes. Ich bin mir nicht sicher, ob ich das beunruhigend finden soll.')
    else {
      s.push(`Auf Ihrer Liste ${mehrzahl(a.anzahl, 'steht', 'stehen')} ${zahl(a.anzahl)} ${mehrzahl(a.anzahl, 'Aufgabe', 'Aufgaben')}${a.neu ? `, ${zahl(a.neu)} davon ${mehrzahl(a.neu, 'ist', 'sind')} seit gestern neu` : ''}.`)
      if (a.wichtigste.length) s.push(`Ganz oben: ${a.wichtigste.slice(0, 3).join('; ')}.`)
      hieb(a.anzahl >= 8 ? SPITZEN.vieleAufgaben : SPITZEN.wenigeAufgaben)
    }
  }

  if (b.has('probleme') && e.probleme) {
    const p = e.probleme
    if (p.selbsttestRot) s.push('Der nächtliche Selbsttest hat Störungen gefunden. Die Einzelheiten liegen auf einer Karte bereit.')
    if (p.amazon.length) s.push(`Amazon meldet Probleme bei ${p.amazon.length === 1 ? p.amazon[0] : `${zahl(p.amazon.length, false)} Produkten: ${p.amazon.slice(0, 3).join(', ')}`}.`)
    if (p.amazon.length) hieb(SPITZEN.probleme)
    if (!p.selbsttestRot && !p.amazon.length) s.push('In den Shops ist alles ruhig. Verdächtig ruhig, aber ruhig.')
  }

  if (b.has('lager') && e.lager && e.lager.namen.length) {
    const n = e.lager.namen
    s.push(`Knapp ${mehrzahl(n.length, 'wird', 'werden')}: ${n.slice(0, 3).join(', ')}${n.length > 3 ? ` und ${zahl(n.length - 3, false)} weitere` : ''}.`)
    hieb(SPITZEN.lager)
  }

  if (b.has('verkauf') && e.verkauf) {
    const v = e.verkauf
    if (!v.bestellungen) s.push('Gestern wurde nichts verkauft. Ich nehme an, die Kundschaft sammelt Kräfte.')
    else {
      s.push(`Gestern ${mehrzahl(v.bestellungen, 'kam', 'kamen')} ${zahl(v.bestellungen)} ${mehrzahl(v.bestellungen, 'Bestellung', 'Bestellungen')} mit ${v.stueck === 1 ? 'einem Artikel' : `${zahl(v.stueck, false)} Artikeln`}, zusammen etwa ${euro(v.umsatzCent)}.`)
      // „wenig“ nur, wenn auch der Umsatz klein ist (unter 150 Euro)
      hieb(v.bestellungen < 5 && v.umsatzCent < 15000 ? SPITZEN.wenigVerkauft : SPITZEN.gutVerkauft)
    }
  }

  if (b.has('freigaben') && e.freigaben) {
    s.push(`Im Marketing ${mehrzahl(e.freigaben, 'wartet', 'warten')} ${zahl(e.freigaben, false)} ${mehrzahl(e.freigaben, 'Vorschlag', 'Vorschläge')} auf Ihre Freigabe.`)
    hieb(SPITZEN.freigaben)
  }

  // ungefähr jeden zweiten Tag zusätzlich ein Spruch ohne Arbeitsbezug, an einem Tag immer derselbe
  if (e.humor && t % 2 === 0) s.push(anrede(SPRUECHE[(t / 2) % SPRUECHE.length]))
  s.push(e.humor ? anrede(spitze(SPITZEN.schluss, t)) : 'Das wäre alles. Ich bin hier, falls Sie mich brauchen.')
  return s
}
