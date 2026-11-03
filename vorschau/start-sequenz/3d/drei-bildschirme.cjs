// Testmodus: zeigt die Entwürfe der Start-Sequenz in echter Größe über alle Bildschirme, auch über der Taskleiste
// (03.11.2026). Vorher muss der Vorschau-Server „start-sequenz“ (Port 5177) laufen.
// Aufruf aus dem Projektordner:  npx electron vorschau/start-sequenz/3d/drei-bildschirme.cjs   (Runde 5, Variante A)
//                                npx electron vorschau/start-sequenz/3d/drei-bildschirme.cjs b  (Runde 5, Variante B bzw. c)
//                                npx electron vorschau/start-sequenz/3d/drei-bildschirme.cjs 1  (Runde 3, Varianten 1–4)
// Tasten: 1–4 (Runde 3) bzw. A–C (Runde 5) andere Variante, Leertaste nochmal, Esc beenden.
const { app, BrowserWindow, screen } = require('electron')

app.whenReady().then(() => {
  const alle = screen.getAllDisplays().map((d) => d.bounds)
  const x = Math.min(...alle.map((b) => b.x)), y = Math.min(...alle.map((b) => b.y))
  const breite = Math.max(...alle.map((b) => b.x + b.width)) - x, hoehe = Math.max(...alle.map((b) => b.y + b.height)) - y
  const entwurf = process.argv.find((a) => /^[1-4]$/.test(a)) || '1'
  const fenster = new BrowserWindow({
    x, y, width: breite, height: hoehe, frame: false, backgroundColor: '#000000', skipTaskbar: true, resizable: false,
    webPreferences: { contextIsolation: true, sandbox: true, autoplayPolicy: 'no-user-gesture-required', backgroundThrottling: false },
  })
  fenster.setAlwaysOnTop(true, 'screen-saver') // über der Taskleiste
  fenster.setBounds({ x, y, width: breite, height: hoehe })
  const v5 = process.argv.find((a) => /^[abc]$/i.test(a))?.toLowerCase() || "a"
  const runde3 = process.argv.some((a) => /^[1-4]$/.test(a))
  fenster.loadURL(runde3 ? `http://localhost:5177/3d/?flaeche&entwurf=${entwurf}` : `http://localhost:5177/hud/?flaeche&v=${v5}`)
  fenster.on('closed', () => app.quit())
  // Sicherheitsnetz: nach spätestens 3 Minuten von selbst schließen
  setTimeout(() => app.quit(), 180_000)
})
app.on('window-all-closed', () => app.quit())
