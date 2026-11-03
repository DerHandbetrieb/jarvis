# Vorbilder Start-Sequenz – Auswertung der Handy-Videos (03.11.2026)

Der Auftraggeber hat zwei YouTube-Start-Sequenzen mit dem Handy vom Bildschirm gefilmt (`videos/`, nicht in Git). Ausgewertet
mit ffmpeg (ein Standbild je Sekunde, Klangbild/Spektrogramm, Lautstärkekurve) und Whisper small (Deutsch und Englisch).
**Nur Inspiration** – keine Töne, Bilder, Texte oder Stimmen daraus übernehmen (Urheber- und Persönlichkeitsrecht, siehe
CLAUDE.md Abschnitt 2); eigene Effekte mit geprüfter Lizenz.

## Video 1 (37 s) – „Jarvis Start Up“, Vollbild über alle drei Bildschirme

| Zeit | Bild | Ton |
|---|---|---|
| 0–5 s | YouTube-Seite, Vollbild wird gestartet | fast still |
| 5–6 s | Glitch-Übergang, dann leuchtender Kern in der Mitte, Datenströme links/rechts | kurze helle Pieptöne (ca. 0,6–1,5 kHz) = „Hochfahren“ |
| 6–16 s | schneller Wechsel: „Retina Scan“, Tunnel/Wirbel, Kreis-Anzeigen, Gitter, Leiterbahnen, Ladebalken über alle drei Bildschirme bis „100 % – Cleaning up“ | **tiefer, wuchtiger Bass-Teppich** (20–150 Hz) mit Pulsen, darüber Rauschen/Datengeräusche |
| 17–20 s | fast schwarz, nur ein Punkt; dann ein kleines Ziel-Quadrat, ein Kreis | **Stille / Atempause** (Bass blendet aus) |
| ~20 s | volle HUD-Oberfläche „klappt auf“: großer Kreis-Reaktor in der Mitte, seitlich Balkendiagramme, Daten, orange Akzente | **harter Einschlag** + helle Signaltöne (ca. 1,3 / 2,3 / 4 kHz) |
| 20–37 s | HUD lebt, Anzeigen drehen sich | rhythmische Musik mit gleichmäßigen Schlägen (etwa alle 1,5 s ein starker Akzent); leise englische Begrüßung („Welcome home, sir …“, Rest unsicher) |

## Video 2 (33 s) – „Jarvis startup welcome sound“, ein Bildschirm

| Zeit | Bild | Ton |
|---|---|---|
| 0–3 s | dunkles Gitter | still |
| 4–6 s | grauer Ladebalken mit rotem Sechseck füllt sich weiß | Einschläge im Bass bei jedem Schritt, mechanische/surrende Geräusche |
| 7–12 s | Kreis-Visier baut sich auf, Sechseck/Warnsymbol, wechselt auf **Rot** | hohes Aufladen (ca. 5,8 kHz) 8–10 s, weitere Bass-Schläge |
| 12–22 s | rotes Symbol pulsiert, Hebel/Greifer fahren aus | Musik setzt ein (Synthesizer, 1–2 kHz); englische Ansage: „Welcome back … All systems for gaming will be prepared in a few minutes. But now, feel free to grab a cup of coffee and have a good day.“ |
| 23–25 s | „INITIATING SYSTEM 1 … CHECKSUM: OK“, Ladebalken, „SYSTEM 1 LOADED“ (blau) | Musik, Datengeräusche |
| 26–31 s | blauer Ringaufbau, Schriftzug „J.A.R.V.I.S“ im Zentrum, Ringe drehen | **schwere Schläge im Takt** (ca. alle 1,6 s), mit dem Puls der Ringe |

## Was daraus für Lokis Start wichtig ist (Vorschlag, noch nicht entschieden)

- **Dramaturgie in drei Akten:** (1) Hochfahren mit Pieptönen + anschwellendem Bass, schnelle Diagnose-Bilder; (2) kurze Stille
  im Dunkeln; (3) „Enthüllung“ mit Einschlag, danach ruhig lebende Oberfläche mit Takt – und erst dann die Begrüßung.
- **Bild und Ton sind eng gekoppelt:** jeder neue Bildschritt hat einen eigenen Ton (Schlag, Piep, Rauschen).
- **Drei Bildschirme** als eine Fläche (Video 1) – braucht randlose Vollbild-Fenster je Bildschirm.
- **Farbwechsel als Spannung:** Rot (Prüfung/Warnung) → Blau (bereit) in Video 2.
- **Begrüßung mit Inhalt**, nicht nur „Hallo“ (Video 2 nennt, was vorbereitet wird) – passt zu Lokis Morgen-Lage.
- Länge der Vorbilder: 30–35 s – für jeden Rechnerstart evtl. zu lang → kurze Fassung (ca. 8–10 s) für den Alltag erwägen.
