// Fenster-Tafeln über der Szene (05.11.2026, Wahl Auftraggeber: Rahmen „Glas & Goldkante“). Rahmen und Inhalt liegen je
// Fenster in EINER Leinwand; alle Fenster einer Seite sitzen auf einer Tafel, die der Browser mit echter Perspektive
// kippt (CSS 3D, rotateY) – dadurch passen Rahmen und Inhalt immer exakt zueinander. Links kippt die Tafel nach
// rechts hinten, rechts gespiegelt nach links hinten (wie im Grafikpaket des Auftraggebers).
import { RAHMEN_STILE } from './rahmen.js'
import { ZEICHNER, KNOPF_RADIUS, liedSichtbar, knopfBlitz, knopfListe, lautFlaeche, lautAusPunkt, lautGebremst } from './inhalte.js'

const STIL = RAHMEN_STILE[1]
const TAFEL = { links: 490, oben: 165, breite: 1240, hoehe: 760, neigung: 24, tiefe: 1900, skala: 1.1 } // Wahl Auftraggeber 05.11.2026: 10 % größer und weiter zur Bildschirmmitte (links war 450)
// Felder auf der flachen Tafel (x, y, Breite, Höhe) – links Werkstatt, rechts Haus (gleiche Anordnung, gespiegelt)
// 05.11.2026 (Wunsch Auftraggeber): Umsatz heute braucht wenig Platz, Verkäufe 14 Tage dafür breiter; Felder bewusst
// unterschiedlich groß statt alle gleich
// Umbau 08.11.2026 (Wahl Auftraggeber: links Entwurf 2 „Statistik-Säule“, nur Arbeit; Audio wandert nach rechts)
const LINKS = [['statHeute', 0, 0, 340, 170], ['statVerlauf', 0, 185, 340, 300], ['statKanaele', 0, 500, 340, 260],
  ['abarbeiten', 355, 0, 885, 380], ['nachproduzieren', 355, 395, 420, 365], ['bestellungen2', 790, 395, 450, 365]]
// rechts gespiegelt: Feld bei x 630 landet innen (links) – CAM 01 links, CAM 02 rechts (Rückmeldung 05.11.2026)
// Umbau 05.11.2026 (Wunsch Auftraggeber): schmaler Streifen für den L.O.K.I.-Systemstatus, unten innen Wetter, unten
// außen groß die PV-Anlage
// rechts (Wahl Auftraggeber 08.11.2026: S3): Kameras wie bisher, Audio mit den Status-Symbolen in der Kopfzeile, PV/Wetter etwas flacher
const RECHTS = [['kamera2', 0, 0, 610, 260], ['kamera1', 630, 0, 610, 260], ['tonSystemKopf', 0, 280, 1240, 140], ['energie', 0, 440, 800, 320], ['wetter', 820, 440, 420, 320]]
// Spiegelung im Wasser. abstand = Weg von der Tafel-Unterkante bis zur Wasserlinie (größer = Spiegelbild tiefer, Rückmeldung
// Auftraggeber 05.11.2026: sonst „schwebt“ es an der inneren Kante außerhalb vom Wasser); welle = waagerechtes Wabern in
// Viertel-Bildpunkten, läuft mit der Zeit wie die Wellen im See
// Probe-Aufteilungen (08.11.2026, Idee Auftraggeber: Audio nach rechts, links nur Arbeit) – nur für die Vorschau (?rechts=1|2)
export const PROBE_AUFTEILUNG = {
  // rechte Seite, Runde 08.11.2026 (Korrektur Auftraggeber): Kameras wie bisher (260), Statuszeile nur Symbole, Platz an PV/Wetter
  s1: { rechts: [['kamera2', 0, 0, 610, 260], ['kamera1', 630, 0, 610, 260], ['tonSystemOben', 0, 280, 1240, 160], ['energie', 0, 460, 800, 300], ['wetter', 820, 460, 420, 300]] },
  s2: { rechts: [['kamera2', 0, 0, 610, 260], ['kamera1', 630, 0, 610, 260], ['tonSystemUnten', 0, 280, 1240, 160], ['energie', 0, 460, 800, 300], ['wetter', 820, 460, 420, 300]] },
  s3: { rechts: [['kamera2', 0, 0, 610, 260], ['kamera1', 630, 0, 610, 260], ['tonSystemKopf', 0, 280, 1240, 140], ['energie', 0, 440, 800, 320], ['wetter', 820, 440, 420, 320]] },
  s4: { rechts: [['kamera2', 0, 0, 610, 260], ['kamera1', 630, 0, 610, 260], ['tonSystemKopf', 0, 280, 1240, 116], ['energie', 0, 416, 800, 344], ['wetter', 820, 416, 420, 344]] },
  1: { links: [['verkaeufe', 0, 0, 940, 130], ['umsatz', 960, 0, 280, 130], ['aufgaben', 0, 150, 700, 610], ['bestellungen', 720, 150, 520, 610]],
    rechts: [['kamera2', 0, 0, 610, 260], ['kamera1', 630, 0, 610, 260], ['system', 0, 280, 1240, 64], ['ton', 0, 364, 1240, 160], ['energie', 0, 544, 800, 216], ['wetter', 820, 544, 420, 216]] },
  2: { links: [['verkaeufe', 0, 0, 940, 130], ['umsatz', 960, 0, 280, 130], ['aufgaben', 0, 150, 700, 610], ['bestellungen', 720, 150, 520, 610]],
    rechts: [['kamera2', 0, 0, 610, 220], ['kamera1', 630, 0, 610, 220], ['system', 0, 240, 1240, 64], ['ton', 0, 324, 1240, 130], ['energie', 0, 474, 800, 286], ['wetter', 820, 474, 420, 286]] },
}
export const SPIEGEL = { abstand: 70, deckkraft: 0.45, unschaerfe: 1.5, auslauf: 150, welle: 1.4 }
// Inhalte in doppelter Auflösung zeichnen (Rückmeldung Auftraggeber 05.11.2026: leicht unscharf) – das schräge Kippen
// vergrößert die vordere Kante; mit mehr Bildpunkten bleiben Linien und Schrift scharf
const AUFLOESUNG = 2
const GROSS = { b: 1560, h: 878, dreh: 'perspective(2600px) rotateY(-5deg)' } // großes Kamerabild, leicht in der Schräge der Fenster
const LANGSAM = new Set(['abarbeiten', 'nachproduzieren', 'bestellungen2'])
const BEWEGT = new Set(['statHeute', 'statVerlauf', 'statKanaele', 'abarbeiten', 'nachproduzieren', 'bestellungen2', 'ton', 'tonSystemOben', 'tonSystemUnten', 'tonSystemKopf', 'kamera1', 'kamera2', 'energie', 'wetter']) // energie: laufende Lichtpunkte

/** Tafeln anlegen. huelle = Element über der Szenen-Leinwand (gleiche Größe); faktor = Bildschirm-Pixel je Szenen-Pixel.
 *  skala: Größe der Fenster (1 = bisher; Wunsch Auftraggeber 05.11.2026: größer, Wahl über vier Vorschauen) – die Tafel
 *  wächst zur Bildschirmmitte hin, der Abstand zum Runenbogen außen bleibt, die senkrechte Mitte bleibt */
export function erstelleTafeln(huelle, versatz = 0, { skala = TAFEL.skala, aufteilung = null } = {}) {
  const k = skala, br = TAFEL.breite * k, ho = TAFEL.hoehe * k, oben = TAFEL.oben + (TAFEL.hoehe - ho) / 2
  huelle.style.position = 'absolute'; huelle.style.inset = '0'; huelle.style.pointerEvents = 'none'; huelle.style.overflow = 'hidden'
  const flaeche = document.createElement('div') // 5760×1080-Fläche, auf die Fenstergröße skaliert
  Object.assign(flaeche.style, { position: 'absolute', left: '0', top: '0', width: '5760px', height: '1080px', transformOrigin: '0 0' })
  huelle.appendChild(flaeche)
  const felder = {}, buehnen = [] // buehnen: fürs Intro (Tafeln aufklappen/einblenden, tafelnStellen)
  for (const [seite, liste] of [['links', aufteilung?.links ?? LINKS], ['rechts', aufteilung?.rechts ?? RECHTS]]) {
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
      buehnen.push({ seite, spiegel, buehne, tafel, drehen, deckkraft: spiegel ? SPIEGEL.deckkraft : 1, felder: [] })
      return tafel
    }
    const spiegelTafel = bauen(true), tafel = bauen(false)
    for (const [id, fx, fy, b, h] of liste) {
      const lage = { position: 'absolute', left: (seite === 'links' ? fx : TAFEL.breite - fx - b) * k + 'px', top: fy * k + 'px', width: b * k + 'px', height: h * k + 'px' }
      const c = document.createElement('canvas'); c.width = Math.round(b * k * AUFLOESUNG); c.height = Math.round(h * k * AUFLOESUNG); Object.assign(c.style, lage); tafel.appendChild(c)
      const s = document.createElement('canvas'); s.width = Math.ceil(b / 4); s.height = Math.ceil(h / 4); Object.assign(s.style, lage); spiegelTafel.appendChild(s)
      const sauber = document.createElement('canvas'); sauber.width = s.width; sauber.height = s.height // unverzerrte Kopie, daraus wird je Bild gewellt
      buehnen.at(-1).felder.push(c); buehnen.at(-2).felder.push(s)
      felder[id] = { c, g: c.getContext('2d'), b, h, k: k * AUFLOESUNG, sg: s.getContext('2d'), sb: s.width, sh: s.height, sauber, sq: sauber.getContext('2d'), phase: fx * 0.013 + fy * 0.02 }
    }
  }
  // großes, schwebendes Kamerabild: rechter Bildschirm (bei nur einem Bildschirm mittig), ringsum Luft, 16:9 wie die Kamera
  const grossBild = document.createElement('canvas'); grossBild.width = GROSS.b; grossBild.height = GROSS.h
  Object.assign(grossBild.style, {
    position: 'absolute', left: (versatz ? 1920 + (1920 - GROSS.b) / 2 : 3840 + (1920 - GROSS.b) / 2) + 'px', top: (1080 - GROSS.h) / 2 + 'px', width: GROSS.b + 'px', height: GROSS.h + 'px',
    opacity: '0', transform: `${GROSS.dreh} scale(0.82)`, transformOrigin: '50% 50%', transition: 'opacity 0.45s ease, transform 0.6s cubic-bezier(.2,.9,.25,1.05)',
    borderRadius: '8px', boxShadow: '0 40px 110px 30px rgba(0,0,0,0.9), 0 0 0 2px rgba(120,235,255,0.75), 0 0 46px 4px rgba(95,246,255,0.35)', pointerEvents: 'none',
  })
  flaeche.appendChild(grossBild)
  const passen = () => { const f = (huelle.clientHeight || innerHeight) / 1080; flaeche.style.transform = `scale(${f}) translateX(${-versatz}px)` }
  passen(); addEventListener('resize', passen)
  return { felder, buehnen, kennung: '', grossBild, grossG: grossBild.getContext('2d'), grossKanal: null, grossZeigt: 0 }
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
  if ((daten.beispiel || daten.veraltet) && ['verkaeufe', 'umsatz', 'aufgaben', 'bestellungen', 'statHeute', 'statVerlauf', 'statKanaele', 'abarbeiten', 'nachproduzieren', 'bestellungen2'].includes(id)) {
    g.font = '600 12px Bahnschrift, "Segoe UI", sans-serif'; g.fillStyle = 'rgba(242,176,74,0.9)'; g.textAlign = 'right'
    g.fillText(daten.veraltet ? 'KEINE AKTUELLEN DATEN' : 'BEISPIEL', innen.b - 14, innen.h - 10)
  }
  g.restore()
  f.sq.clearRect(0, 0, f.sb, f.sh); f.sq.drawImage(f.c, 0, 0, f.sb, f.sh)
}

/** Spiegelbild wellen: Streifen für Streifen waagerecht versetzt; weiter weg von der Tafel (im gekippten Bild oben) stärker */
function spiegelWellen(f, t) {
  const { sg, sb, sh, sauber } = f, A = SPIEGEL.welle
  sg.clearRect(0, 0, sb, sh)
  for (let y = 0; y < sh; y += 2) {
    const weit = 1 - y / sh, dx = Math.sin(y * 0.55 - t * 2.1 + f.phase) * A * (0.35 + 0.65 * weit) + Math.sin(y * 0.21 + t * 1.3) * A * 0.4 * weit
    sg.drawImage(sauber, 0, y, sb, 2, dx, y, sb, 2)
  }
}

/** Klickflächen über den Medien-Knöpfen im Audiofeld (07.11.2026): liegen als Elemente auf der gekippten Tafel direkt
 *  über dem Feld – der Browser rechnet die Perspektive beim Treffer mit. beiKlick(art) mit art = zurueck | pause | vor */
export function medienKnoepfe(st, beiKlick) {
  const f = st.felder.ton ?? st.felder.tonSystemKopf
  if (!f) return
  const k = f.k / AUFLOESUNG, links = parseFloat(f.c.style.left), oben = parseFloat(f.c.style.top)
  st.knoepfe = knopfListe(f.b, !st.felder.ton).map(([art, x, y]) => {
    const d = document.createElement('div'), r = KNOPF_RADIUS + 4
    Object.assign(d.style, { position: 'absolute', left: links + (x - r) * k + 'px', top: oben + (y - r) * k + 'px', width: 2 * r * k + 'px', height: 2 * r * k + 'px', borderRadius: '50%', pointerEvents: 'auto', cursor: 'pointer', display: 'none' })
    d.addEventListener('click', (ev) => { ev.stopPropagation(); knopfBlitz.id = art; knopfBlitz.zeit = performance.now(); beiKlick(art) })
    f.c.parentElement.appendChild(d)
    return d
  })
}

/** Klickfläche über dem Lautstärke-Regler (09.11.2026): liegt wie die Medien-Knöpfe auf der gekippten Tafel, die Punkte
 *  rechnet der Browser in Feld-Einheiten zurück. Klick genügt; Ziehen und Mausrad wirken, falls Wallpaper Engine sie weitergibt.
 *  beiWert(n) mit n = 0..100, alt() = aktueller Stand */
export function lautRegelung(st, beiWert, alt) {
  const f = st.felder.tonSystemKopf
  if (!f) return null
  const k = f.k / AUFLOESUNG, r = lautFlaeche(f.h), d = document.createElement('div')
  Object.assign(d.style, { position: 'absolute', left: parseFloat(f.c.style.left) + r.x * k + 'px', top: parseFloat(f.c.style.top) + r.y * k + 'px', width: r.b * k + 'px', height: r.h * k + 'px', pointerEvents: 'auto', cursor: 'pointer', touchAction: 'none' })
  const melde = (ev, ziehen) => { const n = lautAusPunkt(r.x + ev.offsetX / k, alt(), ziehen); if (n != null) beiWert(lautGebremst(n, alt())) }
  let zieht = false
  d.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); if (ev.button !== 0) return; zieht = true; // nur die linke Taste (Prüf-Agent)
 try { d.setPointerCapture(ev.pointerId) } catch { /* nicht nötig */ } melde(ev, false) })
  d.addEventListener('pointermove', (ev) => { if (zieht && ev.buttons & 1) melde(ev, true) })
  for (const e of ['pointerup', 'pointercancel']) d.addEventListener(e, () => { zieht = false })
  d.addEventListener('click', (ev) => ev.stopPropagation())
  d.addEventListener('wheel', (ev) => { const a = alt(); if (a != null) beiWert(Math.max(0, Math.min(100, a + (ev.deltaY < 0 ? 5 : -5)))) }, { passive: true })
  f.c.parentElement.appendChild(d)
  return d
}

/** je Bild: ruhige Fenster nur bei neuen Daten, Tonwellen und Kameras immer */
export function zeichneTafeln(st, daten, t) {
  const kennung = JSON.stringify([daten.werkstatt, daten.wetter, daten.kamera?.name ?? null, daten.loki, daten.uhr, daten.beispiel, daten.veraltet])
  const alles = kennung !== st.kennung
  st.kennung = kennung
  const sekunde = Math.floor(Date.now() / 1000), neueSekunde = sekunde !== st.sekunde // Uhr mit Sekunden im System-Streifen
  st.sekunde = sekunde
  for (const [id, f] of Object.entries(st.felder)) {
    const faellig = !LANGSAM.has(id) || !(t - (f.zuletzt ?? -1) < 0.15) // Listen: höchstens alle 150 ms (Prüf-Agent 08.11.2026)
    if (alles || (BEWEGT.has(id) && faellig) || (neueSekunde && id === 'system')) { feldZeichnen(f, id, daten, t); f.zuletzt = t }
    spiegelWellen(f, t)
  }
  if (st.knoepfe) { const an = liedSichtbar(daten.medien) ? 'block' : 'none'; for (const d of st.knoepfe) if (d.style.display !== an) d.style.display = an }
  if (st.grossBild && (st.grossKanal != null || st.grossBild.style.opacity !== '0')) ZEICHNER[st.grossZeigt === 1 ? 'kamera2' : 'kamera1'](st.grossG, GROSS.b, GROSS.h, daten, t)
}

/** Intro: Tafeln einer Seite erscheinen lassen. p = { links, rechts } je 0..1 (1 = Endstand wie im Wallpaper).
 *  art: 'klappen' (klappt an der Außenkante aus der Kante auf), 'gleiten' (gleitet von außen herein), 'holo' (flackert
 *  Fenster für Fenster an), 'flach' (liegt erst flach, kippt dann in die Schräge). Danach steht alles exakt wie sonst. */
export function tafelnStellen(st, art, p) {
  const ein = (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3)
  for (const b of st.buehnen) {
    const v = Math.max(0, Math.min(1, p[b.seite] ?? 1)), e = ein(v), vz = b.seite === 'links' ? 1 : -1
    const n = b.felder.length
    let dreh = b.drehen, verschub = '', deck = 1
    if (art === 'klappen') { dreh = `rotateY(${vz * (24 + (88 - 24) * (1 - e))}deg)`; deck = Math.min(1, v * 4) }
    else if (art === 'gleiten') { verschub = `translateX(${-vz * 900 * (1 - e)}px) `; deck = e }
    else if (art === 'flach') { dreh = `rotateY(${vz * 24 * e}deg) scale(${0.92 + 0.08 * e})`; deck = Math.min(1, v * 2.5) }
    else if (art === 'holo' || art.startsWith('feld-')) deck = v > 0 ? 1 : 0
    b.tafel.style.transform = verschub + dreh + (b.spiegel ? ' scaleY(-1)' : '')
    b.buehne.style.opacity = String(b.deckkraft * deck)
    b.felder.forEach((c, i) => { // Fenster nacheinander (von oben nach unten) – je nach Art einzeln mit eigenem Effekt
      const a = Math.max(0, Math.min(1, (v * (n + 2) - i) / 2)), ea = ein(a), fertig = v >= 1 || a >= 1
      const flimmer = art === 'holo' && a > 0 && a < 1 ? (Math.sin(v * 900 + i * 7) > 0.1 ? 1 : 0.15) : 1
      let tr = '', fi = '', op = a * flimmer
      if (!fertig && art === 'feld-klappen') { tr = `scaleY(${Math.max(0.004, ea)})`; fi = `brightness(${1 + 2.5 * (1 - ea)})`; op = a > 0 ? 1 : 0 } // klappt aus einer Lichtlinie auf
      else if (!fertig && art === 'feld-fliegen') { tr = `translate3d(${-vz * 700 * (1 - ea)}px, ${(i % 2 ? 1 : -1) * 70 * (1 - ea)}px, ${650 * (1 - ea)}px) rotateY(${-vz * 35 * (1 - ea)}deg)`; op = Math.min(1, a * 2) } // fliegt von vorn außen herein
      else if (!fertig && art === 'feld-schlag') { tr = `scale(${1 + 0.4 * (1 - ea)})`; fi = `brightness(${1 + 3 * (1 - ea)})`; op = Math.min(1, a * 3) } // schlägt mit Lichtblitz ein
      c.style.transform = tr; c.style.filter = fi
      c.style.opacity = String(v >= 1 ? 1 : op)
    })
  }
}

/** Kamerabild groß (Person erkannt oder auf Zuruf; Rückmeldung 06.11.2026: über die Rahmen hinaus, schwebend mit Schatten,
 *  ringsum bleibt der Hintergrund sichtbar): eigene Leinwand über den Fenstern. kanal 0/1 oder null = zurück. */
export function kameraGross(st, kanal) {
  const neu = kanal ?? null
  if (st.grossKanal === neu) return
  if (neu != null) st.grossZeigt = neu // beim Ausblenden bleibt das letzte Bild stehen
  st.grossKanal = neu
  const c = st.grossBild; if (!c) return
  c.style.opacity = neu == null ? '0' : '1'
  c.style.transform = `${GROSS.dreh} scale(${neu == null ? 0.82 : 1})`
}

