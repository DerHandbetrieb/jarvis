# Dauer-HUD (Wallpaper)

Stand: 2026-11-14

Verwandt: [Kameras](kameras.md), [Wetter](wetter.md), [Wallpaper einspielen](skills/wallpaper-einspielen.md), Recherche `recherche/wallpaper-engine-2026-11-03.md`, `recherche/grafik-v5-bestand-2026-11-05.md`, `recherche/hud-ideen-2026-11-05.md`.

## Grundlagen

- **Web-Wallpaper in Wallpaper Engine** über alle drei Bildschirme als eine Fläche 5760×1080; auf einem einzelnen Bildschirm nur die Mitte. Wallpaper Engine (Chromium/CEF) pausiert bei Spielen und maximierten Fenstern; Klicks kommen nur bei freiem Desktop an.
- Wallpaper Engine beim Auftraggeber: Steam-Bibliothek `D:\GAMES\STEAM\Launcher`, `wallpaper32.exe`, Projekt `<WE>\projects\myprojects\loki-dauer-hud`. Vor jedem Eingriff in die `config.json` sichern. **Nie im Workshop veröffentlichen** (Sonniss-Lizenz, Werkstatt-Daten, privates Grafikpaket).
- **Gegenstelle** `electron/hudserver.cjs`: nur 127.0.0.1:47820, Zugriffsschlüssel im Kopf `x-loki-schluessel` (256 Bit, zeitkonstanter Vergleich, Schlüssel in `%APPDATA%\Jarvis\hud-schluessel`), Host-Kopf nur 127.0.0.1/localhost. Wege: GET /hud, /kamera, /bild/0|1, /ton; POST /stumm, /medien/pause|vor|zurueck, /lautstaerke/<0..100>. Liefert nur eine Auswahl der Werkstatt-Lage (`hudAuswahl` in main.cjs, ohne Kundendaten).
- Bau: `vite.hud.config.ts` → `dist-hud/`; im Installer als `resources/dauer-hud`; Einrichten per Knopf in den Einstellungen (`electron/wallpaper.cjs`) oder `grafik/we-einrichten.cjs`.
- Wallpaper macht **nie Ton**. Alles Sichtbare unten bleibt über der Taskleiste (48 px, `UNTEN` = H − 48).

## Szene „Mystic Aurora“ (Grafikpaket V5 des Auftraggebers, 05.11.2026)

- `hud5/szene.js`: Grundbild (Magnific Kreativ 4x), Aurora wogt, Wasser kräuselt sich und spiegelt den Reaktor, Rauchballen nur unter dem Reaktor, Bergnebel, Sternschnuppen, Runen links/rechts auf gemessener Bahn, Ring um den Reaktor (Uhrzeit mit Sekunden, Datum, Wetter in Gold, Füll-Runen türkis), Reaktor mit drehender Kernscheibe, Lauflicht und **Tesla-Entladung** (Fassung B, `reaktorbahn.js`, `plasma.js`, alle 14–28 s), L.O.K.I.-Schriftzug eingraviert. Ebenen in `hud5/ebenen/` (Rohdaten `grafik/`, nicht in Git). Klick auf den Reaktor = stumm/wieder an.
- **Gestaltung:** modernes Kino-Sci-Fi mit Wikinger-Einschlag, kein „80er-Jahre-Look“; kein Filmkorn, alles knackig scharf, Tiefenschärfe erlaubt; feine Linien, viele kleine Beschriftungen, Ebenen. Keine Marvel-/Stark-Motive (Vorbilder nur als Stil).
- **Runen-Regel:** Selbst gesetzte Runen ohne ᛋ, ᛟ, ᛉ, ᛦ, Wolfsangel, Schwarze Sonne (`hud5/runen.js`) – Grund: Sig-Rune ist laut BayObLG Kennzeichen nach § 86a StGB, andere sind kontextabhängig strafbar oder NS-belegt; bei Zweifel weglassen.
- Töne (falls je wieder gebraucht): Sonniss GDC-Bundles (frei, auch gewerblich; kein Weiterverkauf als Geräuschsammlung, kein KI-Training), Kenney Sci-Fi Sounds (CC0); Ordner `Sounds/`, nicht in Git. Die Runen im Grafikpaket V5 bleiben unverändert (Entscheidung 05.11.2026, privat) – nicht wieder ansprechen.
- Abgelehnt: Nebel über dem ganzen See, Rauch hinter dem Reaktor, Blitze außerhalb des Reaktors, pulsierende Wellenringe, Regentropfen auf der Scheibe.
- **Frost** (`hud5/frost.js`): nur am äußeren Rand der Gesamtfläche, wie eine vereiste Seefläche mit Eisblumen (Echtbilder `frost-*.webp`), dahinter milchig-unscharf. Wächst mit der Kälte (`frostStufe` = (−Grad/8)^1,6), bei wenig Minus Flecken, jede Ecke anders, oben in der Mitte bleibt die Uhrzeit frei. **See-Eis** (`hud5/seeeis.js`) nach Frosttagen, siehe [Wetter](wetter.md). Regen und Schnee hinter Reaktor und Fenstern (`hud5/wetter.js`).

## Fenster (Tafeln, `hud5/tafeln.js`, `hud5/inhalte.js`)

- Schräg gestellte Tafeln mit echter Perspektive, Spiegelung im Wasser (Viertel-Auflösung, unscharf). Ohne Daten „BEISPIEL“, veraltete Daten „KEINE AKTUELLEN DATEN“.
- **Links nur Arbeit** (Umbau 0.29.0): Statistik-Säule (Warenwert heute – alle heutigen Bestellungen, auch versendete; Verlauf mit Vorwoche; Kanäle), Abarbeiten (ohne Nachproduzieren-Karten, bei vielen Karten zwei Spalten), Nachproduzieren (Lager knapp mit Füllbalken), **Offene Bestellungen** (nur nicht Versendetes). Werte sind Warenwert ohne Versand. Keine „besten Artikel“, vorerst keine Termine.
- **Rechts Privates:** CAM 01/02 live ([Kameras](kameras.md)), Audiofeld mit Statuszeile in der Kopfzeile (STATUS, MIKROFON, WERKSTATT, KAMERA, SELBSTTEST, WHATSAPP – Zustand nur über die Farbe), PV-Anlage und Wetter.
- **Audiofeld:** PC-Ton als Balken (Bässe dunkelrot, Mitten türkis, Höhen weiß; Loki spricht = gold); laufendes Lied als **Schallplatte** mit Cover (Medien-Schnittstelle von Wallpaper Engine, Medien-Integration muss in WE eingeschaltet sein); **Medien-Knöpfe** zurück/Pause/vor (L.O.K.I. drückt die Windows-Medientaste, `medientasten.cjs`); **Lautstärke-Regler** Entwurf D „Keil mit Plus und Minus“ (`lautstaerke.cjs`, IAudioEndpointVolume; ein Klick hebt höchstens 25 Punkte, Plus/Minus 5; nur linke Maustaste). Echter Klick in WE war bis 14.11. noch nicht bestätigt.
- **WhatsApp:** Zahl ungelesener Nachrichten aus dem Windows-Badge-Eintrag in `wpndatabase.db` (`whatsapphinweis.cjs`, nur lesend, nie Texte). Die WhatsApp-App am PC muss laufen; Datenbank-Aufbau nicht offiziell dokumentiert.
- **PV-Anlage** FENECON: Momentwerte über REST, Tagesverlauf über den WebSocket der Anlage (`pvverlauf.cjs`, `queryHistoricTimeseriesData`, nicht öffentlich dokumentiert). Feld Entwurf 7 „Drei Spalten“, unten Kurve 0–24 Uhr (Entwurf D).

## Leistung (gemessen 10.11.2026)

- Die Einstellung „25 B/s“ in Wallpaper Engine bremst Web-Wallpaper nicht. `dauerhud/seite.js` begrenzt selbst auf 25 B/s (`BILDRATE`, fester Takt). Keine einzelne Ebene ist teuer; die Last hängt an der Bildrate. Wallpaper Engine kopiert je angezeigtem Bild die ganze Fläche: gemessen 25 B/s ≈ 12–19 %, 10 ≈ 14 %, 1 ≈ 3 %, pausiert 0 % (vorher 22–23 %).
- Messhilfen: Vorschau-Server „hud5“ mit `vorschau.html` (`?aus=aurora,wasser,…,ring,runen`, `?fps=`, `?wetter=`, `?station=`, `?eis=`, `?lied=`, `?plasma=`, `?rechts=`), `hud5/messen.cjs`, `hud5/drei-bildschirme.cjs` (Esc schließt; nach Tests sofort schließen).
- Nach jedem Einspielen das Wallpaper unsichtbar laden und auf JS-Fehler prüfen ([Wallpaper einspielen](skills/wallpaper-einspielen.md)).
