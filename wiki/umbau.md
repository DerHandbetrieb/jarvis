# Umbau auf das Wissenssystem

Stand: 2026-11-14

Bericht zum einmaligen Umbau nach `~/.claude/wissenssystem-umbau.md` (Auftrag Auftraggeber 14.11.2026, Vorbild Werkstatt-App vom 13.11.2026). Verwandt: [Index](index.md), [Protokoll](log.md), [Code-Vorschläge](code-vorschlaege.md).

## 1. Sicherung

- Git-Tag `vor-wissenssystem` auf Commit 39aa682 (Version 0.33.0), hochgeladen. Zurück: `git checkout vor-wissenssystem`.
- Gearbeitet direkt auf `main` (Werkstatt: eigener Zweig); der Tag sichert den Stand.
- Kopie der alten `CLAUDE.md`: [archiv/CLAUDE-vor-umbau.md](archiv/CLAUDE-vor-umbau.md) (geprüft: identisch). Sie enthielt oben den Hinweis „Zuerst … Umbau durchführen … Hinweis danach entfernen“ – in der neuen Fassung entfernt.
- Während des Umbaus kein Dienst aufgerufen (Supabase, Kamera, Wetter, PV), kein Code geändert, nichts gelöscht.

## 2. Bestandsliste (Wissensdateien)

| Pfad | Inhalt | Zustand | Git | von Code benutzt |
|---|---|---|---|---|
| `CLAUDE.md` (alt, 225 Zeilen) | Regeln + gesamter Verlauf | teils veraltet (Niesen, Auto-Benennen, Start-Sequenz, Open-Meteo, Werkstatt-Lärm) | ja | nur Kommentarverweise |
| `UEBERGABE.md` | Übergabe der ersten Sitzung 03.11. | veraltet | ja | nein |
| `recherche/UEBERSICHT-2026-11-03.md` | Reihenfolge der Themen vom 03.11. | veraltet (alles gebaut) | ja | nein |
| `recherche/werkstatt-anbindung-2026-11-03.md` | Plan und Recherche Werkstatt-Anbindung | als Plan veraltet, Begründungen gelten | ja | nein |
| `recherche/wallpaper-engine-2026-11-03.md` | Recherche Dauer-HUD, Tests | umgesetzt | ja | nein |
| `recherche/kameras-2026-11-03.md` | Recherche Kameras, Datenschutz, Netz | als Plan veraltet, Datenschutz gilt | ja | nein |
| `recherche/start-sequenz-videos-2026-11-03.md` | Auswertung Vorbild-Videos | veraltet (Sequenz entfernt) | ja | nein |
| `recherche/stimmen-2026-11-03.md` | Begründung der Stimmwahl | aktuell | ja | nein |
| `recherche/auto-erkennung-2026-11-07.md` | Plan Auto-Erkennung | veraltet (entfernt 10.11.) | ja | nein |
| `recherche/hud-ideen-2026-11-05.md` | HUD-Ideen, PV-Zugang | großteils umgesetzt; nennt das dokumentierte Standardpasswort der PV-Anlage (öffentliche Herstellerangabe, kein Geheimnis) | ja | nein |
| `recherche/grafik-v5-bestand-2026-11-05.md` | Bestand Grafikpaket V5 | aktuell | ja | Kommentarverweise in hud5 |
| `stimme/LIESMICH.md`, `stimme/anforderungen.txt`, `gehoer/anforderungen.txt` | Stimme/Gehör, Paketfassungen | aktuell | ja | ja (Installer, Einrichtung) |
| `scripts/*` (Kopfkommentare) | Aufbereitung Grafik, Frost, Prüfungen, Werkstatt-Zugang | aktuell; `reaktor-teile.cjs`, `reaktor-umriss.cjs` gehören zum entfernten Intro | ja | `syntax-pruefen.cjs` im Build |
| `grafik/…` (Anleitungen, Paket-Beilagen) | Magnific-Anleitung, Beilagen des V5-Pakets | erledigt bzw. nur Quelle | nein (ignoriert) | nein |
| `Sounds/kenney-sci-fi/License.txt` | CC0-Lizenz | aktuell | nein (ignoriert) | nein |
| Memory (16 Dateien) | Regeln und Korrekturen | aktuell; `regen-sichtweise.md` betrifft das verworfene Regentropfen-Thema | nein | nein |

## 3. Befunde

- `CLAUDE.md` war mit 225 Zeilen weit über 150 und enthielt vor allem Verlauf; jetzt 61 Zeilen.
- Doppelt: viele Vorgaben standen in `CLAUDE.md` und im Memory (Wetter nur Station, Taskleiste, Wallpaper ohne Ton …). Bleiben beide – Memory als Regelquelle, `CLAUDE.md` Abschnitt 3 als Kurzliste.
- Doku gegen Code: Abschnitte zu Start-Sequenz, Open-Meteo, Niesen und Auto-Erkennung beschrieben Entferntes als aktiv; im Wiki nur noch als „entfernt/verworfen“.
- Keine Passwörter oder Schlüssel im Wiki. Netzwerkadressen stehen nur im Memory `kamera-netz.md` (nicht in Git).

## 4. Abgleich: Wo steht das Wissen jetzt?

| Altbestand | Wissen jetzt | Datei liegt jetzt |
|---|---|---|
| `CLAUDE.md` Abschnitt 0 (Arbeitsregeln) | wörtlich in `CLAUDE.md` | `CLAUDE.md` |
| `CLAUDE.md` 1, 4, 7, 9 (Ziel, Aufbau, Name, Ordner) | [projekt.md](projekt.md) | Original im Archiv |
| `CLAUDE.md` 2 (Persönlichkeit, Stimme) | [charakter-und-stimme.md](charakter-und-stimme.md), Kurzfassung in `CLAUDE.md` 2 | Archiv |
| `CLAUDE.md` 3 (Technik) | [technik.md](technik.md) | Archiv |
| `CLAUDE.md` 5 Etappen 9, 12 (Gespräch, Autostart) | [gespraech-und-befehle.md](gespraech-und-befehle.md), [technik.md](technik.md) | Archiv |
| `CLAUDE.md` 5 Etappe 13 + Intro-Absätze (Start-Sequenz) | [entscheidungen.md](entscheidungen.md) (verworfen), Verlauf nur im Archiv | Archiv |
| `CLAUDE.md` 5 Etappe 14/14b (Dauer-HUD, Kameras) und spätere Absätze | [dauer-hud.md](dauer-hud.md), [kameras.md](kameras.md) | Archiv |
| `CLAUDE.md` 6 (Werkstatt-Anbindung, Neuigkeiten, Sprüche) | [werkstatt-anbindung.md](werkstatt-anbindung.md), [charakter-und-stimme.md](charakter-und-stimme.md) | Archiv |
| Absätze Morgen-Lage (0.20.2, 0.28.0, 0.29.2) | [morgenlage.md](morgenlage.md) | Archiv |
| Absätze Wetter, Station, See-Eis | [wetter.md](wetter.md) | Archiv |
| `CLAUDE.md` 8 (Ideen für später) | [ideen.md](ideen.md) | Archiv |
| Datierte Entscheidungen im ganzen Text | [entscheidungen.md](entscheidungen.md) | Archiv |
| Wiederkehrende Abläufe (Installieren, Wallpaper, Sprüche, AppData) aus Text und Memory | [skills/](skills/) | Memory bleibt |
| `UEBERGABE.md` | überholt, Inhalt in Projekt/Entscheidungen enthalten | `raw_notes/verarbeitet/2026-11-03-uebergabe.md` |
| `recherche/*.md` | Kernaussagen im jeweiligen Thema, Verweise im Index | bleiben in `recherche/` (Code-Kommentare verweisen) |
| `stimme/LIESMICH.md`, `*/anforderungen.txt`, `scripts/*` | Verweise in [technik.md](technik.md), [projekt.md](projekt.md) | bleiben (Code/Build nutzt sie) |
| `grafik/`, `Sounds/` (nicht in Git) | Verweise in [dauer-hud.md](dauer-hud.md) | bleiben |
| Memory-Dateien | bleiben Regelquelle; `sprueche-nachfuellen.md` verweist jetzt auf das Wiki | Memory |

## 5. Offene Punkte

- Memory `regen-sichtweise.md` betrifft ein verworfenes Thema – behalten (gilt, falls es je wieder aufkommt) oder löschen: Entscheidung des Auftraggebers.
- Alte Wissensdateien in `recherche/` sind teils überholt; gültig ist das Wiki. Kein Umzug, weil Code-Kommentare auf sie verweisen.
