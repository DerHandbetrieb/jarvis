# Gespräch, Befehle und Nachrichten

Stand: 2026-11-14

Verwandt: [Morgen-Lage](morgenlage.md), [Werkstatt-Anbindung](werkstatt-anbindung.md), [Wetter](wetter.md), [Technik](technik.md).

## Codewörter

- „Guten Morgen, Loki“ = Morgen-Lage (zweites Mal am Tag: kurzer Hinweis „Loki, Lage“).
- „Hey Loki, …“, „Loki, …“ am Anfang oder „…, Loki?“ am Ende = Befehl oder Frage; mitten im Satz nicht.
- Sichtbare Mikrofon-Anzeige, Stumm-Schalter, Mikrofon-Empfindlichkeit (Ruhig/Normal/Laut/Sehr laut → VAD-Schwelle 0,35–0,85). Klick auf den Reaktor im HUD = stumm/wieder an.

## Freies Gespräch (0.7.0, nachgebessert 0.7.3, 0.8.1)

- Loki merkt sich die letzten 4 Wechsel (verfällt nach 5 min Pause) und hört nach seiner Antwort 10 s ohne Codewort weiter zu; höchstens 12 Nachfragen ohne Codewort, dann sagt er es an.
- Nur Sätze ab 2 Wörtern, Whisper-Floskeln werden verworfen (`istNachfrage`).
- Sätze während des Nachdenkens werden nachgereicht (≤ 30 s, nicht nach Stumm/Aus); „Loki, stopp/sei still“ wirkt sofort.
- Gegen Wiederholungen: keine Beispielsprüche in `charakter()`, `istWiederholung` (Dreiwort-Folgen > 1/3 gleich) → neu fragen ohne alte Antworten; je Antwort 3 Anregungen aus dem Fundus.
- **Das Sprachmodell bekommt keine Daten** (keine Werkstatt-Zahlen, kein Wetter). Werkstatt-Fragen beantworten feste Sätze aus `werkstattAntwort.ts` (inkl. Kanal-Fragen wie „Umsatz gestern auf Etsy“), Wetterfragen `wetterAntwort.ts`. Fehlendes wird ehrlich gesagt.

## Feste Befehle (`befehle.ts`)

- Lage („Loki, Lage“ = volle Lage), Stopp, Still/Mikrofon aus, Kamera groß („zeig den Carport“, tolerant gegen Verhörer wie „Zeuge“) und zurück („Kamera weg“), Nachrichten, Seiten öffnen (sagt ehrlich, dass das von hier noch nicht geht).
- Aktionen per Sprache (Karte anlegen usw.) sind noch nicht gebaut – siehe [Ideen](ideen.md).

## Deutschlandfunk-Nachrichten (0.31.0)

- Einmal am Tag nach der Morgen-Lage und auf Zuruf („Nachrichten“, „lies die Nachrichten“, „Deutschlandfunk“, „was gibt es Neues in der Welt“; nie bei „eine Nachricht“, WhatsApp, Kunde, Etsy). „Loki, Lage“ löst keine Nachrichten aus.
- Quelle: Feed `https://www.deutschlandfunk.de/nachrichten-100.rss` (20 Meldungen). Keine offizielle Feed-Übersicht gefunden – die Adresse kann sich ändern. Die gesprochene Sendung (Podcast `nachrichten-108.xml`) wurde nicht gewählt.
- **Nutzungsbedingungen** (deutschlandfunk.de/nutzungsbedingungen-102.html): nur privat; keine Änderung, Neuzusammenstellung, Speicherung → wortgetreu vorlesen, kein Sprachmodell, kein Spott zwischen oder nach den Meldungen, nur 5 min im Arbeitsspeicher. DLF-Wetterbericht entfällt (Wetter nur Station).
- Ein bissiger Einleitungsspruch davor (Nachschub-Bereich `nachrichten`, auf Zuruf ohne Werkstatt-Bezug). Stand nur, wenn älter als 3 h. Unterbrechen per Reaktor-Klick oder Stopp-Knopf.
- Code: `electron/dlfnachrichten.cjs`, `src/jarvis/nachrichten.ts`, `nachrichtenVortragen` in `dienst.ts`.

## Protokoll

- `%APPDATA%\Jarvis\gespraech.log` (≤ 200 kB + .alt): angenommene Sätze mit Text, Erkenner und Antwortzeit; verworfene Sätze nur als Wortzahl mit Grund (Datenschutz), Lokis Antworten nur als Länge. Bei Rückmeldungen zum Gespräch zuerst hier nachsehen ([AppData-Zugriff](skills/appdata-zugriff.md)).
