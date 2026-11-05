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

/** Frost-Rand: verästelte Eiskristalle, die von den Rändern nach innen wachsen (einmal vorgezeichnet) */
function frostBild() {
  const c = leinwand(B, H), g = c.getContext('2d'), z = zufallsfolge(11)
  const ast = (x, y, w, l, dicke, tiefe) => {
    const x2 = x + Math.cos(w) * l, y2 = y + Math.sin(w) * l
    g.lineWidth = dicke; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke()
    if (tiefe <= 0 || l < 4) return
    for (let i = 1; i <= 3; i++) { // seitliche Zweige im 60°-Winkel wie bei Eiskristallen
      const f = i / 4, sx = x + (x2 - x) * f, sy = y + (y2 - y) * f
      for (const s of [-1, 1]) if (z() < 0.75) ast(sx, sy, w + s * Math.PI / 3, l * (0.45 - f * 0.25), dicke * 0.6, tiefe - 1)
    }
    ast(x2, y2, w + (z() - 0.5) * 0.5, l * 0.55, dicke * 0.75, tiefe - 1)
  }
  g.strokeStyle = 'rgba(215,245,255,0.38)'; g.shadowColor = 'rgba(180,235,255,0.8)'; g.shadowBlur = 4; g.lineCap = 'round'
  // Ränder: links/rechts Bildschirm rundum, Mitte nur oben und unten (Wunsch Auftraggeber)
  const kanten = [
    [0, 1920, 'oben'], [0, 1920, 'unten'], [3840, 5760, 'oben'], [3840, 5760, 'unten'], [1920, 3840, 'oben'], [1920, 3840, 'unten'],
    [0, 0, 'links'], [5760, 5760, 'rechts'], [1920, 1920, 'innenL'], [3840, 3840, 'innenR'],
  ]
  for (const [x0, x1, art] of kanten) {
    const senkrecht = !['oben', 'unten'].includes(art), anzahl = senkrecht ? 26 : 34
    for (let i = 0; i < anzahl; i++) {
      const f = (i + z()) / anzahl, l = 18 + z() * 40
      if (art === 'oben') ast(x0 + (x1 - x0) * f, 0, Math.PI / 2 + (z() - 0.5) * 0.9, l, 1.4, 3)
      if (art === 'unten') ast(x0 + (x1 - x0) * f, H, -Math.PI / 2 + (z() - 0.5) * 0.9, l, 1.4, 3)
      if (art === 'links' || art === 'innenR') ast(x0, H * f, (z() - 0.5) * 0.9, l, 1.4, 3) // innenR: linke Kante des rechten Bildschirms
      if (art === 'rechts' || art === 'innenL') ast(x0, H * f, Math.PI + (z() - 0.5) * 0.9, l, 1.4, 3) // innenL: rechte Kante des linken
    }
  }
  // zarter Reif-Schleier entlang der Kanten
  g.shadowBlur = 0
  for (const [x, y, b, h, v] of [[0, 0, B, 60, 'oben'], [0, H - 60, B, 60, 'unten']]) {
    const gr = g.createLinearGradient(0, y, 0, y + h); const a = 'rgba(200,235,250,0.22)', n = 'rgba(200,235,250,0)'
    gr.addColorStop(0, v === 'oben' ? a : n); gr.addColorStop(1, v === 'oben' ? n : a); g.fillStyle = gr; g.fillRect(x, y, b, h)
  }
  // in der Mitte keine Seitenränder: dort den Schleier wieder weg (nur Kristalle an oben/unten bleiben)
  return c
}

export function erstelleWetter() {
  const z = zufallsfolge(23)
  return {
    tropfen: Array.from({ length: 900 }, () => ({ x: z() * B, y: z() * H, v: 0.7 + z() * 0.6, l: 0.6 + z() * 0.8 })),
    flocken: Array.from({ length: 700 }, () => ({ x: z() * B, y: z() * H, v: 0.5 + z() * 0.8, r: 1.2 + z() * 2.4, p: z() * 6.28 })),
    frost: null, // erst bei Bedarf zeichnen (spart Zeit beim Laden)
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

/** Frost an den Bildschirmrändern – ganz vorn, aber nur am Rand */
export function zeichneFrost(g, st) {
  const f = st.sichtbar.frost
  if (f <= 0.01) return
  st.frost = st.frost ?? frostBild()
  g.save(); g.globalAlpha = f; g.drawImage(st.frost, 0, 0); g.restore()
}

/** Nebelschwaden in Bergen und Wäldern (immer, sehr langsam) – nebelTextur: waagerecht wiederholbare Wolkenschicht */
export function bergnebel(g, nebelTextur, t) {
  if (!nebelTextur) return
  g.save(); g.globalCompositeOperation = 'screen'
  for (const [y, h, tempo, deck] of [[640, 170, 6, 0.35], [700, 150, -4, 0.3], [600, 120, 3, 0.22]]) {
    g.globalAlpha = deck
    const b = nebelTextur.width * 1.4, start = -(((t * tempo) % b) + b) % b
    for (let x = start; x < B; x += b) g.drawImage(nebelTextur, x, y, b, h)
  }
  g.restore()
}
export { HORIZONT }
