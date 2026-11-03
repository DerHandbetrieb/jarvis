import { defineConfig } from 'vite'
import path from 'node:path'

// Bau des Dauer-HUD-Wallpapers (03.11.2026): eigene, in sich geschlossene Dateien mit relativen Pfaden (Wallpaper Engine
// lädt sie direkt aus dem Ordner, nicht über app://). Ergebnis in dist-hud/, kommt als resources/dauer-hud in den
// Installer; Loki kopiert es beim Einrichten in den Wallpaper-Engine-Ordner und schreibt zugang.js dazu.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist-hud',
    emptyOutDir: true,
    rollupOptions: { input: { index: path.resolve('dauer-hud.html') } },
  },
})
