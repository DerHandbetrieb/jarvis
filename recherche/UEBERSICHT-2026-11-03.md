# Was als Nächstes ansteht – Übersicht zum Entscheiden (03.11.2026)

Vorbereitet, während der Auftraggeber weg war. **Gebaut wurde davon noch nichts** (Projektregeln: Werkstatt-Anbindung „nicht ohne Rückfrage“, neue Themen erst nach Interview und Plan-Freigabe). Die ausführlichen Unterlagen mit Quellen, Fallstricken und Etappen-Plänen:

- `werkstatt-anbindung-2026-11-03.md` – echte Zahlen und To-do-Karten aus der Werkstatt
- `wallpaper-engine-2026-11-03.md` – Dauer-HUD auf den drei Bildschirmen
- `kameras-2026-11-03.md` – Live-Bilder der Kameras im HUD

## Empfohlene Reihenfolge

1. **Werkstatt-Anbindung zuerst.** Sie macht die Morgen-Lage und die Start-Sequenz sofort nützlicher (echte Zahlen statt Beispiele), und alles Weitere baut darauf auf.
2. **Dauer-HUD** (Wallpaper Engine oder eigenes Fenster): erst zwei kurze Wegwerf-Tests, dann entscheiden.
3. **Kameras** zuletzt: hängen vom Dauer-HUD ab und brauchen vorher Klärung von Modell und Datenschutz.

## 1. Werkstatt-Anbindung – das Wichtigste

- Alle Daten liegen schon in der Werkstatt-Datenbank (Aufgaben, Amazon-Probleme, Selbsttest, Lager knapp, Verkäufe, Umsatz 14 Tage, Freigaben). Nichts muss neu erfasst werden.
- **Wichtiger Fund:** Jedes normale Werkstatt-Konto darf in der Datenbank auch ändern und löschen. Ein „Nur-Lese-Konto“ ist dort nicht mit einem Handgriff zu haben.
- **Empfehlung:** Loki bekommt ein eigenes Konto **ohne** Tabellenzugriff und fragt nur eine kleine **lesende Serverfunktion** ab, die fertige Zahlen liefert (keine Kundendaten, kann nichts ändern, jederzeit abschaltbar, im kostenlosen Tarif).
- Anmeldung mit Zwei-Faktor wie bei euch; die Sitzung liegt verschlüsselt im Windows-Konto. Selbst tun müsstest du nur: einmal QR-Code scannen, Code eingeben, Passwort im Passwortmanager ablegen.

**Fragen (je mit Empfehlung):**
1. Serverfunktion statt direktem Tabellenzugriff? → *Ja (sicherer).*
2. Zwei-Faktor für das Loki-Konto? → *Ja, eigener Eintrag „Loki“ in der Authenticator-App.*
3. Welche Zahlen darf Loki laut sagen? → *Aufgaben und Zahlen ja, Umsatz-Summen nur auf Nachfrage (Besuch könnte mithören).*
4. Wie aktuell? → *Beim Start und alle 5 Minuten.*
5. Soll Loki später auch etwas ändern dürfen? → *Jetzt nicht; später eigene, eng begrenzte Funktion mit Bestätigung.*
6. Darf ich die Funktion in der Werkstatt-App vorbereiten (nur Dateien, Datenbank erst nach Freigabe)? → *Ja.*

## 2. Dauer-HUD – das Wichtigste

- Wallpaper Engine kann Web-Hintergründe über alle drei Bildschirme und pausiert bei Spielen von selbst (offiziell belegt).
- **Nicht dokumentiert:** ob so ein Hintergrund Daten von Loki holen darf (lokale Verbindung) und ob Klicks ankommen. Das klärt nur ein kurzer Test.
- Alternative: eigenes Loki-Fenster hinter den Desktop-Symbolen. Mehr Kontrolle, aber ein inoffizieller Windows-Trick, der unter Windows 11 nicht sicher klappt.
- **Empfehlung:** zwei Wegwerf-Tests von je etwa einer Stunde, dann entscheiden. Tendenz: Wallpaper Engine, wenn der Datenweg klappt.
- Wichtig: Die Sonniss-Töne dürfen nie in einem veröffentlichten Wallpaper landen (Lizenz).

**Fragen:**
1. Nur anschauen oder auch anklicken? → *Erst nur anschauen.*
2. Bei Spielen automatisch pausieren? → *Ja.*
3. Welche Inhalte zuerst? → *Uhr, Datum, Wetter, Systemwerte, Werkstatt-Kacheln (erst Beispiel, nach der Anbindung echt).*
4. Alle drei Bildschirme als eine Fläche? → *Ja, wie die Start-Sequenz.*
5. Darf ich für den Test kurz dein Wallpaper wechseln (danach zurück)? → *Ja.*

## 3. Kameras – das Wichtigste

- Auf dem PC liegt nur eine Aufnahme „Kamera Carport CH01“. Das Modell ist daraus nicht erkennbar.
- Reolink-Kameras mit Kabel/PoE liefern ein Livebild (RTSP), Akku-Kameras nur über Hub/Rekorder, 4G-Kameras gar nicht (offiziell).
- Der Browser in Loki kann RTSP nicht direkt zeigen → ein kleiner lokaler „Übersetzer“ (go2rtc oder MediaMTX, MIT-Lizenz) wäre nötig, streng nur auf diesem PC und mit Anmeldung.
- **Recht:** Zeigt eine Kamera Straße oder Nachbarn, gilt die private Ausnahme nicht (EuGH C-212/13). Auf dem Betriebsgelände der GbR gilt die DSGVO voll (Hinweisschild, Abwägung, kurze Löschfrist). Einzelheiten der Behörden-Leitlinien sind teils unbestätigt → vor dem Bau kurz rechtlich prüfen.
- **Empfehlung:** erst Standbild alle 2–5 Sekunden, Bewegtbild später; Kameras nicht in der Start-Sequenz, sondern im Dauer-HUD und auf Zuruf („Loki, zeig den Carport“).

**Fragen:**
1. Welche Kameras genau (Modell, Strom/PoE/Akku)?
2. Direkt im Netz oder über Rekorder/Hub?
3. Was zeigen sie – auch Straße oder Nachbarn? Betriebsgelände?
4. Nur live ansehen (empfohlen) oder auch aufnehmen?
5. Bewegungsmeldung durch Loki? → *Später, als zweite Stufe.*
6. Dauer-Kachel oder nur auf Zuruf/bei Bewegung? → *Auf Zuruf und bei Bewegung groß, sonst kleine Kachel.*

## Was du selbst tun müsstest (gesammelt)

- Die Fragen oben beantworten (am schnellsten: „Empfehlungen übernehmen“ plus Kameramodell).
- Werkstatt: einmal QR-Code scannen, Code eingeben, Passwort ablegen.
- Kameras: Modellnamen nachsehen; RTSP einschalten und Nur-Ansehen-Konto anlegen (ich erkläre jeden Klick, das Passwort bleibt bei dir).
