// Brücke für das unsichtbare Kamera-Fenster (04.11.2026, electron/kameralive.cjs): darf nur fertige JPEG-Bilder abgeben.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('kameraFenster', {
  bild: (kanal, daten) => { if ((kanal === 0 || kanal === 1) && daten instanceof Uint8Array) ipcRenderer.send('kamera-live-bild', kanal, daten) },
  // nur feste Gründe fürs Kamera-Protokoll (hängt / Fehler des Abspielers)
  meldung: (kanal, grund) => { if ((kanal === 0 || kanal === 1) && (grund === 'haengt' || grund === 'fehler')) ipcRenderer.send('kamera-live-meldung', kanal, grund) },
})
