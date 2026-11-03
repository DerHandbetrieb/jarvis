// Brücke für das Fenster der Start-Sequenz (03.11.2026). Gibt nur das Nötigste weiter: Lokis Spruch (Tondaten) empfangen,
// „kein Spruch“ empfangen und Meldungen zurückschicken (gruss / ohne-gruss / abgebrochen / ende). Kein Datei- oder
// Programmzugriff.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('jarvisSequenz', {
  beiGruss: (fn) => { ipcRenderer.on('sequenz-gruss', (_e, d) => { if (d?.samples instanceof Float32Array) fn(d.samples, Number(d.sampleRate) || 24000) }) },
  beiKeinGruss: (fn) => { ipcRenderer.on('sequenz-kein-gruss', () => fn()) },
  melde: (art) => ipcRenderer.send('sequenz-meldung', String(art)),
  /** Werkstatt-Lage für die Anzeigen (nur Zahlen und Titel, keine Anmeldedaten) – null ohne Verbindung */
  lage: () => ipcRenderer.invoke('sequenz-lage'),
})
