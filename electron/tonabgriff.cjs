// PC-Ton fürs Dauer-HUD (05.11.2026, Entscheidung Auftraggeber „L.O.K.I. nimmt den Ton“): Wallpaper Engine nahm das
// Ton-Angebot an, lieferte aber keine Daten. Darum hört ein unsichtbares L.O.K.I.-Fenster den PC-Ausgang selbst ab
// (Electron: getDisplayMedia mit Windows-Loopback) und liefert nur 64 Lautstärke-Werte; das Wallpaper holt sie über die
// Gegenstelle (GET /ton). Nur im Arbeitsspeicher. Läuft nur, solange jemand fragt: 15 s ohne Nachfrage → Fenster zu.
const RUHE_MS = 15_000, FRISCH_MS = 500

/** erstelleFenster() → BrowserWindow-ähnlich ({ webContents, close(), isDestroyed(), on }) – für Tests ersetzbar */
function erstelleTonAbgriff({ erstelleFenster, jetzt = () => Date.now(), protokoll = console.error }) {
  let fenster = null, zuletztGefragt = 0, uhr = null, letzte = null // { werte: number[128], zeit }
  function stoppen() {
    clearInterval(uhr); uhr = null
    const f = fenster; fenster = null; letzte = null
    try { if (f && !f.isDestroyed()) f.close() } catch { /* schon zu */ }
  }
  function starten() {
    if (fenster) return
    fenster = erstelleFenster()
    const f = fenster
    f.on('closed', () => { if (fenster === f) { fenster = null; clearInterval(uhr); uhr = null; letzte = null } })
    uhr = setInterval(() => { if (jetzt() - zuletztGefragt > RUHE_MS) stoppen() }, 3000)
  }
  return {
    /** 128 Werte 0..1 (links 0–63, rechts 64–127 – wie Wallpaper Engine) oder null; startet das Fenster bei Bedarf */
    werte() {
      zuletztGefragt = jetzt()
      starten()
      return letzte && jetzt() - letzte.zeit < FRISCH_MS ? letzte.werte : null
    },
    /** Werte vom Fenster (nur vom eigenen, geprüft über den Absender) */
    empfangen(sender, d) {
      if (!fenster || sender !== fenster.webContents || !d || d.length !== 64) return
      const w = Array.from(d, (v) => Math.round((Math.min(255, Math.max(0, Number(v) || 0)) / 255) * 1000) / 1000)
      letzte = { werte: [...w, ...w], zeit: jetzt() } // Abgriff ist Mono: links = rechts
    },
    meldung(sender, grund) {
      if (!fenster || sender !== fenster.webContents) return
      protokoll(`PC-Ton: ${grund === 'kein-ton' ? 'kein Tonkanal bekommen' : 'Abgriff fehlgeschlagen'}`)
    },
    stoppen,
    _laeuft: () => !!fenster,
  }
}

module.exports = { erstelleTonAbgriff, RUHE_MS }
