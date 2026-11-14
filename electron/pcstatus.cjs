// PC-Status fürs Dauer-HUD (14.11.2026, Wunsch Auftraggeber: schmaler Balken unten links mit grober Auslastung).
// CPU und Arbeitsspeicher kommen aus Node (os.cpus / os.freemem), die Grafikkarte aus nvidia-smi (liegt dem NVIDIA-Treiber
// bei; Abfragefelder laut `nvidia-smi --help-query-gpu`; eine Einzelabfrage dauert etwa 60 ms und endet von selbst),
// „was gerade rechnet“ aus einem kleinen PowerShell-Programm: je Zeile „?“ auf stdin antwortet es mit dem Programmnamen,
// der seit der letzten Frage am meisten Rechenzeit hatte. Schließt sich stdin (L.O.K.I. beendet oder abgestürzt), beendet
// es sich selbst – nichts bleibt verwaist zurück (Prüf-Agent 14.11.2026). Gefragt wird nur, solange das Wallpaper fragt;
// 30 s ohne Abfrage → Programm beendet. Die CPU-Temperatur liefert Windows nicht zuverlässig – bewusst weggelassen.
const { spawn } = require('node:child_process')
const osStandard = require('node:os')

const VERLAUF = 36 // Punkte je Linie: bei 5 s je Abfrage etwa 3 Minuten
const RUHE_MS = 30_000
const GPU_SPERRE_MS = 10 * 60_000
const GPU_FELDER = 'utilization.gpu,memory.used,memory.total,temperature.gpu'
// Rechenzeit je Programmname (alle Prozesse gleichen Namens zusammen, z. B. alle chrome) seit der letzten Frage, Anteil an
// allen Kernen. Ausgenommen: das Programm selbst, Idle, System, Memory Compression.
const SKRIPT_OBEN = `$n = [Environment]::ProcessorCount; $alt = @{}; $uhr = [Diagnostics.Stopwatch]::StartNew(); $aus = @('Idle', 'System', 'Memory Compression')
while ($true) {
  $z = [Console]::In.ReadLine(); if ($z -eq $null) { exit }
  $sek = $uhr.Elapsed.TotalSeconds; $uhr.Restart()
  $neu = @{}; foreach ($p in Get-Process) { if ($p.CPU -ne $null -and $p.Id -ne $PID -and $aus -notcontains $p.ProcessName) { $neu[$p.Id] = @($p.ProcessName, [double]$p.CPU) } }
  $je = @{}; foreach ($k in $neu.Keys) { if ($alt.ContainsKey($k) -and $alt[$k][0] -eq $neu[$k][0]) { $d = $neu[$k][1] - $alt[$k][1]; if ($d -gt 0) { $je[$neu[$k][0]] = $je[$neu[$k][0]] + $d } } }
  $alt = $neu; $best = $je.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1
  if ($best -and $sek -gt 0.5) { [Console]::Out.WriteLine($best.Key + ' ' + [math]::Round($best.Value / $sek / $n * 100)) } else { [Console]::Out.WriteLine('-') }
}`

/** erste Zeile von nvidia-smi („41, 7400, 12282, 61“; bei mehreren Karten zählt die erste) → Werte oder null */
function gpuZeile(z) {
  const t = String(z).split('\n')[0].split(',').map((x) => Number(x.trim()))
  if (t.length < 4 || t.some((x) => !Number.isFinite(x))) return null
  return { gpu: Math.round(t[0]), vramMb: Math.round(t[1]), vramGesamtMb: Math.round(t[2]), gpuGrad: Math.round(t[3]) }
}
/** eine Zeile des PowerShell-Programms („ollama 18“) → „ollama 18 % CPU“ oder null */
function obenZeile(z) {
  const m = /^(\S{1,40}) (\d{1,3})$/.exec(String(z).trim())
  if (!m || Number(m[2]) < 1) return null
  return `${m[1].toLowerCase()} ${m[2]} % CPU`
}
/** CPU-Anteil 0..100 zwischen zwei Messungen von os.cpus() */
function cpuAnteil(vorher, jetzt) {
  if (!vorher || !jetzt || vorher.length !== jetzt.length) return null
  let ruhe = 0, gesamt = 0
  jetzt.forEach((c, i) => {
    const a = vorher[i].times, b = c.times
    gesamt += (b.user - a.user) + (b.nice - a.nice) + (b.sys - a.sys) + (b.idle - a.idle) + (b.irq - a.irq)
    ruhe += b.idle - a.idle
  })
  return gesamt > 0 ? Math.max(0, Math.min(100, Math.round((1 - ruhe / gesamt) * 100))) : null
}

/** @param {{ starte?: typeof spawn, os?: typeof osStandard, protokoll?: (...a: any[]) => void }} o */
function erstellePcStatus({ starte = spawn, os = osStandard, protokoll = () => {} } = {}) {
  let cpusVorher = null, gpu = null, oben = null, ruheUhr = null, gpuGesperrtBis = 0, gpuLaeuft = null, obenP = null
  const verlauf = { cpu: [], gpu: [], vram: [], ram: [] }

  function gpuSperren(grund) { gpuGesperrtBis = Date.now() + GPU_SPERRE_MS; gpu = null; protokoll('PC-Status (GPU): für 10 Minuten aus –', grund) }
  /** Einzelabfrage der Grafikkarte; der Wert kommt bei der nächsten Abfrage des Wallpapers an */
  function gpuFragen() {
    if (gpuLaeuft || Date.now() < gpuGesperrtBis) return
    let q
    try { q = starte('nvidia-smi', [`--query-gpu=${GPU_FELDER}`, '--format=csv,noheader,nounits'], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }) } catch (f) { gpuSperren(f?.message ?? f); return }
    gpuLaeuft = q
    let aus = ''
    const uhr = setTimeout(() => { try { q.kill() } catch { /* schon weg */ } }, 3000); uhr.unref?.()
    q.stdout?.on('data', (d) => { aus += String(d) })
    q.on('error', (f) => { clearTimeout(uhr); gpuLaeuft = null; gpuSperren(f?.message ?? f) })
    q.on('exit', (code) => {
      clearTimeout(uhr); gpuLaeuft = null
      const w = code === 0 ? gpuZeile(aus) : null
      if (w) gpu = w; else gpuSperren(`Ende mit ${code}`) // kaputter Treiber o. Ä.: nicht alle 5 s neu starten (Prüf-Agent)
    })
  }
  function obenProzess() {
    if (obenP && !obenP.killed && obenP.exitCode == null) return obenP
    let q
    try { q = starte('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', SKRIPT_OBEN], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }) } catch (f) { protokoll('PC-Status:', f?.message ?? f); return null }
    obenP = q
    let rest = ''
    q.on('error', (f) => { protokoll('PC-Status: Start fehlgeschlagen', f?.message ?? f); if (obenP === q) obenP = null })
    q.on('exit', () => { if (obenP === q) obenP = null })
    q.stderr?.on('data', (d) => protokoll('PC-Status:', String(d).slice(0, 200)))
    q.stdin?.on?.('error', () => {}) // Programm eben beendet: nicht als Absturz melden
    q.stdout?.on('data', (d) => { rest += String(d); let i; while ((i = rest.indexOf('\n')) >= 0) { oben = obenZeile(rest.slice(0, i)); rest = rest.slice(i + 1) } })
    return q
  }
  function beenden() {
    try { obenP?.stdin?.end(); obenP?.kill() } catch { /* schon weg */ }
    obenP = null; gpu = null; oben = null; cpusVorher = null
    for (const k of Object.keys(verlauf)) verlauf[k] = []
    clearTimeout(ruheUhr); ruheUhr = null
  }
  const anhaengen = (k, v) => { if (v == null || !Number.isFinite(v)) return; verlauf[k].push(Math.round(v)); if (verlauf[k].length > VERLAUF) verlauf[k].shift() }

  /** einmal je Abfrage des Wallpapers (etwa alle 5 s) */
  function lesen() {
    gpuFragen()
    const q = obenProzess(); if (q?.stdin?.writable) q.stdin.write('?\n')
    clearTimeout(ruheUhr); ruheUhr = setTimeout(beenden, RUHE_MS); ruheUhr.unref?.()
    const cpus = os.cpus(), cpu = cpuAnteil(cpusVorher, cpus)
    cpusVorher = cpus
    const ramGesamtMb = Math.round(os.totalmem() / 1048576), ramMb = ramGesamtMb - Math.round(os.freemem() / 1048576)
    anhaengen('cpu', cpu); anhaengen('ram', (ramMb / ramGesamtMb) * 100)
    if (gpu) { anhaengen('gpu', gpu.gpu); anhaengen('vram', (gpu.vramMb / gpu.vramGesamtMb) * 100) }
    return { cpu, ramMb, ramGesamtMb, ...(gpu ?? {}), oben, verlauf: { cpu: [...verlauf.cpu], gpu: [...verlauf.gpu], vram: [...verlauf.vram], ram: [...verlauf.ram] } }
  }
  return { lesen, beenden }
}

module.exports = { erstellePcStatus, gpuZeile, obenZeile, cpuAnteil, SKRIPT_OBEN }
