// Start-Intro im Jarvis-Programm (neu 05.11.2026, Wahl Auftraggeber: Variante 1 „Runenkette“ aus hud5/intro2.js).
// Dieselbe Szene „Mystic Aurora“ wie das Wallpaper (hud5/szene.js): Blitze, Runen von außen, Rauch von den Seiten, der
// Reaktor setzt sich aus seinen echten Teilen zusammen, Ringe drehen ein, Einschlag, Fenster flackern einzeln an.
// Lokis Gruß kommt live aus seiner Stimme (Hauptfenster → window.jarvisSequenz). Danach: Fenster blendet weich aus
// („ausblenden“ an das Hauptprogramm) – dahinter steht bildgleich das Wallpaper.
// Meldungen: 'gruss' (Loki hat hier gesprochen), 'ohne-gruss', 'abgebrochen', 'ausblenden', 'ende'.
// Jede Taste und jeder Klick bricht ab. Ohne drei Full-HD-Bildschirme nebeneinander: nur der Mittelteil.
import { B, H, ladeSzene, zeichneSzene } from '../hud5/szene.js'
import { ausHud } from '../hud5/inhalte.js'
import { erstelleTafeln, zeichneTafeln, tafelnStellen } from '../hud5/tafeln.js'
import { erstelleFrost, frostStellen } from '../hud5/frost.js'
import { zeichneIntroLicht } from '../hud5/intro.js'
import { introZustand, reaktorTeile, zeichneReaktorTeile, zeichneReaktorMaske, erstelleClips, rauchHinten, rauchVorn, licht2, tonFuer, VARIANTEN } from '../hud5/intro2.js'
import { vorbereiten, starten, jetzt, verzoegerung, setzeTonOrdner, pufferAus } from '../vorschau/start-sequenz/ton/tongerueste.js'
import { sequenzDaten } from './lageDaten.js'
import { wetterAusCode } from '../src/jarvis/wetter.ts'

const VARIANTE = 1
const E = VARIANTEN[VARIANTE].E
const MAX_WARTEN = 50 // Sekunden ab Start; Lokis Stimme braucht nach dem Hochfahren 10–33 s zum Laden
const bruecke = window.jarvisSequenz ?? null
const par = new URLSearchParams(location.search)
const lautstaerke = Math.max(0, Math.min(1, Number(par.get('lautstaerke') ?? 0.8)))
const VERSATZ = par.get('ausschnitt') === 'mitte' ? 1920 : 0
// beim Entwickeln liefert Vite die Dateien direkt aus den Quellordnern, im fertigen Programm liegen sie in dist/
const DEV = import.meta.env.DEV
const ORDNER = { ebenen: DEV ? '/hud5/ebenen/' : './ebenen/', rauch: DEV ? '/hud5/rauch/' : './rauch/', toene: DEV ? '/vorschau/start-sequenz/3d/toene/' : './toene/' }
setzeTonOrdner(new URL(ORDNER.toene, location.href).href)

const c = document.getElementById('flaeche'), g = c.getContext('2d', { alpha: false })
c.width = VERSATZ ? 1920 : B; c.height = H

const WETTER = { klar: 'KLAR', wolkig: 'BEWÖLKT', regen: 'REGEN', gewitter: 'GEWITTER' }
const wetterText = (w) => (w?.code != null ? WETTER[wetterAusCode(w.code, w.wolken ?? 0)] ?? '' : '')
const mitZeitgrenze = (p, ms) => Promise.race([p, new Promise((w) => setTimeout(() => w(null), ms))]).catch(() => null)

let ton = null, grussDaten = null, grussGeplant = false, keinGruss = false, ausBei = null, abbruch = false, frueherAbbruch = false
let frost = null, s = null, tafeln = null, clips = null, daten = null, wetter = null
const gemeldet = new Set()
function melde(art) { if (gemeldet.has(art)) return; gemeldet.add(art); bruecke?.melde(art) }
bruecke?.beiGruss((samples, sampleRate) => { grussDaten = { samples, sampleRate } })
bruecke?.beiKeinGruss(() => { keinGruss = true })

const zeit = () => (ton ? Math.max(0, jetzt() - ton.t0 - verzoegerung()) : 0)
function abbrechen() {
  if (abbruch) return
  if (!ton) { frueherAbbruch = true; return }
  abbruch = true
  const t = zeit(); ton.ausblenden(t, 0.4)
  if (grussGeplant) melde('gruss') // Loki hat schon angefangen → im Hauptfenster nicht nochmal begrüßen
  melde('abgebrochen'); melde('ausblenden')
  setTimeout(() => { ton?.stopp(); melde('ende') }, 1800)
}
addEventListener('keydown', abbrechen)
addEventListener('mousedown', abbrechen)

// Ton der Anzeige „Audio“: was das Intro gerade spielt (Frequenzen aus dem Mess-Punkt des Tongerüsts)
const fft = new Uint8Array(512)
function tonWerte() {
  if (!ton?.gesamt) return null
  ton.gesamt.getByteFrequencyData(fft)
  return Array.from({ length: 128 }, (_, i) => fft[Math.floor(((i % 64) / 64) * 200) + 2] / 255)
}

function bild(t) {
  const z = introZustand(VARIANTE, t, s), k = s.geo.reaktor
  const hell = t >= E.einschlag ? 1 : 0.4 + 0.6 * z.s
  zeichneSzene(g, s, t, {
    loki: 'hoert', an: z.an, versatz: VERSATZ, wetter,
    reaktorZeichnen: z.reaktorTeile ? (gg) => zeichneReaktorTeile(gg, s, z.reaktorTeile, hell) : null,
    reaktorMaske: z.reaktorTeile ? (gg) => zeichneReaktorMaske(gg, s) : null,
    hinten: (gg) => rauchHinten(gg, s, t, z, clips),
  })
  g.save(); g.setTransform(1, 0, 0, 1, -VERSATZ, 0); rauchVorn(g, s, t, z, clips); licht2(g, s, t, z); g.restore()
  zeichneIntroLicht(g, s, t, z, VERSATZ)
  tafelnStellen(tafeln, z.tafeln.art, z.tafeln)
  const fv = (s.wetter?.sichtbar?.frost ?? 0) * (z.an.grund ?? 1); if (fv > 0 && !frost) { const d = document.createElement('div'); document.body.appendChild(d); frost = erstelleFrost(d, VERSATZ) } if (frost) frostStellen(frost, fv)
  if (z.tafeln.links > 0 || z.tafeln.rechts > 0) zeichneTafeln(tafeln, { ...daten, ton: tonWerte() }, t)
}

function schleife() {
  if (gemeldet.has('ende')) return
  const t = zeit()
  if (!abbruch && ausBei == null) {
    if (!grussGeplant && grussDaten && t >= E.gruss - 0.6) {
      // Gruß frühestens zur geplanten Stelle, sonst sobald er da ist; Musik wird dafür abgesenkt (in ton.gruss)
      grussGeplant = true
      const ende = ton.gruss(pufferAus(grussDaten.samples, grussDaten.sampleRate), Math.max(E.gruss, t + 0.4))
      ausBei = ende + 1.2
      setTimeout(() => melde('gruss'), Math.max(0, ende - t) * 1000)
    } else if (!grussGeplant && ((keinGruss && t >= 15) || t >= MAX_WARTEN)) { ausBei = t; melde('ohne-gruss') }
  }
  if (ausBei != null && t >= ausBei && !abbruch) {
    abbruch = true; ton.ausblenden(t, 1.4); melde('ausblenden')
    setTimeout(() => { ton.stopp(); melde('ende') }, 1800)
  }
  try { bild(t) } catch (f) { // nie einfrieren: bei einem Zeichenfehler sauber ausblenden (Prüf-Agent 05.11.2026)
    console.error('Start-Intro:', f); if (!abbruch) { abbruch = true; ton?.ausblenden(t, 0.6); melde('ohne-gruss'); melde('ausblenden'); setTimeout(() => { ton?.stopp(); melde('ende') }, 1800) }
  }
  requestAnimationFrame(schleife)
}

async function los() {
  // Szene, Reaktor-Teile, Töne und die aktuellen Anzeige-Daten parallel laden
  const [szene, , , antwort] = await Promise.all([
    ladeSzene(ORDNER.ebenen),
    null,
    vorbereiten(null),
    mitZeitgrenze(bruecke?.hud?.() ?? Promise.resolve(null), 2500),
  ])
  s = szene
  await reaktorTeile(s, ORDNER.ebenen)
  if (frueherAbbruch) { melde('abgebrochen'); melde('ende'); return }
  const neu = antwort ? { ...antwort } : null
  if (neu?.station && neu.wetter && Number.isFinite(neu.station.grad)) neu.wetter = { ...neu.wetter, grad: neu.station.grad, station: neu.station }
  daten = ausHud(neu, new Date(), sequenzDaten, wetterText)
  wetter = neu?.wetter ? { code: neu.wetter.code, grad: neu.wetter.grad, station: neu.wetter.station } : null
  tafeln = erstelleTafeln(document.getElementById('tafeln'), VERSATZ)
  clips = erstelleClips(ORDNER.rauch)
  await clips.laden()
  ton = starten(tonFuer(VARIANTE, s), { offen: true, lautstaerke })
  requestAnimationFrame(schleife)
}
los().catch((f) => { console.error('Start-Intro:', f); melde('ohne-gruss'); melde('ende') })
