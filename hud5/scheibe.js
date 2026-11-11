// Regentropfen außen an der Scheibe (zweite Fassung 11.11.2026). Korrektur Auftraggeber: Er steht INNEN und schaut hinaus,
// die Tropfen hängen außen am Glas – die erste Fassung sah aus wie von draußen auf eine beregnete Scheibe; die
// zurückbleibenden Perlen wirkten unecht. Daten: nur die Regenstärke aus der eigenen Wetterstation (kein Supabase).
//
// Vorbilder (Recherche 11.11.2026): Ein Tropfen ist eine kleine Linse – er zeigt einen weiten Ausschnitt der Landschaft
// auf dem Kopf, ist heller als das Glas daneben und hat einen dunklen Rand; kein Schatten zum Betrachter hin. Tropfen
// hängen, wachsen, bis sie schwer genug sind, rutschen dann ruckweise und leicht schlängelnd, schlucken was im Weg liegt
// und lassen eine schmale nasse Spur mit sehr feinen, unregelmäßigen Tröpfchen zurück; den feinen Sprühnebel auf der
// Scheibe wischen sie dabei weg.
//
// Aufbau: (1) Sprühnebel = eine durchsichtige Leinwand mit winzigen Tröpfchen, in die laufende Tropfen ihre Bahn wischen.
// (2) Jeder größere Tropfen = Element mit backdrop-filter (Fenster und Szene dahinter verschwimmen) und einer kleinen
// Leinwand, die den Szenen-Ausschnitt gespiegelt (auf dem Kopf) zeigt. (3) Nasse Spuren = schmale, unscharfe Streifen,
// die langsam trocknen. Bewegt wird über transform. Unten bleibt die Taskleiste frei.
import { B, H } from './szene.js'

const UNTEN = H - 48
const NEBEL_S = 1 // Sprühnebel in voller Auflösung: halb aufgelöst wirkten die Tröpfchen grau und verwaschen wie Schnee
const zufall = (a, b) => a + Math.random() * (b - a)
export const ENTWUERFE = { a: { name: 'Tropfen außen an der Scheibe' } }

/** kleine Vorlagen für Nebel-Tröpfchen: dunkler Rand, heller Kern – wie winzige Linsen */
function nebelVorlagen() {
  return [0.9, 1.2, 1.5, 1.9, 2.4].map((r) => {
    const c = document.createElement('canvas'), s = Math.ceil(r * 2 + 2); c.width = c.height = s
    const g = c.getContext('2d'), m = s / 2, v = g.createRadialGradient(m - r * 0.15, m - r * 0.2, 0, m, m, r)
    // fast durchsichtig: winziger heller Lichtpunkt, feiner dunkler Rand – aus der Nähe wie Struktur auf dem Glas, nicht wie Flocken
    v.addColorStop(0, 'rgba(235,252,255,0.22)'); v.addColorStop(0.3, 'rgba(200,235,245,0.04)'); v.addColorStop(0.72, 'rgba(0,8,12,0.10)'); v.addColorStop(0.9, 'rgba(0,8,12,0.26)'); v.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = v; g.beginPath(); g.ellipse(m, m, r, r * zufall(0.85, 1.05), 0, 0, Math.PI * 2); g.fill()
    return { c, r }
  })
}

function tropfenElement() {
  const d = document.createElement('div')
  Object.assign(d.style, {
    position: 'absolute', left: '0', top: '0', willChange: 'transform, opacity', pointerEvents: 'none', overflow: 'hidden', opacity: '0',
    backdropFilter: 'blur(7px) brightness(1.28) saturate(1.1)', webkitBackdropFilter: 'blur(7px) brightness(1.28) saturate(1.1)',
  })
  const linse = document.createElement('canvas') // Landschaft auf dem Kopf
  Object.assign(linse.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', opacity: '0.7', mixBlendMode: 'screen' })
  const rand = document.createElement('div') // dunkler Brechungsrand, heller Lichtsaum unten innen – kein Schatten nach außen
  Object.assign(rand.style, { position: 'absolute', inset: '0', borderRadius: 'inherit',
    background: 'radial-gradient(ellipse 50% 22% at 50% 80%, rgba(225,250,255,0.28), rgba(225,250,255,0) 75%), radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 0 56%, rgba(0,12,16,0.22) 74%, rgba(0,6,9,0.62) 93%, rgba(0,0,0,0.35) 100%)',
    boxShadow: 'inset 0 0 0 0.6px rgba(0,0,0,0.35)' })
  d.appendChild(linse); d.appendChild(rand)
  return { el: d, linse, lg: linse.getContext('2d') }
}

/** Ebene anlegen. huelle: Element über Szene und Fenstern; versatz 1920 = nur mittlerer Bildschirm; quelle: Szenen-Leinwand */
export function erstelleScheibe(huelle, versatz = 0, art = 'a', quelle = null) {
  void art
  const flaeche = document.createElement('div')
  Object.assign(flaeche.style, { position: 'absolute', left: '0', top: '0', width: B + 'px', height: H + 'px', transformOrigin: '0 0', pointerEvents: 'none', overflow: 'hidden' })
  Object.assign(huelle.style, { position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none' })
  huelle.appendChild(flaeche)
  const passen = () => { const f = (huelle.clientHeight || innerHeight) / H; flaeche.style.transform = `scale(${f}) translateX(${-versatz}px)` }
  passen(); addEventListener('resize', passen)
  // Sprühnebel (nur der sichtbare Bereich: bei einem Bildschirm nur die Mitte)
  const nx = versatz, nb = versatz ? 1920 : B
  const nebel = document.createElement('canvas'); nebel.width = Math.round(nb * NEBEL_S); nebel.height = Math.round(UNTEN * NEBEL_S)
  Object.assign(nebel.style, { position: 'absolute', left: nx + 'px', top: '0', width: nb + 'px', height: UNTEN + 'px', opacity: '0' })
  flaeche.appendChild(nebel)
  const spuren = []
  for (let i = 0; i < 70; i++) {
    const el = document.createElement('div')
    Object.assign(el.style, { position: 'absolute', left: '0', top: '0', opacity: '0', willChange: 'opacity', pointerEvents: 'none', borderRadius: '45%',
      backdropFilter: 'blur(2.5px) brightness(1.12)', webkitBackdropFilter: 'blur(2.5px) brightness(1.12)',
      background: 'linear-gradient(to right, rgba(0,10,14,0.22), rgba(0,0,0,0) 35%, rgba(0,0,0,0) 70%, rgba(225,250,255,0.16))' })
    flaeche.appendChild(el); spuren.push({ el, bis: 0, dauer: 1 })
  }
  const tropfen = []
  for (let i = 0; i < 60; i++) { const t = tropfenElement(); flaeche.appendChild(t.el); tropfen.push({ ...t, aktiv: false }) }
  return { flaeche, nebel, ng: nebel.getContext('2d'), nx, nb, vorlagen: nebelVorlagen(), nebelZahl: 0, spuren, spurNr: 0, tropfen, quelle, versatz, zeit: null, sichtbar: false, bild: 0 }
}

/** neuer Tropfen: gleich in fertiger Größe, blendet weich ein (Rückmeldung 11.11.2026: stückweises Wachsen sah ruckelig aus).
 *  Größe, Form und Linsen-Leinwand werden nur hier festgelegt – danach ändert sich nur noch transform/opacity (kein Flackern). */
function landen(t, sc, jetzt) {
  t.x = zufall(sc.nx + 12, sc.nx + sc.nb - 12); t.y = zufall(10, UNTEN * 0.85)
  t.r = t.r0 = zufall(7, 22); t.haengtBis = jetzt + zufall(2, 12) // große Tropfen laufen nach einer Weile los, kleine bleiben hängen
  t.v = 0; t.laeuft = false; t.trocknet = 0; t.haengtPause = 0; t.geboren = jetzt; t.aktiv = true; t.dx = 0; t.ziehX = 0; t.lauf = 0; t.spurAb = 0; t.tropfAb = 0
  const f = [zufall(44, 54), zufall(44, 54), zufall(46, 54), zufall(46, 54), zufall(50, 58), zufall(50, 58), zufall(42, 50), zufall(42, 50)]
  Object.assign(t.el.style, { width: t.r0 * 2 + 'px', height: t.r0 * 2 + 'px', transformOrigin: '50% 62%', borderRadius: `${f[0]}% ${f[1]}% ${f[2]}% ${f[3]}% / ${f[4]}% ${f[5]}% ${f[6]}% ${f[7]}%` })
  const lg = Math.max(8, Math.round(t.r0 * 4)); if (t.linse.width !== lg) { t.linse.width = lg; t.linse.height = lg }
}

function wischen(sc, x0, y0, x1, y1, r) {
  const g = sc.ng, k = NEBEL_S
  g.save(); g.globalCompositeOperation = 'destination-out'; g.lineCap = 'round'; g.lineWidth = r * 2.1 * k
  g.beginPath(); g.moveTo((x0 - sc.nx) * k, y0 * k); g.lineTo((x1 - sc.nx) * k, y1 * k); g.stroke(); g.restore()
}
function nebelTropfen(sc, x, y, klein = false) {
  const v = sc.vorlagen[klein ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * sc.vorlagen.length)], k = NEBEL_S
  sc.ng.drawImage(v.c, (x - sc.nx) * k - v.c.width / 2, y * k - v.c.height / 2)
}

/** je Bild: staerke 0..1 (Regen der Station), t Sekunden */
export function scheibeZeichnen(sc, staerke, t) {
  const dt = sc.zeit == null ? 0 : Math.min(0.1, Math.max(0, t - sc.zeit)); sc.zeit = t
  const st = Math.max(0, Math.min(1, staerke))
  if (st <= 0 && !sc.sichtbar) return
  sc.bild++
  // Sprühnebel: bei Regen kommen ständig feine Tröpfchen dazu, ohne Regen trocknet die Scheibe langsam ab
  const nebelSoll = st * 5200
  if (st > 0 && sc.nebelZahl < nebelSoll) { const n = Math.ceil(dt * (120 + 600 * st)); for (let i = 0; i < n; i++) nebelTropfen(sc, zufall(sc.nx, sc.nx + sc.nb), zufall(0, UNTEN)); sc.nebelZahl += n }
  if (st > 0 && Math.random() < dt * 0.5) sc.nebelZahl *= 0.97 // nachfüllen, wo gewischt wurde
  const no = Number(sc.nebel.style.opacity) || 0, nziel = st > 0 ? 1 : 0
  if (no !== nziel) { const neu = Math.max(0, Math.min(1, no + Math.sign(nziel - no) * dt / (nziel ? 3 : 40))); sc.nebel.style.opacity = String(neu); if (neu === 0) { sc.ng.clearRect(0, 0, sc.nebel.width, sc.nebel.height); sc.nebelZahl = 0 } }
  const soll = Math.round(sc.tropfen.length * st)
  let aktiv = 0
  for (const tr of sc.tropfen) if (tr.aktiv) aktiv++
  for (const tr of sc.tropfen) {
    if (!tr.aktiv) { if (aktiv < soll && Math.random() < dt * (0.4 + st)) { landen(tr, sc, t); aktiv++ } else continue }
    if (!tr.laeuft) {
      if (st <= 0 && !tr.trocknet) tr.trocknet = t // Regen vorbei: hängende Tropfen trocknen langsam weg (blenden aus)
      if (tr.r > 14 && t > tr.haengtBis) { tr.laeuft = true; tr.v = 0 }
    } else {
      // rutscht: schwerer = schneller; bleibt an „Unebenheiten“ kurz hängen (ruckweise) und schlängelt leicht
      const vmax = 25 + (tr.r - 12) * 16
      if (Math.random() < dt * 0.5) tr.haengtPause = t + zufall(0.15, 1.2)
      tr.v = t < tr.haengtPause ? 0 : Math.min(vmax, tr.v + dt * vmax * 1.6)
      if (Math.random() < dt * 1.2) tr.ziehX = zufall(-1, 1) * tr.r * 0.5
      const x0 = tr.x, y0 = tr.y
      tr.dx += (tr.ziehX - tr.dx) * Math.min(1, dt * 3)
      tr.y += tr.v * dt; tr.x += (tr.dx * tr.v / Math.max(1, vmax)) * dt * 2
      tr.lauf += Math.hypot(tr.x - x0, tr.y - y0)
      if (tr.y !== y0) wischen(sc, x0, y0, tr.x, tr.y, tr.r)
      // zurück bleiben: sehr feine, unregelmäßige Tröpfchen und eine schmale nasse Spur
      if (tr.lauf - tr.tropfAb > zufall(10, 34)) { tr.tropfAb = tr.lauf; nebelTropfen(sc, tr.x + zufall(-0.4, 0.4) * tr.r, tr.y - tr.r * zufall(0.6, 1.1), true); tr.r = Math.max(tr.r0 * 0.75, tr.r - 0.03) }
      if (tr.lauf - tr.spurAb > 26) {
        tr.spurAb = tr.lauf
        const s = sc.spuren[sc.spurNr++ % sc.spuren.length], b = tr.r * zufall(0.28, 0.42)
        s.dauer = zufall(5, 12); s.bis = t + s.dauer
        Object.assign(s.el.style, { width: b * 2 + 'px', height: '30px', transform: `translate(${tr.x - b}px, ${tr.y - tr.r - 30}px)` })
      }
      // schluckt andere Tropfen, auf die er trifft
      for (const o of sc.tropfen) if (o !== tr && o.aktiv && !o.laeuft && Math.hypot(o.x - tr.x, o.y - tr.y) < tr.r + o.r * 0.7) { tr.r = Math.min(26, Math.hypot(tr.r, o.r)); o.aktiv = false; o.el.style.opacity = '0' }
    }
    const trocken = tr.trocknet ? Math.max(0, 1 - (t - tr.trocknet) / 25) : 1
    if (trocken <= 0 || tr.y > UNTEN + tr.r) { tr.aktiv = false; tr.el.style.opacity = '0'; continue }
    // Form nur über transform: hängend rund, laufend etwas länglich (unten schwer); geschluckte Tropfen machen ihn größer
    const lauf = tr.laeuft ? Math.min(1, tr.v / 120) : 0, k = tr.r / tr.r0
    tr.el.style.transform = `translate(${tr.x - tr.r0}px, ${tr.y - tr.r0 * 1.24}px) scale(${k * (1 - lauf * 0.12)}, ${k * (0.96 + lauf * 0.5)})`
    const ein = Math.min(1, (t - tr.geboren) / 0.9) // weich einblenden
    tr.el.style.opacity = String(ein * ein * trocken * Math.max(0, Math.min(1, (UNTEN - 6 - tr.y) / 40)))
    // Linse: weiter Ausschnitt der Szene, auf dem Kopf (jedes zweite Bild genügt)
    if (sc.quelle && (sc.bild + Math.floor(tr.x)) % 2 === 0) {
      const lb = tr.linse.width, lh = tr.linse.height
      const w = tr.r * 14, sx = tr.x - sc.versatz - w / 2, sy = tr.y - w * 0.6
      tr.lg.setTransform(-1, 0, 0, -1, lb, lh)
      try { tr.lg.drawImage(sc.quelle, sx, sy, w, w * 1.2, 0, 0, lb, lh) } catch { /* Rand der Leinwand */ }
    }
  }
  for (const s of sc.spuren) { const rest = s.bis - t; s.el.style.opacity = rest > 0 ? String(Math.min(0.9, rest / s.dauer)) : '0' }
  sc.sichtbar = st > 0 || sc.tropfen.some((x) => x.aktiv) || (Number(sc.nebel.style.opacity) || 0) > 0
}
