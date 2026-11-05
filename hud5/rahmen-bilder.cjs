// Rahmen-Entwürfe als Bilder (05.11.2026): je Stil der linke Bildschirm in echter Größe nach grafik/vorschau/rahmen-<n>.png
// Vorher Vorschau-Server „hud5“ starten.   npx electron hud5/rahmen-bilder.cjs [dreh]
const { app, BrowserWindow } = require('electron'), fs = require('fs'), path = require('path')
app.on('window-all-closed', () => {})
app.whenReady().then(async () => {
  const ziel = path.join(__dirname, '..', 'grafik', 'vorschau'); fs.mkdirSync(ziel, { recursive: true })
  for (const stil of ['1', '2', '3', '4']) {
    const f = new BrowserWindow({ show: false, width: 1920, height: 1080, useContentSize: true, enableLargerThanScreen: true, webPreferences: { offscreen: true } })
    await f.loadURL(`http://localhost:5179/rahmen-entwurf.html?stil=${stil}&dreh=${process.argv[2] ?? 24}`)
    await new Promise((r) => setTimeout(r, 1500))
    const bild = await f.webContents.capturePage({ x: 0, y: 0, width: 1920, height: 1080 })
    fs.writeFileSync(path.join(ziel, `rahmen-${stil}.png`), bild.toPNG()); f.destroy(); console.log('Stil', stil, bild.getSize())
  }
  app.quit()
})
