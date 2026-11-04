// Neuigkeiten aus der Werkstatt (04.11.2026, Wunsch Auftraggeber: „Loki soll automatisch sagen, was Neues passiert ist –
// nur das neue Ereignis, nicht wieder alles“). Vergleicht jede frische Werkstatt-Lage mit dem, was Loki schon kennt, und
// liefert nur die neuen Ereignisse. Das Bekannte steht in %APPDATA%\Jarvis\neuigkeiten.json (Kennung → zuletzt gesehen),
// damit nach einem Neustart nicht alles noch einmal als neu gilt. Beim allerersten Abgleich wird nur gemerkt, nichts gemeldet.
// Ohne Electron-Abhängigkeit (Tests: neuigkeiten.test.js).

/** wie lange eine verschwundene Kennung noch als bekannt gilt – verhindert Doppelmeldungen, wenn ein Artikel um den
 *  Meldebestand pendelt oder eine Karte kurz aus der Liste fällt */
const MERKEN_MS = 72 * 3600_000

/** alle Ereignisse einer Lage als { schluessel, ereignis } (Reihenfolge = Reihenfolge der Ansage) */
function ereignisseDerLage(lage) {
  const e = lage?.ereignisse
  if (!e || !Array.isArray(e.bestellungen) || !Array.isArray(e.karten) || !Array.isArray(e.freigaben)) return null
  const aus = []
  for (const b of e.bestellungen) aus.push({ schluessel: `bestellung:${b.id}`, ereignis: { art: 'bestellung', kanal: String(b.kanal ?? ''), stueck: Number(b.stueck) || 0, cent: Number(b.cent) || 0, artikel: (b.artikel ?? []).map(String).slice(0, 3) } })
  for (const k of e.karten) aus.push({ schluessel: `karte:${k.id}`, ereignis: { art: k.amazon ? 'amazon' : 'aufgabe', titel: String(k.titel ?? ''), von: k.von ?? null, faellig: k.faellig ?? null } })
  for (const f of e.freigaben) aus.push({ schluessel: `freigabe:${f.id}`, ereignis: { art: 'freigabe', titel: String(f.titel ?? '') } })
  for (const l of Array.isArray(lage.lagerKnapp) ? lage.lagerKnapp : []) aus.push({ schluessel: `knapp:${l.name}|${l.variante ?? ''}`, ereignis: { art: 'knapp', name: String(l.name ?? ''), variante: l.variante ?? null, bestand: Number(l.bestand) || 0 } })
  const s = lage.selbsttest
  if (s && Number(s.rot) > 0) aus.push({ schluessel: `selbsttest:${s.am}`, ereignis: { art: 'selbsttest', rot: Number(s.rot) } })
  return aus
}

/**
 * @param {{ speicher: { lesen: () => string | null, schreiben: (text: string) => void }, jetzt?: () => number }} o
 */
function erstelleNeuigkeiten({ speicher, jetzt = () => Date.now() }) {
  let bekannt = null // Map schluessel → zuletzt gesehen (ms); null = noch nie abgeglichen
  try {
    const roh = speicher.lesen()
    if (roh) { const d = JSON.parse(roh); if (d && typeof d === 'object') bekannt = new Map(Object.entries(d).filter(([, z]) => Number.isFinite(z))) }
  } catch { bekannt = null }

  /** frische Lage abgleichen → neue Ereignisse (beim ersten Mal: keine) */
  function abgleichen(lage) {
    const liste = ereignisseDerLage(lage)
    if (!liste) return [] // ältere Fassung der Serverfunktion ohne Ereignisse – nichts melden, nichts merken
    const t = jetzt()
    const erstesMal = bekannt === null
    if (erstesMal) bekannt = new Map()
    const neu = []
    for (const { schluessel, ereignis } of liste) {
      if (!erstesMal && !bekannt.has(schluessel)) neu.push(ereignis)
      bekannt.set(schluessel, t)
    }
    for (const [s, z] of bekannt) if (t - z > MERKEN_MS) bekannt.delete(s)
    try { speicher.schreiben(JSON.stringify(Object.fromEntries(bekannt))) } catch { /* nächstes Mal wieder */ }
    return neu
  }
  return { abgleichen }
}

module.exports = { erstelleNeuigkeiten, ereignisseDerLage, MERKEN_MS }
