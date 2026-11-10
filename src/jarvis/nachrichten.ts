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

/**
 * Sätze für sprechen(): Einleitung, ggf. Stand (nur wenn älter als 3 Stunden), dann je Meldung Überschrift und Text,
 * Kapitel-Pause zwischen den Meldungen, zum Schluss ein sachlicher Satz.
 */
export function nachrichtenSaetze(a: NachrichtenAntwort, o: { jetzt: Date; anrede: string; einleitung: string | null }): string[] {
  if ('fehler' in a) return [`Die Nachrichten des Deutschlandfunks kann ich gerade nicht abrufen, ${o.anrede}. Die Quelle antwortet nicht so, wie ich es erwarte.`]
  const meldungen = a.meldungen.filter((m) => !istWetter(m))
  if (!meldungen.length) return [`Der Deutschlandfunk liefert gerade keine Meldungen, ${o.anrede}.`]
  const s: string[] = []
  s.push(o.einleitung ?? 'Die Nachrichten des Deutschlandfunks.')
  const stand = a.stand ? new Date(a.stand) : null
  if (stand && !Number.isNaN(stand.getTime()) && o.jetzt.getTime() - stand.getTime() > 3 * 3_600_000) {
    const v = new Date(o.jetzt); v.setDate(v.getDate() - 1)
    const tag = stand.toDateString() === o.jetzt.toDateString() ? '' : stand.toDateString() === v.toDateString() ? 'gestern, ' : `${stand.getDate()}. ${['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][stand.getMonth()]}, `
    s.push(`Der Stand ist von ${tag}${uhrzeit(stand)}.`)
  }
  for (const m of meldungen) {
    s.push(PAUSE)
    s.push(mitPunkt(m.titel))
    if (m.text) s.push(m.text) // am Stück: Zerlegen bräche bei „9. November“ oder „Dr. Müller“ (Prüf-Agent)
  }
  s.push(PAUSE, 'Das waren die Nachrichten des Deutschlandfunks.')
  return s
}
