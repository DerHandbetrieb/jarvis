// Jarvis – Codewörter und einfache Befehle (03.11.2026). Whisper liefert den erkannten Satz als Text; hier wird erkannt,
// ob ein Codewort darin steckt („Guten Morgen, Loki“ → Morgen-Lage, „Hey Loki“ → Befehl/Frage; „Jarvis“ geht weiterhin) und welcher feste
// Befehl gemeint ist. Alles, was kein fester Befehl ist, geht später an das lokale Sprachmodell (Etappe 2).
// Whisper schreibt den Namen oft anders („Javis“, „Tschawis“, „Charvis“) – darum großzügig vergleichen. Getestet in jarvis.test.ts.

/** Text vereinfachen: klein, ohne Satzzeichen, Umlaute aufgelöst, Mehrfach-Leerzeichen weg */
export function vereinfachen(text: string): string {
  return text.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Abstand zweier Wörter (Anzahl Buchstaben-Änderungen) */
function abstand(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}

/**
 * Ist das Wort „Jarvis“? Whisper (small, lokal getestet 03.11.2026) schreibt den Namen u. a. als „Chavis“, „Jawis“,
 * „Javi“, „Jarvis“ – darum lautlich vereinfacht vergleichen: Anlaut ch/sch/dsch/tsch/j/g → j, w → v, h und r weg.
 */
export function istName(wort: string): boolean {
  if (/^(gratis|garten|gar|ganz|gast|gab)/.test(wort)) return false // häufige Wörter, die sonst ähnlich aussehen
  // Anlaute so, wie Whisper „Dsch…“ schreibt (echte Probe 03.11.2026: „Tchaovis“)
  const k = wort.replace(/^(dsch|tsch|tch|dch|sch|ch|dj|tj|j|c)/, 'j').replace(/w/g, 'v').replace(/[hr]/g, '')
  if (!k.startsWith('j') || k.length < 4) return false
  // Endung -is/-es/-ez/-ez gleich behandeln (echte Probe 03.11.2026: „Chavez“)
  return abstand(k.replace(/[eiy][sz]$/, 'is'), 'javis') <= 1
}

/**
 * Ist das Wort „Loki“? Rufname seit 03.11.2026 (Entscheidung Auftraggeber). Whisper small schrieb im Test mit der
 * Thorsten-Stimme „Loki“, „Luki“, „Logi“ (vorschau/hoerproben/loki-test.cjs) – dazu englische Schreibweisen.
 * Nicht: „Loge“, „Luke“, „Lokal“ (andere Endung bzw. länger) und nicht „Lucky“/„Locky“ (Hunde- und Markenname – Prüf-Agent).
 * Breiter gefasst 06.11.2026 (Wunsch Auftraggeber): auch Lowki, Lokie, Lookie, Lohki, Loggy, Lukie, Lowkey usw.
 */
export function istLoki(wort: string): boolean {
  return /^(lo|loh|low|lou|loo|lu|luh)(k|kk|g|gg|q)(i|ie|y|ey|ee)$/.test(wort)
}

/** Ein Rufname: Loki (neu) oder Jarvis (Arbeitstitel, bleibt als zweiter Rufname erhalten) */
export function istRufname(wort: string): boolean {
  return istLoki(wort) || istName(wort)
}

/** Position und Länge des ersten Namens im vereinfachten Text */
function findeName(t: string): { index: number; laenge: number } | null {
  let pos = 0
  for (const w of t.split(' ')) {
    if (istRufname(w)) return { index: pos, laenge: w.length }
    pos += w.length + 1
  }
  return null
}

export type Erkannt =
  | { art: 'morgen' }
  | { art: 'hey'; rest: string }
  | null

/** Steckt ein Codewort im Satz? (Morgen-Gruß nur mit Namen, damit ein beiläufiges „Guten Morgen“ nichts auslöst) */
export function codewort(eingabe: string): Erkannt {
  // Whisper schreibt den Namen oft als „Low-Key“ (Rückmeldung Auftraggeber 06.11.2026), auch „Low Key“ oder „Lowkey“
  const text = eingabe.replace(/\b(low|lo|loh|lou)[\s-](key|keys|ki|kee|kie|ky)\b/gi, 'Loki').replace(/\blowkeys\b/gi, 'Loki')
  // zusammengeschrieben („Highjavis“, „Heyjarvis“, „Heiloki“ – echte Probe 03.11.2026) → trennen
  const t = vereinfachen(text)
    .replace(/\b(hey|hei|hai|hi|high)(?=(j|ch|sch|dsch|tsch)a)/g, '$1 ')
    .replace(/\b(hey|hei|hai|hi|high|hallo)(?=l(o|oh|ow|ou|oo|u|uh)(k|g|ck|q))/g, '$1 ')
  const name = findeName(t)
  if (!name) return null
  const vorher = t.slice(0, name.index).trim()
  // nur der Gruß allein vor dem Namen („Wie wird das Wetter morgen, Loki?“ ist eine Frage, kein Morgengruß – Prüf-Agent)
  if (/^((hey|hallo|hi|ja|also|na) )?(guten morgen|morgen|moin|guten tag)$/.test(vorher)) return { art: 'morgen' }
  if (/\b(hey|hei|hai|hi|high|he|hallo|ok|okay)$/.test(vorher) || vorher === '') return { art: 'hey', rest: t.slice(name.index + name.laenge).trim() }
  // ohne „Hey“ (Wunsch Auftraggeber 04.11.2026): Name als Anrede am Satzende ruft auch („Was steht heute an, Loki?“) –
  // nur mit Komma davor (Whisper setzt es bei Anreden), damit „… Thor und Loki.“ aus dem Fernseher nicht auslöst;
  // mitten im Satz („Ich habe Loki gesagt“) bleibt er ein erwähntes Wort
  if (t.slice(name.index + name.laenge).trim() === '' && /,\s*[^\s,]+[\s.!?…]*$/.test(text.trim())) return { art: 'hey', rest: vorher }
  return null
}

export type Befehl =
  | { art: 'lage' }
  | { art: 'oeffnen'; pfad: string; name: string }
  | { art: 'stopp' }
  | { art: 'still' }
  | { art: 'kamera'; kanal: number | null }
  | { art: 'frage'; text: string }

/** Seiten, die per Sprache geöffnet werden können */
const SEITEN: { muster: RegExp; pfad: string; name: string }[] = [
  // Werkstatt 0.145.0: Freigaben stehen unter Abarbeiten, Zahlen unter Auswertung, Marketing heißt Werbung
  { muster: /\b(abarbeiten|aufgaben|todo|to do|tudu|freigaben)\b/, pfad: '/abarbeiten', name: 'Abarbeiten' },
  { muster: /\b(whiteboard|waitbord|pinnwand)\b/, pfad: '/karten', name: 'Whiteboard' },
  { muster: /\b(lager|bestand|bestaende)/, pfad: '/lager', name: 'Lager' },
  { muster: /\b(produkte|produkt)/, pfad: '/produkte', name: 'Produkte' },
  { muster: /\b(auswertung|statistik|zahlen|umsatz|verkaeufe)\b/, pfad: '/auswertung', name: 'Auswertung' },
  { muster: /\b(werbung|marketing)\b/, pfad: '/werbung/amazon', name: 'Werbung' },
  { muster: /\b(ideen|ideenschmiede)\b/, pfad: '/recherche', name: 'Ideenschmiede' },
  { muster: /\b(maschinen|werkstatt)\b/, pfad: '/maschinen', name: 'Maschinen' },
  { muster: /\b(materialien|material)\b/, pfad: '/materialien', name: 'Materialien' },
  { muster: /\b(einstellungen)\b/, pfad: '/einstellungen', name: 'Einstellungen' },
  { muster: /\b(start|startseite|uebersicht)\b/, pfad: '/', name: 'Startseite' },
]

/** Fester Befehl aus dem Satz nach „Hey Jarvis“ (oder freie Frage) */
export function befehl(rest: string): Befehl {
  const t = vereinfachen(rest)
  if (!t) return { art: 'frage', text: '' }
  // nur der ganze Satz – „Halt mal …“ oder „Wann ist Pause?“ sind keine Befehle (Prüf-Agent)
  if (/^(stopp|stop|halt|ruhe|danke das reicht|schon gut)$/.test(t)) return { art: 'stopp' }
  if (/^(sei still|nicht zuhoeren|hoer auf zuzuhoeren|mikrofon aus|pause)$/.test(t)) return { art: 'still' }
  if (/\b(lage|morgenlage|bericht|zusammenfassung|was steht an|was gibt es neues)\b/.test(t)) return { art: 'lage' }
  // Kamera groß im Wallpaper: „Loki, zeig den Carport“, „Kamera weg“ (links = Objektiv 1, rechts = Objektiv 2)
  if (/\b(kamera|carport|bild)\b.*\b(weg|klein|schliessen)\b|\b(mach|schliess|schliesse)\b.*\b(kamera|carport)\b.*\b(zu|aus|klein|weg)\b/.test(t)) return { art: 'kamera', kanal: null }
  // tolerant gegen Verhörer kurzer Befehle (gespraech.log 06.11.2026: „Zeuge Carport“, „Zeigekamera, Carport“); der Name allein reicht
  if (/\b(zeig\w*|seig\w*|zeuge\w*|zeich(?!n)\w*)\b.*\b(kamera|carport|einfahrt|hof)\b|\bzeig\w*kamera\b|\b(kamera|carport)\b.*\bgross\b|\b(mach|hol)\b.*\b(kamera|carport)\b.*\b(gross|her)\b|^((die|den|das|zur|zum) )?(kamera|carport)( (kamera|carport|links|rechts|bitte))*$/.test(t)) return { art: 'kamera', kanal: /\b(rechts|rechte|rechten|zweite|zwei)\b/.test(t) ? 1 : 0 }
  if (/\b(oeffne|oeffnet|zeig|zeige|zeigt|geh zu|gehe zu|wechsel zu|wechsle zu|oeffnen)\b/.test(t)) {
    const s = SEITEN.find((x) => x.muster.test(t))
    if (s) return { art: 'oeffnen', pfad: s.pfad, name: s.name }
  }
  return { art: 'frage', text: rest.trim() }
}

/** Fragt der Satz nach Werkstatt-Daten oder Wetter? (dann bekommt das Sprachmodell die Daten mit) */
export function fragtNachDaten(text: string): boolean {
  return /wetter|regen|temperatur|grad|kalt|warm|aufgabe|todo|karte|lager|bestand|knapp|verkauf|verkauft|umsatz|bestellung|shop|etsy|amazon|freigabe|selbsttest|problem|zahlen|statistik|lage|neues|heute|gestern/.test(vereinfachen(text))
}

/**
 * Wiederholt eine neue Antwort eine frühere? (Rückmeldung Auftraggeber 04.11.2026: Loki gab im Gespräch oft wortgleich
 * seine vorige Antwort.) Vergleich über Dreiwort-Folgen: Steckt mehr als ein Drittel der neuen Folgen schon in einer
 * früheren Antwort, gilt sie als Wiederholung.
 */
export function istWiederholung(neu: string, frueher: string[]): boolean {
  const folgen = (t: string) => { const w = vereinfachen(t).split(' ').filter(Boolean); return new Set(w.slice(0, -2).map((_, i) => w.slice(i, i + 3).join(' '))) }
  const n = folgen(neu)
  if (n.size < 3) return frueher.some((f) => vereinfachen(f) === vereinfachen(neu))
  return frueher.some((f) => { const a = folgen(f); let gleich = 0; n.forEach((x) => { if (a.has(x)) gleich++ }); return gleich / n.size > 1 / 3 })
}

/**
 * Taugt ein Satz ohne Codewort als Nachfrage im Gespräch? Whisper „hört“ bei Lärm gern Floskeln aus Untertiteln
 * („Vielen Dank.“, „Untertitel im Auftrag des ZDF“) – die und Ein-Wort-Fetzen werden verworfen (Prüf-Agent 03.11.2026).
 */
export function istNachfrage(text: string): boolean {
  const t = vereinfachen(text)
  if (t.split(/\s+/).filter(Boolean).length < 2) return false
  // vereinfachen() macht aus ä/ü/ß ae/ue/ss
  return !/untertitel|amara|zdf|swr|^vielen dank( fuers zuschauen| fuer ihre aufmerksamkeit)?$|danke fuers zuschauen|bis zum naechsten mal|tschuess|copyright|abonnier|\bwww\b/.test(t)
}
