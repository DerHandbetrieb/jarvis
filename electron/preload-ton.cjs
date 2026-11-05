// Brücke für das unsichtbare Ton-Fenster (05.11.2026, electron/tonabgriff.cjs): darf nur 64 Lautstärke-Werte abgeben.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('tonFenster', {
  werte: (d) => { if (d instanceof Uint8Array && d.length === 64) ipcRenderer.send('ton-werte', d) },
  meldung: (grund) => { if (grund === 'kein-ton' || grund === 'fehler') ipcRenderer.send('ton-meldung', grund) },
})
