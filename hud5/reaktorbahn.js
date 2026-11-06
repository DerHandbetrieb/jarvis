// Wege der Blitze über den Reaktor (06.11.2026, Wunsch Auftraggeber: Blitze sollen an den harten Kanten entlanglaufen und auch mal
// seitlich abbiegen, nicht nur darüber schweben). Aus dem Reaktor-Bild wird einmal eine Kantenkarte gerechnet. Für jeden Impuls sucht
// ein kürzester-Weg-Verfahren (Dijkstra) von der Mitte nach außen: Entlang von Kanten ist der Weg billig, über glatte Flächen teuer.
// Eine Prise Zufall je Impuls sorgt dafür, dass jeder Blitz anders läuft. Alle Wege starten am Kern; Äste zweigen dort ab, wo sie auf
// einen schon vorhandenen Weg treffen.
const RASTER = 3 // Bildpunkte je Rasterfeld
const glatt = (a, b, x) => { const v = Math.max(0, Math.min(1, (x - a) / (b - a))); return v * v * (3 - 2 * v) }

/** bild: Reaktor mit Durchsicht; e: { x, y, b, h } in der Szene; mitte: { x, y }. → Karte oder null (dann ohne Kantenführung) */
export function kantenKarte(bild, e, mitte) {
  try {
    const n = Math.round(e.b / RASTER), m = Math.round(e.h / RASTER)
    const c = document.createElement('canvas'); c.width = n; c.height = m
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(bild, 0, 0, n, m)
    const p = g.getImageData(0, 0, n, m).data, hell = new Float32Array(n * m), kosten = new Float32Array(n * m).fill(1e6)
    for (let i = 0; i < n * m; i++) hell[i] = (p[i * 4] * 0.3 + p[i * 4 + 1] * 0.59 + p[i * 4 + 2] * 0.11) / 255
    const roh = new Float32Array(n * m); let spitze = 0
    for (let y = 1; y < m - 1; y++) for (let x = 1; x < n - 1; x++) {
      const i = y * n + x, a = (k) => hell[k]
      const gx = a(i - n + 1) + 2 * a(i + 1) + a(i + n + 1) - a(i - n - 1) - 2 * a(i - 1) - a(i + n - 1)
      const gy = a(i + n - 1) + 2 * a(i + n) + a(i + n + 1) - a(i - n - 1) - 2 * a(i - n) - a(i - n + 1)
      roh[i] = Math.hypot(gx, gy); spitze = Math.max(spitze, roh[i])
    }
    for (let i = 0; i < n * m; i++) if (p[i * 4 + 3] > 200) kosten[i] = 1 + 16 * (1 - glatt(0.12, 0.55, roh[i] / (spitze || 1))) ** 2
    return { n, m, kosten, e, mitte, feld: RASTER }
  } catch (f) { console.error('Reaktor-Kanten:', f); return null }
}

class Haufen { // kleiner Vorrang-Stapel für Dijkstra
  constructor() { this.k = []; this.v = [] }
  rein(k, v) { const K = this.k, V = this.v; let i = K.length; K.push(k); V.push(v); while (i) { const o = (i - 1) >> 1; if (K[o] <= k) break; K[i] = K[o]; V[i] = V[o]; i = o } K[i] = k; V[i] = v }
  raus() {
    const K = this.k, V = this.v, wert = V[0], lk = K.pop(), lv = V.pop(), n = K.length
    if (n) { let i = 0; for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && K[c + 1] < K[c]) c++; if (K[c] >= lk) break; K[i] = K[c]; V[i] = V[c]; i = c } K[i] = lk; V[i] = lv }
    return wert
  }
  get leer() { return !this.k.length }
}

const NACHBARN = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.41], [1, -1, 1.41], [-1, 1, 1.41], [-1, -1, 1.41]]

/** kürzeste Wege von den Startfeldern; → her: je Feld der Vorgänger, dist: Kosten */
function suchen(karte, starts, stoer) {
  const { n, m, kosten } = karte, N = n * m, dist = new Float32Array(N).fill(Infinity), her = new Int32Array(N).fill(-1), h = new Haufen()
  for (const k of starts) if (k >= 0 && k < N) { dist[k] = 0; h.rein(0, k) }
  while (!h.leer) {
    const d = h.k[0], k = h.raus()
    if (d > dist[k]) continue // veralteter Eintrag
    const x = k % n, y = (k - x) / n
    for (const [dx, dy, l] of NACHBARN) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= n || ny >= m) continue
      const z = ny * n + nx, c = kosten[z]; if (c >= 1e6) continue
      const nd = d + c * l * stoer(nx, ny)
      if (nd < dist[z]) { dist[z] = nd; her[z] = k; h.rein(nd, z) }
    }
  }
  return { dist, her }
}

/** haupt, aeste: [{ w, r }] Winkel und Abstand zur Mitte. → [{ pkt: [[x, y]…] relativ zur Mitte, tiefe, abAnteil }] */
export function blitzWege(karte, haupt, aeste, kern) {
  const { n, m, e, mitte, feld } = karte, N = n * m
  const cx = (mitte.x - e.x) / feld, cy = (mitte.y - e.y) / feld
  // grobes Rauschen, damit jeder Impuls einen anderen Weg nimmt
  const saat = Math.random() * 100, stoer = (x, y) => 1 + 2.2 * Math.abs(Math.sin(x * 0.31 + saat) * Math.cos(y * 0.27 - saat * 1.7) + Math.sin((x + y) * 0.11 + saat * 2.3) * 0.5)
  const feldVon = (w, r) => Math.round(cy + (Math.sin(w) * r) / feld) * n + Math.round(cx + (Math.cos(w) * r) / feld)
  const inPunkte = (liste) => liste.map((q) => { const qx = q % n, qy = (q - qx) / n; return [(qx - cx) * feld, (qy - cy) * feld] })
  /** Ziel auf dem Strahl nach innen suchen, bis ein erreichbares Feld da ist */
  const erreichbar = (z, dist) => { for (let r = z.r; r > kern; r -= feld) { const k = feldVon(z.w, r); if (k >= 0 && k < N && Number.isFinite(dist[k])) return k } return -1 }
  const zurueck = (k, her) => { const l = []; for (let i = k; i >= 0; i = her[i]) l.push(i); return l.reverse() }
  const ring = Array.from({ length: 24 }, (_, i) => feldVon((i / 24) * 6.2832, kern))
  const eins = suchen(karte, ring, stoer), wege = [], belegt = new Set()
  for (const z of haupt) {
    const k = erreichbar(z, eins.dist); if (k < 0) continue
    const liste = zurueck(k, eins.her).filter((q) => !belegt.has(q)); if (liste.length < 6) continue
    const pkt = inPunkte(liste), [x0, y0] = pkt[0], w0 = Math.atan2(y0, x0)
    pkt.unshift([Math.cos(w0) * (kern - 16), Math.sin(w0) * (kern - 16)]) // bis in den Kern hinein
    wege.push({ pkt, tiefe: 0, abAnteil: 0 })
    liste.forEach((q) => belegt.add(q))
  }
  if (!wege.length) return wege
  // Äste setzen im äußeren Teil eines Hauptblitzes an und driften seitlich weg
  const start = new Map()
  wege.forEach((w) => w.pkt.forEach((p, i) => { const u = i / w.pkt.length; if (u > 0.2 && u < 0.9) start.set(Math.round(cy + p[1] / feld) * n + Math.round(cx + p[0] / feld), u) }))
  const zwei = suchen(karte, [...start.keys()], stoer)
  for (const z of aeste) {
    const k = erreichbar(z, zwei.dist); if (k < 0) continue
    const liste = zurueck(k, zwei.her); if (liste.length < 5 || liste.length > 60) continue
    wege.push({ pkt: inPunkte(liste), tiefe: 1, abAnteil: start.get(liste[0]) ?? 0.5 })
  }
  return wege
}
