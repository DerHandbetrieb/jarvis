import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

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

/**
 * Töne der Start-Sequenz (Sonniss, nicht in Git – erzeugt mit vorschau/start-sequenz/3d/toene-holen.cjs) beim Bauen nach
 * dist/toene kopieren. Fehlen sie, läuft die Sequenz ohne diese Geräusche (nur selbst erzeugte Klänge) – Hinweis beim Bauen.
 */
function startSequenzToene(): Plugin {
  return {
    name: 'start-sequenz-toene',
    apply: 'build',
    closeBundle() {
      const quelle = path.resolve('vorschau/start-sequenz/3d/toene'), ziel = path.resolve('dist/toene')
      if (!fs.existsSync(quelle)) { console.warn('Hinweis: Töne der Start-Sequenz fehlen (vorschau/start-sequenz/3d/toene) – sie läuft dann ohne diese Geräusche.'); return }
      fs.mkdirSync(ziel, { recursive: true })
      for (const f of fs.readdirSync(quelle)) if (f.endsWith('.ogg')) fs.copyFileSync(path.join(quelle, f), path.join(ziel, f))
    },
  }
}

/**
 * Start-Intro (05.11.2026, Szene „Mystic Aurora“ wie das Wallpaper): Bild-Ebenen nach dist/ebenen und Rauch-Videos nach
 * dist/rauch kopieren (ohne die verworfenen Entwürfe kupfer-* und rand-d-*).
 */
function introDateien(): Plugin {
  return {
    name: 'intro-dateien',
    apply: 'build',
    closeBundle() {
      for (const [von, nach, weglassen] of [['hud5/ebenen', 'dist/ebenen', /^(kupfer-|rand-d-)/], ['hud5/rauch', 'dist/rauch', null]] as const) {
        const quelle = path.resolve(von), ziel = path.resolve(nach)
        if (!fs.existsSync(quelle)) { console.warn(`Hinweis: ${von} fehlt – das Start-Intro kann so nicht laufen.`); continue }
        fs.mkdirSync(ziel, { recursive: true })
        for (const f of fs.readdirSync(quelle)) if (!(weglassen && weglassen.test(f)) && fs.statSync(path.join(quelle, f)).isFile()) fs.copyFileSync(path.join(quelle, f), path.join(ziel, f))
      }
    },
  }
}

// Port 5174, weil die Werkstatt-App 5173 nutzt. Zwei Seiten: die Oberfläche (index.html) und die Start-Sequenz.
export default defineConfig({
  plugins: [react(), tailwindcss(), sicherheitsRegel(), startSequenzToene(), introDateien()],
  server: { port: 5174, strictPort: true },
  build: { rollupOptions: { input: { main: path.resolve('index.html'), startsequenz: path.resolve('start-sequenz.html'), kameralive: path.resolve('kamera-live.html') } } },
})
