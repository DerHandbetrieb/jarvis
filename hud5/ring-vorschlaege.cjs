// Vorschläge für den Runenring um den Reaktor als Bilder (05.11.2026): je Stil ein Ausschnitt in echter Größe nach
// grafik/vorschau/ring-<stil>.png. Vorher Vorschau-Server „hud5“ starten.   npx electron hud5/ring-vorschlaege.cjs
const { app, BrowserWindow } = require('electron')
const fs = require('fs'), path = require('path')
app.on('window-all-closed', () => {}) // zwischen den Stilen nicht beenden
app.whenReady().then(async () => {
  const ziel = path.join(__dirname, '..', 'grafik', 'vorschau'); fs.mkdirSync(ziel, { recursive: true })
  for (const stil of ['a', 'b', 'c', 'd']) {
    const f = new BrowserWindow({ show: false, width: 5760, height: 1080, webPreferences: { offscreen: true, contextIsolation: true, sandbox: true } })
    await f.loadURL('http://localhost:5179/vorschau.html?ring=' + stil)
    await new Promise((r) => setTimeout(r, 3000))
    // Zeitpunkt so, dass „LOKALE“ oben steht (Ring dreht 1 Runde / 240 s, Wort 1 bei 0°) → t = 0
    const d = await f.webContents.executeJavaScript('window.ausschnitt(0, 2880 - 620, 0, 1240, 640)')
    fs.writeFileSync(path.join(ziel, 'ring-' + stil + '.png'), Buffer.from(d.split(',')[1], 'base64'))
    f.destroy(); console.log('Stil', stil)
  }
  app.quit()
})
