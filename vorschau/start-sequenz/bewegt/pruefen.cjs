// Prüfwerkzeug für die bewegte Fassung (03.11.2026). Vorher muss der Vorschau-Server „start-sequenz“ (Port 5177) laufen.
//   npx electron vorschau/start-sequenz/bewegt/pruefen.cjs bilder   → Einzelbilder zu festen Zeitpunkten nach bewegt/bilder/ (nicht in Git)
//   npx electron vorschau/start-sequenz/bewegt/pruefen.cjs messen   → einmal echt abspielen, randlos über alle Bildschirme,
//                                                                      Ton stumm, Bildrate messen und hier ausgeben
const { app, BrowserWindow, screen } = require('electron')
const fs = require('fs'), path = require('path')
const art = process.argv.includes('messen') ? 'messen' : 'bilder'

app.whenReady().then(async () => {
  if (art === 'bilder') {
    const ziel = path.join(__dirname, 'bilder'); fs.mkdirSync(ziel, { recursive: true })
    const f = new BrowserWindow({ show: false, width: 1200, height: 800, webPreferences: { contextIsolation: true, sandbox: true } })
    await f.loadURL('http://localhost:5177/bewegt/'); await new Promise((r) => setTimeout(r, 2000))
    for (const t of [1.0, 2.5, 4.0, 6.0, 8.5, 9.8, 10.6, 11.2, 14.0, 20.0]) {
      const d = await f.webContents.executeJavaScript(`(() => { window.startSequenz.zeichne(${t}); return document.getElementById('flaeche').toDataURL('image/jpeg', 0.88) })()`)
      fs.writeFileSync(path.join(ziel, `t${String(t).replace('.', '_')}.jpg`), Buffer.from(d.split(',')[1], 'base64')); console.log('Bild', t)
    }
    app.quit(); return
  }
  const alle = screen.getAllDisplays().map((d) => d.bounds)
  const x = Math.min(...alle.map((b) => b.x)), y = Math.min(...alle.map((b) => b.y))
  const breite = Math.max(...alle.map((b) => b.x + b.width)) - x, hoehe = Math.max(...alle.map((b) => b.y + b.height)) - y
  const f = new BrowserWindow({ x, y, width: breite, height: hoehe, frame: false, backgroundColor: '#000000', skipTaskbar: true, resizable: false,
    webPreferences: { contextIsolation: true, sandbox: true, autoplayPolicy: 'no-user-gesture-required', backgroundThrottling: false } })
  f.setAlwaysOnTop(true, 'screen-saver'); f.setBounds({ x, y, width: breite, height: hoehe }); f.webContents.setAudioMuted(true)
  f.webContents.on('console-message', (e) => { const text = e.message; if (String(text).startsWith('MESSUNG')) { console.log(text); setTimeout(() => app.quit(), 300) } })
  await f.loadURL('http://localhost:5177/bewegt/?flaeche&fps')
  setTimeout(() => app.quit(), 60_000)
})
