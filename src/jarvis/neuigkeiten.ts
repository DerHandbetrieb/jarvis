// Neuigkeiten aus der Werkstatt ansagen (04.11.2026, Wunsch Auftraggeber: „Loki soll automatisch sagen, was Neues passiert
// ist – nur das neue Ereignis“). Feste Vorlagen mit den echten Werten – kein Sprachmodell, damit nichts erfunden wird.
// Den Abgleich (was ist neu?) macht der Hauptprozess (electron/neuigkeiten.cjs); hier: auswählen und in Sätze fassen.
// Interview 04.11.2026: alle Arten (Bestellungen, Probleme, Aufgaben, Freigaben), nur wenn er am PC ist (Verpasstes
// gesammelt), eigene Karten (Konto „Alex“) nicht, nach jeder Meldung ein Seitenhieb.

export type Neuigkeit =
  | { art: 'bestellung'; id?: number; kanal: string; stueck: number; cent: number; artikel: string[] }
  | { art: 'aufgabe' | 'amazon'; titel: string; von: string | null; faellig: string | null }
  | { art: 'freigabe'; titel: string }
  | { art: 'knapp'; name: string; variante: string | null; bestand: number }
  | { art: 'selbsttest'; rot: number }
  /** Kamera-Wache (04.11.2026): die Kamera hat eine Person erkannt (nur linkes Objektiv) */
  | { art: 'person'; seite: 'links' | 'rechts' }
  /** 06.11.2026: die Kamera hat ein Fahrzeug erkannt */
  | { art: 'auto'; seite: 'links' | 'rechts'; /** Fotos zum Benennen abgelegt (07.11.2026) */ foto?: boolean }

/** Gruppen in den Einstellungen: „problem“ = Amazon-Problem, Selbsttest rot, Lager knapp */
export type NeuGruppe = 'bestellung' | 'problem' | 'aufgabe' | 'freigabe' | 'kamera'
export const NEU_GRUPPEN: { schluessel: NeuGruppe; titel: string }[] = [
  { schluessel: 'bestellung', titel: 'Bestellungen' },
  { schluessel: 'problem', titel: 'Probleme (Amazon, Selbsttest, Lager knapp)' },
  { schluessel: 'aufgabe', titel: 'Neue Aufgaben' },
  { schluessel: 'freigabe', titel: 'Neue Freigaben' },
]
export const gruppeVon = (n: Neuigkeit): NeuGruppe => (n.art === 'amazon' || n.art === 'selbsttest' || n.art === 'knapp' ? 'problem' : n.art === 'person' || n.art === 'auto' ? 'kamera' : n.art)

/** Werkstatt-Konto des Auftraggebers (profiles „Alex“) – seine eigenen Karten kennt er schon (Interview 04.11.2026) */
export const EIGENES_KONTO = '71f61d5f-318c-426c-8563-d0565fc53a1d'

/** Sammelkarte der Montags-Auswertung („Abarbeiten: Vorschläge freigeben“, bis Werkstatt 0.148.0 „Marketing: …“) –
 *  keine eigene Aufgabe: die Vorschläge selbst kommen schon als Freigaben (die Werkstatt-App blendet sie ebenfalls aus) */
export const istFreigabeSammelkarte = (titel: string) => /^\s*(abarbeiten|marketing)\s*:\s*vorschläge freigeben/i.test(titel)

/** Was tagsüber angesagt wurde, steht am nächsten Morgen nicht mehr als „neu“ in der Lage: Kennungen wie in lageSchluessel (morgenlage.ts). Freigaben zählt lageErgaenzen in dienst.ts. */
export function lageKennungen(n: Neuigkeit): string[] {
  if (n.art === 'bestellung') return n.id ? [`bestellung:${n.id}`] : []
  if (n.art === 'aufgabe' || n.art === 'amazon') return [`aufgabe:${n.titel}`, `amazon:${n.titel}`]
  if (n.art === 'knapp') return [`lager:${n.variante ? `${n.name} ${n.variante}` : n.name}`]
  if (n.art === 'selbsttest') return ['selbsttest:rot']
  return []
}

/** gewünschte Arten, eigene Karten und die Freigabe-Sammelkarte weg */
export function auswaehlen(liste: Neuigkeit[], gruppen: NeuGruppe[], eigenesKonto = EIGENES_KONTO): Neuigkeit[] {
  return liste.filter((n) => gruppen.includes(gruppeVon(n))
    && !((n.art === 'aufgabe' || n.art === 'amazon') && n.von && n.von === eigenesKonto)
    && !(n.art === 'aufgabe' && istFreigabeSammelkarte(n.titel)))
}

const ZAHL = ['null', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf']
/** „eine“, „zwei“ … bis zwölf, darüber Ziffern (für weibliche Wörter: Bestellung, Aufgabe, Freigabe) */
export const zahl = (n: number) => (n >= 0 && n < ZAHL.length ? ZAHL[n] : String(n))
const gross = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
/** 3980 → „39 Euro 80“ (so liest die Stimme es natürlich), 4000 → „40 Euro“ */
export function euro(cent: number): string {
  const c = Math.round(Math.abs(cent)), e = Math.floor(c / 100), r = c % 100
  return `${cent < 0 ? 'minus ' : ''}${e} Euro${r ? ` ${r < 10 ? `0${r}` : r}` : ''}`
}
/** „A“, „A und B“, „A, B und C“ */
export const aufzaehlen = (t: string[]) => (t.length <= 1 ? t[0] ?? '' : `${t.slice(0, -1).join(', ')} und ${t[t.length - 1]}`)
/** „2× Klettertasse“ → „2 mal Klettertasse“, „1× Tasse“ → „Tasse“ */
export const artikelText = (a: string) => sprechbar(a.replace(/^1× /, '').replace(/^(\d+)× /, '$1 mal '))
export const ohneAmazon = (t: string) => sprechbar(t.replace(/^amazon-problem:\s*/i, '').trim() || t)
/** Titel sprechbar machen: Emojis/Pfeile weg, & → und, / → Leerzeichen, gekürzte Titel ohne „…“ (Prüf-Agent) */
export const sprechbar = (t: string) => t.replace(/[\p{Extended_Pictographic}←-⇿➡]/gu, '').replace(/\s*&\s*/g, ' und ').replace(/\s*\/\s*/g, ' ').replace(/…$/, '').replace(/\s+/g, ' ').trim()
const satz = (s: string) => (/[.!?…]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`)

/** Sätze für eine Ansage. weg = er war nicht am PC → kurze Zusammenfassung (Probleme trotzdem einzeln) */
export function ansage(liste: Neuigkeit[], o: { anrede: string; humor: boolean; weg: boolean; spitze?: (bereich: Spitzenbereich) => string | null }): string[] {
  if (!liste.length) return []
  const best = liste.filter((n): n is Extract<Neuigkeit, { art: 'bestellung' }> => n.art === 'bestellung')
  const aufg = liste.filter((n) => n.art === 'aufgabe') as Extract<Neuigkeit, { titel: string; von: string | null }>[]
  const amaz = liste.filter((n) => n.art === 'amazon') as Extract<Neuigkeit, { titel: string; von: string | null }>[]
  const frei = liste.filter((n) => n.art === 'freigabe') as Extract<Neuigkeit, { art: 'freigabe' }>[]
  const knap = liste.filter((n) => n.art === 'knapp') as Extract<Neuigkeit, { art: 'knapp' }>[]
  const test = liste.filter((n) => n.art === 'selbsttest') as Extract<Neuigkeit, { art: 'selbsttest' }>[]
  const pers = liste.filter((n) => n.art === 'person'), autos = liste.filter((n) => n.art === 'auto')
  const s: string[] = []
  // Probleme immer zuerst und einzeln (wichtig), höchstens zwei genannt
  // Person an der Kamera zuerst – das ist das Eiligste (bei „weg“ gesammelt unten)
  if (pers.length && !o.weg) s.push(pers.length === 1 ? `${o.anrede}, eine Person nähert sich dem Grundstück.` : `${o.anrede}, an der Kamera war gerade ${zahl(pers.length) === 'zwei' ? 'zweimal' : `${zahl(pers.length)} Mal`} jemand.`)
  if (autos.length && !o.weg) s.push(autos.length === 1 ? `${o.anrede}, ein Auto fährt auf das Grundstück.` : `${o.anrede}, an der Kamera waren gerade ${zahl(autos.length)} Autos.`)
  // Erinnerung ans Benennen (Wunsch Auftraggeber 07.11.2026), nur wenn wirklich Fotos abgelegt wurden
  const fotos = autos.filter((n) => 'foto' in n && n.foto).length
  if (fotos && !o.weg) s.push(autos.length === 1 ? 'Ich habe es fotografiert. Einen Namen dürfen Sie ihm im Loki-Fenster geben.' : fotos === autos.length ? 'Ich habe sie fotografiert. Namen dürfen Sie im Loki-Fenster vergeben.' : 'Fotos zum Benennen liegen im Loki-Fenster.')
  for (const a of amaz.slice(0, 2)) s.push(satz(`Neues Amazon-Problem: ${ohneAmazon(a.titel)}`))
  if (amaz.length === 3) s.push('Dazu ein weiteres Amazon-Problem.')
  else if (amaz.length > 3) s.push(`Dazu ${zahl(amaz.length - 2)} weitere Amazon-Probleme.`)
  for (const t of test.slice(-1)) s.push(`Der Selbsttest meldet ${t.rot === 1 ? 'eine rote Prüfung' : `${zahl(t.rot)} rote Prüfungen`}.`)
  const summe = best.reduce((x, b) => x + b.cent, 0)
  if (o.weg) {
    const teile: string[] = []
    if (best.length) teile.push(`${best.length === 1 ? `eine neue Bestellung über ${euro(summe)}` : `${zahl(best.length)} neue Bestellungen über zusammen ${euro(summe)}`}`)
    if (aufg.length) teile.push(aufg.length === 1 ? 'eine neue Aufgabe' : `${zahl(aufg.length)} neue Aufgaben`)
    if (knap.length) teile.push(knap.length === 1 ? 'ein Artikel ist knapp geworden' : `${zahl(knap.length)} Artikel sind knapp geworden`)
    if (autos.length) teile.push(autos.length === 1 ? 'einmal war ein Auto auf dem Grundstück' : `${autos.length === 2 ? 'zweimal' : autos.length >= 5 ? 'mehrmals' : `${zahl(autos.length)} Mal`} waren Autos auf dem Grundstück`)
    if (pers.length) teile.push(pers.length === 1 ? 'einmal war jemand vor der Kamera' : pers.length >= 5 ? 'mehrmals war jemand vor der Kamera' : `${pers.length === 2 ? 'zweimal' : `${zahl(pers.length)} Mal`} war jemand vor der Kamera`)
    if (frei.length) teile.push(frei.length === 1 ? 'eine neue Freigabe' : `${zahl(frei.length)} neue Freigaben`)
    if (teile.length) s.unshift(`Während Sie weg waren, ${o.anrede}: ${aufzaehlen(teile)}.`)
    else if (s.length) s.unshift(`Während Sie weg waren, ${o.anrede}:`)
    if (fotos) s.push(autos.length === 1 ? 'Das Auto habe ich fotografiert, es wartet im Loki-Fenster auf einen Namen.' : 'Fotos zum Benennen liegen im Loki-Fenster.')
  } else {
    if (best.length === 1) {
      const b = best[0]
      const was = b.artikel.length ? `: ${aufzaehlen(b.artikel.map(artikelText))}` : ''
      s.push(satz(`Neue Bestellung${b.kanal ? ` bei ${b.kanal}` : ''}${was}, ${euro(b.cent)}`))
    } else if (best.length > 1) {
      const jeKanal = new Map<string, number>()
      for (const b of best) jeKanal.set(b.kanal, (jeKanal.get(b.kanal) ?? 0) + 1)
      s.push(`${gross(zahl(best.length))} neue Bestellungen über zusammen ${euro(summe)}: ${aufzaehlen([...jeKanal].map(([k, n]) => `${zahl(n)} bei ${k}`))}.`)
    }
    if (knap.length === 1) s.push(satz(`Im Lager wird es knapp: ${knap[0].name}${knap[0].variante ? ` ${knap[0].variante}` : ''}, noch ${knap[0].bestand} Stück`))
    else if (knap.length > 1) s.push(satz(`${gross(zahl(knap.length))} Artikel sind jetzt knapp, darunter ${knap[0].name}${knap[0].variante ? ` ${knap[0].variante}` : ''}`))
    if (aufg.length === 1) s.push(satz(`Neue Aufgabe: ${sprechbar(aufg[0].titel)}`))
    else if (aufg.length > 1) s.push(satz(`${gross(zahl(aufg.length))} neue Aufgaben, darunter: ${aufzaehlen(aufg.slice(0, 2).map((a) => sprechbar(a.titel)))}`))
    if (frei.length === 1) s.push(satz(`Eine neue Freigabe wartet unter Abarbeiten auf Sie: ${sprechbar(frei[0].titel)}`))
    else if (frei.length > 1) s.push(`${gross(zahl(frei.length))} neue Freigaben warten unter Abarbeiten auf Sie.`)
  }
  if (o.humor && o.spitze) {
    const nurKamera = pers.length + autos.length === liste.length
    const bereich: Spitzenbereich = o.weg ? (nurKamera ? (pers.length ? 'kamera-zurueck' : 'auto-zurueck') : 'zurueck') : pers.length ? 'kamera' : autos.length ? 'auto' : amaz.length || test.length ? 'problem' : best.length ? 'bestellung' : knap.length ? 'knapp' : aufg.length ? 'aufgabe' : 'freigabe'
    const sp = o.spitze(bereich)
    if (sp) s.push(sp)
  }
  return s
}

export type Spitzenbereich = 'bestellung' | 'aufgabe' | 'problem' | 'knapp' | 'freigabe' | 'zurueck' | 'kamera' | 'kamera-zurueck' | 'auto' | 'auto-zurueck'
