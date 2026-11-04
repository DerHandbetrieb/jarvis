// Brücke zwischen Windows-Programm und Oberfläche (aus der Werkstatt-App übernommen, 03.11.2026).
// Gibt nur die Versionsnummer und die Jarvis-Funktionen weiter (Stimme, Zuhören, Fragen, Lokis Stimme ein/aus,
// Autostart mit Windows, Zustand fürs Symbol im Infobereich), sonst nichts.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('jarvisDesktop', {
  version: ipcRenderer.sendSync('programm-version'),
  /** true, wenn Windows das Programm beim Anmelden gestartet hat (Begrüßung + Morgen-Lage ohne Klick) */
  beimStart: !!ipcRenderer.sendSync('programm-beim-start'),
  autostart: {
    lesen: () => ipcRenderer.invoke('autostart-lesen'),
    setzen: (an) => ipcRenderer.invoke('autostart-setzen', !!an),
  },
  /** Werkstatt-Anbindung: Anmeldung (Passwort wird nur weitergereicht, nie gespeichert) und fertige Lage – keine Tokens */
  werkstatt: {
    status: () => ipcRenderer.invoke('werkstatt-status'),
    verbinden: (email, passwort) => ipcRenderer.invoke('werkstatt-verbinden', { email: String(email), passwort: String(passwort) }),
    code: (code) => ipcRenderer.invoke('werkstatt-code', String(code)),
    trennen: () => ipcRenderer.invoke('werkstatt-trennen'),
    lage: (erzwingen) => ipcRenderer.invoke('werkstatt-lage', !!erzwingen),
    beiAenderung: (fn) => {
      const h = (_e, s) => fn(s)
      ipcRenderer.on('werkstatt-aenderung', h)
      return () => ipcRenderer.removeListener('werkstatt-aenderung', h)
    },
  },
  /** Kamera (Standbild): Zugangsdaten werden nur weitergereicht, verschlüsselt im Hauptprozess gespeichert, nie zurückgegeben */
  kamera: {
    status: () => ipcRenderer.invoke('kamera-status'),
    einrichten: (d) => ipcRenderer.invoke('kamera-einrichten', { adresse: String(d?.adresse ?? ''), benutzer: String(d?.benutzer ?? ''), passwort: String(d?.passwort ?? ''), name: String(d?.name ?? '') }),
    bild: () => ipcRenderer.invoke('kamera-bild'),
    entfernen: () => ipcRenderer.invoke('kamera-entfernen'),
  },
  /** Dauer-HUD: als lokales Wallpaper in Wallpaper Engine anlegen */
  hud: { einrichten: () => ipcRenderer.invoke('hud-einrichten') },
  /** Start-Sequenz über alle Bildschirme (Lokis Spruch kommt live aus seiner Stimme ins Finale) */
  sequenz: {
    starten: (lautstaerke) => ipcRenderer.invoke('sequenz-starten', Number(lautstaerke)),
    gruss: (samples, sampleRate) => { if (samples instanceof Float32Array) ipcRenderer.send('sequenz-gruss', { samples, sampleRate: Number(sampleRate) }) },
    keinGruss: () => ipcRenderer.send('sequenz-kein-gruss'),
    beiMeldung: (fn) => {
      const h = (_e, art) => fn(String(art))
      ipcRenderer.on('sequenz-meldung', h)
      return () => ipcRenderer.removeListener('sequenz-meldung', h)
    },
  },
  jarvis: {
    /** Zustand an das Symbol im Infobereich melden */
    meldeZustand: (zustand, mikrofon) => ipcRenderer.send('jarvis-zustand', { zustand: String(zustand), mikrofon: !!mikrofon }),
    beiTrayMikrofon: (fn) => {
      const h = () => fn()
      ipcRenderer.on('jarvis-tray-mikrofon', h)
      return () => ipcRenderer.removeListener('jarvis-tray-mikrofon', h)
    },
    /** roter Knopf im Dauer-HUD: Loki stumm (Mikrofon aus, Sprechen sofort beenden) bzw. wieder an */
    beiStummKnopf: (fn) => {
      const h = () => fn()
      ipcRenderer.on('jarvis-stumm-knopf', h)
      return () => ipcRenderer.removeListener('jarvis-stumm-knopf', h)
    },
    status: () => ipcRenderer.invoke('jarvis-status'),
    vorbereiten: () => ipcRenderer.invoke('jarvis-vorbereiten'),
    sprechen: (a) => ipcRenderer.invoke('jarvis-sprechen', { text: String(a?.text ?? ''), piperText: String(a?.piperText ?? ''), tempo: Number(a?.tempo), stimme: a?.stimme === 'loki' ? 'loki' : 'piper' }),
    stimme: (an) => ipcRenderer.invoke('jarvis-stimme', !!an),
    gehoer: (a) => ipcRenderer.invoke('jarvis-gehoer', { an: !!a?.an, nurWorte: !!a?.nurWorte, art: a?.art === 'klein' ? 'klein' : 'turbo', worte: String(a?.worte ?? '').slice(0, 1000) }),
    zuhoeren: (an) => ipcRenderer.invoke('jarvis-zuhoeren', !!an),
    frage: (modell, nachrichten) => ipcRenderer.invoke('jarvis-frage', { modell: String(modell), nachrichten }),
    modellPruefen: (modell) => ipcRenderer.invoke('jarvis-modell-pruefen', String(modell)),
    modellHolen: (modell) => ipcRenderer.invoke('jarvis-modell-holen', String(modell)),
    protokoll: (zeile) => ipcRenderer.send('jarvis-protokoll', String(zeile ?? '').slice(0, 600)),
    ton: (stueck) => { if (stueck instanceof Float32Array) ipcRenderer.send('jarvis-ton', stueck) },
    beiErkannt: (fn) => {
      const h = (_e, d) => fn({ text: String(d?.text ?? ''), sekunden: Number(d?.sekunden ?? 0), art: d?.art === 'turbo' ? 'turbo' : 'klein' })
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
