# Lokis Stimme einrichten (03.11.2026): legt die Python-Umgebung mit genau den Paketfassungen aus anforderungen.txt an
# und laedt das Sprachmodell Qwen/Qwen3-TTS-12Hz-0.6B-Base (ca. 2 GB, Apache-2.0) von Hugging Face.
# Braucht uv (https://docs.astral.sh/uv/) und eine Nvidia-Grafikkarte. Jarvis findet die Umgebung danach von selbst.
# Aufruf:  powershell -ExecutionPolicy Bypass -File stimme\einrichten.ps1 [-Ziel <Ordner>]
# Fehler werden nur ueber den Rueckgabewert der Programme erkannt: Windows PowerShell 5.1 haelt sonst jede
# Fortschrittsmeldung auf stderr (uv, Modell) fuer einen Fehler.
param([string]$Ziel = (Join-Path $env:APPDATA 'Jarvis\loki-python'))
$ErrorActionPreference = 'Continue'
$hier = Split-Path -Parent $MyInvocation.MyCommand.Path
function Abbruch($text) { Write-Host "FEHLER: $text" -ForegroundColor Red; exit 1 }

if (-not (Get-Command uv -ErrorAction SilentlyContinue)) { Abbruch 'uv fehlt. Installation: https://docs.astral.sh/uv/getting-started/installation/' }

Write-Host "Python-Umgebung in $Ziel ..."
uv venv $Ziel --python 3.12 --allow-existing
if ($LASTEXITCODE -ne 0) { Abbruch 'uv venv fehlgeschlagen' }
$py = Join-Path $Ziel 'Scripts\python.exe'
# unsafe-best-match: torch/torchaudio (+cu128) gibt es nur bei pytorch.org, alles andere bei PyPI
uv pip install --python $py -r (Join-Path $hier 'anforderungen.txt') --index-strategy unsafe-best-match
if ($LASTEXITCODE -ne 0) { Abbruch 'Installation der Pakete fehlgeschlagen' }

Write-Host 'Sprachmodell laden ...'
$env:HF_HUB_OFFLINE = '0'
& $py -I -c "from huggingface_hub import snapshot_download as s; s('Qwen/Qwen3-TTS-12Hz-0.6B-Base')"
if ($LASTEXITCODE -ne 0) { Abbruch 'Laden des Sprachmodells fehlgeschlagen' }

# Probelauf offline - genau wie spaeter in Jarvis
Write-Host 'Probelauf ...'
$env:HF_HUB_OFFLINE = '1'
$antwort = '{"id":1,"text":"Sehr wohl, Sir."}' | & $py -I (Join-Path $hier 'loki_stimme.py') 2>$null
if (($antwort -join "`n") -notmatch '"sr"') { Abbruch "Probelauf fehlgeschlagen: $antwort" }
Write-Host 'Fertig - Loki hat seine Stimme.'
