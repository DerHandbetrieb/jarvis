# Ablauf: Sprüche nachfüllen (Regel 17)

Stand: 2026-11-14

Verwandt: [Charakter und Stimme](../charakter-und-stimme.md), [AppData-Zugriff](appdata-zugriff.md).

1. `%APPDATA%\Jarvis\sprueche-stand.json` lesen (über [AppData-Zugriff](appdata-zugriff.md)): je Sammlung gesamt und unbenutzt.
2. Vorrangig Sammlungen mit weniger als ca. 30 % unbenutzt; sonst 50–100 gemischte Sprüche.
3. Sonnet-Agent schreibt im Hintergrund (Ton und Grenzen aus [Charakter und Stimme](../charakter-und-stimme.md); höchstens 22 Wörter, keine Ziffern, Anrede als `{a}` – Ausnahmen: Bereiche `lage-*` ohne `{a}`, `nachrichten` bis 25 Wörter).
4. Zweiter Agent prüft gegen die Grenzen und ersetzt schwache Sprüche; Dubletten mit `modelle/sprueche/abgleich.mjs` (nicht in Git) prüfen.
5. An `src/jarvis/nachschub.ts` anhängen: Kommentarzeile `# Ladung <Datum> (…)`, dann Zeilen `bereich|Text`. Bekannte Bereiche prüft der Test in `jarvis.test.ts`.
6. Mit der übrigen Arbeit bauen, installieren, committen. Dem Auftraggeber am Ende nur die Anzahl nennen.
