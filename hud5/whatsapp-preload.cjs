// Probe WhatsApp-Fenster: nur die Griffe für die Fensterhöhe, sonst nichts (keine Daten von oder nach WhatsApp)
const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('fenster', {
  anfang: () => ipcRenderer.send('wa-anfang'),
  hoehe: (kante, dy) => ipcRenderer.send('wa-hoehe', String(kante), Number(dy)),
})
