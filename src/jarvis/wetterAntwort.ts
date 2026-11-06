// Fragen zum Wetter beantwortet L.O.K.I. nur aus den Messwerten der eigenen Station (06.11.2026, Vorgabe Auftraggeber:
// „ausnahmslos nur meine Wetterstation“). Darum geht so eine Frage nicht ans Sprachmodell, das sonst etwas dazuerfinden
// könnte: feste Sätze wie bei den Werkstatt-Fragen. Vorhersagen und Vergangenes gibt es nicht, Nichtgemessenes sagt er nicht.
// Whisper liefert Sätze oft ohne Satzzeichen, darum zählt die Satzform, nicht das Fragezeichen.
import { vereinfachen } from './befehle'
import { wetterAusCode, WETTER_WORT } from './wetter'

export type StationsWetter = { grad: number; code?: number | null; wolken?: number | null; feuchte?: number | null; wind?: number | null; boe?: number | null; druck?: number | null; regenRate?: number | null; regenHeute?: number | null }

// eindeutig Wetter, ganz gleich wie der Satz gebaut ist
const EINDEUTIG = /\b(wetter|wetterlage|wetterbericht|regnet|regnets|regnen|geregnet|schneit|schneien|geschneit|sonnig|bewoelkt|bedeckt|windig|windstill|stuermt|luftfeuchte|luftfeuchtigkeit|luftdruck|windgeschwindigkeit|windstaerke|friert|frost|minusgrade|regenschirm|schirm|jacke)\b/
// nur Wetter, wenn der Satz danach fragt („Regen in Regensburg“ oder „bis zu einem gewissen Grad“ sind es nicht)
const MEHRDEUTIG = /\b(regen|schnee|niederschlag|nass|sonne|sonnenschein|wolken?|himmel|wind|boe|boeen|sturm|nebel|neblig|gewitter|hagel|temperatur|temperaturen|grad|kalt|warm|draussen|vorhersage)\b/
const FRAGEFORM = /^(wie|wieviel|ist|sind|scheint|haben|hat|gibt|was|wird|weht|kommt|bleibt|sag mir|sag mal)\b/
// geht um etwas anderes
const ANDERES = /\b(witz|spruch|erzaehl\w*|kennst|grafikkarte|prozessor|kaffee|tee|rechner|computer|cpu|gpu|mein|meine|meinem|meiner|meinen|entfernt)\b/
const wetterstation = /\b(meine |meiner )?wetterstation\b/g

const REGEN = /\b(regen|regenschirm|schirm|regnet|regnets|regnen|geregnet|nass|schnee|schneit|schneien|geschneit|niederschlag)\b/
const RUECKBLICK_REGEN = /\b(geregnet|geschneit|heute|wie viel|wieviel)\b/
const HIMMEL = /\b(sonne|sonnig|sonnenschein|wolken?|bewoelkt|bedeckt|himmel)\b/
const WIND = /\b(wind|windig|windstill|boe|boeen|sturm|stuermt|windgeschwindigkeit|windstaerke)\b/
const FEUCHTE = /\b(luftfeuchte|luftfeuchtigkeit)\b/
const DRUCK = /\bluftdruck\b/
const UNMESSBAR = /\b(gewitter|hagel|nebel|neblig)\b/
const ZUKUNFT = /\b(morgen|uebermorgen|spaeter|nachher|naechste\w*|wochenende|vorhersage|wird|wirds|werden|soll es|heute noch)\b/
const VERGANGEN = /\b(gestern|vorgestern|letzte\w* (nacht|woche)|war|waren)\b/

/** Gruß und „heute Morgen“ sind keine Fragen nach morgen; die Wetterstation selbst ist kein Besitz wie „mein Kaffee“ */
const aufbereiten = (text: string) => vereinfachen(text).replace(/\bguten morgen\b/g, ' ').replace(/^morgen\b/, ' ').replace(/\bheute (morgen|frueh)\b/g, 'war').replace(wetterstation, 'wetter').replace(/\s+/g, ' ').trim()

/** Geht es ums Wetter? Dann antwortet die feste Logik, nie das Sprachmodell. */
export function istWetterFrage(text: string): boolean {
  const t = aufbereiten(text).replace(/^loki /, '')
  if (ANDERES.test(t)) return false
  return EINDEUTIG.test(t) || (MEHRDEUTIG.test(t) && FRAGEFORM.test(t))
}

const zahl = (n: number) => n.toLocaleString('de-DE', { maximumFractionDigits: 1 })
const grad = (g: number) => { const r = Math.round(g); return `${r < 0 ? 'minus ' : ''}${Math.abs(r)} Grad` }

/** w: Werte der Station, null = keine frischen Werte. Liefert die Sätze zum Vorlesen. */
export function wetterAntwort(text: string, w: StationsWetter | null, anrede: string): string[] {
  const t = aufbereiten(text), s: string[] = []
  if (VERGANGEN.test(t)) s.push(`Was vorhin war, kann ich nicht sagen, ${anrede}. Ich kenne nur, was Ihre Wetterstation gerade misst.`)
  else if (ZUKUNFT.test(t)) s.push(`Vorhersagen habe ich keine, ${anrede}. Ich kenne nur, was Ihre Wetterstation gerade misst.`)
  if (!w) { s.push(`Von Ihrer Wetterstation habe ich gerade keine frischen Werte, ${anrede}.`); return s }
  const art = w.code != null ? wetterAusCode(w.code, w.wolken ?? 0) : null
  s.push(`Draußen sind es ${grad(w.grad)}${art ? ` und ${WETTER_WORT[art]}` : ''}.`)
  if (REGEN.test(t)) {
    const rate = Number(w.regenRate), heute = Number(w.regenHeute)
    if (w.regenRate == null) s.push('Die Regenmessung liefert gerade keinen Wert.')
    else if (rate > 0) s.push(`Die Station misst gerade ${zahl(rate)} Millimeter pro Stunde.`)
    else s.push('Niederschlag misst die Station gerade nicht.')
    if (w.regenHeute != null && heute > 0) s.push(`Heute sind bisher ${zahl(heute)} Millimeter gefallen.`)
    else if (w.regenHeute != null && RUECKBLICK_REGEN.test(t)) s.push('Heute ist bisher nichts gefallen.')
  }
  if (HIMMEL.test(t) && !art) s.push('Wie der Himmel aussieht, kann die Station bei diesem Sonnenstand nicht messen.')
  if (UNMESSBAR.test(t)) s.push('Gewitter, Hagel und Nebel kann die Station nicht erkennen.')
  if (WIND.test(t) && w.wind != null) s.push(`Der Wind weht mit ${zahl(w.wind)} Kilometern pro Stunde${w.boe != null ? `, in Böen mit ${zahl(w.boe)}` : ''}.`)
  if (FEUCHTE.test(t) && w.feuchte != null) s.push(`Die Luftfeuchte liegt bei ${Math.round(w.feuchte)} Prozent.`)
  if (DRUCK.test(t) && w.druck != null) s.push(`Der Luftdruck liegt bei ${Math.round(w.druck)} Hektopascal.`)
  return s
}
