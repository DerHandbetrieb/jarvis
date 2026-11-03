// Hauptprogramm des Jarvis-Fensters (Electron, 03.11.2026). Anders als die Werkstatt-App zeigt Jarvis keine
// Online-Fassung, sondern die mitgelieferte Oberfläche aus dem Ordner dist (Adresse app://jarvis/) – Jarvis soll
// auch ohne Internet laufen. Beim Entwickeln (npm run electron:dev) lädt das Fenster den Vite-Server auf Port 5174
// (5173 gehört der Werkstatt-App, damit beide gleichzeitig laufen können).
const { app, BrowserWindow, ipcMain, net, protocol, shell, session } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { pathToFileURL } = require('node:url')
const jarvis = require('./jarvis.cjs')

const istEntwicklung = !app.isPackaged && process.argv.includes('--dev')
const DEV_URL = 'http://localhost:5174/'
const APP_URL = 'app://jarvis/'
const DIST = path.join(__dirname, '..', 'dist')
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }])

/** Nur diese Adressen darf das Fenster selbst ansteuern (alles andere öffnet den normalen Browser). */
function istAppAdresse(url) {
  return url.startsWith(APP_URL) || (istEntwicklung && url.startsWith(DEV_URL))
}

function externOeffnen(url) {
  if (url.startsWith('https://')) shell.openExternal(url)
}

function fensterErstellen() {
  const fenster = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 400,
    minHeight: 500,
    title: 'Jarvis',
    backgroundColor: '#101418',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      // Sicherheit: Die Oberfläche hat keinen Zugriff auf Windows-Dateien oder Programme – nur die Jarvis-Brücke.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })
  fenster.once('ready-to-show', () => fenster.show())
  fenster.webContents.setWindowOpenHandler(({ url }) => {
    externOeffnen(url)
    return { action: 'deny' }
  })
  fenster.webContents.on('will-navigate', (event, url) => {
    if (!istAppAdresse(url)) {
      event.preventDefault()
      externOeffnen(url)
    }
  })
  // auch Weiterleitungen und eingebettete Rahmen dürfen das Fenster nicht auf fremde Seiten bringen
  fenster.webContents.on('will-redirect', (event, url) => { if (!istAppAdresse(url)) event.preventDefault() })
  fenster.webContents.on('will-frame-navigate', (event) => { if (!event.isMainFrame && !istAppAdresse(event.url)) event.preventDefault() })
  fenster.loadURL(istEntwicklung ? DEV_URL : APP_URL + 'index.html')
  return fenster
}

// Nur eine Instanz gleichzeitig (sonst hören zwei Jarvis-Fenster dasselbe Mikrofon ab).
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [fenster] = BrowserWindow.getAllWindows()
    if (fenster) {
      if (fenster.isMinimized()) fenster.restore()
      fenster.focus()
    }
  })

  ipcMain.on('programm-version', (event) => {
    event.returnValue = app.getVersion()
  })

  app.whenReady().then(() => {
    // mitgelieferte Oberfläche ausliefern (nur Dateien aus dist, kein Weg aus dem Ordner heraus)
    protocol.handle('app', (anfrage) => {
      let teil = ''
      try { teil = decodeURIComponent(new URL(anfrage.url).pathname).replace(/^\/+/, '') } catch { return new Response('Ungültige Adresse', { status: 400 }) }
      const datei = path.normalize(path.join(DIST, teil || 'index.html'))
      if (datei !== DIST && !datei.startsWith(DIST + path.sep)) return new Response('Nicht erlaubt', { status: 403 })
      const istDatei = fs.existsSync(datei) && fs.statSync(datei).isFile()
      return net.fetch(pathToFileURL(istDatei ? datei : path.join(DIST, 'index.html')).toString())
    })

    // Keine Kamera, kein Standort usw. Einzige Ausnahme: das Mikrofon – nur Ton und nur für die eigene Oberfläche.
    // Der Ton bleibt auf dem PC (Erkennung lokal mit Whisper).
    const nurMikrofon = (permission, details) => permission === 'media' && istAppAdresse(details?.requestingUrl ?? details?.securityOrigin ?? '') && (details?.mediaTypes ?? []).length > 0 && details.mediaTypes.every((t) => t === 'audio')
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback, details) => callback(nurMikrofon(permission, details)))
    // auch bei den Prüfungen nur das Mikrofon erlauben, alles andere verneinen
    session.defaultSession.setPermissionCheckHandler((_wc, permission, origin, details) => permission === 'media' && istAppAdresse(origin + '/') && (details?.mediaType ?? 'audio') === 'audio')

    // Verbindungen der Oberfläche nach außen nur verschlüsselt (HTTPS/WSS). Downloads der Modelle und Ollama laufen
    // im Hauptprozess (net.fetch/fetch) und sind davon nicht betroffen.
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      const url = details.url
      const erlaubt =
        url.startsWith('https://') ||
        url.startsWith('wss://') ||
        url.startsWith('file://') ||
        url.startsWith('app://') ||
        url.startsWith('devtools://') ||
        url.startsWith('data:') ||
        url.startsWith('blob:') ||
        (istEntwicklung && (url.startsWith(DEV_URL) || url.startsWith('ws://localhost:5174')))
      callback({ cancel: !erlaubt })
    })

    const hauptfenster = fensterErstellen()
    jarvis.einrichten(hauptfenster, istAppAdresse)
  })

  app.on('window-all-closed', () => app.quit())
}
