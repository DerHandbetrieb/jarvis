// Dauer-HUD als Web-Wallpaper für Wallpaper Engine – neue Fassung „Mystic Aurora“ (05.11.2026, Grafikpaket des
// Auftraggebers; Szene hud5/szene.js, Inhalte hud5/inhalte.js – dieselbe Szene wie das künftige Intro). Holt die Daten
// von L.O.K.I. (Gegenstelle nur auf 127.0.0.1, Zugriffsschlüssel aus zugang.js – von L.O.K.I. beim Einrichten
// geschrieben), dazu Live-Bilder beider Kamera-Objektive und den Ton des PCs (Wallpaper-Engine-Schnittstelle).
// Wallpaper Engine pausiert das Wallpaper bei Spielen/Vollbild selbst (setPaused). Über drei Bildschirme: ganze Fläche
// 5760×1080; auf einem einzelnen Bildschirm nur der mittlere Teil. Klick auf den Reaktor = L.O.K.I. stumm / wieder an.
import { B, H, ladeSzene, zeichneSzene } from '../hud5/szene.js'
import { ausHud } from '../hud5/inhalte.js'
import { erstelleTafeln, kameraGross, zeichneTafeln } from '../hud5/tafeln.js'
import { erstelleFrost, frostStellen } from '../hud5/frost.js'
import { sequenzDaten } from '../startsequenz/lageDaten.js'
import { wetterAusCode } from '../src/jarvis/wetter.ts'

const zugang = window.LOKI_HUD ?? { port: 47820, schluessel: '' }
const c = document.getElementById('flaeche'), g = c.getContext('2d', { alpha: false })
const nurMitte = !location.search.includes('alle') && innerWidth / innerHeight < 2.5 // ?alle: Prüfhilfe für Tests
const VERSATZ = nurMitte ? 1920 : 0
c.width = nurMitte ? 1920 : B; c.height = H

const WETTER = { klar: 'KLAR', wolkig: 'BEWÖLKT', regen: 'REGEN', gewitter: 'GEWITTER' }
const wetterText = (w) => (w?.code != null ? WETTER[wetterAusCode(w.code, w.wolken ?? 0)] ?? '' : '')
let antwort = null, daten = ausHud(null, new Date(), sequenzDaten, wetterText)
let pausiert = false, lauf = 0 // lauf: Nummer der Zeichenschleife – nach Pause nie zwei gleichzeitig (Prüf-Agent)
let ton = null, letzterTon = 0
const kopf = () => ({ 'x-loki-schluessel': zugang.schluessel })

let klickNr = 0 // Stand von vor einem Klick auf den Reaktor nicht mehr übernehmen
async function holen() {
  if (pausiert) return
  const nr = klickNr
  try {
    const r = await fetch(`http://127.0.0.1:${zugang.port}/hud`, { headers: kopf(), signal: AbortSignal.timeout(8000) })
    if (!r.ok) throw new Error(String(r.status))
    const neu = await r.json()
    if (nr !== klickNr) neu.loki = antwort?.loki ?? neu.loki
    if (neu?.station && neu.wetter && Number.isFinite(neu.station.grad)) neu.wetter = { ...neu.wetter, grad: neu.station.grad, station: neu.station } // Ring und Wettereffekte nach der eigenen Station
    antwort = neu
  } catch {
    antwort = null // ohne L.O.K.I.: Beispielwerte, klar als „BEISPIEL“ markiert; Systemfeld zeigt „nicht verbunden“
  }
  daten = ausHud(antwort, new Date(), sequenzDaten, wetterText)
}

// Live-Bild beider Objektive (wie bisher: Wallpaper Engine kann kein H.264, L.O.K.I. liefert fertige JPEG-Bilder;
// GET /bild/<k>?nach=<nr> wartet bis zum nächsten Bild). Bei Pause wird nicht gefragt – L.O.K.I. schließt die Kamera-
// Verbindung dann nach 15 s von selbst. Letztes Bild bleibt bis 10 s stehen, damit kurze Aussetzer nicht springen.
const live = [null, null], nr = [0, 0]
const warte = (ms) => new Promise((f) => setTimeout(f, ms))
async function liveSchleife(k) {
  for (;;) {
    if (pausiert || !antwort?.kamera) { await warte(500); continue }
    try {
      const r = await fetch(`http://127.0.0.1:${zugang.port}/bild/${k}?nach=${nr[k]}`, { headers: kopf(), signal: AbortSignal.timeout(5000) })
      if (r.status !== 200) { await warte(300); continue }
      const neuNr = Number(r.headers.get('x-bild-nr')) || 0
      if (neuNr === nr[k] || !neuNr) await warte(40)
      nr[k] = neuNr
      const bild = await createImageBitmap(await r.blob())
      live[k]?.bild.close?.(); live[k] = { bild, zeit: performance.now() }
    } catch { await warte(1000) }
  }
}
const liveBild = (k) => (live[k] && performance.now() - live[k].zeit < 10_000 ? live[k].bild : null)
void liveSchleife(0); void liveSchleife(1)

// Klick auf den Reaktor (Mitte des mittleren Bildschirms): L.O.K.I. stumm bzw. wieder an – wie der rote Knopf bisher.
// Wallpaper Engine gibt Klicks auf den freien Desktop an das Wallpaper weiter.
let sperre = 0
c.addEventListener('click', async (ev) => {
  const x = (ev.clientX * c.width) / innerWidth + VERSATZ, y = (ev.clientY * c.height) / innerHeight
  if (Math.hypot(x - 2881, y - 494) > 330 || performance.now() < sperre) return
  sperre = performance.now() + 800
  klickNr++
  try {
    const r = await fetch(`http://127.0.0.1:${zugang.port}/stumm`, { method: 'POST', headers: kopf(), signal: AbortSignal.timeout(5000) })
    if (r.ok && antwort) { antwort = { ...antwort, loki: { ...antwort.loki, ...(await r.json()) } }; daten = ausHud(antwort, new Date(), sequenzDaten, wetterText) }
  } catch { /* L.O.K.I. läuft nicht */ }
  setTimeout(() => void holen(), 1500)
})

// Ton des PCs (Wallpaper-Engine-Schnittstelle: 128 Werte, links 0–63, rechts 64–127, ca. 30-mal je Sekunde)
// angemeldet wird im klassischen Skript am Ende von <body> (dauer-hud.html, so empfiehlt es die Wallpaper-Engine-Doku);
// hier nur abholen
let jemalsTon = false
setInterval(() => { const a = window.LOKI_TON; if (a && a.zeit) { ton = a.werte; letzterTon = a.zeit; jemalsTon = true } }, 30)
// Ersatz: liefert Wallpaper Engine keinen Ton, holt das Wallpaper ihn bei L.O.K.I. (GET /ton, Windows-Loopback, 05.11.2026)
let tonVonLoki = false, tonHolen = false
setInterval(async () => {
  // nur pausieren, wenn Wallpaper Engine selbst Ton liefert (vorher: auch nach eigenem Abruf 1 s Pause → ruckelig)
  if (pausiert || tonHolen || performance.now() - (window.LOKI_TON_WE ?? -1e9) < 1000) return
  tonHolen = true
  try {
    const r = await fetch(`http://127.0.0.1:${zugang.port}/ton`, { headers: kopf(), signal: AbortSignal.timeout(2000) })
    if (r.status === 200) { const w = await r.json(); if (Array.isArray(w) && w.length === 128) { window.LOKI_TON = { werte: w, zeit: performance.now() }; tonVonLoki = true } }
  } catch { /* L.O.K.I. läuft nicht */ } finally { tonHolen = false }
}, 15)
const tonStatus = () => (tonVonLoki || jemalsTon ? 'STILLE' : !window.LOKI_TON_ANGEMELDET ? 'KEIN TON-ZUGRIFF' : 'WARTET AUF TON')
window.wallpaperPropertyListener = { setPaused: (p) => { const war = pausiert; pausiert = !!p; if (war && !pausiert) { lauf++; requestAnimationFrame((ms) => schleife(ms, lauf)) } } }

const szene = await ladeSzene('./ebenen/')
const tafeln = erstelleTafeln(document.getElementById('tafeln'), VERSATZ) // Fenster mit echter Perspektive über der Szene
let frost = null // vereister Rand über allem – erst anlegen, wenn es friert (05.11.2026)
const frostEbene = () => { const d = document.createElement('div'); document.body.appendChild(d); return erstelleFrost(d, VERSATZ) }
/** Zustand von L.O.K.I. für den Reaktor: hört zu / denkt / spricht / aus */
const reaktorZustand = (l) => (!l || !l.mikrofon || ['aus', 'fehler'].includes(l.zustand) ? 'aus' : l.zustand === 'denkt' ? 'denkt' : l.zustand === 'spricht' ? 'spricht' : 'hoert')

function schleife(ms, meine = lauf) {
  if (pausiert || meine !== lauf) return
  requestAnimationFrame((n) => schleife(n, meine))
  const t = ms / 1000, loki = antwort?.loki ?? null
  const tonJetzt = performance.now() - letzterTon < 2000 ? ton : null
  zeichneSzene(g, szene, t, { wetter: antwort?.wetter ?? null, versatz: VERSATZ, loki: reaktorZustand(loki), pegel: 0.6 + 0.4 * Math.abs(Math.sin(t * 7)), ton: tonJetzt }) // Reaktor pulsiert im Beat
  const fv = szene.wetter?.sichtbar?.frost ?? 0; if (fv > 0 && !frost) frost = frostEbene(); if (frost) frostStellen(frost, fv)
  kameraGross(tafeln, antwort?.kamera?.gross ?? null)
  zeichneTafeln(tafeln, { ...daten, tonStatus: tonStatus(), ton: performance.now() - letzterTon < 2000 ? ton : null, kamBilder: [liveBild(0), liveBild(1)] }, t)
}

void holen()
setInterval(() => void holen(), 5000) // kurz, damit der Klick auf den Reaktor den echten Stand zeigt
setInterval(() => { daten = ausHud(antwort, new Date(), sequenzDaten, wetterText) }, 30_000) // Uhr/Datum
requestAnimationFrame((ms) => schleife(ms, lauf))
window.dauerHud = { daten: () => daten }
