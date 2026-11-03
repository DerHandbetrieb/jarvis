; Jarvis-Installer (03.11.2026): Beim Deinstallieren den Autostart-Eintrag wieder entfernen (Prüf-Agent).
; Den Eintrag legt das Programm selbst an (electron/main.cjs, app.setLoginItemSettings mit Name „Jarvis“).
!macro customUnInstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Jarvis"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "Jarvis"
!macroend
