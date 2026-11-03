// Start-Sequenz im Jarvis-Programm (03.11.2026, vom Auftraggeber abgenommen: „passt, gefällt mir, lief sauber durch“).
// Szene und Ton kommen aus der Vorschau (vorschau/start-sequenz/bewegt/szene.js, ton/tongerueste.js – Gerüst 9).
// Unterschied zur Vorschau: Lokis Spruch ist keine fertige Datei, sondern kommt live aus seiner Stimme (das Hauptfenster
// erzeugt ihn und schickt ihn über window.jarvisSequenz). Bis er da ist, läuft die Sequenz nach dem Einschlag weiter
// (offenes Ende); spätestens nach MAX_WARTEN Sekunden blendet sie ohne Gruß aus. Jede Taste und jeder Klick bricht ab.
// Meldungen an das Programm: 'gruss' (Loki hat hier gesprochen), 'ohne-gruss', 'abgebrochen', 'ende' (Fenster zu).
import { aufbauen, zeichne, verbinde, tonDaten, TON } from '../vorschau/start-sequenz/bewegt/szene.js'
import { ZEIT as Z, vorbereiten, starten, jetzt, verzoegerung, setzeTonOrdner, pufferAus } from '../vorschau/start-sequenz/ton/tongerueste.js'

const MAX_WARTEN = 50 // Sekunden ab Start; Lokis Stimme braucht nach dem Hochfahren 10–33 s zum Laden
const bruecke = window.jarvisSequenz ?? null
const par = new URLSearchParams(location.search)
const lautstaerke = Math.max(0, Math.min(1, Number(par.get('lautstaerke') ?? 0.8)))
// beim Entwickeln liefert Vite die Töne direkt aus der Vorschau, im fertigen Programm liegen sie in dist/toene
setzeTonOrdner(new URL(import.meta.env.DEV ? '/vorschau/start-sequenz/3d/toene/' : './toene/', location.href).href)

const c = document.getElementById('flaeche')
verbinde(c, { versatzX: par.get('ausschnitt') === 'mitte' ? 1920 : 0 })
aufbauen()

let ton = null, grussDaten = null, grussGeplant = false, keinGruss = false, ausBei = null, ausDauer = 2, abbruch = false
const gemeldet = new Set()
function melde(art) { if (gemeldet.has(art)) return; gemeldet.add(art); bruecke?.melde(art) }
bruecke?.beiGruss((samples, sampleRate) => { grussDaten = { samples, sampleRate } })
bruecke?.beiKeinGruss(() => { keinGruss = true })

const zeit = () => Math.max(0, jetzt() - ton.t0 - verzoegerung())
let frueherAbbruch = false
function abbrechen() {
  if (abbruch) return
  if (!ton) { frueherAbbruch = true; return } // Töne laden noch → gleich nach dem Laden beenden
  abbruch = true
  const t = zeit(); ausBei = t; ausDauer = 0.5; ton.ausblenden(t, 0.5)
  if (grussGeplant) melde('gruss') // Loki hat schon angefangen → im Hauptfenster nicht nochmal begrüßen
  melde('abgebrochen')
}
addEventListener('keydown', abbrechen)
addEventListener('mousedown', abbrechen)

function schleife() {
  const t = zeit()
  if (!abbruch && ausBei == null) {
    if (!grussGeplant && grussDaten && t >= Z.GRUSS - 0.6) {
      // Gruß frühestens zur geplanten Stelle, sonst sobald er da ist; Musik wird dafür abgesenkt (in ton.gruss)
      grussGeplant = true
      const ende = ton.gruss(pufferAus(grussDaten.samples, grussDaten.sampleRate), Math.max(Z.GRUSS, t + 0.4))
      ausBei = ende + 1.8; ton.ausblenden(ausBei, 2)
      setTimeout(() => melde('gruss'), Math.max(0, ende - t) * 1000)
    } else if (!grussGeplant && ((keinGruss && t >= Z.AUS) || t >= MAX_WARTEN)) {
      ausBei = t; ton.ausblenden(t, 2); melde('ohne-gruss')
    }
  }
  zeichne(t, ausBei ?? 999, ausDauer)
  if (ausBei != null && t > ausBei + ausDauer + 0.2) { ton.stopp(); melde('ende'); return }
  requestAnimationFrame(schleife)
}

async function los() {
  await vorbereiten(null) // Töne laden (fehlende werden übersprungen, die Sequenz läuft trotzdem)
  if (frueherAbbruch) { melde('abgebrochen'); melde('ende'); return }
  ton = starten(TON, { offen: true, lautstaerke })
  tonDaten.gesamt = ton.gesamt; tonDaten.stimme = ton.stimme
  requestAnimationFrame(schleife)
}
los().catch((f) => { console.error('Start-Sequenz:', f); melde('ohne-gruss'); melde('ende') })
