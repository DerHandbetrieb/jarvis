// Speichert die acht Stilproben als Bilddateien (03.11.2026): je Stil ein Gesamtbild (5760×1080) und je Bildschirm ein
// Ausschnitt (1920×1080) in standbilder/bilder/ (nicht in Git, jederzeit neu erzeugbar).
// Vorher muss der Vorschau-Server „start-sequenz“ (Port 5177) laufen.
// Aufruf aus dem Projektordner:  npx electron vorschau/start-sequenz/standbilder/speichern.cjs
const { app, BrowserWindow } = require('electron')
const fs = require('fs'), path = require('path')

app.whenReady().then(async () => {
  const ziel = path.join(__dirname, 'bilder'); fs.mkdirSync(ziel, { recursive: true })
  const f = new BrowserWindow({ show: false, width: 1200, height: 800, webPreferences: { contextIsolation: true, sandbox: true } })
  await f.loadURL('http://localhost:5177/standbilder/?s=1')
  await new Promise((r) => setTimeout(r, 1500))
  for (let i = 0; i < 8; i++) {
    const bilder = await f.webContents.executeJavaScript(`(() => {
      window.stilprobe.zeige(${i}); const c = document.getElementById('bild'), aus = [c.toDataURL('image/jpeg', 0.9)]
      for (let s = 0; s < 3; s++) { const t = document.createElement('canvas'); t.width = 1920; t.height = 1080; t.getContext('2d').drawImage(c, s * 1920, 0, 1920, 1080, 0, 0, 1920, 1080); aus.push(t.toDataURL('image/jpeg', 0.9)) }
      return aus })()`)
    const namen = ['gesamt', 'links', 'mitte', 'rechts']
    bilder.forEach((d, k) => fs.writeFileSync(path.join(ziel, `stil${i + 1}-${namen[k]}.jpg`), Buffer.from(d.split(',')[1], 'base64')))
    console.log('Stil', i + 1, 'gespeichert')
  }
  app.quit()
})
