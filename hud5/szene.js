// Szene „Mystic Aurora“ für Dauer-HUD und Intro (05.11.2026, Grafikpaket des Auftraggebers, Bauplan in
// recherche/grafik-v5-bestand-2026-11-05.md). Eine Fläche 5760×1080 über alle drei Bildschirme. Intro und Wallpaper
// zeichnen dieselbe Szene mit denselben Koordinaten – so endet das Intro bildgleich im Wallpaper.
// Vorgabe Auftraggeber: alles ruhig, nur leichte Bewegung – Aurora schwingt, Reaktor pulsiert und leuchtet, Runenring
// um den Reaktor dreht sich, die Runenringe links/rechts wandern langsam, Wasser glitzert, Nebel zieht über den See.
// Teuer ist nur das Vorzeichnen beim Laden (Runen mit Leuchten, Nebel); je Bild wird nur gedreht und überblendet.
import { FOLGE, rune } from './runen.js'

export const B = 5760, H = 1080
const CYAN = '#5ff6ff'

function bildLaden(url) {
  return new Promise((ok, fehler) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fehler(new Error('Bild fehlt: ' + url)); i.src = url })
}
function leinwand(b, h) { const c = document.createElement('canvas'); c.width = b; c.height = h; return c }

/** Runenring vorzeichnen: volle Runde, Runen tangential, mit Lichthof (einmal beim Laden) */
function ringBild(r, hoehe, anzahl, versatz = 0) {
  const rand = hoehe * 2, gr = Math.ceil(2 * (r + rand))
  const c = leinwand(gr, gr), g = c.getContext('2d')
  g.translate(gr / 2, gr / 2)
  g.lineCap = 'round'; g.lineJoin = 'round'
  for (let durchgang = 0; durchgang < 2; durchgang++) {
    // erst weiches Leuchten, dann der scharfe helle Kern
    g.strokeStyle = durchgang ? '#d8fdff' : CYAN
    g.lineWidth = durchgang ? Math.max(1.4, hoehe * 0.075) : hoehe * 0.12
    g.shadowColor = CYAN; g.shadowBlur = durchgang ? hoehe * 0.35 : hoehe * 0.9
    for (let i = 0; i < anzahl; i++) {
      const w = (i / anzahl) * Math.PI * 2
      g.save(); g.rotate(w); g.translate(0, -r)
      rune(g, FOLGE[(i + versatz) % FOLGE.length], hoehe)
      g.restore()
    }
  }
  return c
}

/** weicher Nebel: viele unscharfe Flecken, nahtlos waagerecht wiederholbar */
function nebelBild(b, h, zufall) {
  const c = leinwand(b, h), g = c.getContext('2d')
  for (let i = 0; i < 70; i++) {
    const x = zufall() * b, y = h * (0.35 + zufall() * 0.5), rx = 120 + zufall() * 380, ry = 18 + zufall() * 45
    for (const dx of [-b, 0, b]) {
      const v = g.createRadialGradient(x + dx, y, 0, x + dx, y, rx)
      v.addColorStop(0, `rgba(150,215,230,${0.05 + zufall() * 0.06})`); v.addColorStop(1, 'rgba(150,215,230,0)')
      g.save(); g.translate(x + dx, y); g.scale(1, ry / rx); g.translate(-(x + dx), -y)
      g.fillStyle = v; g.fillRect(x + dx - rx, y - rx, 2 * rx, 2 * rx); g.restore()
    }
  }
  return c
}

/** Deckkraft-Maske: in der Mitte voll, links/rechts über `rand` Pixel weich auslaufend */
function randMaske(b, h, rand) {
  const c = leinwand(b, h), g = c.getContext('2d'), v = g.createLinearGradient(0, 0, b, 0)
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(rand / b, '#000'); v.addColorStop(1 - rand / b, '#000'); v.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = v; g.fillRect(0, 0, b, h)
  return c
}

function zufallsfolge(s) { return () => { s = (s * 16807) % 2147483647; return s / 2147483647 } }

/** Szene laden. basis = Ordner mit grund.webp, aurora.webp … und geometrie.json (relativ zur Seite) */
export async function ladeSzene(basis) {
  const geo = await (await fetch(basis + 'geometrie.json')).json()
  const namen = ['grund', ...Object.keys(geo.ebenen)]
  const bilder = Object.fromEntries(await Promise.all(namen.map(async (n) => [n, await bildLaden(basis + n + '.webp')])))
  const zufall = zufallsfolge(7)
  return {
    geo, bilder,
    ringMitte: ringBild(geo.ringMitte.r, 30, 24),
    ringLinks: ringBild(geo.ringLinks.r, 38, 34, 4),
    ringRechts: ringBild(geo.ringRechts.r, 38, 36, 12),
    nebel: nebelBild(2400, 300, zufall),
    nebelStreifen: leinwand(2520, 400),
    nebelMaske: randMaske(2520, 400, 300),
  }
}

function ebene(g, s, name, alpha, mischung = 'lighter') {
  const e = s.geo.ebenen[name], bild = s.bilder[name]
  if (!e || !bild || alpha <= 0.002) return
  g.globalAlpha = Math.min(1, alpha); g.globalCompositeOperation = mischung
  g.drawImage(bild, e.x, e.y, e.b, e.h)
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
}

/** gedrehter Ring, nur im Bogen zwischen von..bis (Grad, 0 = rechts, im Uhrzeigersinn) sichtbar */
function ring(g, bild, k, winkel, alpha, von, bis) {
  if (alpha <= 0.002) return
  g.save()
  if (von != null) {
    // Ausschnitt: Kreisring-Sektor um die Runen, weiche Enden über Verlauf der Deckkraft wären teurer – Bogen reicht
    g.beginPath(); g.moveTo(k.x, k.y); g.arc(k.x, k.y, k.r + 60, (von * Math.PI) / 180, (bis * Math.PI) / 180); g.closePath(); g.clip()
  }
  g.globalAlpha = alpha; g.globalCompositeOperation = 'lighter'
  g.translate(k.x, k.y); g.rotate(winkel)
  g.drawImage(bild, -bild.width / 2, -bild.height / 2)
  g.restore()
}

/**
 * Ein Bild zeichnen. t = Sekunden. opt:
 *  versatz  – waagerechte Verschiebung (einzelner Bildschirm: 1920 → nur die Mitte)
 *  loki     – 'hoert' | 'denkt' | 'spricht' | 'aus' (Reaktor reagiert)
 *  pegel    – 0..1 Lautstärke, während Loki spricht
 *  an       – Anteile fürs Intro (0..1): { grund, aurora, runen, reaktor, nebel }, fehlt = 1
 */
export function zeichneSzene(g, s, t, opt = {}) {
  const an = { grund: 1, aurora: 1, runen: 1, reaktor: 1, nebel: 1, ...opt.an }
  const { geo, bilder } = s
  g.save()
  g.setTransform(1, 0, 0, 1, -(opt.versatz ?? 0), 0)
  g.fillStyle = '#000'; g.fillRect(0, 0, B, H)
  g.globalAlpha = an.grund; g.drawImage(bilder.grund, 0, 0, B, H); g.globalAlpha = 1

  // Aurora: die Lichter liegen schon im Grundbild; eine zweite, additive Lage atmet (Periode ~22 s) in weichen
  // Wellen von links nach rechts und treibt als Ganzes leicht seitlich. Nur die Deckkraft ändert sich je Streifen –
  // benachbarte Streifen unterscheiden sich kaum, darum keine sichtbaren Kanten.
  const au = geo.ebenen.aurora
  if (au && an.aurora > 0) {
    const streifen = 96, sb = au.b / streifen, bild = bilder.aurora, fx = bild.width / au.b
    const drift = Math.sin(t * 0.13) * 12
    g.globalCompositeOperation = 'lighter'
    for (let i = 0; i < streifen; i++) {
      const welle = 0.5 * Math.sin(t * 0.28 + i * 0.09) + 0.5 * Math.sin(t * 0.17 - i * 0.05)
      g.globalAlpha = an.aurora * Math.max(0, 0.18 + 0.2 * welle)
      g.drawImage(bild, i * sb * fx, 0, sb * fx, bild.height, au.x + i * sb + drift, au.y, sb, au.h)
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
  }

  // Wasser: Glitzern atmet langsam (8 s), Nebel zieht darüber
  ebene(g, s, 'wasser', 0.35 + 0.35 * Math.sin(t * 0.78) * an.reaktor)
  if (an.nebel > 0) {
    // nur über dem See des mittleren Bildschirms, an den Seiten weich ausgeblendet (über den Fenstern wirkt Nebel trüb)
    // erst in eine eigene Leinwand, dann mit weichen Rändern (Maske) auf die Szene
    const n = s.nebel, st = s.nebelStreifen, sg = st.getContext('2d'), x0 = 1920 - 300, y = 640
    sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, st.width, st.height)
    for (const [tempo, dy, hoch, deck] of [[9, 0, 1, 0.55], [5, 110, 0.8, 0.35]]) {
      sg.globalAlpha = deck
      for (let px = -((t * tempo + dy * 8) % n.width); px < st.width; px += n.width) sg.drawImage(n, px, dy, n.width, n.height * hoch)
    }
    sg.globalAlpha = 1; sg.globalCompositeOperation = 'destination-in'; sg.drawImage(s.nebelMaske, 0, 0)
    g.globalAlpha = an.nebel; g.globalCompositeOperation = 'screen'
    g.drawImage(st, x0, y)
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
  }

  // Runenringe: Mitte dreht sich (eine Runde in 4 Minuten, beim Nachdenken schneller), Seiten wandern gegenläufig
  const denkt = opt.loki === 'denkt' ? 1 : 0
  const drehMitte = t * ((Math.PI * 2) / 240) * (1 + denkt * 3)
  const runenHell = an.runen * (0.85 + 0.15 * Math.sin(t * 0.63))
  ring(g, s.ringMitte, geo.ringMitte, drehMitte, runenHell, 158, 382) // unten frei: dort liegen See und Spiegelung
  ring(g, s.ringLinks, geo.ringLinks, -t * ((Math.PI * 2) / 600), runenHell, geo.ringLinks.von, 360 + geo.ringLinks.bis)
  ring(g, s.ringRechts, geo.ringRechts, t * ((Math.PI * 2) / 600), runenHell, geo.ringRechts.von, geo.ringRechts.bis)

  // Reaktor: Kern pulsiert (2,8 s), Lichthof atmet; spricht Loki, folgt beides seiner Stimme
  const spricht = opt.loki === 'spricht' ? Math.min(1, opt.pegel ?? 0.5) : 0
  const puls = 0.5 + 0.5 * Math.sin((t * Math.PI * 2) / 2.8)
  const aus = opt.loki === 'aus' ? 0.4 : 1
  ebene(g, s, 'halo', an.reaktor * aus * (0.25 + 0.35 * puls + 0.6 * spricht))
  ebene(g, s, 'kern', an.reaktor * aus * (0.15 + 0.25 * puls + 0.5 * spricht))
  g.restore()
}
