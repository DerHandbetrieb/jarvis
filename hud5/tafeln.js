// Fenster-Tafeln über der Szene (05.11.2026, Wahl Auftraggeber: Rahmen „Glas & Goldkante“). Rahmen und Inhalt liegen je
// Fenster in EINER Leinwand; alle Fenster einer Seite sitzen auf einer Tafel, die der Browser mit echter Perspektive
// kippt (CSS 3D, rotateY) – dadurch passen Rahmen und Inhalt immer exakt zueinander. Links kippt die Tafel nach
// rechts hinten, rechts gespiegelt nach links hinten (wie im Grafikpaket des Auftraggebers).
import { RAHMEN_STILE } from './rahmen.js'
import { ZEICHNER } from './inhalte.js'

const STIL = RAHMEN_STILE[1]
const TAFEL = { links: 450, oben: 165, breite: 1240, hoehe: 760, neigung: 24, tiefe: 1900 } // links 450: Abstand zum Runenbogen (Wunsch 05.11.2026)
// Felder auf der flachen Tafel (x, y, Breite, Höhe) – links Werkstatt, rechts Haus (gleiche Anordnung, gespiegelt)
// 05.11.2026 (Wunsch Auftraggeber): Umsatz heute braucht wenig Platz, Verkäufe 14 Tage dafür breiter; Felder bewusst
// unterschiedlich groß statt alle gleich
const LINKS = [['verkaeufe', 0, 0, 940, 260], ['umsatz', 960, 0, 280, 260], ['ton', 0, 280, 1240, 160], ['aufgaben', 0, 460, 700, 300], ['bestellungen', 720, 460, 520, 300]]
// rechts gespiegelt: Feld bei x 630 landet innen (links) – CAM 01 links, CAM 02 rechts (Rückmeldung 05.11.2026)
// Umbau 05.11.2026 (Wunsch Auftraggeber): schmaler Streifen für den L.O.K.I.-Systemstatus, unten innen Wetter, unten
// außen groß die PV-Anlage
const RECHTS = [['kamera2', 0, 0, 610, 260], ['kamera1', 630, 0, 610, 260], ['system', 0, 280, 1240, 64], ['energie', 0, 364, 800, 396], ['wetter', 820, 364, 420, 396]] // PV breiter, Wetter schmaler (05.11.2026)
const SPIEGEL = { abstand: 14, deckkraft: 0.5, unschaerfe: 1.5, auslauf: 150 } // nur der obere Streifen ist zu sehen (Bildrand)
const BEWEGT = new Set(['ton', 'kamera1', 'kamera2', 'energie']) // energie: laufende Lichtpunkte

/** Tafeln anlegen. huelle = Element über der Szenen-Leinwand (gleiche Größe); faktor = Bildschirm-Pixel je Szenen-Pixel */
export function erstelleTafeln(huelle, versatz = 0) {
  huelle.style.position = 'absolute'; huelle.style.inset = '0'; huelle.style.pointerEvents = 'none'; huelle.style.overflow = 'hidden'
  const flaeche = document.createElement('div') // 5760×1080-Fläche, auf die Fenstergröße skaliert
  Object.assign(flaeche.style, { position: 'absolute', left: '0', top: '0', width: '5760px', height: '1080px', transformOrigin: '0 0' })
  huelle.appendChild(flaeche)
  const felder = {}
  for (const [seite, liste] of [['links', LINKS], ['rechts', RECHTS]]) {
    const x = seite === 'links' ? TAFEL.links : 5760 - TAFEL.links - TAFEL.breite
    // zwei Bühnen: die Tafel selbst und darunter ihre Spiegelung im Wasser (Wunsch Auftraggeber 05.11.2026) – gleiche
    // Perspektive, senkrecht gekippt, unscharf und nach unten auslaufend; Inhalt in Viertel-Auflösung kopiert (billig)
    const bauen = (oben, spiegel) => {
      const buehne = document.createElement('div')
      Object.assign(buehne.style, { position: 'absolute', left: x + 'px', top: oben + 'px', width: TAFEL.breite + 'px', height: TAFEL.hoehe + 'px', perspective: TAFEL.tiefe + 'px', perspectiveOrigin: '50% 50%' })
      if (spiegel) Object.assign(buehne.style, { transform: 'scaleY(-1)', opacity: String(SPIEGEL.deckkraft), filter: `blur(${SPIEGEL.unschaerfe}px)`, maskImage: `linear-gradient(to top, #000, transparent ${SPIEGEL.auslauf}px)` })
      const tafel = document.createElement('div')
      Object.assign(tafel.style, { position: 'absolute', inset: '0', transformStyle: 'preserve-3d', transformOrigin: seite === 'links' ? '0% 50%' : '100% 50%', transform: `rotateY(${seite === 'links' ? TAFEL.neigung : -TAFEL.neigung}deg)` })
      buehne.appendChild(tafel); flaeche.appendChild(buehne)
      return tafel
    }
    const spiegelTafel = bauen(TAFEL.oben + TAFEL.hoehe + SPIEGEL.abstand, true), tafel = bauen(TAFEL.oben, false)
    for (const [id, fx, fy, b, h] of liste) {
      const lage = { position: 'absolute', left: (seite === 'links' ? fx : TAFEL.breite - fx - b) + 'px', top: fy + 'px', width: b + 'px', height: h + 'px' }
      const c = document.createElement('canvas'); c.width = b; c.height = h; Object.assign(c.style, lage); tafel.appendChild(c)
      const s = document.createElement('canvas'); s.width = Math.ceil(b / 4); s.height = Math.ceil(h / 4); Object.assign(s.style, lage); spiegelTafel.appendChild(s)
      felder[id] = { c, g: c.getContext('2d'), b, h, sg: s.getContext('2d'), sb: s.width, sh: s.height }
    }
  }
  const passen = () => { const f = (huelle.clientHeight || innerHeight) / 1080; flaeche.style.transform = `scale(${f}) translateX(${-versatz}px)` }
  passen(); addEventListener('resize', passen)
  return { felder, kennung: '' }
}

function feldZeichnen(f, id, daten, t) {
  const { g, b, h } = f
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
