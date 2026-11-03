import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Schutzregel (Content-Security-Policy) für die fertige Oberfläche: nur eigene Dateien laden und nur mit
 * Open-Meteo (Wetter, kostenlos, ohne Konto) sprechen. Supabase kommt erst mit der eigenen Anmeldung dazu.
 * Nur beim Bauen aktiv, weil der Entwicklungsserver eigene Skripte einschleust.
 */
function sicherheitsRegel(): Plugin {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.open-meteo.com",
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

// Port 5174, weil die Werkstatt-App 5173 nutzt
export default defineConfig({
  plugins: [react(), tailwindcss(), sicherheitsRegel()],
  server: { port: 5174, strictPort: true },
})
