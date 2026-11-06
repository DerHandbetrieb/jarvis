// Fragen zur Werkstatt beantwortet L.O.K.I. nur aus echten Daten (06.11.2026, Rückmeldung Auftraggeber: „Was für
// Bestellungen hatten wir gestern?“ – das Sprachmodell kannte nur Summen und erfand die Einzelheiten).
// Darum geht so eine Frage gar nicht mehr ans Sprachmodell: Feste Sätze aus der Serverfunktion jarvis-lage. Steht etwas
// nicht in den Daten, sagt er das. Genau das Sprachmodell bekommt keine Werkstatt-Zahlen mehr.
import { vereinfachen } from './befehle'
import type { WerkstattLage } from './desktop'
import { aufzaehlen, artikelText, euro, istFreigabeSammelkarte, ohneAmazon, sprechbar, zahl, type Spitzenbereich } from './neuigkeiten'

const HOECHSTENS_ALT = 60 * 60_000
const MUSTER = /bestell|verkauf|verkauft|umsatz|einnahm|(?<!work)shop|etsy|\bamazon(?!as)|ebay|aufgabe|to ?do|\bkarten?\b|\blager|\bbestand(?!teil)|freigabe|selbsttest|werkstatt|auswertung|statistik|artikel|auftraeg|auftrag|paket|versand|\bkunde|\brechnung|\bzahlen\b/

/** Geht es um die Werkstatt? Dann antwortet die feste Logik, nie das Sprachmodell. */
export const istWerkstattFrage = (text: string) => MUSTER.test(vereinfachen(text))
/** Kurze Nachfrage direkt nach einer Werkstatt-Antwort („und welche Artikel?“) gehört noch dazu */
export function istAnschlussFrage(text: string): boolean {
  const t = vereinfachen(text)
  return t.split(' ').length <= 7 && /\b(welche|welcher|welches|wie viel|wieviel|genau|details|mehr|davon|heute|gestern|vorgestern)\b/.test(t) && !/wetter|regen|temperatur|grad|witz|emma/.test(t)
}
const ZEITWORT = /\b(heute|gestern|vorgestern|diese woche|letzte woche|letzten woche)\b/gi
/** Nachfrage mit eigener Zeitangabe: die neue gilt, die alte fällt weg („… gestern?“ + „und heute?“) */
export const fragenVerbinden = (alt: string, neu: string) => `${neu.search(ZEITWORT) >= 0 ? alt.replace(ZEITWORT, ' ') : alt} ${neu}`

export type Ereignisse = { bestellungen?: { am?: string; kanal?: string; stueck?: number; cent?: number; artikel?: string[] }[] }
export type LageMitEreignissen = WerkstattLage & { ereignisse?: Ereignisse; offeneBestellungen?: { anzahl?: number } }

const tagVon = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const mehrzahl = (n: number, ein: string, viele: string) => (n === 1 ? `eine ${ein}` : `${zahl(n)} ${viele}`)
const MAX_EINZELN = 4
const gross = (x: string) => x.charAt(0).toUpperCase() + x.slice(1)

function bestellSaetze(t: string, l: LageMitEreignissen, jetzt: Date, a: string): string[] {
  // Zeiträume, zu denen keine Zahlen vorliegen: ehrlich sagen statt „gestern“ zu antworten
  if (/monat|\bjahr|quartal|januar|februar|maerz|april|\bmai\b|juni|juli|august|september|oktober|november|dezember|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag/.test(t)) return [`Für diesen Zeitraum habe ich keine Zahlen, ${a}. Ich kenne heute, gestern, vorgestern und die Summen über sieben und vierzehn Tage.`]
  if (/offen/.test(t)) { const n = l.offeneBestellungen?.anzahl; return [n == null ? `Zu offenen Bestellungen liegt mir nichts vor, ${a}.` : n ? `Offen sind ${mehrzahl(n, 'Bestellung', 'Bestellungen')}, ${a}.` : `Es ist keine Bestellung offen, ${a}.`] }
  const kanal = t.match(/\b(etsy|amazon|ebay|shop)\b/)?.[1] ?? null
  const vorgestern = /vorgestern/.test(t), woche = /woche|sieben tage|7 tage/.test(t), zwei = /14 tage|zwei wochen|vierzehn/.test(t)
  if (woche || zwei) {
    const liste = l.verkauf.tage.slice(zwei ? -14 : -7), n = liste.reduce((s, x) => s + x.bestellungen, 0), c = liste.reduce((s, x) => s + x.umsatzCent, 0)
    return [`In den letzten ${zwei ? 'vierzehn' : 'sieben'} Tagen einschließlich heute waren es ${mehrzahl(n, 'Bestellung', 'Bestellungen')} mit ${euro(c)} Umsatz, ${a}.${kanal ? ' Das ist die Summe aller Kanäle.' : ''}`]
  }
  const heute = !vorgestern && /heute/.test(t) && !/gestern/.test(t)
  const tag = new Date(jetzt); tag.setDate(tag.getDate() - (heute ? 0 : vorgestern ? 2 : 1))
  const name = heute ? 'Heute' : vorgestern ? 'Vorgestern' : 'Gestern', kennung = tagVon(tag)
  const wert = l.verkauf.tage.find((x) => x.tag === kennung) ?? (l.verkauf.gestern.tag === kennung ? l.verkauf.gestern : null)
  if (!wert) return [`Für ${name.toLowerCase()} habe ich keine Zahlen, ${a}.`]
  if (!wert.bestellungen) return [`${name} gab es keine Bestellung, ${a}.`]
  const saetze = [`${name} waren es ${mehrzahl(wert.bestellungen, 'Bestellung', 'Bestellungen')} mit ${euro(wert.umsatzCent)} Umsatz.`]
  if (vorgestern) return saetze // Einzelbestellungen reichen nur 48 Stunden zurück – für vorgestern wäre die Liste lückenhaft
  const einzelnAlle = (l.ereignisse?.bestellungen ?? []).filter((b) => b.am && tagVon(new Date(b.am)) === kennung)
  const einzeln = kanal ? einzelnAlle.filter((b) => (b.kanal ?? '').toLowerCase().includes(kanal)) : einzelnAlle
  if (kanal) { // gefragt ist nur ein Kanal: Einzelbestellungen reichen 48 Stunden zurück, die Gesamtsumme ist dann die falsche Antwort
    const nameK = sprechbar(kanal === 'shop' ? 'im eigenen Shop' : `bei ${gross(kanal)}`)
    if (!einzelnAlle.length) return [...saetze, `Das ist die Summe aller Kanäle. ${name} nur ${nameK} kann ich nicht nennen, ${a}.`]
    if (!einzeln.length) return [`${name} gab es ${nameK} keine Bestellung, ${a}.`]
    return [`${name} ${nameK}: ${mehrzahl(einzeln.length, 'Bestellung', 'Bestellungen')} mit ${euro(einzeln.reduce((s, b) => s + (b.cent ?? 0), 0))}, ${a}.`, ...einzeln.slice(0, MAX_EINZELN).map((b) => { const artikel = (b.artikel ?? []).map(artikelText); return `${artikel.length ? aufzaehlen(artikel) : `${zahl(b.stueck ?? 0)} Stück`}, ${euro(b.cent ?? 0)}.` })]
  }
  if (einzeln.length) {
    for (const b of einzeln.slice(0, MAX_EINZELN)) {
      const artikel = (b.artikel ?? []).map(artikelText)
      saetze.push(`${sprechbar(b.kanal || 'Unbekannter Kanal')}: ${artikel.length ? aufzaehlen(artikel) : `${zahl(b.stueck ?? 0)} Stück`}, ${euro(b.cent ?? 0)}.`)
    }
    const rest = wert.bestellungen - Math.min(einzeln.length, MAX_EINZELN) // aus der Summe, nicht aus der (begrenzten) Liste
    if (rest > 0) saetze.push(`Dazu ${rest === 1 ? 'eine weitere' : `${zahl(rest)} weitere`}.`)
  } else if (l.verkauf.gestern.tag === kennung && l.verkauf.gestern.kanaele.length) {
    saetze.push(`Nach Kanal: ${aufzaehlen(l.verkauf.gestern.kanaele.map((k) => `${k.kanal} ${zahl(k.bestellungen)}`))}. Die einzelnen Artikel liegen mir dazu nicht vor.`)
  } else saetze.push('Die einzelnen Artikel liegen mir dazu nicht vor.')
  return saetze
}

/**
 * Antwort auf eine Werkstatt-Frage. saetze = zum Vorlesen, bereich = für den Seitenhieb (keiner bei Problemen oder ohne Daten).
 * Kein Thema erkannt oder keine Daten: ehrlich sagen, nichts raten.
 */
export function werkstattAntwort(text: string, l: LageMitEreignissen | null, jetzt: Date, anrede: string): { saetze: string[]; bereich: Spitzenbereich | null } {
  const t = vereinfachen(text), a = anrede || 'Sir'
  if (!l || !(jetzt.getTime() - l.geholt < HOECHSTENS_ALT)) return { saetze: [`Zur Werkstatt habe ich gerade keine aktuellen Daten, ${a}. Raten werde ich nicht.`], bereich: null }
  const s: string[] = []
  let bereich: Spitzenbereich | null = null
  try {
    // „Welche Artikel sind im Lager knapp?“ ist eine Lagerfrage, keine Bestellfrage
    const umsLager = /\blager|\bbestand(?!teil)/.test(t)
    if (/bestell|verkauf|verkauft|umsatz|einnahm|(?<!work)shop|etsy|ebay|auftraeg|auftrag|paket|versand|\bzahlen\b|auswertung|statistik/.test(t) || (/artikel/.test(t) && !umsLager)) { s.push(...bestellSaetze(t, l, jetzt, a)); bereich = 'bestellung' }
    if (/aufgabe|to ?do|\bkarten?\b/.test(t)) {
      const w = l.aufgaben.wichtigste.filter((x) => !istFreigabeSammelkarte(x.titel)).slice(0, 3).map((x) => sprechbar(x.titel))
      s.push(`Offen sind ${mehrzahl(l.aufgaben.offen, 'Aufgabe', 'Aufgaben')}.${w.length ? ` Am wichtigsten: ${aufzaehlen(w)}.` : ''}`); bereich ??= 'aufgabe'
    }
    if (umsLager) {
      const k = l.lagerKnapp.map((x) => sprechbar(x.variante ? `${x.name} ${x.variante}` : x.name))
      s.push(k.length ? `Knapp im Lager: ${aufzaehlen(k.slice(0, 5))}${k.length > 5 ? ` und ${zahl(k.length - 5)} weitere` : ''}.` : 'Im Lager ist nichts knapp.'); bereich ??= 'knapp'
    }
    if (/freigabe/.test(t)) { s.push(l.freigaben ? `Offen sind ${mehrzahl(l.freigaben, 'Freigabe', 'Freigaben')}.` : 'Es warten keine Freigaben.'); bereich ??= 'freigabe' }
    if (/amazon/.test(t) && !/bestell|umsatz|verkauf/.test(t)) {
      const p = l.aufgaben.amazonProbleme
      s.push(p.length ? `Bei Amazon liegen ${mehrzahl(p.length, 'Meldung', 'Meldungen')} vor: ${aufzaehlen(p.slice(0, 3).map(ohneAmazon))}.` : 'Bei Amazon liegt nichts vor.')
    }
    if (/selbsttest/.test(t)) s.push(l.selbsttest ? (l.selbsttest.rot ? `Im letzten Selbsttest sind ${zahl(l.selbsttest.rot)} Punkte rot.` : 'Der letzte Selbsttest ist in Ordnung.') : 'Zum Selbsttest liegt mir nichts vor.')
  } catch { return { saetze: [`Die Werkstatt-Daten kann ich gerade nicht lesen, ${a}. Raten werde ich nicht.`], bereich: null } }
  if (!s.length) return { saetze: [`Das steht nicht in den Daten, die ich aus der Werkstatt bekomme, ${a}. Ich kenne Bestellungen, Aufgaben, Lager, Freigaben und den Selbsttest.`], bereich: null }
  return { saetze: s, bereich }
}
