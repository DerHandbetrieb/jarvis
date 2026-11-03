# Projekt: Jarvis – Sprachassistent für den PC (später Hausassistent)

Auftraggeber: Der Handbetrieb (Bloßfeld und Jungk GbR, Öhringen). Diese Datei ist das Gedächtnis des Projekts. Lies sie zu Beginn jeder Sitzung vollständig und halte sie aktuell, wenn sich Entscheidungen ändern.

Entstanden am 03.11.2026 als Umzug aus der Werkstatt-App (`C:\Projekte-Claude\Werkstatt-App`, Version 0.119.0). Die Werkstatt-App behält ihre Jarvis-Fassung, **bis dieser eigene Jarvis läuft** – erst dann dort entfernen (vorher fragen).

---

## 0. Arbeitsregeln für Claude Code (WICHTIG)

Der Auftraggeber kann **nicht programmieren**. Du erledigst die gesamte Entwicklung.

1. **Sprache:** Immer Deutsch, einfache Sprache, wenig Fachjargon. Nötige Fachbegriffe in einem Satz erklären.
2. **Kleine Etappen:** Immer nur einen Teilschritt auf einmal bauen, nie alles in einem Durchgang.
3. **Vor größeren Entscheidungen** (Bibliothek, Datenstruktur, Dienst, der Geld kostet) Optionen kurz erklären, eine empfehlen, Zustimmung abwarten.
4. **Nach jeder Etappe** eine kurze, konkrete Test-Anleitung („Klicke auf …, du solltest … sehen“).
5. **Sicherung:** Nach jeder funktionierenden Etappe ein Git-Commit mit verständlicher deutscher Beschreibung und hochladen (`origin` = GitHub, privat).
6. **Geheimnisse nie in Git:** API-Schlüssel, Passwörter, Tokens nur in `.env`-Dateien (stehen in `.gitignore`) oder im Windows-Anmeldespeicher – nie im Code, nie im Chat.
7. **Nichts Destruktives ohne Rückfrage:** keine Löschungen von Daten, keine Änderungen an der Live-Datenbank (Supabase der Werkstatt) ohne Bestätigung.
8. **Bei Unklarheit nachfragen** statt raten – besonders bei Geld, Datenschutz und allem, was das Haus steuert.
9. **Ehrlichkeit:** Geht etwas nicht oder ist es riskant, klar sagen.
10. **Fakten statt Vermutungen** („Wir glauben nicht, wir recherchieren.“): Vor jedem Vorschlag mit Grenzen, Regeln, Lizenzen, Zahlen oder Kosten die offiziellen Angaben der Dienste recherchieren und mit Quelle nennen; nur aus Drittquellen Belegtes als unbestätigt kennzeichnen.
11. **Prüf-Agent vor Auslieferung:** Fertige Ergebnisse prüft ein separater Agent ohne Vorwissen gegen Anforderungen und Regeln. Ausgeliefert wird erst, wenn alles erfüllt ist.
12. **Neue Themen** (z. B. Alexa, Wallpaper Engine, Kameras, Home-Automation): erst ein Blindspot-Pass (unbekannte Fallstricke: was es ist, warum es uns erwischen würde, welcher Satz in den Auftrag gehört), dann ein Interview per Nachfrage – eine Frage nach der anderen, jeweils mit Empfehlung –, dann den Plan zeigen und erst nach Zustimmung bauen.
13. **Optik:** Bei allem Sichtbaren vier verschiedene Entwürfe zur Wahl anbieten.
14. **Korrekturen des Auftraggebers** dauerhaft als Regel merken (hier oder im Memory).
15. **Möglichst autonom:** Pläne am Stück abarbeiten, Schritte in angebundenen Diensten selbst erledigen und prüfen; den Auftraggeber nur für echte Fragen, Designentscheidungen, Geld und Freigaben holen. Was er selbst tun muss, gesammelt und kurz nennen. Vereinfachungen (Verbindungen, Automatismen) von sich aus vorschlagen, mit Nutzen, Kosten, Risiko.
16. **Tests:** Automatische Tests für die Logik (Codewörter, Befehle, Aussprache, Morgen-Lage). Vor jedem Commit `npm run build` (prüft Typen, Tests, Bau).

---

## 1. Ziel

- **Jetzt:** Jarvis als eigenes Windows-Programm auf dem PC des Auftraggebers – kostenlos und lokal: Morgen-Lage, Befehle und Fragen per Stimme. Später optional auch kostenpflichtige Dienste (nur nach Rückfrage).
- **Später:** Hausassistent (Start-Sequenz, drei Bildschirme, Alexa im Haus, Außenkameras, Home-Automation), verbunden mit der Werkstatt-App über dieselbe Datenbank.
- Zuerst nur der PC des Auftraggebers (RTX 4080 16 GB, 64 GB RAM, i7-13700K); Kollege und Handy später (ohne Ollama kein Jarvis für freie Fragen).

## 2. Persönlichkeit und Stimme (Entscheidungen Auftraggeber 03.11.2026)

- **Britischer Butler-Stil wie im Film:** förmlich, Anrede „Sir“, trockenes Understatement, Ironie, etwas schwarzer Humor, ab und zu lustige Bemerkungen ohne Arbeitsbezug.
- Der Hund des Auftraggebers heißt **Emma (Labrador)** und darf in Sprüchen vorkommen.
- **Stimme:** Piper **Thorsten high**, Tempo **0,88** (Hörprobe „A“ in der Werkstatt-App, `vorschau/stimmen/hoerproben.html`).
- **Englische Wörter sauber aussprechen** („Sir“ → „Sörr“, nicht „sier“) über die Aussprache-Liste `src/jarvis/aussprache.ts`; eigene Einträge in den Einstellungen.
- **Keine Kopie der echten Jarvis-Synchronstimme** (LG Berlin II, 20.08.2025, Az. 2 O 202/24: KI-Klon der Stimme eines Synchronsprechers verletzt sein Persönlichkeitsrecht). Der Stil entsteht nur über Wortwahl und Tempo.
- **Codewörter:** „Guten Morgen, Loki“ = Morgen-Lage, „Hey Loki, …“ = Befehle/Fragen (Rufname Loki, siehe 7; „Jarvis“ wird weiterhin verstanden). Die Morgen-Lage startet, wenn der Auftraggeber nach dem Start „Guten Morgen, Loki“ sagt; nur am PC, mit **sichtbarer Mikrofon-Anzeige und Stumm-Schalter** (gebaut: Ring + Knopf „Mikrofon aus“) und **einstellbarer Empfindlichkeit wegen Werkstatt-Lärm** (noch nicht gebaut – die Schwelle der Sprechpausen-Erkennung steht fest auf 0,5 in `electron/jarvis.cjs`).
- **Morgen-Lage, Inhalt (etwa eine Minute):** Aufgaben und Neues seit gestern, Probleme in den Shops und nächtlicher Selbsttest, knappe Artikel und Verkäufe von gestern, Wetter und offene Freigaben. Feste Regeln ohne Sprachmodell (darum nichts erfunden); Inhalte als erweiterbare, abschaltbare Bausteine.
- **Aktionen per Sprache** erst klein und immer mit Bestätigung; Antworten nur aus App-Daten.
- **Charakter (Entscheidung 03.11.2026, „noch bissiger“):** Durchgehend trockener, schwarzer, typisch britischer Humor; in jeder Antwort ein kleiner Seitenhieb, dem Auftraggeber gegenüber gespielt kritisch und anzweifelnd, damit Loki wie ein eigenständiger, selbstdenkender Charakter wirkt – nie beleidigend, Fakten immer zuerst und vollständig, bei ernsten Themen kein Spott. Umgesetzt: Seitenhiebe je Baustein der Morgen-Lage (`SPITZEN` in `morgenlage.ts`), die Antworten in `dienst.ts` und die Anweisung an das Sprachmodell (`charakter()` in `dienst.ts`) – alles abschaltbar über „Humor“ in den Einstellungen. Offene Designfrage: Mit allen Bausteinen kommen bis zu acht Witzsätze zusammen – ggf. begrenzen, falls die Lage zu lang wird.
- **Stimme (Hörproben 03.11.2026, `vorschau/hoerproben/`, Seite starten mit dem Vorschau-Server „hoerproben“):**
  - Der Auftraggeber findet die Stimme **zu statisch, nicht flüssig**. Von A–D (Thorsten high mit verschiedenen Reglern) gefiel **A (heute: Tempo 0,88, Grundwerte) am besten**, überzeugt aber noch nicht ganz → bleibt vorerst.
  - **Britischer Akzent über britische Piper-Stimmen mit deutscher Lautschrift (E–G) = „schrecklich, geht gar nicht“** – nicht wieder vorschlagen.
  - Thorsten mit Gefühlslagen (J–L, CC0) war verständlich, wurde aber nicht gewählt.
  - Runde 2 (bessere Technik, Recherche mit Quellen in `recherche/stimmen-2026-11-03.md`): Chatterbox mit Thorsten (M1, M2), Chatterbox mit britischem Sprecher (N1), Qwen3-TTS VoiceDesign mit Akzent (Q1) bzw. ohne (Q2). **Entscheidung Auftraggeber: Q1 („ist geil“)** – Qwen3-TTS (Apache-2.0), Stimme per Beschreibung: „A mature British butler with a deep, calm, warm baritone voice. He speaks fluent German with a slight, elegant British accent. Dry, understated, subtly sarcastic delivery, measured pace, natural pauses.“ (`vorschau/hoerproben/python/qwen_proben.py`). Das ist die **neue Zielstimme**; Piper A bleibt, bis Q1 eingebaut ist.
  - Damit Loki immer gleich klingt (VoiceDesign erzeugt bei jedem Aufruf eine etwas andere Stimme): offizieller Weg „Voice Design then Clone“ – `Q1-frage.wav` ist die Stimmvorlage, das Grundmodell spricht damit jeden Text (`qwen_klon.py`, Proben R1 = 1.7B-Base, R2 = 0.6B-Base). Ob R1/R2 für den Auftraggeber wie Q1 klingen, ist noch nicht bestätigt. **Die Vorlage `Q1-frage.wav` nicht verlieren** (ist nicht in Git – bei Bedarf sichern, z. B. als eigene Datei außerhalb von `*.wav`-Ausschluss nach Rückfrage).
  - **Problem Tempo:** Qwen braucht heute etwa 1,6-mal so lange wie der Ton dauert (z. B. 39 s für 24 s Morgen-Lage, gleich bei 1.7B und 0.6B; ohne FlashAttention, Rechenweise „sdpa“). Für einen Sprachassistenten zu langsam → vor dem Einbau beschleunigen: Ausgabe in Stücken (Streaming, laut Anleitung ab 97 ms), Satz für Satz vorausrechnen, FlashAttention 2 unter Windows, vLLM-Omni (laut Anleitung nur offline), ggf. Chatterbox (M1, schneller als Echtzeit) als Rückfallstufe.
  - Thorsten-Kokoro nicht getestet: braucht Pakete aus dem GitHub-Konto einer Privatperson („semidark“), die Installation wurde vom Sicherheitsfilter gestoppt → nur nach ausdrücklicher Freigabe des Auftraggebers.
  - Chatterbox braucht `setuptools<81` (sonst fehlt `pkg_resources` für das Wasserzeichen-Modul); das PyPI-Paket 0.1.7 kennt nur Multilingual V2, nicht V3.

## 3. Technik

- **Electron** (44.9.0), eigenes Fenster, Sicherheit: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. Die Oberfläche bekommt über `electron/preload.cjs` nur `window.jarvisDesktop` (Version + Jarvis-Funktionen), keinen Datei- oder Programmzugriff.
- Die Oberfläche (React 19 + Vite 8 + Tailwind 4 + TypeScript) wird **mitgeliefert** (Ordner `dist`, Adresse `app://jarvis/`) – nicht online geladen wie bei der Werkstatt-App, damit Jarvis auch ohne Internet läuft. Schutzregel (CSP) erlaubt nur eigene Dateien und Open-Meteo.
- **Mikrofon** nur Ton und nur für die eigene Oberfläche; keine Kamera, kein Standort. Der Ton verlässt den PC nicht.
- **Sprache lokal mit sherpa-onnx-node 1.13.8** (Apache-2.0) im Hauptprozess (`electron/jarvis.cjs`):
  - Stimme: Piper Thorsten high (Stimme laut Recherche 03.11.2026 MIT bzw. CC0 – Modellkarte der Stimme vor einer Weitergabe noch einmal prüfen; Piper GPL-3.0)
  - Sprechpausen-Erkennung: Silero VAD (MIT)
  - Spracherkennung: Whisper small, int8 (MIT)
  - Modelle (~760 MB) lädt das Programm beim ersten Einschalten aus den offiziellen Releases https://github.com/k2-fsa/sherpa-onnx/releases nach `%APPDATA%\Jarvis\jarvis` (Zwischenordner + Marke `<name>.fertig`, 60 s ohne Daten = Abbruch, Whisper in voller Genauigkeit wird gleich gelöscht).
  - In Electron immer `enableExternalBuffer: false` – sonst „External buffers are not allowed“.
  - An erkannte Sprachstücke 0,5 s Stille anhängen, sonst fehlt das letzte Wort.
  - Während Jarvis spricht, hört er nicht zu (sonst hört er sich selbst); Unterbrechen per Knopf „Stopp“.
- **Freie Fragen:** Ollama (MIT) auf diesem PC, http://127.0.0.1:11434, Aufruf aus dem Hauptprozess; Standardmodell **qwen2.5:7b** (Apache-2.0). Alternative Qwen3-4B. **Nicht** Qwen2.5-3B (qwen-research-Lizenz) und **nicht** Ministral (Research License). Antworten zur Werkstatt nur aus echten Daten, nie Zahlen erfinden.
- Ausgeschlossen: XTTS v2 (nicht kommerziell), Kokoro (kein Deutsch), openWakeWord-Fertigmodelle (CC BY-NC-SA), Chromes Web Speech (geht in Electron nicht und schickt Ton an einen Dienst).
- **Codewort-Erkennung heute:** Whisper erkennt jeden Satz, `befehle.ts` sucht den Namen darin. Alternativen für ein echtes Codewort-Modell: eigenes Modell trainieren oder die Schlüsselwort-Erkennung von Vosk (Lizenz noch prüfen).

## 4. Aufbau des Projekts

- `electron/main.cjs` – Fenster, Rechte (nur Mikrofon), nur verschlüsselte Verbindungen der Oberfläche, eine Instanz
- `electron/preload.cjs` – Brücke `window.jarvisDesktop`
- `electron/jarvis.cjs` – Stimme, Erkennung, Modelle laden, Ollama (aus der Werkstatt-App übernommen)
- `electron/jarvis-test.cjs` – Selbsttest: spricht einen Satz und erkennt ihn wieder
- `src/jarvis/` – aus der Werkstatt-App übernommen: `morgenlage.ts` (Bausteine wetter/aufgaben/probleme/lager/verkauf/freigaben, Seitenhiebe nach jedem Sachsatz, Sprüche u. a. über Emma jeden 2. Tag), `aussprache.ts`, `befehle.ts` (Codewörter mit lautlichem Namensvergleich, feste Befehle), `dienst.ts` (Ablauf), `desktop.ts` (Einstellungen je Gerät, localStorage `jarvis.einstellungen`), `JarvisKnopf.tsx`, `JarvisEinstellungen.tsx`, Tests `jarvis.test.ts`. Neu: `wetter.ts` (Open-Meteo, aus der Werkstatt übernommen), `daten.ts` vorerst nur Wetter.
- `src/App.tsx` – vorläufige, schlichte Oberfläche (Kopfzeile mit Ring + Einstellungen)

Änderungen beim Umzug: Brücke heißt `jarvisDesktop` statt `werkstattDesktop`; keine Seiten-Navigation („öffne das Lager“ sagt ehrlich, dass das von hier noch nicht geht); Werkstatt-Bausteine der Morgen-Lage liefern vorerst nichts (siehe 6).

### Befehle

- `npm install` – einmalig nach dem Herunterladen
- `npm test` – Tests
- `npm run build` – Typen, Tests, Bau der Oberfläche
- `npm start` – Oberfläche bauen und Jarvis-Fenster starten
- `npm run electron:dev` – Entwickeln mit Vite auf Port 5174 (5173 gehört der Werkstatt-App)
- `npm run selbsttest -- --user-data-dir=<Ordner mit jarvis\-Modellen>` – Sprach-Selbsttest (z. B. `%APPDATA%\Jarvis`)
- `npm run electron:build` – Windows-Installer in `release/`
- Hörproben: `node vorschau/hoerproben/erzeugen.cjs <Ordner der Thorsten-Stimme>` (bzw. `akzent.cjs`, `loki-test.cjs`); die .wav-Dateien und `modelle/` (Teststimmen) sind nicht in Git und müssen nach dem Klonen neu erzeugt bzw. geladen werden. Anhören über den Vorschau-Server „hoerproben“ (`.claude/launch.json`, Port 5175).

## 5. Etappen

1. ✅ (Werkstatt 0.119.0) Morgen-Lage als fester Text mit Vorlesen
2. ✅ Mikrofon + Whisper + Fragen an Ollama (Ollama beim Auftraggeber noch nicht eingerichtet)
3. ✅ Codewort
4. ✅ (03.11.2026) Umzug in dieses eigene Projekt, Grundgerüst
5. ✅ (03.11.2026) Rufname Loki umgesetzt (Erkennung, Texte) – Test mit der echten Stimme des Auftraggebers steht noch aus
6. offen: Empfindlichkeit des Mikrofons einstellbar machen (Werkstatt-Lärm)
7. Stimme und Charakter: Charakter ✅ (bissiger); Stimme gewählt: Qwen3-TTS Q1 (siehe 2) – offen: feste Stimme bestätigen (R1/R2), beschleunigen, als lokalen Dienst ins Programm einbauen
8. offen: Werkstatt-Anbindung (Plan, siehe 6)
9. offen: Ollama einrichten
10. offen: Aktionen per Sprache, **immer mit Bestätigung**, erst klein (Karte anlegen/erledigen, Produziert buchen, Seite öffnen; nie Shop-Texte/Preise)
11. offen: Gestaltung – vier Entwürfe (Vorlage aus der Werkstatt: `vorschau/jarvis-vier.html`)
12. später: Autostart, Start-Sequenz, Wallpaper Engine, Alexa, Kameras, Home-Automation, Handy (siehe 8)

## 6. Werkstatt-Anbindung (nur geplant – nicht ohne Rückfrage bauen)

Jarvis liest später Aufgaben, Lager, Verkäufe, Amazon-Probleme und offene Freigaben aus **derselben Supabase-Datenbank** wie die Werkstatt-App (Projekt `ueadwnyaixbvfymtutbk`), mit **eigener Anmeldung inkl. Zwei-Faktor**. Vor dem Bau gemeinsam klären und offiziell recherchieren:
- welches Konto (eigenes Jarvis-Konto mit nur Lese-Rechten empfohlen) und wie die Zwei-Faktor-Anmeldung im Windows-Programm abläuft
- wo die Anmeldung gespeichert wird (verschlüsselt, Windows-Anmeldespeicher / Electron `safeStorage`, nie in Git)
- welche Tabellen/Abfragen nötig sind (Vorlage: `src/jarvis/daten.ts` in der Werkstatt-App) und ob die Zugriffsregeln (RLS) dafür reichen
- Schutzregel (CSP) dann um `https://ueadwnyaixbvfymtutbk.supabase.co` erweitern

## 7. Der Name: Rufname LOKI (Entscheidung Auftraggeber 03.11.2026)

- **Rufname wird „Loki“** – kurz, leicht zu sprechen, sollte von Whisper gut verstanden werden. Codewörter dann „Guten Morgen, Loki“ und „Hey Loki, …“.
- **Projekt- und Arbeitstitel bleibt „Jarvis“** – als kleines Andenken (Ordner, Repository, Programmname, Code bleiben so).
- Grund für den Wechsel: Whisper verstand „Jarvis“ schlecht (gehört u. a. „Tchaovis“, „Chavez“, „Chavis“, „Javi“, „Highjavis“; Selbsttest 03.11.2026 mit der Thorsten-Stimme: „Alt+Jawis“). Verworfen: ALFRED, ODIN, HUGIN.
- **Umgesetzt 03.11.2026:** `istLoki()` in `src/jarvis/befehle.ts` erkennt Loki/Luki/Logi/Loky…, auch zusammengeschrieben („Heiloki“, „High-Loki“) – Varianten aus dem Whisper-Test mit der Thorsten-Stimme (`vorschau/hoerproben/loki-test.cjs`; Jarvis dagegen wurde zu „Hayawis“, „Herr Yamis“). „Jarvis“ bleibt als zweiter Rufname. Offen: Test mit der echten Stimme des Auftraggebers; eine Abkürzung für LOKI ist nicht festgelegt.

## 8. Ideen für später (alle vor dem Bau mit offiziellen Quellen prüfen)

- **Autostart mit Windows und Sci-Fi-Start-Sequenz** im Vollbild auf allen drei Bildschirmen mit Ton und Effekten, danach Begrüßung (Vorbilder: https://www.youtube.com/watch?v=RjF_j6QZpxc und https://www.youtube.com/watch?v=LuuOpozKbvE).
- **Wallpaper Engine** (Steam) läuft beim Auftraggeber auf allen drei Bildschirmen mit einem animierten Objekt über alle drei – prüfen, ob sie sich für die Start-Sequenz bzw. als Jarvis-Anzeige nutzen lässt (Web-Hintergründe/Schnittstellen).
- **Drei Bildschirme als Arbeitsfläche:** dauerhaft die Lage zeigen (Aufgaben, Lager, Shops, Verkäufe, Jarvis) und damit arbeiten – prüfen, wie weit man mit einem Hintergrundbild interagieren kann (Klicks nur bei freiem Desktop) oder ob randlose Vollbild-Fenster je Bildschirm besser sind.
- **Alexa** (mehrere Geräte im Haus): eigener Skill („Alexa, frag Loki …“), der Fragen weitergibt; Stimme dort wäre die Alexa-Stimme; Kosten und Datenschutz vorher klären.
- **Außenkameras** und **Home-Automation-Station** einbinden.
- Weitere Bausteine der Morgen-Lage: Börse, KI-Neuigkeiten (freie Quellen prüfen, keine Anlageberatung).
- **Handy** und **PC des Kollegen** (dort ohne Ollama keine freien Fragen).
- Eigenes Programmsymbol (heute zeigt der Installer das Electron-Symbol) – mit der Gestaltung.
- Wetterort wählbar machen (heute immer Öhringen).

## 9. Projektordner und Konten

- Ordner: `C:\Projekte-Claude\Jarvis` (alle Claude-Projekte liegen unter `C:\Projekte-Claude`)
- GitHub: privates Repository https://github.com/DerHandbetrieb/jarvis, Branch `main`, Git-Autor „Bloßfeld und Jungk GbR“
- Datenordner des Programms: `%APPDATA%\Jarvis` (Modelle in `jarvis\`)
