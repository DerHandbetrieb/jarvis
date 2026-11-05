// Bildrate der Szene messen (05.11.2026), ohne die Bildschirme zu belegen: unsichtbares Fenster in voller Größe
// (5760×1080), Zeichnen im Offscreen-Modus mit 60 B/s. Vorher Vorschau-Server „hud5“ (Port 5179) starten.
//   npx electron hud5/messen.cjs
const { app, BrowserWindow } = require('electron')
app.whenReady().then(async () => {
  const f = new BrowserWindow({ show: false, width: 5760, height: 1080, webPreferences: { offscreen: true, backgroundThrottling: false, contextIsolation: true, sandbox: true } })
  f.webContents.setFrameRate(60)
  await f.loadURL('http://localhost:5179/vorschau.html')
  await new Promise((r) => setTimeout(r, 12000))
  const m = await f.webContents.executeJavaScript('window.messung')
  console.log('MESSUNG', JSON.stringify(m))
  // Ansichtsbilder in echter Bildschirmgröße nach grafik/vorschau/ (nicht in Git): je Bildschirm einmal
  const fs = require('fs'), path = require('path'), ziel = path.join(__dirname, '..', 'grafik', 'vorschau'); fs.mkdirSync(ziel, { recursive: true })
  const url = await f.webContents.executeJavaScript("document.getElementById('flaeche').toDataURL('image/png')")
  const { nativeImage } = require('electron'), bild = nativeImage.createFromDataURL(url)
  for (const [i, n] of ['links', 'mitte', 'rechts'].entries()) fs.writeFileSync(path.join(ziel, n + '.png'), bild.crop({ x: i * 1920, y: 0, width: 1920, height: 1080 }).toPNG())
  for (const phase of ['vorlauf', 'schlag']) {
    const d = await f.webContents.executeJavaScript(`window.blitzProbe('${phase}')`)
    fs.writeFileSync(path.join(ziel, 'blitz-' + phase + '.png'), Buffer.from(d.split(',')[1], 'base64'))
  }
  app.quit()
})
