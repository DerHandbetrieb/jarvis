// Brücke zwischen Windows-Programm und Oberfläche (aus der Werkstatt-App übernommen, 03.11.2026).
// Gibt nur die Versionsnummer und die Jarvis-Funktionen weiter (Stimme, Zuhören, Fragen, Lokis Stimme ein/aus), sonst nichts.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('jarvisDesktop', {
  version: ipcRenderer.sendSync('programm-version'),
  jarvis: {
    status: () => ipcRenderer.invoke('jarvis-status'),
    vorbereiten: () => ipcRenderer.invoke('jarvis-vorbereiten'),
    sprechen: (a) => ipcRenderer.invoke('jarvis-sprechen', { text: String(a?.text ?? ''), piperText: String(a?.piperText ?? ''), tempo: Number(a?.tempo), stimme: a?.stimme === 'loki' ? 'loki' : 'piper' }),
    stimme: (an) => ipcRenderer.invoke('jarvis-stimme', !!an),
    zuhoeren: (an) => ipcRenderer.invoke('jarvis-zuhoeren', !!an),
    frage: (modell, nachrichten) => ipcRenderer.invoke('jarvis-frage', { modell: String(modell), nachrichten }),
    ton: (stueck) => { if (stueck instanceof Float32Array) ipcRenderer.send('jarvis-ton', stueck) },
    beiErkannt: (fn) => {
      const h = (_e, d) => fn({ text: String(d?.text ?? ''), sekunden: Number(d?.sekunden ?? 0) })
      ipcRenderer.on('jarvis-erkannt', h)
      return () => ipcRenderer.removeListener('jarvis-erkannt', h)
    },
    beiFortschritt: (fn) => {
      const h = (_e, d) => fn({ name: String(d?.name ?? ''), anteil: Number(d?.anteil ?? 0) })
      ipcRenderer.on('jarvis-fortschritt', h)
      return () => ipcRenderer.removeListener('jarvis-fortschritt', h)
    },
  },
})
