// Vollbild-Spiel erkennen (04.11.2026, Wunsch Auftraggeber: bei Spielen Grafikspeicher freigeben). Offizielle
// Windows-Funktion SHQueryUserNotificationState (learn.microsoft.com, Enumeration QUERY_USER_NOTIFICATION_STATE):
// 3 = QUNS_RUNNING_D3D_FULL_SCREEN (exklusives Vollbild-Spiel), 2 = QUNS_BUSY (Vollbild-Anwendung – so melden sich auch
// randlose Vollbild-Spiele). Ein einziges kleines PowerShell-Programm fragt alle 10 s nach (kein Fenster, kein Netz).
// Erst nach 60 s Vollbild am Stück gilt es als Spiel (kurze Vollbild-Videos lösen nichts aus); zurück sofort.
// Seit 04.11.2026 meldet dasselbe Programm auch, wie lange Maus und Tastatur unbenutzt sind (GetLastInputInfo,
// learn.microsoft.com) – für „Loki meldet Neuigkeiten nur, wenn der Auftraggeber am PC ist“.
const { spawn } = require('node:child_process')

const SKRIPT = `
Add-Type -Namespace Loki -Name Shell -MemberDefinition '[DllImport("shell32.dll")] public static extern int SHQueryUserNotificationState(out int s); [StructLayout(LayoutKind.Sequential)] public struct LII { public uint cbSize; public uint dwTime; } [DllImport("user32.dll")] public static extern bool GetLastInputInfo(ref LII p); [DllImport("kernel32.dll")] public static extern uint GetTickCount();'
while ($true) { $s = 0; [void][Loki.Shell]::SHQueryUserNotificationState([ref]$s); $l = New-Object Loki.Shell+LII; $l.cbSize = 8; [void][Loki.Shell]::GetLastInputInfo([ref]$l); $ruhe = [math]::Floor((([long][Loki.Shell]::GetTickCount() - [long]$l.dwTime + 4294967296) % 4294967296) / 1000); try { [Console]::Out.WriteLine("$s $ruhe"); [Console]::Out.Flush() } catch { exit }; Start-Sleep -Seconds 10 }
`

/** Reine Entscheidung (getestet): Zustände der Reihe nach → true/false, sobald sich „Spiel läuft“ ändert */
function erstelleEntscheider({ jetzt = () => Date.now(), wartezeit = 60_000 } = {}) {
  let seit = null, spiel = false
  return (zustand) => {
    const vollbild = zustand === 2 || zustand === 3
    if (!vollbild) { seit = null; if (spiel) { spiel = false; return false } return null }
    if (seit === null) seit = jetzt()
    if (!spiel && jetzt() - seit >= wartezeit) { spiel = true; return true }
    return null
  }
}

/** startet die Überwachung; beiWechsel(true) = Spiel läuft, beiWechsel(false) = vorbei; beiRuhe(sekunden) = so lange
 *  sind Maus und Tastatur unbenutzt (alle 10 s). → stoppen() */
function ueberwachen(beiWechsel, { protokoll = console.error, beiRuhe = () => {} } = {}) {
  const entscheide = erstelleEntscheider()
  let p = null, aus = false
  const start = () => {
    if (aus) return
    p = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', SKRIPT], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] })
    let rest = ''
    p.stdout.on('data', (d) => {
      rest += d.toString()
      const zeilen = rest.split(/\r?\n/); rest = zeilen.pop() ?? ''
      for (const z of zeilen) {
        const [zustand, ruhe] = z.trim().split(/\s+/).map(Number)
        const w = entscheide(zustand); if (w !== null) beiWechsel(w)
        if (Number.isFinite(ruhe) && ruhe >= 0) beiRuhe(ruhe)
      }
    })
    // stirbt das Programm, nach einer Minute neu starten
    p.on('exit', () => { p = null; if (!aus) setTimeout(start, 60_000) })
    p.on('error', (f) => protokoll('Vollbild-Erkennung:', f.message))
  }
  start()
  return () => { aus = true; try { p?.kill() } catch { /* schon beendet */ } }
}

module.exports = { ueberwachen, erstelleEntscheider }
