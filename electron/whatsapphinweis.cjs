// WhatsApp-Hinweis im Dauer-HUD (06.11.2026, Wunsch Auftraggeber): zeigt, ob WhatsApp neue Nachrichten gemeldet hat.
// Quelle ist die Windows-Mitteilungszentrale (UserNotificationListener, learn.microsoft.com, „Notification listener“).
// Es wird NUR gezählt, wie viele Mitteilungen von der WhatsApp-App dort liegen. Absender und Text werden nie gelesen,
// nichts verlässt den PC, WhatsApp selbst wird nicht berührt. Ein kleines PowerShell-Programm fragt alle 9 s nach.
// Windows behält eine Mitteilung auch dann, wenn die Nachricht längst gelesen ist (Rückmeldung Auftraggeber 06.11.2026: „1 NEU“
// trotz nichts Ungelesenem). Darum zählt sie nur, wenn sie jünger ist als der letzte Blick auf WhatsApp (Fenster im Vordergrund,
// geprüft alle 3 s) und jünger als 2 Stunden. Auf dem Handy Gelesenes sieht der PC nicht; das verschwindet nach den 2 Stunden.
const { spawn } = require('node:child_process')

const SKRIPT = `
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.UI.Notifications.Management.UserNotificationListener, Windows.UI.Notifications, ContentType=WindowsRuntime]
$null = [Windows.UI.Notifications.NotificationKinds, Windows.UI.Notifications, ContentType=WindowsRuntime]
$warte = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -like 'IAsyncOperation*' } | Select-Object -First 1
$warte = $warte.MakeGenericMethod([System.Collections.Generic.IReadOnlyList[Windows.UI.Notifications.UserNotification]])
$l = [Windows.UI.Notifications.Management.UserNotificationListener]::Current
Add-Type -Namespace Loki -Name Fenster -MemberDefinition '[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow(); [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);'
$gesehen = [DateTime]::MinValue
function Blick { try { [uint32]$p = 0; [void][Loki.Fenster]::GetWindowThreadProcessId([Loki.Fenster]::GetForegroundWindow(), [ref]$p); if ((Get-Process -Id $p -ErrorAction Stop).ProcessName -like 'WhatsApp*') { $script:gesehen = [DateTime]::UtcNow } } catch {} }
while ($true) {
  Blick
  $n = -1
  try {
    if ($l.GetAccessStatus() -eq 'Allowed') {
      $t = $warte.Invoke($null, @($l.GetNotificationsAsync([Windows.UI.Notifications.NotificationKinds]::Toast)))
      if ($t.Wait(8000)) { $n = 0; $grenze = [DateTime]::UtcNow.AddHours(-2); if ($gesehen -gt $grenze) { $grenze = $gesehen }; foreach ($x in $t.Result) { try { if ($x.AppInfo.AppUserModelId -like '5319275A.WhatsAppDesktop*' -and $x.CreationTime.UtcDateTime -gt $grenze) { $n++ } } catch {} } }
    }
  } catch { $n = -1 }
  try { [Console]::Out.WriteLine("$n"); [Console]::Out.Flush() } catch { exit }
  1..3 | ForEach-Object { Start-Sleep -Seconds 3; Blick }
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
