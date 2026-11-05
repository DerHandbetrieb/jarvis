// Intro-Entwürfe über alle drei Bildschirme ansehen (05.11.2026). Vorher Vorschau-Server „hud5“ (Port 5179) starten.
//   npx electron hud5/intro-drei.cjs [1–4]
// Tasten 1–4 = Variante (startet neu mit Ton), R oder Leertaste = noch einmal, Esc = beenden.
const { app, BrowserWindow, screen } = require('electron')
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
const v = process.argv.slice(2).find((a) => /^[1-5]$/.test(a)) ?? '5'
app.whenReady().then(async () => {
  const alle = screen.getAllDisplays().map((d) => d.bounds)
  const x = Math.min(...alle.map((b) => b.x)), y = Math.min(...alle.map((b) => b.y))
  const breite = Math.max(...alle.map((b) => b.x + b.width)) - x, hoehe = Math.max(...alle.map((b) => b.y + b.height)) - y
  const f = new BrowserWindow({ x, y, width: breite, height: hoehe, frame: false, backgroundColor: '#000000', skipTaskbar: true, resizable: false,
    webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' } })
  f.setAlwaysOnTop(true, 'screen-saver'); f.setBounds({ x, y, width: breite, height: hoehe })
  f.webContents.on('before-input-event', (e, ein) => { if (ein.key === 'Escape') app.quit() })
  await f.loadURL(`http://localhost:5179/intro.html?auto&v=${v}`)
})
app.on('window-all-closed', () => app.quit())
