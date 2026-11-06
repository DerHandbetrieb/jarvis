// Entladung im Reaktor (06.11.2026, Wunsch Auftraggeber: statt Blitz über den Spulen ein Impuls aus der Mitte nach außen, wie
// bei einer Plasmakugel oder Tesla-Spule, der sich über den Reaktor schlängelt). Vier Fassungen zum Testlauf:
// a Plasmakugel: weiche, langsam wabernde Fäden
// b Tesla-Spule: zackige Bögen mit Verästelung, die im schnellen Takt neu knistern
// c Schlange: ein bis zwei lange Fäden winden sich spiralförmig um den Reaktor nach außen
// d Stoß: Lichtring aus der Mitte, Fäden laufen zu den Kupferspulen und knistern dort
const KERN = 58, SPULE = 172, RAND = 262
const zufall = (a, b) => a + Math.random() * (b - a)
const glatt = (a, b, x) => { const v = Math.max(0, Math.min(1, (x - a) / (b - a))); return v * v * (3 - 2 * v) }
const farben = (rot, tesla) => (rot ? ['#ff3a2e', '#ff8a7a'] : tesla ? ['#5ff6ff', '#bffaff'] : ['#7a6bff', '#7ff0ff'])

/** weicher Faden: Winkel und Ausschlag ändern sich mit der Zeit, darum wabert er */
function fadenPunkte(f, z, bis) {
  const pkt = [], n = 44
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * bis, rad = KERN + (f.lang - KERN) * u
    const welle = Math.sin(u * f.k1 + z * f.w1 + f.p1) * f.a1 + Math.sin(u * f.k2 - z * f.w2 + f.p2) * f.a2
    const w = f.w + f.drall * u + welle * (0.25 + 0.75 * u)
    pkt.push([Math.cos(w) * rad, Math.sin(w) * rad])
  }
  return pkt
}
/** zackiger Bogen mit Mittelpunkt-Verschiebung */
function zacken(a, b, rauh, stufen) {
  let p = [a, b]
  for (let s = 0; s < stufen; s++) {
    const neu = [p[0]]
    for (let i = 1; i < p.length; i++) {
      const [x0, y0] = p[i - 1], [x1, y1] = p[i], l = Math.hypot(x1 - x0, y1 - y0), v = (Math.random() - 0.5) * l * rauh
      neu.push([(x0 + x1) / 2 + ((y0 - y1) / (l || 1)) * v, (y0 + y1) / 2 + ((x1 - x0) / (l || 1)) * v], p[i])
    }
    p = neu
  }
  return p
}
const polar = (w, r) => [Math.cos(w) * r, Math.sin(w) * r]
function neuerFaden(w, lang, drall, gross = 1) {
  return { w, lang, drall, k1: zufall(4, 8), k2: zufall(9, 15), w1: zufall(2, 4.5), w2: zufall(3, 6), p1: zufall(0, 6.3), p2: zufall(0, 6.3), a1: zufall(0.12, 0.3) * gross, a2: zufall(0.04, 0.1) * gross }
}
const DAUER = { a: 1.9, b: 0.75, c: 2.6, d: 1.2 }
/** Abstand zum nächsten Impuls in Sekunden (ruhig; rate wie beim alten Blitz: denkt/spricht öfter) */
const PAUSE = { a: [7, 14], b: [8, 15], c: [9, 16], d: [8, 14] }

function neuerImpuls(art, t) {
  const start = zufall(0, 6.28), i = { art, von: t, dauer: DAUER[art], faeden: [] }
  if (art === 'a') { const n = 4 + Math.floor(Math.random() * 4); for (let k = 0; k < n; k++) i.faeden.push(neuerFaden(start + (k / n) * 6.28 + zufall(-0.3, 0.3), zufall(190, RAND), zufall(-0.5, 0.5))) }
  if (art === 'b') { const n = 3 + Math.floor(Math.random() * 3); i.ziele = Array.from({ length: n }, (_, k) => ({ w: start + (k / n) * 6.28 + zufall(-0.4, 0.4), lang: zufall(170, RAND) })) }
  if (art === 'c') { const n = Math.random() < 0.4 ? 2 : 1, vz = Math.random() < 0.5 ? -1 : 1; for (let k = 0; k < n; k++) i.faeden.push(neuerFaden(start + k * 3.14, zufall(235, RAND), vz * zufall(3.4, 5.2), 0.55)) }
  if (art === 'd') { const spulen = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3)); for (const k of spulen) i.faeden.push(neuerFaden(-Math.PI / 2 + (k * Math.PI) / 4, SPULE, zufall(-0.2, 0.2), 0.6)) }
  return i
}

function strich(g, pkt, von, breite, farbe, deck) {
  if (pkt.length - von < 2 || deck <= 0.003) return
  g.beginPath(); g.moveTo(pkt[von][0], pkt[von][1]); for (let i = von + 1; i < pkt.length; i++) g.lineTo(pkt[i][0], pkt[i][1])
  g.lineWidth = breite; g.strokeStyle = farbe; g.globalAlpha = Math.min(1, deck); g.stroke()
}
/** Faden in drei Lagen, zur Spitze dünner */
function faden(g, pkt, hell, [aussen, mitte]) {
  strich(g, pkt, 0, 15, aussen, 0.13 * hell); strich(g, pkt, 0, 6, mitte, 0.42 * hell); strich(g, pkt, 0, 1.5, '#ffffff', 0.9 * hell)
  strich(g, pkt.slice(0, Math.ceil(pkt.length * 0.55)), 0, 2.7, '#ffffff', 0.85 * hell)
}
function glimmen(g, x, y, r, farbe, deck) {
  const v = g.createRadialGradient(x, y, 0, x, y, r); v.addColorStop(0, `rgba(235,255,255,${Math.min(1, deck)})`); v.addColorStop(0.35, farbe); v.addColorStop(1, 'rgba(0,0,0,0)')
  g.globalAlpha = Math.min(1, deck); g.fillStyle = v; g.fillRect(x - r, y - r, r * 2, r * 2)
}
const umhuellend = (z, ein, dauer, aus) => glatt(0, ein, z) * (1 - glatt(dauer - aus, dauer, z))

function zeichne(g, i, z, rot) {
  const n = z / i.dauer
  if (i.art === 'a' || i.art === 'c') {
    const f = farben(rot, false), bis = i.art === 'c' ? glatt(0, 0.6, n) : glatt(0, 0.22, n), hell = umhuellend(z, 0.12, i.dauer, i.art === 'c' ? 0.8 : 0.7) * (0.8 + 0.2 * Math.sin(z * 31))
    for (const x of i.faeden) { const pkt = fadenPunkte(x, z, Math.max(0.06, bis)); faden(g, pkt, hell, f); const e = pkt[pkt.length - 1]; glimmen(g, e[0], e[1], 26, 'rgba(120,120,255,0.3)', hell * 0.75) }
    return hell
  }
  if (i.art === 'b') {
    const f = farben(rot, true), bis = glatt(0, 0.12, n), hell = (1 - glatt(0.7, 1, n)) * (Math.random() < 0.18 ? 0.35 : 1)
    const takt = Math.floor(z / 0.055)
    if (takt !== i.takt) { // neue Form alle 55 ms: das macht das Knistern
      i.takt = takt
      i.boegen = i.ziele.map((a) => {
        const w = a.w + zufall(-0.12, 0.12), haupt = zacken(polar(w + zufall(-0.3, 0.3), KERN), polar(w, a.lang * bis), 0.42, 5), aeste = []
        for (let k = 0; k < 2; k++) { const p = haupt[Math.floor(zufall(haupt.length * 0.35, haupt.length * 0.9))], wa = Math.atan2(p[1], p[0]) + zufall(-0.9, 0.9), l = zufall(26, 70); aeste.push(zacken(p, [p[0] + Math.cos(wa) * l, p[1] + Math.sin(wa) * l], 0.5, 3)) }
        return { haupt, aeste }
      })
    }
    for (const b of i.boegen) {
      faden(g, b.haupt, hell, f)
      for (const a of b.aeste) { strich(g, a, 0, 6, f[0], 0.14 * hell); strich(g, a, 0, 1.3, '#ffffff', 0.75 * hell) }
      const e = b.haupt[b.haupt.length - 1]; glimmen(g, e[0], e[1], 20, 'rgba(95,246,255,0.3)', hell * 0.7)
    }
    return hell
  }
  // d: Lichtring läuft nach außen, Fäden erreichen die Spulen und knistern dort
  const f = farben(rot, true), ring = glatt(0, 0.45, n), rr = KERN + ring * (RAND - KERN), rh = (1 - glatt(0.2, 0.5, n)) * 0.7
  g.beginPath(); g.arc(0, 0, rr, 0, 6.2832); g.strokeStyle = f[1]; g.globalAlpha = rh * 0.5; g.lineWidth = 8; g.stroke(); g.strokeStyle = '#ffffff'; g.globalAlpha = rh; g.lineWidth = 1.4; g.stroke()
  const bis = glatt(0.05, 0.3, n), hell = umhuellend(z, 0.06, i.dauer, 0.55) * (0.8 + 0.2 * Math.sin(z * 37))
  for (const x of i.faeden) {
    const pkt = fadenPunkte(x, z, Math.max(0.06, bis)); faden(g, pkt, hell, f)
    if (bis > 0.95) { const e = pkt[pkt.length - 1]; glimmen(g, e[0], e[1], 30, 'rgba(95,246,255,0.32)', hell * 0.85); for (let k = 0; k < 2; k++) { const wa = zufall(0, 6.28), l = zufall(16, 40), z2 = zacken(e, [e[0] + Math.cos(wa) * l, e[1] + Math.sin(wa) * l], 0.5, 3); strich(g, z2, 0, 1.2, '#ffffff', 0.7 * hell) } }
  }
  return Math.max(hell, rh)
}

/** rate: je größer, desto häufiger; s = Szene. Setzt s.blitzHell, damit Kern und Lichthof mitleuchten */
export function plasma(g, s, t, rate, anteil, art) {
  const r = s.geo.kern ?? s.geo.reaktor
  if (!s.plasmaNaechst) s.plasmaNaechst = t + 1.5
  if (t >= s.plasmaNaechst) {
    s.plasmaListe = [...(s.plasmaListe ?? []), neuerImpuls(art, t)]
    const [a, b] = PAUSE[art]; s.plasmaNaechst = t + zufall(a, b) / rate
  }
  s.plasmaListe = (s.plasmaListe ?? []).filter((i) => t - i.von < i.dauer)
  s.blitzHell = 0
  if (!s.plasmaListe.length || anteil <= 0) return
  g.save(); g.translate(r.x, r.y); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round'
  for (const i of s.plasmaListe) {
    const z = t - i.von
    glimmen(g, 0, 0, 120, 'rgba(120,200,255,0.25)', (1 - glatt(0, 0.7, z)) * 0.8 * anteil) // Impuls im Kern
    s.blitzHell = Math.max(s.blitzHell, zeichne(g, i, z, s.rot > 0.5) * anteil)
  }
  g.restore()
}
