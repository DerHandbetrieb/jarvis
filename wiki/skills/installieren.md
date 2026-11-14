# Ablauf: neue Fassung bauen und installieren

Stand: 2026-11-14

Verwandt: [AppData-Zugriff](appdata-zugriff.md), [Wallpaper einspielen](wallpaper-einspielen.md), [Technik](../technik.md).

1. Version in `package.json` erhöhen.
2. `npm run build` – Syntaxprüfung, Typen, Tests, Bau von Oberfläche und Wallpaper. Muss grün sein.
3. Prüf-Agent ohne Vorwissen gegen Anforderungen und Regeln lesen lassen (Regel 11); Befunde beheben.
4. `npm run electron:build` → `release\Jarvis Setup <Version>.exe` (braucht `.env.werkstatt`).
5. Laufendes Programm beenden: `taskkill //F //IM Jarvis.exe //T`.
6. Still installieren: `"release/Jarvis Setup <Version>.exe" //S` (der Installer startet nichts).
7. **Über explorer.exe starten**, nie direkt aus Claudes Shell (sonst landet alles in der abgeschotteten AppData-Kopie): eine `.vbs` im Scratchpad mit
   `sh.Run "cmd /c """"" & exe & """ --autostart > """ & aus & """ 2>&1""", 0, False` (exe = `%LOCALAPPDATA%\Programs\jarvis\Jarvis.exe`), gestartet mit `cmd.exe //c start "" explorer.exe "<Pfad zur .vbs>"`. Immer `--autostart` (kein Fenster).
8. Falls das Wallpaper betroffen ist: [Wallpaper einspielen](wallpaper-einspielen.md).
9. Notiz im Wiki (passende Seite, ggf. [Entscheidungen](../entscheidungen.md)), „Aktueller Stand“ im Index, dann Commit mit deutscher Beschreibung und `git push`.
10. Dem Auftraggeber eine kurze Test-Anleitung geben.
