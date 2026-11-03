// Hauptprogramm des Jarvis-Fensters (Electron, 03.11.2026). Anders als die Werkstatt-App zeigt Jarvis keine
// Online-Fassung, sondern die mitgelieferte Oberfläche aus dem Ordner dist (Adresse app://jarvis/) – Jarvis soll
// auch ohne Internet laufen. Beim Entwickeln (npm run electron:dev) lädt das Fenster den Vite-Server auf Port 5174
// (5173 gehört der Werkstatt-App, damit beide gleichzeitig laufen können).
// Immer bereit (Entscheidung Auftraggeber 03.11.2026): startet mit Windows unsichtbar (Argument --autostart), lebt als
// Symbol im Infobereich unten rechts; das X versteckt nur das Fenster, beendet wird über das Symbol.
const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, net, protocol, shell, session } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { pathToFileURL } = require('node:url')
const jarvis = require('./jarvis.cjs')

const istEntwicklung = !app.isPackaged && process.argv.includes('--dev')
const DEV_URL = 'http://localhost:5174/'
const APP_URL = 'app://jarvis/'
const DIST = path.join(__dirname, '..', 'dist')
const AUTOSTART_ARG = '--autostart'
const istAutostart = process.argv.includes(AUTOSTART_ARG)
let beenden = false // erst true, wenn wirklich beendet werden soll (Menü „Beenden“, Windows fährt herunter)
let tray = null
let trayZustand = { zustand: 'aus', mikrofon: false }
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
      // Loki arbeitet meist im versteckten Fenster: nicht ausbremsen, und Ton ohne vorherigen Klick abspielen dürfen
      // (Begrüßung beim Rechnerstart)
      backgroundThrottling: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
  })
  // beim Rechnerstart unsichtbar bleiben – Loki hört trotzdem zu
  fenster.once('ready-to-show', () => { if (!istAutostart) fenster.show() })
  // Windows fährt herunter / meldet ab → wirklich beenden, sonst würde das Verstecken das Herunterfahren aufhalten
  // (will-quit kommt dabei unter Windows nicht – darum Lokis Stimme hier gleich mit beenden, Prüf-Agent)
  fenster.on('session-end', () => { beenden = true; jarvis.stimmeBeenden() })
  fenster.on('close', (event) => {
    if (beenden) return
    event.preventDefault()
    fenster.hide()
  })
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

function zeigen() {
  const [fenster] = BrowserWindow.getAllWindows()
  if (!fenster) return
  if (fenster.isMinimized()) fenster.restore()
  fenster.show()
  fenster.focus()
}

const SYMBOL = { an: 'loki-an.png', aus: 'loki-aus.png', fehler: 'loki-stoerung.png' }
const TEXT = { aus: 'aus', laedt: 'wird vorbereitet', bereit: 'hört zu', spricht: 'spricht', denkt: 'denkt nach', fehler: 'Störung' }

/** Symbol, Text und Menü im Infobereich an Lokis Zustand anpassen */
function trayAktualisieren() {
  if (!tray) return
  const { zustand, mikrofon } = trayZustand
  const art = zustand === 'fehler' ? 'fehler' : zustand !== 'aus' && mikrofon ? 'an' : 'aus'
  tray.setImage(nativeImage.createFromPath(path.join(__dirname, 'symbol', SYMBOL[art])))
  tray.setToolTip(`Loki – ${TEXT[zustand] ?? zustand}${zustand !== 'aus' && !mikrofon ? ' (Mikrofon aus)' : ''}`)
  const [fenster] = BrowserWindow.getAllWindows()
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Loki öffnen', click: zeigen },
    { label: mikrofon ? 'Mikrofon aus' : 'Mikrofon an', enabled: zustand !== 'aus' && zustand !== 'fehler', click: () => fenster?.webContents.send('jarvis-tray-mikrofon') },
    { type: 'separator' },
    { label: 'Beenden', click: () => { beenden = true; app.quit() } },
  ]))
}

/**
 * Autostart mit Windows (offizielle Electron-Funktion app.setLoginItemSettings, Eintrag unter „Autostart-Apps“).
 * Nur im installierten Programm – beim Entwickeln würde sonst electron.exe eingetragen.
 */
// Fester Name des Eintrags, damit der Uninstaller ihn wieder entfernen kann (build/installer.nsh)
const AUTOSTART_NAME = 'Jarvis'
const autostart = {
  verfuegbar: () => app.isPackaged,
  lesen: () => {
    if (!app.isPackaged) return false
    const s = app.getLoginItemSettings({ args: [AUTOSTART_ARG] })
    // im Task-Manager unter „Autostart-Apps“ deaktiviert → zählt als aus (Prüf-Agent)
    return s.openAtLogin && s.executableWillLaunchAtLogin !== false
  },
  setzen: (an) => { if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: !!an, enabled: !!an, args: [AUTOSTART_ARG], name: AUTOSTART_NAME }) },
}

// Nur eine Instanz gleichzeitig (sonst hören zwei Jarvis-Fenster dasselbe Mikrofon ab).
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  // Doppelklick auf das Desktop-Symbol, während Loki schon läuft → Fenster zeigen
  app.on('second-instance', zeigen)
  app.on('before-quit', () => { beenden = true })

  ipcMain.on('programm-version', (event) => {
    event.returnValue = app.getVersion()
  })
  // nur beim ersten Abruf je Programmlauf – lädt die Oberfläche neu (Absturz, Strg+R), keine zweite Begrüßung (Prüf-Agent)
  let beimStartAbgefragt = false
  ipcMain.on('programm-beim-start', (event) => {
    event.returnValue = istAutostart && !beimStartAbgefragt
    beimStartAbgefragt = true
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

    const vonFenster = (e) => e.sender === hauptfenster.webContents && istAppAdresse(e.senderFrame?.url ?? '')
    tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'symbol', SYMBOL.aus)))
    tray.on('click', zeigen)
    trayAktualisieren()
    ipcMain.on('jarvis-zustand', (e, z) => {
      if (!vonFenster(e)) return
      trayZustand = { zustand: String(z?.zustand ?? 'aus'), mikrofon: !!z?.mikrofon }
      trayAktualisieren()
    })
    ipcMain.handle('autostart-lesen', (e) => (vonFenster(e) ? { verfuegbar: autostart.verfuegbar(), an: autostart.lesen() } : null))
    ipcMain.handle('autostart-setzen', (e, an) => {
      if (!vonFenster(e)) return null
      autostart.setzen(an)
      return { verfuegbar: autostart.verfuegbar(), an: autostart.lesen() }
    })
    // beim allerersten Start des installierten Programms Autostart einschalten (Wunsch: ohne Klick bereit); danach
    // entscheidet nur noch der Schalter in den Einstellungen bzw. Windows („Autostart-Apps“)
    const marke = path.join(app.getPath('userData'), 'autostart-eingerichtet')
    if (app.isPackaged && !fs.existsSync(marke)) {
      try {
        autostart.setzen(true)
        fs.writeFileSync(marke, new Date().toISOString())
      } catch (f) {
        console.error('Autostart einrichten:', f)
      }
    }
  })

  // Fenster werden nur versteckt; beendet wird über das Symbol („Beenden“) oder wenn Windows herunterfährt
  app.on('window-all-closed', () => { if (beenden) app.quit() })
}
