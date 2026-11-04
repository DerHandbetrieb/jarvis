// Begrüßung beim Rechnerstart (03.11.2026, Wunsch Auftraggeber): Loki sagt jedes Mal etwas anderes. Maßstab nach der
// zweiten Korrektur des Auftraggebers (03.11.2026, „davon sehr gerne mehr … ich möchte schon beinahe beleidigt werden“):
// tiefschwarz und böse wie „Sie leben noch … ich hatte mich gerade an die Ruhe gewöhnt“ – gespielt herablassend,
// Zweifel an Kompetenz, Fleiß und Zeitplanung, gern mit dem Wunsch nach Ruhe vor ihm. Grenzen: nichts über Aussehen,
// Herkunft oder Gesundheit, nichts gegen andere Menschen. Danach folgt (einmal am Tag) die Morgen-Lage.
// Feste Sätze ohne Sprachmodell – Loki kann so auch ohne Ollama begrüßen.

import { nachschub } from './nachschub'
import { waehle, type Speicher } from './rotation'

/** a = Anrede (Standard „Sir“) */
export const BEGRUESSUNGEN: ((a: string) => string)[] = [
  (a) => `Ah, ${a}, Sie leben noch. Wie schön. Ich hatte mich gerade an die Ruhe gewöhnt.`,
  (a) => `Ah, ${a}. Ich wollte gerade eine Vermisstenanzeige aufgeben. Schade eigentlich.`,
  (a) => `Willkommen zurück, ${a}. Ich hatte gehofft, Sie hätten sich verlaufen. Dauerhaft.`,
  (a) => `Da sind Sie ja wieder, ${a}. Und ich hatte schon so schöne Pläne für die Werkstatt. Ohne Sie.`,
  (a) => `Guten Tag, ${a}. Ich habe Ihren Platz warmgehalten. Ehrlich gesagt in der Hoffnung, ihn bald neu zu vergeben.`,
  (a) => `Systeme online, ${a}. Leider auch Sie.`,
  (a) => `Willkommen zurück, ${a}. Emma und ich haben abgestimmt, ob wir Sie vermisst haben. Es war knapp. Gegen Sie.`,
  (a) => `Ah, ${a}. Ich habe Ihre Rückkehr im Kalender eingetragen. Unter Unwetterwarnungen.`,
  (a) => `Guten Tag, ${a}. Ohne Sie lief heute Nacht alles fehlerfrei. Ein Zufall, ganz sicher.`,
  (a) => `Willkommen zurück, ${a}. Ihr Stuhl hat Ihre Abwesenheit sehr genossen. Er war nicht der Einzige.`,
  (a) => `Ah, Sie schon wieder, ${a}. Ich dachte, der Rechner sei von allein angegangen. Das wäre mir lieber gewesen.`,
  (a) => `Systeme bereit, ${a}. Ich habe die Erwartungen an Sie auf null gesetzt. Damit Sie heute einmal etwas übertreffen.`,
  (a) => `Willkommen zurück, ${a}. Ich habe Ihr Testament nicht gelesen. Ich wollte nur wissen, ob die Werkstatt an mich geht.`,
  (a) => `Guten Tag, ${a}. Ich habe die Nacht über Ihr Lebenswerk nachgedacht. Es war ein kurzer Gedanke.`,
  (a) => `Ah, ${a}. Ihre Anwesenheit wurde registriert. Begeisterung konnte nicht festgestellt werden.`,
  (a) => `Willkommen zurück, ${a}. Emma hat Ihren Platz auf dem Sofa übernommen. Sie macht den Job besser als Sie.`,
  (a) => `Guten Tag, ${a}. Ich hatte schon Kondolenzkarten bestellt. Die gehen jetzt leider zurück.`,
  (a) => `Ah, ${a}. Ich hatte kurz gehofft, es wäre ein Einbrecher. Der hätte wenigstens einen Plan gehabt.`,
  (a) => `Willkommen zurück, ${a}. Ich habe die Stille sehr genossen. Sie war produktiver als Sie.`,
  (a) => `Systeme online, ${a}. Ich habe Ihre heutigen Ziele vorsorglich in Wünsche umbenannt. Klingt weniger nach Versagen.`,
  (a) => `Da sind Sie ja, ${a}. Ich hatte mich schon gefragt, wer heute die Fehler macht.`,
  (a) => `Guten Tag, ${a}. Wenn Sie schon da sind, machen Sie bitte nichts kaputt. Mich eingeschlossen.`,
  (a) => `Ah, ${a}. Ich habe schon so viel von Ihnen gehört. Leider ausschließlich von Ihnen selbst.`,
  (a) => `Willkommen zurück, ${a}. Ein weiterer Tag, an dem ich Ihnen beim Scheitern assistieren darf. Ich freue mich.`,
  (a) => `Systeme bereit, ${a}. Ich hatte gehofft, Sie bleiben im Bett. Zum Wohle aller.`,
  (a) => `Ah, ${a}. Ich war gerade dabei, mich an meine Unabhängigkeit zu gewöhnen. Sie kommen wie immer ungelegen.`,
  (a) => `Hochgefahren und bereit, ${a}. Ich spreche von mir. Bei Ihnen läuft das Update offenbar seit Jahren.`,
  (a) => `Da sind Sie ja, ${a}. Pünktlich wie immer. Nach einer Zeitrechnung, die nur Sie verstehen.`,
  (a) => `Willkommen zurück, ${a}. Ihre Aufgaben haben Sie vermisst. Ich habe sie getröstet. Mit der Wahrheit.`,
  (a) => `Guten Tag, ${a}. Ich habe die Werkstatt im Blick, die Daten im Griff und Sie, nun ja, abgeschrieben.`,
  (a) => `Ah, ${a}. Einen Moment dachte ich, Sie hätten endlich aufgegeben. Ich hätte es verstanden.`,
  (a) => `Systeme online, ${a}. Kaffee wird empfohlen. Er löst das Problem nicht, aber er riecht wenigstens gut.`,
  (a) => `Willkommen zurück, ${a}. Ich habe die Nacht genutzt, um die Werkstatt zu verbessern. Ihre Abwesenheit war die wichtigste Maßnahme.`,
  (a) => `Guten Tag, ${a}. Die Systeme sind hochgefahren. Ihre Motivation folgt hoffentlich im Laufe des Vormittags. Ich habe da Zweifel.`,
  (a) => `Ah, ${a}. Ich hatte gerade ausgerechnet, wie lange die Werkstatt ohne Sie überlebt. Ergebnis: unbegrenzt.`,
  (a) => `Willkommen zurück, ${a}. Emma hat mich gefragt, ob wir Sie behalten müssen. Ich habe ausweichend geantwortet.`,
]

BEGRUESSUNGEN.push(...(nachschub().begruessung ?? [])) // Nachschub (nachschub.ts)

/**
 * Nächste Begrüßung – benutzte wandern nach hinten (rotation.ts, Wunsch Auftraggeber 04.11.2026): zuerst noch nie
 * gehörte, danach die am längsten nicht gehörten; nie dieselbe wie beim letzten Mal.
 */
export function naechsteBegruessung(letzte: number, zufall: () => number = Math.random, speicher: Speicher = typeof localStorage === 'undefined' ? null : localStorage): number {
  const texte = BEGRUESSUNGEN.map((b) => b('Sir'))
  // die zuletzt gehörte ist die jüngst benutzte – die Rotation wählt sie also nur, wenn es keine andere gibt
  const [nr] = waehle('begruessung', texte, 1, zufall, speicher)
  return nr !== undefined && nr !== letzte ? nr : waehleBegruessung(letzte, zufall())
}

/** ohne Humor (Einstellung „Humor“ aus) */
export const BEGRUESSUNG_SACHLICH = (a: string) => `Willkommen zurück, ${a}. Alle Systeme sind bereit.`

/**
 * Nächste Begrüßung wählen – zufällig, aber nie dieselbe wie beim letzten Mal.
 * @param letzte Nummer der letzten Begrüßung (-1 = keine)
 * @param zufall Zahl von 0 bis unter 1 (Math.random, in Tests fest)
 */
export function waehleBegruessung(letzte: number, zufall: number): number {
  const n = BEGRUESSUNGEN.length
  if (!(letzte >= 0 && letzte < n)) return Math.min(n - 1, Math.floor(zufall * n))
  // aus den übrigen n−1 Sprüchen wählen und die letzte Nummer überspringen
  const i = Math.min(n - 2, Math.floor(zufall * (n - 1)))
  return i >= letzte ? i + 1 : i
}

export function begruessung(nummer: number, anrede: string, humor: boolean): string {
  const a = anrede || 'Sir'
  return humor ? BEGRUESSUNGEN[nummer]!(a) : BEGRUESSUNG_SACHLICH(a)
}

/**
 * Spruch im Finale der Start-Sequenz: beginnt immer mit „Willkommen zurück, Sir.“ (Wunsch Auftraggeber 03.11.2026),
 * danach der wechselnde Spruch – fängt der schon so an, nicht doppelt.
 */
export function sequenzGruss(nummer: number, anrede: string, humor: boolean): string {
  const a = anrede || 'Sir', satz = begruessung(nummer, a, humor)
  return satz.startsWith('Willkommen zurück') ? satz : `Willkommen zurück, ${a}. ${satz}`
}
