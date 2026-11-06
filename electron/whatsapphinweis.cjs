// WhatsApp-Hinweis im Dauer-HUD (06.11.2026, Wunsch Auftraggeber): zeigt, ob WhatsApp neue Nachrichten gemeldet hat.
// Quelle ist die Windows-Mitteilungszentrale (UserNotificationListener, learn.microsoft.com, „Notification listener“).
// Es wird NUR gezählt, wie viele Mitteilungen von der WhatsApp-App dort liegen. Absender und Text werden nie gelesen,
// nichts verlässt den PC, WhatsApp selbst wird nicht berührt. Ein kleines PowerShell-Programm fragt alle 10 s nach.
const { spawn } = require('node:child_process')

const SKRIPT = `
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.UI.Notifications.Management.UserNotificationListener, Windows.UI.Notifications, ContentType=WindowsRuntime]
$null = [Windows.UI.Notifications.NotificationKinds, Windows.UI.Notifications, ContentType=WindowsRuntime]
$warte = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -like 'IAsyncOperation*' } | Select-Object -First 1
$warte = $warte.MakeGenericMethod([System.Collections.Generic.IReadOnlyList[Windows.UI.Notifications.UserNotification]])
$l = [Windows.UI.Notifications.Management.UserNotificationListener]::Current
while ($true) {
  $n = -1
  try {
    if ($l.GetAccessStatus() -eq 'Allowed') {
      $t = $warte.Invoke($null, @($l.GetNotificationsAsync([Windows.UI.Notifications.NotificationKinds]::Toast)))
      if ($t.Wait(8000)) { $n = 0; foreach ($x in $t.Result) { try { if ($x.AppInfo.AppUserModelId -like '5319275A.WhatsAppDesktop*') { $n++ } } catch {} } }
    }
  } catch { $n = -1 }
  try { [Console]::Out.WriteLine("$n"); [Console]::Out.Flush() } catch { exit }
  Start-Sleep -Seconds 10
}
`

/** Reine Auswertung (getestet): Ausgabezeile → Anzahl, null = nicht lesbar */
function zeileAuswerten(zeile) {
  const t = String(zeile).trim()
  if (!/^\d+$/.test(t)) return null
  return Number(t)
}

/** startet die Abfrage; beiAnzahl(n) bei jeder Änderung (null = nicht lesbar). → stoppen() */
function ueberwachen(beiAnzahl, { protokoll = console.error } = {}) {
  let p = null, aus = false, zuletzt
  const start = () => {
    if (aus) return
    p = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', SKRIPT], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] })
    let rest = ''
    p.stdout.on('data', (d) => {
      rest += d.toString()
      const zeilen = rest.split(/\r?\n/); rest = zeilen.pop() ?? ''
      for (const z of zeilen) {
        const n = zeileAuswerten(z)
        if (n !== zuletzt) { zuletzt = n; beiAnzahl(n) }
      }
    })
    // stirbt das Programm, nach einer Minute neu starten
    p.on('exit', () => { p = null; if (!aus) setTimeout(start, 60_000) })
    p.on('error', (f) => protokoll('WhatsApp-Hinweis:', f.message))
  }
  start()
  return () => { aus = true; try { p?.kill() } catch { /* schon beendet */ } }
}

module.exports = { ueberwachen, zeileAuswerten, SKRIPT }
