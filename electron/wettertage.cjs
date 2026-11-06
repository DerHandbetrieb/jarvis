// Tagebuch der Wetterstation (06.11.2026, Vorschlag Auftraggeber): L.O.K.I. schreibt je Tag Höchst- und Tiefstwert der eigenen
// Station auf und weiß damit selbst, ob es mehrere Tage durchgefroren hat (See-Eis, seeeis.cjs). Datei liegt nur lokal in
// %APPDATA%\Jarvis, die letzten 21 Einträge reichen. Läuft der PC nicht, fehlt die Messung: Als Frosttag gilt nur ein Tag, an dem auch
// am Nachmittag gemessen wurde, sonst wäre ein mildes Mittagsfenster unbemerkt geblieben. Ein einzelner fehlender Tag unterbricht
// die Serie nicht, eine Lücke von mehr als 4 Tagen schon: dann ist über das Eis nichts mehr bekannt.
const { eisStufe } = require('./seeeis.cjs')
const TAGE_MERKEN = 21, LUECKE_TAGE = 4, NACHMITTAG_VON = 12, NACHMITTAG_BIS = 17

/** Datum in deutscher Zeit als JJJJ-MM-TT */
const tagVon = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ms)
const stundeVon = (ms) => Number(new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', hour: 'numeric', hourCycle: 'h23' }).formatToParts(ms).find((p) => p.type === 'hour')?.value)
const tageZwischen = (a, b) => (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000

/** Messwert eintragen → true, wenn sich etwas geändert hat. nachmittag: gemessen zwischen 12 und 17 Uhr */
function eintragen(tage, tag, grad, nachmittag = false) {
  const t = tage[tag]
  if (!t) { tage[tag] = { hoechst: grad, tiefst: grad, nachmittag }; return true }
  if (grad <= t.hoechst && grad >= t.tiefst && (t.nachmittag || !nachmittag)) return false
  t.hoechst = Math.max(t.hoechst, grad); t.tiefst = Math.min(t.tiefst, grad); t.nachmittag = t.nachmittag || nachmittag
  return true
}

/** Eis nach dem Tagebuch. Der laufende Tag zählt erst als Frosttag, wenn er vorbei ist: um 8 Uhr früh ist sein Höchstwert noch
 *  nicht gefallen. Wird es heute schon wärmer als 0 °C, zählt er dagegen sofort, damit das Eis nicht einen Tag zu lang bleibt. */
function eisAusTagen(tage, heute) {
  let liste = Object.keys(tage).filter((t) => t < heute).sort()
  const reihe = [...liste, heute]
  for (let i = reihe.length - 2; i >= 0; i--) if (tageZwischen(reihe[i], reihe[i + 1]) > LUECKE_TAGE) { liste = liste.slice(i + 1); break }
  const fertig = liste.filter((t) => tage[t].nachmittag || tage[t].hoechst >= 0).map((t) => tage[t].hoechst)
  const h = tage[heute]?.hoechst
  return eisStufe(typeof h === 'number' && h >= 0 ? [...fertig, h] : fertig)
}

/** datei: Pfad, fs: node:fs */
function erstelleWettertage({ datei, fs, jetzt = () => Date.now(), protokoll = console.error }) {
  let tage = {}
  try {
    const j = JSON.parse(fs.readFileSync(datei, 'utf8'))
    for (const [t, w] of Object.entries(j ?? {})) if (/^\d{4}-\d{2}-\d{2}$/.test(t) && Number.isFinite(w?.hoechst) && Number.isFinite(w?.tiefst)) tage[t] = { hoechst: w.hoechst, tiefst: w.tiefst, nachmittag: !!w.nachmittag }
  } catch { /* erster Start oder Datei beschädigt: beginnt neu */ }
  function speichern() {
    try { const zw = `${datei}.neu`; fs.writeFileSync(zw, JSON.stringify(tage)); fs.renameSync(zw, datei) } catch (f) { protokoll('Wetter-Tagebuch:', f?.message ?? f) }
  }
  return {
    erfassen(grad) {
      if (!Number.isFinite(grad)) return
      const t = jetzt(), heute = tagVon(t), std = stundeVon(t)
      if (!eintragen(tage, heute, grad, std >= NACHMITTAG_VON && std < NACHMITTAG_BIS)) return
      const alt = Object.keys(tage).sort().slice(0, -TAGE_MERKEN)
      for (const t of alt) delete tage[t]
      speichern()
    },
    eis: () => eisAusTagen(tage, tagVon(jetzt())),
  }
}

module.exports = { erstelleWettertage, eintragen, eisAusTagen, tagVon }
