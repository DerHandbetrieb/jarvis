# Werkstatt-Anbindung und Neuigkeiten

Stand: 2026-11-14

Verwandt: [Morgen-Lage](morgenlage.md), [Dauer-HUD](dauer-hud.md), Recherche `recherche/werkstatt-anbindung-2026-11-03.md`.

## Aufbau (Entscheidungen 03.11.2026)

- Eigenes Loki-Konto `loki@der-handbetrieb.de` **ohne Tabellenzugriff** (nicht in `profiles`), mit **Zwei-Faktor** (Authenticator-Eintrag „Loki“).
- Nur lesende Serverfunktion **`jarvis-lage`** im Werkstatt-Projekt (`supabase/functions/jarvis-lage/`, Supabase-Projekt `ueadwnyaixbvfymtutbk`). Zugang nur für das Konto aus dem Secret `JARVIS_KONTO_ID` mit aal2. Liefert Aufgaben (offen, neu, wichtigste mit `art`), Lager knapp, Verkäufe (gestern je Kanal, 14 Tage, Kanäle), Freigaben, Selbsttest und `ereignisse` (Bestellungen 48 h ohne Kundendaten, neue offene Karten 48 h mit Ersteller, offene Freigaben).
- Regeln in `jarvis-lage`: Karten in „Läuft im Hintergrund“ (system_key `hintergrund`) zählen nicht als Aufgabe, außer überfällig; automatisch bearbeitete „Amazon-Problem:“-Karten dort gelten nicht als Problem. Bewusste Abweichungen: Stückzahl ohne Set-Faktor; ein Shop ohne Zuordnung bekommt den Kanalnamen.
- Bezeichnungen der Werkstatt (Menü 0.145.0): Freigaben stehen unter „Abarbeiten“, Zahlen unter „Auswertung“, Marketing heißt „Werbung“ – Lokis Sätze, Befehle und `GRUNDWORTE` folgen dem.
- Werkstatt 0.230.0 (14.11.2026): Die Startseite heißt „Übersicht“ (Pfad `/` bleibt), das Wikinger-Dorf liegt unter `/dorf`; Lokis Befehl „öffne Übersicht/Dorf“ folgt dem. Die Antwort von `jarvis-lage` bleibt gleich.
- Loki darf alles laut sagen, auch Umsatz in Euro. Jetzt nur lesen; Schreiben später als eigene, eng begrenzte Funktion mit Bestätigung per Sprache.
- Veröffentlichen der Werkstatt-Dienste: `node scripts/dienst-veroeffentlichen.mjs jarvis-lage` im Werkstatt-Projekt – Claude darf das dauerhaft selbst (Freigabe 04.11.2026).
- **Regel 05.11.2026:** Jede Werkstatt-Änderung, die Loki betrifft (Titel, Meldungen, Struktur), sofort hier übernehmen.

## In L.O.K.I.

- `electron/werkstatt.cjs`: Anmeldung über die Supabase-Auth-Schnittstelle (Passwort → Zwei-Faktor → aal2), Sitzung verschlüsselt (safeStorage) in `%APPDATA%\Jarvis\werkstatt-sitzung.bin`; Zeitgrenze 15 s; bei 401 einmal erneuern; nur vollständige Antworten. Einstellungen: „Werkstatt-Verbindung“ (`WerkstattVerbindung.tsx`). Zugang: `.env.werkstatt` (nicht in Git, `node scripts/werkstatt-zugang.cjs`).
- **Abfragetakt (0.32.1/0.32.2, 10.11.2026):** alle 10 min, solange er am PC ist (Ruhezeit < 10 min), sonst alle 50 min; gezählt ab dem letzten Versuch (nach Fehlern nicht jede Minute). Anlass: Supabase Free-Plan war bis 17.11. knapp (Log-Aufnahme 80 %, Datenabfluss 73 %); `jarvis-lage` antwortet 10 min lang gleich. Morgen-Lage und Fragen nehmen Daten bis 10 min alt.
- Daten älter als 1 h werden in der Morgen-Lage weggelassen, im HUD als „KEINE AKTUELLEN DATEN“ markiert.
- Bestellungen holt die Werkstatt aus Billbee im Takt (höchstens alle 10 min) und per Webhook – Verzug bis ins HUD also etwa Abgleich-Takt + Abfragetakt. Billbee-Grenze 20.000 Aufrufe im Monat (Rechnung 06.11.: höchstens ca. 4.300 zusätzlich, bisher ca. 57 am Tag). Offen im Werkstatt-Programm: Eintrag in `src/einstellungen/neuigkeiten.ts` zur Umstellung des Abrufs.

## Neuigkeiten von selbst ansagen (0.9.0)

- Alle Arten: Bestellungen, Probleme (Amazon-Problem, Selbsttest rot, Lager knapp), neue Aufgaben, neue Freigaben, dazu Auto/Person von der [Kamera](kameras.md). Haken je Art in den Einstellungen.
- Nur wenn er am PC ist (Maus/Tastatur in den letzten 10 min); Verpasstes gesammelt („Während Sie weg waren …“). Liegt die vorige Lage über 15 min zurück, gilt Neues als verpasst.
- Eigene Karten (Konto „Alex“, `EIGENES_KONTO` in `neuigkeiten.ts`) nicht.
- `electron/neuigkeiten.cjs` gleicht mit Bekanntem ab (`%APPDATA%\Jarvis\neuigkeiten.json`, 72 h Gedächtnis, erster Abgleich meldet nichts); feste Sätze in `neuigkeiten.ts` + Seitenhieb (`neuSpitzen.ts`). Warteschlange in `dienst.ts` (`neuAnsagen` alle 15 s, nur wenn Loki frei ist). Neues wartet im Hauptprozess, bis die Oberfläche es abholt (≤ 24 h).
- Kosten geprüft: Edge Functions 500.000 Aufrufe/Monat frei (supabase.com/docs/guides/functions/pricing).

## Offen

- L4: Härtung der Anbindung.
