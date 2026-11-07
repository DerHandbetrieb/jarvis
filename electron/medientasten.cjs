// Medientasten (07.11.2026, Wunsch Auftraggeber: Pause/Weiter, vor, zurück aus dem Audiofeld des Dauer-HUD). Die
// Medien-Schnittstelle von Wallpaper Engine kann nur lesen – darum drückt L.O.K.I. die Windows-Medientasten wie eine
// Multimedia-Tastatur (Virtual-Key-Codes laut Microsoft: VK_MEDIA_PLAY_PAUSE 0xB3, VK_MEDIA_NEXT_TRACK 0xB0,
// VK_MEDIA_PREV_TRACK 0xB1; learn.microsoft.com/windows/win32/inputdev/virtual-key-codes). Windows gibt sie an die
// laufende Wiedergabe weiter (Spotify, YouTube im Browser …). Ein PowerShell-Programm bleibt offen und liest je Zeile
// einen Code – so kostet ein Klick keine Startzeit. Nur diese drei Tasten, nichts anderes.
const { spawn } = require('node:child_process')

const TASTEN = { pause: 0xb3, vor: 0xb0, zurueck: 0xb1 }
const SKRIPT = `Add-Type -Namespace Loki -Name Taste -MemberDefinition '[DllImport("user32.dll")] public static extern void keybd_event(byte k, byte s, uint f, System.UIntPtr e);'
while ($true) { $z = [Console]::In.ReadLine(); if ($z -eq $null) { exit }; $k = 0; if ([int]::TryParse($z, [ref]$k) -and ($k -eq 176 -or $k -eq 177 -or $k -eq 179)) { [Loki.Taste]::keybd_event([byte]$k, 0, 1, [System.UIntPtr]::Zero); [Loki.Taste]::keybd_event([byte]$k, 0, 3, [System.UIntPtr]::Zero) } }`

/** @param {{ starte?: typeof spawn, protokoll?: (...a: any[]) => void }} o */
function erstelleMedientasten({ starte = spawn, protokoll = () => {} } = {}) {
  let p = null
  function prozess() {
    if (p && !p.killed && p.exitCode == null) return p
    const q = starte('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', SKRIPT], { windowsHide: true, stdio: ['pipe', 'ignore', 'pipe'] })
    p = q
    // nur den eigenen Prozess vergessen – ein spätes Ende des alten darf den neuen nicht verwaisen lassen (Prüf-Agent)
    q.on('error', (f) => { protokoll('Medientasten: Start fehlgeschlagen', f?.message ?? f); if (p === q) p = null })
    q.on('exit', () => { if (p === q) p = null })
    q.stderr?.on('data', (d) => protokoll('Medientasten:', String(d).slice(0, 200)))
    return q
  }
  /** aktion: 'pause' | 'vor' | 'zurueck' → true, wenn gesendet */
  function druecken(aktion) {
    const k = TASTEN[aktion]
    if (!k) return false
    try { const q = prozess(); if (!q?.stdin?.writable) return false; q.stdin.write(`${k}\n`); return true } catch (f) { protokoll('Medientasten:', f?.message ?? f); return false }
  }
  function beenden() { try { p?.stdin?.end(); p?.kill() } catch { /* schon weg */ } p = null }
  /** schon vorher starten, damit der erste Klick nicht auf PowerShell wartet */
  function vorwaermen() { try { prozess() } catch (f) { protokoll('Medientasten:', f?.message ?? f) } }
  return { druecken, beenden, vorwaermen }
}

module.exports = { erstelleMedientasten, TASTEN }
