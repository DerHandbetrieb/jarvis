# Übergabe an die nächste Jarvis-Sitzung (Stand 03.11.2026)

**Zuerst lesen:** `CLAUDE.md` (Gedächtnis des Projekts, alle Regeln und Entscheidungen), dann diese Datei. Danach mit dem Auftraggeber auf Deutsch in einfacher Sprache weiterarbeiten – er kann nicht programmieren.

Diese Datei fasst den Stand der ersten Sitzung zusammen. Sie wurde aus der Werkstatt-App heraus gestartet und lässt sich darum nicht in die eigene Jarvis-Gruppe der Seitenleiste verschieben. Ab jetzt läuft die Arbeit in einer neuen Sitzung, die direkt in `C:\Projekte-Claude\Jarvis` geöffnet wird.

## Stand in einem Satz

Jarvis ist ein eigenes Windows-Programm (Electron) mit dem aus der Werkstatt-App übernommenen Sprachassistenten. Er heißt jetzt **Loki** und hat einen bissigeren Charakter. Die neue Stimme ist **festgelegt (Probe R2)**, aber noch **nicht eingebaut** – im Programm spricht noch Piper Thorsten (Probe A).

## Getroffene Entscheidungen (Auftraggeber, 03.11.2026)

- **Eigenes Projekt:** Ordner `C:\Projekte-Claude\Jarvis`, privates GitHub-Repository https://github.com/DerHandbetrieb/jarvis (Branch `main`). Die Werkstatt-App behält ihre Jarvis-Fassung, bis der eigene Jarvis läuft.
- **Rufname „Loki“**, Arbeitstitel/Programmname bleibt „Jarvis“ (Andenken). „Jarvis“ wird als zweiter Rufname weiter erkannt. Grund: Whisper verstand „Jarvis“ schlecht („Tchaovis“, „Chavez“, „Hayawis“), „Loki“ fast immer richtig.
- **Persönlichkeit:** britischer Butler, Anrede „Sir“, „noch bissiger“: in jeder Antwort ein kleiner Seitenhieb, dem Auftraggeber gegenüber gespielt kritisch und anzweifelnd, nie beleidigend; Fakten immer zuerst. Hund Emma (Labrador) darf in Sprüchen vorkommen. Keine Kopie der echten Jarvis-Synchronstimme (Persönlichkeitsrecht).
- **Stimme:**
  - Heute im Programm: Piper Thorsten high, Tempo 0,88 (Probe A) – bleibt vorerst.
  - Piper-Regler (B–D) brachten keine Verbesserung; **britische Piper-Stimmen mit deutscher Lautschrift (E–G) „schrecklich“ – nicht wieder vorschlagen.**
  - Gewählt wurde zuerst **Q1** = Qwen3-TTS VoiceDesign (Apache-2.0), „britischer Butler, spricht Deutsch mit leichtem britischen Akzent“.
  - **Endgültig: R2 („genial, so bleibt es“)** = Q1 als feste Vorlage, gesprochen vom kleinen Grundmodell Qwen3-TTS-12Hz-0.6B-Base. Vorlage und alle Angaben: `stimme/loki-vorlage.wav`, `stimme/LIESMICH.md` (in Git).

## Gebaut und getestet

- Programmgerüst: `electron/main.cjs` (Sicherheit: contextIsolation an, nodeIntegration aus, sandbox; nur Mikrofon erlaubt; Oberfläche mitgeliefert unter `app://jarvis/`), `electron/preload.cjs` (Brücke `window.jarvisDesktop`), `electron/jarvis.cjs` (Piper, Silero-VAD, Whisper über sherpa-onnx-node; Ollama-Fragen).
- `src/jarvis/`: Morgen-Lage mit Seitenhieben (`morgenlage.ts`), Loki-Erkennung (`befehle.ts`, `istLoki`), Ablauf und Anweisung ans Sprachmodell (`dienst.ts`, `charakter()`), Aussprache, Einstellungen, Ring-Knopf.
- Tests: `npm run build` grün (10 Tests in `src/jarvis/jarvis.test.ts`). Sprach-Selbsttest (sprechen → erkennen) erfolgreich. Fenster startet ohne Fehler.
- Zwei unabhängige Prüf-Agenten haben Gerüst und Loki/Charakter geprüft; ihre Mängel sind behoben.
- Hörproben A–R mit Seite `vorschau/hoerproben/index.html`; Whisper verstand M1, M2, N1, Q1, Q2 fast fehlerfrei.

## Offen – in dieser Reihenfolge vorgeschlagen

1. ✅ Feste Loki-Stimme bestätigt: R2 (0.6B-Base + `stimme/loki-vorlage.wav`).
2. ✅ **Qwen beschleunigt (03.11.2026):** faster-qwen3-tts (MIT), 3,7-mal schneller als Echtzeit, erster Ton nach 0,3 s – Probe S, Einzelheiten in `CLAUDE.md` Abschnitt 2. Auftraggeber: „klingt gleich“ wie R2.
3. **Q1 ins Programm einbauen:** kleiner lokaler Python-Dienst (z. B. nur auf 127.0.0.1), den `electron/jarvis.cjs` statt Piper aufruft; Piper als Rückfall, wenn der Dienst fehlt. Vorher Plan zeigen.
4. **Loki mit der echten Stimme des Auftraggebers testen** (bisher nur mit der Computerstimme).
5. Empfindlichkeit des Mikrofons einstellbar (Werkstatt-Lärm), Länge der Morgen-Lage prüfen (bis zu acht Witzsätze).
6. Danach laut `CLAUDE.md`: Werkstatt-Anbindung über Supabase (nur planen, eigene Anmeldung mit Zwei-Faktor), Ollama einrichten, Aktionen mit Bestätigung, Gestaltung (vier Entwürfe), Start-Sequenz, Wallpaper Engine, Alexa, Kameras.

## Wichtige Pfade

| Was | Wo |
|---|---|
| Projekt | `C:\Projekte-Claude\Jarvis` |
| Hörproben-Seite und Skripte | `vorschau/hoerproben/` (Node: `erzeugen.cjs`, `akzent.cjs`, `loki-test.cjs`, `lautschrift.cjs`; Python: `python/*.py`) |
| Stimmen-Recherche mit Quellen | `recherche/stimmen-2026-11-03.md` |
| Python-Umgebungen (nicht in Git) | `modelle/tts/chatterbox` (Python 3.11, torch 2.6 cu124), `modelle/tts/qwen` (Python 3.12, torch 2.11 cu128) – angelegt mit `uv` |
| Teststimmen Piper (nicht in Git) | `modelle/vits-piper-*` |
| Heruntergeladene KI-Modelle | `C:\Users\PerfectGreen\.cache\huggingface` (ca. 14 GB) |
| Sprachmodelle des Programms | `%APPDATA%\Jarvis\jarvis` (lädt beim ersten Einschalten, ~760 MB); die Werkstatt-Fassung liegt in `%APPDATA%\Werkstatt\jarvis` (für Tests nur lesend genutzt) |

## Wichtige Befehle

```bash
npm install                 # einmalig
npm run build               # Typen, Tests, Bau – vor jedem Commit
npm start                   # Oberfläche bauen und Jarvis-Fenster starten
npm run electron:dev        # Entwickeln (Vite auf Port 5174)
npm run selbsttest -- --user-data-dir=C:/Users/PerfectGreen/AppData/Roaming/Werkstatt   # Sprach-Selbsttest
```

Hörproben anhören: Vorschau-Server „hoerproben“ aus `.claude/launch.json` (Port 5175). Proben neu erzeugen, z. B.:

```bash
modelle/tts/qwen/Scripts/python.exe -I vorschau/hoerproben/python/qwen_klon.py vorschau/hoerproben
```

## Hinweise für die neue Sitzung

- Downloads, Installationen und alles, was Geld kostet, vorher mit Dateiname, Quelle und Größe freigeben lassen.
- Thorsten-Kokoro wurde nicht installiert (Pakete aus einem privaten GitHub-Konto, vom Sicherheitsfilter gestoppt) – nur nach ausdrücklicher Freigabe.
- In der Werkstatt-App lagen am 03.11.2026 nicht committete Änderungen an `supabase/functions/prestashop/` aus einer anderen Sitzung – nicht von Jarvis, nicht anfassen.
- Die Memory-Notiz `jarvis-hausprojekt` der Werkstatt nennt noch den alten Ordner `C:\Jarvis`; richtig ist `C:\Projekte-Claude\Jarvis`.
