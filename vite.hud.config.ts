import { defineConfig } from 'vite'
import path from 'node:path'
import fs from 'node:fs'

// Bau des Dauer-HUD-Wallpapers (03.11.2026, neue Szene „Mystic Aurora“ 05.11.2026): eigene, in sich geschlossene
// Dateien mit relativen Pfaden (Wallpaper Engine lädt sie direkt aus dem Ordner, nicht über app://). Ergebnis in
// dist-hud/, kommt als resources/dauer-hud in den Installer; Loki kopiert es beim Einrichten in den Wallpaper-Engine-
// Ordner und schreibt zugang.js dazu. Die Bild-Ebenen der Szene (hud5/ebenen) werden nach dist-hud/ebenen kopiert.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist-hud',
    emptyOutDir: true,
    target: 'es2022', // Wallpaper Engine nutzt Chromium 124+ (top-level await)
    rollupOptions: { input: { index: path.resolve('dauer-hud.html') } },
  },
  plugins: [{
    name: 'hud-ebenen',
    closeBundle() { fs.cpSync(path.resolve('hud5/ebenen'), path.resolve('dist-hud/ebenen'), { recursive: true }) },
  }],
})
