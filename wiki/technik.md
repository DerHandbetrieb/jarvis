# Technik

Stand: 2026-11-14

Verwandt: [Projekt](projekt.md), [Charakter und Stimme](charakter-und-stimme.md), [Gespräch und Befehle](gespraech-und-befehle.md), [Installieren](skills/installieren.md).

## Programm

- **Electron 44.9.0**, Sicherheit: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. Die Oberfläche bekommt über `electron/preload.cjs` nur `window.jarvisDesktop`; IPC nimmt nur Aufrufe aus dem Hauptfenster an (`vonFenster`).
- Oberfläche React 19 + Vite 8 + Tailwind 4 + TypeScript, **mitgeliefert** unter `app://jarvis/` (läuft ohne Internet). Schutzregel (CSP) erlaubt nur eigene Dateien.
- Mikrofon nur Ton und nur für die eigene Oberfläche; keine Kamera, kein Standort. Der Ton verlässt den PC nicht.
- **Autostart:** `app.setLoginItemSettings` (Name „Jarvis“, Argument `--autostart`), startet immer unsichtbar mit Symbol im Infobereich (türkis = hört zu, grau = aus/Mikrofon aus, rot = Störung). X versteckt nur; Abmelden/Herunterfahren beendet. Installer für den aktuellen Benutzer, startet nichts nach der Installation.
- **Rechnerstart** (`rechnerStart` in `dienst.ts`): einschalten (Mikrofon bis zu 5-mal), bis 180 s auf Lokis Stimme warten (ohne sie keine Begrüßung), wechselnder Gruß, dann einmal am Tag Morgen-Lage und Nachrichten. Während dieser Startphase warten Neuigkeiten – nie zwei Stimmen gleichzeitig.

## Sprache lokal

- **sherpa-onnx-node 1.13.8** (Apache-2.0) im Hauptprozess (`electron/jarvis.cjs`): Piper Thorsten high (Ersatzstimme; Piper GPL-3.0, Stimme MIT bzw. CC0 – vor einer Weitergabe Modellkarte prüfen), Silero-VAD (MIT), Whisper small int8 (MIT, Ersatz-Erkenner). Modelle (~760 MB) beim ersten Einschalten aus den offiziellen sherpa-onnx-Releases nach `%APPDATA%\Jarvis\jarvis`.
- In Electron immer `enableExternalBuffer: false`. An erkannte Stücke 0,5 s Stille anhängen. Während Loki spricht, hört er nicht zu.
- **Lokis Stimme:** `stimme/loki_stimme.py` als Hintergrund-Programm über `electron/loki.cjs`, nur stdin/stdout (JSON-Zeilen, Ton Base64-float32, 24 kHz), kein Netzwerk, `HF_HUB_OFFLINE=1`. Laden 10–33 s, ca. 2,8 GB Grafikspeicher in Ruhe (räumt 20 s nach dem letzten Satz auf). Hängt ein Satz zu lange (5 s + 60 ms je Zeichen, höchstens 60 s), gilt sie als gestört und startet höchstens einmal je Einschalten neu; Piper springt ein. Umgebung `%APPDATA%\Jarvis\loki-python` (`stimme/einrichten.ps1`, Fassungen in `stimme/anforderungen.txt`, braucht `uv`). Python-stdin ausdrücklich als UTF-8 lesen.
- **Lokis Gehör** (0.8.0): `gehoer/loki_gehoer.py` mit faster-whisper 1.2.1 und large-v3-turbo (MIT), int8_float16 auf der Grafikkarte, ca. 1,2 GB, 0,11 s je Satz; Umgebung `%APPDATA%\Jarvis\gehoer-python` (`gehoer\einrichten.ps1`). Gemessen mit Wortliste 5,9 % Wortfehler (small: 20,9 %). Wortliste `GRUNDWORTE` in `jarvis.cjs` + eigene Wörter (initial_prompt, ≤ 400 Zeichen); Befehlswörter dort nicht in natürlicher Reihenfolge, sonst verwirft `ist_wortliste` echte Sätze.
- **Untertitel-Floskeln:** Whisper erfindet bei Lärm „Untertitelung des ZDF …“ → Filter `EINBILDUNG`, Abschnitte mit avg_logprob < −1 weg, Wortlisten-Echo verwerfen. Whisper small springt ein, solange das Gehör lädt, bei Störung, Zeitüberschreitung, Spiel oder Wahl „Klein“.
- Ungenutzte Stellschrauben, falls kurze Befehle schlecht ankommen: Rauschunterdrückung/Echofilter in `getUserMedia` (dienst.ts) abschalten, large-v3.

## Sprachmodell für freie Fragen

- Ollama (MIT, 0.40.14, Benutzer-Installation ohne Konto) auf 127.0.0.1:11434, Modell **qwen3:8b** (Apache-2.0), Aufruf aus dem Hauptprozess mit `think: false`, `num_ctx 4096`, Stichproben-Werte laut Modellkarte (`OLLAMA_OPTIONEN`), `keep_alive '3m'`. Vorwärmen, sobald „Loki“ fällt.
- Monatliche Modell-Prüfung (`modellpruefung.cjs`, Fingerabdruck gegen registry.ollama.ai), Aktualisieren nur per Knopf; ein anderes Modell wählt Loki nie selbst.
- Nicht: Qwen2.5-3B (qwen-research-Lizenz), Ministral (Research License), XTTS v2, Kokoro (kein Deutsch), openWakeWord-Fertigmodelle (CC BY-NC-SA), Chromes Web Speech.

## Speicher sparen

- **Spiel-Modus** (`vollbild.cjs`, SHQueryUserNotificationState 2/3 für 60 s): Stimme aus, Ollama-Modelle entladen, Piper spricht.
- **Abwesenheit:** 20 min ohne Maus/Tastatur und ohne Ansprache → Stimme und Gehör aus (ca. 4,9 GB Grafik-, 3 GB Arbeitsspeicher), zurück bei Eingabe. Gemeinsamer Weg `vorlaeufigAus`/`wiederLaden` in `jarvis.cjs`.
- Messung 04.11.2026: Grafikspeicher war mit Firefox, Claude usw. knapp (15 von 16,4 GB). Bei Stocken zuerst Antwortzeiten in `gespraech.log` ansehen.

## Codewort

- Heute: Whisper erkennt jeden Satz, `befehle.ts` sucht den Namen. Alternativen für ein echtes Codewort-Modell: eigenes Modell trainieren oder Vosk (Lizenz prüfen).
