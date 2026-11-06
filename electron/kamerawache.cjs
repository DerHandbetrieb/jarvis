// Kamera-Wache (04.11.2026, Wunsch Auftraggeber: „Hinweis, wenn auf der Kamera etwas passiert“; Interview: nur das linke
// Objektiv, nur Personen, nur ansagen wenn er am PC ist, Verpasstes gesammelt, im Dauer-HUD hervorheben).
// Fragt alle 2 s die eigene Personen-Erkennung der Kamera ab (kamera.personErkannt) und meldet ein Ereignis beim Wechsel
// „keine Person“ → „Person“ – aber erst wieder, wenn 2 Minuten lang niemand erkannt wurde (wer im Bild stehen bleibt,
// wird nicht dauernd gemeldet). Fehler: Pause 10 s, jedes Mal doppelt so lang bis 5 Minuten (Forenberichte: zu häufiges
// Abfragen kann Reolink-Kameras überlasten) – alles ins Kamera-Protokoll. Ohne Electron-Abhängigkeit (kamerawache.test.js).
// Seit 06.11.2026 (Wunsch Auftraggeber) genauso für Autos: abfragen liefert { person, auto }, jede Art hat ihre eigene Ruhezeit.

const TAKT_MS = 2000, RUHE_MS = 120_000, PAUSE_MS = 10_000, PAUSE_MAX_MS = 5 * 60_000

/**
 * @param {{ abfragen: () => Promise<boolean | { person: boolean, auto: boolean }>, beimEreignis: (e: { art: 'person' | 'auto', zeit: number }) => void,
 *   protokoll?: (...a: any[]) => void, jetzt?: () => number, warte?: (ms: number) => Promise<void> }} o
 */
function erstelleKamerawache({ abfragen, beimEreignis, protokoll = () => {}, jetzt = () => Date.now(), warte = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  let an = false, lauf = 0
  const ARTEN = ['person', 'auto']
  const zuletztGesehen = { person: -Infinity, auto: -Infinity } // letzter Zeitpunkt der Erkennung (anfangs: nie)
  const vorher = { person: false, auto: false }
  let fehler = 0
  const stand = { abfragen: 0, fehler: 0, ereignisse: 0, letzteDauerMs: 0 }

  /** ein Schritt (getestet): Ergebnis der Abfrage verarbeiten */
  function schritt(wert) {
    const t = jetzt(), w = typeof wert === 'object' && wert ? wert : { person: !!wert, auto: false }
    for (const art of ARTEN) {
      const da = !!w[art]
      if (da && !vorher[art] && t - zuletztGesehen[art] >= RUHE_MS) { stand.ereignisse++; beimEreignis({ art, zeit: t }) }
      if (da) zuletztGesehen[art] = t
      vorher[art] = da
    }
  }

  async function schleife(meiner) {
    while (an && meiner === lauf) {
      const start = jetzt()
      try {
        const wert = await abfragen()
        if (meiner !== lauf) return // inzwischen gestoppt/neu gestartet – nichts mehr ändern (Prüf-Agent)
        stand.abfragen++; stand.letzteDauerMs = jetzt() - start
        if (fehler) protokoll(`Kamera-Wache: wieder erreichbar nach ${fehler} Fehlversuch(en)`)
        fehler = 0
        schritt(wert)
        await warte(TAKT_MS)
      } catch (f) {
        if (meiner !== lauf) return
        stand.fehler++
        const pause = Math.min(PAUSE_MAX_MS, PAUSE_MS * 2 ** fehler++)
        protokoll(`Kamera-Wache: Abfrage fehlgeschlagen (${f?.message ?? f}) – Pause ${Math.round(pause / 1000)} s`)
        // „vorher“ bleibt: stand die Person schon vor der Störung im Bild, wird sie danach nicht erneut gemeldet (Prüf-Agent)
        for (const art of ARTEN) if (vorher[art]) zuletztGesehen[art] = jetzt()
        await warte(pause)
      }
    }
  }

  return {
    starten() { if (an) return; an = true; fehler = 0; vorher.person = vorher.auto = false; protokoll('Kamera-Wache: an (linkes Objektiv, Personen und Autos)'); void schleife(++lauf) },
    stoppen() { if (!an) return; an = false; lauf++; protokoll('Kamera-Wache: aus') },
    laeuft: () => an,
    stand: () => ({ ...stand }),
    _schritt: schritt,
  }
}

module.exports = { erstelleKamerawache, TAKT_MS, RUHE_MS }
