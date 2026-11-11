// Regentropfen auf der Scheibe (Entwürfe 11.11.2026, Wunsch Auftraggeber: bei Regen Tropfen, die vorn über den Monitor
// laufen, als hingen sie an einer Glasscheibe; was dahinter liegt, wird im Tropfen unscharf). Daten: nur die Regenstärke,
// die die Szene schon aus der eigenen Wetterstation ableitet (s.wetter.sichtbar.regen) – kein Supabase.
// Aufbau wie der Frost: eine Ebene über allem; jeder Tropfen ist ein kleines Element mit backdrop-filter (verschwimmt das
// Dahinterliegende), Glanzlicht und Schatten. Bewegt wird nur über transform – das rechnet die Grafikkarte billig.
// Unten bleibt die Taskleiste frei (48 Bildpunkte): Tropfen verblassen vorher.
import { B, H } from './szene.js'

const UNTEN = H - 48
export const ENTWUERFE = {
  // A: wenige große Perlen, hängen lange, rutschen dann ruckweise und lassen kleine Tröpfchen zurück
  a: { name: 'Große Perlen', anzahl: 34, gr: [30, 64], haengen: [2, 9], tempo: [70, 170], spur: 0.5, rinnsal: false, schraeg: 0, blur: 7, beschlag: 0 },
  // B: beschlagene Scheibe – viele feine Perlen, die meisten bleiben stehen, ab und zu läuft einer los
  b: { name: 'Beschlagene Scheibe', anzahl: 26, gr: [18, 40], haengen: [4, 14], tempo: [60, 140], spur: 0.35, rinnsal: false, schraeg: 0, blur: 6, beschlag: 140 },
  // C: Rinnsale – laufende Tropfen ziehen eine nasse, unscharfe Bahn hinter sich her
  c: { name: 'Rinnsale', anzahl: 32, gr: [24, 48], haengen: [1, 5], tempo: [140, 320], spur: 0, rinnsal: true, schraeg: 0, blur: 7, beschlag: 0 },
  // D: Schräg im Wind – Tropfen werden seitlich getrieben, länglich, schneller
  d: { name: 'Schräg im Wind', anzahl: 40, gr: [18, 40], haengen: [0.3, 2.5], tempo: [220, 420], spur: 0.25, rinnsal: false, schraeg: 0.45, blur: 6, beschlag: 0 },
}

const zufall = (a, b) => a + Math.random() * (b - a)
function tropfenElement(blur) {
  const d = document.createElement('div')
  Object.assign(d.style, {
    position: 'absolute', left: '0', top: '0', willChange: 'transform, opacity', pointerEvents: 'none',
    // jede Perle etwas anders geformt (Wasser auf Glas ist nie ganz rund)
    borderRadius: `${46 + Math.random() * 8}% ${46 + Math.random() * 8}% ${44 + Math.random() * 8}% ${44 + Math.random() * 8}% / ${52 + Math.random() * 8}% ${52 + Math.random() * 8}% ${42 + Math.random() * 6}% ${42 + Math.random() * 6}%`,
    backdropFilter: `blur(${blur}px) brightness(1.18) contrast(1.08) saturate(1.2)`, webkitBackdropFilter: `blur(${blur}px) brightness(1.18) contrast(1.08) saturate(1.2)`,
    // Glanzlicht oben links (Fensterlicht), heller Saum unten (Lichtbrechung), dunkler Rand oben (Schatten der Linse)
    background: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.85) 0 4%, rgba(255,255,255,0) 11%), radial-gradient(ellipse 60% 30% at 50% 86%, rgba(220,250,255,0.32), rgba(255,255,255,0) 70%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 62%, rgba(0,10,15,0.28) 100%)',
    boxShadow: 'inset 0 3px 4px rgba(0,0,0,0.5), inset 0 -3px 5px rgba(210,245,255,0.35), 0 3px 5px rgba(0,0,0,0.3)',
  })
  return d
}

/** Ebene anlegen. huelle: Element über Szene und Fenstern; versatz 1920 = nur mittlerer Bildschirm */
export function erstelleScheibe(huelle, versatz = 0, art = 'a') {
  const e = ENTWUERFE[art] ?? ENTWUERFE.a
  const flaeche = document.createElement('div')
  Object.assign(flaeche.style, { position: 'absolute', left: '0', top: '0', width: B + 'px', height: H + 'px', transformOrigin: '0 0', pointerEvents: 'none', overflow: 'hidden' })
  Object.assign(huelle.style, { position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none' })
  huelle.appendChild(flaeche)
  const passen = () => { const f = (huelle.clientHeight || innerHeight) / H; flaeche.style.transform = `scale(${f}) translateX(${-versatz}px)` }
  passen(); addEventListener('resize', passen)
  const tropfen = [], spuren = [], perlen = []
  for (let i = 0; i < e.anzahl; i++) { const el = tropfenElement(e.blur); flaeche.appendChild(el); tropfen.push({ el, aktiv: false }) }
  // zurückgelassene Tröpfchen (feste Menge, reihum wiederverwendet)
  const spurZahl = Math.round(e.anzahl * e.spur * 4)
  for (let i = 0; i < spurZahl; i++) { const el = tropfenElement(Math.max(2, e.blur - 2)); el.style.opacity = '0'; flaeche.appendChild(el); spuren.push({ el, bis: 0, x: 0, y: 0, r: 0 }) }
  // Rinnsal: eine längliche, nasse Bahn je Tropfen
  if (e.rinnsal) for (const t of tropfen) {
    const el = document.createElement('div')
    Object.assign(el.style, { position: 'absolute', left: '0', top: '0', transformOrigin: '50% 100%', willChange: 'transform, opacity', borderRadius: '40%', pointerEvents: 'none',
      backdropFilter: 'blur(4px) brightness(1.14) saturate(1.15)', webkitBackdropFilter: 'blur(4px) brightness(1.14) saturate(1.15)', background: 'linear-gradient(to right, rgba(0,10,15,0.18), rgba(220,250,255,0) 30%, rgba(220,250,255,0) 65%, rgba(220,250,255,0.22)), linear-gradient(to bottom, rgba(220,250,255,0), rgba(220,250,255,0.12))', boxShadow: 'inset 1px 0 1px rgba(0,0,0,0.25), inset -1px 0 1px rgba(220,250,255,0.25)' })
    flaeche.insertBefore(el, flaeche.firstChild); t.bahn = el
  }
  // Beschlag: viele winzige, stehende Perlen (einmal verteilt, Sichtbarkeit folgt der Regenstärke)
  for (let i = 0; i < e.beschlag; i++) {
    const el = tropfenElement(1.5), r = zufall(3, 8)
    Object.assign(el.style, { width: r * 2 + 'px', height: r * 2 + 'px', opacity: '0', transform: `translate(${zufall(0, B)}px, ${zufall(0, UNTEN - 30)}px)` })
    flaeche.appendChild(el); perlen.push({ el, schwelle: Math.random() })
  }
  return { flaeche, e, tropfen, spuren, spurNr: 0, perlen, staerke: -1, zeit: null, sichtbar: false }
}

function neu(t, e, jetzt, oben = false) {
  t.r = zufall(e.gr[0], e.gr[1]) / 2
  t.x = zufall(20, B - 20); t.y = oben ? zufall(-40, 200) : zufall(20, UNTEN * 0.75)
  t.v = 0; t.vmax = zufall(e.tempo[0], e.tempo[1]) * (0.7 + t.r / 25)
  t.bisHaengen = jetzt + zufall(e.haengen[0], e.haengen[1]); t.geboren = jetzt; t.aktiv = true; t.wackel = Math.random() * 10; t.lauf = 0; t.spurAb = 0
  t.el.style.width = t.r * 2 + 'px'; t.el.style.height = t.r * 2.15 + 'px'
}

/** je Bild: staerke 0..1 (Regen), t Sekunden, wind optional (m/s, für Entwurf D) */
export function scheibeZeichnen(sc, staerke, t, wind = 3) {
  const { e, tropfen, spuren, perlen } = sc
  const dt = sc.zeit == null ? 0 : Math.min(0.1, Math.max(0, t - sc.zeit)); sc.zeit = t
  const st = Math.round(Math.max(0, Math.min(1, staerke)) * 100) / 100
  if (st <= 0 && !sc.sichtbar) return
  sc.sichtbar = st > 0 || tropfen.some((x) => x.aktiv)
  const soll = Math.round(e.anzahl * st)
  let aktiv = tropfen.filter((x) => x.aktiv).length
  for (const tr of tropfen) {
    if (!tr.aktiv) {
      if (aktiv < soll && Math.random() < dt * 1.5) { neu(tr, e, t, Math.random() < 0.3); aktiv++ } else { tr.el.style.opacity = '0'; if (tr.bahn) tr.bahn.style.opacity = '0'; continue }
    }
    const ein = Math.min(1, (t - tr.geboren) / 0.35) // auftreffen: kurz wachsen
    if (t > tr.bisHaengen) { // rinnt: beschleunigt, wackelt seitlich, Wind schiebt (D)
      tr.v = Math.min(tr.vmax, tr.v + dt * tr.vmax * 2.2)
      tr.y += tr.v * dt
      tr.x += (Math.sin(t * 3 + tr.wackel) * 6 + e.schraeg * (40 + wind * 25)) * dt * (tr.v / tr.vmax)
      tr.lauf += tr.v * dt
      // ab und zu wieder hängen bleiben (Stopp-und-Los wie echte Tropfen)
      if (!e.rinnsal && Math.random() < dt * 0.25) { tr.bisHaengen = t + zufall(0.3, 2); tr.v = 0 }
      // kleine Tröpfchen zurücklassen
      if (spuren.length && tr.lauf - tr.spurAb > zufall(35, 90)) {
        tr.spurAb = tr.lauf; tr.r *= 0.985
        const s = spuren[sc.spurNr++ % spuren.length]; s.r = tr.r * zufall(0.25, 0.45); s.x = tr.x + zufall(-2, 2); s.y = tr.y - tr.r; s.bis = t + zufall(3, 7)
        s.el.style.width = s.r * 2 + 'px'; s.el.style.height = s.r * 2.1 + 'px'; s.el.style.transform = `translate(${s.x - s.r}px, ${s.y - s.r}px)`
      }
    }
    const streck = e.schraeg ? 1 + tr.v / tr.vmax * 0.6 : 1 + tr.v / tr.vmax * 0.25 // schnell = länglich
    const winkel = e.schraeg ? -Math.atan2(e.schraeg * (40 + wind * 25), Math.max(1, tr.v)) * (tr.v / tr.vmax) : 0
    const ausblenden = Math.max(0, Math.min(1, (UNTEN - 10 - tr.y) / 60))
    tr.el.style.transform = `translate(${tr.x - tr.r}px, ${tr.y - tr.r}px) rotate(${winkel}rad) scale(${ein}, ${ein * streck})`
    tr.el.style.opacity = String(ausblenden)
    if (tr.bahn) {
      const lang = Math.min(tr.lauf, 420)
      tr.bahn.style.width = tr.r * 1.1 + 'px'; tr.bahn.style.height = Math.max(1, lang) + 'px'
      tr.bahn.style.transform = `translate(${tr.x - tr.r * 0.55}px, ${tr.y - lang}px)`
      tr.bahn.style.opacity = String(ausblenden * Math.min(1, lang / 40))
    }
    if (tr.y > UNTEN || tr.x < -40 || tr.x > B + 40) tr.aktiv = false
  }
  for (const s of spuren) { const rest = s.bis - t; s.el.style.opacity = rest > 0 ? String(Math.min(1, rest / 1.5) * Math.max(0, Math.min(1, (UNTEN - 10 - s.y) / 60))) : '0' }
  if (perlen.length && Math.abs(st - sc.staerke) > 0.01) for (const p of perlen) p.el.style.opacity = p.schwelle < st ? '0.85' : '0'
  sc.staerke = st
}
