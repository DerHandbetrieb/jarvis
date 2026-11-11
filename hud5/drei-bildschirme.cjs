// Szene über alle drei Bildschirme ansehen (05.11.2026): randloses Fenster über die ganze Fläche, ganz oben.
// Vorher Vorschau-Server „hud5“ (Port 5179) starten. Esc oder Klick beendet. Tasten 1–4: Loki hört/denkt/spricht/aus.
//   npx electron hud5/drei-bildschirme.cjs
// Regentropfen-Entwürfe (11.11.2026): HUD_FRAGE="station=regen&regen=0.9&tropfen=a" setzen; Tasten A–D wechseln den Entwurf.
const { app, BrowserWindow, screen } = require('electron')
const frage = process.env.HUD_FRAGE ?? ''
app.whenReady().then(async () => {
  const alle = screen.getAllDisplays().map((d) => d.bounds)
  const x = Math.min(...alle.map((b) => b.x)), y = Math.min(...alle.map((b) => b.y))
  const breite = Math.max(...alle.map((b) => b.x + b.width)) - x, hoehe = Math.max(...alle.map((b) => b.y + b.height)) - y
  const f = new BrowserWindow({ x, y, width: breite, height: hoehe, frame: false, backgroundColor: '#000000', skipTaskbar: true, resizable: false,
    webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: false } })
  f.setAlwaysOnTop(true, 'screen-saver'); f.setBounds({ x, y, width: breite, height: hoehe })
  const laden = async (zusatz) => {
    const q = new URLSearchParams(frage); for (const [k, v] of Object.entries(zusatz)) q.set(k, v)
    await f.loadURL('http://localhost:5179/vorschau.html?voll&' + q.toString())
    const t = q.get('tropfen')
    const hinweis = t ? `Entwurf ${t.toUpperCase()} · Tasten A–D wechseln · Esc beendet` : ''
    await f.webContents.executeJavaScript(`document.getElementById('info').style.display='none'; addEventListener('mousedown', () => window.close());
      if (${JSON.stringify(hinweis)}) { const d = document.createElement('div'); d.textContent = ${JSON.stringify(hinweis)};
        Object.assign(d.style, { position: 'fixed', left: '50%', top: '14px', transform: 'translateX(-50%)', font: '600 18px Bahnschrift, sans-serif', color: '#e8fdff', background: 'rgba(0,0,0,0.6)', padding: '6px 14px', borderRadius: '6px', zIndex: 99 }); document.body.appendChild(d) }`)
  }
  f.webContents.on('before-input-event', (e, ein) => {
    if (ein.type !== 'keyDown') return
    if (ein.key === 'Escape') app.quit()
    if (frage.includes('tropfen') && /^[abcd]$/i.test(ein.key)) void laden({ tropfen: ein.key.toLowerCase() })
  })
  await laden({})
})
app.on('window-all-closed', () => app.quit())
