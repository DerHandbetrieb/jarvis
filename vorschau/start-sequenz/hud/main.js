// Lokis Start-Sequenz – Runde 4 (03.11.2026), Three.js 0.186.1 (MIT).
// Rückmeldung zu Runde 3: Ton „Runen-Ritual“ bleibt; Anzeigen wirkten billig/80er → neuer HUD-Stil nach den
// Vorbild-Bildern (zeichner.js); Reaktor massiver, mehr Runen, mehr Wikinger → Runen-Schild; echte Werkstatt-Inhalte
// (vorerst Beispieldaten); kein Filmkorn, gestochen scharf, Tiefenschärfe nur für Objekte, die nah herankommen.
// Unverändert aus Runde 3: feste Kamera, jede Anzeige bleibt mit Rand in ihrem Bildschirm (einpassen), Reaktor mittig.
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { ZEICHNER, RUNEN, LOKI, RUNEN_SCHRIFT, klemm, phase, weich, raus, zurueck, rauschen, zufall, css, setzeTonQuelle } from './zeichner.js'
import { tonVorbereiten, tonStarten, tonDaten } from '../3d/ton.js'
setzeTonQuelle(tonDaten)

const ZEIT = { VISIER: 1.4, VERWANDLUNG: 4.6, DUNKEL: 9.2, EINSCHLAG: 10.5, GRUSS: 12.8, AUS: 23, ENDE: 25 }
const FOV = 30, TAFEL_TIEFE = 9, KERN_Z = -12, REAKTOR_GROESSE = 0.86
const HAUPT = new THREE.Color('#5ff3ff'), AKZENT = new THREE.Color('#ffa640'), WEISS = new THREE.Color(1, 1, 1)
const S = { L: 0, M: 1, R: 2 }

// Aufbau je Bildschirm: [Bildschirm, Anzeige, u, v, Breite, Höhe] – u/v/Breite/Höhe als Anteil des Bildschirms
const TAFELN = [
  [S.L, 'lage', 0.50, 0.84, 0.92, 0.24], [S.L, 'baum', 0.28, 0.46, 0.50, 0.46], [S.L, 'karten', 0.76, 0.46, 0.42, 0.46], [S.L, 'schaltkreis', 0.50, 0.12, 0.92, 0.2],
  [S.R, 'umsatz', 0.50, 0.84, 0.92, 0.24], [S.R, 'verkauf', 0.27, 0.51, 0.48, 0.30], [S.R, 'shops', 0.75, 0.51, 0.44, 0.30], [S.R, 'lager', 0.27, 0.17, 0.48, 0.26], [S.R, 'system', 0.75, 0.17, 0.44, 0.26],
  [S.M, 'uhr', 0.50, 0.955, 0.72, 0.075], [S.M, 'welle', 0.50, 0.05, 0.62, 0.075],
  [S.M, 'marke', 0.13, 0.78, 0.24, 0.14], [S.M, 'marke', 0.87, 0.78, 0.24, 0.14], [S.M, 'marke', 0.13, 0.22, 0.24, 0.14], [S.M, 'marke', 0.87, 0.22, 0.24, 0.14],
]

function feld(nr, D, sv) { const h = D * Math.tan(THREE.MathUtils.degToRad(FOV / 2)), w = h * sv, b = (2 * w) / 3; return { x0: -w + nr * b, b, h } }
function leinwand(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return { c, g: c.getContext('2d'), tex } }
function leucht(map, deckkraft = 1, farbe = 0xffffff) { return new THREE.MeshBasicMaterial({ map, color: farbe, transparent: true, opacity: deckkraft, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }) }
function glanz(farbe, innen = 0.15) { const { g, tex } = leinwand(256, 256), v = g.createRadialGradient(128, 128, 0, 128, 128, 128); v.addColorStop(0, 'rgba(255,255,255,1)'); v.addColorStop(innen, farbe); v.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = v; g.fillRect(0, 0, 256, 256); tex.needsUpdate = true; return tex }

const buehne = document.getElementById('buehne')
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.outputColorSpace = THREE.SRGBColorSpace
buehne.prepend(renderer.domElement)
const kamera = new THREE.PerspectiveCamera(FOV, 16 / 3, 0.05, 400)
let szene, teile, composer, bloom, farbsaum

// ---------- Runen-Schild (Reaktor) ----------
function ringTextur(zeichnen, groesse = 2048) { const l = leinwand(groesse, groesse); l.g.translate(groesse / 2, groesse / 2); zeichnen(l.g, groesse / 2); l.tex.needsUpdate = true; return l }
function bauReaktor(umgebung) {
  const r = new THREE.Group(); r.position.set(0, 0, KERN_Z); r.scale.setScalar(REAKTOR_GROESSE); szene.add(r); teile.reaktor = r
  // Kraftstrahlen hinter dem Schild
  const st = ringTextur((g, R) => { for (let i = 0; i < 36; i++) { g.rotate((Math.PI * 2) / 36); const v = g.createLinearGradient(0, 0, R, 0); v.addColorStop(0, 'rgba(255,255,255,0.55)'); v.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = v; g.beginPath(); g.moveTo(0, 0); g.lineTo(R, -R * (i % 3 ? 0.012 : 0.03)); g.lineTo(R, R * (i % 3 ? 0.012 : 0.03)); g.fill() } }, 1024)
  teile.strahlen = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), leucht(st.tex, 0, HAUPT)); teile.strahlen.position.z = -0.6; r.add(teile.strahlen)
  // äußere Skala: feine Striche, Teilbögen, kleine Zahlen
  const sk = ringTextur((g, R) => {
    g.strokeStyle = '#fff'; const r0 = R * 0.97
    for (let i = 0; i < 360; i++) { const a = (i / 360) * Math.PI * 2, l = i % 30 === 0 ? 34 : i % 5 === 0 ? 18 : 9; g.lineWidth = i % 30 === 0 ? 3 : 1.4; g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * (r0 - l), Math.sin(a) * (r0 - l)); g.stroke() }
    g.lineWidth = 2; for (const [rr, a0, a1] of [[0.9, 0.2, 1.4], [0.9, 2.1, 2.9], [0.9, 3.6, 5.6], [0.86, 0.9, 2.6], [0.86, 4.1, 4.9]]) { g.beginPath(); g.arc(0, 0, R * rr, a0, a1); g.stroke() }
    g.font = `500 36px Bahnschrift`; g.fillStyle = '#fff'; g.textAlign = 'center'
    for (let i = 0; i < 12; i++) { g.save(); g.rotate((i / 12) * Math.PI * 2); g.fillText(String(i * 30).padStart(3, '0'), 0, -R * 0.8); g.restore() }
  })
  teile.skala = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 6.6), leucht(sk.tex, 0, HAUPT)); teile.skala.position.z = -0.2; r.add(teile.skala)
  // äußeres Runenband (ganzes älteres Futhark, unbedenkliche Auswahl) – wird nach dem Einschlag Rune für Rune entzündet
  teile.runenAussen = { ...leinwand(2048, 2048) }; teile.runenAussen.mesh = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 5.8), leucht(teile.runenAussen.tex, 0)); teile.runenAussen.mesh.position.z = 0.05; r.add(teile.runenAussen.mesh)
  // Schildrand aus Metall mit Nieten
  const metall = new THREE.MeshStandardMaterial({ color: new THREE.Color('#8fa3b4').multiplyScalar(0.5), metalness: 1, roughness: 0.32, envMap: umgebung, envMapIntensity: 0.1 })
  teile.metall = metall
  const rand = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.11, 24, 160), metall); r.add(rand); teile.rand = rand
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, n = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), metall); n.position.set(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 0.1); rand.add(n) }
  teile.randKante = new THREE.Mesh(new THREE.TorusGeometry(2.33, 0.008, 6, 200), leucht(null, 0, HAUPT)); r.add(teile.randKante)
  // Gravur: Runen + Flechtband auf den Platten (leuchtende Einlage über emissiveMap)
  const gravur = ringTextur((g, R) => {
    const e = R / 2 // Pixel je Einheit (Textur deckt −2…2 ab)
    g.fillStyle = '#000'; g.fillRect(-R, -R, 2 * R, 2 * R); g.strokeStyle = '#fff'; g.fillStyle = '#fff'
    // Flechtband innen und außen (zwei verschlungene Wellenlinien)
    for (const [rr, n] of [[1.22, 36], [1.93, 54]]) for (const ph of [0, Math.PI]) { g.lineWidth = 7; g.beginPath(); for (let i = 0; i <= 720; i++) { const a = (i / 720) * Math.PI * 2, rad = (rr + 0.05 * Math.sin(a * n + ph)) * e; g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad) } g.stroke() }
    // Runen auf dem Plattenring
    g.font = `${Math.round(0.34 * e)}px ${RUNEN_SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle'
    for (let i = 0; i < 36; i++) { g.save(); g.rotate((i / 36) * Math.PI * 2 + 0.05); g.translate(0, -1.58 * e); g.fillText(i % 9 === 0 ? LOKI[(i / 9) % 4] : RUNEN[(i * 7) % RUNEN.length], 0, 0); g.restore() }
  })
  gravur.tex.wrapS = gravur.tex.wrapT = THREE.ClampToEdgeWrapping; gravur.tex.repeat.set(0.25, 0.25); gravur.tex.offset.set(0.5, 0.5)
  const plattenMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#7f93a4').multiplyScalar(0.42), metalness: 1, roughness: 0.4, envMap: umgebung, envMapIntensity: 0.1, emissive: HAUPT, emissiveMap: gravur.tex, emissiveIntensity: 0 })
  teile.plattenMat = plattenMat
  const z = zufall(9)
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * Math.PI * 2 + 0.025, a1 = a0 + Math.PI / 6 - 0.05, f = new THREE.Shape(); f.absarc(0, 0, 2.06, a0, a1, false); f.absarc(0, 0, 1.12, a1, a0, true)
    const geo = new THREE.ExtrudeGeometry(f, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.035, bevelSegments: 3, curveSegments: 16 }); geo.translate(0, 0, -0.12)
    const m = new THREE.Mesh(geo, plattenMat)
    const kante = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), new THREE.LineBasicMaterial({ color: HAUPT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false })); m.add(kante)
    const w = (a0 + a1) / 2
    m.userData = { kante, start: new THREE.Vector3(Math.cos(w) * 3.2, Math.sin(w) * 2.2, -24 - z() * 10), drehung: new THREE.Euler(z() * 6, z() * 6, z() * 6), takt: ZEIT.VERWANDLUNG + 0.3 + i * 0.28, mitte: w }
    r.add(m); teile.platten.push(m)
  }
  // innere segmentierte Ringe (drehen gegeneinander)
  const ringe = [[0.98, 0.1, 64, 0.5], [0.86, -0.22, 120, 0.3], [0.74, 0.35, 24, 0.6], [0.62, -0.5, 90, 0.25]]
  teile.innenRinge = ringe.map(([rr, tempo, n, dicke], k) => {
    const t = ringTextur((g, R) => { g.strokeStyle = '#fff'; for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2; if ((i * 7 + k) % 5 === 0) continue; g.lineWidth = R * 0.05 * dicke; g.beginPath(); g.arc(0, 0, R * 0.92, a0, a0 + (Math.PI * 2) / n * 0.7); g.stroke() } g.lineWidth = 2; g.beginPath(); g.arc(0, 0, R * 0.99, 0, 7); g.stroke() }, 1024)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(rr * 2.2, rr * 2.2), leucht(t.tex, 0, k % 2 ? AKZENT : HAUPT)); m.position.z = 0.2 + k * 0.02; m.userData.tempo = tempo; r.add(m); return m
  })
  // Kern: Kugel, Glühen, Vegvisir (fein)
  teile.kern = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); r.add(teile.kern)
  teile.gluehen = new THREE.Sprite(new THREE.SpriteMaterial({ map: glanz('#5ff3ff'), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); r.add(teile.gluehen)
  const vg = ringTextur((g) => { g.strokeStyle = '#fff'; g.lineWidth = 6; g.lineCap = 'round'; for (let k = 0; k < 8; k++) { g.rotate(Math.PI / 4); g.beginPath(); g.moveTo(0, 60); g.lineTo(0, 420); g.moveTo(-40, 300 + (k % 2) * 50); g.lineTo(40, 300 + (k % 2) * 50); if (k % 2) { g.moveTo(-30, 400); g.lineTo(0, 370); g.lineTo(30, 400) } else { g.moveTo(0, 420); g.arc(0, 396, 24, -Math.PI / 2, Math.PI * 1.5) } g.stroke() } g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 470, 0, 7); g.stroke() }, 1024)
  teile.vegvisir = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.75), leucht(vg.tex, 0, HAUPT)); teile.vegvisir.position.z = 0.45; r.add(teile.vegvisir)
  teile.kernLicht = new THREE.PointLight(HAUPT, 0, 30, 1.6); teile.kernLicht.position.z = 1.2; r.add(teile.kernLicht)
  // Energiebögen, Stoßwelle
  for (let i = 0; i < 10; i++) { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 14 }, () => new THREE.Vector3())), new THREE.LineBasicMaterial({ color: HAUPT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false })); r.add(l); teile.boegen.push(l) }
  teile.welle = new THREE.Mesh(new THREE.RingGeometry(0.98, 1, 200), leucht(null, 0, HAUPT)); r.add(teile.welle)
}

function bauen() {
  szene = new THREE.Scene(); szene.background = new THREE.Color('#010509'); szene.fog = new THREE.FogExp2('#010509', 0.01)
  const umgebung = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture
  teile = { tafeln: [], platten: [], boegen: [], schweber: [] }
  szene.add(new THREE.AmbientLight(0x1a2a3a, 0.4)); const fl = new THREE.DirectionalLight(0xbfe9ff, 0.6); fl.position.set(-3, 4, 5); szene.add(fl)
  // Anzeigen: Leinwand doppelt so groß wie auf dem echten Bildschirm (1920 px je Bildschirm) → gestochen scharf
  TAFELN.forEach(([bild, art, u, v, bw, bh], i) => {
    const verh = (bw * (16 / 3)) / (3 * bh), pw = Math.min(4096, Math.round(bw * 1920 * 2)), ph = Math.max(64, Math.round(pw / verh))
    const { c, g, tex } = leinwand(pw, ph)
    const gruppe = new THREE.Group(), flaeche = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), leucht(tex, 0)); gruppe.add(flaeche); szene.add(gruppe)
    const start = bild === S.M ? ZEIT.VISIER + 2.2 + (i % 4) * 0.12 : ZEIT.VISIER + 0.2 + (i % 9) * 0.28
    teile.tafeln.push({ bild, art, u, v, bw, bh, gruppe, flaeche, c, g, tex, start, nr: i, markeNr: art === 'marke' ? (i - 11) : 0 })
  })
  bauReaktor(umgebung)
  // Lichtlinie zu Beginn
  teile.linie = new THREE.Mesh(new THREE.PlaneGeometry(40, 0.03), leucht(null, 0, HAUPT)); teile.linie.position.set(0, 0, -8); szene.add(teile.linie)
  teile.blitz = new THREE.Sprite(new THREE.SpriteMaterial({ map: glanz('#5ff3ff'), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0 })); teile.blitz.scale.set(6, 0.5, 1); teile.blitz.position.z = -7.9; szene.add(teile.blitz)
  // Sterne + Warp-Streifen + Bodengitter (durchgehend über alle Bildschirme)
  const zs = zufall(5), n = 2500, pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) { pos[i * 3] = (zs() - 0.5) * 120; pos[i * 3 + 1] = (zs() - 0.5) * 40; pos[i * 3 + 2] = -16 - zs() * 80 }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  teile.sterne = new THREE.Points(sg, new THREE.PointsMaterial({ color: HAUPT, size: 0.06, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); szene.add(teile.sterne)
  const stg = new THREE.BufferGeometry(); stg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(500 * 6), 3))
  teile.streifen = new THREE.LineSegments(stg, new THREE.LineBasicMaterial({ color: HAUPT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false }))
  teile.streifen.userData.saat = Array.from({ length: 500 }, () => ({ x: (zs() - 0.5) * 50, y: (zs() - 0.5) * 18, z: -16 - zs() * 70 })); szene.add(teile.streifen)
  teile.boden = new THREE.GridHelper(240, 160, HAUPT, HAUPT); teile.boden.position.y = -6.5; Object.assign(teile.boden.material, { transparent: true, opacity: 0, blending: THREE.AdditiveBlending }); szene.add(teile.boden)
  // Tiefenschärfe: Runen schweben vor dem Schild auf die Kamera zu – nah unscharf, fern scharf (zwei Texturen überblendet)
  for (let i = 0; i < 7; i++) {
    const rune = RUNEN[(i * 5 + 2) % RUNEN.length], scharf = leinwand(256, 256), weichT = leinwand(256, 256)
    for (const [l, unschaerfe] of [[scharf, 0], [weichT, 14]]) { l.g.filter = unschaerfe ? `blur(${unschaerfe}px)` : 'none'; l.g.fillStyle = '#fff'; l.g.font = `170px ${RUNEN_SCHRIFT}`; l.g.textAlign = 'center'; l.g.textBaseline = 'middle'; l.g.fillText(rune, 128, 136); l.tex.needsUpdate = true }
    const a = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), leucht(scharf.tex, 0, HAUPT)), b = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), leucht(weichT.tex, 0, HAUPT))
    const gr = new THREE.Group(); gr.add(a, b); szene.add(gr)
    teile.schweber.push({ gr, a, b, x: (zs() - 0.5) * 3.2, y: (zs() - 0.5) * 1.6, versatz: zs() * 8, tempo: 0.12 + zs() * 0.08 })
  }
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(szene, kamera))
  bloom = new UnrealBloomPass(new THREE.Vector2(1920, 360), 0.7, 0.4, 0.5); composer.addPass(bloom)
  farbsaum = new ShaderPass(RGBShiftShader); farbsaum.uniforms.amount.value = 0; composer.addPass(farbsaum) // nur beim Einschlag
  composer.addPass(new OutputPass())
  groesse()
}

// ---------- Anzeigen exakt in ihre Zelle einpassen ----------
// Zelle = Platz der Anzeige im Bildschirm (u/v/Breite/Höhe), mit Abstand zum Rand und zu den Nachbarn. Die Anzeige wird
// so lange in Breite und Höhe getrennt skaliert und verschoben, bis ihr projiziertes Bild genau die Zelle füllt – trotz
// Neigung und Weitwinkel. Damit kann nichts über den Bildschirmrand oder in eine Nachbaranzeige ragen.
const GRENZEN = [[-1, -1 / 3], [-1 / 3, 1 / 3], [1 / 3, 1]], RAND_X = 0.025, RAND_Y = 0.045, ABSTAND = 0.012
function zelle(ta) {
  const [a, b] = GRENZEN[ta.bild], bw = b - a
  const x0 = Math.max(a + RAND_X, a + (ta.u - ta.bw / 2) * bw + ABSTAND), x1 = Math.min(b - RAND_X, a + (ta.u + ta.bw / 2) * bw - ABSTAND)
  const y0 = Math.max(-1 + RAND_Y, -1 + (ta.v - ta.bh / 2) * 2 + ABSTAND * 2), y1 = Math.min(1 - RAND_Y, -1 + (ta.v + ta.bh / 2) * 2 - ABSTAND * 2)
  return { x0, x1, y0, y1 }
}
function einpassen(ta, f) {
  kamera.position.set(0, 0, 0); kamera.rotation.set(0, 0, 0); kamera.updateMatrixWorld(true)
  const z = zelle(ta), p = new THREE.Vector3()
  for (let runde = 0; runde < 12; runde++) {
    ta.gruppe.updateMatrixWorld(true)
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
    for (const [x, y] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) { p.set(x, y, 0); ta.gruppe.localToWorld(p); p.project(kamera); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y) }
    ta.gruppe.scale.x *= (z.x1 - z.x0) / (x1 - x0); ta.gruppe.scale.y *= (z.y1 - z.y0) / (y1 - y0)
    ta.gruppe.position.x += ((z.x0 + z.x1) / 2 - (x0 + x1) / 2) * f.b * 1.5
    ta.gruppe.position.y += ((z.y0 + z.y1) / 2 - (y0 + y1) / 2) * f.h
  }
}
function platzieren() {
  teile.tafeln.forEach((ta) => {
    const f = feld(ta.bild, TAFEL_TIEFE, kamera.aspect), x = f.x0 + ta.u * f.b, y = -f.h + ta.v * 2 * f.h
    ta.gruppe.position.set(x, y, -TAFEL_TIEFE)
    ta.gruppe.rotation.set(-y / TAFEL_TIEFE * 0.15, -Math.atan2(x, TAFEL_TIEFE) * 0.3, 0, 'YXZ') // leichte Visier-Neigung
    ta.gruppe.scale.set(ta.bw * f.b, ta.bh * 2 * f.h, 1)
    einpassen(ta, f)
  })
}

// ---------- Ablauf je Bild ----------
let wechsel = 0
function bild(t) {
  const T = ZEIT, fb = { haupt: HAUPT, akzent: AKZENT }, aus = 1 - phase(t, T.AUS, T.ENDE), dunkel = t >= T.DUNKEL && t < T.EINSCHLAG
  renderer.toneMappingExposure = 1.05 * aus + 0.0001
  const ruck = t > T.EINSCHLAG && t < T.EINSCHLAG + 1 ? (1 - phase(t, T.EINSCHLAG, T.EINSCHLAG + 1)) ** 2 * 0.006 : 0
  kamera.position.set(0, 0, 0); kamera.rotation.set(Math.sin(t * 70) * ruck, Math.cos(t * 55) * ruck, 0)
  const lp = raus(phase(t, 0.15, 1.3)), la = 1 - phase(t, 1.6, 2.6)
  teile.linie.scale.x = Math.max(0.001, lp); teile.linie.material.opacity = la; teile.blitz.position.x = -20 + 40 * lp; teile.blitz.material.opacity = la * (lp < 1 ? 1 : 0.4)

  // Anzeigen: schalten sich ein (kurzes Flackern, von der Mitte aufziehend), klappen im Dunkel zu, kommen zurück
  wechsel = (wechsel + 1) % 2
  teile.tafeln.forEach((ta, i) => {
    const an1 = phase(t, ta.start, ta.start + 0.5), weg = phase(t, T.DUNKEL - 0.45 + (i % 6) * 0.04, T.DUNKEL + 0.1 + (i % 6) * 0.04)
    const s2 = T.EINSCHLAG + 0.45 + (i % 12) * 0.07, an2 = phase(t, s2, s2 + 0.6), an = t < T.EINSCHLAG ? an1 : an2
    let sx = Math.max(0.002, raus(an)), sy = Math.max(0.01, an < 0.35 ? 0.03 : raus((an - 0.35) / 0.65)), deck = an
    if (an > 0 && an < 1 && Math.random() < 0.3) deck *= 0.25
    if (t >= T.DUNKEL - 0.5 && t < T.EINSCHLAG) { sy *= Math.max(0.01, 1 - weich(weg)); deck *= 1 - weg }
    ta.flaeche.scale.set(sx, sy, 1); ta.flaeche.material.opacity = deck * aus
    if (deck > 0.01 && (i % 2 === wechsel || ta.art === 'welle' || ta.art === 'uhr')) {
      ta.g.setTransform(1, 0, 0, 1, 0, 0); ta.g.clearRect(0, 0, ta.c.width, ta.c.height)
      ZEICHNER[ta.art](ta.g, ta.c, t, fb, ta.markeNr); ta.tex.needsUpdate = true
    }
  })

  // Runen-Schild
  const glimm = 0.3 * phase(t, T.VISIER, T.VERWANDLUNG), laden = phase(t, T.VERWANDLUNG, T.DUNKEL), nach = phase(t, T.EINSCHLAG, T.EINSCHLAG + 0.4)
  const kraft = dunkel ? 0.04 : t < T.EINSCHLAG ? glimm + 0.5 * laden : 0.92 + 0.08 * Math.sin(t * 5)
  const schlag = t > T.EINSCHLAG ? (1 - phase(t, T.EINSCHLAG, T.EINSCHLAG + 0.9)) ** 2 : 0
  const r = teile.reaktor
  r.position.set(0, 0, KERN_Z - 30 * (1 - weich(phase(t, T.VISIER, T.VERWANDLUNG + 0.6))))
  teile.kern.material.color.copy(WEISS).lerp(HAUPT, 0.3); teile.kern.scale.setScalar(dunkel ? 0.15 : 0.35 + kraft * 0.3 + schlag * 1.4)
  teile.gluehen.scale.setScalar(dunkel ? 0.5 : 1.0 + kraft * 0.9 + schlag * 3); teile.gluehen.material.opacity = (dunkel ? 0.12 : 0.45) * aus
  teile.kernLicht.intensity = (dunkel ? 0 : 1.5 + kraft * 4) * aus
  teile.metall.envMapIntensity = teile.plattenMat.envMapIntensity = (dunkel ? 0.01 : 0.06 + 0.2 * kraft) * aus
  // eingravierte Runen glühen: leise beim Aufbau, Blitz beim Einschlag, danach pulsierend
  teile.plattenMat.emissiveIntensity = (dunkel ? 0.03 : t < T.EINSCHLAG ? 0.12 + laden * 0.3 : 0.55 + 0.15 * Math.sin(t * 3) + schlag * 1.5) * aus
  teile.strahlen.material.opacity = (dunkel ? 0 : 0.06 * glimm + 0.18 * nach * (0.8 + 0.2 * Math.sin(t * 2))) * aus; teile.strahlen.rotation.z = t * 0.04
  teile.skala.material.opacity = (dunkel ? 0 : 0.25 + 0.55 * Math.max(laden, nach)) * aus; teile.skala.rotation.z = -t * 0.03
  teile.randKante.material.opacity = (dunkel ? 0 : 0.3 + 0.6 * nach) * aus
  teile.rand.rotation.z = t * 0.02
  teile.vegvisir.material.opacity = (dunkel ? 0 : Math.max(glimm, nach)) * aus; teile.vegvisir.rotation.z = -t * 0.12
  teile.innenRinge.forEach((m, k) => { m.material.opacity = (dunkel ? 0 : (0.25 * glimm + 0.35 * laden + 0.4 * nach)) * aus; m.rotation.z = t * m.userData.tempo * (1 + schlag * 6) })
  {
    const { g, c, tex, mesh } = teile.runenAussen, R = c.width / 2
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.translate(R, R)
    g.font = `120px ${RUNEN_SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle'
    const n = 32
    for (let k = 0; k < n; k++) {
      const rune = k % 8 === 0 ? LOKI[(k / 8) % 4] : RUNEN[(k * 3) % RUNEN.length]
      const an = t < T.EINSCHLAG ? 0.25 * laden : klemm((t - T.EINSCHLAG - 0.15 - k * 0.06) * 3), puls = t > T.EINSCHLAG + 3 ? 0.72 + 0.28 * Math.sin(t * 2.4 - k * 0.5) : 1
      g.save(); g.rotate((k / n) * Math.PI * 2); g.translate(0, -R * 0.84); g.fillStyle = css(k % 8 === 0 ? AKZENT : HAUPT, an * puls); g.fillText(rune, 0, 0); g.restore()
    }
    g.strokeStyle = css(HAUPT, 0.7); g.lineWidth = 3; for (const rr of [0.93, 0.75]) { g.beginPath(); g.arc(0, 0, R * rr, 0, 7); g.stroke() }
    tex.needsUpdate = true; mesh.material.opacity = (dunkel ? 0 : 1) * aus; mesh.rotation.z = t * 0.06
  }
  teile.platten.forEach((p) => {
    const u = p.userData, q = phase(t, u.takt, u.takt + 1.2), qq = zurueck(q)
    const auf = t > T.EINSCHLAG ? Math.sin(phase(t, T.EINSCHLAG, T.EINSCHLAG + 0.8) * Math.PI) * 0.35 : 0
    p.position.set(u.start.x * (1 - qq) + Math.cos(u.mitte) * auf, u.start.y * (1 - qq) + Math.sin(u.mitte) * auf, u.start.z * (1 - qq))
    p.rotation.set(u.drehung.x * (1 - qq), u.drehung.y * (1 - qq), u.drehung.z * (1 - qq))
    p.visible = t > u.takt - 0.05
    const einrasten = phase(t, u.takt + 0.95, u.takt + 1.5)
    u.kante.material.opacity = ((einrasten > 0 && einrasten < 1 ? 1 - einrasten : 0) + (dunkel ? 0 : 0.3 * Math.max(laden, nach))) * aus
  })
  teile.boegen.forEach((l) => {
    const an = (t > T.VERWANDLUNG + 1.2 && t < T.DUNKEL) || (t > T.EINSCHLAG && t < T.EINSCHLAG + 2) || (t > T.EINSCHLAG + 2 && Math.random() < 0.05)
    l.material.opacity = an && Math.random() < 0.7 ? 0.9 * aus : 0
    if (l.material.opacity) { const a = Math.random() * Math.PI * 2, pk = l.geometry.attributes.position; for (let k = 0; k < 14; k++) { const rr = 0.36 + (k / 13) * 0.8, w = k && k < 13 ? 0.1 : 0; pk.setXYZ(k, Math.cos(a) * rr + (Math.random() - 0.5) * w, Math.sin(a) * rr + (Math.random() - 0.5) * w, 0.3) } pk.needsUpdate = true }
  })
  const sw = phase(t, T.EINSCHLAG, T.EINSCHLAG + 1.6); teile.welle.scale.setScalar(0.5 + raus(sw) * 22); teile.welle.material.opacity = sw > 0 && sw < 1 ? (1 - sw) ** 2 * 0.7 : 0

  // schwebende Runen mit Tiefenschärfe (nur nach dem Einschlag)
  teile.schweber.forEach((s) => {
    const zyk = ((t * s.tempo + s.versatz / 8) % 1), z = -11 + zyk * 9.5 // von hinten (scharf) nach vorn (unscharf)
    s.gr.position.set(s.x * (1 + zyk * 0.3), s.y * (1 + zyk * 0.3), z); s.gr.lookAt(kamera.position)
    const naehe = phase(z, -6, -2), sicht = phase(t, T.EINSCHLAG + 1.5, T.EINSCHLAG + 3) * Math.sin(zyk * Math.PI) * aus
    s.a.material.opacity = sicht * (1 - naehe) * 0.8; s.b.material.opacity = sicht * naehe * 0.7; s.gr.scale.setScalar(1 + naehe * 0.6)
  })

  // Hintergrund
  const warp = weich(phase(t, T.VERWANDLUNG + 1.5, T.DUNKEL - 0.2)) * (1 - phase(t, T.DUNKEL - 0.2, T.DUNKEL))
  teile.sterne.material.opacity = (dunkel ? 0.04 : 0.5) * phase(t, 1, 3) * aus; teile.sterne.position.z = (t * 0.6) % 10
  { const s = teile.streifen, pk = s.geometry.attributes.position, tempo = 2 + warp * 60, l = 0.2 + warp * 9; s.userData.saat.forEach((q, i) => { q.z += tempo * 0.016; if (q.z > -15) q.z -= 70; pk.setXYZ(i * 2, q.x, q.y, q.z); pk.setXYZ(i * 2 + 1, q.x, q.y, q.z - l) }); pk.needsUpdate = true; s.material.opacity = warp * 0.8 * aus }
  teile.boden.material.opacity = (dunkel ? 0 : 0.12 * Math.max(phase(t, 2, 4), nach)) * aus; teile.boden.position.z = (t * 2) % 1.5

  bloom.strength = 0.65 + 0.2 * laden + 1.6 * schlag
  farbsaum.uniforms.amount.value = 0.01 * schlag // Farbsäume nur beim Einschlag, sonst gestochen scharf
}

// ---------- Größe, Abspielen ----------
function groesse() {
  const w = buehne.clientWidth || 1600, h = buehne.clientHeight || 300
  renderer.setSize(w, h, false); kamera.aspect = w / h; kamera.updateProjectionMatrix(); composer?.setSize(w, h)
  if (teile) platzieren()
}
addEventListener('resize', groesse)
document.addEventListener('fullscreenchange', () => setTimeout(groesse, 50))

let start = null, laeuft = false, tonAus = null
const knopf = document.getElementById('spielen'), info = document.getElementById('info')
document.getElementById('wahl').remove()
info.textContent = 'Klangwelt „Runen-Ritual“, Begrüßung wechselt bei jedem Abspielen. Werkstatt-Inhalte sind Beispieldaten.'
function standbild() { bild(16); composer.render() }
function stoppen() { laeuft = false; start = null; tonAus?.(); tonAus = null; knopf.textContent = '▶ Abspielen' }
let grussNr = Math.floor(Math.random() * 4)
knopf.onclick = async () => {
  if (laeuft) { stoppen(); standbild(); return }
  knopf.textContent = '■ Stopp'; laeuft = true
  grussNr = (grussNr % 4) + 1 // jedes Mal ein anderer Spruch
  await tonVorbereiten(grussNr)
  if (!laeuft) return
  tonAus = tonStarten({ klang: 'ritual' }, ZEIT)
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
bauen(); standbild(); schleife()
window.startSequenz = { kamera, teile: () => teile, nurZeichnen: () => composer.render(), bild: (t) => { bild(t); composer.render() }, ZEIT }

// Testmodus über alle drei Bildschirme: ?flaeche – startet von selbst, Leertaste wiederholt (neuer Spruch), Esc schließt
const par = new URLSearchParams(location.search)
if (par.has('flaeche')) {
  document.body.classList.add('flaeche')
  setTimeout(() => { groesse(); knopf.click() }, 400)
  addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { stoppen(); window.close() } else if (ev.key === ' ') { stoppen(); knopf.click() } })
}
