// Exakter Umriss des Reaktors MIT moosigem Steinkranz (Intro, 05.11.2026 – Rückmeldung Auftraggeber: außen fehlten Teile,
// der Reaktor muss sich genau so zusammensetzen, wie er im fertigen Bild aussieht). Der Steinkranz reicht im Grundbild bis
// etwa Radius 315 und ist unregelmäßig; dahinter liegt türkiser Himmel. Innen (r < 292) gehört alles zum Reaktor, im
// Randband entscheidet die Farbe: türkis/blau = Himmel, grau/braun/moosgrün = Stein. Danach geglättet (Löcher zu,
// Fransen weg). Ergebnis: hud5/ebenen/reaktor-umriss.png (700×700 Szenen-Pixel um die Reaktormitte, weiß = Reaktor).
//   npx electron scripts/reaktor-umriss.cjs
const { app, BrowserWindow } = require('electron'), fs = require('fs'), path = require('path')
const W = path.join(__dirname, '..'), geo = require(path.join(W, 'hud5/ebenen/geometrie.json'))
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, webPreferences: { offscreen: true } })
  await w.loadURL('about:blank')
  const grund = fs.readFileSync(path.join(W, 'hud5/ebenen/grund.webp')).toString('base64'), k = geo.reaktor
  const png = await w.webContents.executeJavaScript(`(async()=>{const gr=await new Promise(o=>{const i=new Image();i.onload=()=>o(i);i.src='data:image/webp;base64,${grund}'});
    const N=700,c=document.createElement('canvas');c.width=N;c.height=N;const g=c.getContext('2d');const sx=gr.width/5760, sy=gr.height/1080;
    g.drawImage(gr,(${k.x}-350)*sx,(${k.y}-350)*sy,700*sx,700*sy,0,0,N,N);const d=g.getImageData(0,0,N,N).data;
    let m=new Float32Array(N*N);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const rr=Math.hypot(x-350,y-350),i=(y*N+x)*4,R=d[i],G=d[i+1],B=d[i+2];
      const wo=Math.abs(Math.atan2(x-350,350-y))*180/Math.PI; let s=0; if(rr<(wo<14?312:292)) s=1; /* oben: leuchtende Triquetra reicht weit nach außen */ else if(rr<345){const tuerkis=(G-R>16&&B-R>16)||(B>R+30); s=tuerkis?0:1}
      m[y*N+x]=s}
    const glaetten=(a,rad)=>{const o=new Float32Array(N*N);for(let y=0;y<N;y++)for(let x=0;x<N;x++){let s=0,n=0;for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=N||Y>=N)continue;s+=a[Y*N+X];n++}o[y*N+x]=s/n}return o};
    let a=glaetten(m,3);for(let i=0;i<a.length;i++)a[i]=a[i]>0.55?1:0;   // Fransen weg
    a=glaetten(a,2);                                                       // weiche Kante (2 px)
    const out=g.createImageData(N,N);for(let i=0;i<N*N;i++){out.data[i*4]=out.data[i*4+1]=out.data[i*4+2]=255;out.data[i*4+3]=Math.round(Math.min(1,Math.max(0,(a[i]-0.2)/0.6))*255)}
    g.putImageData(out,0,0);return c.toDataURL()})()`)
  fs.writeFileSync(path.join(W, 'hud5/ebenen/reaktor-umriss.png'), Buffer.from(png.split(',')[1], 'base64')); console.log('ok'); app.quit()
})
