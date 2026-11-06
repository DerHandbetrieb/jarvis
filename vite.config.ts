import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

/**
 * Schutzregel (Content-Security-Policy) für die fertige Oberfläche: nur eigene Dateien laden, keine Verbindungen nach außen.
 * Wetter, Werkstatt und Kamera laufen über den Hauptprozess.
 * Nur beim Bauen aktiv, weil der Entwicklungsserver eigene Skripte einschleust.
 */
function sicherheitsRegel(): Plugin {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
  return {
    name: 'sicherheits-regel',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`)
    },
  }
}

// Port 5174, weil die Werkstatt-App 5173 nutzt. Seiten: die Oberfläche (index.html) und das unsichtbare Kamera-Fenster.
export default defineConfig({
  plugins: [react(), tailwindcss(), sicherheitsRegel()], // Start-Intro entfernt 06.11.2026: startSequenzToene/introDateien und die Seite start-sequenz.html werden nicht mehr mitgebaut
  server: { port: 5174, strictPort: true },
  build: { rollupOptions: { input: { main: path.resolve('index.html'), kameralive: path.resolve('kamera-live.html') } } },
})
