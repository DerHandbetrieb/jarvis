// Hauptprogramm des Jarvis-Fensters (Electron, 03.11.2026). Anders als die Werkstatt-App zeigt Jarvis keine
// Online-Fassung, sondern die mitgelieferte Oberfläche aus dem Ordner dist (Adresse app://jarvis/) – Jarvis soll
// auch ohne Internet laufen. Beim Entwickeln (npm run electron:dev) lädt das Fenster den Vite-Server auf Port 5174
// (5173 gehört der Werkstatt-App, damit beide gleichzeitig laufen können).
// Immer bereit (Entscheidung Auftraggeber 03.11.2026): startet mit Windows unsichtbar (Argument --autostart), lebt als
// Symbol im Infobereich unten rechts; das X versteckt nur das Fenster, beendet wird über das Symbol.
const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, net, protocol, safeStorage, screen, shell, session } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { pathToFileURL } = require('node:url')
const jarvis = require('./jarvis.cjs')
const { erstelleWerkstatt, leseKonfig } = require('./werkstatt.cjs')
const { erstelleHudServer, hudSchluessel } = require('./hudserver.cjs')
const { erstelleKamera } = require('./kamera.cjs')
const { erstelleKameraLive } = require('./kameralive.cjs')
const { ueberwachen } = require('./vollbild.cjs')
const { Readable } = require('node:stream')
let kameraLive = null // Live-Bild fürs Dauer-HUD (04.11.2026)
const { findeWallpaperEngine, einrichten } = require('./wallpaper.cjs')
const { execFileSync } = require('node:child_process')
const HUD_PORT = 47820 // fest, damit das Wallpaper Loki findet (nur 127.0.0.1)
const hud = { schluessel: null }
/** nur, was das Dauer-HUD anzeigt (Auswahlliste) – von den Amazon-Problemen nur die Anzahl, kein Freitext (Prüf-Agent) */
function hudAuswahl(l) {
  const zahl = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
  return {
    geholt: l.geholt,
    aufgaben: { offen: zahl(l.aufgaben?.offen), neu: zahl(l.aufgaben?.neu), amazonAnzahl: (l.aufgaben?.amazonProbleme ?? []).length,
      wichtigste: (l.aufgaben?.wichtigste ?? []).slice(0, 5).map((w) => ({ titel: String(w.titel ?? '').slice(0, 120), faellig: w.faellig ?? null })) },
    lagerKnapp: (l.lagerKnapp ?? []).slice(0, 4).map((k) => ({ name: String(k.name ?? ''), variante: k.variante ?? null, bestand: zahl(k.bestand), meldebestand: zahl(k.meldebestand) })),
    verkauf: {
      gestern: { bestellungen: zahl(l.verkauf?.gestern?.bestellungen), stueck: zahl(l.verkauf?.gestern?.stueck), umsatzCent: zahl(l.verkauf?.gestern?.umsatzCent) },
      tage: (l.verkauf?.tage ?? []).map((t) => ({ tag: String(t.tag ?? ''), bestellungen: zahl(t.bestellungen), umsatzCent: zahl(t.umsatzCent) })),
      kanaele14: (l.verkauf?.kanaele14 ?? []).slice(0, 3).map((k) => ({ kanal: String(k.kanal ?? ''), bestellungen: zahl(k.bestellungen), umsatzCent: zahl(k.umsatzCent) })),
    },
    freigaben: zahl(l.freigaben),
    selbsttest: l.selbsttest ? { am: l.selbsttest.am, rot: zahl(l.selbsttest.rot) } : null,
  }
}

const istEntwicklung = !app.isPackaged && process.argv.includes('--dev')
const DEV_URL = 'http://localhost:5174/'
const APP_URL = 'app://jarvis/'
const DIST = path.join(__dirname, '..', 'dist')
const AUTOSTART_ARG = '--autostart'
const istAutostart = process.argv.includes(AUTOSTART_ARG)
let beenden = false // erst true, wenn wirklich beendet werden soll (Menü „Beenden“, Windows fährt herunter)
let tray = null
let trayZustand = { zustand: 'aus', mikrofon: false }
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }])

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

// ---------- Start-Sequenz (03.11.2026) ----------
// Ein randloses Fenster über alle drei Bildschirme (5760×1080), ganz oben – auch über der Taskleiste. So im Test über
// drei Bildschirme gemessen: 60 Bilder/s. Hat der PC nicht genau drei Full-HD-Bildschirme nebeneinander, zeigt das Fenster
// nur den mittleren Teil (Runen-Schild) auf dem Hauptbildschirm. Sicherheits-Ende: nach SEQUENZ_MAX ms wird es geschlossen.
const SEQUENZ_MAX = 70_000
let sequenzFenster = null
let sequenzWartend = null // Nachrichten an die Sequenz, solange ihre Seite noch lädt (sonst gingen sie verloren)
function anSequenz(kanal, daten) { const f = sequenzFenster; if (!f || f.isDestroyed()) return; if (sequenzWartend) sequenzWartend.push([kanal, daten]); else f.webContents.send(kanal, daten) }
let hauptRef = null // Hauptfenster (getAllWindows()[0] könnte während der Sequenz deren Fenster sein)
function sequenzStarten(lautstaerke) {
  if (sequenzFenster && !sequenzFenster.isDestroyed()) return false
  const alle = screen.getAllDisplays().map((d) => d.bounds).sort((a, b) => a.x - b.x)
  const x = Math.min(...alle.map((b) => b.x)), y = Math.min(...alle.map((b) => b.y))
  const breite = Math.max(...alle.map((b) => b.x + b.width)) - x, hoehe = Math.max(...alle.map((b) => b.y + b.height)) - y
  const drei = alle.length === 3 && alle.every((b) => b.width === 1920 && b.height === 1080) && breite === 5760 && hoehe <= 1090
  const flaeche = drei ? { x, y, width: breite, height: hoehe } : screen.getPrimaryDisplay().bounds
  const f = new BrowserWindow({
    ...flaeche, frame: false, show: false, backgroundColor: '#000000', skipTaskbar: true, resizable: false, movable: false, fullscreenable: false, hasShadow: false,
    webPreferences: {
      contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true,
      preload: path.join(__dirname, 'preload-sequenz.cjs'),
      backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required',
    },
  })
  sequenzFenster = f
  sequenzWartend = []
  f.webContents.once('did-finish-load', () => { const w = sequenzWartend ?? []; sequenzWartend = null; for (const [k, d] of w) f.webContents.send(k, d) })
  f.setAlwaysOnTop(true, 'screen-saver') // über der Taskleiste
  f.setBounds(flaeche)
  f.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  f.webContents.on('will-navigate', (event) => event.preventDefault())
  const sicherheit = setTimeout(() => { if (!f.isDestroyed()) f.close() }, SEQUENZ_MAX)
  f.on('closed', () => {
    clearTimeout(sicherheit)
    if (sequenzFenster === f) sequenzFenster = null
    // falls die Seite selbst nichts mehr melden konnte: Hauptfenster nicht warten lassen
    if (hauptRef && !hauptRef.isDestroyed()) hauptRef.webContents.send('sequenz-meldung', 'ende')
  })
  f.once('ready-to-show', () => { f.show(); f.focus() })
  const par = `?lautstaerke=${Math.max(0, Math.min(1, Number(lautstaerke) || 0)).toFixed(2)}${drei ? '' : '&ausschnitt=mitte'}`
  f.loadURL((istEntwicklung ? DEV_URL : APP_URL) + 'start-sequenz.html' + par)
  return true
}

function zeigen() {
  const fenster = hauptRef
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
  tray.setToolTip(`L.O.K.I. – ${TEXT[zustand] ?? zustand}${zustand !== 'aus' && !mikrofon ? ' (Mikrofon aus)' : ''}`)
  const fenster = hauptRef
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'L.O.K.I. öffnen', click: zeigen },
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
      // Live-Strom der Kamera nur für das unsichtbare Kamera-Fenster (Schlüssel in seiner Adresse, kameralive.cjs)
      const strom = /^kamera-strom\/([01])$/.exec(teil)
      if (strom) {
        if (!kameraLive?.erlaubt(new URL(anfrage.url).searchParams.get('s'))) return new Response('Nicht erlaubt', { status: 403 })
        return kamera.live(Number(strom[1])).then((s) => {
          if (!s) return new Response(null, { status: 204 })
          // bricht das Fenster ab (auch schon während der Anmeldung), sofort die Verbindung zur Kamera schließen
          if (anfrage.signal?.aborted) { s.abbrechen(); return new Response(null, { status: 204 }) }
          anfrage.signal?.addEventListener('abort', () => s.abbrechen(), { once: true })
          return new Response(Readable.toWeb(s.strom), { headers: { 'Content-Type': s.typ } })
        }, () => new Response(null, { status: 502 }))
      }
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
    hauptRef = hauptfenster
    jarvis.einrichten(hauptfenster, istAppAdresse)
    // bei Vollbild-Spielen Grafikspeicher freigeben (Stimme + Sprachmodell), danach Stimme wieder laden
    const vollbildAus = ueberwachen((an) => { if (an && sequenzFenster && !sequenzFenster.isDestroyed()) return; void jarvis.spielLaeuft(an) })
    app.on('will-quit', () => vollbildAus())

    const vonFenster = (e) => e.sender === hauptfenster.webContents && istAppAdresse(e.senderFrame?.url ?? '')
    tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'symbol', SYMBOL.aus)))
    tray.on('click', zeigen)
    trayAktualisieren()
    ipcMain.on('jarvis-zustand', (e, z) => {
      if (!vonFenster(e)) return
      trayZustand = { zustand: String(z?.zustand ?? 'aus'), mikrofon: !!z?.mikrofon }
      trayAktualisieren()
    })
    // Werkstatt-Anbindung (Etappe L1): Anmeldung + Lage im Hauptprozess, Sitzung verschlüsselt (safeStorage, asynchron).
    // Zugang (Adresse + öffentlicher Schlüssel) aus .env.werkstatt (nicht in Git; im Installer als resources/werkstatt.env).
    const konfigDatei = app.isPackaged ? path.join(process.resourcesPath, 'werkstatt.env') : path.join(__dirname, '..', '.env.werkstatt')
    // verschlüsselte Datei in Lokis Datenordner (safeStorage = Windows-Anmeldespeicher), für Werkstatt-Sitzung und Kamera
    const verschluesselt = (datei) => ({
      lesen: async () => {
        if (!fs.existsSync(datei) || !(await safeStorage.isAsyncEncryptionAvailable())) return null
        const { result, shouldReEncrypt } = await safeStorage.decryptStringAsync(fs.readFileSync(datei))
        if (shouldReEncrypt) fs.writeFileSync(datei, await safeStorage.encryptStringAsync(result))
        return result
      },
      schreiben: async (text) => {
        // ohne Verschlüsselung nie im Klartext speichern (false → Hinweis „nach Neustart neu eintragen“)
        if (!(await safeStorage.isAsyncEncryptionAvailable())) return false
        // erst Zwischendatei, dann umbenennen – ein Absturz beim Schreiben hinterlässt keine kaputte Datei
        fs.writeFileSync(datei + '.neu', await safeStorage.encryptStringAsync(text))
        fs.renameSync(datei + '.neu', datei)
        return true
      },
      loeschen: async () => { fs.rmSync(datei, { force: true }) },
    })
    const werkstatt = erstelleWerkstatt({
      konfig: leseKonfig(fs.existsSync(konfigDatei) ? fs.readFileSync(konfigDatei, 'utf8') : ''),
      speicher: verschluesselt(path.join(app.getPath('userData'), 'werkstatt-sitzung.bin')),
    })
    werkstatt.beiAenderung((s) => { if (!hauptfenster.isDestroyed()) hauptfenster.webContents.send('werkstatt-aenderung', s) })
    void werkstatt.laden()
    ipcMain.handle('werkstatt-status', (e) => (vonFenster(e) ? werkstatt.status() : null))
    ipcMain.handle('werkstatt-verbinden', async (e, d) => { if (!vonFenster(e)) return null; await werkstatt.verbinden(String(d?.email ?? ''), String(d?.passwort ?? '')); return werkstatt.status() })
    ipcMain.handle('werkstatt-code', async (e, c) => { if (!vonFenster(e)) return null; await werkstatt.code(String(c ?? '')); return werkstatt.status() })
    ipcMain.handle('werkstatt-trennen', async (e) => { if (!vonFenster(e)) return null; await werkstatt.trennen(); return werkstatt.status() })
    // höchstens 2 Minuten alt, sonst frisch (Morgen-Lage, Anzeigen); „Jetzt aktualisieren“ holt immer frisch
    ipcMain.handle('werkstatt-lage', async (e, erzwingen) => (vonFenster(e) ? werkstatt.aktuelleLage(erzwingen ? 0 : 120_000) : null))

    // Kamera (Etappe 5/6): Standbild der Reolink im Hauptprozess; Zugangsdaten verschlüsselt, die Oberfläche sieht sie nie
    const kamera = erstelleKamera({ speicher: verschluesselt(path.join(app.getPath('userData'), 'kamera.bin')) })
    // Live-Bild fürs Dauer-HUD: unsichtbares Fenster spielt die Ströme ab und liefert JPEG-Bilder (kameralive.cjs)
    kameraLive = erstelleKameraLive({
      adresse: (s) => `${APP_URL}kamera-live.html?s=${s}`,
      beimStoppen: () => kamera.liveSchliessen(),
      erstelleFenster: (url) => {
        const f = new BrowserWindow({ show: false, width: 640, height: 360, skipTaskbar: true, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, preload: path.join(__dirname, 'preload-kamera.cjs'), backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' } })
        f.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
        f.webContents.on('will-navigate', (event) => event.preventDefault())
        f.loadURL(url)
        return f
      },
    })
    ipcMain.on('kamera-live-bild', (e, kanal, daten) => kameraLive.empfangen(e.sender, kanal, daten))
    void kamera.laden()
    ipcMain.handle('kamera-status', (e) => (vonFenster(e) ? kamera.status() : null))
    ipcMain.handle('kamera-einrichten', async (e, d) => (vonFenster(e) ? kamera.einrichten({ adresse: d?.adresse, benutzer: d?.benutzer, passwort: d?.passwort, name: d?.name }) : null))
    ipcMain.handle('kamera-bild', async (e) => {
      if (!vonFenster(e)) return null
      const b = await kamera.bild()
      return { ...kamera.status(), vorschau: b ? `data:image/jpeg;base64,${b.toString('base64')}` : null }
    })
    ipcMain.handle('kamera-entfernen', async (e) => (vonFenster(e) ? kamera.entfernen() : null))

    // Dauer-HUD (Web-Wallpaper in Wallpaper Engine): Gegenstelle nur auf 127.0.0.1 mit Zugriffsschlüssel. Liefert die
    // zwischengespeicherte Werkstatt-Lage (höchstens 1 Stunde alt) und das Wetter (Open-Meteo, alle 15 Minuten).
    let hudWetter = null
    const wetterHolen = async () => {
      try {
        const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=49.2&longitude=9.5&current=temperature_2m,weather_code,cloud_cover&timezone=Europe%2FBerlin', { signal: AbortSignal.timeout(15_000) })
        const c = r.ok ? (await r.json())?.current : null
        if (c) hudWetter = { ort: 'Öhringen', grad: c.temperature_2m ?? null, code: c.weather_code ?? null, wolken: c.cloud_cover ?? 0, geholt: Date.now() }
      } catch { /* nächster Versuch in 15 Minuten */ }
    }
    void wetterHolen(); setInterval(() => void wetterHolen(), 15 * 60_000)
    try { hud.schluessel = hudSchluessel(fs, path.join(app.getPath('userData'), 'hud-schluessel')) } catch (f) { console.error('Dauer-HUD-Schlüssel:', f?.message); hud.schluessel = require('node:crypto').randomBytes(32).toString('hex') }
    const hudServer = erstelleHudServer({
      port: HUD_PORT, schluessel: hud.schluessel,
      liveBild: async (kanal, nach) => (kamera.status().eingerichtet ? kameraLive.bildNach(kanal, nach) : null),
      daten: async () => {
        const l = werkstatt.lage()
        const k = kamera.status()
        return { zeit: new Date().toISOString(), werkstatt: l && Date.now() - l.geholt < 60 * 60_000 ? hudAuswahl(l) : null, wetter: hudWetter, kamera: k.eingerichtet ? { name: k.name } : null, loki: { ...trayZustand } }
      },
      // roter Knopf im Wallpaper: wie „Mikrofon aus/an“ im Infobereich, beim Stummschalten verstummt Loki auch sofort
      stumm: async () => {
        if (hauptfenster.isDestroyed()) return { ...trayZustand }
        hauptfenster.webContents.send('jarvis-stumm-knopf')
        // Vorhersage bis zum nächsten echten Stand: war Loki aus, startet er erst (Mikrofon noch zu)
        const aus = ['aus', 'fehler', 'laedt'].includes(trayZustand.zustand)
        return aus ? { zustand: 'laedt', mikrofon: false } : { zustand: trayZustand.zustand, mikrofon: !trayZustand.mikrofon }
      },
      kamera: () => kamera.bild(),
    })
    hudServer.start().catch(() => { /* Port belegt – Dauer-HUD zeigt dann „Loki nicht verbunden“ */ })
    app.on('will-quit', () => { void hudServer.stop(); kameraLive?.stoppen() })
    // Knopf „Dauer-HUD in Wallpaper Engine einrichten“: legt das Wallpaper als lokales Projekt an (ändert nicht das aktive)
    ipcMain.handle('hud-einrichten', (e) => {
      if (!vonFenster(e)) return null
      const leseSteamPfad = () => {
        try { return /SteamPath\s+REG_SZ\s+(.+)/.exec(execFileSync(path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'reg.exe'), ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'], { encoding: 'utf8' }))?.[1]?.trim().replace(/\//g, '\\') ?? null } catch { return null }
      }
      const we = findeWallpaperEngine({ fs, leseSteamPfad })
      if (!we) return { ok: false, meldung: 'Wallpaper Engine wurde auf diesem PC nicht gefunden (Steam).' }
      const quelle = app.isPackaged ? path.join(process.resourcesPath, 'dauer-hud') : path.join(__dirname, '..', 'dist-hud')
      if (!fs.existsSync(path.join(quelle, 'dauer-hud.html'))) return { ok: false, meldung: 'Das Dauer-HUD fehlt in diesem Programm (nicht mitgebaut).' }
      try {
        einrichten({ fs, we, quelle, port: HUD_PORT, schluessel: hud.schluessel })
        return { ok: true, meldung: 'Eingerichtet. In Wallpaper Engine unter „Installiert“ das Wallpaper „L.O.K.I. Dauer-HUD“ auswählen (über alle Bildschirme).' }
      } catch (f) { console.error('Dauer-HUD einrichten:', f); return { ok: false, meldung: 'Einrichten hat nicht geklappt (Details im Protokoll).' } }
    })

    // Start-Sequenz holt die Werkstatt-Lage für ihre Anzeigen (nur das Sequenzfenster; höchstens 1 Stunde alt, sonst frisch)
    ipcMain.handle('sequenz-lage', async (e) => (sequenzFenster && !sequenzFenster.isDestroyed() && e.sender === sequenzFenster.webContents ? werkstatt.aktuelleLage(60 * 60_000) : null))
    // Start-Sequenz: nur das Hauptfenster darf sie starten und ihr Lokis Spruch schicken; Meldungen der Sequenz gehen ans Hauptfenster
    ipcMain.handle('sequenz-starten', (e, lautstaerke) => (vonFenster(e) ? sequenzStarten(lautstaerke) : false))
    ipcMain.on('sequenz-gruss', (e, d) => {
      if (!vonFenster(e) || !(d?.samples instanceof Float32Array)) return
      anSequenz('sequenz-gruss', { samples: d.samples, sampleRate: Number(d.sampleRate) || 24000 })
    })
    ipcMain.on('sequenz-kein-gruss', (e) => { if (vonFenster(e)) anSequenz('sequenz-kein-gruss') })
    ipcMain.on('sequenz-meldung', (e, art) => {
      const f = sequenzFenster
      if (!f || e.sender !== f.webContents) return
      const a = String(art)
      console.log(`Start-Sequenz: ${a}`)
      if (['gruss', 'ohne-gruss', 'abgebrochen'].includes(a)) hauptfenster.webContents.send('sequenz-meldung', a)
      if (a === 'ende' && !f.isDestroyed()) f.close() // „ende“ meldet dann das closed-Ereignis
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
