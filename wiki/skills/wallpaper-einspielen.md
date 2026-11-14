# Ablauf: Wallpaper einspielen und prüfen

Stand: 2026-11-14

Verwandt: [Dauer-HUD](../dauer-hud.md), [Installieren](installieren.md).

1. `npm run build` (baut auch `dist-hud/`). Nur das Wallpaper: `npx vite build -c vite.hud.config.ts`.
2. Einspielen: `node grafik/we-einrichten.cjs dist-hud` (kopiert nach `<WE>\projects\myprojects\loki-dauer-hud`, Ebenen inklusive; `grafik/` ist nicht in Git).
3. Wallpaper Engine lädt **nicht** von selbst neu: `wallpaper32.exe -control stop`, dann `-control play` (Ordner `D:\GAMES\STEAM\Launcher\steamapps\common\wallpaper_engine`).
4. **Fehlerprüfung:** das eingespielte `dauer-hud.html` in einem unsichtbaren Electron-Fenster laden (`show: false`, `offscreen: true`), Konsolenmeldungen ab Stufe Warnung ausgeben, Fehler mit Stack abfangen, nach ~4 s beenden. Keine `//`-Kommentare mitten in Codezeilen.
5. GPU bei Bedarf messen: `Get-Counter '\GPU Engine(*engtype_3D)\Utilization Percentage'` für die Prozesse `webwallpaper64` (Ergebnisse siehe [Dauer-HUD](../dauer-hud.md#leistung-gemessen-10112026)).
6. Testfenster (`-playInWindow`, `hud5/drei-bildschirme.cjs`, Messfenster) nach dem Test sofort schließen.
