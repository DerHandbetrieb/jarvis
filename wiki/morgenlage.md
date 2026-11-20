# Morgen-Lage

Stand: 2026-11-20

Verwandt: [Werkstatt-Anbindung](werkstatt-anbindung.md), [Gespräch und Befehle](gespraech-und-befehle.md), [Wetter](wetter.md).

## Inhalt und Ablauf

- Feste Regeln ohne Sprachmodell (nichts erfunden), Bausteine abschaltbar: Wetter, Aufgaben (Abarbeiten), offene Bestellungen, Nachproduzieren, Amazon, Selbsttest, gestern verkauft, Freigaben.
- Startet beim Rechnerstart (einmal am Tag) oder mit „Guten Morgen, Loki“; danach einmal am Tag die [Deutschlandfunk-Nachrichten](gespraech-und-befehle.md#deutschlandfunk-nachrichten-0310).
- **Kapitel mit Pausen** (0.20.2, Fassung 0.35.0): Abarbeiten (neue Karten mit Titel + Zahl der älteren), offene Bestellungen (Anzahlen nach Frist), „Zum Nachproduzieren haben wir folgende Artikel“, Amazon, gestern, Freigaben; `PAUSE` in `sprechtext.ts` (1,3 s zwischen Kapiteln, 0,28 s zwischen Sätzen).
- **Lange Nummern nie vorlesen** (`ohneLangeNummern`, ab 6 Ziffern, ASINs, samt „Fall“ davor). Amazon: nur dass ein Fall offen ist und welcher Artikel.
- Seitenhiebe nach den Sachsätzen, Sprüche u. a. über Emma jeden 2. Tag.

## Fassung 0.35.0 (20.11.2026, Wunsch Auftraggeber)

- **Nur ein Gruß:** Beim Rechnerstart grüßt nur die Begrüßung („Willkommen zurück, Sir. …“); die Lage beginnt dann mit „Es ist … Uhr.“, Morgen-Sprüche verlieren ihren Gruß („Guten Morgen“, „Willkommen …“, `ohneGrussAnfang`); Neuigkeiten binnen einer Stunde nach Begrüßung/Lage ebenso. „Guten Morgen, Loki“ räumt wie der Rechnerstart die Warteschlange auf, damit nichts doppelt kommt. Vorher kamen bis zu vier Grüße hintereinander. Schritte des Rechnerstarts stehen jetzt in `gespraech.log` („Rechnerstart: begrüßt“, „Morgen-Lage: vorgetragen/abgebrochen“).
- **Bestellungen nur als Anzahl nach Frist** (`fristSaetze`, Regel `src/jarvis/frist.ts` wie Dauer-HUD und Werkstatt): „Offene Bestellungen: sechs. Eine ist überfällig. Zwei müssen heute raus. Eine muss morgen raus. Eine hat noch länger Zeit. Eine wartet noch auf die Zahlung.“ Kommt jeden Morgen, auch bei „nur Neues“. „Morgen“ heißt seit 0.35.1 der nächste Versandtag (Samstag → „am Montag“, vor Feiertagen entsprechend).
- **Abarbeiten:** nur die neuen Karten mit Titel (bis fünf), dazu „Dazu sind noch n ältere Karten offen.“ Auch bei „Loki, Lage“ (voll) mit Titel – verglichen mit dem Merkzettel des Vortags (`bekanntKarten`).

## Nur Neues (0.28.0, zweite Fassung 0.29.2)

- Wunsch Auftraggeber: „nur Aktualisierungen, sonst betet er immer das Gleiche runter“.
- Nach vollständigem Vortrag merkt `lageSchluessel()` die Kennungen aller Einzelheiten (alle Karten, Bestellungen nach Nummer, Lager, Amazon, Selbsttest, Freigaben-Zahl) je Tag in localStorage `jarvis.lageBekannt` (heute + 2 frühere Tage).
- „Guten Morgen“/Rechnerstart vergleichen mit der jüngsten früheren Lage (≤ 7 Tage) und lesen nur Neues vor. **Altes nur als ein Satz mit der Zahl** („Zum Nachproduzieren stehen immer noch vier Artikel an.“). Ist nichts neu: „Seit gestern gibt es nichts Neues.“ Wetter und „gestern verkauft“ immer.
- Tagsüber Angesagtes gilt morgens als bekannt (`lageErgaenzen`). Neues über der Vorlese-Grenze wird nicht gemerkt und kommt am nächsten Tag.
- „Loki, Lage“ und der Knopf „Lage vorlesen“ geben die volle Lage. Ohne Werkstatt-Daten wird nichts gemerkt.
- Nachproduzieren-Karten zählen nicht unter Abarbeiten. Die Sammelkarte „Abarbeiten: Vorschläge freigeben“ wird ausgefiltert (`istFreigabeSammelkarte`), die Vorschläge kommen als Freigaben.
- Freigaben heißen in Lokis Sätzen nur Freigaben/Vorschläge (sie umfassen Werbung, Texte und Preise).
- Bewusst offen: „Amazon-Hinweis:“-Karten stehen nur unter den Aufgaben, nicht im Amazon-Kapitel.
