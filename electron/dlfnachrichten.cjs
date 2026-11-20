// Deutschlandfunk-Nachrichten zum Vorlesen (10.11.2026, Wunsch Auftraggeber: nach der Morgen-Lage und auf Zuruf alle aktuellen
// Meldungen hören). Quelle: der Feed „Fortlaufende Nachrichten“ https://www.deutschlandfunk.de/nachrichten-100.rss (20 Meldungen,
// je Überschrift + ein Satz). Eine offizielle Feed-Übersicht gibt es nicht, die Adresse kann sich ändern → dann ehrlich melden.
// Nutzungsbedingungen (deutschlandfunk.de/nutzungsbedingungen-102.html): nur privat und nicht kommerziell; Vervielfältigung,
// Änderung, Neuzusammenstellung und Speicherung brauchen eine Zustimmung. Darum: nur für den Auftraggeber vorlesen, Text
// wortgetreu (nur HTML und Zeichen-Codes entfernt), nichts auf die Festplatte, nur kurz im Arbeitsspeicher.
const ADRESSE = 'https://www.deutschlandfunk.de/nachrichten-100.rss'
// Gesprochene Sendung (20.11.2026, Wunsch Auftraggeber: „die Original-Audiospur abspielen, nicht mehr vorlesen lassen“):
// Podcast-Feed der Nachrichten-Sendung; L.O.K.I. spielt die neueste Folge direkt aus dem Netz ab (Anhören, nichts gespeichert –
// so bleibt es bei der privaten Nutzung ohne Änderung). Klappt das nicht, liest Loki wie bisher die Meldungen vor.
const PODCAST = 'https://www.deutschlandfunk.de/nachrichten-108.xml'
/** nur Tonspuren vom Deutschlandfunk/Deutschlandradio über https */
function erlaubteTonAdresse(u) {
  try { const a = new URL(u); return a.protocol === 'https:' && /(^|\.)(deutschlandfunk\.de|deutschlandradio\.de|dradio\.de)$/i.test(a.hostname) } catch { return false }
}
/** Podcast-Feed → neueste Folge { url, titel, stand } oder null */
function sendungLesen(xml) {
  let beste = null
  for (const m of String(xml ?? '').matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const e = m[1].match(/<enclosure\b[^>]*>/i)?.[0] ?? ''
    const url = entschluesseln(e.match(/\burl="([^"]+)"/i)?.[1] ?? ''), typ = e.match(/\btype="([^"]+)"/i)?.[1] ?? ''
    if (!url || (typ && !/^audio\//i.test(typ)) || !erlaubteTonAdresse(url)) continue
    const d = new Date(reinerText(feld(m[1], 'pubDate')))
    const folge = { url, titel: reinerText(feld(m[1], 'title')), stand: Number.isNaN(d.getTime()) ? null : d }
    if (!beste || (folge.stand && (!beste.stand || folge.stand > beste.stand))) beste = folge
  }
  return beste ? { ...beste, stand: beste.stand ? beste.stand.toISOString() : null } : null
}

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
  let zuletztSendung = null
  /** sendung(): { url, titel, stand } oder { fehler } – 10 s Zeitgrenze, 5 Minuten im Arbeitsspeicher */
  async function sendung() {
    if (zuletztSendung && jetzt() - zuletztSendung.zeit < 5 * 60_000) return zuletztSendung.daten
    try {
      const r = await abruf(PODCAST, { headers: { 'user-agent': 'LOKI-Sprachassistent' }, signal: AbortSignal.timeout(10_000) })
      if (!r.ok) throw new Error(`Antwort ${r.status}`)
      const daten = sendungLesen(await r.text())
      if (!daten) throw new Error('keine abspielbare Folge im Podcast-Feed')
      zuletztSendung = { zeit: jetzt(), daten }
      return daten
    } catch (f) {
      protokoll('Deutschlandfunk-Sendung:', f?.message ?? f)
      return { fehler: String(f?.message ?? f) }
    }
  }
  return { holen, sendung }
}

module.exports = { erstelleDlfNachrichten, lesen, sendungLesen, erlaubteTonAdresse, ADRESSE, PODCAST }
