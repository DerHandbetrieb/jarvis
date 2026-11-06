// WhatsApp-Hinweis im Dauer-HUD (06.11.2026, Wunsch Auftraggeber): zeigt, wie viele Nachrichten ungelesen sind.
// Quelle ist die Zahl, die die WhatsApp-App selbst bei Windows hinterlegt (Badge am Taskleisten-Symbol, Mitteilungsspeicher
// wpndatabase.db). Geprüft mit einer echten Nachricht: ungelesen stand dort <badge value="1"/>, nach dem Lesen am Handy war der
// Eintrag weg. Die frühere Quelle (Mitteilungszentrale) kannte das Lesen nicht zuverlässig, Windows behielt alte Mitteilungen.
// Gelesen wird nur lesend und nur diese eine Zahl: Die Abfrage nimmt ausschließlich Einträge vom Typ „badge“, Mitteilungstexte
// und Absender werden nie angefasst, nichts verlässt den PC, WhatsApp selbst wird nicht berührt.
// Grenze: Die Zahl stimmt nur, solange die App am PC läuft und mit dem Handy abgeglichen ist. Der Datenbank-Aufbau ist nicht
// offiziell dokumentiert und kann sich mit Windows-Updates ändern; dann zeigt das HUD „–“.
const path = require('node:path')

const TAKT_MS = 9000, FEHLER_BIS_LEER = 3
const ABFRAGE = `select cast(n.Payload as text) as inhalt from Notification n join NotificationHandler h on h.RecordId = n.HandlerId where n.Type = 'badge' and h.PrimaryId like '5319275A.WhatsAppDesktop%'`

/** Inhalt eines Badge-Eintrags → Anzahl (getestet). Ein Bild-Badge ohne Zahl zählt als 1, „none“ als 0, Unbekanntes als null */
function badgeAuswerten(inhalt) {
  const wert = /<badge\b[^>]*\bvalue="([^"]*)"/i.exec(String(inhalt))?.[1]
  if (wert === undefined) return null
  if (wert === 'none') return 0
  return /^\d+$/.test(wert) ? Number(wert) : 1
}

/** Zeilen der Abfrage → größte Anzahl; keine Zeile = nichts ungelesen */
function zeilenAuswerten(zeilen) {
  const werte = zeilen.map((z) => badgeAuswerten(z.inhalt)).filter((n) => n !== null)
  return werte.length ? Math.max(...werte) : zeilen.length ? null : 0
}

function datenbank() {
  return path.join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'Windows', 'Notifications', 'wpndatabase.db')
}

/** liest die Zahl einmal; öffnet die Datenbank nur lesend und schließt sie gleich wieder */
function lesen(oeffnen = (d) => new (require('node:sqlite').DatabaseSync)(d, { readOnly: true })) {
  const db = oeffnen(datenbank())
  try { return zeilenAuswerten(db.prepare(ABFRAGE).all()) } finally { db.close() }
}

/** startet die Abfrage; beiAnzahl(n) bei jeder Änderung (null = nicht lesbar). → stoppen() */
function ueberwachen(beiAnzahl, { protokoll = console.error, lies = lesen } = {}) {
  let zuletzt, fehler = 0
  const melden = (n) => { if (n !== zuletzt) { zuletzt = n; beiAnzahl(n) } }
  const takt = () => {
    try { melden(lies()); fehler = 0 }
    catch (f) { // kurz gesperrte Datenbank ist normal: erst nach mehreren Fehlschlägen „nicht lesbar“
      if (++fehler === FEHLER_BIS_LEER) { protokoll('WhatsApp-Hinweis:', f?.message ?? f); melden(null) }
    }
  }
  takt()
  const uhr = setInterval(takt, TAKT_MS)
  return () => clearInterval(uhr)
}

module.exports = { ueberwachen, badgeAuswerten, zeilenAuswerten, ABFRAGE }
