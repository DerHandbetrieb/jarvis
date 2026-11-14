# Kameras

Stand: 2026-11-14

Verwandt: [Dauer-HUD](dauer-hud.md), [Werkstatt-Anbindung und Neuigkeiten](werkstatt-anbindung.md), Recherche `recherche/kameras-2026-11-03.md`.

## Grundsätze (Interview 03.11.2026)

- **Reolink Duo PoE** mit zwei Objektiven (Kanal 0 = linkes Bild: ganze Hoffläche unter dem Carport, Haustür, Straße links; Kanal 1 = nur Garten mit Terrasse). Hof-Angaben meinen immer das linke Bild.
- Bildbereich nur eigenes Grundstück. **Nur live, keine Aufnahme durch Loki** – ausnahmslos (die befristete Foto-Ausnahme für die Auto-Erkennung ist seit 10.11.2026 beendet, Fotos gelöscht).
- **Netz:** Kamera im FRITZ!Box-Netz, PC hinter einem zweiten Router. Mit NordVPN erreichbar über eine feste Windows-Route, die der Auftraggeber gesetzt hat. **Keine weiteren VPN-Ausnahmen vorschlagen.** Adressen stehen nur im lokalen Memory, nie in Git.

## Technik

- `electron/kamera.cjs`: Anmeldung per `POST …/api.cgi?cmd=Login` (Token, Passwort nur im Inhalt), nur private IPv4-Adressen, selbst ausgestelltes Zertifikat: Fingerabdruck beim Einrichten gemerkt und vor jedem Senden geprüft. Zugang verschlüsselt in `%APPDATA%\Jarvis\kamera.bin`; die Oberfläche sieht Benutzer/Passwort nie. Einrichten in den Einstellungen → „Kamera“ mit einem eigenen Reolink-Konto, das nur ansehen darf.
- **Live-Bild** (0.7.4–0.7.6): Wallpaper Engine kann kein H.264 → ein unsichtbares Electron-Fenster (`kamera-live.html`, `kameralive/seite.js`, mpegts.js 1.8.2) spielt beide Hauptströme (FLV, 25 B/s) und reicht JPEG-Bilder (≤ 960 px) an die Gegenstelle (`/bild/0|1?nach=<nr>`). Je Objektiv genau ein Strom; Pause nach Fehlschlag 5 s verdoppelnd bis 60 s; läuft nur, solange das Wallpaper abfragt (15 s ohne Abruf → zu). Dekodieren auf dem Video-Baustein der Grafikkarte (ca. 11–16 %).
- **Kamera-Protokoll** `%APPDATA%\Jarvis\kamera.log` (ohne Zugangsdaten) – bei Rückmeldungen zuerst dort nachsehen.

## Kamera-Wache (0.10.0, Autos 0.24.0)

- `electron/kamerawache.cjs` fragt alle 2 s `GetAiState` (nicht offiziell dokumentiert; ein Forenbericht nennt Überlastung einer Kamera bei zu häufigem Abfragen – bei Fehlern Pause 10 s, verdoppelnd bis 5 min) am **linken Objektiv**: Personen und Fahrzeuge aus der Erkennung der Kamera selbst. Meldung beim Auftauchen, erneut erst nach 2 min Ruhe je Art. Erkennungen in der Ruhezeit kommen ins Protokoll, stündlich „Kamera-Wache läuft“.
- Ansage „Sir, eine Person nähert sich dem Grundstück.“ bzw. „Sir, ein Auto fährt auf das Grundstück.“ + Seitenhieb, nur wenn er am PC ist (sonst gesammelt). Schalter „Kamera: Person oder Auto … ansagen“ (`kameraMelden`).
- Im Dauer-HUD wächst das Bild 30 s groß über den rechten Bildschirm mit „PERSON ERKANNT“ / „AUTO ERKANNT“; „Loki, zeig den Carport“ 60 s, „Kamera weg“ zurück.
- Die Kamera zeichnet nicht auf (keine eigene Ereignisliste abrufbar). Stehende Autos meldet sie nicht.
- **Fahrzeug-Bereich** an der Kamera (SetAiAlarm vehicle, Kanal 0, `modelle/kamera/fahrzeug-bereich.cjs`, nicht in Git): 07.11. Postauto stand halb im ausgeblendeten Straßenbereich → Bereich verkleinert, Empfindlichkeit 60 → 75; 09.11. zu viele Fehlalarme durch vorbeifahrende Autos → ausgeblendete Fläche 3 Zeilen nach unten (417 von 3600 Feldern, knapp vor der Pflasterkante). Sicherungen der alten Einstellung im Ausgabeordner des Skripts; ändert der Auftraggeber den Bereich in der Reolink-App, gilt seine Einstellung.

## Entfernt

- Eigene Auto-Erkennung mit Namen und Fotos (0.24.3–0.25.0, entfernt 0.32.0 am 10.11.2026): Fotos und `namen.json` gelöscht. Recherche dazu: `recherche/auto-erkennung-2026-11-07.md` (Stand vor der Entscheidung).
- Videosicherung zurückgestellt (06.11.2026, „ganz nach hinten“) – nicht von selbst vorschlagen. Prüfergebnis falls nötig: [Ideen](ideen.md).
