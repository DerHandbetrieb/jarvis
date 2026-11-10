// Deutschlandfunk-Nachrichten zum Vorlesen (10.11.2026, Wunsch Auftraggeber: nach der Morgen-Lage und auf Zuruf alle aktuellen
// Meldungen hören). Quelle: der Feed „Fortlaufende Nachrichten“ https://www.deutschlandfunk.de/nachrichten-100.rss (20 Meldungen,
// je Überschrift + ein Satz). Eine offizielle Feed-Übersicht gibt es nicht, die Adresse kann sich ändern → dann ehrlich melden.
// Nutzungsbedingungen (deutschlandfunk.de/nutzungsbedingungen-102.html): nur privat und nicht kommerziell; Vervielfältigung,
// Änderung, Neuzusammenstellung und Speicherung brauchen eine Zustimmung. Darum: nur für den Auftraggeber vorlesen, Text
// wortgetreu (nur HTML und Zeichen-Codes entfernt), nichts auf die Festplatte, nur kurz im Arbeitsspeicher.
const ADRESSE = 'https://www.deutschlandfunk.de/nachrichten-100.rss'

const ZEICHEN = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
function entschluesseln(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, c) => {
    if (c[0] === '#') { const n = c[1] === 'x' || c[1] === 'X' ? parseInt(c.slice(2), 16) : Number(c.slice(1)); return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m }
    return ZEICHEN[c.toLowerCase()] ?? m
  })
}
const feld = (x, t) => { const m = x.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)</${t}>`)); return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') : '' }
const reinerText = (s) => entschluesseln(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()

/** Feed-Text → { meldungen: [{ titel, text }], stand: Date|null } – höchstens 20 Meldungen, leere übersprungen */
function lesen(xml) {
  const meldungen = []
  let stand = null
  for (const m of String(xml ?? '').matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const titel = reinerText(feld(m[1], 'title')), text = reinerText(feld(m[1], 'description'))
    const d = new Date(reinerText(feld(m[1], 'pubDate')))
    if (!Number.isNaN(d.getTime()) && (!stand || d > stand)) stand = d
    if (titel) meldungen.push({ titel, text })
    if (meldungen.length >= 20) break
  }
  return { meldungen, stand }
}

/** holen(): { meldungen, stand (ISO) } oder { fehler } – 10 s Zeitgrenze, 5 Minuten im Arbeitsspeicher */
function erstelleDlfNachrichten({ abruf = fetch, protokoll = () => {}, jetzt = () => Date.now() } = {}) {
  let zuletzt = null
  async function holen() {
    if (zuletzt && jetzt() - zuletzt.zeit < 5 * 60_000) return zuletzt.daten
    try {
      const r = await abruf(ADRESSE, { headers: { 'user-agent': 'LOKI-Sprachassistent' }, signal: AbortSignal.timeout(10_000) })
      if (!r.ok) throw new Error(`Antwort ${r.status}`)
      const { meldungen, stand } = lesen(await r.text())
      if (!meldungen.length) throw new Error('keine Meldungen im Feed')
      const daten = { meldungen, stand: stand ? stand.toISOString() : null }
      zuletzt = { zeit: jetzt(), daten }
      return daten
    } catch (f) {
      protokoll('Deutschlandfunk-Nachrichten:', f?.message ?? f)
      return { fehler: String(f?.message ?? f) }
    }
  }
  return { holen }
}

module.exports = { erstelleDlfNachrichten, lesen, ADRESSE }
