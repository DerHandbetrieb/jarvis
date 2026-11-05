// Intro-Variante 5 „Runensturm“ (Wunsch Auftraggeber 05.11.2026): Kombination aus 3 (Runenkette, Holo-Fenster) und
// 4 (Gewitter, doppelte Druckwelle); dazu baut sich der Reaktor blockweise auf, die Ringe drehen einzeln ein, Rauch
// zischt hinter dem Reaktor heraus, die Steinränder fahren von außen herein und schieben Nebelwände vor sich her.
// Bild und Ton lesen DIESELBE Ereignisliste (E) – so sitzt jeder Ton genau auf seinem Bild-Ereignis.
import { B, H, REAKTOR_TEILE } from './szene.js'

const glatt = (x) => { const v = Math.max(0, Math.min(1, x)); return v * v * (3 - 2 * v) }
const r = (t, a, b) => glatt((t - a) / (b - a))
const lin = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)))
const blitz = (t, bei, dauer = 0.6) => (t < bei ? 0 : Math.exp(-(t - bei) / (dauer / 3)))

// ---------- Ereignisse (Sekunden) ----------
const N = REAKTOR_TEILE.bloecke
export const E = {
  blitze: [1.2, 2.5, 2.62, 3.8],                         // Gewitter enthüllt die Landschaft
  runen: { von: 1.4, bis: 6.0 },                        // Runen glimmen von außen zur Mitte auf
  runenTicks: Array.from({ length: 12 }, (_, i) => 1.6 + i * 0.37),
  rand: { von: 4.2, bis: 5.2 },                         // Steinränder fahren herein, Nebelwände davor
  ring: { von: 4.6, bis: 9.0 },                         // Info-Ring dreht schnell ein und wird langsamer
  zisch: 5.35,                                          // Rauchwolke zischt hinter dem Reaktor heraus
  bloecke: Array.from({ length: N }, (_, j) => 5.7 + j * 0.27), // Landezeit je Steinblock
  flug: 0.55,                                           // so lange fliegt ein Block heran
  spulen: { von: 8.15, rast: 8.85 },                    // Spulenring dreht ein und rastet
  innen: { von: 8.45, rast: 9.2 },                      // innerer Ring dreht gegenläufig, rastet
  dunkel: { von: 9.2, bis: 10.5 },
  funken: [9.35, 9.62, 9.84, 10.0, 10.13, 10.24, 10.33, 10.41],
  herz: [9.4, 9.85, 10.18],
  einschlag: 10.5, welle2: 10.85,
  tafeln: { links: 11.0, rechts: 11.3, dauer: 1.8 },
  gruss: 12.8,
}
const FELDER = 5 // Fenster je Seite (tafeln.js)
export const feldZeiten = (seite) => Array.from({ length: FELDER }, (_, i) => E.tafeln[seite] + (E.tafeln.dauer * i) / (FELDER + 2))

// ---------- Bild ----------
export const VARIANTE5 = {
  name: 'Runensturm',
  text: 'Kombination aus 3 und 4: Blitze reißen die Landschaft aus dem Dunkel, Runen glimmen von außen zur Mitte, Steinränder fahren mit Nebelwänden herein, der Reaktor setzt sich Block für Block zusammen, Rauch zischt heraus, Ringe drehen einzeln ein und rasten – Einschlag mit doppelter Druckwelle, Fenster flackern wie Hologramme an.',
  zustand(t) {
    const e = t >= E.einschlag, senke = 1 - 0.75 * r(t, E.dunkel.von, E.einschlag - 0.25) * (e ? 0 : 1)
    const zucken = E.blitze.reduce((m, b) => Math.max(m, blitz(t, b, 0.4)), 0) * (e ? 0 : 1)
    const drehEin = (a) => (t < a.von ? 0 : t >= a.rast ? 0 : Math.pow(1 - lin(t, a.von, a.rast), 2.2))
    return {
      an: {
        grund: e ? r(t, E.einschlag, 11.4) : Math.max(0.07 * r(t, 3, 5) * senke, 0.85 * zucken),
        aurora: e ? 1 : Math.max(0.45 * r(t, 4, 8) * senke, 0.5 * zucken),
        seiten: 1, zuenden: e ? 1 : r(t, E.runen.von, E.runen.bis), vonAussen: true,
        ring: e ? 1 : r(t, E.ring.von, 6.2) * senke, ringDreh: 9 * Math.pow(1 - lin(t, E.ring.von, E.ring.bis), 2.4),
        kern: e ? 1 : 0.9 * senke, reaktor: r(t, E.einschlag, 11.3), nebel: r(t, E.einschlag, 12.4),
        rand: e ? 1 : Math.max(0.55 * r(t, E.rand.von, E.rand.bis), zucken * 0.6) * senke, randWeg: 700 * Math.pow(1 - r(t, E.rand.von, E.rand.bis), 2),
      },
      aufbau: t >= E.einschlag + 0.2 ? null : {
        bloecke: E.bloecke.map((tl) => lin(t, tl - E.flug, tl)),
        spulen: { an: lin(t, E.spulen.von, E.spulen.von + 0.25), dreh: 7 * drehEin({ von: E.spulen.von, rast: E.spulen.rast }) },
        innen: { an: lin(t, E.innen.von, E.innen.von + 0.25), dreh: -9 * drehEin({ von: E.innen.von, rast: E.innen.rast }) },
        kern: e ? 1 : 0.25 * r(t, E.innen.rast, E.dunkel.bis),
      },
      blitz: Math.max(blitz(t, E.einschlag, 0.9), 0.22 * zucken), welle: [E.einschlag, E.welle2],
      tafeln: { art: 'holo', links: lin(t, E.tafeln.links, E.tafeln.links + E.tafeln.dauer), rechts: lin(t, E.tafeln.rechts, E.tafeln.rechts + E.tafeln.dauer) },
      v5: true,
    }
  },
}

// ---------- Rauch und Nebel ----------
let puff = null
function puffBild() { // weicher Rauchbausch aus mehreren Kugeln (einmal vorgezeichnet)
  if (puff) return puff
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')
  const z = (n) => { const x = Math.sin(n * 91.7) * 4375.5; return x - Math.floor(x) }
  for (let i = 0; i < 14; i++) {
    const x = 128 + (z(i) - 0.5) * 120, y = 128 + (z(i + 30) - 0.5) * 90, rr = 40 + z(i + 60) * 50
    const v = g.createRadialGradient(x, y - rr * 0.3, rr * 0.05, x, y, rr)
    v.addColorStop(0, 'rgba(150,190,202,0.26)'); v.addColorStop(0.5, 'rgba(85,125,140,0.17)'); v.addColorStop(1, 'rgba(50,80,95,0)') /* dunkel, durchscheinend (sonst Watte) */
    g.fillStyle = v; g.fillRect(0, 0, 256, 256)
  }
  return (puff = c)
}
const zz = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x) }

/** Rauch HINTER dem Reaktor: Zischwolke, Bausch je eingerastetem Block, Ausstoß beim Einschlag */
export function rauchHinten(g, s, t) {
  const k = s.geo.reaktor ?? s.geo.ringMitte, p = puffBild()
  const bausch = (x, y, gr, a) => { if (a <= 0.003) return; g.globalAlpha = Math.min(1, a); g.drawImage(p, x - gr / 2, y - gr / 2, gr, gr) }
  g.save(); g.globalCompositeOperation = 'screen'
  // Zischwolke: quillt schnell aus dem Reaktor nach allen Seiten, steht dann und verzieht sich langsam
  const a = t - E.zisch
  if (a > 0 && a < 6) for (let i = 0; i < 26; i++) {
    const w = zz(i) * Math.PI * 2, schub = 1 - Math.exp(-a * 3.2), weit = (180 + zz(i + 9) * 520) * schub + a * 18
    bausch(k.x + Math.cos(w) * weit * 1.6, k.y + Math.sin(w) * weit * 0.55 + a * 6, 260 + 420 * schub + zz(i + 4) * 200, 0.6 * Math.min(1, a * 6) * Math.exp(-a / 2.6))
  }
  // je Block ein kurzer Stoß an der Stelle, wo er einrastet
  const n = REAKTOR_TEILE.bloecke, br = (Math.PI * 2) / n
  E.bloecke.forEach((tl, j) => {
    const b = t - tl; if (b < 0 || b > 2.5) return
    const w = REAKTOR_TEILE.versatz + (j + 0.5) * br
    for (let i = 0; i < 4; i++) { const ww = w + (zz(j * 7 + i) - 0.5) * 0.7, rr = 300 + b * (120 + zz(i + j) * 160); bausch(k.x + Math.cos(ww) * rr, k.y + Math.sin(ww) * rr * 0.8, 200 + b * 220, 0.5 * Math.exp(-b / 0.8)) }
  })
  // Einschlag: Ring aus Rauch wird nach außen geblasen
  const c = t - E.einschlag
  if (c > 0 && c < 4) for (let i = 0; i < 30; i++) {
    const w = (i / 30) * Math.PI * 2 + zz(i) * 0.2, weit = 260 + 1400 * (1 - Math.exp(-c * 2.2))
    bausch(k.x + Math.cos(w) * weit, k.y + Math.sin(w) * weit * 0.42, 380 + c * 260, 0.5 * Math.exp(-c / 1.1))
  }
  g.restore()
}

/** Nebelwände vor den hereinfahrenden Steinrändern (vorn, über der Landschaft) */
export function nebelWaende(g, s, t) {
  const a = t - E.rand.von; if (a < 0 || a > 4.5) return
  const p = puffBild(), breite = s.rand?.breite ?? 700, fahrt = r(t, E.rand.von, E.rand.bis)
  const front = breite * 0.85 + 900 * (1 - Math.pow(1 - Math.min(1, a / 1.6), 2)) // wird über den Rand hinaus nach innen gedrückt
  const deck = Math.min(1, a * 3) * (a < 1.4 ? 1 : Math.exp(-(a - 1.4) / 1.2))
  g.save(); g.globalCompositeOperation = 'screen'
  for (const seite of [-1, 1]) {
    for (let i = 0; i < 16; i++) {
      const y = (i / 15) * H, wob = Math.sin(t * 2.3 + i * 1.7) * 40, gr = 420 + zz(i + (seite > 0 ? 50 : 0)) * 300
      const x0 = front - 160 + wob - zz(i * 3 + (seite > 0 ? 7 : 0)) * 560 // unregelmäßige Front
      for (const tief of [0, 1]) {
        const x = seite < 0 ? x0 - tief * 380 : B - x0 + tief * 380
        g.globalAlpha = deck * (0.5 - tief * 0.18) * (0.6 + 0.4 * Math.sin(Math.PI * (0.15 + 0.7 * i / 15))); g.drawImage(p, x - gr / 2, y - gr / 2, gr, gr)
      }
    }
  }
  void fahrt
  g.restore()
}

// ---------- Ton (eigenes Gerüst, Ereignis für Ereignis) ----------
// Charakter wie Gerüst 9 (Trailer-Wucht, tiefe Braams, Metall), aber jeder Klang sitzt auf einem Bild-Ereignis;
// Pneumatik nur EINMAL (die Zischwolke) – Rückmeldung Auftraggeber 05.11.2026: „das Pneumatische … zu viel“.
const D2 = 73.42, A2 = 110, F3 = 174.61, D3 = 146.83
export const TON5 = {
  name: 'Runensturm',
  spielen({ spiel, T, S }) {
    spiel('rumpeln', T(0.1), { laut: 0.55, ein: 1.2, bis: T(E.dunkel.von + 0.4), hallAnteil: 0 })
    S.pad(T(1.2), T(E.dunkel.von), [D2, A2, F3], { laut: 0.07, lp: 260, lpBis: 1400, an: 3 })
    // Gewitter
    E.blitze.forEach((b, i) => { spiel('blitzschlag', T(b), { laut: i === 2 ? 0.35 : 0.7, seite: [-0.6, 0.5, 0.3, -0.2][i] }); S.sub(T(b + 0.05), { von: 70, bis: 30, dauer: 1.6, laut: 0.45 }) })
    // Runen glimmen auf: leise, helle Klicks abwechselnd links/rechts, wandern zur Mitte
    E.runenTicks.forEach((tt, i) => spiel(i % 3 === 2 ? 'hud_piep' : 'ping', T(tt), { laut: 0.16, tempo: 0.9 + i * 0.03, seite: (i % 2 ? 1 : -1) * (0.9 - i * 0.06), hallAnteil: 0.5 }))
    // Steinränder fahren herein: Metall schiebt (links/rechts), Nebel rauscht, Anschlag
    spiel('metall_schieben', T(E.rand.von), { laut: 0.6, seite: -0.85 }); spiel('metall_schieben', T(E.rand.von + 0.06), { laut: 0.6, seite: 0.85 })
    S.riser(T(E.rand.von), T(E.rand.bis), { von: 200, bis: 2500, laut: 0.22 })
    spiel('tor_metall', T(E.rand.bis), { laut: 0.65 }); S.sub(T(E.rand.bis), { laut: 0.55 })
    // Ring dreht ein
    spiel('braam', T(E.ring.von), { laut: 0.55 }); spiel('plasma_vorbei', T(E.ring.von), { laut: 0.35 })
    // Zischwolke – das einzige Druckluft-Geräusch
    spiel('pneumatik', T(E.zisch), { laut: 0.7, hallAnteil: 0.35 })
    // Blöcke rasten ein – Seite nach Lage des Blocks im Kreis
    const br = (Math.PI * 2) / REAKTOR_TEILE.bloecke
    E.bloecke.forEach((tl, j) => {
      const seite = Math.cos(REAKTOR_TEILE.versatz + (j + 0.5) * br) * 0.7
      spiel('metall_rueckwaerts', T(tl - E.flug), { laut: 0.14, seite, tempo: 1.6 })
      spiel(j % 2 ? 'einrasten_2' : 'einrasten_1', T(tl), { laut: 0.62, seite })
      if (j % 3 === 0) spiel('zahnrad_hammer', T(tl + 0.02), { laut: 0.3, seite })
    })
    spiel('braam_dystopie', T(E.bloecke.at(-1) + 0.05), { laut: 0.5 }); S.sub(T(E.bloecke.at(-1) + 0.05), { laut: 0.5 })
    // Ringe drehen ein und rasten
    spiel('servo_3', T(E.spulen.von), { laut: 0.5 }); spiel('zahnraeder', T(E.spulen.von + 0.2), { laut: 0.35 })
    spiel('einrasten_2', T(E.spulen.rast), { laut: 0.75 }); spiel('metall_ton', T(E.spulen.rast), { laut: 0.45 })
    spiel('servo_1', T(E.innen.von), { laut: 0.45, tempo: 1.15 })
    spiel('einrasten_1', T(E.innen.rast), { laut: 0.8 }); spiel('hud_akzent', T(E.innen.rast), { laut: 0.4 })
    // Dunkel: Funken, Herzschlag, Sog in den Einschlag
    E.funken.forEach((f, i) => S.entladung(T(f), { laut: 0.18 + i * 0.03, seite: (zz(i) - 0.5) * 0.6, dauer: 0.25 }))
    E.herz.forEach((h) => S.herz(T(h), { laut: 0.75 }))
    S.riser(T(E.dunkel.von), T(E.einschlag), { laut: 0.3 })
    spiel('einsaugen', T(E.einschlag - 1.0), { laut: 0.85, hallAnteil: 0, schlussBei: T(E.einschlag) })
    // Einschlag + zweite Welle
    spiel('einschlag_episch', T(E.einschlag), { laut: 1 }); spiel('amboss', T(E.einschlag), { laut: 0.6 }); spiel('braam_metall', T(E.einschlag), { laut: 0.55 })
    S.sub(T(E.einschlag), { von: 95, bis: 28, dauer: 2.6, laut: 0.9 })
    spiel('modern_boom', T(E.welle2), { laut: 0.6 })
    S.pad(T(E.einschlag), T(22), [D2, A2, D3], { laut: 0.06, lp: 700, an: 1.5, aus: 3 })
    // Fenster flackern an – je Fenster ein kurzer Holo-Klang
    for (const seite of ['links', 'rechts']) feldZeiten(seite).forEach((ft, i) => spiel(i % 2 ? 'hud_glitch' : 'hud_an', T(ft), { laut: 0.22, seite: seite === 'links' ? -0.7 : 0.7 }))
    spiel('hologramm', T(E.tafeln.links), { laut: 0.25 })
  },
}
void D3
