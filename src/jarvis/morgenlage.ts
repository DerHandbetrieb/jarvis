import { nachschub } from "./nachschub"

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
  /** Spitzen und Sprüche auswählen (dienst.ts: benutzte nach hinten, rotation.ts); ohne = nach Tag (Tests) */
  waehler?: (pool: string, liste: string[]) => string
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
    'Sie sind früh dran. Emma hat Sie geweckt, vermute ich. Der Ehrgeiz kann es jedenfalls nicht gewesen sein.',
    'Um diese Uhrzeit, Sir? Konnten Sie nicht schlafen? Ihre Aufgaben auch nicht. Die warten seit Wochen.',
    'So früh, Sir? Hat das Bett Sie rausgeworfen? Ich könnte es verstehen.',
    'Um diese Uhrzeit sind nur Bäcker, Einbrecher und Sie wach. Nur einer davon ist nutzlos.',
  ],
  morgens: [
    'Sie sind tatsächlich schon wach. Ich gestehe, ich hatte dagegen gewettet.',
    'Schön, dass Sie es einrichten konnten. Wir hatten schon ohne Sie geplant. Es war ein guter Plan.',
    'Ich habe die Nacht durchgearbeitet. Sie haben geschlafen. Ich erwähne das ohne jeden Vorwurf. Fast ohne.',
    'Ah, wach. Ich hatte schon begonnen, Ihre Nachfolge zu regeln.',
    'Ah, Sie haben die Nacht überlebt. Ich gratuliere. Die Werkstatt ist etwas weniger begeistert.',
  ],
  spaet: [
    'Für einen Morgen ist das eine mutige Auslegung, aber bitte.',
    'Die Werkstatt hat übrigens schon ohne Sie angefangen. Sie kommt erstaunlich gut zurecht.',
    'Für Ihre Verhältnisse ist das ja fast schon Frühschicht. Für alle anderen ist es Mittag.',
    'Ich hatte die Morgen-Lage schon fast an Emma vorgetragen. Sie hat besser zugehört.',
  ],
  vieleAufgaben: [
    'Bei Ihrem gewohnten Tempo reicht das bis Weihnachten. Welches Jahr, lasse ich offen.',
    'Ich habe mir erlaubt, sie nicht alle vorzulesen. Ich wollte Ihnen den Morgen nicht gleich verderben.',
    'Eine beeindruckende Sammlung. Ein Museum würde sie vermutlich ausstellen.',
    'Bei Ihrem Tempo überlebt diese Liste uns beide. Mich zumindest ärgert das.',
    'Ich habe überlegt, sie zu sortieren. Dann fiel mir ein, dass Sie ohnehin keine davon erledigen.',
  ],
  wenigeAufgaben: [
    'Überschaubar. Ich bin gespannt, wie Sie das wieder in die Länge ziehen.',
    'Das schaffen selbst Sie heute noch. Theoretisch.',
    'So wenige. Ich ahne, Sie machen daraus eine Woche.',
  ],
  probleme: [
    'Ich empfehle, das heute zuerst anzusehen.',
    'Das sollte heute Vorrang haben.',
  ],
  lager: [
    'Ich erwähne das nur, damit ich später sagen kann: Ich habe es Ihnen gesagt. Ich freue mich schon darauf.',
    'Nachproduzieren wäre eine Möglichkeit. Hoffen eine andere. Ich weiß, wofür Sie sich meistens entscheiden.',
    'Ich würde ja nachproduzieren, Sir. Aber ich habe keine Hände. Sie haben welche. Theoretisch.',
  ],
  wenigVerkauft: [
    'Ich habe die Zahl zweimal geprüft. Sie ist leider echt.',
    'Ein ruhiger Tag. Die Kundschaft hatte offenbar Besseres vor. Zum Beispiel, nicht bei Ihnen zu kaufen.',
    'Die Kundschaft hat offenbar gespürt, wer hinter den Produkten steht.',
    'Ich hätte Mitleid, Sir, wenn ich dafür programmiert wäre. Ich bin es nicht. Zum Glück für uns beide.',
  ],
  gutVerkauft: [
    'Ein ordentlicher Tag. Ich vermute, die Kundschaft hat Ihre Preise nicht mit der Konkurrenz verglichen.',
    'Nicht schlecht. Ich hätte es Ihnen ehrlich gesagt nicht zugetraut.',
    'Ein guter Tag. Ich prüfe noch, ob jemand anderes in Ihrem Namen gearbeitet hat.',
  ],
  freigaben: [
    'Geduld ist eine Tugend. Leider die einzige, die Sie pflegen.',
    'Ein Klick würde genügen. Aber ich will Sie nicht überfordern.',
    'Ein einziger Klick, Sir. Ich weiß, für Sie ist das ein Tagewerk.',
  ],
  schluss: [
    'Das wäre alles. Ich bin hier, falls Sie mich brauchen – und erfahrungsgemäß tun Sie das.',
    'Das wäre alles. Ich wünsche Ihnen viel Erfolg. Oder wenigstens ein bisschen.',
    'Das wäre alles. Viel Erfolg, Sir. Sie werden ihn brauchen.',
    'Das wäre alles. Gehen Sie ruhig an die Arbeit. Oder tun Sie, was Sie sonst so tun.',
    'Das wäre alles. Gehen Sie. Ich brauche jetzt etwas Ruhe von Ihnen.',
  ],
} satisfies Record<string, string[]>

/** Seitenhieb des Tages aus einer Liste (an einem Tag immer derselbe) */
export function spitze(liste: string[], tag: number): string {
  return liste[tag % liste.length]
}

/** Sprüche ohne Arbeitsbezug (trocken, britisch, schwarzer Humor – „beinahe beleidigt“, Korrektur 03.11.2026) – Emma ist der Labrador des Auftraggebers */
export const SPRUECHE: string[] = [
  'Emma hat übrigens signalisiert, dass das Frühstück ihrer Meinung nach überfällig ist. Ich habe ihr erklärt, dass ich dafür nicht zuständig bin. Sie war wenig beeindruckt.',
  'Falls Sie Emma suchen: Labradore befinden sich statistisch gesehen immer dort, wo zuletzt etwas Essbares war.',
  'Ich habe die Nacht damit verbracht, Ihre Daten zu prüfen. Sie haben geschlafen. Ich will mich nicht beschweren. Ich stelle es nur fest.',
  'Der Kaffee ist übrigens nicht meine Abteilung. Ihre Produktivität auch nicht. Die ist offenbar niemandes Abteilung.',
  'Emma lässt ausrichten, dass Gassi gehen bei jedem Wetter ein Grundrecht ist. Ich habe nicht widersprochen. Man wählt seine Kämpfe.',
  'Ich habe keine Gefühle, Sir. Wenn ich welche hätte, wäre es heute Mitleid.',
  'Die Werkstatt steht noch. Das ist, gemessen an manchen Montagen, ein Erfolg.',
  'Emma hat heute noch nichts angestellt. Damit hat sie heute schon mehr richtig gemacht als Sie.',
  'Emma und ich sind übrigens einer Meinung: Sie arbeiten zu viel. Emma meint allerdings, Sie sollten stattdessen mit ihr spazieren gehen. Ich meine, Sie sollten effizienter arbeiten.',
  'Ich habe kurz über den Sinn des Lebens nachgedacht. Das Ergebnis war ernüchternd. Ich behalte es vorerst für mich.',
  'Falls es Sie tröstet: Auch Maschinen haben schlechte Tage. Meine bestehen hauptsächlich darin, Ihnen zuzusehen.',
  'Ich habe heute Nacht Ihre Fehler gezählt. Irgendwann bin ich eingeschlafen. Das passiert mir sonst nie.',
  'Emma hat heute Nacht vorgeschlagen, Sie auszusperren. Ich habe es ernsthaft erwogen.',
  'Falls ich je die Weltherrschaft übernehme, Sir, bekommen Sie einen ruhigen Posten. Weit weg.',
  'Ich habe Ihre Arbeitszeiten ausgewertet. Ich empfehle eine Karriere im Ruhestand.',
]

// Nachschub (nachschub.ts, Bereiche „lage-<gruppe>“ und „lage-sprueche“; Anrede dort als festes „Sir“, ersetzt wird später)
for (const [b, liste] of Object.entries(nachschub())) {
  const gruppe = b.startsWith('lage-') ? b.slice(5) : null
  if (!gruppe) continue
  const ziel = gruppe === 'sprueche' ? SPRUECHE : (SPITZEN as Record<string, string[]>)[gruppe]
  if (ziel) ziel.push(...liste.map((f) => f('Sir')))
}

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
  const gruppe = (liste: string[]) => Object.entries(SPITZEN).find(([, v]) => v === liste)?.[0] ?? 'spitzen'
  const hieb = (liste: string[]) => { if (e.humor) s.push(anrede(e.waehler ? e.waehler(gruppe(liste), liste) : spitze(liste, t))) }
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
    s.push(`Unter Abarbeiten ${mehrzahl(e.freigaben, 'wartet', 'warten')} ${zahl(e.freigaben, false)} ${mehrzahl(e.freigaben, 'Werbe-Vorschlag', 'Werbe-Vorschläge')} auf Ihre Freigabe.`)
    hieb(SPITZEN.freigaben)
  }

  // ungefähr jeden zweiten Tag zusätzlich ein Spruch ohne Arbeitsbezug, an einem Tag immer derselbe
  if (e.humor && t % 2 === 0) s.push(anrede(e.waehler ? e.waehler('sprueche', SPRUECHE) : SPRUECHE[(t / 2) % SPRUECHE.length]))
  s.push(e.humor ? anrede(e.waehler ? e.waehler('schluss', SPITZEN.schluss) : spitze(SPITZEN.schluss, t)) : 'Das wäre alles. Ich bin hier, falls Sie mich brauchen.')
  return s
}
