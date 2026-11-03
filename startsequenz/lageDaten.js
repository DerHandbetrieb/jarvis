// Echte Werte für die Start-Sequenz (Etappe L3, 03.11.2026, Wunsch Auftraggeber „Ja, echte Zahlen“): rechnet die Lage
// aus der Serverfunktion jarvis-lage (Werkstatt) in die Anzeigen der Szene um. Ohne Verbindung oder mit Daten älter als
// eine Stunde: null → die Szene zeigt die Beispieldaten, deutlich als „Beispiel“ gekennzeichnet (nichts erfinden).
// Datum und Wetter sind immer echt (Wetter nur, wenn Open-Meteo rechtzeitig antwortet). Getestet in lageDaten.test.js.

const TAGE = ['SONNTAG', 'MONTAG', 'DIENSTAG', 'MITTWOCH', 'DONNERSTAG', 'FREITAG', 'SAMSTAG']
const zwei = (n) => String(n).padStart(2, '0')
/** „DIENSTAG · 03.11.“ in deutscher Zeit */
export function datumText(jetzt) {
  const d = new Date(jetzt.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))
  return `${TAGE[d.getDay()]} · ${zwei(d.getDate())}.${zwei(d.getMonth() + 1)}.`
}
const WETTER = { klar: 'KLAR', wolkig: 'BEWÖLKT', regen: 'REGEN', gewitter: 'GEWITTER' }
/** „ÖHRINGEN · 9 °C · BEWÖLKT“ oder nur der Ort, wenn kein Wetter da ist */
export function wetterText(ort, grad, art) {
  const teile = [String(ort ?? 'Öhringen').toUpperCase()]
  if (Number.isFinite(grad)) teile.push(`${Math.round(grad)} °C`)
  if (art && WETTER[art]) teile.push(WETTER[art])
  return teile.join(' · ')
}

/** Kanalname kurz und groß („Eigener Shop“ → „SHOP“) */
const kurz = (name) => { const n = String(name).toUpperCase(); return n.includes('EIGEN') || n.includes('PRESTA') ? 'SHOP' : n.split(/\s+/)[0].slice(0, 10) }
/** Fälligkeit wie auf der Karte: „FÄLLIG HEUTE“, „ÜBERFÄLLIG“, „FÄLLIG 05.11.“ oder leer */
export function faelligText(faellig, heute) {
  if (!faellig) return ''
  faellig = String(faellig).slice(0, 10) // auch Zeitstempel („…T…“) als Tag lesen
  if (faellig < heute) return 'ÜBERFÄLLIG'
  if (faellig === heute) return 'FÄLLIG HEUTE'
  return `FÄLLIG ${faellig.slice(8, 10)}.${faellig.slice(5, 7)}.`
}

export function sequenzDaten(lage, jetzt) {
  if (!lage || !(jetzt.getTime() - Number(lage.geholt) < 60 * 60_000) || !lage.aufgaben || !lage.verkauf?.gestern) return null
  const heute = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(jetzt)
  const g = lage.verkauf.gestern, tage = lage.verkauf.tage ?? []
  const zahl = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0) // fehlende Werte nie als NaN durchreichen
  const umsatz14 = tage.map((t) => Math.round(zahl(t.umsatzCent)) / 100)
  const umsatzSumme14 = (lage.verkauf.kanaele14 ?? []).reduce((s, k) => s + k.umsatzCent, 0)
  const geholt = new Date(lage.geholt)
  const rot = lage.selbsttest && jetzt.getTime() - new Date(lage.selbsttest.am).getTime() < 24 * 3_600_000 ? Number(lage.selbsttest.rot) : null
  return {
    stand: geholt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }),
    offen: lage.aufgaben.offen,
    neu: lage.aufgaben.neu,
    freigaben: lage.freigaben,
    amazonProbleme: lage.aufgaben.amazonProbleme?.length ?? 0,
    selbsttest: rot === null ? '–' : rot === 0 ? 'OK' : String(rot),
    selbsttestRot: !!rot,
    gestern: { bestellungen: g.bestellungen, stueck: g.stueck, umsatz: Math.round(g.umsatzCent) / 100 },
    // die drei umsatzstärksten Kanäle der letzten 14 Tage: Zahl = Bestellungen, Ring = Anteil am Umsatz
    kanaele: (lage.verkauf.kanaele14 ?? []).slice(0, 3).map((k) => ({ name: kurz(k.kanal), bestellungen: k.bestellungen, anteil: umsatzSumme14 > 0 ? k.umsatzCent / umsatzSumme14 : 0 })),
    umsatz14,
    // Bestellungen je Tag der letzten 9 Tage für die Kästchen am rechten Rand (Kopf „TT.MM“)
    tage9: tage.slice(-9).map((t) => ({ tag: /^\d{4}-\d{2}-\d{2}/.test(String(t.tag)) ? `${t.tag.slice(8, 10)}.${t.tag.slice(5, 7)}` : '', bestellungen: zahl(t.bestellungen) })),
    umsatzMax: Math.max(10, Math.ceil(Math.max(0, ...umsatz14) / 50) * 50),
    // To-do-Karten: [Titel, Zusatzzeile, Fortschritt (null = keiner), Fälligkeit]
    karten: (lage.aufgaben.wichtigste ?? []).slice(0, 5).map((w) => [w.titel, faelligText(w.faellig, heute) || 'WERKSTATT', null, faelligText(w.faellig, heute)]),
    lager: (lage.lagerKnapp ?? []).slice(0, 4).map((k) => [k.variante ? `${k.name} ${k.variante}` : k.name, zahl(k.bestand), zahl(k.meldebestand)]),
  }
}
