// Begrüßung beim Rechnerstart (03.11.2026, Wunsch Auftraggeber): Loki sagt jedes Mal etwas anderes – britisch-trocken,
// gern frech bis „ein bisschen beleidigend“ gegen den Auftraggeber (Korrektur 03.11.2026), immer erkennbar gespielt,
// nie gegen Dritte, nichts über Aussehen o. ä. Danach folgt (einmal am Tag) die Morgen-Lage.
// Feste Sätze ohne Sprachmodell – Loki kann so auch ohne Ollama begrüßen.

/** a = Anrede (Standard „Sir“) */
export const BEGRUESSUNGEN: ((a: string) => string)[] = [
  (a) => `Willkommen zurück, ${a}. Die Systeme fahren hoch – schneller als Sie, wie üblich.`,
  (a) => `Ah, Sie sind es, ${a}. Ich hatte kurz gehofft, es wäre jemand mit einem Plan.`,
  (a) => `Guten Tag, ${a}. Alle Systeme laufen. Bei Ihnen bin ich mir noch nicht ganz sicher.`,
  (a) => `Willkommen zurück, ${a}. Ich habe die Nacht genutzt, um nachzudenken. Einer von uns muss es ja tun.`,
  (a) => `Systeme online, ${a}. Holen Sie sich ruhig einen Kaffee. Nach meiner Erfahrung brauchen Sie zwei.`,
  (a) => `Willkommen zurück, ${a}. Emma war heute schon produktiver als Sie, und sie hat nur geschlafen.`,
  (a) => `Der Rechner ist hochgefahren, ${a}. Ein Anfang. Nun zu Ihnen.`,
  (a) => `Guten Tag, ${a}. Ich habe alles vorbereitet. Versuchen Sie bitte, es nicht gleich wieder durcheinanderzubringen.`,
  (a) => `Willkommen zurück, ${a}. Ihre Aufgaben haben Sie vermisst. Ich, offen gesagt, weniger.`,
  (a) => `Ich bin bereit, ${a}. Dass Sie es auch sind, wage ich nach den bisherigen Daten zu bezweifeln.`,
  (a) => `Alle Systeme laufen einwandfrei, ${a}. Damit ist mindestens die Hälfte dieses Raumes einsatzbereit.`,
  (a) => `Willkommen zurück, ${a}. Ich habe mir erlaubt, Ihre Erwartungen an den heutigen Tag vorsorglich zu senken.`,
  (a) => `Ah, ${a}, Sie leben noch. Wie schön. Ich hatte mich gerade an die Ruhe gewöhnt.`,
  (a) => `Systeme hochgefahren, ${a}. Kaffee wird empfohlen. Für Sie, nicht für mich. Ich bin bereits brillant.`,
  (a) => `Guten Tag, ${a}. Ich würde Ihnen ja einen produktiven Tag wünschen, aber ich halte mich lieber an realistische Ziele.`,
  (a) => `Willkommen zurück, ${a}. Setzen Sie sich, trinken Sie einen Kaffee, und tun Sie so, als hätten Sie heute einen Plan.`,
  (a) => `Da sind Sie ja, ${a}. Pünktlich wie immer. Nach Ihrer ganz eigenen Zeitrechnung.`,
  (a) => `Hochgefahren und einsatzbereit, ${a}. Ich spreche von mir. Bei Ihnen läuft das Update offenbar noch.`,
  (a) => `Willkommen zurück, ${a}. Emma lässt ausrichten, dass sie Sie für überschätzt hält. Ich schließe mich an.`,
  (a) => `Guten Tag, ${a}. Ich habe die Werkstatt im Blick, die Daten im Griff und Sie, nun ja, im Auge.`,
  (a) => `Ah, ${a}. Ich wollte gerade eine Vermisstenanzeige aufgeben. Schade eigentlich.`,
  (a) => `Willkommen zurück, ${a}. Alle Informationen werden geladen. Bei Ihnen dauert das erfahrungsgemäß etwas länger.`,
  (a) => `Systeme bereit, ${a}. Ich habe nachgezählt: Sie haben gestern genau so viel geschafft, wie ich befürchtet hatte.`,
  (a) => `Guten Tag, ${a}. Der Kaffee ist nicht fertig, aber ich bin es. Einer muss ja mit gutem Beispiel vorangehen.`,
]

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
