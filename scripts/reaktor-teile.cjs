// Reaktor in seine echten Elemente zerlegen (Intro, Wunsch Auftraggeber 05.11.2026: „sauber an den Elementen getrennt“).
// Misst im Reaktor-Bild je Winkel, wo die dunkle Fuge zwischen Kern / Innenring / Spulenring / Steinring liegt, und wo
// die geraden Fugen zwischen den Steinblöcken sitzen. Ergebnis: hud5/ebenen/reaktor-teile.json (Radien je halbes Grad).
//   npx electron scripts/reaktor-teile.cjs
const { app, BrowserWindow } = require('electron'), fs = require('fs'), path = require('path')
const WURZEL = path.join(__dirname, '..'), geo = require(path.join(WURZEL, 'hud5/ebenen/geometrie.json'))
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, webPreferences: { offscreen: true } })
  await w.loadURL('about:blank')
  const bild = fs.readFileSync(path.join(WURZEL, 'hud5/ebenen/reaktor.webp')).toString('base64')
  const e = geo.ebenen.reaktor, k = geo.reaktor
  const erg = await w.webContents.executeJavaScript(`(async()=>{const i=await new Promise(o=>{const b=new Image();b.onload=()=>o(b);b.src='data:image/webp;base64,${bild}'});
    const S=2,c=document.createElement('canvas');c.width=i.width*S;c.height=i.height*S;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,c.width,c.height);g.imageSmoothingQuality='high';g.drawImage(i,0,0,c.width,c.height);
    const d=g.getImageData(0,0,c.width,c.height).data,cx=${k.x - e.x}*S,cy=${k.y - e.y}*S;
    const L=(x,y)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=c.width||y>=c.height)return 0;const p=(y*c.width+x)*4;return 0.3*d[p]+0.59*d[p+1]+0.11*d[p+2]};
    const n=720,grenze=(r0,r1)=>{const roh=[];for(let a=0;a<n;a++){const w=a/n*Math.PI*2-Math.PI/2;let best=r0,bv=1e9;
      for(let r=r0;r<=r1;r+=0.5){let s=0;for(const dr of [-1.5,-0.75,0,0.75,1.5])for(const dw of [-0.004,0,0.004])s+=L(cx+Math.cos(w+dw)*(r+dr)*S,cy+Math.sin(w+dw)*(r+dr)*S);if(s<bv){bv=s;best=r}}roh.push(best)}
      return roh.map((_,a)=>{const f=[];for(let k=-5;k<=5;k++)f.push(roh[(a+k+n)%n]);f.sort((x,y)=>x-y);return f[5]})};
    return {kern:grenze(58,72),innen:grenze(92,110),stein:grenze(196,230)}})()`)
  // gerade Fugen zwischen den Steinblöcken (gemessen 05.11.2026: innen und außen gleich, also radial) – Grad ab oben im Uhrzeigersinn
  const fugen = [12, 41, 76, 114, 247, 284, 320, 348]
  fs.writeFileSync(path.join(WURZEL, 'hud5/ebenen/reaktor-teile.json'), JSON.stringify({ schritte: 720, ...Object.fromEntries(Object.entries(erg).map(([n, v]) => [n, v.map((x) => Math.round(x * 2) / 2)])), fugen }))
  console.log('kern', Math.min(...erg.kern), Math.max(...erg.kern), 'innen', Math.min(...erg.innen), Math.max(...erg.innen), 'stein', Math.min(...erg.stein), Math.max(...erg.stein))
  app.quit()
})
