// Wetter in der Szene (05.11.2026, Wunsch Auftraggeber): regnet es draußen, regnet es im Bild; Schnee, Nebel, Frost an den
// Bildschirmrändern. Alles hinter Reaktor und Fenstern – die bleiben immer klar. Quelle heute Open-Meteo (Wettercode nach
// WMO, über L.O.K.I.), später die eigene Wetterstation des Auftraggebers (Ecowitt) – dann nur `wetterArt` anpassen.
// Dazu ziehen Nebelschwaden ganz langsam durch Berge und Wälder (immer, unabhängig vom Wetter).
const B = 5760, H = 1080, HORIZONT = 842

/** Wettercode (WMO, Open-Meteo-Doku) und Temperatur → { art: 'regen'|'schnee'|'nebel'|null, staerke 0..1, frost } */
export function wetterArt(w) {
  if (!w) return { art: null, staerke: 0, frost: false }
  const c = Number(w.code), frost = Number.isFinite(w.grad) && w.grad <= 0
  const art = [45, 48].includes(c) ? 'nebel'
    : (c >= 71 && c <= 77) || c === 85 || c === 86 ? 'schnee'
      : (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95 ? 'regen' : null
  const staerke = { 51: 0.25, 53: 0.4, 55: 0.6, 56: 0.4, 57: 0.6, 61: 0.4, 63: 0.65, 65: 1, 66: 0.5, 67: 0.9, 71: 0.35, 73: 0.6, 75: 1, 77: 0.3, 80: 0.5, 81: 0.75, 82: 1, 85: 0.5, 86: 1, 95: 0.9, 96: 1, 99: 1, 45: 0.7, 48: 0.9 }[c] ?? 0
  const st = w.station
  if (!st) return { art, staerke, frost }
  // eigene Wetterstation hat Vorrang (05.11.2026): Niederschlag nur, wenn sie ihn misst; bei ≤ 1 °C als Schnee;
  // Nebel aus der Vorhersage oder bei fast gesättigter Luft und Windstille; Frost nach der gemessenen Temperatur
  const rate = Number(st.regenRate) || 0, grad = Number.isFinite(st.grad) ? st.grad : w.grad
  if (rate > 0) return { art: grad <= 1 ? 'schnee' : 'regen', staerke: Math.min(1, 0.25 + rate / 8), frost: grad <= 0 }
  const nebel = art === 'nebel' || ((Number(st.feuchte) || 0) >= 97 && (Number(st.wind) || 0) < 3)
  return { art: nebel ? 'nebel' : null, staerke: nebel ? Math.max(staerke, 0.5) : 0, frost: Number.isFinite(grad) && grad <= 0 }
}

function leinwand(b, h) { const c = document.createElement('canvas'); c.width = b; c.height = h; return c }
function zufallsfolge(s) { return () => { s = (s * 16807) % 2147483647; return s / 2147483647 } }

export function erstelleWetter() {
  const z = zufallsfolge(23)
  return {
    tropfen: Array.from({ length: 900 }, () => ({ x: z() * B, y: z() * H, v: 0.7 + z() * 0.6, l: 0.6 + z() * 0.8 })),
    flocken: Array.from({ length: 700 }, () => ({ x: z() * B, y: z() * H, v: 0.5 + z() * 0.8, r: 1.2 + z() * 2.4, p: z() * 6.28 })),
    sichtbar: { regen: 0, schnee: 0, nebel: 0, frost: 0 }, letzt: null,
  }
}

/** weiches Überblenden beim Wetterwechsel (ca. 4 s) */
function nachfuehren(st, w, t) {
  const dt = Math.min(0.1, Math.max(0, t - (st.letzt ?? t))); st.letzt = t
  const ziel = { regen: w.art === 'regen' ? w.staerke : 0, schnee: w.art === 'schnee' ? w.staerke : 0, nebel: w.art === 'nebel' ? w.staerke : 0, frost: w.frost ? 1 : 0 }
  for (const k of Object.keys(ziel)) st.sichtbar[k] += Math.sign(ziel[k] - st.sichtbar[k]) * Math.min(Math.abs(ziel[k] - st.sichtbar[k]), dt / 4)
}

/** Regen, Schnee, Nebel – hinter Reaktor und Fenstern zeichnen */
export function zeichneWetterHinten(g, st, w, t) {
  nachfuehren(st, w, t)
  const { regen, schnee, nebel } = st.sichtbar
  if (regen > 0.01) {
    const n = Math.round(st.tropfen.length * regen), fall = 1600
    g.save(); g.strokeStyle = 'rgba(200,232,245,0.5)'; g.lineWidth = 1.5; g.beginPath()
    for (let i = 0; i < n; i++) {
      const d = st.tropfen[i], y = (d.y + t * fall * d.v) % (H + 80) - 40, x = (d.x + y * 0.12) % B // leicht schräg
      g.moveTo(x, y); g.lineTo(x + 3.5 * d.l, y + 28 * d.l)
    }
    g.globalAlpha = Math.min(1, regen * 1.3); g.stroke(); g.restore()
  }
  if (schnee > 0.01) {
    const n = Math.round(st.flocken.length * schnee)
    g.save(); g.fillStyle = 'rgba(245,252,255,0.95)'; g.globalAlpha = Math.min(1, schnee * 1.4); g.beginPath()
    for (let i = 0; i < n; i++) {
      const f = st.flocken[i], y = (f.y + t * 60 * f.v) % (H + 20) - 10, x = (f.x + Math.sin(t * 0.8 + f.p) * 18 + t * 8) % B
      g.moveTo(x + f.r, y); g.arc(x, y, f.r, 0, Math.PI * 2)
    }
    g.fill(); g.restore()
  }
  if (nebel > 0.01) { // dichter Nebel: heller Schleier über Landschaft und See, nach oben auslaufend
    const v = g.createLinearGradient(0, 350, 0, H)
    v.addColorStop(0, 'rgba(150,190,200,0)'); v.addColorStop(0.45, `rgba(150,190,200,${0.35 * nebel})`); v.addColorStop(1, `rgba(150,190,200,${0.5 * nebel})`)
    g.save(); g.fillStyle = v; g.fillRect(0, 350, B, H - 350); g.restore()
  }
}


/** Nebelschwaden in Bergen und Wäldern (immer, sehr langsam) – nebelTextur: waagerecht wiederholbare Wolkenschicht */
export function bergnebel(g, nebelTextur, t, faktor = 1) {
  if (!nebelTextur || faktor <= 0.002) return
  g.save(); g.globalCompositeOperation = 'screen'
  for (const [y, h, tempo, deck] of [[640, 170, 6, 0.35], [700, 150, -4, 0.3], [600, 120, 3, 0.22]]) {
    g.globalAlpha = deck * faktor
    const b = nebelTextur.width * 1.4, start = -(((t * tempo) % b) + b) % b
    for (let x = start; x < B; x += b) g.drawImage(nebelTextur, x, y, b, h)
  }
  g.restore()
}
export { HORIZONT }
