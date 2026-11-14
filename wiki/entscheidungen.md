# Entscheidungen

Stand: 2026-11-14

Wichtige Entscheidungen des Auftraggebers mit Datum und Grund, neueste oben. Verlauf im Detail: [Archiv der alten CLAUDE.md](archiv/CLAUDE-vor-umbau.md). Verwandt: [Ideen](ideen.md), [Index](index.md).

## Gültig

- **14.11.2026** Wallpaper 30 B/s statt 25 (gleichmäßig bei 60 Hz, Runen ruckelten); Lichtpunkt bei „Verkäufe 14 Tage“ entfernt.
- **14.11.2026** Dauer-HUD links (0.34.0): Bestellfrist im Bestellfeld nach Entwurf A „Drei Abschnitte“, PC-Status-Balken unten nach Entwurf 3 „Verlaufslinien“, Felder darüber gestaucht; Bewegungen links nur noch dezent (Wunsch Auftraggeber).
- **14.11.2026** Code-Vorschläge 1–4 freigegeben und umgesetzt (0.33.1): Reste der Start-Sequenz (Fenster, IPC, Einstellungen) und alte Entwurfsdateien entfernt.
- **14.11.2026** Projekt auf das Wissenssystem (Wiki, Dreaming) umgestellt – wie in der Werkstatt-App.
- **14.11.2026** Nieserkennung ganz entfernt (0.33.0): löste auch mit Schwelle 0,5 ohne Anlass aus. Nicht wieder vorschlagen.
- **11.11.2026** Regentropfen auf der Scheibe verworfen („wir lassen es einfach weg“), nachdem auch eine realistischere Fassung (Tropfen außen, Blick von innen) nicht überzeugte. Nicht wieder vorschlagen.
- **10.11.2026** Abfragetakt `jarvis-lage` 10 min am PC, 50 min abwesend (Supabase-Kontingent knapp).
- **10.11.2026** Wallpaper selbst auf 25 B/s begrenzt (GPU-Last; WE-Einstellung bremst Web-Wallpaper nicht). Nicht weiter senken („so lassen“).
- **10.11.2026** Eigene Auto-Erkennung mit Namen/Fotos entfernt; Live-Video bleibt, Ansagen aus der Kamera-Erkennung bleiben.
- **10.11.2026** Deutschlandfunk-Nachrichten: Loki liest die Textmeldungen selbst vor (nicht die Audiosendung), einmal am Tag nach der Lage + auf Zuruf, Spruch davor.
- **09.11.2026** Lautstärke-Regler Entwurf D „Keil mit Plus und Minus“.
- **09.11.2026** Morgen-Lage: Altes nur als ein Satz mit der Zahl („noch vier Artikel zum Nachproduzieren“).
- **09.11.2026** Fahrzeug-Bereich der Kamera nach unten erweitert (Fehlalarme durch vorbeifahrende Autos).
- **08.11.2026** Dauer-HUD: links nur Arbeit, rechts Privates; keine „besten Artikel“, vorerst keine Termine. Feld „Offene Bestellungen“. Werte = Warenwert ohne Versand.
- **08.11.2026** Morgen-Lage nur mit Neuem („sonst betet er immer das Gleiche runter“).
- **07.11.2026** Laufendes Lied als Schallplatte (Entwurf D), Medien-Knöpfe im Audiofeld.
- **06.11.2026** Wetter ausnahmslos von der eigenen Station; Open-Meteo vollständig entfernt.
- **06.11.2026** Start-Intro wieder raus („das ist nix“); Loki spricht nur mit seiner richtigen Stimme, nie zwei Stimmen gleichzeitig.
- **06.11.2026** Reaktor-Entladung Fassung B (Tesla-Spule). Frost wie vereiste Seefläche, nur am äußeren Rand, wächst mit der Kälte.
- **06.11.2026** WhatsApp Web im HUD verworfen; stattdessen Zahl ungelesener Nachrichten in der Statuszeile.
- **06.11.2026** Videosicherung zurückgestellt („ganz nach hinten“), es bleibt „nur live“.
- **06.11.2026** Flachwitz entfernt. Morgen-Lage in Kapiteln mit Pausen; lange Nummern nie vorlesen.
- **05.11.2026** Neues Dauer-HUD „Mystic Aurora“ aus dem Grafikpaket V5 des Auftraggebers; dessen Runen bleiben unverändert (privat). PV-Feld Entwurf 7, Umsatz heute statt gestern.
- **05.11.2026** Wetterstation Ecowitt (gemeinsam mit dem Nachbarn) angebunden.
- **04.11.2026** Neuigkeiten von selbst ansagen, nur wenn er am PC ist; eigene Karten nicht.
- **04.11.2026** Gehör auf der Grafikkarte (faster-whisper large-v3-turbo) statt Whisper small.
- **04.11.2026** Schreibweise L.O.K.I. = „Lokale, Ohnehin Klügere Intelligenz“; Witze über Aussehen und Alter des Auftraggebers freigegeben.
- **04.11.2026** Kamera-Wache mit Ansage (zuerst Personen, ab 06.11. auch Autos), nur linkes Objektiv.
- **04.11.2026** Claude darf Werkstatt-Dienste über `scripts/dienst-veroeffentlichen.mjs` selbst veröffentlichen.
- **03.11.2026** Werkstatt-Anbindung: lesende Serverfunktion `jarvis-lage`, eigenes Loki-Konto mit Zwei-Faktor, Umsatz darf laut gesagt werden, Schreiben erst später mit Bestätigung.
- **03.11.2026** Dauer-HUD als Web-Wallpaper in Wallpaper Engine; Kamera nur live, Live-Bild statt Standbild.
- **03.11.2026** Installer mit Autostart, unsichtbar im Infobereich.
- **03.11.2026** Stimme R2: Qwen3-TTS 0.6B-Base mit fester Vorlage, beschleunigt mit faster-qwen3-tts; Piper nur Ersatz.
- **03.11.2026** Charakter „noch bissiger“, Maßstab der beiden schwarzen Sprüche; Rufname Loki.
- **03.11.2026** Eigenes Projekt Jarvis (Umzug aus der Werkstatt-App).

## Verworfen (nicht wieder vorschlagen)

Start-Sequenz/Intro (alle Fassungen), Regentropfen, Nieserkennung, eigene Auto-Erkennung, WhatsApp-Web-Fenster, Flachwitz, britische Piper-Stimmen, Open-Meteo, Nebel über dem See, Rauch hinter dem Reaktor, Blitze außerhalb des Reaktors, pulsierende Wellenringe, selbstgerechneter Rauch, weitere VPN-Ausnahmen.
