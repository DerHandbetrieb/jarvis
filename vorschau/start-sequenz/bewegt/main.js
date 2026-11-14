// Bewegte Start-Sequenz nach der Auswahl des Auftraggebers (03.11.2026): Stilprobe 9 „Kombination“ (Farbe Schwarzglas,
// links Aufbau von Hologramm-Türkis, Mitte Schwarzglas mit Runen-Schild, rechts Aufbau von Silberlicht) mit Tongerüst 9
// „Trailer-Wucht + Verwandlung“. Vorgabe: flüssig (Runde 5 stotterte). Darum werden alle aufwendigen Teile (Leuchten,
// Unschärfe, Verläufe, Schrift) beim Laden EINMAL in eigene Leinwände vorgezeichnet; je Bild werden sie nur noch gedreht,
// ein- und ausgeblendet. Neu gezeichnet werden nur kleine Teile (Tonwellen, Spektrum, Uhr, Globus-Punkte, Radar).
// Die Bildrate wird gemessen (window.startSequenz.messung(), Anzeige mit ?fps). Alle Werkstatt-Zahlen sind Beispiele.
import { aufbauen, zeichne, verbinde, setzeDaten, tonDaten, TON } from './szene.js'
import { datumText, sequenzDaten } from '../../../dauerhud/lageDaten.js'
import { ZEIT, vorbereiten, starten, jetzt, verzoegerung } from '../ton/tongerueste.js'
const Z = ZEIT
const buehne = document.getElementById('buehne'), c = document.getElementById('flaeche')
// ---------- Ablauf, Messung ----------
const fpsAnzeige = document.getElementById('fps'), info = document.getElementById('info'), knopf = document.getElementById('spielen')
const par = new URLSearchParams(location.search)
let lauf = null, laedt = false, grussNr = Math.floor(Math.random() * 4), messung = null
function neueMessung() { messung = { bilder: 0, abstaende: [], zeichnen: [], letzte: null } }
function auswerten() {
  if (!messung || messung.abstaende.length < 10) return null
  const a = [...messung.abstaende].sort((x, y) => x - y), z = [...messung.zeichnen].sort((x, y) => x - y), mittel = a.reduce((s, v) => s + v, 0) / a.length
  return { bilder: messung.bilder, bps: +(1000 / mittel).toFixed(1), abstand95: +a[Math.floor(a.length * 0.95)].toFixed(1), abstandMax: +a.at(-1).toFixed(1), ueber20ms: a.filter((v) => v > 20).length, zeichnenMittel: +(z.reduce((s, v) => s + v, 0) / z.length).toFixed(2), zeichnen95: +z[Math.floor(z.length * 0.95)].toFixed(2) }
}
async function abspielen() {
  if (laedt) return // während des Ladens kein zweiter Start
  if (lauf) { stoppen(); return }
  knopf.textContent = '…'; laedt = true
  grussNr = (grussNr % 4) + 1
  let fehlt; try { fehlt = await vorbereiten(grussNr) } finally { laedt = false }
  if (fehlt.length) info.textContent = `Fehlende Töne: ${fehlt.join(', ')}`
  const ton = starten(TON); tonDaten.gesamt = ton.gesamt; tonDaten.stimme = ton.stimme
  lauf = { ton }; neueMessung(); knopf.textContent = '■ Stopp'
}
function stoppen() {
  if (!lauf) return
  lauf.ton.stopp(); tonDaten.gesamt = tonDaten.stimme = null; lauf = null; knopf.textContent = '▶ Abspielen'
  const m = auswerten(); if (m) { info.textContent = `Gemessen: ${m.bps} Bilder/s · 95 % der Bilder nach höchstens ${m.abstand95} ms · längste Pause ${m.abstandMax} ms · Zeichnen im Mittel ${m.zeichnenMittel} ms`; console.log('MESSUNG ' + JSON.stringify(m)) }
  zeichne(16)
}
function schleife(jetztMs) {
  requestAnimationFrame(schleife)
  if (!lauf) return
  const t = jetzt() - lauf.ton.t0 - verzoegerung() // Bild folgt der Tonuhr (abzüglich Ausgabe-Verzögerung) → Bild und Ton gleichauf
  if (t > Z.ENDE + 0.2) { stoppen(); return }
  const a = performance.now(); zeichne(Math.max(0, t)); const dauer = performance.now() - a
  if (messung.letzte != null) messung.abstaende.push(jetztMs - messung.letzte)
  messung.letzte = jetztMs; messung.zeichnen.push(dauer); messung.bilder++
  if (fpsAnzeige && messung.bilder % 15 === 0) { const m = auswerten(); if (m) fpsAnzeige.textContent = `${m.bps} B/s · Zeichnen ${m.zeichnenMittel} ms` }
}
knopf.onclick = abspielen
document.getElementById('voll').onclick = () => buehne.requestFullscreen?.()
// ?probe: Ansicht mit erfundenen, aber realistischen „echten“ Werten (zum Prüfen der Optik von Etappe L3, nicht die Werkstatt)
if (par.has('probe')) {
  const jetzt0 = new Date(), tag = (n) => new Date(jetzt0.getTime() - n * 864e5).toISOString().slice(0, 10)
  setzeDaten({
    datum: datumText(jetzt0), wetter: 'ÖHRINGEN · 7 °C · BEWÖLKT',
    echt: sequenzDaten({ geholt: jetzt0.getTime(), aufgaben: { offen: 7, neu: 2, amazonProbleme: ['Amazon-Problem: Bild'], wichtigste: [{ titel: 'Kerzenständer Beton nachproduzieren', faellig: tag(1) }, { titel: 'Etsy-Fotos Lichtkästen', faellig: tag(0) }, { titel: 'Tassen Emma glasieren', faellig: tag(-3) }, { titel: 'Gießform reinigen', faellig: null }] },
      lagerKnapp: [{ name: 'Tasse', variante: 'Emma', bestand: 1, meldebestand: 8 }, { name: 'Kerzenständer Beton', variante: null, bestand: 2, meldebestand: 6 }],
      verkauf: { gestern: { bestellungen: 4, stueck: 6, umsatzCent: 18990 }, tage: Array.from({ length: 14 }, (_, i) => ({ tag: tag(13 - i), bestellungen: 2, stueck: 3, umsatzCent: [4200, 8800, 0, 12000, 9600, 7400, 13300, 5800, 10100, 8700, 14500, 9200, 11000, 18990][i] })), kanaele14: [{ kanal: 'Etsy', bestellungen: 21, umsatzCent: 98000 }, { kanal: 'Amazon', bestellungen: 9, umsatzCent: 31000 }, { kanal: 'Eigener Shop', bestellungen: 4, umsatzCent: 14000 }] },
      freigaben: 1, selbsttest: { am: jetzt0.toISOString(), rot: 0 } }, jetzt0),
  })
}
verbinde(c); aufbauen(); zeichne(16); requestAnimationFrame(schleife)
window.startSequenz = { zeichne, messung: auswerten, ZEIT: Z, abspielen, stoppen }
if (par.has('fps')) fpsAnzeige.hidden = false
if (par.has('flaeche')) {
  document.body.classList.add('flaeche')
  setTimeout(() => knopf.click(), 400)
  addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { stoppen(); window.close() } else if (ev.key === ' ') { stoppen(); knopf.click() } })
}
