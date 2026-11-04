# Lokis Gehoer einrichten (04.11.2026): legt die Python-Umgebung mit genau den Paketfassungen aus anforderungen.txt an
# und laedt das Hoermodell Whisper large-v3-turbo (CTranslate2-Fassung mobiuslabsgmbh/faster-whisper-large-v3-turbo,
# MIT, ca. 1,6 GB) von Hugging Face. Braucht uv (https://docs.astral.sh/uv/) und eine Nvidia-Grafikkarte.
# Jarvis findet Umgebung und Modell danach von selbst. Wiederholbar.
# Aufruf:  powershell -ExecutionPolicy Bypass -File gehoer\einrichten.ps1
# Fehler nur ueber den Rueckgabewert erkennen (Windows PowerShell 5.1 haelt sonst Fortschrittsmeldungen fuer Fehler).
param([string]$Ziel = (Join-Path $env:APPDATA 'Jarvis\gehoer-python'), [string]$Modelle = (Join-Path $env:APPDATA 'Jarvis\jarvis\faster-whisper'))
$ErrorActionPreference = 'Continue'
$hier = Split-Path -Parent $MyInvocation.MyCommand.Path
function Abbruch($text) { Write-Host "FEHLER: $text" -ForegroundColor Red; exit 1 }

if (-not (Get-Command uv -ErrorAction SilentlyContinue)) { Abbruch 'uv fehlt. Installation: https://docs.astral.sh/uv/getting-started/installation/' }

Write-Host "Python-Umgebung in $Ziel ..."
uv venv $Ziel --python 3.12 --allow-existing
if ($LASTEXITCODE -ne 0) { Abbruch 'uv venv fehlgeschlagen' }
$py = Join-Path $Ziel 'Scripts\python.exe'
uv pip install --python $py -r (Join-Path $hier 'anforderungen.txt')
if ($LASTEXITCODE -ne 0) { Abbruch 'Installation der Pakete fehlgeschlagen' }

Write-Host 'Hoermodell laden ...'
$env:HF_HUB_OFFLINE = '0'
& $py -I -c "import sys; from faster_whisper.utils import download_model as d; d('large-v3-turbo', cache_dir=sys.argv[1])" $Modelle
if ($LASTEXITCODE -ne 0) { Abbruch 'Laden des Hoermodells fehlgeschlagen' }

# Probelauf offline - genau wie spaeter in Jarvis (eine Sekunde Stille)
Write-Host 'Probelauf ...'
$env:HF_HUB_OFFLINE = '1'
$ton = [Convert]::ToBase64String((New-Object byte[] 64000))
$antwort = ('{"id":1,"ton":"' + $ton + '"}') | & $py -I (Join-Path $hier 'loki_gehoer.py') $Modelle 2>$null
if (($antwort -join "`n") -notmatch '"text"') { Abbruch "Probelauf fehlgeschlagen: $antwort" }
Write-Host 'Fertig - Loki hoert jetzt besser.'
