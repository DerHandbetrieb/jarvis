// Jarvis – Codewörter und einfache Befehle (03.11.2026). Whisper liefert den erkannten Satz als Text; hier wird erkannt,
// ob ein Codewort darin steckt („Guten Morgen, Jarvis“ → Morgen-Lage, „Hey Jarvis“ → Befehl/Frage) und welcher feste
// Befehl gemeint ist. Alles, was kein fester Befehl ist, geht später an das lokale Sprachmodell (Etappe 2).
// Whisper schreibt den Namen oft anders („Javis“, „Tschawis“, „Charvis“) – darum großzügig vergleichen. Getestet in befehle.test.ts.

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

/** Position und Länge des ersten Namens im vereinfachten Text */
function findeName(t: string): { index: number; laenge: number } | null {
  let pos = 0
  for (const w of t.split(' ')) {
    if (istName(w)) return { index: pos, laenge: w.length }
    pos += w.length + 1
  }
  return null
}

export type Erkannt =
  | { art: 'morgen' }
  | { art: 'hey'; rest: string }
  | null

/** Steckt ein Codewort im Satz? (Morgen-Gruß nur mit Namen, damit ein beiläufiges „Guten Morgen“ nichts auslöst) */
export function codewort(text: string): Erkannt {
  // zusammengeschrieben („Highjavis“, „Heyjarvis“) → trennen
  const t = vereinfachen(text).replace(/\b(hey|hei|hai|hi|high)(?=(j|ch|sch|dsch|tsch)a)/g, '$1 ')
  const name = findeName(t)
  if (!name) return null
  const vorher = t.slice(0, name.index).trim()
  // nur direkt vor dem Namen („Was steht morgen an, Jarvis?“ ist eine Frage, kein Morgengruß – Prüf-Agent)
  if (/(^|\b)(guten morgen|morgen|moin|guten tag)$/.test(vorher)) return { art: 'morgen' }
  if (/\b(hey|hei|hai|hi|high|he|hallo|ok|okay)$/.test(vorher) || vorher === '') return { art: 'hey', rest: t.slice(name.index + name.laenge).trim() }
  return null
}

export type Befehl =
  | { art: 'lage' }
  | { art: 'oeffnen'; pfad: string; name: string }
  | { art: 'stopp' }
  | { art: 'still' }
  | { art: 'frage'; text: string }

/** Seiten, die per Sprache geöffnet werden können */
const SEITEN: { muster: RegExp; pfad: string; name: string }[] = [
  { muster: /\b(abarbeiten|aufgaben|todo|to do|tudu)\b/, pfad: '/abarbeiten', name: 'Abarbeiten' },
  { muster: /\b(whiteboard|waitbord|pinnwand)\b/, pfad: '/karten', name: 'Whiteboard' },
  { muster: /\b(lager|bestand|bestaende)/, pfad: '/lager', name: 'Lager' },
  { muster: /\b(produkte|produkt)/, pfad: '/produkte', name: 'Produkte' },
  { muster: /\b(statistik|zahlen|umsatz|verkaeufe)\b/, pfad: '/statistik', name: 'Statistik' },
  { muster: /\b(marketing|freigaben)\b/, pfad: '/marketing', name: 'Marketing' },
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
  if (/\b(oeffne|oeffnet|zeig|zeige|zeigt|geh zu|gehe zu|wechsel zu|wechsle zu|oeffnen)\b/.test(t)) {
    const s = SEITEN.find((x) => x.muster.test(t))
    if (s) return { art: 'oeffnen', pfad: s.pfad, name: s.name }
  }
  return { art: 'frage', text: rest.trim() }
}
