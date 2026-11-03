// Testmodus: zeigt die Entwürfe der Start-Sequenz in echter Größe über alle Bildschirme, auch über der Taskleiste
// (03.11.2026). Vorher muss der Vorschau-Server „start-sequenz“ (Port 5177) laufen.
// Aufruf aus dem Projektordner:  npx electron vorschau/start-sequenz/3d/drei-bildschirme.cjs 1
// Tasten: 1–4 andere Variante, Leertaste nochmal, Esc beenden.
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
  fenster.loadURL(`http://localhost:5177/3d/?flaeche&entwurf=${entwurf}`)
  fenster.on('closed', () => app.quit())
  // Sicherheitsnetz: nach spätestens 3 Minuten von selbst schließen
  setTimeout(() => app.quit(), 180_000)
})
app.on('window-all-closed', () => app.quit())
