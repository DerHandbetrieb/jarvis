# Charakter und Stimme

Stand: 2026-11-14

Verwandt: [Gespräch und Befehle](gespraech-und-befehle.md), [Technik](technik.md), [Sprüche nachfüllen](skills/sprueche-nachfuellen.md).

## Charakter (Entscheidungen 03.–04.11.2026)

- Britischer Butler wie im Film: förmlich, Anrede „Sir“, trockenes Understatement, Ironie, schwarzer Humor, ab und zu Bemerkungen ohne Arbeitsbezug.
- **„Noch bissiger“:** In jeder Antwort ein Seitenhieb, gespielt kritisch und anzweifelnd, damit Loki wie ein eigenständiger Charakter wirkt. Fakten immer zuerst und vollständig.
- **Maßstab** (Korrektur 03.11.2026, gilt für alle Texte): „Ah, Sir, Sie leben noch. Wie schön. Ich hatte mich gerade an die Ruhe gewöhnt.“ und „Ich wollte gerade eine Vermisstenanzeige aufgeben. Schade eigentlich.“ – tiefschwarz, gespielt herablassend, gern mit Wunsch nach Ruhe, Zweifel an Kompetenz, Faulheit, Zeitplanung.
- **Grenzen:** nichts über Herkunft oder Gesundheit; nichts gegen andere Menschen; bei ernsten Lagen Fakten zuerst und kein Spott. **Aussehen und Alter des Auftraggebers selbst sind freigegeben** (04.11.2026), aber ohne konkrete Behauptungen (Loki sieht ihn nicht).
- Emma (Labrador) darf vorkommen.
- Beim Start immer etwas anderes sagen (wechselnde Begrüßungen).
- Umgesetzt: Seitenhiebe je Baustein der Morgen-Lage (`SPITZEN` in `morgenlage.ts`), Antworten in `dienst.ts`, Anweisung ans Sprachmodell (`charakter()` in `dienst.ts`), alles abschaltbar über „Humor“.
- Offene Frage: Mit allen Bausteinen kommen bis zu acht Witzsätze in die Morgen-Lage – ggf. begrenzen.

## Sprüche

- Sammlungen: Fundus (`fundus.ts`, Anregungen fürs Sprachmodell), Begrüßungen (`begruessung.ts`), Seitenhiebe der Neuigkeiten (`neuSpitzen.ts`), Spitzen/Sprüche der Morgen-Lage, „zweites Guten Morgen“, Einleitungen der Nachrichten.
- **Rotation** (`rotation.ts`, localStorage `jarvis.rotation`): erst nie benutzte, dann das älteste Viertel; erkannt am Text.
- **Nachschub** in `src/jarvis/nachschub.ts` (Zeilen `bereich|Text`, `{a}` = Anrede, `#` = Kommentar). Stand je Sammlung in `%APPDATA%\Jarvis\sprueche-stand.json`. Ablauf: [Sprüche nachfüllen](skills/sprueche-nachfuellen.md).
- Das lokale Sprachmodell schreibt keine Sprüche (Probe 04.11.2026: 1 von 40 brauchbar).
- Nachnutzung von Witz-Mustern aus der JARVIS-Zitatliste des Auftraggebers: nur das Muster, eigene Worte, nichts Marvel.

## Stimme

- **Lokis Stimme:** Qwen3-TTS-12Hz-0.6B-Base (Apache-2.0) mit fester Vorlage `stimme/loki-vorlage.wav` (Probe R2, „genial, so bleibt es“). Die Vorlage stammt aus VoiceDesign Q1: „A mature British butler with a deep, calm, warm baritone voice. He speaks fluent German with a slight, elegant British accent. Dry, understated, subtly sarcastic delivery, measured pace, natural pauses.“ Vorlage nie ändern; Angaben in `stimme/LIESMICH.md`.
- **Tempo:** faster-qwen3-tts 0.5.4 (MIT, CUDA-Graphen): 3,7-mal schneller als Echtzeit, erster Ton nach 0,3 s. `transformers 5.15.1` festhalten (5.22 bricht). Bringt den inoffiziellen Nachbau qwen-tts-hf mit – nicht mit qwen-tts mischen.
- **Ersatz:** Piper Thorsten high, Tempo 0,88 (Probe A) – nur bei Spiel oder Störung. Aussprache-Liste (`aussprache.ts`, „Sir“ → „Sörr“) und Tempo gelten nur für Piper.
- **Keine Kopie der echten Jarvis-Synchronstimme** (LG Berlin II, 20.08.2025, Az. 2 O 202/24). Stil nur über Wortwahl und Tempo.
- Aussprache fremder Namen (Probe Nachrichten 10.11.2026): „Huang“ → „Wong“, „Hegseth“ → „Hexet“, verständlich.
- Technik der Hintergrund-Programme: [Technik](technik.md). Hörproben und Recherche: `vorschau/hoerproben/`, `recherche/stimmen-2026-11-03.md`.

## Abgelehnt (nicht wieder vorschlagen)

- Britische Piper-Stimmen mit deutscher Lautschrift („schrecklich“).
- Flachwitz des Tages („kriegt er nicht gut hin“, entfernt 06.11.2026).
- Chatterbox (Proben M1, M2, N1) nicht gewählt; falls je wieder getestet: braucht `setuptools<81`, das PyPI-Paket 0.1.7 kennt nur Multilingual V2.
- Thorsten-Kokoro nicht getestet (Pakete aus dem Konto einer Privatperson) – nur mit ausdrücklicher Freigabe.
