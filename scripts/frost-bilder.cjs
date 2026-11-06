// Frost-Bilder (Magnific, grafik/magnific/frost/) für Dauer-HUD aufbereiten → hud5/ebenen/frost-*.webp
//   npx electron scripts/frost-bilder.cjs
const { app, BrowserWindow } = require('electron'), fs = require('fs'), path = require('path')
const W = path.join(__dirname, '..'), Q = path.join(W, 'grafik/magnific/frost'), Z = path.join(W, 'hud5/ebenen')
const LISTE = [['eis3', 'frost-eis'], ['blume2', 'frost-blume1'], ['blume1', 'frost-blume2'], ['blume3', 'frost-blume3']]
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, webPreferences: { offscreen: true } })
  await w.loadURL('about:blank')
  for (const [von, nach] of LISTE) {
    const d = fs.readFileSync(path.join(Q, von + '.png')).toString('base64')
    const u = await w.webContents.executeJavaScript(`new Promise(r=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=i.width;c.height=i.height;c.getContext('2d').drawImage(i,0,0);r(c.toDataURL('image/webp',0.85))};i.src='data:image/png;base64,${d}'})`)
    fs.writeFileSync(path.join(Z, nach + '.webp'), Buffer.from(u.split(',')[1], 'base64'))
  }
  console.log('ok'); app.quit()
})
