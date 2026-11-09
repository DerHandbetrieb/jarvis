import { nachschub } from "./nachschub"
import { amazonArtikel, ohneLangeNummern, PAUSE } from "./sprechtext"

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
  /** noch nicht versendete Bestellungen: Kanal und Artikel („2 mal Tasse“) */
  offen?: { anzahl: number; liste: { id?: number; kanal: string; artikel: string[] }[] } | null
  verkauf?: { bestellungen: number; stueck: number; umsatzCent: number } | null
  freigaben?: number | null
  /** Nur Neues (Wunsch Auftraggeber 08.11.2026: „nur Aktualisierungen“): Kennungen aus der Lage des Vortags (lageSchluessel).
   *  Was dort schon vorkam, wird nicht wiederholt; ohne Angabe die volle Lage. Wetter und „gestern“ kommen immer. */
  bekannt?: Set<string> | null
  /** Spitzen und Sprüche auswählen (dienst.ts: benutzte nach hinten, rotation.ts); ohne = nach Tag (Tests) */
  waehler?: (pool: string, liste: string[]) => string
}

/** Marke: Die Kennungen sind vollständig (alle Karten, Bestellungen mit Nummer). Ältere Einträge hatten nur die obersten 3 Karten. */
export const LAGE_STAND = 'stand:2'
/** Höchstens so viel Neues liest Loki je Thema einzeln vor – der Rest kommt am nächsten Tag */
const VORLESEN = { aufgaben: 3, offen: 4, lager: 6, amazon: 3 }
/** Kennung einer offenen Bestellung: die Nummer (gleiche Artikel im selben Kanal sind trotzdem eine neue Bestellung) */
const bestellKennung = (o: { id?: number; kanal: string; artikel: string[] }) => (o.id ? `bestellung:${o.id}` : `bestellung:${o.kanal}|${o.artikel.join(',')}`)

/**
 * Kennungen der heutigen Lage – werden gemerkt und beim nächsten Mal als `bekannt` übergeben (nur Neues).
 * Mit `alt` (Lage „nur Neues“) bleibt Neues weg, das über die Vorlese-Grenze ging: Es wurde nicht vorgelesen und kommt morgen.
 */
export function lageSchluessel(e: LageEingabe, alt: Set<string> | null = null): string[] {
  const nurGelesen = (k: string[], grenze: number) => { if (!alt) return k; const neu = k.filter((x) => !alt.has(x)); return k.filter((x) => alt.has(x) || neu.indexOf(x) < grenze) }
  const k: string[] = [LAGE_STAND]
  k.push(...nurGelesen((e.aufgaben?.wichtigste ?? []).map((t) => `aufgabe:${t}`), VORLESEN.aufgaben))
  k.push(...nurGelesen((e.offen?.liste ?? []).map(bestellKennung), VORLESEN.offen))
  k.push(...nurGelesen((e.lager?.namen ?? []).map((n) => `lager:${n}`), VORLESEN.lager))
  k.push(...nurGelesen((e.probleme?.amazon ?? []).map((a) => `amazon:${a}`), VORLESEN.amazon))
  if (e.probleme?.selbsttestRot) k.push('selbsttest:rot')
  if (e.freigaben) k.push(`freigaben:${e.freigaben}`)
  return k
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

  // Kapitel statt Aufzählung (Wunsch Auftraggeber 06.11.2026): Jedes Thema hat einen Einleitungssatz, dazwischen eine Pause
  const kapitel = () => { if (s[s.length - 1] !== PAUSE) s.push(PAUSE) }
  const ORDNUNG = ['Erstens', 'Zweitens', 'Drittens']
  const klar = (t: string) => ohneLangeNummern(t)

  const alt = e.bekannt ?? null, istNeu = (k: string) => !alt || !alt.has(k)
  // „nichts Neues“ nur, wenn Werkstatt-Daten da sind – sonst wüsste Loki es gar nicht (Prüf-Agent)
  let nichtsNeues = !!alt && (e.aufgaben != null || e.verkauf != null)
  // Was schon bekannt ist, nur als Zahl (Wunsch Auftraggeber 09.11.2026: „es sind noch vier Artikel zum Nachproduzieren“)
  const stand: string[] = []
  if (b.has('aufgaben') && e.aufgaben && alt) {
    const alleNeu = e.aufgaben.wichtigste.filter((t) => istNeu(`aufgabe:${t}`)), neu = alleNeu.map(klar).filter(Boolean).slice(0, VORLESEN.aufgaben)
    if (neu.length) {
      kapitel(); nichtsNeues = false
      s.push(`Neu unter Abarbeiten: ${alleNeu.length === 1 ? 'eine Karte' : `${zahl(alleNeu.length)} Karten`}. Insgesamt ${e.aufgaben.anzahl === 1 ? 'ist eine' : `sind ${zahl(e.aufgaben.anzahl)}`} offen.`)
      neu.forEach((w, i) => s.push(neu.length > 1 ? `${ORDNUNG[i]}: ${w}.` : `${w}.`))
      hieb(e.aufgaben.anzahl >= 8 ? SPITZEN.vieleAufgaben : SPITZEN.wenigeAufgaben)
    } else if (e.aufgaben.anzahl) stand.push(`Unter Abarbeiten ${e.aufgaben.anzahl === 1 ? 'ist noch eine Karte' : `sind noch ${zahl(e.aufgaben.anzahl)} Karten`} offen.`)
  } else if (b.has('aufgaben') && e.aufgaben) {
    kapitel()
    const a = e.aufgaben
    if (!a.anzahl) s.push('Unter Abarbeiten liegt nichts Dringendes. Ich bin mir nicht sicher, ob ich das beunruhigend finden soll.')
    else {
      s.push(`Kommen wir zum Abarbeiten: ${a.anzahl === 1 ? 'Eine Karte ist' : `${zahl(a.anzahl)} Karten sind`} offen${a.neu ? `, ${zahl(a.neu)} davon ${mehrzahl(a.neu, 'ist', 'sind')} neu` : ''}.`)
      const obenan = a.wichtigste.map(klar).filter(Boolean).slice(0, 3) // bleibt von einem Titel nichts übrig (nur Nummer), fällt er weg
      obenan.forEach((w, i) => s.push(obenan.length > 1 ? `${ORDNUNG[i]}: ${w}.` : `Ganz oben: ${w}.`))
      hieb(a.anzahl >= 8 ? SPITZEN.vieleAufgaben : SPITZEN.wenigeAufgaben)
    }
  }

  const offenNeu = (e.offen?.liste ?? []).filter((x) => istNeu(bestellKennung(x)))
  if (b.has('verkauf') && e.offen && e.offen.anzahl && alt && offenNeu.length) {
    kapitel(); nichtsNeues = false
    s.push(`Neue offene Bestellungen: ${offenNeu.length === 1 ? 'eine' : zahl(offenNeu.length)}. Insgesamt ${e.offen.anzahl === 1 ? 'wartet eine' : `warten ${zahl(e.offen.anzahl)}`} auf den Versand.`)
    for (const x of offenNeu.slice(0, 4)) { const artikel = x.artikel.map(klar).filter(Boolean); s.push(`${x.kanal}: ${artikel.length ? artikel.join(', ') : 'ohne Artikelangabe'}.`) }
    if (offenNeu.length > 4) s.push(`Dazu ${offenNeu.length - 4 === 1 ? 'eine weitere' : `${zahl(offenNeu.length - 4)} weitere`}.`)
  } else if (b.has('verkauf') && e.offen && e.offen.anzahl && alt) {
    stand.push(e.offen.anzahl === 1 ? 'Auf den Versand wartet weiterhin eine Bestellung.' : `Auf den Versand warten weiterhin ${zahl(e.offen.anzahl)} Bestellungen.`)
  } else if (b.has('verkauf') && e.offen && e.offen.anzahl && !alt) {
    kapitel()
    const o = e.offen
    s.push(`Zu den offenen Bestellungen: ${o.anzahl === 1 ? 'Eine Bestellung wartet' : `${zahl(o.anzahl)} Bestellungen warten`} auf den Versand.`)
    for (const x of o.liste.slice(0, 4)) { const artikel = x.artikel.map(klar).filter(Boolean); s.push(`${x.kanal}: ${artikel.length ? artikel.join(', ') : 'ohne Artikelangabe'}.`) }
    if (o.anzahl > 4) s.push(`Dazu ${o.anzahl - 4 === 1 ? 'eine weitere' : `${zahl(o.anzahl - 4)} weitere`}.`)
  }

  const lagerNeu = (e.lager?.namen ?? []).filter((n) => istNeu(`lager:${n}`))
  if (b.has('lager') && e.lager && lagerNeu.length) {
    kapitel(); nichtsNeues = false
    const n = lagerNeu
    s.push(alt ? `Neu zum Nachproduzieren: ${n.length === 1 ? 'ein Artikel' : `${zahl(n.length, false)} Artikel`}.` : `Zum Nachproduzieren haben wir ${n.length === 1 ? 'folgenden Artikel' : 'folgende Artikel'}.`)
    for (const x of n.map(klar).filter(Boolean).slice(0, VORLESEN.lager)) s.push(`${x}.`)
    if (n.length > VORLESEN.lager) s.push(n.length - VORLESEN.lager === 1 ? 'Und ein weiterer.' : `Und ${zahl(n.length - VORLESEN.lager, false)} weitere.`)
    if (alt && e.lager.namen.length > n.length) s.push(`Insgesamt sind es ${zahl(e.lager.namen.length, false)}.`)
    hieb(SPITZEN.lager)
  } else if (b.has('lager') && e.lager && e.lager.namen.length) {
    const n = e.lager.namen.length
    stand.push(n === 1 ? 'Zum Nachproduzieren steht immer noch ein Artikel an.' : `Zum Nachproduzieren stehen immer noch ${zahl(n, false)} Artikel an.`)
  }

  const amazonNeu = (e.probleme?.amazon ?? []).filter((a) => istNeu(`amazon:${a}`)), testNeu = !!e.probleme?.selbsttestRot && istNeu('selbsttest:rot')
  if (b.has('probleme') && e.probleme && alt) {
    const amazonAlt = e.probleme.amazon.length - amazonNeu.length
    if (amazonAlt) stand.push(amazonAlt === 1 ? 'Bei Amazon ist weiterhin ein Fall offen.' : `Bei Amazon sind weiterhin ${zahl(amazonAlt, false)} Fälle offen.`)
    if (e.probleme.selbsttestRot && !testNeu) stand.push('Der nächtliche Selbsttest meldet weiterhin Störungen.')
  }
  if (b.has('probleme') && e.probleme && (!alt || amazonNeu.length || testNeu)) {
    kapitel(); if (alt) nichtsNeues = false
    const p = alt ? { amazon: amazonNeu, selbsttestRot: testNeu } : e.probleme
    if (p.amazon.length && alt) {
      s.push(p.amazon.length === 1 ? 'Bei Amazon ist ein neuer Fall dazugekommen.' : `Bei Amazon sind ${zahl(p.amazon.length, false)} neue Fälle dazugekommen.`)
      for (const t of p.amazon.slice(0, 3)) { const name = amazonArtikel(t); s.push(name ? `Es geht um ${name}.` : 'Um welchen Artikel es geht, steht nicht auf der Karte.') }
      hieb(SPITZEN.probleme)
    } else if (p.amazon.length) {
      s.push(p.amazon.length === 1 ? 'Bei Amazon ist ein Fall offen.' : `Bei Amazon sind ${zahl(p.amazon.length, false)} Fälle offen.`)
      for (const t of p.amazon.slice(0, 3)) { const name = amazonArtikel(t); s.push(name ? `Es geht um ${name}.` : 'Um welchen Artikel es geht, steht nicht auf der Karte.') }
      hieb(SPITZEN.probleme)
    }
    if (p.selbsttestRot) s.push('Der nächtliche Selbsttest hat Störungen gefunden. Die Einzelheiten liegen auf einer Karte bereit.')
    if (!alt && !p.selbsttestRot && !p.amazon.length) s.push('In den Shops ist alles ruhig. Verdächtig ruhig, aber ruhig.')
  }

  if (b.has('verkauf') && e.verkauf) {
    kapitel()
    const v = e.verkauf
    if (!v.bestellungen) s.push('Gestern wurde nichts verkauft. Ich nehme an, die Kundschaft sammelt Kräfte.')
    else {
      s.push(`Zum gestrigen Tag: ${mehrzahl(v.bestellungen, 'Es kam', 'Es kamen')} ${zahl(v.bestellungen)} ${mehrzahl(v.bestellungen, 'Bestellung', 'Bestellungen')} mit ${v.stueck === 1 ? 'einem Artikel' : `${zahl(v.stueck, false)} Artikeln`} für ${euro(v.umsatzCent)}.`)
      // „wenig“ nur, wenn auch der Umsatz klein ist (unter 150 Euro)
      hieb(v.bestellungen < 5 && v.umsatzCent < 15000 ? SPITZEN.wenigVerkauft : SPITZEN.gutVerkauft)
    }
  }

  // Freigaben nur, wenn es mehr geworden sind als in der Lage des Vortags
  const freigabenVorher = Math.max(0, ...[...(alt ?? [])].filter((k) => k.startsWith('freigaben:')).map((k) => Number(k.slice(10)) || 0))
  if (b.has('freigaben') && e.freigaben && (!alt || e.freigaben > freigabenVorher)) {
    if (alt) nichtsNeues = false
    kapitel()
    s.push(`Zu den Freigaben: Es ${mehrzahl(e.freigaben, 'wartet', 'warten')} ${zahl(e.freigaben, false)} ${mehrzahl(e.freigaben, 'Vorschlag', 'Vorschläge')} auf Sie.`)
    hieb(SPITZEN.freigaben)
  }

  if (b.has('freigaben') && e.freigaben && alt && e.freigaben <= freigabenVorher) stand.push(e.freigaben === 1 ? 'Ein Vorschlag wartet noch auf Ihre Freigabe.' : `${zahl(e.freigaben, false).replace(/^./, (c) => c.toUpperCase())} Vorschläge warten noch auf Ihre Freigabe.`)
  if (nichtsNeues || stand.length) kapitel()
  if (nichtsNeues) s.push('Seit gestern gibt es nichts Neues.')
  s.push(...stand)
  kapitel()
  // ungefähr jeden zweiten Tag zusätzlich ein Spruch ohne Arbeitsbezug, an einem Tag immer derselbe
  if (e.humor && t % 2 === 0) s.push(anrede(e.waehler ? e.waehler('sprueche', SPRUECHE) : SPRUECHE[(t / 2) % SPRUECHE.length]))
  s.push(e.humor ? anrede(e.waehler ? e.waehler('schluss', SPITZEN.schluss) : spitze(SPITZEN.schluss, t)) : 'Das wäre alles. Ich bin hier, falls Sie mich brauchen.')
  return s
}
