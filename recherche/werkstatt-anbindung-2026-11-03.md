# Werkstatt-Anbindung für Loki – entscheidungsreife Vorbereitung (03.11.2026)

Stand: nur gelesen und recherchiert. Es wurde nichts gebaut, installiert oder an einer Datenbank geändert. Keine Schlüssel in dieser Datei.
Quellen: Code der Werkstatt-App (`C:\Projekte-Claude\Werkstatt-App`, Git-Stand nach 0.123.0; die frühere Vorlage `src/jarvis/daten.ts` gibt es nur noch in der Git-Historie: `git show 8fefd9f:src/jarvis/daten.ts`) und offizielle Dokus (URLs unten). Alles, was nicht aus einer offiziellen Doku stammt, ist als „Annahme“ oder „unbestätigt“ markiert.

---

## 0. Kurzfassung

1. **Alle Daten, die Loki braucht, liegen schon in der Werkstatt-Datenbank** (Supabase, Projekt `ueadwnyaixbvfymtutbk`, Frankfurt, Free-Tarif). Nichts muss neu erfasst werden.
2. **Die Werkstatt-App meldet sich mit E-Mail + Passwort an und verlangt dann einen 6-stelligen Code (Zwei-Faktor, TOTP).** Die Datenbank erzwingt das selbst: die Regel `is_app_user()` verlangt „aal2“ (= Code eingegeben) und ein Passwort, das jünger als 365 Tage ist (Skript 0071).
3. **Wichtigster Fund:** Fast alle Datenbank-Regeln heißen „für alle Aktionen (`for all`), wenn `is_app_user()`“. Ein Jarvis-Konto, das in der Liste `profiles` steht, könnte also **nicht nur lesen, sondern auch ändern und löschen**. „Nur Lese-Rechte per Regel“ ist darum für Jarvis nicht mit einem Handgriff zu haben (hunderte Tabellen).
4. **Empfehlung:** Loki bekommt ein **eigenes Konto, das NICHT in `profiles` steht** (damit hat es auf keine Tabelle Zugriff), und fragt nur **eine kleine, nur lesende Serverfunktion** („Edge Function“ `jarvis-lage`) ab. Die Funktion prüft Konto + Zwei-Faktor und liefert nur fertige Zahlen (keine Kundendaten). Sicherer als jede Lösung mit direktem Tabellenzugriff, und es ändert sich nichts an den bestehenden Regeln der Werkstatt.
5. Die Anmeldung läuft im **Hauptprozess** von Electron (nicht in der Oberfläche); die Sitzung wird mit `safeStorage` (Windows-DPAPI, asynchrone Funktionen) verschlüsselt gespeichert. Dann ist keine Änderung der Schutzregel (CSP) nötig.

---

## 1. Was Loki aus der Werkstatt braucht (aus dem Code ermittelt)

Alles unten stammt aus der alten Vorlage `daten.ts` und dem aktuellen Code der Werkstatt-App.

| Baustein / HUD-Anzeige | Quelle in der Datenbank | Wie die Werkstatt-App es abfragt |
|---|---|---|
| **Aufgaben / To-do-Karten** (Anzahl, wichtigste 3, neu seit gestern) | Tabellen `cards`, `card_categories` | `cards` ohne Status „erledigt“; Kategorie → Brett „abarbeiten“ (`brettVon`); „neu“ = `created_at` ≥ gestern 0 Uhr. Titel „… produzieren“ wird zu „… nachproduzieren“ umformuliert. |
| **Amazon-Probleme** | Karten (`cards`) mit Titel, der mit „Amazon-Problem:“ beginnt | gleiche Kartenabfrage, Filter auf den Titel. Zusätzlich gibt es Skript 0082 „amazon_probleme“ (Tabelle nicht im Detail geprüft). |
| **Nächtlicher Selbsttest** | Tabelle `selbsttest_laeufe` (am, rot, pruefungen) – 60 Tage; außerdem Karte „Selbsttest: Störungen gefunden“ | Loki-Vorlage nutzte die Karte; die Tabelle gibt mehr Detail (Anzahl „rot“, Einzelprüfungen). |
| **Lager knapp** | `products`, `product_variants` (Feld `reorder_level` = Meldebestand, `sku`), `stock_levels` (sku, quantity) | `ladeUebersichtsdaten()` + `werteAus()` + `knappeBestaende()` (Dateien `src/uebersicht/daten.ts`, `auswertung.ts`). Die Rechenregel „knapp“ müsste in der Serverfunktion nachgebaut werden (Annahme: Bestand ≤ Meldebestand; Datei `auswertung.ts` vorher lesen). |
| **Verkäufe gestern** (Bestellungen, Stück, Umsatz) | `verkauf_bestellungen`, `verkauf_positionen` über die Datenbank-Funktionen `verkauf_tage(von, bis)` und `verkauf_bestell_tage(von, bis)` | `ladeTage(gestern, gestern)` in `src/statistik/api.ts`. Tag = deutsche Zeit; nur zählende Bestellungen (`verkauf_zaehlt`). |
| **Umsatz 14 Tage** | dieselben Funktionen mit 14-Tage-Bereich | wie oben, `von = heute − 13`, `bis = heute`. |
| **Shops Etsy / Amazon / eigener Shop** | `verkauf_bestell_tage` liefert `shop_id`; Zuordnung Shop → Verkaufskanal in `verkauf_shops` (shop_id → channel_id), Kanalnamen in den Einstellungen (`ladeKanaele`) | `kanalVorschlag()` in `src/statistik/rechnung.ts` ordnet nach Name/Plattform zu. |
| **Offene Freigaben** | `marketing_freigaben` mit `status = 'offen'` (Teil-Einträge mit `daten.teil_von` zählen nicht mit) | direkt in `daten.ts` der Vorlage. |
| Wetter | gar nicht Werkstatt (Open-Meteo) | bleibt wie heute. |

**Datenschutz-Befund (gut):** Die Verkaufstabellen sind laut Skript 0065 ausdrücklich datensparsam (keine Namen, Adressen, E-Mails, keine Personalisierungstexte). Loki braucht weder Kundendaten noch Preise/Kalkulation → in der Serverfunktion nur Zählungen, Summen und Artikel-/Aufgabentitel zurückgeben.

### Wie sich die Werkstatt-App anmeldet

- `src/lib/supabase.ts`: `createClient(URL, publishable-Schlüssel)` mit `persistSession` und `autoRefreshToken`. (Der öffentliche „publishable“-Schlüssel existiert in `.env.local`/Cloudflare; er wird hier nicht abgeschrieben. Er darf in einem Programm stecken, ist aber ohne Anmeldung wertlos, weil alle Tabellen auf angemeldete, freigegebene Nutzer beschränkt sind.)
- `AuthProvider.tsx`: `signInWithPassword(email, password)`. Öffentliche Registrierung ist aus, es gibt zwei Konten (die beiden Gesellschafter), manuell angelegt.
- `SicherheitsTor.tsx` / `ZweiFaktor.tsx`: nach dem Passwort prüft die App das Sicherheitsniveau; hat das Konto ein Gerät (Authenticator-App), wird der 6-stellige Code per `mfa.challengeAndVerify({ factorId, code })` gegen alle Geräte geprüft. Kein Gerät → Einrichtung per QR-Code. Passwort älter als 365 Tage → neues Passwort (Regeln: 12 Zeichen, Groß/Klein/Ziffer/Sonderzeichen).
- Die **Datenbank** erzwingt es zusätzlich: `is_app_user()` (Skript 0071) = Eintrag in `profiles` **und** `aal = 'aal2'` im Token **und** `passwort_geaendert_am` jünger als 365 Tage. Ohne Code sieht ein Konto keine Daten.
- Alle Tabellen-Regeln sind meist „`for all to authenticated using (is_app_user())`“ (Beispiel `cards`, `card_categories`); die Statistik-Funktionen prüfen `is_app_user()` selbst und sind für `authenticated` freigegeben.
- Neue Edge Functions der Werkstatt (Ordner `supabase/functions/`: amazon, analytics, bestand-abgleich, billbee, …) sind die gewohnte Stelle für Serverlogik; Veröffentlichen geht mit `node scripts/dienst-veroeffentlichen.mjs <name>` (ist in der Werkstatt-CLAUDE.md beschrieben, braucht deren Zugriffsschlüssel – also Arbeit im Werkstatt-Projekt, siehe Blindspot 9).

---

## 2. Offizielle Recherche (mit Quellen)

### 2.1 Supabase Auth im Desktop-Programm, Sitzung, Token-Erneuerung
- Zugriffs-Token („access token“) sind kurzlebig, Standard **1 Stunde** (einstellbar 5 min – 1 h, darüber nicht empfohlen). **Erneuerungs-Token („refresh token“) laufen nicht ab, sind aber nur einmal benutzbar**; beim Erneuern gibt es ein neues Paar. Wird ein altes Token ein zweites Mal benutzt (außer innerhalb von 10 Sekunden bzw. beim Vorgänger des aktiven), gilt das als Diebstahl und **die ganze Sitzung wird beendet**. Quelle: https://supabase.com/docs/guides/auth/sessions
- Zeitbegrenzte Sitzungen, Inaktivitäts-Ende, „nur eine Sitzung je Nutzer“ gibt es nur ab dem Pro-Tarif (Free-Tarif: Sitzung bleibt, solange sie erneuert wird). Gleiche Quelle.
- supabase-js: Option `auth.storage` nimmt einen eigenen Speicher mit `getItem/setItem/removeItem` (die Doku zeigt das mit React-Native-Beispielen, u. a. mit verschlüsseltem Speicher), `detectSessionInUrl: false` für Nicht-Browser-Umgebungen. Quelle: https://supabase.com/docs/reference/javascript/initializing
- **PKCE:** ist ein Ablauf für Anmeldungen mit Weiterleitung (OAuth, Magic-Link); Supabase nennt es „Implementierungsdetail“. Für **E-Mail + Passwort braucht Loki keine Weiterleitung und damit kein PKCE**. Die Doku sagt dazu nichts Ausdrückliches zu Passwort-Anmeldung (unbestätigt, aber logisch). Quelle: https://supabase.com/docs/guides/auth/sessions/pkce-flow
- Eine Desktop-spezifische Anleitung von Supabase gibt es laut Prüfung der Seiten nicht (nur der Hinweis, dass Desktop-/Mobil-Clients wegen unsicherer Netze die genannten Ausnahmen bei der Token-Wiederverwendung brauchen).

### 2.2 Zwei-Faktor (TOTP) mit supabase-js
- Ablauf: `mfa.enroll({factorType:'totp'})` (liefert QR-Code + Geheimnis) → `mfa.challenge()` → `mfa.verify()`; nach erfolgreichem `verify` ist das Gerät aktiv. Beim Anmelden: erst Passwort (Sitzung = aal1), dann `mfa.getAuthenticatorAssuranceLevel()`: ist `nextLevel = aal2` und ungleich `currentLevel`, Code abfragen; danach erneuert die Bibliothek die Sitzung automatisch auf aal2. Ein Code gilt 30 Sekunden (eine Zeitscheibe Toleranz). TOTP ist kostenlos und standardmäßig aktiv. Quelle: https://supabase.com/docs/guides/auth/auth-mfa/totp
- Erzwingen per Datenbank-Regel mit `auth.jwt()->>'aal'`, am besten als „restrictive“-Regel. Das Niveau steht im Token, das Token kann bis zur nächsten Erneuerung „veraltet“ sein. Quelle: https://supabase.com/docs/guides/auth/auth-mfa
- Offen/unbestätigt: Ob die erneuerte Sitzung nach 1 Stunde dauerhaft aal2 bleibt (also ohne neuen Code), ist in den gelesenen Seiten nicht ausdrücklich beschrieben. Die Werkstatt-App arbeitet in der Praxis so (Sitzung bleibt) → **Annahme, Test in Etappe 2 nötig**.

### 2.3 Nur-Lese-Konto: Rollen, RLS, Views
- RLS-Regeln sollten je Aktion getrennt sein (`select`/`insert`/`update`/`delete`), `for all` verschleiert das; Rechte („grants“) werden **vor** den Regeln geprüft; „restrictive“-Regeln verlangen zusätzliche Bedingungen. Views brauchen `security_invoker = true`, sonst umgehen sie die Regeln. Quelle: https://supabase.com/docs/guides/database/postgres/row-level-security
- Folgerung für uns (Schluss aus dem Code, nicht aus der Doku): Die Werkstatt hat überall „for all“-Regeln. Ein Lese-Konto per RLS hieße: auf jeder Tabelle eine zusätzliche „restrictive“-Regel für Schreib-Aktionen, die z. B. an `auth.uid()` hängt (hunderte Tabellen, Fehlerrisiko, Eingriff in die Live-Datenbank). Eine eigene Postgres-Rolle für Token wäre ein noch größerer Eingriff und in den gelesenen Doku-Seiten nicht als Standardweg beschrieben.
- **Edge Function als Schleuse:** Standard `verify_jwt = true` (Plattform prüft das Token), im Code ist der Nutzer lesbar (`ctx.userClaims`, `ctx.jwtClaims` mit `aal`); `supabaseAdmin` umgeht RLS und darf nur mit eigenem Filter benutzt werden. Quelle: https://supabase.com/docs/guides/functions/auth
- Hinweis: Die Doku zeigt dort das neuere Hilfspaket `@supabase/server`; die Werkstatt-Dienste nutzen ein eigenes Muster (vor dem Bau anschauen, gleich halten).

### 2.4 Electron safeStorage (Windows)
- Windows: Schlüssel über **DPAPI**; schützt vor anderen Windows-Benutzern, **nicht vor anderen Programmen im selben Benutzerkonto**. Die synchronen Funktionen (`encryptString`, `decryptString`, `isEncryptionAvailable`) sind **veraltet und fallen mit Electron 46 weg** → Jarvis (Electron 44.9) soll gleich die asynchronen verwenden: `isAsyncEncryptionAvailable`, `encryptStringAsync`, `decryptStringAsync` (erst nach `app.ready`). Quelle: https://www.electronjs.org/docs/latest/api/safe-storage

### 2.5 CSP
- Jarvis-Schutzregel steht in `vite.config.ts` (`connect-src 'self' https://api.open-meteo.com`). Sie gilt für die Oberfläche. Läuft die Supabase-Anmeldung **im Hauptprozess** (Node), ist **keine CSP-Erweiterung nötig**, und die Oberfläche bekommt nur fertige Daten über die Brücke `window.jarvisDesktop`. Wäre supabase-js in der Oberfläche, bräuchte `connect-src` zusätzlich `https://ueadwnyaixbvfymtutbk.supabase.co` (und `wss://…` für Realtime). Empfehlung: Hauptprozess. (Schluss aus dem Code und dem Electron-Modell, keine eigene Doku-Seite geprüft.)

### 2.6 Realtime und Free-Tarif (nur Supabase-Angaben)
- Free: 200 gleichzeitige Verbindungen, 100 Nachrichten/Sekunde, 100 Kanäle je Verbindung. Quelle: https://supabase.com/docs/guides/realtime/limits
- Free-Kontingente: 2 Mio. Realtime-Nachrichten, 5 GB Datenübertragung, 500.000 Aufrufe von Edge Functions, 50.000 aktive Nutzer, 500 MB Datenbank. Quelle: https://supabase.com/docs/guides/platform/billing-on-supabase
- Für Loki reicht **Abfragen alle paar Minuten** (z. B. 1 Aufruf je 5 min ≈ 9.000/Monat bei Dauerbetrieb, weit unter 500.000). Realtime ist nicht nötig; Rechnung ist eine Überschlagsrechnung von uns. Anmerkung: Die Doku-Seite nennt nichts zum Pausieren inaktiver Free-Projekte; die Werkstatt hat dafür ohnehin schon Wache-Jobs (siehe deren CLAUDE.md).

---

## 3. Blindspot-Pass (Fallstricke)

1. **Ein „Jarvis-Konto in `profiles`“ ist kein Lese-Konto.** Was: Die Regeln der Werkstatt erlauben jedem freigegebenen Konto auch Schreiben/Löschen. Warum es uns erwischt: Man denkt „eigenes Konto = eigene Rechte“; ein Programmfehler oder gestohlener PC-Zugang könnte Aufgaben oder Produkte löschen. *Satz für den Auftrag:* „Das Jarvis-Konto darf nicht in `profiles` stehen und bekommt Daten nur über eine nur lesende Serverfunktion.“
2. **Zwei-Faktor und ein Programm, das ohne Mensch startet.** Was: TOTP braucht alle 30 s einen neuen Code vom Handy. Warum: Loki startet bei Windows-Start ohne Nutzer; wer den Geheimschlüssel im Programm ablegt, hebelt die Zwei-Faktor-Idee aus. *Satz:* „Der Code wird nur bei der Einrichtung einmal von Hand eingegeben; danach hält die verschlüsselte Sitzung, der TOTP-Schlüssel wird nie im Programm gespeichert.“
3. **Sitzung kann „sterben“ (Erneuerungs-Token nur einmal benutzbar).** Was: Laufen zwei Kopien mit derselben Sitzung (Installiertes Loki + Entwicklungs-Loki, oder Sitzungsdatei auf zwei PCs kopiert), wird die Sitzung als Diebstahl beendet. Warum: Wir entwickeln und nutzen auf demselben PC. *Satz:* „Jede Installation (Entwicklung, Auftraggeber-PC, später Kollege) hat ihre eigene Anmeldung; die Sitzung wird nie kopiert.“ Und: Ist sie tot, meldet Loki das sprechend („Ich bin abgemeldet, Sir“) statt Zahlen zu erfinden.
4. **Passwort-Ablauf nach 365 Tagen.** Was: `is_app_user()` verlangt ein jüngeres Passwort. Warum: In einem Jahr zeigt eine Direktabfrage plötzlich nichts mehr; Loki schweigt scheinbar grundlos. *Satz:* „Läuft das Jarvis-Passwort ab, sagt Loki das ausdrücklich; die Funktion prüft das Alter selbst und meldet ‚Passwort erneuern‘.“ (Bei der Funktionslösung betrifft es nur die Prüfung in unserer Funktion – so festlegen.)
5. **Veraltetes Token / Sicherheitsniveau.** Was: aal2 steht im Token und kann bis zur Erneuerung veraltet sein (Doku). Warum: Nach Ändern am Konto wirkt es evtl. bis zu 1 Stunde später. *Satz:* „Nach Konto-Änderungen wird die Sitzung bewusst neu geholt.“
6. **Geheimnisse landen im falschen Ort.** Was: Passwort, Sitzung, Zugangsschlüssel. Warum: Die Anmeldedatei in `%APPDATA%` oder im Git-Stand ist bequem. *Satz:* „Passwort wird nur einmal in der Einrichtungsmaske eingegeben und nie gespeichert; gespeichert wird nur die Sitzung, verschlüsselt per `safeStorage` (asynchron); nichts davon in Git, Logs oder Chat. Der Service-Schlüssel der Werkstatt kommt nie in Jarvis.“
7. **DPAPI schützt nicht vor anderen Programmen im selben Windows-Konto.** Was: Offizielle Aussage der Electron-Doku. Warum: Schadsoftware unter demselben Benutzer könnte die Sitzung entschlüsseln. *Satz:* „Die Sitzung kann nur das, was die Serverfunktion erlaubt (nur lesen, nur Zusammenfassungen); sie lässt sich jederzeit im Supabase-Dashboard beenden (Konto abmelden/sperren).“ Genau deswegen ist Option „Serverfunktion“ wichtig.
8. **`safeStorage` sync-Funktionen verschwinden (Electron 46).** *Satz:* „Nur die asynchronen safeStorage-Funktionen verwenden.“
9. **Eingriff in die Live-Datenbank/ins Werkstatt-Projekt.** Was: Die Funktion und das neue Konto liegen in der Werkstatt-Supabase. Warum: Jede Änderung dort berührt echte Daten, Backups, Wache-Jobs und deren Skripte-Zähler (`public.skripte`); die Regel 7 in Jarvis-CLAUDE.md verlangt Bestätigung. *Satz:* „Alle Änderungen an der Werkstatt-Datenbank als SQL-Datei vorlegen, vom Auftraggeber freigeben lassen, in der Werkstatt-App-Ablage als nächste Skriptnummer (0103…) führen; nichts Destruktives.“ Hinweis: Dafür muss im Werkstatt-Projekt gearbeitet werden (dort lesen erlaubt, ändern nur nach Freigabe).
10. **Lager-„knapp“, Umsatz und Kanalzuordnung sind Rechenlogik, keine Rohdaten.** Was: Die Werkstatt-App rechnet im Browser (`werteAus`, `kanalVorschlag`). Warum: Baut man es in Jarvis nach, stimmen Zahlen irgendwann nicht mehr überein. *Satz:* „Loki zeigt nur Zahlen, die die Serverfunktion nach derselben Regel wie die Werkstatt-App berechnet; Abweichungen werden mit einem Vergleichstest gegen die App geprüft.“
11. **Nicht erfinden, wenn nichts da ist.** *Satz:* „Fehlt eine Zahl oder ist die Verbindung weg, sagt Loki das offen, statt zu raten (Regel 9 ‚Ehrlichkeit‘).“ Dazu kurzer Zwischenspeicher mit Zeitstempel („Stand 07:42“).
12. **Datenschutz bei freien Fragen.** Was: Werkstattdaten gehen später an Ollama. Warum: Ollama läuft lokal (gut), aber falls je ein Cloud-Modell dazukommt, wären Firmenzahlen betroffen. *Satz:* „Werkstattdaten dürfen nur an lokale Modelle gehen.“
13. **Mehrere Gesellschafter / Kollege.** Auftraggeber-PC jetzt; Kollege später. *Satz:* „Pro PC ein eigenes Jarvis-Konto bzw. eigener Anmeldevorgang; Mehrfachnutzung desselben Kontos nicht vorsehen.“
14. **Aufgabentitel sind Freitext.** Was: Karten können Namen oder Interna enthalten, die laut vorgelesen werden. Warum: Loki spricht im Büro/Werkstatt laut, auch bei Besuch. *Satz:* „Es werden nur Titel (keine Kartentexte) gesprochen; Datenschutz-Schalter ‚Zahlen nicht laut vorlesen‘ vorsehen.“
15. **Verwechslung der Tarif-Grenzen.** Was: Free-Tarif: Edge-Function-Aufrufe 500.000/Monat. *Satz:* „Abfrageabstand mindestens 5 Minuten, bei gesperrtem Bildschirm seltener; Aufruf-Zähler im Blick behalten (die Werkstatt hat eine Tabelle `dienst_aufrufe`, Skript 0066).“
16. **Uhrzeit/Zeitzone und „gestern“.** Was: Die Werkstatt rechnet Tage nach deutscher Zeit. *Satz:* „‚Gestern‘ und ‚14 Tage‘ rechnet die Serverfunktion in Europe/Berlin.“

---

## 4. Interview-Fragen (eine nach der anderen, je mit Empfehlung)

1. **Wie soll Loki an die Daten kommen – nur über eine kleine lesende Serverfunktion (empfohlen) oder mit einem Konto, das die Tabellen direkt lesen darf?**
   Empfehlung: Serverfunktion. Begründung: Direkte Tabellenrechte hieße zugleich Schreibrechte (Blindspot 1); die Funktion liefert nur Zusammenfassungen, kann nichts ändern und lässt sich jederzeit abschalten. Kosten: ein kleiner Zusatz in der Werkstatt-Datenbank (eine Funktion + ein Konto), dauerhaft kostenlos im Free-Tarif.
2. **Soll das Jarvis-Konto wie eure beiden Konten Zwei-Faktor mit Authenticator-App bekommen (Code einmal bei der Einrichtung)?**
   Empfehlung: Ja, mit eurer Authenticator-App (eigener Eintrag „Loki“). Begründung: gleiche Sicherheitsregel wie überall (Passwortrichtlinie Pflicht), und der Code wird nur einmal pro Installation gebraucht; danach hält die Sitzung. Nachteil: Stirbt die Sitzung, ist ein neuer Code nötig (selten).
3. **Welche Daten sollen laut vorgelesen werden dürfen, welche nur auf dem Bildschirm erscheinen?**
   Empfehlung: Zahlen und Aufgabentitel gesprochen, Umsatz-Summen nur auf Nachfrage oder per Schalter „Zahlen leise“. Begründung: Loki spricht laut, Besuch könnte mithören (Blindspot 14).
4. **Wie aktuell müssen die Zahlen sein?**
   Empfehlung: Beim Start und danach alle 5 Minuten, Aufgaben zusätzlich wenn ihr fragt. Begründung: reicht für HUD und Morgen-Lage, bleibt weit unter dem Limit von 500.000 Aufrufen/Monat; Echtzeit (Realtime) bringt hier keinen Nutzen.
5. **Soll Loki später auch etwas ändern dürfen (z. B. „Karte erledigt“, Etappe 10 der Roadmap)?**
   Empfehlung: Jetzt nicht festlegen, aber getrennt halten: später eine zweite, eng begrenzte Schreib-Funktion mit Bestätigung per Sprache, nie ein Generalschlüssel. Begründung: Lesen und Schreiben sauber trennen (CLAUDE.md Etappe 10: „immer mit Bestätigung“).
6. **Wer arbeitet an der Werkstatt-Seite – darf ich im Werkstatt-Projekt die neue Funktion samt Konto vorbereiten (nur Dateien, keine Änderung an der Live-Datenbank ohne Freigabe)?**
   Empfehlung: Ja, als eigene kleine Etappe in der Werkstatt-App (neue Skriptnummer, Tests, Vorlage der SQL-Datei zum Freigeben). Begründung: Dort liegen Regeln, Veröffentlichung und Tests; Eingriff in zwei Projekte vermeiden und Sicherheitsregel 7 einhalten.

---

## 5. Plan in kleinen Etappen (nach Freigabe der Fragen)

Jede Etappe: Tests, `npm run build`, Commit mit deutscher Beschreibung, Hochladen. Änderungen an der Live-Datenbank nur nach ausdrücklicher Freigabe.

**Etappe W0 – Entscheidungen** (Interview oben). Test: Antworten in CLAUDE.md Abschnitt 6 festhalten.

**Etappe W1 – Serverfunktion `jarvis-lage` in der Werkstatt-App (nur lesen), zunächst lokal und mit Tests.**
- Liefert eine feste, kleine JSON-Antwort: Aufgaben (Anzahl, wichtigste 3, neu seit gestern), Amazon-Probleme, Selbsttest (Stand, rot), Lager knapp (Namen), Verkäufe gestern, Umsatz je Tag 14 Tage, je Kanal (Etsy/Amazon/Shop), offene Freigaben. Rechenlogik in getesteter Datei, gleiche Regeln wie `auswertung.ts`/`rechnung.ts`, Vergleichstest mit echten Beispielzahlen.
- Erlaubt nur ein bestimmtes Jarvis-Konto und nur bei Zwei-Faktor (aal2); Antwort enthält keine Kundendaten.
- Test: Funktionstests laufen grün; Probelauf mit Beispiel-Eingaben, Antwort enthält nur die vereinbarten Felder.

**Etappe W2 – Konto und Veröffentlichung (nach Freigabe).**
- Skript (z. B. 0103) legt nur die Berechtigungs-Hilfen an; Konto „loki@…“ im Supabase-Dashboard anlegen (Registrierung bleibt aus); Passwort nach Passwortrichtlinie, in den Passwortmanager, nicht in den Chat; Zwei-Faktor einrichten (Auftraggeber scannt einmal den QR-Code – das ist das einzige, was er selbst tun muss); Funktion veröffentlichen.
- Test: Aufruf ohne Anmeldung → abgelehnt; mit Anmeldung ohne Code → abgelehnt; mit Code → Zahlen. Kontrolle: Das Konto kann keine Tabelle direkt lesen (Abfrage auf `cards` liefert leer/Fehler).

**Etappe L1 – Anmeldung im Jarvis-Hauptprozess (`electron/werkstatt.cjs`).**
- supabase-js im Hauptprozess; eigener Speicher (`storage`) mit `safeStorage` (asynchron); `detectSessionInUrl: false`. Einrichtungsmaske in den Einstellungen („Mit Werkstatt verbinden“: E-Mail, Passwort, Code); Passwort wird nicht gespeichert; Knopf „Trennen“.
- Test: Verbinden mit Code → Status „verbunden“; Programm neu starten → bleibt verbunden; Trennen → Sitzung gelöscht; falscher Code → verständliche Meldung. Automatische Tests mit Attrappe des Servers.

**Etappe L2 – Daten holen und anzeigen.**
- Hauptprozess ruft die Funktion alle 5 Minuten ab, hält Zwischenspeicher mit Zeitstempel; Oberfläche bekommt nur fertige Daten über `window.jarvisDesktop`; `daten.ts` füllt die Bausteine der Morgen-Lage (aufgaben, probleme, lager, verkauf, freigaben). Bei Fehler: Baustein entfällt oder Loki sagt ehrlich, was fehlt.
- Test: „Guten Morgen, Loki“ nennt die Zahlen, die auch die Werkstatt-App zeigt (Vergleich vor Auftraggeber); Internet aus → Loki sagt es, erfindet nichts; Sitzung abgelaufen → Hinweis „bitte neu verbinden“.

**Etappe L3 – HUD-Anbindung.** Die Beispieldaten (`DATEN` in `vorschau/start-sequenz/hud/zeichner.js`) durch echte Daten ersetzen. Test: Start-Sequenz zeigt die echten Zahlen, Fallback auf „–“.

**Etappe L4 – Härtung.** Verhalten bei toter Sitzung, Passwort-Ablauf-Hinweis, „Zahlen leise“-Schalter, Abfrage seltener bei gesperrtem Bildschirm, Doku in CLAUDE.md. Prüf-Agent ohne Vorwissen (Regel 11) vor Auslieferung.

Reihenfolge: W0 → W1 → W2 → L1 → L2 → L3 → L4. Selbst erledigt Claude: Code, Tests, SQL-Dateien, Veröffentlichung (soweit freigegeben). Vom Auftraggeber: Freigaben, einmaliges QR-Scannen und Code, Passwort im Passwortmanager ablegen.

---

## 6. Offen / unbestätigt (vor dem Bau klären)
- Ob eine erneuerte Sitzung dauerhaft aal2 bleibt (Annahme nach Verhalten der Werkstatt-App, Test in L1).
- Genaue Regel für „Lager knapp“ (`auswertung.ts`, `knappeBestaende`) und Inhalt von Skript 0082 (Amazon-Probleme-Tabelle) – vor W1 lesen.
- Ob die Werkstatt-Funktionen das Hilfspaket `@supabase/server` oder ein eigenes Muster nutzen (vor W1 vorhandene Funktion als Vorlage ansehen).
- Keine Doku-Angabe gefunden, dass ein Free-Projekt wegen Inaktivität pausiert (die Seite nennt es nicht); die Werkstatt-Wache deckt das ohnehin ab.

## Quellen
- https://supabase.com/docs/guides/auth/sessions
- https://supabase.com/docs/guides/auth/sessions/pkce-flow
- https://supabase.com/docs/guides/auth/auth-mfa
- https://supabase.com/docs/guides/auth/auth-mfa/totp
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/functions/auth
- https://supabase.com/docs/reference/javascript/initializing
- https://supabase.com/docs/guides/realtime/limits
- https://supabase.com/docs/guides/platform/billing-on-supabase
- https://www.electronjs.org/docs/latest/api/safe-storage
- Code: `C:\Projekte-Claude\Werkstatt-App` (`src/lib/supabase.ts`, `src/auth/*`, `src/statistik/api.ts`, `src/uebersicht/daten.ts`, `src/karten/api.ts`, `supabase/migrations/0001, 0016, 0065, 0071, 0088`), Git-Historie `8fefd9f:src/jarvis/daten.ts`; Jarvis: `vite.config.ts` (CSP), `CLAUDE.md`.
