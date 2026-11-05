// Szene „Mystic Aurora“ für Dauer-HUD und Intro (05.11.2026, Grafikpaket des Auftraggebers, Bauplan in
// recherche/grafik-v5-bestand-2026-11-05.md). Eine Fläche 5760×1080 über alle drei Bildschirme. Intro und Wallpaper
// zeichnen dieselbe Szene mit denselben Koordinaten – so endet das Intro bildgleich im Wallpaper.
// Vorgaben Auftraggeber: ruhig, aber lebendig – Aurora wogt, Reaktor pulsiert mit Lauflicht und vorsichtigen
// Elektrizitäts-Impulsen über den Spulen, Kernscheibe dreht, Rauch steigt hinter dem Reaktor auf, Nebelschwaden über
// dem See, Wasser kräuselt sich und spiegelt den Reaktor, Runenringe drehen und laufen weich aus bzw. aus dem Bild.
// Teuer ist nur das Vorzeichnen beim Laden; je Bild wird nur gedreht, verschoben und überblendet.
import { FOLGE, rune } from './runen.js'
import { textBreite, zeichen, wetterSymbol, wetterArt as wetterWort, zeitAngaben } from './ringschrift.js'
import { bergnebel, erstelleWetter, wetterArt, zeichneFrost, zeichneWetterHinten } from './wetter.js'

export const B = 5760, H = 1080
const CYAN = '#5ff6ff'
const HORIZONT = 842 // Wasserlinie des Sees (Grundbild)
const HIMMEL = 470 // unter dieser Höhe beginnen die Berggipfel – Sternschnuppen nur darüber


function bildLaden(url) {
  return new Promise((ok, fehler) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fehler(new Error('Bild fehlt: ' + url)); i.src = url })
}
function leinwand(b, h) { const c = document.createElement('canvas'); c.width = b; c.height = h; return c }
/** Vorzeichnen in doppelter Auflösung (bewegte Teile bleiben beim Drehen scharf, Wunsch Auftraggeber 05.11.2026) */
const FEIN = 2
function zufallsfolge(s) { return () => { s = (s * 16807) % 2147483647; return s / 2147483647 } }

/** Farben fürs Leuchten: Cyan wie die Runen links/rechts, Gold wie Ecken und Außenlinie, Silber für helle Schrift */
const LICHT = {
  cyan: { kern: '#d8fdff', hof: CYAN },
  gold: { kern: '#fff1cf', hof: '#f2a93b' },
  silber: { kern: '#ffffff', hof: '#9fdcff' },
}
/** Stile des Rings um den Reaktor (Vorschläge 05.11.2026, Wahl Auftraggeber: D): Runen größer, wahlweise Gold; Wörter
 *  heben sich ab; Anfangsbuchstaben L-O-K-I ohne Pulsieren, wahlweise hervorgehoben */
export const RING_STILE = {
  a: { name: 'Cyan, große Runen', rune: 'cyan', runeGross: 1.5, wort: 'cyan', anfang: null },
  b: { name: 'Gold-Runen', rune: 'gold', runeGross: 1.45, wort: 'cyan', anfang: null },
  c: { name: 'Gold-Runen, Silberschrift, goldene Anfangsbuchstaben', rune: 'gold', runeGross: 1.45, wort: 'silber', anfang: 'gold' },
  d: { name: 'Gold-Runen mit Trennpunkten, Anfangsbuchstaben groß', rune: 'gold', runeGross: 1.3, wort: 'cyan', anfang: 'gross', punkte: true },
}

/**
 * Runenring vorzeichnen: volle Runde, Runen tangential, mit Lichthof (einmal beim Laden). Mit `woerter` stehen die
 * Wörter gleichmäßig verteilt im Ring und dazwischen jeweils Runen – ein geschlossener Kreis (Wunsch Auftraggeber
 * 05.11.2026: „LOKALE“, Runen, „OHNEHIN“, Runen, … rundherum). Jedes Wort steht aufrecht, wenn es oben vorbeikommt.
 */
function ringBild(r, hoehe, anzahl, versatz = 0, woerter = [], stil = RING_STILE.a) {
  const rand = hoehe * 3, gr = Math.ceil(2 * (r + rand))
  const c = leinwand(gr * FEIN, gr * FEIN), g = c.getContext('2d')
  g.scale(FEIN, FEIN); g.translate(gr / 2, gr / 2)
  g.lineCap = 'round'; g.lineJoin = 'round'
  const schrift = (f) => `600 ${Math.round(hoehe * 0.8 * f)}px Georgia, "Times New Roman", serif`
  g.font = schrift(1); g.textAlign = 'center'; g.textBaseline = 'middle'
  // weit gesperrt (Wunsch Auftraggeber 05.11.2026: mehr Raum zwischen den Buchstaben, die Wörter laufen weiter)
  const abstand = woerter.length ? hoehe * 0.55 : 0, runenSchritt = (Math.PI * 2) / anzahl
  const runeH = hoehe * (woerter.length ? stil.runeGross : 1), anfangF = stil.anfang === 'gross' ? 1.35 : 1
  const wortTeile = woerter.map((wort, k) => {
    const breiten = [...wort].map((z, i) => { g.font = schrift(i === 0 ? anfangF : 1); return (g.measureText(z).width + abstand) / r })
    return { wort, breiten, mitte: (k / woerter.length) * Math.PI * 2, halb: breiten.reduce((a, b) => a + b, 0) / 2 }
  })
  // Runenplätze: ohne Wörter gleichmäßig rundum; mit Wörtern je Lücke gleichmäßig verteilt
  const plaetze = [], schritt = runenSchritt * (runeH / hoehe)
  if (!wortTeile.length) for (let i = 0; i < anzahl; i++) plaetze.push(i * runenSchritt)
  for (const [k, w] of wortTeile.entries()) {
    const von = w.mitte + w.halb + schritt * 0.6, n = wortTeile[(k + 1) % wortTeile.length]
    const bis = n.mitte + (k + 1 === wortTeile.length ? Math.PI * 2 : 0) - n.halb - schritt * 0.6
    const zahl = Math.max(1, Math.round((bis - von) / schritt) + 1)
    for (let i = 0; i < zahl; i++) plaetze.push(von + ((bis - von) * i) / Math.max(1, zahl - 1))
  }
  for (let durchgang = 0; durchgang < 2; durchgang++) {
    // erst weiches Leuchten, dann der scharfe helle Kern
    const lr = LICHT[woerter.length ? stil.rune : 'cyan']
    g.strokeStyle = durchgang ? lr.kern : lr.hof; g.shadowColor = lr.hof
    g.lineWidth = durchgang ? Math.max(1.4, runeH * 0.075) : runeH * 0.12
    g.shadowBlur = durchgang ? runeH * 0.35 : runeH * 0.9
    for (const [i, w] of plaetze.entries()) {
      g.save(); g.rotate(w); g.translate(0, -r)
      rune(g, FOLGE[(i + versatz) % FOLGE.length], runeH)
      g.restore()
    }
    if (stil.punkte) { // kleine goldene Rauten als Trenner zwischen Wort und Runen
      g.fillStyle = durchgang ? lr.kern : lr.hof
      for (const t of wortTeile) for (const s of [-1, 1]) {
        g.save(); g.rotate(t.mitte + s * (t.halb + schritt * 0.3)); g.translate(0, -r); g.rotate(Math.PI / 4)
        g.fillRect(-hoehe * 0.09, -hoehe * 0.09, hoehe * 0.18, hoehe * 0.18); g.restore()
      }
    }
    for (const t of wortTeile) {
      let w = t.mitte - t.halb // von links nach rechts
      for (const [i, z] of [...t.wort].entries()) {
        w += t.breiten[i] / 2
        const lw = LICHT[i === 0 && stil.anfang === 'gold' ? 'gold' : stil.wort]
        g.font = schrift(i === 0 ? anfangF : 1); g.fillStyle = durchgang ? lw.kern : lw.hof; g.shadowColor = lw.hof
        g.shadowBlur = durchgang ? hoehe * 0.35 : hoehe * 0.9
        g.save(); g.rotate(w); g.translate(0, -r); g.fillText(z, 0, 0); g.restore()
        w += t.breiten[i] / 2
      }
    }
  }
  return c
}

/**
 * Ring mit Angaben (Entwürfe 05.11.2026, Wunsch Auftraggeber: Uhrzeit, Datum, Kalenderwoche, Temperatur + Wetter im Ring,
 * in Futhark-Strichschrift, Lücken mit Runen gefüllt; die Bedeutung von L.O.K.I. bleibt drin).
 * Varianten: info-a alles im drehenden Ring · info-b Name dreht, Angaben fest auf einem inneren Bogen oben ·
 * info-c Name dreht, Angaben fest auf dunkler Tafel oben im Ring · info-d alles dreht, Uhrzeit groß in Gold, Wetter als Symbol
 * → { dreh, fest } (fest = steht still, oben; kann fehlen)
 */
function infoRing(r, hoehe, variante, a) {
  const rand = hoehe * 3, gr = Math.ceil(2 * (r + rand))
  const dreh = leinwand(gr * FEIN, gr * FEIN), fest = leinwand(gr * FEIN, gr * FEIN)
  const name = ['LOKALE', 'OHNEHIN', 'KLÜGERE', 'INTELLIGENZ'].map((t) => ({ text: t, farbe: 'cyan' }))
  const [symbol, wort] = wetterWort(a.wetter?.code ?? 3), grad = Number.isFinite(a.wetter?.grad) ? `${Math.round(a.wetter.grad)} °C` : '– °C'
  const angaben = [
    { text: a.uhr, farbe: 'gold', gross: variante === 'info-d' ? 1.45 : 1.15 },
    { text: `${a.tag} ${a.datum}`, farbe: 'cyan' },
    { text: `KW ${a.kw}`, farbe: 'cyan' },
    variante === 'info-d' ? { symbol, text: grad, farbe: 'cyan' } : { symbol, text: `${grad} ${wort}`, farbe: 'cyan' },
  ]
  // Breite eines Abschnitts als Winkel
  const winkel = (seg, h, rr) => ((seg.symbol ? h * 2.3 : 0) + textBreite(seg.text, h * (seg.gross ?? 1))) / rr
  // Abschnitt ab Winkel w zeichnen (zwei Durchgänge: Lichthof, dann heller Kern)
  const abschnitt = (g, seg, w, h, rr) => {
    const hh = h * (seg.gross ?? 1), lr = LICHT[seg.farbe]
    for (let d = 0; d < 2; d++) {
      g.strokeStyle = d ? lr.kern : lr.hof; g.fillStyle = g.strokeStyle; g.shadowColor = lr.hof
      g.lineWidth = d ? Math.max(1.4, hh * 0.1) : hh * 0.16; g.shadowBlur = d ? hh * 0.3 : hh * 0.8; g.lineCap = 'round'; g.lineJoin = 'round'
      let x = w
      if (seg.symbol) { const sw = (h * 2.3) / rr; g.save(); g.rotate(x + sw / 2); g.translate(0, -rr); g.lineWidth *= 0.8; wetterSymbol(g, seg.symbol, h * 1.7); g.restore(); x += sw }
      for (const z of seg.text) { const zw = (textBreite(z, hh) + (hh / 6) * 1.7) / rr; g.save(); g.rotate(x + zw / 2); g.translate(0, -rr); zeichen(g, z, hh); g.restore(); x += zw }
    }
  }
  const raute = (g, w, rr, h, farbe = 'gold') => { const lr = LICHT[farbe]; g.save(); g.rotate(w); g.translate(0, -rr); g.rotate(Math.PI / 4); g.fillStyle = lr.kern; g.shadowColor = lr.hof; g.shadowBlur = h * 0.5; g.fillRect(-h * 0.1, -h * 0.1, h * 0.2, h * 0.2); g.restore() }
  // ganzer Kreis: Abschnitte gleichmäßig verteilt, Lücken mit Runen gefüllt
  const kreis = (g, segmente, rr, h, runenFarbe) => {
    const n = segmente.length, runeH = h * 1.25, schritt = (runeH * 1.15) / rr
    const teile = segmente.map((seg, k) => ({ seg, mitte: (k / n) * Math.PI * 2, halb: winkel(seg, h, rr) / 2 }))
    for (const t of teile) abschnitt(g, t.seg, t.mitte - t.halb, h, rr)
    const lr = LICHT[runenFarbe]
    for (const [k, t] of teile.entries()) {
      const nx = teile[(k + 1) % n], von = t.mitte + t.halb + schritt * 0.9, bis = nx.mitte + (k + 1 === n ? Math.PI * 2 : 0) - nx.halb - schritt * 0.9
      raute(g, t.mitte + t.halb + schritt * 0.4, rr, h); raute(g, nx.mitte + (k + 1 === n ? Math.PI * 2 : 0) - nx.halb - schritt * 0.4, rr, h)
      const zahl = Math.max(0, Math.floor((bis - von) / schritt) + 1)
      for (let d = 0; d < 2; d++) {
        g.strokeStyle = d ? lr.kern : lr.hof; g.shadowColor = lr.hof; g.lineWidth = d ? Math.max(1.4, runeH * 0.075) : runeH * 0.12; g.shadowBlur = d ? runeH * 0.35 : runeH * 0.9
        for (let i = 0; i < zahl; i++) { const w = zahl === 1 ? (von + bis) / 2 : von + ((bis - von) * i) / (zahl - 1); g.save(); g.rotate(w); g.translate(0, -rr); rune(g, FOLGE[(i + k * 5) % FOLGE.length], runeH); g.restore() }
      }
    }
  }
  // fester Bogen oben: Abschnitte mit Rauten dazwischen, um 0 (oben) zentriert
  const bogen = (g, segmente, rr, h) => {
    const luecke = (h * 1.6) / rr, gesamt = segmente.reduce((sum, seg) => sum + winkel(seg, h, rr), 0) + luecke * (segmente.length - 1)
    let w = -gesamt / 2
    for (const [i, seg] of segmente.entries()) { abschnitt(g, seg, w, h, rr); w += winkel(seg, h, rr); if (i < segmente.length - 1) { raute(g, w + luecke / 2, rr, h); w += luecke } }
    return gesamt
  }
  const gd = dreh.getContext('2d'), gf = fest.getContext('2d')
  for (const g of [gd, gf]) { g.scale(FEIN, FEIN); g.translate(gr / 2, gr / 2) }
  if (variante === 'info-a') kreis(gd, [...name, ...angaben], r, hoehe * 0.8, 'gold')
  else if (variante === 'info-d') kreis(gd, [angaben[0], name[0], name[1], angaben[1], name[2], name[3], angaben[2], angaben[3]], r, hoehe * 0.8, 'cyan')
  else {
    kreis(gd, name, r, hoehe * 0.8, 'gold')
    if (variante === 'info-b') {
      const rr = r - 62, h = hoehe * 0.6, gesamt = bogen(gf, angaben, rr, h) + 0.08
      gf.strokeStyle = 'rgba(242,176,74,0.55)'; gf.lineWidth = 1.2; gf.shadowBlur = 0
      for (const d of [-h * 0.95, h * 0.95]) { gf.beginPath(); gf.arc(0, 0, rr - d, -Math.PI / 2 - gesamt / 2, -Math.PI / 2 + gesamt / 2); gf.stroke() }
    } else { // info-c: dunkle Tafel oben über dem Band, darin die Angaben
      const h = hoehe * 0.72, luecke = (h * 1.6) / r, gesamt = angaben.reduce((sum, seg) => sum + winkel(seg, h, r), 0) + luecke * 3 + 0.1
      gf.beginPath(); gf.arc(0, 0, r + hoehe * 0.95, -Math.PI / 2 - gesamt / 2, -Math.PI / 2 + gesamt / 2); gf.arc(0, 0, r - hoehe * 0.95, -Math.PI / 2 + gesamt / 2, -Math.PI / 2 - gesamt / 2, true); gf.closePath()
      gf.fillStyle = 'rgba(3,12,16,0.92)'; gf.fill(); gf.strokeStyle = 'rgba(242,176,74,0.7)'; gf.lineWidth = 1.5; gf.stroke()
      bogen(gf, angaben, r, h)
    }
  }
  return { dreh, fest: variante === 'info-a' || variante === 'info-d' ? null : fest }
}

/** Ring-Angaben bei neuer Minute oder neuem Wetter neu beschriften (nur bei den Info-Varianten) */
function ringAktualisieren(s, wetter) {
  if (!s.infoVariante) return
  const a = { ...zeitAngaben(), wetter }, kennung = JSON.stringify([a.uhr, a.datum, wetter?.code, Math.round(wetter?.grad ?? -99)])
  if (kennung === s.ringKennung) return
  s.ringKennung = kennung
  const { dreh, fest } = infoRing(s.geo.ringMitte.r, 30, s.infoVariante, a)
  s.ringMitte = dreh; s.ringFest = fest
}

/** Maske für den Ring um den Reaktor: oben voll, unten zum See hin weich ausgeblendet (keine harte Kante) */
function ringMaske(gr) {
  const c = leinwand(gr, gr), g = c.getContext('2d')
  const v = g.createConicGradient(Math.PI / 2, gr / 2, gr / 2) // beginnt unten, läuft im Uhrzeigersinn
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.13, 'rgba(0,0,0,0)'); v.addColorStop(0.25, '#000')
  v.addColorStop(0.75, '#000'); v.addColorStop(0.87, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0)') // unter dem Horizont keine Runen
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
    const c = leinwand(gr * FEIN, gr * FEIN), g = c.getContext('2d')
    g.scale(FEIN, FEIN); g.translate(gr / 2, gr / 2); g.lineCap = 'round'; g.lineJoin = 'round'
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

/** Gold-Knoten in den vier äußeren Bildschirmecken (Teil des Grundbilds) umfärben – Rückmeldung Auftraggeber 05.11.2026:
 *  „springen zu sehr ins Auge“. art: gold (unverändert) | gedaempft | bronze | cyan | anthrazit | weg. Erkannt werden nur goldene
 *  Bildpunkte in den Eckfeldern; der Rest des Bilds bleibt unberührt. */
const KNOTEN_FELD = { b: 300, h: 300, grenze: 308 } // grenze: Abstand-Summe zur Ecke (x + 0,83·y) – dahinter liegt der goldene Runenbogen, der bleibt
function knotenUmfaerben(bild, art) {
  if (!art || art === 'gold') return bild
  const c = leinwand(bild.width, bild.height), g = c.getContext('2d'); g.drawImage(bild, 0, 0)
  const { b: fb, h: fh } = KNOTEN_FELD
  for (const [x, y, rechts, unten] of [[0, 0, 0, 0], [0, c.height - fh, 0, 1], [c.width - fb, 0, 1, 0], [c.width - fb, c.height - fh, 1, 1]]) {
    const d = g.getImageData(x, y, fb, fh), p = d.data
    for (let i = 0; i < p.length; i += 4) {
      const px = (i / 4) % fb, py = Math.floor(i / 4 / fb), ax = rechts ? fb - 1 - px : px, ay = unten ? fh - 1 - py : py
      if (ax + 0.83 * ay > KNOTEN_FELD.grenze) continue // Runenbogen nicht anfassen
      const r = p[i], gr = p[i + 1], bl = p[i + 2], gold = r - bl
      if (gold < 15 || r < gr) continue // nur goldene Bildpunkte
      const l = Math.max(r, gr, bl), w = Math.min(1, (gold - 15) / 40) // weicher Übergang an den Rändern des Ornaments
      const neu = art === 'gedaempft' ? [r * 0.45, gr * 0.45, bl * 0.45] : art === 'bronze' ? [l * 0.42, l * 0.28, l * 0.16]
        : art === 'cyan' ? [l * 0.18, l * 0.55, l * 0.6]
        : art === 'anthrazit' ? (() => { const y = 0.3 * r + 0.59 * gr + 0.11 * bl, v = Math.pow(Math.max(0, (y - 150) / 105), 2) * 170; return [7 + v * 0.45, 10 + v * 0.95, 11 + v] })() // fast Schwarz mit Hauch Türkis, Glanzpunkte im Türkis der Runen (Wunsch 05.11.2026)
        : [10, 16, 22]
      p[i] = r + (neu[0] - r) * w; p[i + 1] = gr + (neu[1] - gr) * w; p[i + 2] = bl + (neu[2] - bl) * w
    }
    g.putImageData(d, x, y)
  }
  return c
}

/** Szene laden. basis = Ordner mit grund.webp, aurora.webp … und geometrie.json (relativ zur Seite) */
export async function ladeSzene(basis, einstellung = {}) {
  const geo = await (await fetch(basis + 'geometrie.json')).json()
  const namen = ['grund', ...Object.keys(geo.ebenen)]
  const bilder = Object.fromEntries(await Promise.all(namen.map(async (n) => [n, await bildLaden(basis + n + '.webp')])))
  bilder.grund = knotenUmfaerben(bilder.grund, einstellung.knoten ?? 'anthrazit') // Wahl Auftraggeber 05.11.2026
  const zufall = zufallsfolge(7)
  const infoVariante = String(einstellung.ring ?? '').startsWith('info') ? einstellung.ring : null
  const ringMitte = infoVariante ? infoRing(geo.ringMitte.r, 30, infoVariante, { ...zeitAngaben(), wetter: null }).dreh : ringBild(geo.ringMitte.r, 30, 26, 0, ['LOKALE', 'OHNEHIN', 'KLÜGERE', 'INTELLIGENZ'], RING_STILE[einstellung.ring ?? 'd'])
  return {
    geo, bilder,
    ringMitte, infoVariante, ringFest: null, ringKennung: '', ringMitteMaske: ringMaske(ringMitte.width), ringPuffer: leinwand(ringMitte.width, ringMitte.height),
    runen: runenBilder(38),
    bahnLinks: bahnVorbereiten(geo.bahnLinks, true),
    bahnRechts: bahnVorbereiten(geo.bahnRechts, false),
    nebel: nebelBild(2400, 300, zufall),
    nebel2: nebelBild(2400, 300, zufall, 60),
    rauchStreifen: leinwand(1300, 320), rauchMaske: rauchMaske(1300, 320), wolke: wolkeBild(1024, 240, zufall),
    spiegel: geo.ebenen.reaktor ? spiegelBild(bilder.reaktor, geo.ebenen.reaktor) : null,
    blitze: [], naechsterBlitz: 0, rot: 0,
    rotBilder: Object.fromEntries(['reaktor', 'kernscheibe', 'zellen', 'halo', 'kern', 'schrift'].filter((n) => bilder[n]).map((n) => [n, rotFassung(bilder[n])])),
    seePuffer: leinwand(B, H - HORIZONT), seeMaske: seeMaske(),
  }
}

function ebene(g, s, name, alpha, mischung = 'lighter', rot = 0) {
  const e = s.geo.ebenen[name], bild = s.bilder[name]
  if (!e || !bild || alpha <= 0.002) return
  g.globalCompositeOperation = mischung
  // stumm: rote Fassung überblenden (deckende Ebenen: Rot oben drauf, leuchtende: aufteilen)
  const rb = rot > 0.002 ? s.rotBilder?.[name] : null
  if (rb && mischung === 'source-over') {
    g.globalAlpha = Math.min(1, alpha); g.drawImage(bild, e.x, e.y, e.b, e.h)
    g.globalAlpha = Math.min(1, alpha * rot); g.drawImage(rb, e.x, e.y, e.b, e.h)
  } else {
    if (rot < 0.998) { g.globalAlpha = Math.min(1, alpha * (rb ? 1 - rot : 1)); g.drawImage(bild, e.x, e.y, e.b, e.h) }
    if (rb) { g.globalAlpha = Math.min(1, alpha * rot); g.drawImage(rb, e.x, e.y, e.b, e.h) }
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
}

/** Maske für den See-Puffer: Bewegung zu den Seiten (Ecken, Runenbänder) weich ausgeblendet */
function seeMaske() {
  const c = leinwand(B, H - HORIZONT), g = c.getContext('2d'), v = g.createLinearGradient(0, 0, B, 0)
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(560 / B, 'rgba(0,0,0,0)'); v.addColorStop(820 / B, '#000')
  v.addColorStop(1 - 820 / B, '#000'); v.addColorStop(1 - 560 / B, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = v; g.fillRect(0, 0, c.width, c.height)
  return c
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

/** Rote Fassung eines Bildes für „L.O.K.I. stumm“ (Wunsch Auftraggeber 05.11.2026): nur das blaue/cyan Leuchten wird
 *  rot, Stein und Kupfer bleiben – einmal beim Laden berechnet */
function rotFassung(bild) {
  const c = leinwand(bild.width, bild.height), g = c.getContext('2d')
  g.drawImage(bild, 0, 0)
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], gr = p[i + 1], b = p[i + 2], k = Math.min(1, Math.max(0, (b - r - 40) / 100))
    if (!k) continue
    p[i] = r + (Math.max(b, gr) - r) * k; p[i + 1] = gr + (gr * 0.22 - gr) * k; p[i + 2] = b + (b * 0.18 - b) * k
  }
  g.putImageData(d, 0, 0)
  return c
}

/**
 * Wasser (Rückmeldung Auftraggeber 05.11.2026: Wellen müssen von den Bergen auf den Betrachter zurollen, nicht seitlich
 * schwappen). Das Seestück unter dem Horizont – Spiegelung der Aurora, Glanzlichter, Spiegelbild des Reaktors – wird
 * zeilenweise SENKRECHT verschoben abgetastet: Wellenkämme (gestauchte, hellere Zeilen) wandern nach unten, also nach
 * vorn. Perspektive: am Horizont dicht und flach, vorn breiter und kräftiger, dort auch etwas schneller. Seitlich nur ein
 * Hauch Bewegung. Nach außen (Ecken-Ornamente, Runenbänder) wird alles weich ausgeblendet.
 */
function wasser(g, s, t, anteil) {
  const p = s.seePuffer, pg = p.getContext('2d'), hoehe = p.height, zeile = 2
  const glanz = s.bilder.wasser, ge = s.geo.ebenen.wasser, sp = s.spiegel, re = s.geo.ebenen.reaktor
  pg.globalCompositeOperation = 'source-over'; pg.globalAlpha = 1; pg.clearRect(0, 0, B, hoehe)
  for (let y = 0; y < hoehe; y += zeile) {
    const d = y / hoehe
    // Wellenphase: Abstand „in die Tiefe“ wächst zum Horizont stark (perspektivisch) – minus Zeit = Lauf nach vorn
    const tiefe = 1 / (d + 0.08)
    // ruhig (Rückmeldung Auftraggeber 05.11.2026: „zu waberig“): langsame, flache Dünung, nur ein Hauch Verzerrung
    const ph1 = -tiefe * 6.0 + t * 0.8, ph2 = -tiefe * 10.5 + t * 1.15 + 1.3, ph3 = -tiefe * 3.4 + t * 0.5 + 0.6
    const welle = Math.sin(ph1) + 0.5 * Math.sin(ph2) + 0.35 * Math.sin(ph3)
    const dy = welle * (0.15 + 1.7 * d) // senkrechtes Abtasten: Kämme stauchen, Täler dehnen
    const kamm = Math.max(0, Math.sin(ph1) * 0.7 + Math.sin(ph2) * 0.3) // vorderer Hang der Welle fängt Licht
    const dx = 0
    const quelle = Math.min(hoehe - zeile, Math.max(0, y + dy))
    pg.globalCompositeOperation = 'source-over'; pg.globalAlpha = 1
    pg.drawImage(s.bilder.grund, 0, HORIZONT + quelle, B, zeile, dx, y, B, zeile)
    pg.globalCompositeOperation = 'lighter'
    const qq = HORIZONT + quelle
    if (glanz && ge && qq >= ge.y && qq < ge.y + ge.h) {
      const fy = glanz.height / ge.h
      pg.globalAlpha = anteil * (0.22 + 0.45 * kamm) // Glanz auf den Wellenkämmen, läuft sanft mit nach vorn
      pg.drawImage(glanz, 0, (qq - ge.y) * fy, glanz.width, zeile * fy, ge.x + dx, y, ge.b, zeile)
    }
    if (sp && re && quelle < sp.height) {
      pg.globalAlpha = anteil * 0.32 * (1 - d * 0.6) * (0.75 + 0.25 * kamm)
      pg.globalCompositeOperation = 'screen'
      pg.drawImage(sp, 0, quelle, sp.width, zeile, re.x + dx * 2, y, sp.width, zeile)
    }
  }
  pg.globalAlpha = 1; pg.globalCompositeOperation = 'destination-in'; pg.drawImage(s.seeMaske, 0, 0)
  g.drawImage(p, 0, HORIZONT)
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
}

/** Sternschnuppen (Wunsch Auftraggeber 05.11.2026): alle 15–45 s eine, kurz und leuchtend über den Nachthimmel */
function sternschnuppen(g, s, t) {
  if (!s.naechsteSchnuppe) s.naechsteSchnuppe = t + 6 + Math.random() * 10
  if (t >= s.naechsteSchnuppe) {
    // Abwechslung (Wunsch Auftraggeber 05.11.2026): kurze, mittlere und lange – bis über zwei Bildschirme, flacher Winkel
    const links = Math.random() < 0.5, art = Math.random(), lang = art > 0.7, mittel = art > 0.35 && !lang
    const w = (lang ? 4 + Math.random() * 8 : mittel ? 8 + Math.random() * 14 : 15 + Math.random() * 25) * (Math.PI / 180)
    const weg = lang ? 1800 + Math.random() * 2200 : mittel ? 700 + Math.random() * 700 : 260 + Math.random() * 220
    const x = links ? weg * Math.cos(w) + 100 + Math.random() * (B - weg * Math.cos(w) - 200) : 100 + Math.random() * (B - weg * Math.cos(w) - 200)
    // nur am Himmel (Rückmeldung Auftraggeber 05.11.2026): Ende der Bahn bleibt über den Berggipfeln
    const y0 = 25 + Math.random() * 120, fallen = Math.min(Math.sin(w) * weg, HIMMEL - 40 - y0)
    s.schnuppe = { von: t, dauer: lang ? 1.8 + Math.random() * 0.8 : mittel ? 1.1 + Math.random() * 0.5 : 0.7 + Math.random() * 0.5, x, y: y0, dx: Math.cos(w) * (links ? -1 : 1), dy: fallen / weg, weg, schweif: lang ? 220 : mittel ? 140 : 90 }
    s.naechsteSchnuppe = t + 15 + Math.random() * 30
  }
  const sc = s.schnuppe
  if (!sc) return
  const f = (t - sc.von) / sc.dauer
  if (f > 1 || f < 0) { s.schnuppe = null; return }
  const kx = sc.x + sc.dx * sc.weg * f, ky = sc.y + sc.dy * sc.weg * f, l = sc.schweif * Math.min(1, f * 4), hell = Math.sin(f * Math.PI)
  const v = g.createLinearGradient(kx - sc.dx * l, ky - sc.dy * l, kx, ky)
  v.addColorStop(0, 'rgba(200,245,255,0)'); v.addColorStop(1, `rgba(235,252,255,${0.9 * hell})`)
  g.save()
  // hinter Reaktor und Runenringen: deren Kreisfläche aussparen (Wunsch Auftraggeber 05.11.2026)
  const rk = s.geo.ringMitte; g.beginPath(); g.rect(0, 0, B, HIMMEL); g.arc(rk.x, rk.y, rk.r1 + 40, 0, Math.PI * 2, true); g.clip()
  g.globalCompositeOperation = 'lighter'; g.strokeStyle = v; g.lineWidth = 1.6; g.lineCap = 'round'
  g.beginPath(); g.moveTo(kx - sc.dx * l, ky - sc.dy * l); g.lineTo(kx, ky); g.stroke()
  const gl = g.createRadialGradient(kx, ky, 0, kx, ky, 6); gl.addColorStop(0, `rgba(255,255,255,${hell})`); gl.addColorStop(1, 'rgba(160,240,255,0)')
  g.fillStyle = gl; g.fillRect(kx - 6, ky - 6, 12, 12); g.restore()
}

// Unter dem Reaktor (Rückmeldung Auftraggeber 05.11.2026): die starren Lichtringe sind aus dem Grundbild entfernt
// (Magnific), stattdessen pulsieren Wellenringe von innen nach außen – schnell los, dann langsam ausklingend (wie eine
// Tempo-Rampe im Video) –, darüber liegen Rauchwolken nur zwischen Reaktor und Wasser.
const RING_MITTE = { x: 2880, y: 890 }, RING_RX = 640, RING_RY = 48

/**
 * Wellenringe (Rückmeldung Auftraggeber 05.11.2026: lebendiger, pulsierender – am Anfang dicht, dann schnell ausblenden):
 * Jeder Puls beginnt als heller, dichter Lichtring mit Leuchtfläche in der Mitte, teilt sich beim Auslaufen in drei
 * Ringe, die auseinanderdriften, und verlischt rasch. Takt leicht unregelmäßig (1,6–2,6 s), Lichtpunkt blitzt mit.
 */
function wellen(g, t, anteil) {
  if (anteil <= 0) return
  const lebens = 3.6
  // unregelmäßiger, aber fester Takt: Startzeiten aus einer festen Folge (gleich bei jedem Abspielen)
  const startzeit = (k) => k * 2.1 + Math.sin(k * 12.9898) * 0.5
  g.save(); g.globalCompositeOperation = 'lighter'
  for (let k = Math.floor(t / 2.1) - 3; k <= Math.floor(t / 2.1) + 1; k++) {
    const f = (t - startzeit(k)) / lebens
    if (f < 0 || f > 1) continue
    const weg = 1 - (1 - f) ** 3 // schnell los, dann langsamer
    const deck = anteil * Math.min(1, f / 0.02) * Math.exp(-f * 4.2) // dicht am Anfang, rasch ausgeblendet
    // Leuchtfläche in der Mitte des Pulses (nur ganz am Anfang)
    if (f < 0.25) {
      const rx = 40 + weg * RING_RX * 0.5, v = g.createRadialGradient(RING_MITTE.x, RING_MITTE.y, 0, RING_MITTE.x, RING_MITTE.y, rx)
      v.addColorStop(0, 'rgba(180,250,255,0.55)'); v.addColorStop(1, 'rgba(95,246,255,0)')
      g.save(); g.translate(RING_MITTE.x, RING_MITTE.y); g.scale(1, RING_RY / RING_RX); g.translate(-RING_MITTE.x, -RING_MITTE.y)
      g.globalAlpha = anteil * (1 - f / 0.25); g.fillStyle = v; g.fillRect(RING_MITTE.x - rx, RING_MITTE.y - rx, 2 * rx, 2 * rx); g.restore()
    }
    // drei Ringe: am Anfang dicht beieinander, driften beim Auslaufen auseinander
    for (const [versatz, stark] of [[0, 1], [-0.07, 0.6], [-0.15, 0.35]]) {
      const w = Math.max(0, weg + versatz * f), rx = 20 + w * RING_RX, ry = rx * (RING_RY / RING_RX)
      for (const [breite, farbe, d] of [[16, 'rgba(95,246,255,1)', 0.16], [5, 'rgba(150,250,255,1)', 0.45], [1.6, '#eaffff', 0.9]]) {
        g.beginPath(); g.ellipse(RING_MITTE.x, RING_MITTE.y, rx, ry, 0, 0, Math.PI * 2)
        g.lineWidth = breite * (1.5 - weg); g.strokeStyle = farbe; g.globalAlpha = deck * d * stark; g.stroke()
      }
    }
  }
  g.restore()
}

/** Rauch zwischen Reaktor und Wasser: wolkige, gebauschte Schwaden (eigene Rauchtextur), zwei Lagen gegenläufig,
 *  elliptisch nach allen Seiten weich ausgeblendet – keine Kanten, der Reaktor darüber bleibt frei */
function rauch(g, s, t, anteil) {
  if (anteil <= 0) return
  const st = s.rauchStreifen, sg = st.getContext('2d'), w = s.wolke
  sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, st.width, st.height)
  for (const [tempo, dy, skala, deck] of [[6, 30, 1, 1], [-4, 60, 1.3, 0.9], [2.5, 5, 0.85, 0.8], [-1.5, 80, 1.1, 0.6]]) {
    sg.globalAlpha = deck
    const bw = w.width * skala, bh = w.height * skala, start = -(((t * tempo) % bw) + bw) % bw
    for (let px = start; px < st.width; px += bw) sg.drawImage(w, px, dy + Math.sin(t * 0.2 + skala) * 8, bw, bh)
  }
  sg.globalAlpha = 1; sg.globalCompositeOperation = 'destination-in'; sg.drawImage(s.rauchMaske, 0, 0)
  const x = RING_MITTE.x - st.width / 2, y = RING_MITTE.y - st.height * 0.55
  g.globalAlpha = anteil * 0.85; g.drawImage(st, x, y) // deckend: Rauch hat Körper und verdeckt das Wasser
  g.globalCompositeOperation = 'screen'; g.globalAlpha = anteil * 0.45; g.drawImage(st, x, y) // vom Ringlicht angeleuchtet
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
}

/** elliptische Maske: Mitte dicht, nach allen Seiten weich auf null (unten, oben, links, rechts – keine harte Kante) */
function rauchMaske(b, h) {
  const c = leinwand(b, h), g = c.getContext('2d')
  g.translate(b / 2, h * 0.55); g.scale(1, (h * 0.45) / (b / 2))
  const v = g.createRadialGradient(0, 0, 0, 0, 0, b / 2)
  v.addColorStop(0, '#000'); v.addColorStop(0.4, 'rgba(0,0,0,0.9)'); v.addColorStop(0.75, 'rgba(0,0,0,0.35)'); v.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = v; g.fillRect(-b / 2, -b, b, 2 * b)
  return c
}

/** Rauchtextur: viele weiche, verschieden große Bäusche (große blasse unten, kleine dichtere darüber), dazwischen
 *  Lücken – wirkt wolkig statt flächig; waagerecht nahtlos wiederholbar; einmal beim Laden gezeichnet */
function wolkeBild(b, h, zufall) {
  const c = leinwand(b, h), g = c.getContext('2d')
  const bausch = (x, y, r, a) => {
    for (const dx of [-b, 0, b]) {
      const v = g.createRadialGradient(x + dx, y - r * 0.35, r * 0.05, x + dx, y, r) // Licht von oben → Volumen
      v.addColorStop(0, `rgba(215,240,246,${a})`); v.addColorStop(0.45, `rgba(150,195,205,${a * 0.8})`); v.addColorStop(0.8, `rgba(95,135,148,${a * 0.35})`); v.addColorStop(1, 'rgba(90,130,145,0)')
      g.fillStyle = v; g.fillRect(x + dx - r, y - r, 2 * r, 2 * r)
    }
  }
  // Ballen: Gruppen von Bäuschen um gemeinsame Mittelpunkte → Wolkenform mit Rändern und Lücken
  for (let k = 0; k < 11; k++) { // wenige, deutlich getrennte Wolkenballen mit Lücken dazwischen
    const mx = ((k + 0.2 + zufall() * 0.6) / 11) * b, my = h * (0.45 + zufall() * 0.2), gr = 34 + zufall() * 40
    for (let i = 0; i < 26; i++) {
      const w = zufall() * Math.PI * 2, d = Math.sqrt(zufall()) * gr
      bausch(mx + Math.cos(w) * d * 1.5, my + Math.sin(w) * d * 0.7 - (1 - d / gr) * 14, 16 + zufall() * 30, 0.22 + zufall() * 0.22)
    }
  }
  return c
}

/**
 * Elektrizität auf dem Reaktor (Rückmeldung Auftraggeber 05.11.2026: auf dem Reaktor, nicht daneben; realistischer
 * Blitzverlauf, der sich seinen Weg über Metall sucht). Vorbild echter Blitz (NOAA/NSSL): ein schwach leuchtender
 * Vorläufer tastet sich ruckweise vor und verzweigt sich, dann schlägt der helle Hauptblitz durch denselben Kanal,
 * danach flackert er 1–3-mal auf demselben Weg nach. Hier: Start an einer Spule, Weg über die Zellen zur nächsten
 * Spule (ein bis drei weiter), an Spulen läuft er ein Stück die Wicklung entlang nach außen oder innen, dazu kurze
 * Seitenäste. Die Form steht für eine Entladung fest (Nachflackern auf gleichem Weg), nur das Leuchten knistert.
 */
const SPULE_R = 172, SPULE_WINKEL = (k) => -Math.PI / 2 + (k * Math.PI) / 4 // acht Spulen, oben beginnend

/** Mittelpunkt-Verschiebung: aus einer Strecke einen gezackten Pfad machen (Abweichung wird je Stufe kleiner) */
function zacken(a, b, rauh, stufen) {
  let pkt = [a, b]
  for (let st = 0; st < stufen; st++) {
    const neu = [pkt[0]]
    for (let i = 1; i < pkt.length; i++) {
      const [x0, y0] = pkt[i - 1], [x1, y1] = pkt[i], l = Math.hypot(x1 - x0, y1 - y0)
      const v = (Math.random() - 0.5) * l * rauh
      neu.push([(x0 + x1) / 2 + ((y0 - y1) / (l || 1)) * v, (y0 + y1) / 2 + ((x1 - x0) / (l || 1)) * v], pkt[i])
    }
    pkt = neu
  }
  return pkt
}

/** eine Entladung zusammensetzen: Hauptkanal entlang der Spulen + Abzweige, jeweils mit Zeitpunkt des Erscheinens */
function entladung(r, t) {
  const start = Math.floor(Math.random() * 8), schritte = 1 + Math.floor(Math.random() * 3), richtung = Math.random() < 0.5 ? -1 : 1
  const punkt = (w, rad) => [r.x + Math.cos(w) * rad, r.y + Math.sin(w) * rad]
  const haupt = [], aeste = []
  for (let k = 0; k < schritte; k++) {
    const w0 = SPULE_WINKEL(start + k * richtung), w1 = SPULE_WINKEL(start + (k + 1) * richtung)
    // über die Zelle zwischen zwei Spulen: Bogen mit leicht wechselndem Abstand, dann gezackt
    const stuetzen = [0, 0.35, 0.65, 1].map((f) => punkt(w0 + (w1 - w0) * f, SPULE_R + (Math.random() - 0.5) * 34))
    for (let i = 1; i < stuetzen.length; i++) {
      const stueck = zacken(stuetzen[i - 1], stuetzen[i], 0.45, 3)
      haupt.push(...(haupt.length ? stueck.slice(1) : stueck))
    }
    // an der erreichten Spule: ein Stück die Wicklung entlang nach außen oder innen
    if (Math.random() < 0.7) {
      const nach = Math.random() < 0.5 ? 50 + Math.random() * 30 : -(30 + Math.random() * 30)
      aeste.push({ ab: haupt.length - 1, pkt: zacken(haupt[haupt.length - 1], punkt(w1, SPULE_R + nach), 0.35, 3), dick: 0.8 })
    }
  }
  // kurze Seitenäste, wie sie ein Vorläufer beim Suchen bildet
  const anzahl = 2 + Math.floor(Math.random() * 4)
  for (let i = 0; i < anzahl; i++) {
    const ab = 2 + Math.floor(Math.random() * (haupt.length - 3)), [x, y] = haupt[ab]
    const w = Math.atan2(y - r.y, x - r.x) + (Math.random() - 0.5) * 1.6, l = 18 + Math.random() * 45
    aeste.push({ ab, pkt: zacken([x, y], [x + Math.cos(w) * l, y + Math.sin(w) * l], 0.5, 2), dick: 0.5 })
  }
  // Ablauf: Vorläufer wächst ruckweise (0,35–0,7 s), Hauptblitz, 1–3 Nachblitze
  const vorlauf = 0.35 + Math.random() * 0.35, nach = [], n = 1 + Math.floor(Math.random() * 3)
  for (let i = 0, z = vorlauf + 0.12; i < n; i++) { z += 0.09 + Math.random() * 0.16; nach.push(z) }
  return { von: t, haupt, aeste, vorlauf, nach, dauer: nach[nach.length - 1] + 0.25 }
}

function blitze(g, s, t, rate, anteil) {
  const r = s.geo.kern ?? s.geo.reaktor
  if (!s.naechsterBlitz) s.naechsterBlitz = t + 3
  if (t >= s.naechsterBlitz) {
    s.blitze.push(entladung(r, t))
    s.naechsterBlitz = t + (9 + Math.random() * 12) / rate
  }
  s.blitze = s.blitze.filter((b) => t >= b.von && t - b.von < b.dauer)
  s.blitzHell = 0
  if (!s.blitze.length || anteil <= 0) return
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round'
  const linie = (pkt, bis, breite, farbe, deck) => {
    if (bis < 2 || deck <= 0.003) return
    g.beginPath(); for (let i = 0; i < bis; i++) (i ? g.lineTo : g.moveTo).call(g, pkt[i][0], pkt[i][1])
    g.lineWidth = breite; g.strokeStyle = farbe; g.globalAlpha = Math.min(1, deck * anteil); g.stroke()
  }
  for (const b of s.blitze) {
    const z = t - b.von
    // Vorläufer: ruckweise wachsen (in Sprüngen von ~40 ms), schwach und flackernd
    const anteilWeg = Math.min(1, Math.floor(z / 0.04) * 0.04 / b.vorlauf)
    const bis = Math.max(2, Math.round(b.haupt.length * anteilWeg))
    let hell = 0.45 + 0.3 * Math.random()
    // Hauptblitz und Nachblitze: kurz sehr hell, dann schnell abklingend
    for (const [i, zeit] of [b.vorlauf, ...b.nach].entries()) {
      const d = z - zeit
      if (d >= 0 && d < 0.18) hell = Math.max(hell, (i ? 0.75 : 1.25) * (1 - d / 0.18) ** 1.5)
    }
    if (z > b.vorlauf + 0.18 && !b.nach.some((n) => z >= n && z < n + 0.18)) hell *= Math.max(0, 1 - (z - b.vorlauf) / b.dauer) * 0.6
    s.blitzHell = Math.max(s.blitzHell, z >= b.vorlauf ? hell : 0)
    for (const [breite, farbe, deck] of [[22, s.rot > 0.5 ? '#ff3a2e' : CYAN, 0.12], [8, s.rot > 0.5 ? '#ff8a7a' : '#9ffcff', 0.45], [2.6, '#ffffff', 1]]) linie(b.haupt, bis, breite * (0.6 + 0.4 * Math.min(1, hell)), farbe, deck * hell)
    for (const a of b.aeste) {
      if (a.ab >= bis) continue
      const teil = Math.max(2, Math.round(a.pkt.length * Math.min(1, (bis - a.ab) / 10)))
      for (const [breite, farbe, deck] of [[14, s.rot > 0.5 ? '#ff3a2e' : CYAN, 0.1], [5, s.rot > 0.5 ? '#ff8a7a' : '#9ffcff', 0.4], [1.8, '#ffffff', 0.95]]) linie(a.pkt, teil, breite * a.dick, farbe, deck * hell * a.dick)
    }
    // Spitze des Vorläufers glimmt
    if (z < b.vorlauf) {
      const [kx, ky] = b.haupt[bis - 1], gl = g.createRadialGradient(kx, ky, 0, kx, ky, 18)
      gl.addColorStop(0, 'rgba(220,255,255,0.8)'); gl.addColorStop(1, 'rgba(95,246,255,0)')
      g.globalAlpha = anteil; g.fillStyle = gl; g.fillRect(kx - 18, ky - 18, 36, 36)
    }
  }
  g.restore()
}

/** Reaktor: Kernscheibe dreht, Lauflicht wandert durch die Zellen, Kern und Lichthof pulsieren, Blitze */
function reaktor(g, s, t, opt, anteil) {
  const r = s.geo.kern ?? s.geo.reaktor, kz = s.geo.ebenen.kernscheibe, ze = s.geo.ebenen.zellen
  const spricht = opt.loki === 'spricht' ? Math.min(1, opt.pegel ?? 0.5) : 0
  const denkt = opt.loki === 'denkt' ? 1 : 0, aus = 1, rot = s.rot // stumm: rot statt blau (weich überblendet)
  const puls = 0.5 + 0.5 * Math.sin((t * Math.PI * 2) / 2.8)
  const flackern = 0.9 + 0.1 * Math.sin(t * 23) * Math.sin(t * 7.3)
  // Kernscheibe (runde Mitte mit den Lichtpunkten) dreht sich langsam gegen den Uhrzeigersinn
  if (kz && anteil > 0) {
    g.save(); g.translate(r.x, r.y); g.rotate(-t * ((Math.PI * 2) / 50) * (1 + denkt * 2))
    g.drawImage(s.bilder.kernscheibe, kz.x - r.x, kz.y - r.y, kz.b, kz.h)
    if (rot > 0.002) { g.globalAlpha = rot; g.drawImage(s.rotBilder.kernscheibe, kz.x - r.x, kz.y - r.y, kz.b, kz.h); g.globalAlpha = 1 }
    g.restore()
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
      g.globalAlpha = Math.min(1, a) * (1 - rot); g.drawImage(s.bilder.zellen, ze.x, ze.y, ze.b, ze.h)
      if (rot > 0.002) { g.globalAlpha = Math.min(1, a) * rot; g.drawImage(s.rotBilder.zellen, ze.x, ze.y, ze.b, ze.h) }
      g.restore()
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
  }
  blitze(g, s, t, (1 + denkt * 2 + spricht * 3) * (rot > 0.5 ? 0.4 : 1), anteil)
  const schlag = s.blitzHell ?? 0 // der Hauptblitz lässt Kern und Lichthof kurz aufleuchten
  ebene(g, s, 'halo', anteil * aus * flackern * (0.35 + 0.5 * puls + 0.7 * spricht + 0.6 * schlag), 'lighter', rot)
  ebene(g, s, 'kern', anteil * aus * flackern * (0.25 + 0.45 * puls + 0.6 * spricht + 0.5 * schlag), 'lighter', rot)
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
    g.drawImage(bild, -bild.width / FEIN / 2, -bild.height / FEIN / 2, bild.width / FEIN, bild.height / FEIN)
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
  g.imageSmoothingQuality = 'high'; g.drawImage(p, k.x - gr / FEIN / 2, k.y - gr / FEIN / 2, gr / FEIN, gr / FEIN)
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
  if (s.ringFest) { g.globalAlpha = alpha; g.drawImage(s.ringFest, k.x - gr / FEIN / 2, k.y - gr / FEIN / 2, gr / FEIN, gr / FEIN); g.globalAlpha = 1 } // feste Angaben oben
}

/** verkleinerter L.O.K.I.-Schriftzug mit Drachen, in den Stein graviert (dunkle Rille), leuchtet leicht im Takt des Kerns */
function schrift(g, s, t, anteil) {
  if (anteil <= 0) return
  const hell = anteil * (0.9 + 0.1 * Math.sin((t * Math.PI * 2) / 2.8))
  ebene(g, s, 'gravur', anteil * 0.75, 'source-over')
  ebene(g, s, 'schrift', hell, 'lighter', s.rot)
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
  g.fillStyle = '#000'; g.fillRect(0, 0, B, H); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'
  g.globalAlpha = an.grund; g.drawImage(s.bilder.grund, 0, 0, B, H); g.globalAlpha = 1

  const mit = (n) => !(opt.aus ?? []).includes(n) // Prüfhilfe: einzelne Teile weglassen
  ringAktualisieren(s, opt.wetter)
  // stumm (L.O.K.I. aus): Reaktor-Leuchten weich auf Rot, beim Wiedereinschalten zurück auf Blau (≈ 0,6 s)
  const rotZiel = opt.loki === 'aus' ? 1 : 0, dt = Math.min(0.1, Math.max(0, t - (s.letztesT ?? t))); s.letztesT = t
  s.rot += Math.sign(rotZiel - s.rot) * Math.min(Math.abs(rotZiel - s.rot), dt / 0.6)
  if (mit('aurora')) aurora(g, s, t, an.aurora)
  sternschnuppen(g, s, t)
  bergnebel(g, s.nebel2, t) // Nebelschwaden in Bergen und Wäldern ziehen langsam (Wunsch Auftraggeber 05.11.2026)
  // aufsteigender Rauch hinter dem Reaktor entfernt (Rückmeldung Auftraggeber 05.11.2026: Reaktor soll klar bleiben)
  if (mit('wasser')) wasser(g, s, t, an.reaktor)
  // Wetter hinter Reaktor und Fenstern: Regen, Schnee, Nebel nach dem echten Wetter (opt.wetter = { code, grad })
  s.wetter = s.wetter ?? erstelleWetter()
  const w = wetterArt(opt.wetter)
  if (mit('wetter')) zeichneWetterHinten(g, s.wetter, w, t)
  // pulsierende Wellenringe auf Wunsch des Auftraggebers wieder entfernt (05.11.2026: „gefallen mir gar nicht“)
  if (mit('rauch')) rauch(g, s, t, an.nebel)
  ebene(g, s, 'reaktor', an.grund, 'source-over', s.rot) // Reaktor steht vorn: Rauch und Wolken liegen dahinter/darunter
  if (mit('reaktor')) reaktor(g, s, t, opt, an.reaktor)
  if (mit('schrift')) schrift(g, s, t, an.reaktor)

  const denkt = opt.loki === 'denkt' ? 1 : 0
  const hell = an.runen * (0.85 + 0.15 * Math.sin(t * 0.63))
  mittelRing(g, s, t * ((Math.PI * 2) / 240) * (1 + denkt * 3), hell)
  s.versatz = opt.versatz ?? 0
  seitenRunen(g, s, s.bahnLinks, t, -6, hell, 4) // links nach oben, rechts nach unten – gegenläufig wie die Mitte
  seitenRunen(g, s, s.bahnRechts, t, 6, hell, 12)
  if (mit('wetter')) zeichneFrost(g, s.wetter) // Frost: Eiskristalle an den Bildschirmrändern
  g.restore()
}
