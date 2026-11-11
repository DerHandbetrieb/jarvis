// Ansichtsbilder der Tropfen-Entwürfe (11.11.2026): unsichtbares Fenster in voller Fläche, Seite inklusive Fenster und
// Unschärfe abfotografieren, je Entwurf den rechten Bildschirm nach grafik/vorschau/ (nicht in Git).
// Vorher Vorschau-Server „hud5“ (Port 5179) starten:  npx electron hud5/tropfen-bilder.cjs
const { app, BrowserWindow } = require('electron')
const fs = require('fs'), path = require('path')
app.whenReady().then(async () => {
  const ziel = path.join(__dirname, '..', 'grafik', 'vorschau'); fs.mkdirSync(ziel, { recursive: true })
  const f = new BrowserWindow({ show: false, width: 5760, height: 1080, enableLargerThanScreen: true, webPreferences: { offscreen: true, backgroundThrottling: false } })
  f.setSize(5760, 1080); f.webContents.setFrameRate(30)
  for (const art of (process.env.TROPFEN || 'a,b,c,d').split(',')) {
    await f.loadURL(`http://localhost:5179/vorschau.html?station=regen&tropfen=${art}&regen=0.9`)
    await new Promise((r) => setTimeout(r, Number(process.env.WARTEN || 14000)))
    const bild = await f.webContents.capturePage({ x: 0, y: 0, width: 5760, height: 1080 })
    const g = bild.getSize(), k = g.width / 5760
    fs.writeFileSync(path.join(ziel, `tropfen-${art}.png`), bild.crop({ x: Math.round(3840 * k), y: 0, width: Math.round(1920 * k), height: Math.round(1080 * k) }).toPNG())
    fs.writeFileSync(path.join(ziel, `tropfen-${art}-mitte.png`), bild.crop({ x: Math.round(1920 * k), y: 0, width: Math.round(1920 * k), height: Math.round(1080 * k) }).toPNG())
    console.log('fertig', art, g.width + 'x' + g.height)
  }
  app.quit()
})
