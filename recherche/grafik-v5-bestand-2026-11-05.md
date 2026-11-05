# Grafikpaket „L.O.K.I. Mystic Aurora V5“ – Bestandsaufnahme (05.11.2026)

Quelle: `Downloads\LOKI_Mystic_Aurora_3x4K_Animationsassets_V5.zip` (Kopie in `HUD\`), entpackt nach
`grafik\v5\` – **beides nicht in Git** (.gitignore), weil groß. Paket mit ChatGPT erstellt (laut Beiblatt).

## Was drin ist
- **Gesamtbild** 3 × 3840×2160 (links, Mitte, rechts) + Fassung „ohne Inhalte“ je Bildschirm (`00_MASTER`).
- **Ebenen:** Hintergrund mit Löchern, Aurora-Lichter einzeln, Reaktor (1254×1254, freigestellt), 5 Reaktor-Ringe,
  4 Zielrunenringe, Wasserwellen Mitte, 8 Halo-Bilder für das Pulsieren, Runenbögen links/rechts, 4 goldene Ecken,
  einzelne Runen, 10 Fenster je mit Rahmen + Inhalt getrennt (`09_ANIMATION_READY_V5/01_ALIGNED_4K_ORIGINAL`).
- Optional (neu gezeichnet, nicht pixelgleich): Himmel, Berge, Wasser, Wasser-Lichtreflexe, Aurora durchgehend.
- **Kamera-Masken** mit den vier Eckpunkten der schräg gestellten Kamerafenster (Perspektive).
- Bewegungsvorschläge (Manifest): Aurora 22 s Periode, ±25 px; Reaktor-Kern pulsiert 2,8 s; Wasser 8 s; Runen
  leuchten 10 s.

## Aufteilung im Bild
- **Links** (Fenster nach rechts hinten gekippt): Wochenumsatz (Balken), Tagesumsatz (Linie), Audio (Welle +
  Knöpfe), Aufgaben (Checkliste), Verkäufe (Einkaufswagen-Liste); Runenbogen + Ecken.
- **Mitte:** Runen-Reaktor über dem See, Zielrunenring, Wasserwellen, Aurora, Berge.
- **Rechts** (nach links hinten gekippt): CAM 01, CAM 02, Analyse (Balken + Linie), Weltkugel, Wikingerschiff;
  Runenbogen + Ecken.

## Befunde (Blindspots)
1. **(Entscheidung Auftraggeber 05.11.2026: Runen bleiben unverändert, privat.)** Runen-Regel: Im Reaktor oben rechts steht eine **ᛉ (Algiz, „Lebensrune“)** – laut unserer Regel
   (Abschnitt 13 CLAUDE.md) wegen NS-Bezug verboten. Muss vor jeder Verwendung ersetzt werden (Stein retuschieren,
   andere Rune einsetzen, z. B. ᚦ, ᚠ oder ᛚ). Die anderen Reaktor-Runen (ᚱ, ᚹ, ᚴ, Triquetra) sind unbedenklich.
2. **Runenbögen links/rechts sind Fantasie-Zeichen** (KI-Gekritzel), mehrere sehen aus wie ᛉ bzw. umgedrehtes ᛉ
   (ᛦ). Die zerlegten Einzelrunen sind zudem großteils nur Striche. **Vorschlag:** Bogen-Runen selbst neu
   setzen – echte, erlaubte Runen des Älteren Futhark als gestochen scharfe Leuchtschrift. Sie können sich dann
   auch einzeln bewegen (was der Auftraggeber möchte).
3. **Schärfe:** Das Paket ist ein flaches Bild von 2896×543 Pixeln, auf 4K hochgerechnet (Faktor 3,98). Auf den
   Bildschirmen (je 1920×1080) entspricht das einer Verdopplung → Hintergrund und Rahmen leicht weich (bei Himmel,
   Aurora, Nebel egal). **Darum alle Inhalte (Zahlen, Graphen, Wellen, Text) selbst live zeichnen** – das wird
   knackig scharf (Vorgabe 03.11.: kein Weichzeichner-Look).
4. **Inhalte im Bild sind Platzhalter** (Achsen mit Fantasie-Beschriftung, Wellen nur gemalt). Wir verwenden die
   Fassung „ohne Inhalte“ + Rahmen und zeichnen darüber die echten Daten in derselben Schräglage.
5. **Größe/Leistung:** 4K-Ebenen in voller Größe würden Grafikspeicher fressen. Beim Bauen einmal auf die echte
   Bildschirmgröße verkleinern (je Ebene 1920×1080 bzw. kleiner zugeschnitten) und nur das Nötige laden.
6. **Bewegung ohne Rückseiten:** Laut Beiblatt sind verdeckte Teile (Ringrückseiten) nicht vorhanden. Drehen geht
   nur bei Teilen, die rund und vollständig sind (Ringe, Runenring – prüfen) oder die wir selbst zeichnen.
7. **Ein Bild für Intro und Wallpaper:** Damit der Übergang nicht springt, nutzen Start-Sequenz und Wallpaper
   **dieselbe Szene, denselben Code, dieselben Koordinaten** (5760×1080 über alle drei Bildschirme, auch hinter
   der Taskleiste). Das Intro endet genau im ersten Bild des Wallpapers; danach blendet das Intro-Fenster nur aus.
8. Zierelemente mit Wikinger-Bezug: Triquetra, Drachen, Flechtband, Wikingerschiff – unbedenklich.

## Vorschlag Belegung (zur Abstimmung)
- **Links – Werkstatt:** großes Fenster oben = Verkäufe kombiniert (Balken je Tag, Linie Wochensumme, Umschalten
  automatisch alle paar Sekunden); kleines oben = Umsatz heute/Woche als Zahl + Mini-Kurve; Audio-Fenster =
  **Tonwellen** (PC-Ton, Lokis Stimme in eigener Farbe; die Knöpfe zeigen Lokis Zustand bzw. Stumm);
  unten links = **Abarbeiten-Karten** (Dringend zuerst); unten rechts = letzte Bestellungen (Kanal, Stück, Betrag).
- **Rechts – Haus:** CAM 01 + CAM 02 live in den schrägen Fenstern (bei Person: großziehen); Analyse-Fenster =
  **FENECON** (Energiefluss PV → Haus/Akku/Netz, Akku-Stand); Weltkugel-Fenster = **Wetterstation**
  (Temperatur, Wind-Kompass, Regen, Luftdruck); Wikingerschiff = Lokis Systemstatus (Stimme, Gehör, Werkstatt
  verbunden) oder Emma-/Wetterspruch.
- **Mitte:** Reaktor pulsiert (Halo-Bilder), Kern reagiert auf Lokis Zustand (zuhören/denken/sprechen), Zielrunenring
  dreht langsam, Wasserwellen + Spiegelung schwingen, Nebel/Rauch über dem See (selbst gezeichnet), Aurora wogt.

## Eigene Zusatzvorschläge
- Reaktor = Lokis „Herz“: Pulsieren im Takt seiner Stimme, wenn er spricht.
- Neue Bestellung: kurzer Lichtimpuls läuft vom Reaktor über die Linie zum Verkäufe-Fenster.
- Wasser spiegelt den Reaktor-Puls.
- Uhrzeit/Datum klein und edel unter dem Reaktor (ohne den L.O.K.I.-Schriftzug zu verdecken).
- Intro: Bild ist dunkel, Aurora blendet auf, Runen entzünden sich nacheinander, Reaktor fährt hoch (Halo),
  Fenster klappen aus der Schräge auf, Daten laufen ein – Ton = bisheriges Gerüst 9, Einschlag auf Reaktorstart.
