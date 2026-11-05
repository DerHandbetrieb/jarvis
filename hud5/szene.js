// Szene „Mystic Aurora“ für Dauer-HUD und Intro (05.11.2026, Grafikpaket des Auftraggebers, Bauplan in
// recherche/grafik-v5-bestand-2026-11-05.md). Eine Fläche 5760×1080 über alle drei Bildschirme. Intro und Wallpaper
// zeichnen dieselbe Szene mit denselben Koordinaten – so endet das Intro bildgleich im Wallpaper.
// Vorgaben Auftraggeber: ruhig, aber lebendig – Aurora wogt, Reaktor pulsiert mit Lauflicht und vorsichtigen
// Elektrizitäts-Impulsen über den Spulen, Kernscheibe dreht, Rauch steigt hinter dem Reaktor auf, Nebelschwaden über
// dem See, Wasser kräuselt sich und spiegelt den Reaktor, Runenringe drehen und laufen weich aus bzw. aus dem Bild.
// Teuer ist nur das Vorzeichnen beim Laden; je Bild wird nur gedreht, verschoben und überblendet.
import { FOLGE, rune } from './runen.js'

export const B = 5760, H = 1080
const CYAN = '#5ff6ff'
const HORIZONT = 842 // Wasserlinie des Sees (Grundbild)


function bildLaden(url) {
  return new Promise((ok, fehler) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fehler(new Error('Bild fehlt: ' + url)); i.src = url })
}
function leinwand(b, h) { const c = document.createElement('canvas'); c.width = b; c.height = h; return c }
function zufallsfolge(s) { return () => { s = (s * 16807) % 2147483647; return s / 2147483647 } }

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
      g.save(); g.rotate((i / anzahl) * Math.PI * 2); g.translate(0, -r)
      rune(g, FOLGE[(i + versatz) % FOLGE.length], hoehe)
      g.restore()
    }
  }
  return c
}

/** Maske für den Ring um den Reaktor: oben voll, unten zum See hin weich ausgeblendet (keine harte Kante) */
function ringMaske(gr) {
  const c = leinwand(gr, gr), g = c.getContext('2d')
  const v = g.createConicGradient(Math.PI / 2, gr / 2, gr / 2) // beginnt unten, läuft im Uhrzeigersinn
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.07, 'rgba(0,0,0,0)'); v.addColorStop(0.2, '#000')
  v.addColorStop(0.8, '#000'); v.addColorStop(0.93, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = v; g.fillRect(0, 0, gr, gr)
  return c
}

/** weicher Nebel: viele unscharfe, flache Flecken, nahtlos waagerecht wiederholbar */
function nebelBild(b, h, zufall, anzahl = 80) {
  const c = leinwand(b, h), g = c.getContext('2d')
  for (let i = 0; i < anzahl; i++) {
    const x = zufall() * b, y = h * (0.3 + zufall() * 0.55), rx = 140 + zufall() * 420, ry = 16 + zufall() * 50
    const a = 0.06 + zufall() * 0.08
    for (const dx of [-b, 0, b]) {
      const v = g.createRadialGradient(x + dx, y, 0, x + dx, y, rx)
      v.addColorStop(0, `rgba(160,220,232,${a})`); v.addColorStop(0.6, `rgba(150,210,225,${a * 0.4})`); v.addColorStop(1, 'rgba(150,210,225,0)')
      g.save(); g.translate(x + dx, y); g.scale(1, ry / rx); g.translate(-(x + dx), -y)
      g.fillStyle = v; g.fillRect(x + dx - rx, y - rx, 2 * rx, 2 * rx); g.restore()
    }
  }
  return c
}

/** Deckkraft-Maske: in der Mitte voll, links/rechts über `rand` Pixel weich auslaufend */
function randMaske(b, h, rand, unten = 0) {
  const c = leinwand(b, h), g = c.getContext('2d'), v = g.createLinearGradient(0, 0, b, 0)
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(rand / b, '#000'); v.addColorStop(1 - rand / b, '#000'); v.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = v; g.fillRect(0, 0, b, h)
  if (unten) { // zusätzlich nach unten auslaufen (Spiegelung wird mit der Tiefe schwächer)
    g.globalCompositeOperation = 'destination-in'
    const u = g.createLinearGradient(0, 0, 0, h); u.addColorStop(0, '#000'); u.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = u; g.fillRect(0, 0, b, h)
  }
  return c
}

/** Maske für den Nebel auf dem See: unter dem Reaktor am dichtesten, zu den Seiten dünner, oben (Wasserlinie) weich */
function nebelMaske(b, h) {
  const c = leinwand(b, h), g = c.getContext('2d'), v = g.createLinearGradient(0, 0, b, 0)
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.15, 'rgba(0,0,0,0.45)'); v.addColorStop(0.5, '#000')
  v.addColorStop(0.85, 'rgba(0,0,0,0.45)'); v.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = v; g.fillRect(0, 0, b, h)
  g.globalCompositeOperation = 'destination-in'
  const u = g.createLinearGradient(0, 0, 0, h); u.addColorStop(0, 'rgba(0,0,0,0)'); u.addColorStop(0.12, '#000'); u.addColorStop(0.75, '#000'); u.addColorStop(1, 'rgba(0,0,0,0.5)')
  g.fillStyle = u; g.fillRect(0, 0, b, h)
  return c
}

/** Spiegelbild des Reaktors im See (einmal vorgezeichnet): gespiegelt, mit der Tiefe ausblendend */
function spiegelBild(bild, e) {
  const hoehe = H - HORIZONT, c = leinwand(e.b, hoehe), g = c.getContext('2d')
  // an der Wasserlinie gespiegelt: Bildzeile v des Reaktors (bei e.y + v) landet bei HORIZONT − e.y − v (hier lokal)
  g.save(); g.translate(0, HORIZONT - e.y); g.scale(1, -1); g.drawImage(bild, 0, 0, e.b, e.h); g.restore()
  g.globalCompositeOperation = 'destination-in'
  const u = g.createLinearGradient(0, 0, 0, hoehe); u.addColorStop(0, 'rgba(0,0,0,0.85)'); u.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = u; g.fillRect(0, 0, e.b, hoehe)
  return c
}

/** jede Rune einzeln mit Lichthof vorzeichnen (für die Bahnen links/rechts) */
function runenBilder(hoehe) {
  const gr = Math.ceil(hoehe * 2.4)
  return Object.fromEntries(FOLGE.map((z) => {
    const c = leinwand(gr, gr), g = c.getContext('2d')
    g.translate(gr / 2, gr / 2); g.lineCap = 'round'; g.lineJoin = 'round'
    for (let d = 0; d < 2; d++) {
      g.strokeStyle = d ? '#d8fdff' : CYAN; g.lineWidth = d ? Math.max(1.4, hoehe * 0.075) : hoehe * 0.12
      g.shadowColor = CYAN; g.shadowBlur = d ? hoehe * 0.35 : hoehe * 0.9
      rune(g, z, hoehe)
    }
    return [z, c]
  }))
}

/** gemessene Bahn (Punkte von oben nach unten) mit aufsummierter Länge, für gleichmäßigen Lauf */
function bahnVorbereiten(punkte, links) {
  const l = [0]
  for (let i = 1; i < punkte.length; i++) l.push(l[i - 1] + Math.hypot(punkte[i][0] - punkte[i - 1][0], punkte[i][1] - punkte[i - 1][1]))
  return { punkte, laenge: l, gesamt: l[l.length - 1], links }
}
/** Ort und Ausrichtung auf der Bahn bei Weg s (Rune zeigt mit dem Kopf nach außen) */
function aufBahn(b, s) {
  let i = 1
  while (i < b.laenge.length - 1 && b.laenge[i] < s) i++
  const [x0, y0] = b.punkte[i - 1], [x1, y1] = b.punkte[i], f = (s - b.laenge[i - 1]) / (b.laenge[i] - b.laenge[i - 1] || 1)
  // Richtung über ein paar Punkte gemittelt – ruhige Ausrichtung ohne Kippeln
  const a = b.punkte[Math.max(0, i - 3)], z = b.punkte[Math.min(b.punkte.length - 1, i + 2)]
  const dx = z[0] - a[0], dy = z[1] - a[1], n = Math.hypot(dx, dy) || 1
  const nx = (b.links ? -dy : dy) / n, ny = (b.links ? dx : -dx) / n // nach außen
  return { x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f, w: Math.atan2(nx, -ny) }
}

/** Szene laden. basis = Ordner mit grund.webp, aurora.webp … und geometrie.json (relativ zur Seite) */
export async function ladeSzene(basis) {
  const geo = await (await fetch(basis + 'geometrie.json')).json()
  const namen = ['grund', ...Object.keys(geo.ebenen)]
  const bilder = Object.fromEntries(await Promise.all(namen.map(async (n) => [n, await bildLaden(basis + n + '.webp')])))
  const zufall = zufallsfolge(7)
  const ringMitte = ringBild(geo.ringMitte.r, 30, 24)
  const nebelB = 3200
  return {
    geo, bilder,
    ringMitte, ringMitteMaske: ringMaske(ringMitte.width), ringPuffer: leinwand(ringMitte.width, ringMitte.height),
    runen: runenBilder(38),
    bahnLinks: bahnVorbereiten(geo.bahnLinks, true),
    bahnRechts: bahnVorbereiten(geo.bahnRechts, false),
    nebel: nebelBild(2400, 300, zufall),
    nebel2: nebelBild(2400, 300, zufall, 60),
    nebelStreifen: leinwand(nebelB, H - HORIZONT + 12), nebelMaske: nebelMaske(nebelB, H - HORIZONT + 12),
    spiegel: geo.ebenen.reaktor ? spiegelBild(bilder.reaktor, geo.ebenen.reaktor) : null,
    blitze: [], naechsterBlitz: 0,
  }
}

function ebene(g, s, name, alpha, mischung = 'lighter') {
  const e = s.geo.ebenen[name], bild = s.bilder[name]
  if (!e || !bild || alpha <= 0.002) return
  g.globalAlpha = Math.min(1, alpha); g.globalCompositeOperation = mischung
  g.drawImage(bild, e.x, e.y, e.b, e.h)
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
}

/** Aurora: zusätzliche additive Lage – Helligkeitswellen laufen die Vorhänge entlang, Strahlen flackern leicht, die
 *  Vorhänge heben/senken sich in einer weichen Welle (benachbarte Streifen unterscheiden sich < 1 px → keine Kanten) */
function aurora(g, s, t, anteil) {
  const au = s.geo.ebenen.aurora, bild = s.bilder.aurora
  if (!au || anteil <= 0) return
  const streifen = 192, sb = au.b / streifen, fx = bild.width / au.b
  const drift = Math.sin(t * 0.11) * 22
  g.globalCompositeOperation = 'lighter'
  for (let i = 0; i < streifen; i++) {
    const welle = 0.5 * Math.sin(t * 0.33 + i * 0.045) + 0.5 * Math.sin(t * 0.19 - i * 0.027)
    const strahl = Math.sin(t * 0.9 + i * 0.55) * Math.sin(t * 0.37 + i * 0.21)
    g.globalAlpha = anteil * Math.max(0, 0.22 + 0.32 * welle + 0.1 * strahl)
    const dy = 9 * Math.sin(t * 0.31 + i * 0.05), streck = 1 + 0.035 * Math.sin(t * 0.23 + i * 0.04)
    g.drawImage(bild, i * sb * fx, 0, sb * fx, bild.height, au.x + i * sb + drift, au.y + dy, sb + 0.5, au.h * streck)
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
}

/** Wasser: Glanzlichter kräuseln sich (zeilenweise seitlich versetzt), der Reaktor spiegelt sich im See */
function wasser(g, s, t, anteil) {
  const e = s.geo.ebenen.wasser, bild = s.bilder.wasser
  const zeile = 3
  if (e && bild) {
    g.globalCompositeOperation = 'lighter'
    const fy = bild.height / e.h
    for (let y = 0; y < e.h; y += zeile) {
      const tiefe = (e.y + y - HORIZONT) / (H - HORIZONT)
      const dx = Math.sin((e.y + y) * 0.21 - t * 1.7) * (1 + tiefe * 4) + Math.sin((e.y + y) * 0.07 + t * 0.6) * 2
      g.globalAlpha = anteil * (0.35 + 0.25 * Math.sin(t * 0.8 + y * 0.05))
      g.drawImage(bild, 0, y * fy, bild.width, zeile * fy, e.x + dx, e.y + y, e.b, zeile)
    }
  }
  const sp = s.spiegel, re = s.geo.ebenen.reaktor
  if (sp && re) {
    g.globalCompositeOperation = 'screen'
    for (let y = 0; y < sp.height; y += zeile) {
      const tiefe = y / sp.height
      const dx = Math.sin((HORIZONT + y) * 0.23 - t * 1.5) * (1.5 + tiefe * 7)
      g.globalAlpha = anteil * 0.32
      g.drawImage(sp, 0, y, sp.width, zeile, re.x + dx, HORIZONT + y, sp.width, zeile)
    }
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
}

/** Nebelschwaden auf dem Wasser (Rückmeldung Auftraggeber 05.11.2026: nur auf dem See, unterhalb des Reaktors recht
 *  dicht; der Reaktor bleibt klar) – drei Lagen in verschiedenem Tempo, oben und an den Seiten weich ausgeblendet */
function nebel(g, s, t, anteil) {
  const st = s.nebelStreifen, sg = st.getContext('2d'), x0 = 2880 - st.width / 2, y = HORIZONT - 12
  sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, st.width, st.height)
  for (const [bild, tempo, dy, hoch, deck] of [[s.nebel, 11, -70, 0.8, 1], [s.nebel2, -6, -20, 0.8, 0.85], [s.nebel, 4, 40, 0.7, 0.7]]) {
    sg.globalAlpha = deck
    const start = -(((t * tempo) % bild.width) + bild.width) % bild.width
    for (let px = start; px < st.width; px += bild.width) sg.drawImage(bild, px, dy, bild.width, bild.height * hoch)
  }
  sg.globalAlpha = 1; sg.globalCompositeOperation = 'destination-in'; sg.drawImage(s.nebelMaske, 0, 0)
  g.globalAlpha = anteil; g.globalCompositeOperation = 'screen'
  g.drawImage(st, x0, y)
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
}

/**
 * Elektrizität (Rückmeldung Auftraggeber 05.11.2026: größer um den Reaktor, deutlich seltener, aufbauend): Eine Entladung
 * entsteht an einer Stelle knapp außerhalb des Steinrings, baut sich auf und läuft dann ein Stück um den Reaktor herum
 * (Kopf vorn, Schweif folgt), knistert dabei und verlischt. Alle 8–18 s, öfter wenn Loki denkt oder spricht.
 */
const BLITZ_R = 352
function blitze(g, s, t, rate, anteil) {
  const r = s.geo.reaktor
  if (!s.naechsterBlitz) s.naechsterBlitz = t + 3
  if (t >= s.naechsterBlitz) {
    const richtung = Math.random() < 0.5 ? -1 : 1
    s.blitze.push({ von: t, dauer: 1.8 + Math.random() * 1.2, start: Math.random() * Math.PI * 2, weg: richtung * (1.6 + Math.random() * 1.8), rad: BLITZ_R + (Math.random() - 0.5) * 24 })
    s.naechsterBlitz = t + (8 + Math.random() * 10) / rate
  }
  s.blitze = s.blitze.filter((b) => t - b.von < b.dauer && t >= b.von)
  if (!s.blitze.length || anteil <= 0) return
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round'
  for (const b of s.blitze) {
    const f = (t - b.von) / b.dauer
    // Kopf läuft mit nachlassendem Tempo voraus, Schweif folgt verzögert; Helligkeit baut sich auf und verlischt
    const kopf = b.start + b.weg * (1 - Math.pow(1 - Math.min(1, f * 1.25), 2))
    const schweif = b.start + b.weg * Math.max(0, (f - 0.35) / 0.65) ** 1.5
    const hell = Math.min(1, f / 0.25) * Math.min(1, (1 - f) / 0.3) * (0.75 + 0.25 * Math.random())
    const spanne = kopf - schweif, teile = Math.max(4, Math.ceil(Math.abs(spanne) * 28)), punkte = []
    for (let i = 0; i <= teile; i++) {
      const w = schweif + (spanne * i) / teile, zack = (Math.random() - 0.5) * 18
      punkte.push([r.x + Math.cos(w) * (b.rad + zack), r.y + Math.sin(w) * (b.rad + zack)])
    }
    const linie = (pkt, breite, farbe, deck) => {
      g.beginPath(); pkt.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
      g.lineWidth = breite; g.strokeStyle = farbe; g.globalAlpha = deck * hell * anteil; g.stroke()
    }
    for (const [breite, farbe, deck] of [[10, CYAN, 0.1], [4, CYAN, 0.32], [1.4, '#f2ffff', 0.95]]) linie(punkte, breite, farbe, deck)
    // ab und zu ein Ast nach innen zum Stein bzw. nach außen
    if (Math.random() < 0.35) {
      const [ax, ay] = punkte[Math.floor(Math.random() * punkte.length)], w = Math.atan2(ay - r.y, ax - r.x), aus = Math.random() < 0.5 ? 1 : -1
      const ast = [[ax, ay]]
      for (let i = 1; i <= 4; i++) ast.push([ax + Math.cos(w) * aus * i * 9 + (Math.random() - 0.5) * 10, ay + Math.sin(w) * aus * i * 9 + (Math.random() - 0.5) * 10])
      linie(ast, 3, CYAN, 0.3); linie(ast, 1, '#f2ffff', 0.8)
    }
    // Lichtpunkt am Kopf
    const kx = r.x + Math.cos(kopf) * b.rad, ky = r.y + Math.sin(kopf) * b.rad, gl = g.createRadialGradient(kx, ky, 0, kx, ky, 26)
    gl.addColorStop(0, 'rgba(220,255,255,0.9)'); gl.addColorStop(1, 'rgba(95,246,255,0)')
    g.globalAlpha = hell * anteil; g.fillStyle = gl; g.fillRect(kx - 26, ky - 26, 52, 52)
  }
  g.restore()
}

/** Reaktor: Kernscheibe dreht, Lauflicht wandert durch die Zellen, Kern und Lichthof pulsieren, Blitze */
function reaktor(g, s, t, opt, anteil) {
  const r = s.geo.reaktor, kz = s.geo.ebenen.kernscheibe, ze = s.geo.ebenen.zellen
  const spricht = opt.loki === 'spricht' ? Math.min(1, opt.pegel ?? 0.5) : 0
  const denkt = opt.loki === 'denkt' ? 1 : 0, aus = opt.loki === 'aus' ? 0.35 : 1
  const puls = 0.5 + 0.5 * Math.sin((t * Math.PI * 2) / 2.8)
  const flackern = 0.9 + 0.1 * Math.sin(t * 23) * Math.sin(t * 7.3)
  // Kernscheibe (runde Mitte mit den Lichtpunkten) dreht sich langsam gegen den Uhrzeigersinn
  if (kz && anteil > 0) {
    g.save(); g.translate(r.x, r.y); g.rotate(-t * ((Math.PI * 2) / 50) * (1 + denkt * 2))
    g.drawImage(s.bilder.kernscheibe, kz.x - r.x, kz.y - r.y, kz.b, kz.h); g.restore()
  }
  // Lauflicht durch die blauen Zellen zwischen den Spulen (16 Sektoren)
  if (ze && anteil > 0) {
    const sektoren = 16, kopf = t * 1.1 * (1 + denkt * 1.5)
    g.globalCompositeOperation = 'lighter'
    for (let i = 0; i < sektoren; i++) {
      const w0 = (i / sektoren) * Math.PI * 2, w1 = ((i + 1) / sektoren) * Math.PI * 2, mitte = (w0 + w1) / 2
      const naehe = Math.pow(Math.max(0, Math.cos(mitte - kopf)), 6)
      const a = anteil * aus * (0.18 + 0.55 * naehe + 0.12 * puls + 0.5 * spricht)
      if (a < 0.01) continue
      g.save(); g.beginPath(); g.moveTo(r.x, r.y); g.arc(r.x, r.y, 230, w0, w1); g.closePath(); g.clip()
      g.globalAlpha = Math.min(1, a); g.drawImage(s.bilder.zellen, ze.x, ze.y, ze.b, ze.h); g.restore()
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
  }
  ebene(g, s, 'halo', anteil * aus * flackern * (0.35 + 0.5 * puls + 0.7 * spricht))
  ebene(g, s, 'kern', anteil * aus * flackern * (0.25 + 0.45 * puls + 0.6 * spricht))
  blitze(g, s, t, (1 + denkt * 2 + spricht * 3) * aus, anteil)
}

/** Runen wandern links/rechts entlang der gemessenen Bahn im Band und laufen oben und unten aus dem Bild */
function seitenRunen(g, s, b, t, tempo, alpha, versatz) {
  if (alpha <= 0.002) return
  const abstand = 112, anzahl = Math.ceil(b.gesamt / abstand) + 1
  g.save(); g.globalAlpha = alpha; g.globalCompositeOperation = 'lighter'
  for (let i = 0; i < anzahl; i++) {
    const weg = (((i * abstand + t * tempo) % (anzahl * abstand)) + anzahl * abstand) % (anzahl * abstand)
    if (weg > b.gesamt) continue
    const p = aufBahn(b, weg)
    if (p.y < -60 || p.y > H + 60) continue
    // jede Rune behält ihr Zeichen, während sie wandert (Nummer zählt mit dem Umlauf weiter)
    const runde = Math.floor((i * abstand + t * tempo) / (anzahl * abstand))
    const bild = s.runen[FOLGE[(((i - runde * anzahl + versatz) % FOLGE.length) + FOLGE.length * 99) % FOLGE.length]]
    g.setTransform(1, 0, 0, 1, 0, 0); g.translate(p.x - (s.versatz ?? 0), p.y); g.rotate(p.w)
    g.drawImage(bild, -bild.width / 2, -bild.height / 2)
  }
  g.restore()
}

/** Ring um den Reaktor: dreht sich, läuft unten zum See hin weich aus */
function mittelRing(g, s, winkel, alpha) {
  if (alpha <= 0.002) return
  const p = s.ringPuffer, pg = p.getContext('2d'), k = s.geo.ringMitte, gr = p.width
  pg.globalCompositeOperation = 'source-over'; pg.clearRect(0, 0, gr, gr)
  pg.save(); pg.translate(gr / 2, gr / 2); pg.rotate(winkel); pg.drawImage(s.ringMitte, -gr / 2, -gr / 2); pg.restore()
  pg.globalCompositeOperation = 'destination-in'; pg.drawImage(s.ringMitteMaske, 0, 0)
  g.globalAlpha = alpha; g.globalCompositeOperation = 'lighter'
  g.drawImage(p, k.x - gr / 2, k.y - gr / 2)
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
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
  g.save()
  g.setTransform(1, 0, 0, 1, -(opt.versatz ?? 0), 0)
  g.fillStyle = '#000'; g.fillRect(0, 0, B, H)
  g.globalAlpha = an.grund; g.drawImage(s.bilder.grund, 0, 0, B, H); g.globalAlpha = 1

  aurora(g, s, t, an.aurora)
  // aufsteigender Rauch hinter dem Reaktor entfernt (Rückmeldung Auftraggeber 05.11.2026: Reaktor soll klar bleiben)
  ebene(g, s, 'reaktor', an.grund, 'source-over') // deckt den Rauch hinter dem Reaktor ab
  wasser(g, s, t, an.reaktor)
  nebel(g, s, t, an.nebel)
  reaktor(g, s, t, opt, an.reaktor)

  const denkt = opt.loki === 'denkt' ? 1 : 0
  const hell = an.runen * (0.85 + 0.15 * Math.sin(t * 0.63))
  mittelRing(g, s, t * ((Math.PI * 2) / 240) * (1 + denkt * 3), hell)
  s.versatz = opt.versatz ?? 0
  seitenRunen(g, s, s.bahnLinks, t, -6, hell, 4) // links nach oben, rechts nach unten – gegenläufig wie die Mitte
  seitenRunen(g, s, s.bahnRechts, t, 6, hell, 12)
  g.restore()
}
