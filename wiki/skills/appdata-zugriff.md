# Ablauf: an die echten L.O.K.I.-Daten in %APPDATA% kommen

Stand: 2026-11-14

Verwandt: [Installieren](installieren.md), [Technik](../technik.md).

- Claudes Shell sieht nur eine **abgeschottete Kopie** von `%APPDATA%` (MSIX: `%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming`). Was Claude dort liest, anlegt oder per direkt gestartetem Programm schreibt, betrifft nicht das echte L.O.K.I. Laufwerk D: (Wallpaper Engine) ist echt.
- **Lesen** (Protokolle `gespraech.log`, `kamera.log`, `sprueche-stand.json`, Local Storage …): eine `.cmd` im Scratchpad, die mit `copy /y "%APPDATA%\Jarvis\<Datei>" "<Scratchpad>\post\<Datei>"` kopiert und am Ende eine Marke `fertig.txt` schreibt; starten mit `cmd.exe //c start "" explorer.exe "<Pfad zur .cmd>"`, kurz warten, dann die Kopie lesen.
- **Schreiben/Löschen/Einrichten** (z. B. Python-Umgebungen, Aufräumen): ebenso über eine `.cmd`/`.vbs` per explorer.exe; das Ergebnis in eine Meldedatei schreiben lassen und prüfen. Skripte mit dem Write-Werkzeug anlegen, nicht per `printf` (deutet `\a`, `\n` als Steuerzeichen).
- **Daten des laufenden L.O.K.I.** lassen sich auch über die Gegenstelle prüfen (GET /hud mit dem Schlüssel aus `<WE>\…\loki-dauer-hud\zugang.js`); keine Schlüssel im Chat wiedergeben.
- Chromium-Local-Storage (leveldb): Werte mit Umlauten liegen als UTF-16; zum Lesen ab dem Schlüssel mit `utf16le` dekodieren.
