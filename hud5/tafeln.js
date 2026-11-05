// Fenster-Tafeln über der Szene (05.11.2026, Wahl Auftraggeber: Rahmen „Glas & Goldkante“). Rahmen und Inhalt liegen je
// Fenster in EINER Leinwand; alle Fenster einer Seite sitzen auf einer Tafel, die der Browser mit echter Perspektive
// kippt (CSS 3D, rotateY) – dadurch passen Rahmen und Inhalt immer exakt zueinander. Links kippt die Tafel nach
// rechts hinten, rechts gespiegelt nach links hinten (wie im Grafikpaket des Auftraggebers).
import { RAHMEN_STILE } from './rahmen.js'
import { ZEICHNER } from './inhalte.js'

const STIL = RAHMEN_STILE[1]
const TAFEL = { links: 560, oben: 165, breite: 1240, hoehe: 760, neigung: 24, tiefe: 1900, skala: 1.1 } // Wahl Auftraggeber 05.11.2026: 10 % größer und weiter zur Bildschirmmitte (links war 450)
// Felder auf der flachen Tafel (x, y, Breite, Höhe) – links Werkstatt, rechts Haus (gleiche Anordnung, gespiegelt)
// 05.11.2026 (Wunsch Auftraggeber): Umsatz heute braucht wenig Platz, Verkäufe 14 Tage dafür breiter; Felder bewusst
// unterschiedlich groß statt alle gleich
const LINKS = [['verkaeufe', 0, 0, 940, 260], ['umsatz', 960, 0, 280, 260], ['ton', 0, 280, 1240, 160], ['aufgaben', 0, 460, 700, 300], ['bestellungen', 720, 460, 520, 300]]
// rechts gespiegelt: Feld bei x 630 landet innen (links) – CAM 01 links, CAM 02 rechts (Rückmeldung 05.11.2026)
// Umbau 05.11.2026 (Wunsch Auftraggeber): schmaler Streifen für den L.O.K.I.-Systemstatus, unten innen Wetter, unten
// außen groß die PV-Anlage
const RECHTS = [['kamera2', 0, 0, 610, 260], ['kamera1', 630, 0, 610, 260], ['system', 0, 280, 1240, 64], ['energie', 0, 364, 800, 396], ['wetter', 820, 364, 420, 396]] // PV breiter, Wetter schmaler (05.11.2026)
const SPIEGEL = { abstand: 14, deckkraft: 0.45, unschaerfe: 1.5, auslauf: 150 } // nur der obere Streifen ist zu sehen (Bildrand)
const BEWEGT = new Set(['ton', 'kamera1', 'kamera2', 'energie']) // energie: laufende Lichtpunkte

/** Tafeln anlegen. huelle = Element über der Szenen-Leinwand (gleiche Größe); faktor = Bildschirm-Pixel je Szenen-Pixel.
 *  skala: Größe der Fenster (1 = bisher; Wunsch Auftraggeber 05.11.2026: größer, Wahl über vier Vorschauen) – die Tafel
 *  wächst zur Bildschirmmitte hin, der Abstand zum Runenbogen außen bleibt, die senkrechte Mitte bleibt */
export function erstelleTafeln(huelle, versatz = 0, { skala = TAFEL.skala } = {}) {
  const k = skala, br = TAFEL.breite * k, ho = TAFEL.hoehe * k, oben = TAFEL.oben + (TAFEL.hoehe - ho) / 2
  huelle.style.position = 'absolute'; huelle.style.inset = '0'; huelle.style.pointerEvents = 'none'; huelle.style.overflow = 'hidden'
  const flaeche = document.createElement('div') // 5760×1080-Fläche, auf die Fenstergröße skaliert
  Object.assign(flaeche.style, { position: 'absolute', left: '0', top: '0', width: '5760px', height: '1080px', transformOrigin: '0 0' })
  huelle.appendChild(flaeche)
  const felder = {}
  for (const [seite, liste] of [['links', LINKS], ['rechts', RECHTS]]) {
    const x = seite === 'links' ? TAFEL.links : 5760 - TAFEL.links - br
    // zwei Bühnen: die Tafel selbst und darunter ihre Spiegelung im Wasser (Wunsch Auftraggeber 05.11.2026). Gespiegelt
    // wird im Raum an der Wasserlinie knapp unter der Tafel – VOR der Perspektive (sonst laufen Tafel- und Spiegelkante
    // wie ein „V“ auseinander, Rückmeldung 05.11.2026); beide Bühnen haben denselben Fluchtpunkt. Spiegelbild unscharf,
    // blasser, läuft nach unten aus; Inhalt in Viertel-Auflösung kopiert (billig)
    const bauen = (spiegel) => {
      const buehne = document.createElement('div')
      Object.assign(buehne.style, { position: 'absolute', left: x + 'px', top: oben + 'px', width: br + 'px', height: ho + 'px', perspective: TAFEL.tiefe * k + 'px', perspectiveOrigin: '50% 50%' })
      if (spiegel) Object.assign(buehne.style, { opacity: String(SPIEGEL.deckkraft), filter: `blur(${SPIEGEL.unschaerfe}px)` })
      const tafel = document.createElement('div'), ox = seite === 'links' ? '0%' : '100%', drehen = `rotateY(${seite === 'links' ? TAFEL.neigung : -TAFEL.neigung}deg)`
      Object.assign(tafel.style, { position: 'absolute', inset: '0', transformStyle: 'preserve-3d', transformOrigin: `${ox} 50%`, transform: drehen })
      if (spiegel) Object.assign(tafel.style, { transformStyle: 'flat', transformOrigin: `${ox} ${ho + SPIEGEL.abstand / 2}px`, transform: `${drehen} scaleY(-1)`, maskImage: `linear-gradient(to top, #000, transparent ${SPIEGEL.auslauf}px)` })
      buehne.appendChild(tafel); flaeche.appendChild(buehne)
      return tafel
    }
    const spiegelTafel = bauen(true), tafel = bauen(false)
    for (const [id, fx, fy, b, h] of liste) {
      const lage = { position: 'absolute', left: (seite === 'links' ? fx : TAFEL.breite - fx - b) * k + 'px', top: fy * k + 'px', width: b * k + 'px', height: h * k + 'px' }
      const c = document.createElement('canvas'); c.width = Math.round(b * k); c.height = Math.round(h * k); Object.assign(c.style, lage); tafel.appendChild(c)
      const s = document.createElement('canvas'); s.width = Math.ceil(b / 4); s.height = Math.ceil(h / 4); Object.assign(s.style, lage); spiegelTafel.appendChild(s)
      felder[id] = { c, g: c.getContext('2d'), b, h, k, sg: s.getContext('2d'), sb: s.width, sh: s.height }
    }
  }
  const passen = () => { const f = (huelle.clientHeight || innerHeight) / 1080; flaeche.style.transform = `scale(${f}) translateX(${-versatz}px)` }
  passen(); addEventListener('resize', passen)
  return { felder, kennung: '' }
}

function feldZeichnen(f, id, daten, t) {
  const { g, b, h } = f
  g.setTransform(f.k, 0, 0, f.k, 0, 0) // gezeichnet wird in Feld-Einheiten, die Leinwand hat die vergrößerte Auflösung (scharf)
  g.clearRect(0, 0, b, h)
  const innen = STIL.zeichne(g, b, h)
  const bild = id.startsWith('kamera') // Kamerabild bündig in der Fensterform, Rand und Goldkanten darüber (Rückmeldung 05.11.2026)
  g.save(); g.beginPath()
  if (bild && STIL.form) STIL.form(g, b, h, 3); else g.rect(innen.x, innen.y, innen.b, innen.h)
  g.clip(); g.translate(innen.x, innen.y)
  ZEICHNER[id](g, innen.b, innen.h, daten, t)
  if (bild && STIL.rand) { g.restore(); g.save(); STIL.rand(g, b, h) }
  if ((daten.beispiel || daten.veraltet) && ['verkaeufe', 'umsatz', 'aufgaben', 'bestellungen'].includes(id)) {
    g.font = '600 12px Bahnschrift, "Segoe UI", sans-serif'; g.fillStyle = 'rgba(242,176,74,0.9)'; g.textAlign = 'right'
    g.fillText(daten.veraltet ? 'KEINE AKTUELLEN DATEN' : 'BEISPIEL', innen.b - 14, innen.h - 10)
  }
  g.restore()
  f.sg.clearRect(0, 0, f.sb, f.sh); f.sg.drawImage(f.c, 0, 0, f.sb, f.sh)
}

/** je Bild: ruhige Fenster nur bei neuen Daten, Tonwellen und Kameras immer */
export function zeichneTafeln(st, daten, t) {
  const kennung = JSON.stringify([daten.werkstatt, daten.wetter, daten.kamera?.name ?? null, daten.loki, daten.uhr, daten.beispiel, daten.veraltet])
  const alles = kennung !== st.kennung
  st.kennung = kennung
  for (const [id, f] of Object.entries(st.felder)) if (alles || BEWEGT.has(id)) feldZeichnen(f, id, daten, t)
}
