# Wetter

Stand: 2026-11-14

Verwandt: [Dauer-HUD](dauer-hud.md), [Gespräch und Befehle](gespraech-und-befehle.md), [Entscheidungen](entscheidungen.md).

## Quelle: nur die eigene Station

- **Ausnahmslos die eigene Wetterstation** (Vorgabe 06.11.2026: „ausnahmslos nur meine Wetterstation“). Open-Meteo ist vollständig entfernt, auch nicht als Ersatz. Anlass: Open-Meteo meldete Regen bei 0 mm, die Station Sonne.
- Ecowitt GW2000A, steht im Netz des Nachbarn (gemeinsame Station) → Ecowitt-Cloud API v3 `api.ecowitt.net/api/v3/device/real_time` mit Application Key, API Key, MAC (in den L.O.K.I.-Einstellungen eingetragen, verschlüsselt `wetterstation.bin`). `electron/wetterstation.cjs`, minütlich, Fehler-Pause wachsend.
- Der angezeigte Druck ist eher absolut (relativer Druck in der Station vermutlich nicht kalibriert).

## Ableitung (`electron/himmel.cjs`)

- Regen/Schnee aus der Regenrate (Schnee bei ≤ 1 °C). Sonne aus der Strahlung im Vergleich zum wolkenlosen Himmel (Haurwitz): ab 70 % sonnig, 50 % fast sonnig, 30 % heiter, darunter bewölkt; nur bei Sonne über 8°.
- Nachts und bei tiefer Sonne kein Himmelszustand (Ring: durchgestrichener Tropfen + TROCKEN, Loki nennt nur die Temperatur).
- Keine frischen Werte (abgerufen ≤ 5 min, Messzeit ≤ 15 min): keine Wetterangabe („KEINE DATEN“).
- Grenzen: Gewitter, Hagel und Nebel erkennt die Station nicht (Effekte ruhen); Schnee ohne Regenrate wird nicht erkannt; liegt der Sonnensensor im Schatten, steht „bewölkt“.

## Wetterfragen

- Feste Sätze in `src/jarvis/wetterAntwort.ts` statt Sprachmodell: eindeutige Wörter immer, mehrdeutige nur als Frage, nicht bei Grafikkarte/Kaffee/Witz usw. Keine Vorhersagen, kein Rückblick.

## See-Eis

- `electron/wettertage.cjs` schreibt je Tag Höchst-/Tiefstwert nach `%APPDATA%\Jarvis\wetter-tage.json` (21 Einträge).
- Tageshöchstwert unter 0 °C = durchgefroren (zählt nur mit Messung zwischen 12 und 17 Uhr); 2 Tage = Eis vom Ufer her, 3 Tage = ganzer See; der laufende Tag zählt erst nach Mitternacht; fehlender Tag unterbricht nicht, Lücke über 4 Tage schon; ab 2 °C taut es in etwa zwei Tagen. `eis` steht in /hud getrennt vom Wetter. Darstellung im [Dauer-HUD](dauer-hud.md).
