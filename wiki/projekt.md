# Projekt Jarvis / L.O.K.I.

Stand: 2026-11-14

Verwandt: [Technik](technik.md), [Charakter und Stimme](charakter-und-stimme.md), [Entscheidungen](entscheidungen.md), [Index](index.md).

## Auftraggeber und Ziel

- Auftraggeber: Der Handbetrieb (Bloßfeld und Jungk GbR, Firmensitz Öhringen). Er kann nicht programmieren.
- **Jetzt:** eigenes Windows-Programm auf dem PC des Auftraggebers, kostenlos und lokal. Inhalt: Morgen-Lage, Befehle und Fragen per Stimme, dazu das Dauer-HUD als Wallpaper über drei Bildschirme. Kostenpflichtige Dienste nur nach Rückfrage.
- **Später:** Hausassistent (Alexa im Haus, Home-Automation, Handy, PC des Kollegen), verbunden mit der Werkstatt-App über dieselbe Datenbank. Siehe [Ideen](ideen.md).
- Entstanden am 03.11.2026 als Umzug aus der Werkstatt-App (`C:\Projekte-Claude\Werkstatt-App`, Version 0.119.0). Seit Werkstatt 0.123.0 ist Jarvis dort ganz entfernt. Vorlagen von dort: `vorschau/aus-werkstatt/`.

## Name

- **Rufname „Loki“** (Entscheidung 03.11.2026): Whisper verstand „Jarvis“ schlecht („Tchaovis“, „Chavez“, „Hayawis“). „Jarvis“ wird als zweiter Rufname weiter erkannt.
- Erkannt werden auch Luki, Logi, Loky, Lowki, Lokie, Lookie, Lohki, Loggy, Lukie, Lokey sowie Low-Key, Low Key, Lo Ki, Low Kee (`istLoki`, `codewort` in `src/jarvis/befehle.ts`).
- **Schreibweise L.O.K.I.** = „Lokale, Ohnehin Klügere Intelligenz“ (04.11.2026). In allen sichtbaren Texten „L.O.K.I.“; in gesprochenen Sätzen „Loki“ (sonst buchstabiert die Stimme). Code-Namen, Ordner, Programmname „Jarvis“, Konto-E-Mail, Authenticator-Eintrag „Loki“ und Runen-Schriftzug ᛚᚢᚴᛁ bleiben.

## Rechner und Umgebung

- PC des Auftraggebers: RTX 4080 16 GB, 64 GB RAM, i7-13700K.
- Drei Bildschirme BenQ GL2580, je 1920×1080 @ 60 Hz: links (−1920,0), Mitte = Hauptbildschirm (0,0), rechts (1920,−1). Windows-Taskleiste auf allen dreien (48 px unten).
- L.O.K.I. steht im leisen Büro, nicht in der Werkstatt; einzige Störquelle ist manchmal Musik.
- Wohnort und Wetter: Obersontheim (Öhringen = Kollege).
- Der Hund heißt Emma (Labrador).

## Ordner und Konten

- Ordner `C:\Projekte-Claude\Jarvis`; GitHub privat https://github.com/DerHandbetrieb/jarvis, Branch `main`, Git-Autor „Bloßfeld und Jungk GbR“.
- Datenordner des Programms `%APPDATA%\Jarvis` (Modelle in `jarvis\`, Python-Umgebungen `loki-python`, `gehoer-python`). Achtung Abschottung: [AppData-Zugriff](skills/appdata-zugriff.md).
- Installiertes Programm: `%LOCALAPPDATA%\Programs\jarvis`.

## Aufbau des Codes (Überblick)

- `electron/` – Hauptprozess: `main.cjs` (Fenster, Rechte, Gegenstelle, Kamera, Werkstatt …), `preload.cjs` (Brücke `window.jarvisDesktop`), `jarvis.cjs` (Stimme Piper, VAD, Whisper, Ollama), `loki.cjs` (Hintergrund-Programme Stimme/Gehör), weitere Bausteine je Thema mit Tests (`*.test.js`).
- `src/jarvis/` – Oberfläche und Ablauf: `dienst.ts` (Ablauf), `befehle.ts`, `morgenlage.ts`, `neuigkeiten.ts`, `nachrichten.ts`, `wetterAntwort.ts`, `werkstattAntwort.ts`, Sprüche (`fundus.ts`, `begruessung.ts`, `nachschub.ts`, `rotation.ts`), Einstellungen (`desktop.ts`, `JarvisEinstellungen.tsx`).
- `stimme/` und `gehoer/` – Python-Hintergrund-Programme (Qwen3-TTS, faster-whisper).
- `hud5/` – Szene und Inhalte des Dauer-HUD; `dauerhud/seite.js` – Wallpaper; `dauer-hud.html`.
- `recherche/` – Recherchen mit Quellen (bleiben dort, Code-Kommentare verweisen darauf).
- `dauerhud/lageDaten.js` (früher `startsequenz/`) rechnet die Werkstatt-Werte für das HUD um.
- Reste der Start-Sequenz und alte Entwürfe am 14.11.2026 aufgeräumt (in Git weiter abrufbar, z. B. über den Tag `vor-wissenssystem`). Übrig als reine Vorschau: `vorschau/` (u. a. `vorschau/start-sequenz/`).

## Befehle

- `npm install` – einmalig; `npm test` – Tests; `npm run build` – Syntaxprüfung, Typen, Tests, Bau von Oberfläche und Wallpaper (vor jedem Commit).
- `npm start` – bauen und Fenster starten; `npm run electron:dev` – Vite auf Port 5174 (5173 gehört der Werkstatt-App).
- `npm run electron:build` – Installer in `release/` (braucht `.env.werkstatt`, sonst Abbruch).
- `npm run selbsttest -- --user-data-dir=<Ordner mit jarvis\-Modellen>` – Sprach-Selbsttest.
- Abläufe: [Installieren](skills/installieren.md), [Wallpaper einspielen](skills/wallpaper-einspielen.md), [Sprüche nachfüllen](skills/sprueche-nachfuellen.md).
