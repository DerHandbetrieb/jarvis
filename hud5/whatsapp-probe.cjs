// Probe (06.11.2026, Wunsch Auftraggeber): WhatsApp als schmales, schräg gestelltes Fenster rechts neben Kamera und PV,
// über die volle Höhe. Durchsichtiges, randloses Fenster; darin das offizielle WhatsApp Web als eingebettete Seite, gekippt
// wie die Infofenster (hud5/tafeln.js: 24°). Keine Automatik, nichts wird mitgelesen – der Login liegt nur in der
// Sitzung „persist:whatsapp“. Prüft: Sieht es gut aus? Kommen Klicks und Tippen trotz Kippen richtig an?
//   node_modules\electron\dist\electron.exe hud5\whatsapp-probe.cjs [neigung] [zoom]     (Beispiel: … 0 0.8 = gerade)
// Beenden: Knopf × oben im Fenster.
const { app, BrowserWindow, screen, session } = require('electron')
const argumente = process.argv.slice(1).filter((a) => /^[\d.]+$/.test(a))
const NEIGUNG = Number(argumente[0] ?? 24), ZOOM = Number(argumente[1] ?? 0.72)
const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'

const seite = `<!doctype html><html><head><meta charset="utf-8"><style>
  html, body { margin: 0; height: 100%; background: transparent; overflow: hidden; }
  #buehne { position: absolute; inset: 0; perspective: 2090px; perspective-origin: 50% 50%; }
  #tafel { position: absolute; left: 6px; right: 6px; top: 16px; bottom: 16px; transform-origin: 100% 50%; transform: rotateY(-${NEIGUNG}deg);
    border-radius: 10px; overflow: hidden; background: #071218; box-shadow: 0 0 0 1px rgba(120,235,255,.6), 0 0 26px rgba(95,246,255,.25); }
  #kopf { height: 26px; background: linear-gradient(#0a2028, #06141a); color: #7eefff; font: 600 12px Bahnschrift, 'Segoe UI', sans-serif; line-height: 26px; padding: 0 10px; -webkit-app-region: drag; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(242,176,74,.6); }
  #zu { color: #f2b04a; cursor: pointer; -webkit-app-region: no-drag; padding: 0 6px; }
  webview { position: absolute; left: 0; right: 0; top: 27px; bottom: 0; }
</style></head><body><div id="buehne"><div id="tafel"><div id="kopf">WHATSAPP<span id="zu" onclick="window.close()">×</span></div>
<webview id="w" src="https://web.whatsapp.com/" partition="persist:whatsapp" useragent="${CHROME}"></webview></div></div>
<script>const w = document.getElementById('w'); w.addEventListener('dom-ready', () => w.setZoomFactor(${ZOOM}))</script></body></html>`

app.whenReady().then(async () => {
  session.fromPartition('persist:whatsapp').setPermissionRequestHandler((_w, recht, antwort) => antwort(recht === 'notifications'))
  const alle = screen.getAllDisplays().map((d) => d.bounds).sort((a, b) => a.x - b.x), r = alle[alle.length - 1]
  // Platz rechts neben Kamera und PV: Fläche ab 5285 von 5760, also 1445 ab der linken Kante des rechten Bildschirms
  const f = new BrowserWindow({ x: r.x + 1440, y: r.y + 8, width: 400, height: r.height - 16, frame: false, transparent: true, resizable: true, hasShadow: false, skipTaskbar: false, title: 'WhatsApp (Probe)', webPreferences: { webviewTag: true, contextIsolation: true } })
  await f.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(seite))
  f.on('closed', () => app.quit())
})
