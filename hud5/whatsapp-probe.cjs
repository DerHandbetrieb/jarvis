// Probe (06.11.2026, Wunsch Auftraggeber): WhatsApp als schmales, schräg gestelltes Fenster rechts neben Kamera und PV,
// über die volle Höhe. Durchsichtiges, randloses Fenster; darin das offizielle WhatsApp Web als eingebettete Seite, gekippt
// wie die Infofenster (hud5/tafeln.js: 24°). Test Auftraggeber: Tippen, Klicken, Ziehen klappen.
// Keine Automatik, nichts wird mitgelesen – der Login liegt nur in der Sitzung „persist:whatsapp“.
//   node_modules\electron\dist\electron.exe hud5\whatsapp-probe.cjs [neigung] [zoom] [überabtastung]
// Schärfe: Die Seite wird in doppelter Größe gezeichnet und verkleinert (überabtastung 2), sonst verwischt das Kippen die
// Schrift. Rahmen wie „Glas & Goldkante“ (hud5/rahmen.js): Ecken oben links und unten rechts abgeschrägt, Goldkanten.
// Höhe: Griffe oben und unten (durchsichtige Fenster lassen sich unter Windows nicht zuverlässig am Rand ziehen).
// Beenden: Knopf × oben im Fenster.
const { app, BrowserWindow, ipcMain, screen, session } = require('electron'), path = require('path')
const argumente = process.argv.slice(1).filter((a) => /^[\d.]+$/.test(a))
const NEIGUNG = Number(argumente[0] ?? 24), ZOOM = Number(argumente[1] ?? 0.72), FEIN = Number(argumente[2] ?? 2)
const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
const E = 18 // Abschrägung wie bei den Infofenstern
const form = (e) => `polygon(${e}px 0, 100% 0, 100% calc(100% - ${e}px), calc(100% - ${e}px) 100%, 0 100%, 0 ${e}px)`

const seite = `<!doctype html><html><head><meta charset="utf-8"><style>
  html, body { margin: 0; height: 100%; background: transparent; overflow: hidden; }
  #buehne { position: absolute; inset: 0; perspective: 2090px; perspective-origin: 50% 50%; }
  #tafel { position: absolute; left: 6px; right: 6px; top: 16px; bottom: 16px; transform-origin: 100% 50%; transform: rotateY(-${NEIGUNG}deg); clip-path: ${form(E)}; background: rgba(120,235,255,.75); }
  #innen { position: absolute; inset: 1px; clip-path: ${form(E - 1)}; background: #06141a; overflow: hidden; }
  #kopf { position: absolute; left: 0; right: 0; top: 0; height: 28px; background: linear-gradient(#0a2630, #06141a); color: #7eefff; font: 600 12px Bahnschrift, 'Segoe UI', sans-serif; line-height: 28px; padding: 0 12px 0 ${E + 6}px; box-sizing: border-box; -webkit-app-region: drag; display: flex; justify-content: space-between; }
  #zu { color: #f2b04a; cursor: pointer; -webkit-app-region: no-drag; padding: 0 6px; }
  .gold { position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, rgba(242,176,74,0), #f2b04a 50%, rgba(242,176,74,0)); pointer-events: none; z-index: 3; }
  #fein { position: absolute; left: 0; top: 29px; width: calc(100% * ${FEIN}); height: calc((100% - 29px) * ${FEIN}); transform: scale(${1 / FEIN}); transform-origin: 0 0; }
  webview { position: absolute; inset: 0; }
  .griff { position: absolute; left: 0; right: 0; height: 14px; cursor: ns-resize; z-index: 9; }
  .griff::after { content: ''; position: absolute; left: 50%; width: 56px; margin-left: -28px; top: 5px; height: 3px; border-radius: 2px; background: rgba(242,176,74,.55); opacity: 0; transition: opacity .2s; }
  .griff:hover::after { opacity: 1; }
</style></head><body><div id="buehne"><div id="tafel"><div id="innen">
  <div class="gold" style="top:0"></div><div class="gold" style="bottom:0"></div>
  <div id="kopf">WHATSAPP<span id="zu" onclick="window.close()">×</span></div>
  <div id="fein"><webview id="w" src="https://web.whatsapp.com/" partition="persist:whatsapp" useragent="${CHROME}"></webview></div>
</div></div></div>
<div class="griff" id="oben" style="top:0"></div><div class="griff" id="unten" style="bottom:0"></div>
<script>
  const w = document.getElementById('w'); w.addEventListener('dom-ready', () => w.setZoomFactor(${ZOOM * FEIN}))
  for (const [id, kante] of [['oben', 'oben'], ['unten', 'unten']]) {
    const g = document.getElementById(id); let start = null
    g.addEventListener('pointerdown', (e) => { g.setPointerCapture(e.pointerId); start = e.screenY; fenster.anfang() })
    g.addEventListener('pointermove', (e) => { if (start != null) fenster.hoehe(kante, e.screenY - start) })
    g.addEventListener('pointerup', () => { start = null })
  }
</script></body></html>`

app.whenReady().then(async () => {
  session.fromPartition('persist:whatsapp').setPermissionRequestHandler((_w, recht, antwort) => antwort(recht === 'notifications'))
  const alle = screen.getAllDisplays().map((d) => d.bounds).sort((a, b) => a.x - b.x), r = alle[alle.length - 1]
  // Platz rechts neben Kamera und PV: Fläche ab 5285 von 5760, also 1445 ab der linken Kante des rechten Bildschirms
  const f = new BrowserWindow({ x: r.x + 1440, y: r.y + 8, width: 400, height: r.height - 16, frame: false, transparent: true, resizable: true, hasShadow: false, title: 'WhatsApp (Probe)',
    webPreferences: { webviewTag: true, contextIsolation: true, preload: path.join(__dirname, 'whatsapp-preload.cjs') } })
  let basis = null
  ipcMain.on('wa-anfang', () => { basis = f.getBounds() })
  ipcMain.on('wa-hoehe', (_e, kante, dy) => {
    if (!basis) return
    const d = Math.round(Number(dy) || 0), h = Math.max(420, kante === 'oben' ? basis.height - d : basis.height + d)
    f.setBounds({ x: basis.x, width: basis.width, height: h, y: kante === 'oben' ? basis.y + basis.height - h : basis.y })
  })
  await f.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(seite))
  f.on('closed', () => app.quit())
})
