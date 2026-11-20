// Deutschlandfunk-Nachrichten als Sätze zum Vorlesen (10.11.2026, Wunsch Auftraggeber). Die Meldungen kommen aus
// electron/dlfnachrichten.cjs. Text wortgetreu (Nutzungsbedingungen: keine Änderung), keine Seitenhiebe zwischen oder nach den
// Meldungen (ernste Themen) – nur ein Spruch davor. Der Wetterbericht des Deutschlandfunks entfällt: Wetter sagt Loki
// ausschließlich von der eigenen Station (Vorgabe Auftraggeber 06.11.2026).
import { PAUSE } from './sprechtext'

export type Meldung = { titel: string; text: string }
export type NachrichtenAntwort = { meldungen: Meldung[]; stand: string | null } | { fehler: string }

const istWetter = (m: Meldung) => /^wetter\s+-/i.test(m.titel)
const mitPunkt = (s: string) => (/[.!?…:"“”]$/.test(s) ? s : `${s}.`)
/** Uhrzeit wie gesprochen: „6 Uhr 1“, volle Stunde „6 Uhr“ */
const uhrzeit = (d: Date) => `${d.getHours()} Uhr${d.getMinutes() ? ` ${d.getMinutes()}` : ''}`

/** „Der Stand ist von gestern, 22 Uhr.“ – nur wenn älter als 3 Stunden (auch für die Original-Sendung, 20.11.2026) */
export function standSatz(stand0: string | null, jetzt: Date): string[] {
  const stand = stand0 ? new Date(stand0) : null
  if (!stand || Number.isNaN(stand.getTime()) || jetzt.getTime() - stand.getTime() <= 3 * 3_600_000) return []
  const v = new Date(jetzt); v.setDate(v.getDate() - 1)
  const tag = stand.toDateString() === jetzt.toDateString() ? '' : stand.toDateString() === v.toDateString() ? 'gestern, ' : `${stand.getDate()}. ${['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][stand.getMonth()]}, `
  return [`Der Stand ist von ${tag}${uhrzeit(stand)}.`]
}

/**
 * Sätze für sprechen(): Einleitung, ggf. Stand (nur wenn älter als 3 Stunden), dann je Meldung Überschrift und Text,
 * Kapitel-Pause zwischen den Meldungen, zum Schluss ein sachlicher Satz.
 */
export function nachrichtenSaetze(a: NachrichtenAntwort, o: { jetzt: Date; anrede: string; einleitung: string | null; ohneEinleitung?: boolean }): string[] {
  if ('fehler' in a) return [`Die Nachrichten des Deutschlandfunks kann ich gerade nicht abrufen, ${o.anrede}. Die Quelle antwortet nicht so, wie ich es erwarte.`]
  const meldungen = a.meldungen.filter((m) => !istWetter(m))
  if (!meldungen.length) return [`Der Deutschlandfunk liefert gerade keine Meldungen, ${o.anrede}.`]
  const s: string[] = []
  // Einleitung und Stand schon vor dem (gescheiterten) Originalton gesagt: nicht wiederholen
  if (!o.ohneEinleitung) { s.push(o.einleitung ?? 'Die Nachrichten des Deutschlandfunks.'); s.push(...standSatz(a.stand, o.jetzt)) }
  for (const m of meldungen) {
    s.push(PAUSE)
    s.push(mitPunkt(m.titel))
    if (m.text) s.push(m.text) // am Stück: Zerlegen bräche bei „9. November“ oder „Dr. Müller“ (Prüf-Agent)
  }
  s.push(PAUSE, 'Das waren die Nachrichten des Deutschlandfunks.')
  return s
}
