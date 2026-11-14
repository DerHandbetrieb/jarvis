# Morgen-Lage

Stand: 2026-11-14

Verwandt: [Werkstatt-Anbindung](werkstatt-anbindung.md), [Gespräch und Befehle](gespraech-und-befehle.md), [Wetter](wetter.md).

## Inhalt und Ablauf

- Feste Regeln ohne Sprachmodell (nichts erfunden), Bausteine abschaltbar: Wetter, Aufgaben (Abarbeiten), offene Bestellungen, Nachproduzieren, Amazon, Selbsttest, gestern verkauft, Freigaben.
- Startet beim Rechnerstart (einmal am Tag) oder mit „Guten Morgen, Loki“; danach einmal am Tag die [Deutschlandfunk-Nachrichten](gespraech-und-befehle.md#deutschlandfunk-nachrichten-0310).
- **Kapitel mit Pausen** (0.20.2): „Kommen wir zum Abarbeiten“ mit Erstens/Zweitens, offene Bestellungen, „Zum Nachproduzieren haben wir folgende Artikel“, Amazon, gestern, Freigaben; `PAUSE` in `sprechtext.ts` (1,3 s zwischen Kapiteln, 0,28 s zwischen Sätzen).
- **Lange Nummern nie vorlesen** (`ohneLangeNummern`, ab 6 Ziffern, ASINs, samt „Fall“ davor). Amazon: nur dass ein Fall offen ist und welcher Artikel.
- Seitenhiebe nach den Sachsätzen, Sprüche u. a. über Emma jeden 2. Tag.

## Nur Neues (0.28.0, zweite Fassung 0.29.2)

- Wunsch Auftraggeber: „nur Aktualisierungen, sonst betet er immer das Gleiche runter“.
- Nach vollständigem Vortrag merkt `lageSchluessel()` die Kennungen aller Einzelheiten (alle Karten, Bestellungen nach Nummer, Lager, Amazon, Selbsttest, Freigaben-Zahl) je Tag in localStorage `jarvis.lageBekannt` (heute + 2 frühere Tage).
- „Guten Morgen“/Rechnerstart vergleichen mit der jüngsten früheren Lage (≤ 7 Tage) und lesen nur Neues vor. **Altes nur als ein Satz mit der Zahl** („Zum Nachproduzieren stehen immer noch vier Artikel an.“). Ist nichts neu: „Seit gestern gibt es nichts Neues.“ Wetter und „gestern verkauft“ immer.
- Tagsüber Angesagtes gilt morgens als bekannt (`lageErgaenzen`). Neues über der Vorlese-Grenze wird nicht gemerkt und kommt am nächsten Tag.
- „Loki, Lage“ und der Knopf „Lage vorlesen“ geben die volle Lage. Ohne Werkstatt-Daten wird nichts gemerkt.
- Nachproduzieren-Karten zählen nicht unter Abarbeiten. Die Sammelkarte „Abarbeiten: Vorschläge freigeben“ wird ausgefiltert (`istFreigabeSammelkarte`), die Vorschläge kommen als Freigaben.
- Freigaben heißen in Lokis Sätzen nur Freigaben/Vorschläge (sie umfassen Werbung, Texte und Preise).
- Bewusst offen: „Amazon-Hinweis:“-Karten stehen nur unter den Aufgaben, nicht im Amazon-Kapitel.
