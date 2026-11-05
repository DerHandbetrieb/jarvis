// Szene über alle drei Bildschirme ansehen (05.11.2026): randloses Fenster über die ganze Fläche, ganz oben.
// Vorher Vorschau-Server „hud5“ (Port 5179) starten. Esc oder Klick beendet. Tasten 1–4: Loki hört/denkt/spricht/aus.
//   npx electron hud5/drei-bildschirme.cjs
const { app, BrowserWindow, screen } = require('electron')
app.whenReady().then(async () => {
  const alle = screen.getAllDisplays().map((d) => d.bounds)
  const x = Math.min(...alle.map((b) => b.x)), y = Math.min(...alle.map((b) => b.y))
  const breite = Math.max(...alle.map((b) => b.x + b.width)) - x, hoehe = Math.max(...alle.map((b) => b.y + b.height)) - y
  const f = new BrowserWindow({ x, y, width: breite, height: hoehe, frame: false, backgroundColor: '#000000', skipTaskbar: true, resizable: false,
    webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: false } })
  f.setAlwaysOnTop(true, 'screen-saver'); f.setBounds({ x, y, width: breite, height: hoehe })
  f.webContents.on('before-input-event', (e, ein) => { if (ein.key === 'Escape') app.quit() })
  await f.loadURL('http://localhost:5179/vorschau.html?voll')
  await f.webContents.executeJavaScript("document.getElementById('info').style.display='none'; addEventListener('mousedown', () => window.close())")
})
app.on('window-all-closed', () => app.quit())
