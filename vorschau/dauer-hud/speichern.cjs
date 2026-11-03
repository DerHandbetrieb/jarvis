// Speichert die vier Dauer-HUD-Entwürfe als Bilder nach vorschau/dauer-hud/bilder/ (nicht in Git).
// Vorher muss der Vorschau-Server „dauer-hud“ (Port 5178) laufen.  Aufruf: npx electron vorschau/dauer-hud/speichern.cjs
const { app, BrowserWindow } = require('electron')
const fs = require('fs'), path = require('path')
app.whenReady().then(async () => {
  const ziel = path.join(__dirname, 'bilder'); fs.mkdirSync(ziel, { recursive: true })
  const f = new BrowserWindow({ show: false, width: 1200, height: 800, webPreferences: { contextIsolation: true, sandbox: true } })
  await f.loadURL('http://localhost:5178/dauer-hud/'); await new Promise((r) => setTimeout(r, 2500))
  const n = await f.webContents.executeJavaScript('window.dauerHud.anzahl')
  for (let i = 0; i < n; i++) {
    const d = await f.webContents.executeJavaScript(`(() => { const c = document.createElement('canvas'); window.dauerHud.zeichneEntwurf(c, ${i}); return c.toDataURL('image/jpeg', 0.9) })()`)
    fs.writeFileSync(path.join(ziel, `entwurf-${'abcd'[i]}.jpg`), Buffer.from(d.split(',')[1], 'base64')); console.log('Entwurf', 'ABCD'[i])
  }
  app.quit()
})
