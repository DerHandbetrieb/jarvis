// Intro beim Rechnerstart auf der Szene „Mystic Aurora“ (Entwürfe 05.11.2026, Wahl Auftraggeber: vier Varianten).
// Alle vier enden exakt im Bild des Dauer-HUDs (alle Anteile 1, Tafeln in der Schräge) – danach übernimmt das Wallpaper.
// Zeitmarken passen zum Ton (Gerüst 9: Visier 1,4 · Verwandlung 4,6 · Dunkel 9,2 · Einschlag 10,5 · Gruß 12,8).
import { B, H } from './szene.js'
import { VARIANTE5, E as E5, nebelWaende } from './intro5.js'

export const ZEIT = { VISIER: 1.4, VERWANDLUNG: 4.6, DUNKEL: 9.2, EINSCHLAG: 10.5, GRUSS: 12.8, FERTIG: 13.5 }
const Z = ZEIT
const glatt = (x) => { const v = Math.max(0, Math.min(1, x)); return v * v * (3 - 2 * v) }
const r = (t, a, b) => glatt((t - a) / (b - a)) // 0 vor a, 1 nach b
const nach = (t, a) => (t >= a ? 1 : 0)
/** Dunkel-Teil: alles sackt ab, kurz vor dem Einschlag fast schwarz */
const senke = (t, tief = 0.25) => 1 - (1 - tief) * r(t, Z.DUNKEL, Z.EINSCHLAG - 0.25) * (1 - nach(t, Z.EINSCHLAG))
/** Lichtblitz: schneller Anstieg, Abklingen über dauer Sekunden */
const blitz = (t, bei, dauer = 0.6) => (t < bei ? 0 : Math.exp(-(t - bei) / (dauer / 3)))

export const VARIANTEN = {
  1: {
    name: 'Erwachen',
    text: 'Aurora dämmert auf, Runen entzünden sich von der Mitte nach außen, der Reaktor lädt, alles sackt ab – Einschlag mit Druckwelle, dann klappen die Fenster aus der Kante auf.',
    zustand(t) {
      const s = senke(t), e = nach(t, Z.EINSCHLAG)
      return {
        an: {
          grund: e ? r(t, Z.EINSCHLAG, Z.EINSCHLAG + 0.9) : 0.28 * r(t, Z.VISIER, Z.VERWANDLUNG) * s,
          aurora: e ? 1 : r(t, Z.VISIER, 4.2) * s, seiten: e ? 1 : 0.9 * s, zuenden: e ? 1 : r(t, Z.VERWANDLUNG, 8.8),
          ring: e ? 1 : r(t, 5.5, 8.5) * s, ringDreh: 4 * Math.pow(1 - r(t, Z.VERWANDLUNG, Z.EINSCHLAG + 2.5), 2),
          kern: e ? 1 : 0.18 * r(t, Z.VERWANDLUNG, Z.DUNKEL) * s, reaktor: r(t, Z.EINSCHLAG, Z.EINSCHLAG + 1),
          nebel: r(t, Z.EINSCHLAG, 12.2), rand: r(t, 10.8, 12.6),
        },
        blitz: blitz(t, Z.EINSCHLAG, 0.7), welle: [Z.EINSCHLAG], laden: r(t, 7.5, Z.DUNKEL) * (1 - e),
        tafeln: { art: 'klappen', links: r(t, 11.2, 12.7), rechts: r(t, 11.5, 13.0) },
      }
    },
  },
  2: {
    name: 'Horizont',
    text: 'Eine Lichtlinie zieht sich über alle drei Bildschirme, öffnet sich wie ein Lid und gibt See und Himmel frei; Runen laufen von außen zur Mitte, Einschlag als Lichtblitz entlang des Horizonts, Fenster gleiten von außen herein.',
    zustand(t) {
      const s = senke(t, 0.35), e = nach(t, Z.EINSCHLAG)
      return {
        an: {
          grund: e ? 1 : 0.75 * s, aurora: e ? 1 : r(t, 5.2, 8.5) * s, seiten: e ? 1 : s, zuenden: e ? 1 : r(t, 6.0, Z.DUNKEL), vonAussen: true,
          ring: e ? 1 : r(t, 7.0, Z.DUNKEL) * s, kern: e ? 1 : 0.3 * r(t, 6, Z.DUNKEL) * s, reaktor: r(t, Z.EINSCHLAG, 11.4),
          nebel: r(t, Z.EINSCHLAG, 12), rand: r(t, 10.6, 12.4), ringDreh: 0,
        },
        linie: e ? 1 - r(t, Z.EINSCHLAG, 11.6) : r(t, Z.VISIER, Z.VERWANDLUNG), // Breite der Lichtlinie (0..1 der Fläche)
        lid: e ? 1 : r(t, Z.VERWANDLUNG, 8.6), // Öffnung über und unter dem Horizont
        linienBlitz: blitz(t, Z.EINSCHLAG, 1.0), blitz: 0.55 * blitz(t, Z.EINSCHLAG, 0.4),
        tafeln: { art: 'gleiten', links: r(t, 11.0, 12.6), rechts: r(t, 11.0, 12.6) },
      }
    },
  },
  3: {
    name: 'Runenkette',
    text: 'Im Dunkeln glimmen die Runen nacheinander von den Außenrändern zur Mitte auf, der Ring dreht sich schnell ein und wird langsamer, Funken zucken im Reaktor – Einschlag, die Fenster flackern wie Hologramme an.',
    zustand(t) {
      const s = senke(t, 0.3), e = nach(t, Z.EINSCHLAG)
      return {
        an: {
          grund: e ? r(t, Z.EINSCHLAG, 11.6) : 0.22 * r(t, Z.VERWANDLUNG, Z.DUNKEL) * s, aurora: e ? 1 : 0.5 * r(t, 6, Z.DUNKEL) * s,
          seiten: 1, zuenden: e ? 1 : r(t, Z.VISIER, 8.6), vonAussen: true,
          ring: e ? 1 : r(t, 3.5, 6.5), ringDreh: 9 * Math.pow(1 - r(t, 3.5, Z.EINSCHLAG + 1.5), 2),
          kern: e ? 1 : 0.12 * s, reaktor: r(t, Z.EINSCHLAG, 11.2), nebel: r(t, Z.EINSCHLAG, 12.4), rand: r(t, 11, 12.8),
        },
        funken: t > 7.6 && t < Z.EINSCHLAG ? r(t, 7.6, Z.EINSCHLAG) : 0, blitz: blitz(t, Z.EINSCHLAG, 0.6), welle: [Z.EINSCHLAG],
        tafeln: { art: 'holo', links: r(t, 11.0, 13.0), rechts: r(t, 11.3, 13.3) },
      }
    },
  },
  4: {
    name: 'Gewitter',
    text: 'Schwarz – Blitze reißen die Landschaft für Sekundenbruchteile aus der Dunkelheit, die Aurora schwillt an, Runen zünden, dann der große Einschlag mit doppelter Druckwelle; die Fenster richten sich aus der Fläche in die Schräge auf.',
    zustand(t) {
      const s = senke(t, 0.2), e = nach(t, Z.EINSCHLAG)
      const zucken = [1.5, 3.0, 3.15, 4.6, 6.1, 7.3, 7.42, 8.5].reduce((m, b) => Math.max(m, blitz(t, b, 0.35)), 0) * (1 - e)
      return {
        an: {
          grund: e ? 1 : Math.max(0.05 * r(t, Z.VERWANDLUNG, Z.DUNKEL) * s, 0.85 * zucken), aurora: e ? 1 : Math.max(r(t, Z.VERWANDLUNG, 8.5) * 0.7 * s, zucken * 0.5),
          seiten: e ? 1 : s, zuenden: e ? 1 : r(t, 6.0, Z.DUNKEL), ring: e ? 1 : Math.max(r(t, 6.5, Z.DUNKEL) * s, zucken),
          kern: e ? 1 : Math.max(0.15 * s * r(t, 6, Z.DUNKEL), zucken * 0.8), reaktor: r(t, Z.EINSCHLAG, 11), nebel: r(t, Z.EINSCHLAG, 12),
          rand: e ? r(t, Z.EINSCHLAG, 11.8) : zucken * 0.7, ringDreh: 0,
        },
        blitz: Math.max(blitz(t, Z.EINSCHLAG, 0.9), 0.25 * zucken), welle: [Z.EINSCHLAG, Z.EINSCHLAG + 0.35],
        tafeln: { art: 'flach', links: r(t, 11.0, 12.8), rechts: r(t, 11.0, 12.8) },
      }
    },
  },
}

VARIANTEN[5] = VARIANTE5

/** Zustand einer Variante zur Zeit t; nach dem Ende (FERTIG) überall 1 */
export function introZustand(nr, t) {
  if (t >= Z.FERTIG + 0.5) return { an: {}, tafeln: { art: 'klappen', links: 1, rechts: 1 }, fertig: true }
  return VARIANTEN[nr].zustand(t)
}

/** Lichteffekte über der Szene (gleiche Koordinaten wie die Szene: 5760×1080, versatz für Einzelbildschirm) */
export function zeichneIntroLicht(g, s, t, z, versatz = 0) {
  const k = s.geo.ringMitte, hor = s.geo.ebenen.wasser?.y ?? 843 /* obere Wasserkante = Horizont */
  g.save(); g.setTransform(1, 0, 0, 1, -versatz, 0)
  // Lid (Variante 2): alles außer einem Band um den Horizont schwarz, Ränder weich
  if (z.lid != null && z.lid < 1) {
    const auf = z.lid * (H * 0.85), weich = 180, o = hor - auf, u = hor + auf * 0.4
    g.fillStyle = '#000'; g.fillRect(0, 0, B, Math.max(0, o - weich)); g.fillRect(0, u + weich, B, H)
    const vo = g.createLinearGradient(0, o - weich, 0, o); vo.addColorStop(0, '#000'); vo.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = vo; g.fillRect(0, o - weich, B, weich)
    const vu = g.createLinearGradient(0, u, 0, u + weich); vu.addColorStop(0, 'rgba(0,0,0,0)'); vu.addColorStop(1, '#000'); g.fillStyle = vu; g.fillRect(0, u, B, weich)
  }
  g.globalCompositeOperation = 'lighter'
  // Lichtlinie am Horizont
  if (z.linie > 0.001) {
    const halb = (B / 2) * z.linie, hell = 0.6 + 0.4 * (z.linienBlitz ?? 0)
    const v = g.createLinearGradient(B / 2 - halb, 0, B / 2 + halb, 0)
    v.addColorStop(0, 'rgba(95,246,255,0)'); v.addColorStop(0.5, `rgba(220,255,255,${hell})`); v.addColorStop(1, 'rgba(95,246,255,0)')
    g.fillStyle = v; g.fillRect(B / 2 - halb, hor - 1.5, halb * 2, 3)
    const s2 = g.createLinearGradient(0, hor - 40, 0, hor + 40); s2.addColorStop(0, 'rgba(95,246,255,0)'); s2.addColorStop(0.5, `rgba(95,246,255,${0.25 * hell})`); s2.addColorStop(1, 'rgba(95,246,255,0)')
    g.globalAlpha = Math.min(1, z.linie * 3); g.fillStyle = s2; g.fillRect(B / 2 - halb, hor - 40, halb * 2, 80); g.globalAlpha = 1
  }
  // Reaktor lädt (Variante 1): wachsender Lichtkern
  if (z.laden > 0.01) halo(g, k.x, k.y, 40 + 120 * z.laden, `rgba(140,250,255,${0.55 * z.laden})`)
  if (z.v5) { nebelWaende(g, s, t); const f = E5.funken.findLast((x) => t >= x && t < x + 0.13); z = { ...z, funken: f != null ? 1 : 0 } }
  // Funken im Reaktor (Variante 3): kurze Zickzack-Entladungen
  if (z.funken > 0) {
    const n = Math.floor(1 + z.funken * 4), takt = Math.floor(t * 18)
    g.strokeStyle = 'rgba(190,250,255,0.9)'; g.lineWidth = 2; g.shadowColor = '#5ff6ff'; g.shadowBlur = 14
    for (let i = 0; i < n; i++) {
      if (zufall(takt * 13 + i) > 0.35 + z.funken * 0.4) continue
      const w0 = zufall(takt * 7 + i) * Math.PI * 2, r0 = k.r * 0.15, r1 = k.r * (0.5 + 0.4 * zufall(takt + i * 3))
      g.beginPath(); for (let j = 0; j <= 6; j++) { const rr = r0 + (r1 - r0) * (j / 6), ww = w0 + (zufall(takt * 31 + i * 5 + j) - 0.5) * 0.35; const x = k.x + Math.cos(ww) * rr, y = k.y + Math.sin(ww) * rr; if (j) g.lineTo(x, y); else g.moveTo(x, y) }
      g.stroke()
    }
    g.shadowBlur = 0
  }
  // Druckwellen vom Reaktor
  for (const bei of z.welle ?? []) {
    const a = t - bei; if (a < 0 || a > 1.8) continue
    const f = a / 1.8, rad = k.r * 0.4 + 3200 * (1 - Math.pow(1 - f, 2.2)), dicke = 90 * (1 - f) + 20
    const v = g.createRadialGradient(k.x, k.y, Math.max(0, rad - dicke), k.x, k.y, rad + dicke)
    v.addColorStop(0, 'rgba(95,246,255,0)'); v.addColorStop(0.5, `rgba(200,255,255,${0.7 * (1 - f)})`); v.addColorStop(1, 'rgba(95,246,255,0)')
    g.fillStyle = v; g.fillRect(k.x - rad - dicke, k.y - rad - dicke, (rad + dicke) * 2, (rad + dicke) * 2)
  }
  // Blitz über alles
  if (z.blitz > 0.003) { halo(g, k.x, k.y, 900, `rgba(230,255,255,${Math.min(1, z.blitz)})`); g.globalAlpha = Math.min(1, z.blitz) * 0.55; g.fillStyle = '#dffcff'; g.fillRect(0, 0, B, H); g.globalAlpha = 1 }
  g.restore()
}

function halo(g, x, y, rad, farbe) {
  const v = g.createRadialGradient(x, y, 0, x, y, rad); v.addColorStop(0, farbe); v.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = v; g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
}
function zufall(n) { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x) }
