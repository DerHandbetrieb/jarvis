// Intro, zweite Runde (05.11.2026, Rückmeldung Auftraggeber: 3 und 4 mischen; Reaktor soll sich aus seinen ECHTEN
// Elementen aufbauen – sauber an den Fugen getrennt, keine Tortenstücke; Rauch, der wie durch Druck hereingeblasen
// wirkt; Ton genau auf das Bild getaktet, kein Dauerzischen).
// Aufbau: Jede Variante ist eine Liste von Ereignissen (E). Bild, Rauch-Simulation und Ton lesen dieselbe Liste.
// Reaktor-Elemente: Kern, Innenring, Spulenring und 8 Steinteile – Grenzen in ebenen/reaktor-teile.json (gemessen an
// den dunklen Fugen im Reaktor-Bild, scripts/reaktor-teile.cjs).
import { B, H } from './szene.js'

const glatt = (x) => { const v = Math.max(0, Math.min(1, x)); return v * v * (3 - 2 * v) }
const r = (t, a, b) => glatt((t - a) / (b - a))
const lin = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)))
const blitz = (t, bei, dauer = 0.6) => (t < bei ? 0 : Math.exp(-(t - bei) / (dauer / 3)))
const zz = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x) }
const ausWinkel = (grad) => (grad * Math.PI) / 180 - Math.PI / 2 // Grad ab oben im Uhrzeigersinn → Zeichenwinkel

// ---------- Reaktor in Elemente zerlegen ----------
/** Einmal beim Laden: aus Reaktor-Bild und gemessenen Grenzen je Element eine eigene Leinwand (freigestellt) */
export async function reaktorTeile(s, basis = './ebenen/') {
  const m = await (await fetch(basis + 'reaktor-teile.json')).json()
  const e = s.geo.ebenen.reaktor, k = s.geo.reaktor ?? s.geo.ringMitte, bild = s.bilder.reaktor, n = m.schritte
  const mx = k.x - e.x, my = k.y - e.y
  const rad = (liste, grad) => liste[Math.round((((grad % 360) + 360) % 360) * (n / 360)) % n]
  const punkt = (grad, rr) => [mx + Math.cos(ausWinkel(grad)) * rr, my + Math.sin(ausWinkel(grad)) * rr]
  const teil = (name, pfad, mitte) => {
    const c = document.createElement('canvas'); c.width = bild.width; c.height = bild.height; const g = c.getContext('2d')
    const sx = bild.width / e.b, sy = bild.height / e.h
    g.scale(sx, sy); g.beginPath(); pfad(g); g.closePath(); g.clip(); g.drawImage(bild, 0, 0, e.b, e.h)
    return { name, c, mitte } // mitte: Schwerpunkt relativ zur Reaktormitte (Szenen-Pixel)
  }
  const ring = (innen, aussen) => (g) => {
    for (let a = 0; a <= 360; a += 0.5) { const [x, y] = punkt(a, aussen ? rad(aussen, a) : 330); a ? g.lineTo(x, y) : g.moveTo(x, y) }
    if (innen) for (let a = 360; a >= 0; a -= 0.5) { const [x, y] = punkt(a, rad(innen, a)); g.lineTo(x, y) }
  }
  const teile = {
    kern: teil('kern', (g) => { for (let a = 0; a <= 360; a += 0.5) { const [x, y] = punkt(a, rad(m.kern, a)); a ? g.lineTo(x, y) : g.moveTo(x, y) } }, [0, 0]),
    innen: teil('innen', ring(m.kern, m.innen), [0, 0]),
    spulen: teil('spulen', ring(m.innen, m.stein), [0, 0]),
    stein: [],
  }
  const f = m.fugen
  for (let i = 0; i < f.length; i++) {
    const a0 = f[i], a1 = f[(i + 1) % f.length] + (f[(i + 1) % f.length] < a0 ? 360 : 0), am = (a0 + a1) / 2
    const pfad = (g) => {
      for (let a = a0; a <= a1; a += 0.5) { const [x, y] = punkt(a, 330); a === a0 ? g.moveTo(x, y) : g.lineTo(x, y) }
      for (let a = a1; a >= a0; a -= 0.5) { const [x, y] = punkt(a, rad(m.stein, a)); g.lineTo(x, y) }
    }
    const rm = 265
    teile.stein.push({ ...teil('stein' + i, pfad, [Math.cos(ausWinkel(am)) * rm, Math.sin(ausWinkel(am)) * rm]), winkel: am, breite: a1 - a0 })
  }
  s.teile = teile
  return teile
}

/** Reaktor aus Teilen zeichnen. z = { kern, innen, spulen, stein: [..] } je { dx, dy, dreh (um die Mitte), spin (um den
 *  eigenen Schwerpunkt), skala, an (0..1), glut (0..1 Aufleuchten beim Einrasten) }; fehlende Teile = fertig an Ort */
export function zeichneReaktorTeile(g, s, z, hell = 1) {
  const T = s.teile, e = s.geo.ebenen.reaktor, k = s.geo.reaktor ?? s.geo.ringMitte
  const eins = (teil, st = {}) => {
    const an = (st.an ?? 1) * hell; if (an <= 0.003) return
    g.save(); g.translate(k.x + (st.dx ?? 0), k.y + (st.dy ?? 0)); g.rotate(st.dreh ?? 0)
    const [cx, cy] = teil.mitte; g.translate(cx, cy); g.rotate(st.spin ?? 0); g.scale(st.skala ?? 1, st.skala ?? 1); g.translate(-cx, -cy)
    g.globalAlpha = Math.min(1, an); g.drawImage(teil.c, e.x - k.x, e.y - k.y, e.b, e.h)
    if (st.glut > 0.01) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, st.glut) * 0.8 * hell; g.drawImage(teil.c, e.x - k.x, e.y - k.y, e.b, e.h) }
    g.restore()
  }
  eins(T.kern, z.kern); eins(T.innen, z.innen); eins(T.spulen, z.spulen)
  T.stein.forEach((t, i) => eins(t, z.stein?.[i]))
}

// ---------- Hilfen für die Abläufe ----------
const einrasten = (t, ende, dauer) => { const p = lin(t, ende - dauer, ende); return { p, rest: Math.pow(1 - p, 2.4), glut: t >= ende ? Math.exp(-(t - ende) / 0.25) : 0 } }
/** Ring dreht schnell ein und rastet bei rast ein (letzte Umdrehung bremst) */
const ringEin = (t, von, rast, umdrehungen, richtung = 1) => {
  if (t < von) return { an: 0 }
  const p = lin(t, von, rast)
  return { an: Math.min(1, (t - von) * 5), dreh: richtung * umdrehungen * Math.PI * 2 * Math.pow(1 - p, 2.2), skala: 1 + 0.25 * Math.pow(1 - p, 3), glut: t >= rast ? Math.exp(-(t - rast) / 0.3) : 0.15 }
}
const senke = (t, E, tief = 0.25) => 1 - (1 - tief) * r(t, E.dunkel, E.einschlag - 0.25) * (t >= E.einschlag ? 0 : 1)

// gemeinsamer Rahmen: Blitze (aus 4), Runen von außen (aus 3), Dunkel mit Funken, Einschlag mit doppelter Welle, Holo-Fenster (aus 3)
function grundZustand(t, E) {
  const e = t >= E.einschlag, s = senke(t, E)
  const zucken = (E.blitze ?? []).reduce((m, b) => Math.max(m, blitz(t, b, 0.4)), 0) * (e ? 0 : 1)
  return {
    e, s, zucken,
    an: {
      grund: e ? r(t, E.einschlag, E.einschlag + 0.9) : Math.max(0.07 * r(t, 2.5, 5) * s, 0.85 * zucken),
      aurora: e ? 1 : Math.max(0.45 * r(t, 4, 8) * s, 0.5 * zucken),
      seiten: 1, zuenden: e ? 1 : r(t, E.runen[0], E.runen[1]), vonAussen: true,
      ring: e ? 1 : r(t, E.ring[0], E.ring[0] + 1.6) * s, ringDreh: 7 * Math.pow(1 - lin(t, E.ring[0], E.ring[1]), 2.4),
      kern: 1, reaktor: r(t, E.einschlag, E.einschlag + 0.8), nebel: r(t, E.einschlag, E.einschlag + 1.8),
      rand: e ? 1 : Math.max(0.6 * r(t, E.rand[0], E.rand[1]), zucken * 0.6) * s, randWeg: 760 * Math.pow(1 - r(t, E.rand[0], E.rand[1]), 2),
    },
    blitz: Math.max(blitz(t, E.einschlag, 0.9), 0.22 * zucken), welle: [E.einschlag, E.einschlag + 0.35],
    funken: (E.funken ?? []).some((f) => t >= f && t < f + 0.12) ? 1 : 0,
    tafeln: { art: 'holo', links: lin(t, E.tafeln, E.tafeln + 1.8), rechts: lin(t, E.tafeln + 0.3, E.tafeln + 2.1) },
  }
}
const FELDER = 5
const feldZeiten = (start) => Array.from({ length: FELDER }, (_, i) => start + (1.8 * i) / (FELDER + 2))

// gemeinsame Ereignisse (jede Variante überschreibt, was sie anders macht)
const BASIS = {
  blitze: [1.2, 2.45, 2.58], runen: [1.4, 5.6], runenTicks: Array.from({ length: 11 }, (_, i) => 1.6 + i * 0.36),
  rand: [3.6, 4.5], ring: [4.4, 8.6], dunkel: 9.3, einschlag: 10.5, tafeln: 11.0, gruss: 12.8,
  funken: [9.45, 9.7, 9.9, 10.05, 10.18, 10.28, 10.37, 10.44], herz: [9.5, 9.92, 10.22],
}
const REIHE = [0, 1, 7, 2, 6, 3, 5, 4] // Steinteile: oben zuerst, dann abwechselnd rechts/links, unten zuletzt

// ---------- Die vier Varianten ----------
export const VARIANTEN = {
  1: {
    name: 'Schmiede',
    text: 'Blitze und Runen wie gehabt; die Steinränder fahren mit hereingeblasenen Rauchwänden ein. Die acht Steinteile des Reaktors schießen von weit außen heran und schlagen nacheinander ein – jedes mit Rauchstoß und Hammerschlag. Spulenring und Innenring sinken drehend ein und rasten, dann Funken, Einschlag.',
    E: { ...BASIS, steine: REIHE.map((i, j) => ({ i, t: 5.0 + j * 0.34 })), flug: 0.42, spulen: [7.8, 8.7], innen: [8.25, 9.15], zisch: null },
    reaktor(t, E) {
      const stein = []
      for (const { i, t: tl } of E.steine) {
        const { p, rest, glut } = einrasten(t, tl, E.flug), w = ausWinkel(s_winkel(i)), weg = 1400 * rest
        stein[i] = { an: p > 0 ? 1 : 0, dx: Math.cos(w) * weg, dy: Math.sin(w) * weg, spin: rest * 1.2 * (i % 2 ? 1 : -1), glut }
      }
      return { stein, spulen: ringEin(t, E.spulen[0], E.spulen[1], 2.5, 1), innen: ringEin(t, E.innen[0], E.innen[1], 3.5, -1), kern: { an: t >= E.einschlag ? 1 : 0.15 * r(t, E.innen[1], E.dunkel + 0.5) } }
    },
    rauch(sim, t, dt, E, k) {
      randStrahlen(sim, t, dt, E)
      for (const { i, t: tl } of E.steine) if (t >= tl && t < tl + 0.18) { const w = ausWinkel(s_winkel(i)); sim.stoss(k.x + Math.cos(w) * 300, k.y + Math.sin(w) * 300, Math.cos(w) * 900, Math.sin(w) * 700, 3, 110) }
      einschlagStoss(sim, t, dt, E, k)
    },
  },
  2: {
    name: 'Gewitterschmiede',
    text: 'Jeder Blitz schweißt ein Steinteil an seinen Platz: Das Teil glüht im Blitzlicht auf, Rauch quillt nach oben. Zwischen den Blitzen glimmen die Runen von außen herein, die Steinränder kommen mit Rauchwänden. Danach drehen die Ringe ein, Funken, Einschlag.',
    E: { ...BASIS, blitze: [1.2, 2.2, 3.1, 4.0, 4.9, 5.75, 6.55, 7.3, 7.42], steine: REIHE.map((i, j) => ({ i, t: [1.2, 2.2, 3.1, 4.0, 4.9, 5.75, 6.55, 7.3][j] })), rand: [4.3, 5.1], spulen: [7.9, 8.75], innen: [8.3, 9.2] },
    reaktor(t, E) {
      const stein = []
      for (const { i, t: tl } of E.steine) stein[i] = t < tl ? { an: 0 } : { an: 1, glut: Math.exp(-(t - tl) / 0.5), skala: 1 + 0.06 * Math.exp(-(t - tl) / 0.15) }
      return { stein, spulen: ringEin(t, E.spulen[0], E.spulen[1], 2, -1), innen: ringEin(t, E.innen[0], E.innen[1], 3, 1), kern: { an: t >= E.einschlag ? 1 : 0.15 * r(t, E.innen[1], E.dunkel + 0.5) } }
    },
    rauch(sim, t, dt, E, k) {
      randStrahlen(sim, t, dt, E)
      for (const { i, t: tl } of E.steine) if (t >= tl && t < tl + 0.25) { const w = ausWinkel(s_winkel(i)); sim.stoss(k.x + Math.cos(w) * 280, k.y + Math.sin(w) * 260, Math.cos(w) * 300, -500, 3, 120) }
      einschlagStoss(sim, t, dt, E, k)
    },
  },
  3: {
    name: 'Mahlstrom',
    text: 'Ein Rauchwirbel kreist um die Mitte. Die Steinteile werden im Wirbel spiralförmig hereingezogen und rasten einer nach dem anderen ein, die Ringe drehen schnell gegeneinander und bremsen ab. Vor dem Einschlag saugt der Wirbel alles nach innen – dann bläst der Einschlag den Rauch nach außen.',
    E: { ...BASIS, steine: REIHE.map((i, j) => ({ i, t: 5.2 + j * 0.36 })), flug: 1.6, spulen: [7.9, 8.8], innen: [8.2, 9.2], wirbel: [4.2, 9.6], sog: [9.6, 10.45] },
    reaktor(t, E) {
      const stein = []
      for (const { i, t: tl } of E.steine) {
        const { p, rest, glut } = einrasten(t, tl, E.flug), w0 = ausWinkel(s_winkel(i)), w = w0 - rest * 2.6, rr = 1 + rest * 3.2
        const zx = Math.cos(w0) * 265, zy = Math.sin(w0) * 265, px = Math.cos(w) * 265 * rr, py = Math.sin(w) * 265 * rr * 0.75
        stein[i] = { an: p > 0 ? Math.min(1, p * 3) : 0, dx: px - zx, dy: py - zy, spin: -rest * 2.6, glut }
      }
      return { stein, spulen: ringEin(t, E.spulen[0], E.spulen[1], 4, 1), innen: ringEin(t, E.innen[0], E.innen[1], 5, -1), kern: { an: t >= E.einschlag ? 1 : 0.15 * r(t, E.innen[1], E.dunkel + 0.5) } }
    },
    rauch(sim, t, dt, E, k) {
      randStrahlen(sim, t, dt, E)
      if (t >= E.wirbel[0] && t < E.wirbel[1]) for (let i = 0; i < 6; i++) { // tangentiale Stöße im Kreis = Wirbel
        const w = t * 2.2 + (i / 6) * Math.PI * 2, rr = 420
        sim.stoss(k.x + Math.cos(w) * rr * 1.3, k.y + Math.sin(w) * rr * 0.6, -Math.sin(w) * 900, Math.cos(w) * 450, i % 2 ? 1.2 : 0, 140)
      }
      if (t >= E.sog[0] && t < E.sog[1]) for (let i = 0; i < 8; i++) { const w = (i / 8) * Math.PI * 2; sim.stoss(k.x + Math.cos(w) * 520, k.y + Math.sin(w) * 300, -Math.cos(w) * 1100, -Math.sin(w) * 600, 0, 160) }
      einschlagStoss(sim, t, dt, E, k)
    },
  },
  4: {
    name: 'Aus der Tiefe',
    text: 'Die Steinteile steigen aus dem See auf – unten zuerst, oben zuletzt – und ziehen Nebel mit nach oben, Wasser schäumt. Die Steinränder fahren mit Rauchwänden ein, Blitze und Runen wie gehabt; die Ringe senken sich von oben drehend ein und rasten, Funken, Einschlag.',
    E: { ...BASIS, steine: [4, 3, 5, 2, 6, 1, 7, 0].map((i, j) => ({ i, t: 5.1 + j * 0.36 })), flug: 0.75, spulen: [7.9, 8.8], innen: [8.3, 9.2] },
    reaktor(t, E) {
      const stein = []
      for (const { i, t: tl } of E.steine) { const { p, rest, glut } = einrasten(t, tl, E.flug); stein[i] = { an: p > 0 ? Math.min(1, p * 2) : 0, dy: 760 * rest, spin: rest * 0.3 * (i % 2 ? 1 : -1), glut } }
      const sinkt = (st, von, rast) => (st.an ? { ...st, dy: -460 * Math.pow(1 - lin(t, von, rast), 2) } : st) // Ringe senken sich von oben
      return { stein, spulen: sinkt(ringEin(t, E.spulen[0], E.spulen[1], 2.5, 1), E.spulen[0], E.spulen[1]), innen: sinkt(ringEin(t, E.innen[0], E.innen[1], 3.5, -1), E.innen[0], E.innen[1]), kern: { an: t >= E.einschlag ? 1 : 0.15 * r(t, E.innen[1], E.dunkel + 0.5) } }
    },
    rauch(sim, t, dt, E, k) {
      randStrahlen(sim, t, dt, E)
      for (const { i, t: tl } of E.steine) if (t >= tl - E.flug && t < tl) { const w = ausWinkel(s_winkel(i)), p = lin(t, tl - E.flug, tl); sim.stoss(k.x + Math.cos(w) * 265, k.y + Math.sin(w) * 265 + 760 * Math.pow(1 - p, 2.4) + 60, (zz(i) - 0.5) * 200, -700, 2, 120) }
      einschlagStoss(sim, t, dt, E, k)
    },
  },
}
let s_teile = null
const s_winkel = (i) => s_teile?.stein[i]?.winkel ?? i * 45

// Rauchwände: Düsen am Außenrand blasen waagerecht nach innen, solange die Steinränder hereinfahren
function randStrahlen(sim, t, dt, E) {
  const [a, b] = E.rand; if (t < a - 0.15 || t > b + 0.2) return
  const kraft = 1 - lin(t, b - 0.2, b + 0.2), puls = 0.6 + 0.4 * Math.sin(t * 23)
  for (let i = 0; i < 5; i++) { // fünf Düsen je Seite, unregelmäßig verteilt, flackernder Druck, leicht schräg
    const y = 160 + i * 190 + (zz(i) - 0.5) * 120 + Math.sin(t * 5 + i * 2) * 50, st = kraft * puls * (0.7 + 0.6 * zz(i + 4))
    sim.stoss(30, y, 2400 * st, (zz(i + 2) - 0.5) * 900, 2.4 * st, 90)
    sim.stoss(B - 30, y + 60, -2400 * st, (zz(i + 11) - 0.5) * 900, 2.4 * st, 90)
  }
}
// Einschlag: Ring aus Druck bläst nach außen, mit frischem Rauch
function einschlagStoss(sim, t, dt, E, k) {
  if (t < E.einschlag || t > E.einschlag + 0.12) return
  for (let i = 0; i < 16; i++) { const w = (i / 16) * Math.PI * 2; sim.stoss(k.x + Math.cos(w) * 330, k.y + Math.sin(w) * 220, Math.cos(w) * 2600, Math.sin(w) * 1100, 3, 150) }
}

/** Zustand einer Variante zur Zeit t */
export function introZustand(nr, t, s) {
  s_teile = s?.teile ?? s_teile
  const V = VARIANTEN[nr], E = V.E, z = grundZustand(t, E)
  z.reaktorTeile = t >= E.einschlag + 0.3 ? null : V.reaktor(t, E)
  z.ende = E.tafeln + 2.6
  z.rauchHell = 1 - lin(t, E.einschlag + 1.4, E.einschlag + 3.4) // Rauch verzieht sich – Ende bildgleich mit dem Wallpaper
  return z
}

/** Rauch-Simulation bis zur Zeit t führen (feste Schritte; springt die Zeit zurück, beginnt sie neu) */
export function rauchFuehren(sim, nr, t, s) {
  if (!sim) return
  const V = VARIANTEN[nr], k = s.geo.reaktor ?? s.geo.ringMitte, SCHRITT = 1 / 60
  if (sim._nr !== nr || t < (sim._t ?? 0) - 0.05) { sim.leeren(); sim._t = 0; sim._nr = nr }
  let n = 0
  // Stärken in den Abläufen sind je Sekunde gedacht: Geschwindigkeit (px/s, wirkt als Schub) und Rauchmenge je Sekunde
  const je = { stoss: (x, y, vx, vy, m, rad) => sim.stoss(x, y, vx * SCHRITT * 5, vy * SCHRITT * 5, m * SCHRITT * 4, rad) }
  while (sim._t + SCHRITT <= t && n < 2000) { V.rauch(je, sim._t, SCHRITT, V.E, k); sim.schritt(SCHRITT); sim._t += SCHRITT; n++ }
}

// ---------- Ton: aus derselben Ereignisliste ----------
const D2 = 73.42, A2 = 110, F3 = 174.61, D3 = 146.83
export function tonFuer(nr) {
  const V = VARIANTEN[nr], E = V.E
  return {
    name: V.name,
    spielen({ spiel, T, S }) {
      spiel('rumpeln', T(0.1), { laut: 0.5, ein: 1.2, bis: T(E.dunkel + 0.4), hallAnteil: 0 })
      S.pad(T(1.2), T(E.dunkel), [D2, A2, F3], { laut: 0.065, lp: 260, lpBis: 1300, an: 3 })
      // Blitze: Donnerschlag + tiefer Abfall; in Variante 2 schweißt jeder Blitz ein Teil (zusätzlich Metall)
      E.blitze.forEach((b, i) => { spiel('blitzschlag', T(b), { laut: i > 0 && b - E.blitze[i - 1] < 0.2 ? 0.3 : 0.6, seite: (zz(i) - 0.5) * 1.2 }); S.sub(T(b + 0.04), { von: 70, bis: 30, dauer: 1.4, laut: 0.4 }) })
      // Runen glimmen von außen zur Mitte: helle, leise Töne, wandern von außen nach innen
      E.runenTicks.forEach((tt, i) => spiel(i % 3 === 2 ? 'hud_piep' : 'ping', T(tt), { laut: 0.14, tempo: 0.9 + i * 0.03, seite: (i % 2 ? 1 : -1) * (0.9 - i * 0.07), hallAnteil: 0.5 }))
      // Steinränder: Metall schiebt links/rechts, Rauch-Druck als gefiltertes Rauschen, Anschlag
      spiel('metall_schieben', T(E.rand[0]), { laut: 0.55, seite: -0.9 }); spiel('metall_schieben', T(E.rand[0] + 0.05), { laut: 0.55, seite: 0.9 })
      S.riser(T(E.rand[0] - 0.1), T(E.rand[1]), { von: 160, bis: 1800, laut: 0.18, seite: -0.6 }); S.riser(T(E.rand[0] - 0.1), T(E.rand[1]), { von: 170, bis: 1900, laut: 0.18, seite: 0.6 })
      spiel('tor_metall', T(E.rand[1]), { laut: 0.6 }); S.sub(T(E.rand[1]), { laut: 0.5 })
      // Ring um den Reaktor dreht ein
      spiel('braam', T(E.ring[0]), { laut: 0.5 }); spiel('plasma_vorbei', T(E.ring[0]), { laut: 0.3 })
      // Steinteile: Anflug + Einschlag je Teil, Seite nach Lage im Kreis
      E.steine.forEach(({ i, t: tl }, j) => {
        const seite = Math.cos(ausWinkel(s_winkel(i))) * 0.75
        if (nr === 1) spiel('warp', T(tl - E.flug), { laut: 0.12, tempo: 2.2, seite })
        if (nr === 3) spiel('metall_rueckwaerts', T(tl - 0.5), { laut: 0.16, tempo: 1.4, seite })
        if (nr === 4) spiel('hydraulik', T(tl - E.flug), { laut: 0.15, tempo: 1.6, seite })
        spiel(j % 2 ? 'einrasten_2' : 'einrasten_1', T(tl), { laut: 0.6, seite })
        spiel(nr === 1 ? 'eisen_hammer' : 'zahnrad_hammer', T(tl + 0.01), { laut: nr === 1 ? 0.35 : 0.25, seite })
        if (nr === 1) S.sub(T(tl), { von: 60, bis: 35, dauer: 0.6, laut: 0.3 })
      })
      const letzter = Math.max(...E.steine.map((x) => x.t))
      spiel('braam_dystopie', T(letzter + 0.05), { laut: 0.45 }); S.sub(T(letzter + 0.05), { laut: 0.45 })
      if (nr === 3) { S.riser(T(E.wirbel[0]), T(E.wirbel[1]), { von: 120, bis: 900, laut: 0.14 }); spiel('einsaugen', T(E.sog[0]), { laut: 0.7, hallAnteil: 0, schlussBei: T(E.einschlag) }) }
      // Ringe: anlaufen, einrasten
      spiel('servo_3', T(E.spulen[0]), { laut: 0.45 }); spiel('zahnraeder', T(E.spulen[0] + 0.2), { laut: 0.3 })
      spiel('einrasten_2', T(E.spulen[1]), { laut: 0.75 }); spiel('metall_ton', T(E.spulen[1]), { laut: 0.4 })
      spiel('servo_1', T(E.innen[0]), { laut: 0.42, tempo: 1.15 })
      spiel('einrasten_1', T(E.innen[1]), { laut: 0.8 }); spiel('hud_akzent', T(E.innen[1]), { laut: 0.35 })
      // Dunkel: Funken (je sichtbarem Funken ein Knistern), Herzschlag, Sog
      E.funken.forEach((f, i) => S.entladung(T(f), { laut: 0.16 + i * 0.03, seite: (zz(i + 3) - 0.5) * 0.6, dauer: 0.22 }))
      E.herz.forEach((h) => S.herz(T(h), { laut: 0.7 }))
      S.riser(T(E.dunkel), T(E.einschlag), { laut: 0.26 })
      if (nr !== 3) spiel('einsaugen', T(E.einschlag - 1.0), { laut: 0.75, hallAnteil: 0, schlussBei: T(E.einschlag) })
      // Einschlag + zweite Welle
      spiel('einschlag_episch', T(E.einschlag), { laut: 1 }); spiel('amboss', T(E.einschlag), { laut: 0.55 }); spiel('braam_metall', T(E.einschlag), { laut: 0.5 })
      S.sub(T(E.einschlag), { von: 95, bis: 28, dauer: 2.6, laut: 0.9 }); spiel('modern_boom', T(E.einschlag + 0.35), { laut: 0.55 })
      S.pad(T(E.einschlag), T(22), [D2, A2, D3], { laut: 0.055, lp: 700, an: 1.5, aus: 3 })
      // Fenster flackern an – je Fenster ein kurzer Holo-Klang
      feldZeiten(E.tafeln).forEach((ft, i) => spiel(i % 2 ? 'hud_glitch' : 'hud_an', T(ft), { laut: 0.2, seite: -0.7 }))
      feldZeiten(E.tafeln + 0.3).forEach((ft, i) => spiel(i % 2 ? 'hud_glitch' : 'hud_an', T(ft), { laut: 0.2, seite: 0.7 }))
    },
  }
}
void H
