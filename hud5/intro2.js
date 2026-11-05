// Intro, Runde 3 (05.11.2026, Rückmeldung Auftraggeber zu Runde 2: selbstgerechneter Rauch „bringt nichts“ → raus;
// Reaktor außen unvollständig → Teile jetzt aus dem VOLLSTÄNDIGEN Reaktor (Grundbild mit Steinkranz + Reaktor-Ebene +
// L.O.K.I.-Bronze), Außenkante exakt nach dem Stein-Umriss; echte Rauch-Videos (Magnific, bereits bezahlt) für
// Seitenstoß, Ausstoß aus der Mitte und Rauchteppich über dem See; Fenster einzeln effektvoll; Basis 3 und 4).
// Jede Variante = Ereignisliste E; Bild, Rauch-Videos und Ton lesen dieselbe Liste.
import { B, H } from './szene.js'

const glatt = (x) => { const v = Math.max(0, Math.min(1, x)); return v * v * (3 - 2 * v) }
const r = (t, a, b) => glatt((t - a) / (b - a))
const lin = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)))
const blitz = (t, bei, dauer = 0.6) => (t < bei ? 0 : Math.exp(-(t - bei) / (dauer / 3)))
const zz = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x) }
const ausWinkel = (grad) => (grad * Math.PI) / 180 - Math.PI / 2 // Grad ab oben im Uhrzeigersinn → Zeichenwinkel
const N = 700, M = 350 // Teile-Leinwand 700×700 um die Reaktormitte

// ---------- Reaktor in seine Elemente zerlegen ----------
const bildLaden = (u) => new Promise((ok, f) => { const i = new Image(); i.onload = () => ok(i); i.onerror = f; i.src = u })
/** Einmal beim Laden: vollständiger Reaktor (wie im fertigen Bild) → Kern, Innenring, Spulenring, 8 Steinteile */
export async function reaktorTeile(s, basis = './ebenen/') {
  const m = await (await fetch(basis + 'reaktor-teile.json')).json(), umriss = await bildLaden(basis + 'reaktor-umriss.png')
  const k = s.geo.reaktor, gr = s.bilder.grund, er = s.geo.ebenen.reaktor, el = s.geo.ebenen.lokiBronze
  // Quelle: genau das, was im Wallpaper an dieser Stelle zu sehen ist (ohne Leuchteffekte, die kommen beim Zünden)
  const q = document.createElement('canvas'); q.width = q.height = N; const qg = q.getContext('2d')
  qg.drawImage(gr, ((k.x - M) * gr.width) / B, ((k.y - M) * gr.height) / H, (N * gr.width) / B, (N * gr.height) / H, 0, 0, N, N)
  qg.drawImage(s.bilder.reaktor, er.x - k.x + M, er.y - k.y + M, er.b, er.h)
  if (el && s.bilder.lokiBronze) qg.drawImage(s.bilder.lokiBronze, el.x - k.x + M, el.y - k.y + M, el.b, el.h)
  qg.globalCompositeOperation = 'destination-in'; qg.drawImage(umriss, 0, 0)
  // dunkle Abdeckung: der Reaktor steckt auch im Grundbild – solange er sich aufbaut, dort Nacht
  const maske = document.createElement('canvas'); maske.width = maske.height = N; const mg = maske.getContext('2d')
  mg.filter = 'blur(3px)'; mg.drawImage(umriss, -8, -8, N + 16, N + 16); mg.filter = 'none'; mg.globalCompositeOperation = 'source-in'; mg.fillStyle = '#02060a'; mg.fillRect(0, 0, N, N)

  const n = m.schritte, rad = (liste, g) => liste[Math.round((((g % 360) + 360) % 360) * (n / 360)) % n]
  const pkt = (g, rr) => [M + Math.cos(ausWinkel(g)) * rr, M + Math.sin(ausWinkel(g)) * rr]
  const teil = (pfad, mitte, extra = {}) => {
    const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d')
    g.beginPath(); pfad(g); g.closePath(); g.clip(); g.drawImage(q, 0, 0)
    return { c, mitte, ...extra }
  }
  const kreis = (liste, rueck) => (g) => { if (rueck) for (let a = 360; a >= 0; a -= 0.5) g.lineTo(...pkt(a, rad(liste, a))); else for (let a = 0; a <= 360; a += 0.5) a ? g.lineTo(...pkt(a, rad(liste, a))) : g.moveTo(...pkt(a, rad(liste, a))) }
  const T = {
    kern: teil(kreis(m.kern), [0, 0]),
    innen: teil((g) => { kreis(m.innen)(g); kreis(m.kern, true)(g) }, [0, 0]),
    spulen: teil((g) => { kreis(m.stein)(g); kreis(m.innen, true)(g) }, [0, 0]),
    stein: [], maske, quelle: q,
  }
  const f = m.fugen
  for (let i = 0; i < f.length; i++) {
    const a0 = f[i], a1 = f[(i + 1) % f.length] + (f[(i + 1) % f.length] < a0 ? 360 : 0), am = (a0 + a1) / 2
    T.stein.push(teil((g) => {
      for (let a = a0; a <= a1; a += 0.5) a === a0 ? g.moveTo(...pkt(a, 360)) : g.lineTo(...pkt(a, 360))
      for (let a = a1; a >= a0; a -= 0.5) g.lineTo(...pkt(a, rad(m.stein, a)))
    }, [Math.cos(ausWinkel(am)) * 265, Math.sin(ausWinkel(am)) * 265], { winkel: am }))
  }
  s.teile = T
  return T
}

/** Reaktor aus Teilen zeichnen; je Teil { dx, dy, dreh (um die Mitte), spin (um eigenen Schwerpunkt), skala, an, glut } */
export function zeichneReaktorTeile(g, s, z, hell = 1) {
  const T = s.teile, k = s.geo.reaktor
  const eins = (teil, st = {}) => {
    const an = (st.an ?? 1) * hell; if (an <= 0.003) return
    g.save(); g.translate(k.x + (st.dx ?? 0), k.y + (st.dy ?? 0)); g.rotate(st.dreh ?? 0)
    const [cx, cy] = teil.mitte; g.translate(cx, cy); g.rotate(st.spin ?? 0); g.scale(st.skala ?? 1, st.skala ?? 1); g.translate(-cx, -cy)
    g.globalAlpha = Math.min(1, an); g.drawImage(teil.c, -M, -M)
    if (st.glut > 0.01) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, st.glut) * 0.75 * hell; g.drawImage(teil.c, -M, -M) }
    g.restore()
  }
  eins(T.kern, z.kern); eins(T.innen, z.innen); eins(T.spulen, z.spulen)
  T.stein.forEach((t, i) => eins(t, z.stein?.[i]))
}
export function zeichneReaktorMaske(g, s, an = 1) { const k = s.geo.reaktor; g.save(); g.globalAlpha = an; g.drawImage(s.teile.maske, k.x - M, k.y - M); g.restore() }

// ---------- Rauch-Videos ----------
const CLIPS = { seite: 'seite.mp4', mitte: 'mitte.mp4', welle: 'welle.mp4' }
let fest = false
/** je Verwendung ein eigenes Video-Element (gleiches Video kann mehrfach gleichzeitig mit anderer Startzeit laufen) */
export function erstelleClips(basis = './rauch/') {
  const liste = {}
  return {
    holen(name, kennung) {
      const id = name + ':' + kennung
      if (!liste[id]) { const v = document.createElement('video'); v.src = basis + CLIPS[name]; v.muted = true; v.preload = 'auto'; v.playsInline = true; liste[id] = v }
      return liste[id]
    },
    stoppen() { for (const v of Object.values(liste)) v.pause() },
    async bereit() { await Promise.all(Object.values(liste).map((v) => (v.seeking || v.readyState < 2 ? new Promise((ok) => { const f = () => { v.removeEventListener('seeked', f); ok() }; v.addEventListener('seeked', f); setTimeout(ok, 1500) }) : null))) },
    set fest(w) { fest = w },
  }
}
/** Video-Rauch zeichnen: aufhellend („screen“) – heller Rauch deckt die Szene ab, schwarzer Grund verschwindet */
function rauchVideo(g, clips, name, kennung, t, start, { x, y, b, h, spiegel = false, alpha = 1, tempo = 1 }) {
  const v = clips.holen(name, kennung), d = (t - start) * tempo
  if (d < 0 || (v.duration && d > v.duration - 0.06)) { if (!v.paused) v.pause(); return }
  if (fest) { if (Math.abs(v.currentTime - d) > 0.02) v.currentTime = d }
  else { v.playbackRate = tempo; if (Math.abs(v.currentTime - d) > 0.18 && !v.seeking) v.currentTime = d; if (v.paused) v.play().catch(() => {}) }
  if (v.readyState < 2) return
  // Video-Schwarz ist nicht ganz schwarz → Schwarz herunterdrücken und Ränder weich ausblenden (sonst sieht man den Kasten)
  const z = zwischen(), zg = z.getContext('2d')
  zg.globalCompositeOperation = 'source-over'; zg.filter = 'brightness(1.08) contrast(1.45)'; zg.clearRect(0, 0, z.width, z.height); zg.drawImage(v, 0, 0, z.width, z.height); zg.filter = 'none'
  zg.globalCompositeOperation = 'destination-in'; zg.drawImage(randMaske(), 0, 0, z.width, z.height)
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = alpha
  if (spiegel) { g.translate(x + b, y); g.scale(-1, 1); g.drawImage(z, 0, 0, b, h) } else g.drawImage(z, x, y, b, h)
  g.restore()
}
let zw = null, rm = null
const zwischen = () => { if (!zw) { zw = document.createElement('canvas'); zw.width = 960; zw.height = 540 } return zw }
function randMaske() { // weiche Kanten: rundum 12 % Verlauf
  if (rm) return rm
  rm = document.createElement('canvas'); rm.width = 960; rm.height = 540; const g = rm.getContext('2d')
  const x = g.createLinearGradient(0, 0, 960, 0); x.addColorStop(0, 'rgba(0,0,0,0)'); x.addColorStop(0.12, '#000'); x.addColorStop(0.88, '#000'); x.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = x; g.fillRect(0, 0, 960, 540)
  g.globalCompositeOperation = 'destination-in'
  const y = g.createLinearGradient(0, 0, 0, 540); y.addColorStop(0, 'rgba(0,0,0,0)'); y.addColorStop(0.12, '#000'); y.addColorStop(0.88, '#000'); y.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = y; g.fillRect(0, 0, 960, 540)
  return rm
}
// Platzierungen (Szenen-Pixel)
const SEITE_L = { x: -120, y: -110, b: 2350, h: 1322 }, SEITE_R = { ...SEITE_L, x: B - 2350 + 120, spiegel: true }
const mitteAm = (k, gr = 1) => ({ x: k.x - 950 * gr, y: k.y - 560 * gr, b: 1900 * gr, h: 1069 * gr })
const SEE = (dx = 0, b = 2700) => ({ x: B / 2 - b / 2 + dx, y: 820 - (590 * b) / 1920, b, h: (1080 * b) / 1920 }) // Teppichkante auf die Wasserlinie

// ---------- gemeinsamer Rahmen (aus 3 und 4) ----------
const einrasten = (t, ende, dauer) => { const p = lin(t, ende - dauer, ende); return { p, rest: Math.pow(1 - p, 2.4), glut: t >= ende ? Math.exp(-(t - ende) / 0.25) : 0 } }
const ringEin = (t, von, rast, umdrehungen, richtung = 1) => {
  if (t < von) return { an: 0 }
  const p = lin(t, von, rast)
  return { an: Math.min(1, (t - von) * 5), dreh: richtung * umdrehungen * Math.PI * 2 * Math.pow(1 - p, 2.2), skala: 1 + 0.22 * Math.pow(1 - p, 3), glut: t >= rast ? Math.exp(-(t - rast) / 0.3) : 0.12 }
}
const kernAn = (t, E) => ({ an: t >= E.einschlag ? 1 : 0.55 * r(t, E.innen[1], E.innen[1] + 0.4), glut: t >= E.einschlag ? Math.exp(-(t - E.einschlag) / 0.4) : 0 })
function grundZustand(t, E) {
  const e = t >= E.einschlag, s = 1 - 0.72 * r(t, E.dunkel, E.einschlag - 0.25) * (e ? 0 : 1)
  const zucken = (E.blitze ?? []).reduce((m, b) => Math.max(m, blitz(t, b, 0.4)), 0) * (e ? 0 : 1)
  return {
    e, s, zucken,
    an: {
      grund: e ? r(t, E.einschlag, E.einschlag + 0.9) : Math.max(0.08 * r(t, 2.5, 5) * s, 0.85 * zucken),
      aurora: e ? 1 : Math.max(0.45 * r(t, 4, 8) * s, 0.5 * zucken),
      seiten: 1, zuenden: e ? 1 : r(t, E.runen[0], E.runen[1]), vonAussen: true,
      ring: e ? 1 : r(t, E.ring[0], E.ring[0] + 1.6) * s, ringDreh: 7 * Math.pow(1 - lin(t, E.ring[0], E.ring[1]), 2.4),
      kern: 1, reaktor: r(t, E.einschlag, E.einschlag + 0.8), nebel: r(t, E.einschlag, E.einschlag + 1.8), schrift: e ? 1 : 0,
      rand: e ? 1 : Math.max(0.6 * r(t, E.rand[0], E.rand[1]), zucken * 0.6) * s, randWeg: 820 * Math.pow(1 - r(t, E.rand[0], E.rand[1]), 2),
    },
    blitz: Math.max(blitz(t, E.einschlag, 0.9), 0.22 * zucken), welle: [E.einschlag, E.einschlag + 0.35],
    funken: (E.funken ?? []).some((f) => t >= f && t < f + 0.12) ? 1 : 0,
    tafeln: { art: E.fenster, links: lin(t, E.tafeln, E.tafeln + 1.8), rechts: lin(t, E.tafeln + 0.3, E.tafeln + 2.1) },
  }
}
const FELDER = 5
export const feldZeiten = (start) => Array.from({ length: FELDER }, (_, i) => start + (1.8 * i) / (FELDER + 2))
const BASIS = {
  blitze: [1.2, 2.45, 2.58], runen: [1.4, 5.6], runenTicks: Array.from({ length: 11 }, (_, i) => 1.6 + i * 0.36),
  rand: [3.7, 4.5], ring: [4.4, 8.6], dunkel: 9.3, einschlag: 10.5, tafeln: 11.0, gruss: 12.8,
  funken: [9.45, 9.7, 9.9, 10.05, 10.18, 10.28, 10.37, 10.44], herz: [9.5, 9.92, 10.22],
  spulen: [7.9, 8.75], innen: [8.3, 9.2],
}
const UHR = [0, 1, 2, 3, 4, 5, 6, 7] // Steinteile im Uhrzeigersinn ab oben

// ---------- Die fünf Varianten ----------
export const VARIANTEN = {
  1: {
    name: 'Runenkette',
    text: 'Basis 3: Runen glimmen von außen herein; die Steinteile des Reaktors erscheinen nacheinander im Uhrzeigersinn an ihrem Platz, jedes leuchtet beim Erscheinen auf. Rauch wird von beiden Seiten hereingeblasen, als die Steinränder einfahren; Ringe drehen ein; beim Einschlag quillt Rauch hinter dem Reaktor hervor. Fenster flackern einzeln wie Hologramme an.',
    E: { ...BASIS, steine: UHR.map((i, j) => ({ i, t: 5.2 + j * 0.32 })), fenster: 'holo', rauch: { seite: 3.5, mitte: 10.45 } },
    reaktor(t, E) {
      const stein = []
      for (const { i, t: tl } of E.steine) stein[i] = t < tl - 0.12 ? { an: 0 } : { an: lin(t, tl - 0.12, tl + 0.05), skala: 1 + 0.07 * Math.exp(-Math.max(0, t - tl) / 0.12), glut: t >= tl ? Math.exp(-(t - tl) / 0.45) : 0.6 }
      return { stein, spulen: ringEin(t, E.spulen[0], E.spulen[1], 2, 1), innen: ringEin(t, E.innen[0], E.innen[1], 3, -1), kern: kernAn(t, E) }
    },
  },
  2: {
    name: 'Gewitter',
    text: 'Basis 4: Jeder Blitz reißt die Landschaft aus dem Dunkel und schweißt dabei ein Steinteil an seinen Platz. Rauch wird beim Einfahren der Steinränder hereingeblasen. Beim Einschlag doppelte Druckwelle und ein Rauchteppich, der über den See rollt. Fenster richten sich aus der Fläche in die Schräge auf (wie in 4).',
    E: { ...BASIS, blitze: [1.2, 2.2, 3.1, 4.9, 5.75, 6.55, 7.3, 7.9, 7.98], steine: [0, 2, 6, 4, 1, 7, 3, 5].map((i, j) => ({ i, t: [1.2, 2.2, 3.1, 4.9, 5.75, 6.55, 7.3, 7.9][j] })), rand: [3.8, 4.6], fenster: 'flach', rauch: { seite: 3.6, see: 10.55 } },
    reaktor(t, E) {
      const stein = []
      for (const { i, t: tl } of E.steine) stein[i] = t < tl ? { an: 0 } : { an: 1, glut: Math.exp(-(t - tl) / 0.55), skala: 1 + 0.05 * Math.exp(-(t - tl) / 0.15) }
      return { stein, spulen: ringEin(t, 8.0, E.spulen[1], 2, -1), innen: ringEin(t, E.innen[0], E.innen[1], 3, 1), kern: kernAn(t, E) }
    },
  },
  3: {
    name: 'Schmiede',
    text: 'Rauch zischt hinter dem leeren Sockel hervor, dann schießen die Steinteile von weit außen heran und schlagen nacheinander ein (Hammerschläge). Steinränder fahren mit hereingeblasenem Rauch ein, Ringe sinken drehend ein und rasten. Fenster schlagen einzeln mit Lichtblitz ein.',
    E: { ...BASIS, steine: [0, 4, 2, 6, 1, 5, 3, 7].map((i, j) => ({ i, t: 5.4 + j * 0.31 })), flug: 0.4, fenster: 'feld-schlag', rauch: { mitte: 4.9, seite: 3.5 } },
    reaktor(t, E) {
      const stein = []
      for (const { i, t: tl } of E.steine) { const { p, rest, glut } = einrasten(t, tl, E.flug), w = ausWinkel(s_.winkel(i)), weg = 1500 * rest; stein[i] = { an: p > 0 ? 1 : 0, dx: Math.cos(w) * weg, dy: Math.sin(w) * weg, spin: rest * 1.1 * (i % 2 ? 1 : -1), glut } }
      return { stein, spulen: ringEin(t, E.spulen[0], E.spulen[1], 2.5, 1), innen: ringEin(t, E.innen[0], E.innen[1], 3.5, -1), kern: kernAn(t, E) }
    },
  },
  4: {
    name: 'Aus dem See',
    text: 'Ein Rauchteppich rollt über den See, aus ihm steigen die Steinteile auf – unten zuerst, oben zuletzt. Steinränder fahren mit hereingeblasenem Rauch ein, die Ringe senken sich von oben drehend ein. Fenster klappen einzeln aus einer Lichtlinie auf.',
    E: { ...BASIS, steine: [4, 3, 5, 2, 6, 1, 7, 0].map((i, j) => ({ i, t: 5.4 + j * 0.34 })), flug: 0.8, fenster: 'feld-klappen', rauch: { see: 4.4, seite: 3.5, mitte: 10.45 } },
    reaktor(t, E) {
      const stein = []
      for (const { i, t: tl } of E.steine) { const { p, rest, glut } = einrasten(t, tl, E.flug); stein[i] = { an: p > 0 ? Math.min(1, p * 2) : 0, dy: 780 * rest, spin: rest * 0.25 * (i % 2 ? 1 : -1), glut } }
      const sinkt = (st, von, rast) => (st.an ? { ...st, dy: -480 * Math.pow(1 - lin(t, von, rast), 2) } : st)
      return { stein, spulen: sinkt(ringEin(t, E.spulen[0], E.spulen[1], 2.5, 1), E.spulen[0], E.spulen[1]), innen: sinkt(ringEin(t, E.innen[0], E.innen[1], 3.5, -1), E.innen[0], E.innen[1]), kern: kernAn(t, E) }
    },
  },
  5: {
    name: 'Druckwelle nach innen',
    text: 'Basis 3+4 im Dunkeln: Blitze, Runen, die Steinteile kreisen spiralförmig herein. Dann der Wendepunkt: Die Steinränder schlagen mit Rauch von beiden Seiten ein, eine Druckwelle läuft von außen auf den Reaktor zu – trifft die Mitte, Zündung, Welle und Rauch nach außen. Fenster fliegen einzeln von vorn herein.',
    E: { ...BASIS, steine: [0, 4, 2, 6, 1, 5, 3, 7].map((i, j) => ({ i, t: 4.8 + j * 0.38 })), flug: 1.5, rand: [9.25, 9.6], innen: [8.1, 8.9], spulen: [7.6, 8.5], fenster: 'feld-fliegen', rauch: { seite: 9.05, mitte: 10.45 }, welleInnen: [9.6, 10.5] },
    reaktor(t, E) {
      const stein = []
      for (const { i, t: tl } of E.steine) {
        const { p, rest, glut } = einrasten(t, tl, E.flug), w0 = ausWinkel(s_.winkel(i)), w = w0 - rest * 2.4, rr = 1 + rest * 3
        stein[i] = { an: p > 0 ? Math.min(1, p * 3) : 0, dx: Math.cos(w) * 265 * rr - Math.cos(w0) * 265, dy: Math.sin(w) * 265 * rr * 0.75 - Math.sin(w0) * 265, spin: -rest * 2.4, glut }
      }
      return { stein, spulen: ringEin(t, E.spulen[0], E.spulen[1], 4, 1), innen: ringEin(t, E.innen[0], E.innen[1], 5, -1), kern: kernAn(t, E) }
    },
  },
}
const s_ = { winkel: (i) => (s_.s?.teile?.stein[i]?.winkel ?? i * 45), s: null }

/** Zustand einer Variante zur Zeit t */
export function introZustand(nr, t, s) {
  s_.s = s
  const V = VARIANTEN[nr], E = V.E, z = grundZustand(t, E)
  z.reaktorTeile = t >= E.einschlag + 0.25 ? null : V.reaktor(t, E)
  if (!z.reaktorTeile) z.an.schrift = 1
  z.E = E
  return z
}

/** Rauch-Videos: hinten (hinter dem Reaktor) bzw. vorn (vor der Landschaft, unter den Fenstern) */
export function rauchHinten(g, s, t, z, clips) {
  const R = z.E.rauch, k = s.geo.reaktor
  // nach dem Einschlag verzieht sich der Rauch bis zum Endbild (Ende bildgleich mit dem Wallpaper)
  const weg = R.mitte >= z.E.einschlag ? 1 - lin(t, R.mitte + 1.8, R.mitte + 3.0) : 1
  if (R.mitte != null) rauchVideo(g, clips, 'mitte', 'a', t, R.mitte, { ...mitteAm(k, 1.15), alpha: 0.95 * weg })
}
export function rauchVorn(g, s, t, z, clips) {
  const R = z.E.rauch
  if (R.seite != null) { rauchVideo(g, clips, 'seite', 'l', t, R.seite, { ...SEITE_L, alpha: 0.9, tempo: 1.15 }); rauchVideo(g, clips, 'seite', 'r', t, R.seite + 0.05, { ...SEITE_R, alpha: 0.9, tempo: 1.15 }) }
  if (R.see != null) { rauchVideo(g, clips, 'welle', 'm', t, R.see, { ...SEE(0, 2900), alpha: 0.8 }); rauchVideo(g, clips, 'welle', 'l', t, R.see + 0.25, { ...SEE(-1900, 2400), alpha: 0.6, spiegel: true }); rauchVideo(g, clips, 'welle', 'r', t, R.see + 0.25, { ...SEE(1900, 2400), alpha: 0.6 }) }
}
/** zusätzliche Lichteffekte dieser Runde: Druckwelle nach innen (Variante 5) */
export function licht2(g, s, t, z) {
  const W = z.E.welleInnen; if (!W || t < W[0] || t > W[1]) return
  const k = s.geo.reaktor, f = lin(t, W[0], W[1]), rad = 3300 * Math.pow(1 - f, 1.6) + 40, dicke = 70 + 60 * (1 - f)
  g.save(); g.globalCompositeOperation = 'lighter'
  const v = g.createRadialGradient(k.x, k.y, Math.max(0, rad - dicke), k.x, k.y, rad + dicke)
  v.addColorStop(0, 'rgba(95,246,255,0)'); v.addColorStop(0.5, `rgba(200,255,255,${0.35 + 0.5 * f})`); v.addColorStop(1, 'rgba(95,246,255,0)')
  g.fillStyle = v; g.fillRect(k.x - rad - dicke, k.y - rad - dicke, (rad + dicke) * 2, (rad + dicke) * 2); g.restore()
}

// ---------- Ton (aus derselben Ereignisliste) ----------
const D2 = 73.42, A2 = 110, F3 = 174.61, D3 = 146.83
export function tonFuer(nr, s) {
  s_.s = s ?? s_.s
  const V = VARIANTEN[nr], E = V.E, R = E.rauch
  return {
    name: V.name,
    spielen({ spiel, T, S }) {
      spiel('rumpeln', T(0.1), { laut: 0.5, ein: 1.2, bis: T(E.dunkel + 0.4), hallAnteil: 0 })
      S.pad(T(1.2), T(E.dunkel), [D2, A2, F3], { laut: 0.065, lp: 260, lpBis: 1300, an: 3 })
      E.blitze.forEach((b, i) => { spiel('blitzschlag', T(b), { laut: i > 0 && b - E.blitze[i - 1] < 0.2 ? 0.3 : 0.6, seite: (zz(i) - 0.5) * 1.2 }); S.sub(T(b + 0.04), { von: 70, bis: 30, dauer: 1.4, laut: 0.4 }) })
      E.runenTicks.forEach((tt, i) => spiel(i % 3 === 2 ? 'hud_piep' : 'ping', T(tt), { laut: 0.14, tempo: 0.9 + i * 0.03, seite: (i % 2 ? 1 : -1) * (0.9 - i * 0.07), hallAnteil: 0.5 }))
      // Rauch-Videos: Seitenstoß = Druckluft-Rauschen von außen nach innen; Mitte = einmaliges Zischen; See = tiefes Rollen
      if (R.seite != null) { S.riser(T(R.seite), T(R.seite + 1.0), { von: 140, bis: 1500, laut: 0.22, seite: -0.8 }); S.riser(T(R.seite + 0.05), T(R.seite + 1.05), { von: 150, bis: 1600, laut: 0.22, seite: 0.8 }) }
      if (R.mitte != null && R.mitte < E.einschlag) spiel('pneumatik', T(R.mitte), { laut: 0.6, hallAnteil: 0.35 })
      if (R.see != null) { spiel('rumpeln', T(R.see), { laut: 0.35, bis: T(R.see + 3), hallAnteil: 0.2 }); S.riser(T(R.see), T(R.see + 1.6), { von: 80, bis: 600, laut: 0.16 }) }
      // Steinränder fahren ein, Anschlag
      spiel('metall_schieben', T(E.rand[0]), { laut: 0.55, seite: -0.9 }); spiel('metall_schieben', T(E.rand[0] + 0.05), { laut: 0.55, seite: 0.9 })
      spiel('tor_metall', T(E.rand[1]), { laut: 0.6 }); S.sub(T(E.rand[1]), { laut: 0.5 })
      spiel('braam', T(E.ring[0]), { laut: 0.45 }); spiel('plasma_vorbei', T(E.ring[0]), { laut: 0.28 })
      // Steinteile – Klang nach Art des Erscheinens
      E.steine.forEach(({ i, t: tl }, j) => {
        const seite = Math.cos(ausWinkel(s_.winkel(i))) * 0.75
        if (nr === 1) { spiel('metall_ton', T(tl), { laut: 0.3, tempo: 0.85 + j * 0.04, seite }); spiel('ping', T(tl), { laut: 0.12, tempo: 0.7, seite }) }
        if (nr === 2) spiel('einrasten_2', T(tl + 0.02), { laut: 0.5, seite })
        if (nr === 3) { spiel('warp', T(tl - E.flug), { laut: 0.12, tempo: 2.2, seite }); spiel('eisen_hammer', T(tl), { laut: 0.4, seite }); S.sub(T(tl), { von: 60, bis: 35, dauer: 0.6, laut: 0.3 }) }
        if (nr === 4) { spiel('hydraulik', T(tl - E.flug), { laut: 0.14, tempo: 1.6, seite }); spiel(j % 2 ? 'einrasten_2' : 'einrasten_1', T(tl), { laut: 0.55, seite }) }
        if (nr === 5) { spiel('metall_rueckwaerts', T(tl - 0.5), { laut: 0.15, tempo: 1.4, seite }); spiel(j % 2 ? 'einrasten_2' : 'einrasten_1', T(tl), { laut: 0.55, seite }) }
      })
      const letzter = Math.max(...E.steine.map((x) => x.t))
      spiel('braam_dystopie', T(letzter + 0.05), { laut: 0.42 }); S.sub(T(letzter + 0.05), { laut: 0.42 })
      spiel('servo_3', T(E.spulen[0]), { laut: 0.42 }); spiel('zahnraeder', T(E.spulen[0] + 0.2), { laut: 0.28 })
      spiel('einrasten_2', T(E.spulen[1]), { laut: 0.72 }); spiel('metall_ton', T(E.spulen[1]), { laut: 0.38 })
      spiel('servo_1', T(E.innen[0]), { laut: 0.4, tempo: 1.15 })
      spiel('einrasten_1', T(E.innen[1]), { laut: 0.78 }); spiel('hud_akzent', T(E.innen[1]), { laut: 0.33 })
      E.funken.forEach((f, i) => S.entladung(T(f), { laut: 0.16 + i * 0.03, seite: (zz(i + 3) - 0.5) * 0.6, dauer: 0.22 }))
      E.herz.forEach((h) => S.herz(T(h), { laut: 0.7 }))
      if (E.welleInnen) { spiel('einsaugen', T(E.welleInnen[0]), { laut: 0.85, hallAnteil: 0, schlussBei: T(E.einschlag) }); S.riser(T(E.welleInnen[0]), T(E.einschlag), { laut: 0.32 }) }
      else { S.riser(T(E.dunkel), T(E.einschlag), { laut: 0.26 }); spiel('einsaugen', T(E.einschlag - 1.0), { laut: 0.75, hallAnteil: 0, schlussBei: T(E.einschlag) }) }
      spiel('einschlag_episch', T(E.einschlag), { laut: 1 }); spiel('amboss', T(E.einschlag), { laut: 0.55 }); spiel('braam_metall', T(E.einschlag), { laut: 0.5 })
      S.sub(T(E.einschlag), { von: 95, bis: 28, dauer: 2.6, laut: 0.9 }); spiel('modern_boom', T(E.einschlag + 0.35), { laut: 0.55 })
      if (R.mitte != null && R.mitte >= E.einschlag) spiel('pneumatik', T(R.mitte + 0.05), { laut: 0.45, hallAnteil: 0.4 })
      S.pad(T(E.einschlag), T(22), [D2, A2, D3], { laut: 0.055, lp: 700, an: 1.5, aus: 3 })
      // Fenster: Klang passend zur Einblende-Art, je Fenster
      const fk = { holo: ['hud_an', 'hud_glitch'], flach: ['servo_2', 'hud_klick'], 'feld-schlag': ['hud_akzent', 'eisen_hammer'], 'feld-klappen': ['hud_an', 'hud_scan'], 'feld-fliegen': ['plasma_vorbei', 'hud_klick'] }[E.fenster] ?? ['hud_an', 'hud_glitch']
      feldZeiten(E.tafeln).forEach((ft, i) => spiel(fk[i % 2], T(ft), { laut: 0.2, seite: -0.7, tempo: E.fenster === 'feld-fliegen' ? 1.8 : 1 }))
      feldZeiten(E.tafeln + 0.3).forEach((ft, i) => spiel(fk[i % 2], T(ft), { laut: 0.2, seite: 0.7, tempo: E.fenster === 'feld-fliegen' ? 1.8 : 1 }))
    },
  }
}
