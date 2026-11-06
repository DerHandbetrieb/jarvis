// Testlauf der Entladung im Reaktor (06.11.2026): Fenster auf dem mittleren Bildschirm, Knöpfe unten für die Fassungen, Esc beendet.
// Vorher Vorschau-Server „hud5“ starten.   npx electron hud5/plasma-test.cjs
const { app, BrowserWindow, screen } = require('electron')
app.whenReady().then(async () => {
  const b = screen.getPrimaryDisplay().bounds
  const f = new BrowserWindow({ ...b, frame: false, backgroundColor: '#000000', title: 'L.O.K.I. Entladung Testlauf', webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: false } })
  f.setBounds(b); f.setAlwaysOnTop(true, 'screen-saver'); f.focus() // über der Taskleiste und allen Fenstern, Esc beendet
  f.webContents.on('before-input-event', (e, ein) => { if (ein.key === 'Escape') app.quit() })
  await f.loadURL('http://localhost:5179/vorschau.html?plasma=a')
})
app.on('window-all-closed', () => app.quit())
