# Code-Vorschläge

Stand: 2026-11-14

Verbesserungen aus der Code-Durchsicht beim Umbau (14.11.2026). **Nur nach Freigabe umsetzen.** Erledigt: 1–4 (14.11.2026, Version 0.33.1). Verwandt: [Projekt](projekt.md), [Technik](technik.md).

| Nr. | Vorschlag | Fundstelle | Problem → Vorschlag | Aufwand | Nutzen |
|---|---|---|---|---|---|
| 1 | ~~Sequenz-Reste im Hauptprogramm entfernen~~ (erledigt 14.11.) | electron/main.cjs (Sequenzfenster, IPC `sequenz-*`), preload.cjs, preload-sequenz.cjs | Seit 06.11. nicht mehr im Programm, aber ~70 Zeilen und 6 offene IPC-Kanäle → löschen | mittel | groß |
| 2 | ~~Sequenz-Reste in der Oberfläche~~ (erledigt 14.11.) | src/jarvis/desktop.ts (`SequenzBruecke`, Einstellungen `startSequenz`, `sequenzLautstaerke`), WerkstattVerbindung.tsx (Text), App.tsx | tote Einstellungen/Texte → entfernen; `sequenzGruss` in begruessung.ts umbenennen (wird beim Rechnerstart noch benutzt) | klein | mittel |
| 3 | ~~Verwaiste Sequenz-Dateien~~ (erledigt 14.11.) | start-sequenz.html, startsequenz/, hud5/intro*.js, intro.html, intro-drei.cjs, hud5/rauch/ | ungenutzt; aber `dauerhud/seite.js` nutzt `startsequenz/lageDaten.js` → diese Datei samt Test nach `dauerhud/` verschieben, Rest löschen | klein | mittel |
| 4 | ~~Entwürfe aus hud5 auslagern~~ (erledigt 14.11.) | hud5/*-entwuerfe*, *-varianten*, *-struktur*, whatsapp-probe/-preload.cjs, scheibe.js, tropfen-bilder.cjs, ring-vorschlaege.cjs | Entschiedenes/Verworfenes liegt zwischen Produktivcode → nach `hud5/entwuerfe/` oder löschen, Prüfhilfe `?tropfen=` entfernen | klein | mittel |
| 5 | `kamera.standbild` ungenutzt | electron/kamera.cjs | seit 0.32.0 ohne Aufrufer → samt Test entfernen | klein | klein |
| 6 | main.cjs aufteilen | electron/main.cjs (~590 Zeilen, 36 IPC-Handler) | Sammelbecken, schwer zu testen → nach Nr. 1 IPC-Gruppen in Module (`ipc-kamera.cjs`, `hud-daten.cjs` …) | groß | groß |
| 7 | Doppeltes Prozess-Beenden | electron/jarvis.cjs (zwei `toeten`-Funktionen) | Doppelung → eine gemeinsame Funktion | klein | klein |
| 8 | CORS der Gegenstelle | electron/hudserver.cjs (`Access-Control-Allow-Origin: *`) | breiter als nötig (Schlüssel schützt) → festen Ursprung des Wallpapers messen und eintragen oder begründen | klein | klein |
| 9 | Schlüsseldatei beim Start | electron/hudserver.cjs (`hudSchluessel`) | blockiert bis 2 s und überschreibt bei anderen Lesefehlern → nicht überschreiben, protokollieren, Datei nur für den Besitzer lesbar | klein | mittel |
| 10 | Leere `catch {}` | dienst.ts (10), jarvis.cjs (6), main.cjs (3) | Fehler verschwinden still → kurzen Eintrag ins vorhandene Protokoll, wo sinnvoll | klein | mittel |
| 11 | dienst.ts teilen | src/jarvis/dienst.ts (~690 Zeilen) | Ablauf, Zustand, Texte gemischt → `gespraech.ts`, `neuAnsagen.ts`, `rechnerStart.ts` | groß | mittel |
| 12 | szene.js teilen, Kopfkommentar berichtigen | hud5/szene.js (~1280 Zeilen), Kommentar Z. 5 nennt abgelehnten Rauch/Nebel | → Kommentar berichtigen, Reaktor und Wasser/Aurora in eigene Module | mittel | mittel |
| 13 | Open-Meteo-Reste | src/jarvis/wetter.ts, daten.ts, Kommentare | entfernt seit 0.24.1 → mit Suche nach „meteo“ Reste aufräumen | klein | mittel |
| 14 | Sprüche als Textdateien | nachschub.ts, fundus.ts, neuSpitzen.ts | hunderte Sprüche als Code → Text/JSON, beim Bauen einlesen | mittel | klein |
| 16 | Kommentar Abfragetakt berichtigen | electron/main.cjs (bei `takt`/`aktiv`) | Kommentar sagt „letzte halbe Stunde“, Code prüft Ruhezeit unter 10 min → Kommentar anpassen | klein | klein |
| 15 | reg.exe asynchron | electron/main.cjs (`execFileSync` beim Wallpaper-Einrichten) | blockiert kurz den Hauptprozess → `execFile` mit Promise | klein | klein |

Sicherheit insgesamt laut Durchsicht in Ordnung: IPC nur aus dem Hauptfenster (`vonFenster`), Rechte nur Mikrofon, Gegenstelle nur lokal mit Schlüssel.
