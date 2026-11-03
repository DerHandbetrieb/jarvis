// Lokis Start-Sequenz in 3D (Runde 2, 03.11.2026) – Three.js 0.186.1 (MIT).
// Szene: Kamera = Kopf im Helm. Rundherum (Radius R) schweben die Anzeigen als gebogene, leicht schräge Glasflächen
// (Visier), weit hinten der Runen-Reaktor aus Metallplatten (Wikinger × Sci-Fi). Ablauf in Sekunden siehe ZEIT.
// Die Breite entspricht den drei Bildschirmen (16:3, je 1920×1080): Mitte ±25°, außen 25–55° – Anzeigen meiden die Rahmen.
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { tonVorbereiten, tonStarten, tonDaten } from './ton.js'

// ---------- Grundwerte ----------
const ZEIT = { VISIER: 1.4, VERWANDLUNG: 4.6, DUNKEL: 9.2, EINSCHLAG: 10.5, GRUSS: 13, AUS: 22, ENDE: 24 }
const R = 9 // Radius des Visiers um die Kamera
const KERN_Z = -12 // Abstand des Reaktors
// Runen: nur unbedenkliche Zeichen (keine Sig ᛋ, keine Odal ᛟ, keine „Lebensrune“ ᛉ, keine Tyr ᛏ) – siehe CLAUDE.md
const RUNEN = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛒᛖᛗᛚᛜᛞᚴ'
const LOKI = 'ᛚᚢᚴᛁ' // jüngeres Futhark: L-U-K-I
const RUNEN_SCHRIFT = '"Segoe UI Historic", "Segoe UI Symbol", serif'

const ENTWUERFE = [
  { id: 'A', name: 'A · Visier Eisblau', haupt: '#5ff3ff', akzent: '#ffa640', metall: '#9fb3c2', hinter: '#01070c' },
  { id: 'B', name: 'B · Verwandlung Rot → Blau', vorher: '#ff3b2f', haupt: '#49a8ff', akzent: '#ffd060', metall: '#8c939b', hinter: '#060307' },
  { id: 'C', name: 'C · Asgard Gold', haupt: '#f2c264', akzent: '#6fdcff', metall: '#c9a76a', hinter: '#080502', ornament: true },
  { id: 'D', name: 'D · Bifröst Nordlicht', haupt: '#4dffb4', akzent: '#c07bff', metall: '#9fb0b0', hinter: '#01070a', nordlicht: true },
]

const klemm = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const phase = (t, a, b) => klemm((t - a) / (b - a))
const weich = (x) => x * x * (3 - 2 * x)
const raus = (x) => 1 - Math.pow(1 - x, 3)
const zurueck = (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2) } // mit Überschwingen
const rauschen = (x) => Math.sin(x * 1.3) + 0.5 * Math.sin(x * 2.7 + 1.1) + 0.25 * Math.sin(x * 5.3 + 2.3)
function zufall(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) }
const grad = (g) => (g * Math.PI) / 180

function farbeBei(e, t) {
  if (!e.vorher) return new THREE.Color(e.haupt)
  return new THREE.Color(e.vorher).lerp(new THREE.Color(e.haupt), weich(phase(t, ZEIT.EINSCHLAG, ZEIT.EINSCHLAG + 0.7)))
}
const css = (c, a = 1) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`

// ---------- Anzeigen (auf Leinwand gezeichnet, als Textur auf gebogene Flächen) ----------
const ZEICHNER = {
  graph(g, w, h, t, f) {
    rasterLinien(g, w, h, f)
    const reihen = [[f.haupt, 1.0, 0.9], [f.akzent, 1.7, 0.6], [f.haupt, 2.6, 0.4]]
    reihen.forEach(([farbe, tempo, a], k) => {
      g.strokeStyle = css(farbe, a); g.lineWidth = k ? 2 : 3; g.beginPath()
      for (let x = 0; x <= w; x += 6) g.lineTo(x, h * 0.55 + rauschen(x * 0.02 + t * tempo + k * 9) * h * 0.18 - k * 18)
      g.stroke()
    })
    beschriftung(g, w, h, f, 'NETZLAST · KANAL 3', `${(42 + rauschen(t) * 7).toFixed(1)} Mb/s`)
  },
  spektrum(g, w, h, t, f) {
    const n = 40, frq = tonDaten().frequenz
    for (let i = 0; i < n; i++) {
      const v = frq ? frq[Math.floor((i / n) * frq.length * 0.6)] / 255 : 0.5 + 0.45 * Math.sin(t * (2 + i * 0.13) + i)
      const bh = Math.max(4, v * h * 0.7)
      g.fillStyle = css(i % 7 === 0 ? f.akzent : f.haupt, 0.85); g.fillRect(10 + i * ((w - 20) / n), h * 0.85 - bh, (w - 20) / n - 4, bh)
    }
    beschriftung(g, w, h, f, 'FREQUENZANALYSE', `${(18.2 + rauschen(t * 2) * 2).toFixed(1)} kHz`)
  },
  tacho(g, w, h, t, f) {
    const werte = [['PROZESSOR', 0.23], ['SPEICHER', 0.29], ['GRAFIK', 0.41]]
    werte.forEach(([name, v], i) => {
      const x = w * (0.18 + i * 0.32), y = h * 0.55, r = h * 0.3, wert = klemm(v + 0.05 * rauschen(t * 1.5 + i))
      g.lineWidth = 12; g.strokeStyle = css(f.haupt, 0.18); g.beginPath(); g.arc(x, y, r, Math.PI * 0.75, Math.PI * 2.25); g.stroke()
      g.strokeStyle = css(i === 2 ? f.akzent : f.haupt, 0.95); g.beginPath(); g.arc(x, y, r, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * wert)); g.stroke()
      g.lineWidth = 2; for (let k = 0; k <= 20; k++) { const a = Math.PI * (0.75 + 1.5 * k / 20); g.beginPath(); g.moveTo(x + Math.cos(a) * (r + 10), y + Math.sin(a) * (r + 10)); g.lineTo(x + Math.cos(a) * (r + (k % 5 ? 15 : 22)), y + Math.sin(a) * (r + (k % 5 ? 15 : 22))); g.stroke() }
      g.fillStyle = css(f.haupt, 1); g.font = '600 30px Bahnschrift, "Segoe UI"'; g.textAlign = 'center'; g.fillText(Math.round(wert * 100), x, y + 10)
      g.font = '14px Bahnschrift, "Segoe UI"'; g.fillStyle = css(f.haupt, 0.7); g.fillText(name, x, y + r + 34); g.textAlign = 'left'
    })
    beschriftung(g, w, h, f, 'SYSTEMLAST', '')
  },
  tabelle(g, w, h, t, f) {
    g.font = '15px Consolas, monospace'
    const zeilen = 11, versatz = (t * 3) % 1, start = Math.floor(t * 3)
    for (let i = 0; i < zeilen; i++) {
      const z = zufall((start + i) * 97), y = 40 + (i - versatz) * 20
      if (y < 30 || y > h - 10) continue
      const hex = Array.from({ length: 6 }, () => Math.floor(z() * 65535).toString(16).padStart(4, '0').toUpperCase()).join(' ')
      g.fillStyle = css((start + i) % 9 === 0 ? f.akzent : f.haupt, (start + i) % 9 === 0 ? 1 : 0.65)
      g.fillText(`${(0x4f00 + (start + i) * 16).toString(16).toUpperCase()}  ${hex}`, 14, y)
    }
    beschriftung(g, w, h, f, 'SPEICHERABBILD', 'LIVE')
  },
  oszi(g, w, h, t, f) {
    rasterLinien(g, w, h, f)
    g.strokeStyle = css(f.haupt, 0.95); g.lineWidth = 2.5; g.beginPath()
    for (let i = 0; i <= 400; i++) { const a = (i / 400) * Math.PI * 2; g.lineTo(w / 2 + Math.sin(a * 3 + t * 1.3) * w * 0.32, h / 2 + Math.sin(a * 4 + t * 0.9) * h * 0.3) }
    g.stroke()
    beschriftung(g, w, h, f, 'PHASENBILD', `${(3.14 + rauschen(t) * 0.1).toFixed(3)} rad`)
  },
  radar(g, w, h, t, f) {
    const x = w / 2, y = h / 2 + 8, r = h * 0.4
    g.strokeStyle = css(f.haupt, 0.35); g.lineWidth = 1.5
    for (const k of [0.33, 0.66, 1]) { g.beginPath(); g.arc(x, y, r * k, 0, 7); g.stroke() }
    g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.moveTo(x, y - r); g.lineTo(x, y + r); g.stroke()
    const a = t * 2.2
    const verlauf = g.createConicGradient(a - 1.0, x, y); verlauf.addColorStop(0, css(f.haupt, 0)); verlauf.addColorStop(0.159, css(f.haupt, 0.55)); verlauf.addColorStop(0.16, css(f.haupt, 0))
    g.fillStyle = verlauf; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill()
    const z = zufall(4)
    for (let i = 0; i < 7; i++) { const wa = z() * 6.28, wr = r * (0.2 + z() * 0.75), frisch = ((a - wa) % 6.283 + 6.283) % 6.283 < 1.2; g.fillStyle = css(f.akzent, frisch ? 1 : 0.25); g.beginPath(); g.arc(x + Math.cos(wa) * wr, y + Math.sin(wa) * wr, 5, 0, 7); g.fill() }
    beschriftung(g, w, h, f, 'UMGEBUNG', '7 KONTAKTE')
  },
  hex(g, w, h, t, f) {
    const s = 18, z = zufall(Math.floor(t * 4))
    for (let r = 0; r < 9; r++) for (let c = 0; c < 15; c++) {
      const x = 24 + c * s * 1.75 + (r % 2) * s * 0.87, y = 36 + r * s * 1.5
      if (x > w - 10 || y > h - 10) continue
      const an = z() < 0.12
      g.strokeStyle = css(f.haupt, 0.4); g.fillStyle = css(an ? f.akzent : f.haupt, an ? 0.7 : 0.06)
      g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k + Math.PI / 6; g.lineTo(x + Math.cos(a) * s * 0.9, y + Math.sin(a) * s * 0.9) } g.closePath(); g.fill(); g.stroke()
    }
    beschriftung(g, w, h, f, 'SEKTOREN', `${Math.floor(60 + rauschen(t) * 20)} AKTIV`)
  },
  log(g, w, h, t, f) {
    const zeilen = ['LOKI KERN 3.0 · KALTSTART', 'Sprachkern Qwen3 0.6B ........ OK', 'Ohren Whisper small .......... OK', 'Runen-Matrix ................. OK', 'Grafik RTX 4080 · 16 GB ...... OK', 'Bildschirme 3 × 1920 × 1080 .. OK', 'Sarkasmus-Modul ........ MAXIMAL', 'Benutzerkompetenz ...... UNKLAR']
    g.font = '16px Consolas, monospace'
    zeilen.forEach((z, i) => {
      const p = phase(t, ZEIT.VISIER + 0.3 + i * 0.45, ZEIT.VISIER + 0.6 + i * 0.45)
      if (p <= 0) return
      g.fillStyle = css(/UNKLAR|MAXIMAL/.test(z) ? f.akzent : f.haupt, 0.9)
      g.fillText(z.slice(0, Math.ceil(z.length * p)), 14, 44 + i * 25)
    })
    beschriftung(g, w, h, f, 'STARTPROTOKOLL', '')
  },
  ziel(g, w, h, t, f) {
    const x = w / 2, y = h / 2 + 6, r = h * 0.32
    g.save(); g.translate(x, y); g.rotate(t * 0.8); g.strokeStyle = css(f.haupt, 0.9); g.lineWidth = 3
    for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.arc(0, 0, r, 0.15, 1.2); g.stroke(); g.beginPath(); g.moveTo(r + 6, 0); g.lineTo(r + 24, 0); g.stroke() }
    g.restore()
    const enge = 1 - weich(phase((t % 3), 0, 1.4))
    g.strokeStyle = css(f.akzent, 1); g.lineWidth = 2.5
    const b = r * (0.5 + enge * 0.6)
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { g.beginPath(); g.moveTo(x + sx * b, y + sy * (b - 14)); g.lineTo(x + sx * b, y + sy * b); g.lineTo(x + sx * (b - 14), y + sy * b); g.stroke() }
    g.fillStyle = css(f.akzent, 1); g.font = '14px Consolas'; g.fillText(enge < 0.05 ? 'ZIEL ERFASST' : 'SUCHE …', x + r + 30, y - 6); g.fillText(`${(1.82 + rauschen(t) * 0.2).toFixed(2)} m`, x + r + 30, y + 14)
    beschriftung(g, w, h, f, 'ZIELERFASSUNG', '')
  },
  histo(g, w, h, t, f) {
    rasterLinien(g, w, h, f)
    for (let i = 0; i < 18; i++) {
      const a = 0.3 + 0.3 * (rauschen(i * 0.7 + t * 0.6) + 1.75) / 3.5, b = a * (0.4 + 0.3 * Math.sin(i + t))
      const x = 16 + i * ((w - 32) / 18), bw = (w - 32) / 18 - 6
      g.fillStyle = css(f.haupt, 0.75); g.fillRect(x, h * 0.85 - a * h * 0.6, bw, a * h * 0.6)
      g.fillStyle = css(f.akzent, 0.9); g.fillRect(x, h * 0.85 - b * h * 0.6, bw, b * h * 0.6)
    }
    beschriftung(g, w, h, f, 'VERKÄUFE · 18 TAGE', 'BEISPIEL')
  },
  runen(g, w, h, t, f) {
    g.font = `34px ${RUNEN_SCHRIFT}`; g.fillStyle = css(f.haupt, 0.95)
    for (let zeile = 0; zeile < 4; zeile++) {
      let txt = ''; const z = zufall(zeile * 31 + Math.floor(t * 1.5))
      for (let i = 0; i < 16; i++) txt += RUNEN[Math.floor(z() * RUNEN.length)]
      g.globalAlpha = zeile === 1 ? 1 : 0.55
      g.fillText(txt, 16, 70 + zeile * 44)
    }
    g.globalAlpha = 1
    g.font = '14px Consolas'; g.fillStyle = css(f.akzent, 1); g.fillText(`${LOKI} = LOKI · WÄCHTER DER WERKSTATT`, 16, h - 16)
    beschriftung(g, w, h, f, 'RUNENSCHRIFT', '')
  },
  uhr(g, w, h, t, f) {
    const d = new Date()
    g.textAlign = 'center'; g.fillStyle = css(f.haupt, 1)
    g.font = '300 92px Bahnschrift, "Segoe UI"'; g.fillText(d.toLocaleTimeString('de-DE'), w / 2, h * 0.66)
    g.font = '18px Bahnschrift, "Segoe UI"'; g.fillStyle = css(f.haupt, 0.75)
    g.fillText(`${d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' }).toUpperCase()}   ·   ÖHRINGEN 6 °C NIESELREGEN`, w / 2, h * 0.9)
    g.textAlign = 'left'
  },
  welle(g, w, h, t, f) {
    const dat = tonDaten().welle
    g.strokeStyle = css(f.haupt, 1); g.lineWidth = 3; g.beginPath()
    for (let i = 0; i <= 256; i++) {
      const v = dat ? (dat[Math.floor((i / 256) * dat.length)] - 128) / 128 : 0.06 * Math.sin(i * 0.3 + t * 8) * Math.sin(i * 0.05)
      g.lineTo((i / 256) * w, h / 2 + v * h * 0.42)
    }
    g.stroke()
    g.fillStyle = css(f.akzent, 1); g.font = '14px Consolas'; g.fillText(dat ? 'LOKI SPRICHT' : 'STIMME BEREIT', 12, 22)
  },
  mini(g, w, h, t, f, nr) {
    const namen = ['KERN', 'FELD', 'PULS', 'NETZ'], v = klemm(0.55 + 0.35 * rauschen(t * 1.2 + nr * 3) / 1.75)
    g.lineWidth = 10; g.strokeStyle = css(f.haupt, 0.2); g.beginPath(); g.arc(w * 0.3, h / 2, h * 0.32, 0, 7); g.stroke()
    g.strokeStyle = css(nr % 2 ? f.akzent : f.haupt, 1); g.beginPath(); g.arc(w * 0.3, h / 2, h * 0.32, -Math.PI / 2, -Math.PI / 2 + v * 6.283); g.stroke()
    g.fillStyle = css(f.haupt, 1); g.font = '600 40px Bahnschrift'; g.fillText(`${Math.round(v * 100)}%`, w * 0.55, h * 0.56)
    g.font = '16px Bahnschrift'; g.fillStyle = css(f.haupt, 0.7); g.fillText(namen[nr % 4], w * 0.55, h * 0.78)
  },
  ticker(g, w, h, t, f) {
    g.font = `22px ${RUNEN_SCHRIFT}`
    const text = `   ${LOKI}  ·  SYSTEMSTATUS NOMINAL  ·  RUNEN-MATRIX STABIL  ·  ENERGIEKERN ${Math.round(97 + rauschen(t))} %  ·  WERKSTATT-VERBINDUNG AUSSTEHEND  ·  ${RUNEN.slice(0, 12)}  ·  BENUTZER ANWESEND – LEIDER  ·`
    const breite = g.measureText(text).width, x = -((t * 140) % breite)
    g.fillStyle = css(f.haupt, 0.8)
    for (let k = 0; k < 4; k++) g.fillText(text, x + k * breite, h * 0.72)
  },
}
function rasterLinien(g, w, h, f) {
  g.strokeStyle = css(f.haupt, 0.12); g.lineWidth = 1
  for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 30); g.lineTo(x, h); g.stroke() }
  for (let y = 30; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke() }
}
function beschriftung(g, w, h, f, titel, wert) {
  g.fillStyle = css(f.haupt, 0.9); g.font = '600 15px Bahnschrift, "Segoe UI"'; g.fillText(titel, 14, 22)
  if (wert) { g.textAlign = 'right'; g.fillStyle = css(f.akzent, 1); g.fillText(wert, w - 14, 22); g.textAlign = 'left' }
}
function rahmen(g, w, h, f, ornament) {
  g.strokeStyle = css(f.haupt, 0.85); g.lineWidth = 3
  const e = 22
  for (const [x, y, sx, sy] of [[2, 2, 1, 1], [w - 2, 2, -1, 1], [w - 2, h - 2, -1, -1], [2, h - 2, 1, -1]]) { g.beginPath(); g.moveTo(x, y + sy * e); g.lineTo(x, y); g.lineTo(x + sx * e, y); g.stroke() }
  g.strokeStyle = css(f.haupt, 0.25); g.lineWidth = 1; g.strokeRect(6, 6, w - 12, h - 12)
  if (ornament) { // Flechtband (Wikinger-Knotenmuster, vereinfacht) oben und unten
    g.strokeStyle = css(f.haupt, 0.45); g.lineWidth = 2
    for (const y of [10, h - 10]) for (let x = 40; x < w - 40; x += 24) { g.beginPath(); g.moveTo(x, y - 5); g.bezierCurveTo(x + 8, y + 7, x + 16, y - 7, x + 24, y + 5); g.stroke() }
  }
}

// ---------- Szene ----------
const buehne = document.getElementById('buehne')
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.outputColorSpace = THREE.SRGBColorSpace
buehne.prepend(renderer.domElement)

const kamera = new THREE.PerspectiveCamera(30, 16 / 3, 0.05, 400)
let szene, teile, composer, bloom, farbsaum, korn

const KornShader = {
  uniforms: { tDiffuse: { value: null }, zeit: { value: 0 }, staerke: { value: 0.022 }, vignette: { value: 1.15 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float zeit; uniform float staerke; uniform float vignette; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + zeit*43.0) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = (vUv - 0.5) * vec2(2.2, 1.0);
      float v = smoothstep(vignette, 0.25, length(d)); c.rgb *= mix(0.55, 1.0, v);
      c.rgb += (hash(vUv * 1000.0) - 0.5) * staerke; c.rgb *= 0.97 + 0.03 * sin(vUv.y * 900.0); gl_FragColor = c; }`,
}

function leinwandTextur(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4
  return { c, g: c.getContext('2d'), tex }
}
function biegen(geo, radius) { // flache Fläche an die Innenseite des Visier-Zylinders anschmiegen
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), a = x / radius; p.setX(i, radius * Math.sin(a)); p.setZ(i, radius * (1 - Math.cos(a))) }
  p.needsUpdate = true; geo.computeVertexNormals(); return geo
}
function aufVisier(obj, winkel, y, radius = R) {
  const a = grad(winkel)
  obj.position.set(Math.sin(a) * radius, y, -Math.cos(a) * radius)
  obj.rotation.order = 'YXZ'; obj.rotation.y = -a; obj.rotation.x = -y * 0.07; obj.rotation.z = a * 0.04
  obj.userData.basis = { a, y, radius }
}
function leuchtMaterial(map, deckkraft = 1) {
  return new THREE.MeshBasicMaterial({ map, transparent: true, opacity: deckkraft, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
}
function glanzTextur(farbe) {
  const { g, tex, c } = leinwandTextur(256, 256)
  const v = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  v.addColorStop(0, 'rgba(255,255,255,1)'); v.addColorStop(0.15, farbe); v.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = v; g.fillRect(0, 0, 256, 256); tex.needsUpdate = true; return tex
}

function bauen(e) {
  if (szene) aufraeumen()
  szene = new THREE.Scene()
  szene.background = new THREE.Color(e.hinter)
  szene.fog = new THREE.FogExp2(e.hinter, 0.012)
  const umgebung = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture
  teile = { tafeln: [], platten: [], boegen: [], e }

  // --- Visier-Anzeigen: je Seite 2 Spalten × 3 Zeilen auf den äußeren Bildschirmen, dazu Mitte oben/unten und 4 kleine
  const plan = [
    ['log', -48, 1.45], ['graph', -34, 1.45], ['tabelle', -48, 0], ['radar', -34, 0], ['hex', -48, -1.45], ['runen', -34, -1.45],
    ['tacho', 34, 1.45], ['spektrum', 48, 1.45], ['ziel', 34, 0], ['oszi', 48, 0], ['histo', 34, -1.45], ['graph', 48, -1.45],
  ]
  plan.forEach(([art, winkel, y], i) => tafel(art, winkel, y, 12.5, 1.2, 512, 256, ZEIT.VISIER + 0.15 + i * 0.22, i))
  tafel('uhr', 0, 1.95, 30, 0.62, 1024, 160, ZEIT.VISIER + 2.4, 20)
  tafel('welle', 0, -1.95, 26, 0.5, 1024, 128, ZEIT.VISIER + 2.6, 21)
  ;[[-17, 0.95], [17, 0.95], [-17, -0.95], [17, -0.95]].forEach(([w, y], k) => tafel('mini', w, y, 6.5, 0.62, 256, 128, ZEIT.VISIER + 1.0 + k * 0.2, 30 + k, k))
  tafel('ticker', 0, 2.42, 112, 0.16, 4096, 48, ZEIT.VISIER + 0.4, 40)
  tafel('ticker', 0, -2.42, 112, 0.16, 4096, 48, ZEIT.VISIER + 0.5, 41)

  function tafel(art, winkel, y, breiteGrad, hoehe, pw, ph, start, nr, extra) {
    const { c, g, tex } = leinwandTextur(pw, ph)
    const breite = R * grad(breiteGrad)
    const geo = biegen(new THREE.PlaneGeometry(breite, hoehe, 24, 1), R)
    const mesh = new THREE.Mesh(geo, leuchtMaterial(tex, 0))
    aufVisier(mesh, winkel, y)
    szene.add(mesh)
    // gläserne Rückseite (leicht sichtbar, gibt Tiefe)
    const glas = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x0b1820, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }))
    glas.position.z = -0.02; mesh.add(glas)
    teile.tafeln.push({ art, mesh, glas, c, g, tex, start, nr, extra, ohneRahmen: art === 'ticker' || art === 'uhr' || art === 'welle' })
  }

  // --- 3D-Globus (links) und 3D-Balken (rechts) zwischen den Anzeigen
  const globus = new THREE.Group()
  globus.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), new THREE.MeshBasicMaterial({ color: e.haupt, wireframe: true, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, toneMapped: false })))
  for (let k = 0; k < 3; k++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55 + k * 0.08, 0.004, 6, 96), leuchtMaterial(null, 0.45)); ring.material.color = new THREE.Color(k === 1 ? e.akzent : e.haupt); ring.rotation.x = 1.2 + k * 0.4; ring.rotation.y = k; globus.add(ring) }
  aufVisier(globus, -41, -0.72, R - 0.6); globus.scale.setScalar(0.001); szene.add(globus); teile.globus = globus
  const balken = new THREE.Group()
  for (let i = 0; i < 7; i++) for (let k = 0; k < 3; k++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1, 0.08), new THREE.MeshBasicMaterial({ color: (i + k) % 5 ? e.haupt : e.akzent, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, toneMapped: false }))
    b.position.set((i - 3) * 0.13, 0, (k - 1) * 0.13); b.userData.nr = i * 3 + k; balken.add(b)
  }
  aufVisier(balken, 41, -0.72, R - 0.6); balken.rotation.x += 0.35; balken.scale.setScalar(0.001); szene.add(balken); teile.balken = balken

  // --- Runen-Reaktor
  const reaktor = new THREE.Group(); reaktor.position.set(0, 0, KERN_Z); szene.add(reaktor); teile.reaktor = reaktor
  const kernLicht = new THREE.PointLight(e.haupt, 0, 30, 1.6); reaktor.add(kernLicht); teile.kernLicht = kernLicht
  const fuell = new THREE.DirectionalLight(0xffffff, 0.6); fuell.position.set(3, 5, 4); szene.add(fuell)
  szene.add(new THREE.AmbientLight(0x223344, 0.3))
  // Kern + Glühen
  const kern = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }))
  reaktor.add(kern); teile.kern = kern
  const gluehen = new THREE.Sprite(new THREE.SpriteMaterial({ map: glanzTextur(e.haupt), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }))
  gluehen.scale.setScalar(4); reaktor.add(gluehen); teile.gluehen = gluehen
  // Vegvisir-Stab (Wegweiser-Stern, isländisch) vor dem Kern – wie in der Werkstatt-App
  const stab = leinwandTextur(512, 512)
  stab.g.translate(256, 256); stab.g.strokeStyle = '#ffffff'; stab.g.lineWidth = 7; stab.g.lineCap = 'round'
  for (let k = 0; k < 8; k++) { stab.g.rotate(Math.PI / 4); stab.g.beginPath(); stab.g.moveTo(0, 40); stab.g.lineTo(0, 210); stab.g.moveTo(-26, 150 + (k % 2) * 25); stab.g.lineTo(26, 150 + (k % 2) * 25); if (k % 2) { stab.g.moveTo(-18, 200); stab.g.lineTo(0, 182); stab.g.lineTo(18, 200) } else { stab.g.moveTo(0, 210); stab.g.arc(0, 196, 14, -Math.PI / 2, Math.PI * 1.5) } stab.g.stroke() }
  stab.tex.needsUpdate = true
  const stabMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), leuchtMaterial(stab.tex, 0)); stabMesh.material.color = new THREE.Color(e.haupt); stabMesh.position.z = 0.5; reaktor.add(stabMesh); teile.stab = stabMesh
  // Runenring (Textur wird je Bild neu gezeichnet: Runen leuchten nacheinander auf)
  const rr = leinwandTextur(1024, 1024); const runenRing = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 5.0), leuchtMaterial(rr.tex, 0)); runenRing.position.z = 0.25
  reaktor.add(runenRing); teile.runenRing = { mesh: runenRing, ...rr }
  // Skalenring außen
  const sk = leinwandTextur(1024, 1024); sk.g.translate(512, 512); sk.g.strokeStyle = '#fff'
  for (let k = 0; k < 180; k++) { const a = (k / 180) * Math.PI * 2, l = k % 15 === 0 ? 40 : k % 5 === 0 ? 24 : 12; sk.g.lineWidth = k % 15 === 0 ? 5 : 2; sk.g.beginPath(); sk.g.moveTo(Math.cos(a) * 470, Math.sin(a) * 470); sk.g.lineTo(Math.cos(a) * (470 - l), Math.sin(a) * (470 - l)); sk.g.stroke() }
  sk.g.lineWidth = 3; sk.g.beginPath(); sk.g.arc(0, 0, 500, 0, 7); sk.g.stroke(); sk.tex.needsUpdate = true
  const skala = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 6.2), leuchtMaterial(sk.tex, 0)); skala.material.color = new THREE.Color(e.haupt); reaktor.add(skala); teile.skala = skala
  // Kreisel-Ringe (drehen sich in verschiedenen Achsen – Tiefe)
  teile.kreisel = [0, 1, 2].map((k) => { const m = new THREE.Mesh(new THREE.TorusGeometry(2.25 + k * 0.22, 0.012, 8, 160), leuchtMaterial(null, 0)); m.material.color = new THREE.Color(k === 1 ? e.akzent : e.haupt); reaktor.add(m); return m })
  // Metallplatten: 10 Ringsegmente, fliegen bei der Verwandlung heran und rasten ein
  const metall = new THREE.MeshStandardMaterial({ color: new THREE.Color(e.metall).multiplyScalar(0.55), metalness: 1, roughness: 0.36, envMap: umgebung, envMapIntensity: 0.1 })
  teile.metall = metall
  const z = zufall(9)
  for (let i = 0; i < 10; i++) {
    const a0 = (i / 10) * Math.PI * 2 + 0.03, a1 = a0 + (Math.PI * 2) / 10 - 0.06, form = new THREE.Shape()
    form.absarc(0, 0, 1.75, a0, a1, false); form.absarc(0, 0, 1.08, a1, a0, true)
    const geo = new THREE.ExtrudeGeometry(form, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2, curveSegments: 12 })
    geo.translate(0, 0, -0.11)
    const platte = new THREE.Mesh(geo, metall)
    const kante = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), new THREE.LineBasicMaterial({ color: e.haupt, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false }))
    platte.add(kante)
    const richtung = new THREE.Vector3(z() - 0.5, z() - 0.5, z() * 0.6).normalize()
    platte.userData = { kante, start: richtung.multiplyScalar(9 + z() * 6), drehung: new THREE.Euler(z() * 6, z() * 6, z() * 6), takt: ZEIT.VERWANDLUNG + 0.3 + i * 0.33, mitte: (a0 + a1) / 2 }
    reaktor.add(platte); teile.platten.push(platte)
  }
  // Energiebögen zwischen Kern und Platten
  for (let i = 0; i < 8; i++) { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 12 }, () => new THREE.Vector3())), new THREE.LineBasicMaterial({ color: e.haupt, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false })); reaktor.add(l); teile.boegen.push(l) }
  // Stoßwelle beim Einschlag
  const welle = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 160), leuchtMaterial(null, 0)); welle.material.color = new THREE.Color(e.haupt); reaktor.add(welle); teile.welle = welle

  // --- Lichtlinie zu Beginn
  const linie = new THREE.Mesh(new THREE.PlaneGeometry(40, 0.035), leuchtMaterial(null, 0)); linie.material.color = new THREE.Color(e.haupt); linie.position.set(0, 0, -8); szene.add(linie); teile.linie = linie
  const blitz = new THREE.Sprite(new THREE.SpriteMaterial({ map: glanzTextur(e.haupt), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0 })); blitz.scale.set(6, 0.6, 1); blitz.position.z = -7.9; szene.add(blitz); teile.blitz = blitz

  // --- Hintergrund: Sterne/Partikel (Warp), Boden-Gitter, großer Ring, ggf. Nordlicht
  const n = 3500, pos = new Float32Array(n * 3), zs = zufall(5)
  for (let i = 0; i < n; i++) { pos[i * 3] = (zs() - 0.5) * 120; pos[i * 3 + 1] = (zs() - 0.5) * 40; pos[i * 3 + 2] = -5 - zs() * 90 }
  const sterneGeo = new THREE.BufferGeometry(); sterneGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const sterne = new THREE.Points(sterneGeo, new THREE.PointsMaterial({ color: e.haupt, size: 0.07, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }))
  szene.add(sterne); teile.sterne = sterne
  const sp = new Float32Array(600 * 6); const streifenGeo = new THREE.BufferGeometry(); streifenGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3))
  const streifen = new THREE.LineSegments(streifenGeo, new THREE.LineBasicMaterial({ color: e.haupt, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false }))
  streifen.userData.saat = Array.from({ length: 600 }, () => ({ x: (zs() - 0.5) * 50, y: (zs() - 0.5) * 18, z: -zs() * 80 }))
  szene.add(streifen); teile.streifen = streifen
  const boden = new THREE.GridHelper(240, 120, e.haupt, e.haupt); boden.position.y = -6; boden.material.transparent = true; boden.material.opacity = 0; boden.material.blending = THREE.AdditiveBlending; szene.add(boden); teile.boden = boden
  const grossRing = new THREE.Mesh(new THREE.TorusGeometry(26, 0.06, 8, 200), leuchtMaterial(null, 0)); grossRing.material.color = new THREE.Color(e.haupt); grossRing.position.z = -55; szene.add(grossRing); teile.grossRing = grossRing
  if (e.nordlicht) {
    teile.nordlicht = [0, 1, 2].map((k) => {
      const { g, tex } = leinwandTextur(512, 256)
      const v = g.createLinearGradient(0, 0, 0, 256); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.5, k === 1 ? e.akzent : e.haupt); v.addColorStop(1, 'rgba(0,0,0,0)')
      for (let x = 0; x < 512; x += 3) { g.globalAlpha = 0.25 + 0.75 * Math.abs(Math.sin(x * 0.03 + k)); g.fillStyle = v; g.fillRect(x, 0, 2, 256) }
      tex.needsUpdate = true; tex.wrapS = THREE.RepeatWrapping
      const m = new THREE.Mesh(new THREE.PlaneGeometry(140, 26), leuchtMaterial(tex, 0)); m.position.set(0, 14 + k * 3, -70 - k * 6); m.rotation.x = 0.25; szene.add(m); return m
    })
  }

  // --- Nachbearbeitung: Leuchten, Farbsäume, Filmkorn/Vignette
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(szene, kamera))
  bloom = new UnrealBloomPass(new THREE.Vector2(1024, 192), 0.8, 0.45, 0.32); composer.addPass(bloom)
  farbsaum = new ShaderPass(RGBShiftShader); farbsaum.uniforms.amount.value = 0.0012; composer.addPass(farbsaum)
  korn = new ShaderPass(KornShader); composer.addPass(korn)
  composer.addPass(new OutputPass())
  groesse()
}

function aufraeumen() {
  szene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { x.map?.dispose?.(); x.dispose?.() }) })
  composer?.dispose?.()
}

// ---------- Ablauf je Bild ----------
const vorher = { tafel: 0 }
function bild(t) {
  const e = teile.e, farbe = farbeBei(e, t), akz = new THREE.Color(e.akzent), weiss = new THREE.Color(1, 1, 1)
  const f = { haupt: farbe, akzent: akz }
  const T = ZEIT
  const aus = 1 - phase(t, T.AUS, T.ENDE) // Schluss-Ausblendung
  renderer.toneMappingExposure = 1.05 * aus + 0.0001

  // Kamera: heranfahren während der Verwandlung, zurückreißen vor dem Einschlag, danach ruhige Bewegung
  let kz = 0.6 - 0.3 * phase(t, 0, T.VERWANDLUNG)
  kz -= 2.4 * weich(phase(t, T.VERWANDLUNG, T.DUNKEL))
  kz += 3.1 * raus(phase(t, T.DUNKEL, T.DUNKEL + 0.9))
  kz -= 0.7 * weich(phase(t, T.EINSCHLAG, T.EINSCHLAG + 4))
  const ruck = t > T.EINSCHLAG && t < T.EINSCHLAG + 1.4 ? (1 - phase(t, T.EINSCHLAG, T.EINSCHLAG + 1.4)) ** 2 * 0.22 : 0
  kamera.position.set(Math.sin(t * 0.23) * 0.35 + Math.sin(t * 61) * ruck, Math.cos(t * 0.17) * 0.12 + Math.cos(t * 53) * ruck * 0.6, kz)
  kamera.lookAt(Math.sin(t * 0.23) * 0.1, 0, KERN_Z)
  kamera.rotation.z = 0.035 * Math.sin(t * 0.3) + 0.04 * weich(phase(t, T.VERWANDLUNG, T.DUNKEL)) * (1 - phase(t, T.DUNKEL, T.DUNKEL + 0.6))

  // Lichtlinie (0,2–2 s)
  const lp = raus(phase(t, 0.15, 1.3)), la = (1 - phase(t, 1.6, 2.6))
  teile.linie.scale.x = Math.max(0.001, lp); teile.linie.material.opacity = la
  teile.blitz.position.x = -20 + 40 * lp; teile.blitz.material.opacity = la * (lp < 1 ? 1 : 0.4)

  // Anzeigen: aufblitzen (Visier bootet), wegklappen im Dunkel, mit Schwung zurück nach dem Einschlag
  vorher.tafel = (vorher.tafel + 1) % 2
  teile.tafeln.forEach((ta, i) => {
    const an1 = phase(t, ta.start, ta.start + 0.5), weg = phase(t, T.DUNKEL - 0.4 + (i % 6) * 0.04, T.DUNKEL + 0.15 + (i % 6) * 0.04)
    const zurueckStart = T.EINSCHLAG + 0.45 + (i % 12) * 0.07, an2 = phase(t, zurueckStart, zurueckStart + 0.7)
    const flackern = an1 > 0 && an1 < 1 ? (Math.random() < 0.35 ? 0.15 : 1) : 1
    let sichtbar = t < T.DUNKEL + 0.3 ? an1 * (1 - weg) : an2
    sichtbar *= aus
    const b = ta.mesh.userData.basis
    const schwung = t >= T.EINSCHLAG ? (1 - zurueck(an2)) * 0.5 * Math.sign(b.a || 1) : 0
    ta.mesh.rotation.y = -b.a + schwung
    ta.mesh.scale.set(t < T.DUNKEL + 0.3 ? Math.max(0.001, raus(an1)) : 1, Math.max(0.001, t < T.DUNKEL + 0.3 ? 1 - weich(weg) : raus(an2)), 1)
    ta.mesh.material.opacity = sichtbar * flackern
    ta.glas.material.opacity = 0.35 * sichtbar
    if (sichtbar > 0.01 && (i % 2 === vorher.tafel || ta.art === 'welle' || ta.art === 'uhr')) {
      const { g, c } = ta
      g.clearRect(0, 0, c.width, c.height)
      if (!ta.ohneRahmen) rahmen(g, c.width, c.height, f, e.ornament)
      ZEICHNER[ta.art](g, c.width, c.height, t, f, ta.extra ?? ta.nr)
      ta.tex.needsUpdate = true
    }
  })
  // Globus + 3D-Balken
  const g3 = Math.max(phase(t, T.VISIER + 1.6, T.VISIER + 2.4) * (1 - phase(t, T.DUNKEL - 0.3, T.DUNKEL)), phase(t, T.EINSCHLAG + 0.9, T.EINSCHLAG + 1.6)) * aus
  teile.globus.scale.setScalar(Math.max(0.001, raus(g3))); teile.globus.rotation.y = t * 0.5
  teile.globus.children.forEach((k, i) => { if (i) k.rotation.z = t * (0.3 + i * 0.2) })
  teile.balken.scale.setScalar(Math.max(0.001, raus(g3)))
  teile.balken.children.forEach((b) => { const hgt = 0.15 + 0.6 * (rauschen(b.userData.nr * 0.9 + t * 1.4) + 1.75) / 3.5; b.scale.y = hgt; b.position.y = hgt / 2 - 0.4 })
  teile.balken.rotation.y = -grad(41) + Math.sin(t * 0.4) * 0.4

  // Reaktor
  const glimm = 0.25 * phase(t, T.VISIER, T.VERWANDLUNG)
  const laden = phase(t, T.VERWANDLUNG, T.DUNKEL)
  const dunkel = t >= T.DUNKEL && t < T.EINSCHLAG
  const nach = phase(t, T.EINSCHLAG, T.EINSCHLAG + 0.4)
  const kraft = dunkel ? 0.05 : t < T.EINSCHLAG ? glimm + 0.5 * laden : 0.9 + 0.1 * Math.sin(t * 6)
  teile.kern.material.color.copy(weiss).lerp(farbe, 0.35)
  teile.kern.scale.setScalar(dunkel ? 0.12 : 0.3 + kraft * 0.35 + (t > T.EINSCHLAG && t < T.EINSCHLAG + 0.5 ? (1 - phase(t, T.EINSCHLAG, T.EINSCHLAG + 0.5)) * 1.2 : 0))
  teile.gluehen.material.color.copy(farbe); teile.gluehen.scale.setScalar(dunkel ? 0.5 : 1.0 + kraft * 1.2 + (t > T.EINSCHLAG ? (1 - phase(t, T.EINSCHLAG, T.EINSCHLAG + 0.6)) ** 2 * 3.5 : 0))
  teile.gluehen.material.opacity = (dunkel ? 0.15 : 0.5) * aus
  teile.kernLicht.color.copy(farbe); teile.kernLicht.intensity = (dunkel ? 0 : 2 + kraft * 7) * aus
  // Spiegelung der Metallplatten folgt der Kraft des Kerns – im Dunkel wirklich dunkel
  teile.metall.envMapIntensity = (dunkel ? 0.01 : 0.05 + 0.16 * kraft) * aus
  teile.stab.material.color.copy(farbe); teile.stab.material.opacity = (dunkel ? 0 : Math.max(glimm, nach)) * aus; teile.stab.rotation.z = -t * 0.1
  // Runenring: Runen leuchten nach dem Einschlag nacheinander auf
  {
    const { g, c, tex, mesh } = teile.runenRing
    g.clearRect(0, 0, 1024, 1024); g.save(); g.translate(512, 512)
    const anzahl = 24, zz = zufall(17)
    g.font = `64px ${RUNEN_SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle'
    for (let k = 0; k < anzahl; k++) {
      const rune = k % 6 === 0 ? LOKI[(k / 6) % 4] : RUNEN[Math.floor(zz() * RUNEN.length)]
      const an = t < T.EINSCHLAG ? 0.35 * laden : klemm((t - T.EINSCHLAG - 0.2 - k * 0.07) * 3)
      const puls = t > T.EINSCHLAG + 3 ? 0.75 + 0.25 * Math.sin(t * 3 - k * 0.6) : 1
      g.save(); g.rotate((k / anzahl) * Math.PI * 2); g.translate(0, -392)
      g.fillStyle = css(k % 6 === 0 ? akz : farbe, an * puls); g.fillText(rune, 0, 0); g.restore()
    }
    g.strokeStyle = css(farbe, 0.6); g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 440, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 345, 0, 7); g.stroke()
    g.restore(); tex.needsUpdate = true
    mesh.material.opacity = (dunkel ? 0 : 1) * aus; mesh.rotation.z = t * 0.12
  }
  teile.skala.material.color.copy(farbe); teile.skala.material.opacity = (dunkel ? 0 : 0.2 + 0.6 * Math.max(laden, nach)) * aus; teile.skala.rotation.z = -t * 0.05
  teile.kreisel.forEach((k, i) => { k.material.opacity = (dunkel ? 0 : Math.max(glimm * 1.5, nach) * 0.8) * aus; k.rotation.x = t * (0.4 + i * 0.25) + i; k.rotation.y = t * (0.3 - i * 0.15); if (i !== 1) k.material.color.copy(farbe) })
  // Platten: heranfliegen, drehen, einrasten (mit Überschwingen); beim Einschlag öffnet sich die Blende kurz
  teile.platten.forEach((p) => {
    const u = p.userData, q = phase(t, u.takt, u.takt + 1.25), qq = zurueck(q)
    const auf = t > T.EINSCHLAG ? Math.sin(phase(t, T.EINSCHLAG, T.EINSCHLAG + 0.9) * Math.PI) * 0.45 : 0
    p.position.set(u.start.x * (1 - qq) + Math.cos(u.mitte) * auf, u.start.y * (1 - qq) + Math.sin(u.mitte) * auf, u.start.z * (1 - qq))
    p.rotation.set(u.drehung.x * (1 - qq), u.drehung.y * (1 - qq), u.drehung.z * (1 - qq) + (t > T.EINSCHLAG ? t * 0.08 : 0))
    p.visible = t > u.takt - 0.05
    const einrasten = phase(t, u.takt + 1.0, u.takt + 1.6)
    u.kante.material.color.copy(farbe); u.kante.material.opacity = ((einrasten > 0 && einrasten < 1 ? 1 - einrasten : 0) + (dunkel ? 0 : 0.35 * Math.max(laden, nach))) * aus
  })
  // Energiebögen
  teile.boegen.forEach((l, i) => {
    const an = (t > T.VERWANDLUNG + 1.2 && t < T.DUNKEL) || (t > T.EINSCHLAG && t < T.EINSCHLAG + 2) || (t > T.EINSCHLAG + 2 && Math.random() < 0.04)
    l.material.opacity = an && Math.random() < 0.7 ? 0.9 * aus : 0; l.material.color.copy(farbe)
    if (l.material.opacity) {
      const a = Math.random() * Math.PI * 2, pk = l.geometry.attributes.position
      for (let k = 0; k < 12; k++) { const r = 0.4 + (k / 11) * 0.75, wackel = k && k < 11 ? 0.12 : 0; pk.setXYZ(k, Math.cos(a) * r + (Math.random() - 0.5) * wackel, Math.sin(a) * r + (Math.random() - 0.5) * wackel, 0.15) }
      pk.needsUpdate = true
    }
  })
  // Stoßwelle
  const sw = phase(t, T.EINSCHLAG, T.EINSCHLAG + 1.6)
  teile.welle.scale.setScalar(0.5 + raus(sw) * 22); teile.welle.material.opacity = sw > 0 && sw < 1 ? (1 - sw) ** 2 * 0.7 : 0; teile.welle.material.color.copy(farbe)

  // Sterne: ruhig treiben, Warp-Flug während der Verwandlung, Stillstand im Dunkel
  const warp = weich(phase(t, T.VERWANDLUNG + 1.5, T.DUNKEL - 0.2)) * (1 - phase(t, T.DUNKEL - 0.2, T.DUNKEL))
  teile.sterne.material.opacity = (dunkel ? 0.05 : 0.6) * phase(t, 1, 3) * aus; teile.sterne.material.color.copy(farbe)
  teile.sterne.position.z = (t * 0.6) % 10
  {
    const s = teile.streifen, pk = s.geometry.attributes.position, tempo = 2 + warp * 60, l = 0.2 + warp * 9
    s.userData.saat.forEach((q, i) => {
      q.z += tempo * 0.016; if (q.z > 2) q.z -= 82
      pk.setXYZ(i * 2, q.x, q.y, q.z); pk.setXYZ(i * 2 + 1, q.x, q.y, q.z - l)
    })
    pk.needsUpdate = true; s.material.opacity = warp * 0.8 * aus; s.material.color.copy(farbe)
  }
  teile.boden.material.opacity = (dunkel ? 0 : 0.18 * Math.max(phase(t, 2, 4), nach)) * aus; teile.boden.position.z = (t * 2) % 2
  teile.boden.material.color?.copy?.(farbe)
  teile.grossRing.material.opacity = (dunkel ? 0 : 0.5 * Math.max(phase(t, 3, 6), nach)) * aus; teile.grossRing.rotation.z = t * 0.03; teile.grossRing.material.color.copy(farbe)
  teile.nordlicht?.forEach((m, k) => { m.material.opacity = (dunkel ? 0 : 0.55 * Math.max(phase(t, 2, 5), nach)) * aus * (0.7 + 0.3 * Math.sin(t * 0.7 + k)); m.material.map.offset.x = t * (0.01 + k * 0.006); m.position.y = 14 + k * 3 + Math.sin(t * 0.4 + k) })

  // Nachbearbeitung: Leuchten und Farbsäume schießen beim Einschlag hoch
  const schlag = t > T.EINSCHLAG ? (1 - phase(t, T.EINSCHLAG, T.EINSCHLAG + 0.9)) ** 2 : 0
  bloom.strength = 0.75 + 0.35 * laden + 2.2 * schlag
  farbsaum.uniforms.amount.value = 0.0012 + 0.012 * schlag + (t > 9 && t < 9.4 ? 0.006 : 0)
  korn.uniforms.zeit.value = t
}

// ---------- Größe, Abspielen ----------
function groesse() {
  const w = buehne.clientWidth, h = buehne.clientHeight
  renderer.setSize(w, h, false); kamera.aspect = w / h; kamera.updateProjectionMatrix()
  composer?.setSize(w, h); bloom?.resolution.set(w, h)
}
addEventListener('resize', groesse)
document.addEventListener('fullscreenchange', () => setTimeout(groesse, 50))

let aktuell = ENTWUERFE[0], start = null, laeuft = false, tonAus = null
const wahl = document.getElementById('wahl'), knopf = document.getElementById('spielen'), info = document.getElementById('info')
ENTWUERFE.forEach((e) => {
  const b = document.createElement('button'); b.textContent = e.name; b.onclick = () => { stoppen(); aktuell = e; bauen(e); markieren(); standbild() }
  wahl.appendChild(b); e.knopf = b
})
function markieren() { ENTWUERFE.forEach((e) => e.knopf.classList.toggle('an', e === aktuell)) }
function standbild() { bild(16); composer.render() }
function stoppen() { laeuft = false; start = null; tonAus?.(); tonAus = null; knopf.textContent = '▶ Abspielen' }
knopf.onclick = async () => {
  if (laeuft) { stoppen(); standbild(); return }
  knopf.textContent = '■ Stopp'; laeuft = true; info.textContent = 'Lade Töne …'
  await tonVorbereiten()
  if (!laeuft) return
  info.textContent = ''
  tonAus = tonStarten(aktuell, ZEIT)
  start = performance.now()
}
document.getElementById('voll').onclick = () => buehne.requestFullscreen?.()
function schleife() {
  requestAnimationFrame(schleife)
  if (!laeuft || start == null) return
  const t = (performance.now() - start) / 1000
  if (t > ZEIT.ENDE) { stoppen(); standbild(); return }
  bild(t); composer.render()
}
bauen(aktuell); markieren(); standbild(); schleife()
// für Tests von außen
window.startSequenz = { teile: () => teile, nurZeichnen: () => composer.render(), bild: (t) => { bild(t); composer.render() }, waehle: (id) => ENTWUERFE.find((e) => e.id === id)?.knopf.click(), ZEIT }

// Testmodus über alle drei Bildschirme (Aufruf über drei-bildschirme.cjs): ?flaeche&entwurf=A – startet von selbst,
// Tasten A–D wählen und starten neu, Leertaste wiederholt, Esc schließt.
const par = new URLSearchParams(location.search)
if (par.has('flaeche')) {
  document.body.classList.add('flaeche')
  setTimeout(() => {
    groesse()
    const id = (par.get('entwurf') || 'A').toUpperCase()
    ENTWUERFE.find((x) => x.id === id)?.knopf.click()
    knopf.click()
  }, 400)
  addEventListener('keydown', (ev) => {
    const k = ev.key.toUpperCase()
    if (k === 'ESCAPE') { stoppen(); window.close() }
    else if ('ABCD'.includes(k) && k.length === 1) { ENTWUERFE.find((x) => x.id === k).knopf.click(); knopf.click() }
    else if (k === ' ') { stoppen(); knopf.click() }
  })
}
