// Lokis Start-Sequenz in 3D – Runde 3 (03.11.2026), Three.js 0.186.1 (MIT).
// Rückmeldung Auftraggeber zu Runde 2: Eisblau bleibt; Inhalt je Bildschirm fest verankert (nichts ragt über den Rand,
// keine Kamerafahrt/kein Heranzoomen der ganzen Szene), Reaktor exakt mittig auf dem mittleren Bildschirm, Gruß beginnt
// mit „Willkommen zurück, Sir.“, vier inhaltlich und klanglich verschiedene Varianten.
// Aufbau: feste Kamera; jeder Bildschirm ist ein Rechteck in fester Tiefe, die Anzeigen sitzen mit Rand darin und
// bewegen sich nur in sich (aufklappen, aufploppen, schweben). Der Reaktor sitzt tiefer im Raum, genau in der Mitte.
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { ZEICHNER, rahmen, RUNEN, LOKI, RUNEN_SCHRIFT, klemm, phase, weich, raus, zurueck, rauschen, zufall, css, setzeTonQuelle } from './zeichner.js'
import { tonVorbereiten, tonStarten, tonDaten } from './ton.js'
setzeTonQuelle(tonDaten)

// ---------- Grundwerte ----------
const ZEIT = { VISIER: 1.4, VERWANDLUNG: 4.6, DUNKEL: 9.2, EINSCHLAG: 10.5, GRUSS: 12.8, AUS: 23, ENDE: 25 }
const FOV = 30 // senkrechter Blickwinkel; Breite ergibt sich aus 16:3 (drei Bildschirme)
const TAFEL_TIEFE = 9 // Abstand der Anzeigen
const KERN_Z = -12 // Abstand des Reaktors
const REAKTOR_GROESSE = 0.8 // äußerster Ring ≈ 2,5 Einheiten → passt mit Rand auf den mittleren Bildschirm
const EISBLAU = '#5ff3ff'

// Feld eines Bildschirms (0 links, 1 Mitte, 2 rechts) in der Tiefe D: linke Kante, Breite, halbe Höhe
function feld(nr, D, seitenverhaeltnis) {
  const h = D * Math.tan(THREE.MathUtils.degToRad(FOV / 2)), w = h * seitenverhaeltnis, b = (2 * w) / 3
  return { x0: -w + nr * b, b, h }
}

const S = { L: 0, M: 1, R: 2 }
const STANDARD_GROESSE = [0.42, 0.26]
const VARIANTEN = [
  {
    id: '1', name: '1 · Kommandozentrale', akzent: '#ffa640', rahmen: 'ecken', reaktor: 'platten', erscheinen: 'ploppen', klang: 'kommando', gruss: 1,
    beschr: 'Dichte Lagezentrale: links Diagnose (Protokoll, Netzlast, Speicher, Sektoren, Verkäufe), rechts Systemwerte (Tachos, Frequenzen, Radar, Zielerfassung, Phasenbild), 3D-Globus und 3D-Säulen. Ton: Trailer-Wucht mit Metall und Servos.',
    tafeln: [[S.L, 'log', 0.27, 0.80], [S.L, 'graph', 0.73, 0.80], [S.L, 'tabelle', 0.27, 0.50], [S.L, 'hex', 0.73, 0.50], [S.L, 'histo', 0.27, 0.20],
      [S.R, 'tacho', 0.27, 0.80], [S.R, 'spektrum', 0.73, 0.80], [S.R, 'radar', 0.27, 0.50], [S.R, 'ziel', 0.73, 0.50], [S.R, 'oszi', 0.27, 0.20]],
    objekte: [[S.L, 'globus', 0.73, 0.20], [S.R, 'saeulen', 0.73, 0.20]],
  },
  {
    id: '2', name: '2 · Uhrwerk & Mechanik', akzent: '#e8f6ff', rahmen: 'schraegen', reaktor: 'zahnkranz', erscheinen: 'klappen', klang: 'mechanik', gruss: 2,
    beschr: 'Alles dreht und greift ineinander: Zahnräder, Analogzeiger, Rollenzählwerke, Kompass, Ladeinge und echte 3D-Getriebe aus Metall; der Reaktor ist ein Zahnkranz, der im Halbsekundentakt weiterruckt. Ton: Zahnräder, Ratschen, Hydraulik, schwere Metallschläge.',
    tafeln: [[S.L, 'zahnraeder', 0.27, 0.80], [S.L, 'zeiger', 0.73, 0.80], [S.L, 'rollzaehler', 0.73, 0.50], [S.L, 'kompass', 0.27, 0.20], [S.L, 'ladering', 0.73, 0.20],
      [S.R, 'zeiger', 0.27, 0.80], [S.R, 'zahnraeder', 0.73, 0.80], [S.R, 'tacho', 0.27, 0.50], [S.R, 'ladering', 0.27, 0.20], [S.R, 'rollzaehler', 0.73, 0.20]],
    objekte: [[S.L, 'getriebe', 0.27, 0.50], [S.R, 'getriebe', 0.73, 0.50]],
  },
  {
    id: '3', name: '3 · Holo-Taktik', akzent: '#9effe0', rahmen: 'ecken', reaktor: 'holo', erscheinen: 'scannen', klang: 'energie', gruss: 3,
    beschr: 'Hologramm-Lagetisch: Geländescan, Schaltkreise, Doppelhelix, Energiefluss, Korrelationsmatrix, schwebende Drahtgitter-Objekte und ein Laserscanner über alle drei Bildschirme; der Reaktor ist ein Hologramm. Ton: elektromagnetische Felder, Plasma, Energie, digitale Störungen.',
    tafeln: [[S.L, 'gelaende', 0.50, 0.80, 0.90, 0.28], [S.L, 'schaltplan', 0.27, 0.48], [S.L, 'helix', 0.50, 0.17, 0.90, 0.22],
      [S.R, 'ziel', 0.27, 0.80], [S.R, 'balkenwand', 0.73, 0.80], [S.R, 'matrix', 0.73, 0.48], [S.R, 'gelaende', 0.50, 0.17, 0.90, 0.22]],
    objekte: [[S.L, 'knoten', 0.73, 0.48], [S.R, 'explosion', 0.27, 0.48]],
  },
  {
    id: '4', name: '4 · Runen-Ritual', akzent: '#d4ecff', rahmen: 'flecht', reaktor: 'runen', erscheinen: 'brennen', klang: 'ritual', gruss: 4,
    beschr: 'Wikinger × Sci-Fi am stärksten: große Runenkreise, der Weltenbaum Yggdrasil als wachsender Datenbaum, Runenschrift, Kompass; um den Reaktor kreisen leuchtende Runensteine. Ton: Gong, Kriegstrommeln aus Metall und Fässern, tiefe Hörner, dann Sci-Fi-Einschlag.',
    tafeln: [[S.L, 'runenkreis', 0.30, 0.66, 0.50, 0.50], [S.L, 'baum', 0.77, 0.66, 0.38, 0.50], [S.L, 'runen', 0.50, 0.18, 0.90, 0.24],
      [S.R, 'baum', 0.23, 0.66, 0.38, 0.50], [S.R, 'kompass', 0.70, 0.66, 0.50, 0.50], [S.R, 'ladering', 0.27, 0.18], [S.R, 'herz', 0.73, 0.18]],
    objekte: [],
  },
]
// mittlerer Bildschirm, für alle gleich: Uhr oben, Stimme unten, vier kleine Anzeigen in den Ecken (außerhalb des Reaktors)
const MITTE = [[S.M, 'uhr', 0.5, 0.95, 0.62, 0.085], [S.M, 'welle', 0.5, 0.05, 0.56, 0.085],
  [S.M, 'mini', 0.12, 0.80, 0.20, 0.13], [S.M, 'mini', 0.88, 0.80, 0.20, 0.13], [S.M, 'mini', 0.12, 0.20, 0.20, 0.13], [S.M, 'mini', 0.88, 0.20, 0.20, 0.13]]

// ---------- Hilfen ----------
function leinwand(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4
  return { c, g: c.getContext('2d'), tex }
}
function leucht(map, deckkraft = 1, farbe = 0xffffff) {
  return new THREE.MeshBasicMaterial({ map, color: farbe, transparent: true, opacity: deckkraft, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
}
function glanz(farbe) {
  const { g, tex } = leinwand(256, 256), v = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  v.addColorStop(0, 'rgba(255,255,255,1)'); v.addColorStop(0.15, farbe); v.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = v; g.fillRect(0, 0, 256, 256); tex.needsUpdate = true; return tex
}
const KornShader = {
  uniforms: { tDiffuse: { value: null }, zeit: { value: 0 }, staerke: { value: 0.02 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float zeit; uniform float staerke; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + zeit*43.0) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = (vUv - 0.5) * vec2(2.4, 1.0);
      c.rgb *= mix(0.6, 1.0, smoothstep(1.2, 0.3, length(d))); c.rgb += (hash(vUv * 1000.0) - 0.5) * staerke; gl_FragColor = c; }`,
}

// ---------- Szene ----------
const buehne = document.getElementById('buehne')
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.outputColorSpace = THREE.SRGBColorSpace
buehne.prepend(renderer.domElement)
const kamera = new THREE.PerspectiveCamera(FOV, 16 / 3, 0.05, 400)
let szene, teile, composer, bloom, farbsaum, korn, umgebung

function bauen(v) {
  if (szene) aufraeumen()
  szene = new THREE.Scene()
  szene.background = new THREE.Color('#01070c')
  szene.fog = new THREE.FogExp2('#01070c', 0.011)
  umgebung = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture
  teile = { v, tafeln: [], objekte: [], platten: [], boegen: [], steine: [] }
  const haupt = new THREE.Color(EISBLAU), akzent = new THREE.Color(v.akzent)
  teile.farben = { haupt, akzent }

  // --- Anzeigen (je Bildschirm verankert; Gruppe = Platz und Größe, Fläche darin = Bewegung)
  ;[...v.tafeln, ...MITTE].forEach(([bild, art, u, vv, bw, bh], i) => {
    bw = bw ?? STANDARD_GROESSE[0]; bh = bh ?? STANDARD_GROESSE[1]
    const verh = (bw * (16 / 3)) / (3 * bh) // Breite : Höhe der Fläche
    const pw = verh > 3 ? 2048 : 640, ph = Math.max(48, Math.round(pw / verh))
    const { c, g, tex } = leinwand(pw, ph)
    const gruppe = new THREE.Group(), flaeche = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), leucht(tex, 0))
    const glas = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x06121a, transparent: true, opacity: 0, depthWrite: false }))
    glas.position.z = -0.01; flaeche.add(glas); gruppe.add(flaeche); szene.add(gruppe)
    const start = bild === S.M ? ZEIT.VISIER + 2.2 + i * 0.05 : ZEIT.VISIER + 0.15 + (i % 10) * 0.24
    teile.tafeln.push({ bild, art, u, v: vv, bw, bh, gruppe, flaeche, glas, c, g, tex, start, nr: i, ohneRahmen: ['uhr', 'welle', 'mini'].includes(art) })
  })
  // --- 3D-Objekte in freien Plätzen der Außenbildschirme
  v.objekte.forEach(([bild, art, u, vv]) => { const o = objektBauen(art, haupt, akzent); szene.add(o); teile.objekte.push({ bild, art, u, v: vv, o }) })

  // --- Reaktor in der Mitte
  const reaktor = new THREE.Group(); reaktor.position.set(0, 0, KERN_Z); reaktor.scale.setScalar(REAKTOR_GROESSE); szene.add(reaktor); teile.reaktor = reaktor
  const kernLicht = new THREE.PointLight(haupt, 0, 30, 1.6); reaktor.add(kernLicht); teile.kernLicht = kernLicht
  const fuell = new THREE.DirectionalLight(0xffffff, 0.5); fuell.position.set(3, 5, 4); szene.add(fuell); szene.add(new THREE.AmbientLight(0x223344, 0.3))
  const kern = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); reaktor.add(kern); teile.kern = kern
  const gluehen = new THREE.Sprite(new THREE.SpriteMaterial({ map: glanz(EISBLAU), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); reaktor.add(gluehen); teile.gluehen = gluehen
  // Vegvisir im Kern
  const st = leinwand(512, 512); st.g.translate(256, 256); st.g.strokeStyle = '#fff'; st.g.lineWidth = 7; st.g.lineCap = 'round'
  for (let k = 0; k < 8; k++) { st.g.rotate(Math.PI / 4); st.g.beginPath(); st.g.moveTo(0, 40); st.g.lineTo(0, 210); st.g.moveTo(-26, 150 + (k % 2) * 25); st.g.lineTo(26, 150 + (k % 2) * 25); if (k % 2) { st.g.moveTo(-18, 200); st.g.lineTo(0, 182); st.g.lineTo(18, 200) } else { st.g.moveTo(0, 210); st.g.arc(0, 196, 14, -Math.PI / 2, Math.PI * 1.5) } st.g.stroke() }
  st.tex.needsUpdate = true
  teile.stab = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), leucht(st.tex, 0, haupt)); teile.stab.position.z = 0.5; reaktor.add(teile.stab)
  // Runenring (Textur je Bild neu)
  const rr = leinwand(1024, 1024); teile.runenRing = { mesh: new THREE.Mesh(new THREE.PlaneGeometry(5.0, 5.0), leucht(rr.tex, 0)), ...rr }; teile.runenRing.mesh.position.z = 0.25; reaktor.add(teile.runenRing.mesh)
  // Skalenring
  const sk = leinwand(1024, 1024); sk.g.translate(512, 512); sk.g.strokeStyle = '#fff'
  for (let k = 0; k < 180; k++) { const a = (k / 180) * Math.PI * 2, l = k % 15 === 0 ? 40 : k % 5 === 0 ? 24 : 12; sk.g.lineWidth = k % 15 === 0 ? 5 : 2; sk.g.beginPath(); sk.g.moveTo(Math.cos(a) * 470, Math.sin(a) * 470); sk.g.lineTo(Math.cos(a) * (470 - l), Math.sin(a) * (470 - l)); sk.g.stroke() }
  sk.g.lineWidth = 3; sk.g.beginPath(); sk.g.arc(0, 0, 500, 0, 7); sk.g.stroke(); sk.tex.needsUpdate = true
  teile.skala = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 6.0), leucht(sk.tex, 0, haupt)); reaktor.add(teile.skala)
  teile.kreisel = [0, 1, 2].map((k) => { const m = new THREE.Mesh(new THREE.TorusGeometry(2.2 + k * 0.18, 0.012, 8, 160), leucht(null, 0, k === 1 ? akzent : haupt)); reaktor.add(m); return m })
  reaktorTeile(v.reaktor, reaktor, haupt, akzent)
  for (let i = 0; i < 8; i++) { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 12 }, () => new THREE.Vector3())), new THREE.LineBasicMaterial({ color: haupt, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false })); reaktor.add(l); teile.boegen.push(l) }
  teile.welle = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 160), leucht(null, 0, haupt)); reaktor.add(teile.welle)

  // --- Lichtlinie, Sterne/Warp, Boden, Scanner (Holo)
  teile.linie = new THREE.Mesh(new THREE.PlaneGeometry(40, 0.035), leucht(null, 0, haupt)); teile.linie.position.set(0, 0, -8); szene.add(teile.linie)
  teile.blitz = new THREE.Sprite(new THREE.SpriteMaterial({ map: glanz(EISBLAU), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0 })); teile.blitz.scale.set(6, 0.6, 1); teile.blitz.position.z = -7.9; szene.add(teile.blitz)
  const n = 3000, pos = new Float32Array(n * 3), zs = zufall(5)
  for (let i = 0; i < n; i++) { pos[i * 3] = (zs() - 0.5) * 120; pos[i * 3 + 1] = (zs() - 0.5) * 40; pos[i * 3 + 2] = -14 - zs() * 80 }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  teile.sterne = new THREE.Points(sg, new THREE.PointsMaterial({ color: haupt, size: 0.07, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); szene.add(teile.sterne)
  const sp = new Float32Array(500 * 6), stg = new THREE.BufferGeometry(); stg.setAttribute('position', new THREE.BufferAttribute(sp, 3))
  teile.streifen = new THREE.LineSegments(stg, new THREE.LineBasicMaterial({ color: haupt, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false }))
  teile.streifen.userData.saat = Array.from({ length: 500 }, () => ({ x: (zs() - 0.5) * 50, y: (zs() - 0.5) * 18, z: -14 - zs() * 70 })); szene.add(teile.streifen)
  teile.boden = new THREE.GridHelper(240, 120, haupt, haupt); teile.boden.position.y = -6; Object.assign(teile.boden.material, { transparent: true, opacity: 0, blending: THREE.AdditiveBlending }); szene.add(teile.boden)
  // (kein großer Hintergrundring mehr – er lief über die Bildschirmgrenzen und wirkte wie ein Teil des Reaktors)
  if (v.reaktor === 'holo') { teile.scanner = new THREE.Mesh(new THREE.PlaneGeometry(60, 0.05), leucht(null, 0, akzent)); teile.scanner.position.z = -10; szene.add(teile.scanner) }

  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(szene, kamera))
  bloom = new UnrealBloomPass(new THREE.Vector2(1024, 192), 0.8, 0.45, 0.32); composer.addPass(bloom)
  farbsaum = new ShaderPass(RGBShiftShader); farbsaum.uniforms.amount.value = 0.001; composer.addPass(farbsaum)
  korn = new ShaderPass(KornShader); composer.addPass(korn)
  composer.addPass(new OutputPass())
  groesse()
}

function metall(farbe = '#9fb3c2') {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(farbe).multiplyScalar(0.55), metalness: 1, roughness: 0.36, envMap: umgebung, envMapIntensity: 0.1 })
}
function zahnradForm(r, zaehne, tiefe = 0.12) {
  const s = new THREE.Shape()
  for (let i = 0; i < zaehne * 4; i++) { const a = (i / (zaehne * 4)) * Math.PI * 2, rr = i % 4 < 2 ? r : r - tiefe; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr) }
  const loch = new THREE.Path(); loch.absarc(0, 0, r * 0.35, 0, Math.PI * 2, true); s.holes.push(loch); return s
}

// Mitte des Reaktors je nach Variante: Metallplatten, Zahnkranz, Hologramm-Splitter, Runensteine
function reaktorTeile(art, reaktor, haupt, akzent) {
  const z = zufall(9)
  teile.metall = metall()
  const platte = (geo, mat, i, anzahl, takt) => {
    const m = new THREE.Mesh(geo, mat)
    const kante = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), new THREE.LineBasicMaterial({ color: haupt, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false }))
    m.add(kante)
    // Anflug aus der Tiefe, innerhalb des mittleren Bildschirms
    const w = (i / anzahl) * Math.PI * 2
    m.userData = { kante, start: new THREE.Vector3(Math.cos(w) * 3, Math.sin(w) * 2, -26 - z() * 10), drehung: new THREE.Euler(z() * 6, z() * 6, z() * 6), takt: takt ?? ZEIT.VERWANDLUNG + 0.3 + i * (3.3 / anzahl), mitte: w }
    reaktor.add(m); teile.platten.push(m)
  }
  if (art === 'platten' || art === 'runen') {
    for (let i = 0; i < 10; i++) {
      const a0 = (i / 10) * Math.PI * 2 + 0.03, a1 = a0 + Math.PI / 5 - 0.06, f = new THREE.Shape(); f.absarc(0, 0, 1.75, a0, a1, false); f.absarc(0, 0, 1.08, a1, a0, true)
      const geo = new THREE.ExtrudeGeometry(f, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2, curveSegments: 12 }); geo.translate(0, 0, -0.11)
      platte(geo, teile.metall, i, 10)
    }
  }
  if (art === 'zahnkranz') {
    // großer Zahnkranz + inneres Zahnrad + Speichen; ruckt im Halbsekundentakt wie ein Uhrwerk
    const aussen = new THREE.ExtrudeGeometry(zahnradForm(1.85, 48, 0.14), { depth: 0.2, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 1, curveSegments: 4 }); aussen.translate(0, 0, -0.1)
    platte(aussen, teile.metall, 0, 2, ZEIT.VERWANDLUNG + 0.4)
    const innen = new THREE.ExtrudeGeometry(zahnradForm(1.0, 20, 0.12), { depth: 0.24, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 1, curveSegments: 4 }); innen.translate(0, 0, -0.12)
    platte(innen, teile.metall, 1, 2, ZEIT.VERWANDLUNG + 2.2)
    teile.speichen = []
    for (let k = 0; k < 6; k++) { const geo = new THREE.BoxGeometry(0.08, 0.95, 0.1); geo.translate(0, 0.62, 0); const m = new THREE.Mesh(geo, teile.metall); m.visible = false; reaktor.add(m); teile.speichen.push(m) }
  }
  if (art === 'holo') {
    // durchscheinende Lichtsplitter + Drahtgitter-Kugel
    for (let i = 0; i < 14; i++) {
      const geo = new THREE.CylinderGeometry(0.32, 0.32, 0.05, 6); geo.rotateX(Math.PI / 2)
      const w = (i / 14) * Math.PI * 2; geo.translate(Math.cos(w) * 1.45, Math.sin(w) * 1.45, 0)
      platte(geo, new THREE.MeshBasicMaterial({ color: haupt, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), i, 14)
    }
    teile.holoKugel = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), new THREE.MeshBasicMaterial({ color: haupt, wireframe: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false })); reaktor.add(teile.holoKugel)
  }
  if (art === 'runen') {
    // 12 leuchtende Runensteine kreisen in einem geneigten Ring
    const ring = new THREE.Group(); ring.rotation.x = 1.15; reaktor.add(ring); teile.steinRing = ring
    for (let i = 0; i < 12; i++) {
      const { g, tex } = leinwand(128, 160)
      g.fillStyle = 'rgba(255,255,255,0.10)'; g.beginPath(); g.moveTo(20, 10); g.lineTo(108, 18); g.lineTo(116, 150); g.lineTo(14, 144); g.closePath(); g.fill()
      g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#fff'; g.font = `96px ${RUNEN_SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle'
      g.fillText(i % 3 === 0 ? LOKI[(i / 3) % 4] : RUNEN[(i * 7) % RUNEN.length], 64, 84); tex.needsUpdate = true
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), leucht(tex, 0, i % 3 === 0 ? akzent : haupt)); const w = (i / 12) * Math.PI * 2
      m.position.set(Math.cos(w) * 2.35, Math.sin(w) * 2.35, 0); ring.add(m); teile.steine.push(m)
    }
  }
}

function objektBauen(art, haupt, akzent) {
  const g = new THREE.Group()
  const draht = (geo, farbe = haupt, deck = 0.25) => new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: farbe, wireframe: true, transparent: true, opacity: deck, blending: THREE.AdditiveBlending, toneMapped: false }))
  if (art === 'globus') {
    g.add(draht(new THREE.IcosahedronGeometry(1, 1), haupt, 0.16))
    for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.3 + k * 0.18, 0.008, 6, 96), leucht(null, 0.45, k === 1 ? akzent : haupt)); r.rotation.x = 1.2 + k * 0.4; r.rotation.y = k; g.add(r) }
  }
  if (art === 'saeulen') {
    for (let i = 0; i < 7; i++) for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1, 0.18), new THREE.MeshBasicMaterial({ color: (i + k) % 5 ? haupt : akzent, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, toneMapped: false })); b.position.set((i - 3) * 0.3, 0, (k - 1) * 0.3); b.userData.nr = i * 3 + k; g.add(b) }
  }
  if (art === 'getriebe') {
    const mat = metall('#b8c8d4')
    ;[[1.0, 24, 0, 0], [0.62, 15, 1.52, 0.35], [0.4, 10, -0.15, -1.33]].forEach(([r, zz, x, y], i) => {
      const geo = new THREE.ExtrudeGeometry(zahnradForm(r, zz, 0.1), { depth: 0.18, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 1, curveSegments: 3 })
      const m = new THREE.Mesh(geo, mat); m.position.set(x - 0.4, y + 0.3, 0); m.userData = { r, richtung: i % 2 ? -1 : 1 }
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({ color: haupt, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, toneMapped: false })))
      g.add(m)
    })
    g.userData.metall = mat
  }
  if (art === 'knoten') g.add(draht(new THREE.TorusKnotGeometry(0.75, 0.22, 90, 8, 2, 3), haupt, 0.1))
  if (art === 'explosion') {
    // Explosionszeichnung des Reaktors: Ringe auseinandergezogen auf einer Achse
    for (let k = 0; k < 5; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.9 - k * 0.12, 0.012, 6, 64), leucht(null, 0.3, k % 2 ? akzent : haupt)); r.position.z = (k - 2) * 0.45; g.add(r) }
    const achse = draht(new THREE.CylinderGeometry(0.25, 0.25, 2.2, 8, 4), haupt, 0.12); achse.rotation.x = Math.PI / 2; g.add(achse)
  }
  g.userData.art = art
  return g
}

function aufraeumen() {
  szene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { x.map?.dispose?.(); x.dispose?.() }) })
  composer?.dispose?.()
}

// Nachmessen: Ecken der Anzeige auf den Bildschirm projizieren; ragt sie über ihren Bildschirm (Drehung zum Betrachter
// und Weitwinkel vergrößern die äußere Kante), wird sie um ihren festen Platz verkleinert – mit Rand,
// der auch das kurze Überschwingen beim Aufploppen abdeckt (Vorgabe Auftraggeber: nichts ragt über den Rand).
const GRENZEN = [[-1, -1 / 3], [-1 / 3, 1 / 3], [1 / 3, 1]]
const RAND_X = 0.03, RAND_Y = 0.06 // in Bildschirm-Einheiten (NDC): ≈ 4,5 % Breite eines Bildschirms, 3 % Höhe
function einpassen(ta) {
  kamera.position.set(0, 0, 0); kamera.rotation.set(0, 0, 0); kamera.updateMatrixWorld(true)
  const [a, b] = GRENZEN[ta.bild], p = new THREE.Vector3()
  for (let runde = 0; runde < 30; runde++) {
    ta.gruppe.updateMatrixWorld(true)
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
    for (const [x, y] of [[-0.55, -0.55], [0.55, -0.55], [0.55, 0.55], [-0.55, 0.55]]) { // 10 % Reserve für Überschwingen
      p.set(x, y, 0); ta.gruppe.localToWorld(p); p.project(kamera)
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y)
    }
    const zuViel = Math.max(a + RAND_X - x0, x1 - (b - RAND_X), -1 + RAND_Y - y0, y1 - (1 - RAND_Y))
    if (zuViel <= 0) return
    // nur verkleinern, Platz bleibt – so bleibt jede Anzeige in ihrer Zelle und nichts überlappt
    ta.gruppe.scale.multiplyScalar(0.96)
  }
}

// Anzeigen und Objekte in ihr Bildschirmfeld setzen (nach jeder Größenänderung)
function platzieren() {
  const sv = kamera.aspect
  teile.tafeln.forEach((ta) => {
    const f = feld(ta.bild, TAFEL_TIEFE, sv), x = f.x0 + ta.u * f.b, y = -f.h + ta.v * 2 * f.h
    ta.gruppe.position.set(x, y, -TAFEL_TIEFE)
    // leicht zur Mitte gedreht (Visier); die Drehung macht die Fläche schmaler, sie bleibt sicher im Feld
    ta.gruppe.rotation.set(-y / TAFEL_TIEFE * 0.35, -Math.atan2(x, TAFEL_TIEFE) * 0.55, 0, 'YXZ')
    ta.gruppe.scale.set(ta.bw * f.b, ta.bh * 2 * f.h, 1)
    einpassen(ta)
  })
  teile.objekte.forEach((ob) => {
    const f = feld(ob.bild, TAFEL_TIEFE + 1, sv), x = f.x0 + ob.u * f.b, y = -f.h + ob.v * 2 * f.h
    ob.o.position.set(x, y, -(TAFEL_TIEFE + 1)); ob.groesse = Math.min(STANDARD_GROESSE[0] * f.b, STANDARD_GROESSE[1] * 2 * f.h) * (ob.art === 'getriebe' ? 0.27 : 0.36)
  })
}

// ---------- Ablauf je Bild ----------
let wechsel = 0
function bild(t) {
  const v = teile.v, { haupt, akzent } = teile.farben, weiss = new THREE.Color(1, 1, 1), T = ZEIT
  const fb = { haupt, akzent }
  const aus = 1 - phase(t, T.AUS, T.ENDE)
  renderer.toneMappingExposure = 1.05 * aus + 0.0001
  const dunkel = t >= T.DUNKEL && t < T.EINSCHLAG
  // feste Kamera; nur beim Einschlag ein kurzer, kleiner Ruck
  const ruck = t > T.EINSCHLAG && t < T.EINSCHLAG + 1 ? (1 - phase(t, T.EINSCHLAG, T.EINSCHLAG + 1)) ** 2 * 0.006 : 0
  kamera.position.set(0, 0, 0); kamera.rotation.set(Math.sin(t * 70) * ruck, Math.cos(t * 55) * ruck, 0)

  // Lichtlinie
  const lp = raus(phase(t, 0.15, 1.3)), la = 1 - phase(t, 1.6, 2.6)
  teile.linie.scale.x = Math.max(0.001, lp); teile.linie.material.opacity = la
  teile.blitz.position.x = -20 + 40 * lp; teile.blitz.material.opacity = la * (lp < 1 ? 1 : 0.4)

  // Anzeigen: erscheinen (je Variante anders), schweben leicht, klappen im Dunkel weg, kommen nach dem Einschlag zurück
  wechsel = (wechsel + 1) % 2
  teile.tafeln.forEach((ta, i) => {
    const an1 = phase(t, ta.start, ta.start + 0.55), weg = phase(t, T.DUNKEL - 0.45 + (i % 6) * 0.04, T.DUNKEL + 0.1 + (i % 6) * 0.04)
    const s2 = T.EINSCHLAG + 0.45 + (i % 12) * 0.08, an2 = phase(t, s2, s2 + 0.7)
    const an = t < T.EINSCHLAG ? an1 : an2
    let sx = 1, sy = 1, rx = 0, deck = an
    if (v.erscheinen === 'ploppen') { const p = Math.min(1.08, zurueck(an)); sx = sy = Math.max(0.001, p) }
    if (v.erscheinen === 'klappen') { rx = (1 - zurueck(an)) * -1.45 }
    if (v.erscheinen === 'scannen') { sy = Math.max(0.001, raus(an)); if (an < 1 && Math.random() < 0.3) deck *= 0.2 }
    if (v.erscheinen === 'brennen') { deck = weich(an) * (an < 1 ? 0.6 + 0.4 * Math.random() : 1); sx = sy = 0.94 + 0.06 * an }
    if (an > 0 && an < 1 && v.erscheinen !== 'brennen' && Math.random() < 0.25) deck *= 0.3
    if (t >= T.DUNKEL - 0.5 && t < T.EINSCHLAG) { sy *= Math.max(0.02, 1 - weich(weg)); deck *= 1 - weg }
    ta.flaeche.scale.set(sx, sy, 1); ta.flaeche.rotation.x = rx; ta.flaeche.position.y = Math.sin(t * 0.9 + i) * 0.012
    ta.flaeche.material.opacity = deck * aus; ta.glas.material.opacity = 0.4 * deck * aus
    if (deck > 0.01 && (i % 2 === wechsel || ta.art === 'welle' || ta.art === 'uhr')) {
      const { g, c } = ta
      g.clearRect(0, 0, c.width, c.height)
      if (!ta.ohneRahmen) rahmen(g, c.width, c.height, fb, v.rahmen)
      ZEICHNER[ta.art](g, c.width, c.height, t, fb, ta.nr)
      ta.tex.needsUpdate = true
    }
  })
  // 3D-Objekte
  teile.objekte.forEach((ob, k) => {
    const s1 = T.VISIER + 1.6 + k * 0.3, an = t < T.EINSCHLAG ? phase(t, s1, s1 + 0.7) * (1 - phase(t, T.DUNKEL - 0.4, T.DUNKEL)) : phase(t, T.EINSCHLAG + 0.9, T.EINSCHLAG + 1.6)
    ob.o.scale.setScalar(Math.max(0.0001, zurueck(an) * ob.groesse * aus))
    if (ob.art === 'globus') { ob.o.rotation.y = t * 0.5; ob.o.children.forEach((c, i) => { if (i) c.rotation.z = t * (0.3 + i * 0.2) }) }
    if (ob.art === 'saeulen') { ob.o.rotation.set(0.35, Math.sin(t * 0.4) * 0.5, 0); ob.o.children.forEach((b) => { const hh = 0.3 + 1.2 * (rauschen(b.userData.nr * 0.9 + t * 1.4) + 1.75) / 3.5; b.scale.y = hh; b.position.y = hh / 2 - 0.8 }) }
    if (ob.art === 'getriebe') { ob.o.children.forEach((m) => { if (m.userData.r) m.rotation.z = (t * 0.8 / m.userData.r) * m.userData.richtung }); ob.o.rotation.y = -Math.sign(ob.o.position.x) * 0.5; ob.o.userData.metall.envMapIntensity = 0.18 }
    if (ob.art === 'knoten') ob.o.rotation.set(t * 0.4, t * 0.6, 0)
    if (ob.art === 'explosion') { ob.o.rotation.set(0.6, 0.8 + t * 0.3, 0); ob.o.children.forEach((c, i) => { if (i < 5) c.position.z = (i - 2) * (0.45 + 0.15 * Math.sin(t * 1.2)) }) }
  })

  // Reaktor: kommt aus der Tiefe, Teile setzen sich zusammen, Einschlag, dann lebendig – immer genau in der Mitte
  const glimm = 0.25 * phase(t, T.VISIER, T.VERWANDLUNG), laden = phase(t, T.VERWANDLUNG, T.DUNKEL), nach = phase(t, T.EINSCHLAG, T.EINSCHLAG + 0.4)
  const kraft = dunkel ? 0.05 : t < T.EINSCHLAG ? glimm + 0.5 * laden : 0.9 + 0.1 * Math.sin(t * 6)
  teile.reaktor.position.set(0, 0, KERN_Z - 30 * (1 - weich(phase(t, T.VISIER, T.VERWANDLUNG + 0.6))))
  teile.kern.material.color.copy(weiss).lerp(haupt, 0.35)
  teile.kern.scale.setScalar(dunkel ? 0.12 : 0.3 + kraft * 0.35 + (t > T.EINSCHLAG && t < T.EINSCHLAG + 0.5 ? (1 - phase(t, T.EINSCHLAG, T.EINSCHLAG + 0.5)) * 1.2 : 0))
  teile.gluehen.scale.setScalar(dunkel ? 0.5 : 1.0 + kraft * 1.2 + (t > T.EINSCHLAG ? (1 - phase(t, T.EINSCHLAG, T.EINSCHLAG + 0.6)) ** 2 * 3.5 : 0))
  teile.gluehen.material.opacity = (dunkel ? 0.15 : 0.5) * aus
  teile.kernLicht.intensity = (dunkel ? 0 : 2 + kraft * 7) * aus
  teile.metall.envMapIntensity = (dunkel ? 0.01 : 0.05 + 0.16 * kraft) * aus
  teile.stab.material.opacity = (dunkel ? 0 : Math.max(glimm, nach)) * aus; teile.stab.rotation.z = -t * 0.1
  {
    const { g, tex, mesh } = teile.runenRing
    g.clearRect(0, 0, 1024, 1024); g.save(); g.translate(512, 512); g.font = `64px ${RUNEN_SCHRIFT}`; g.textAlign = 'center'; g.textBaseline = 'middle'
    const zz = zufall(17)
    for (let k = 0; k < 24; k++) {
      const rune = k % 6 === 0 ? LOKI[(k / 6) % 4] : RUNEN[Math.floor(zz() * RUNEN.length)]
      const an = t < T.EINSCHLAG ? 0.35 * laden : klemm((t - T.EINSCHLAG - 0.2 - k * 0.07) * 3), puls = t > T.EINSCHLAG + 3 ? 0.75 + 0.25 * Math.sin(t * 3 - k * 0.6) : 1
      g.save(); g.rotate((k / 24) * Math.PI * 2); g.translate(0, -392); g.fillStyle = css(k % 6 === 0 ? akzent : haupt, an * puls); g.fillText(rune, 0, 0); g.restore()
    }
    g.strokeStyle = css(haupt, 0.6); g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 440, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 345, 0, 7); g.stroke(); g.restore(); tex.needsUpdate = true
    mesh.material.opacity = (dunkel ? 0 : 1) * aus; mesh.rotation.z = t * 0.12
  }
  teile.skala.material.opacity = (dunkel ? 0 : 0.2 + 0.6 * Math.max(laden, nach)) * aus; teile.skala.rotation.z = -t * 0.05
  teile.kreisel.forEach((k, i) => { k.material.opacity = (dunkel ? 0 : Math.max(glimm * 1.5, nach) * 0.8) * aus; k.rotation.x = t * (0.4 + i * 0.25) + i; k.rotation.y = t * (0.3 - i * 0.15) })
  // Zahnkranz ruckt im Halbsekundentakt (wie ein Uhrwerk)
  const ruckWinkel = (s) => { const k = Math.floor(s / 0.5), q = phase(s % 0.5, 0, 0.12); return (k + zurueck(q)) * (Math.PI / 24) }
  teile.platten.forEach((p, i) => {
    const u = p.userData, q = phase(t, u.takt, u.takt + 1.25), qq = zurueck(q)
    const auf = t > T.EINSCHLAG && v.reaktor !== 'zahnkranz' ? Math.sin(phase(t, T.EINSCHLAG, T.EINSCHLAG + 0.9) * Math.PI) * 0.45 : 0
    p.position.set(u.start.x * (1 - qq) + Math.cos(u.mitte) * auf, u.start.y * (1 - qq) + Math.sin(u.mitte) * auf, u.start.z * (1 - qq))
    let dreh = t > T.EINSCHLAG ? t * 0.08 : 0
    if (v.reaktor === 'zahnkranz') dreh = t > u.takt + 1.2 ? (i === 0 ? ruckWinkel(t) : -ruckWinkel(t) * 1.85) : 0
    p.rotation.set(u.drehung.x * (1 - qq), u.drehung.y * (1 - qq), u.drehung.z * (1 - qq) + dreh)
    p.visible = t > u.takt - 0.05
    const einrasten = phase(t, u.takt + 1.0, u.takt + 1.6)
    u.kante.material.opacity = ((einrasten > 0 && einrasten < 1 ? 1 - einrasten : 0) + (dunkel ? 0 : 0.35 * Math.max(laden, nach))) * aus
    if (v.reaktor === 'holo') p.material.opacity = (dunkel ? 0.02 : 0.12 + 0.12 * Math.sin(t * 4 + i)) * aus
  })
  teile.speichen?.forEach((m, k) => { m.visible = t > T.VERWANDLUNG + 2.6; m.rotation.z = (k / 6) * Math.PI * 2 - ruckWinkel(t) * 1.85 })
  if (teile.holoKugel) { teile.holoKugel.material.opacity = (dunkel ? 0 : 0.1 + 0.25 * Math.max(laden, nach)) * aus; teile.holoKugel.rotation.set(t * 0.3, t * 0.5, 0) }
  if (teile.steinRing) {
    teile.steinRing.rotation.z = t * 0.25
    teile.steine.forEach((s, k) => { const an = t < T.EINSCHLAG ? phase(t, T.VERWANDLUNG + k * 0.25, T.VERWANDLUNG + 0.6 + k * 0.25) * (dunkel ? 0 : 0.7) : klemm((t - T.EINSCHLAG - 0.3 - k * 0.1) * 3); s.material.opacity = an * aus; s.lookAt(kamera.position) })
  }
  teile.boegen.forEach((l) => {
    const an = (t > T.VERWANDLUNG + 1.2 && t < T.DUNKEL) || (t > T.EINSCHLAG && t < T.EINSCHLAG + 2) || (t > T.EINSCHLAG + 2 && Math.random() < 0.04)
    l.material.opacity = an && Math.random() < 0.7 ? 0.9 * aus : 0
    if (l.material.opacity) { const a = Math.random() * Math.PI * 2, pk = l.geometry.attributes.position; for (let k = 0; k < 12; k++) { const r = 0.4 + (k / 11) * 0.75, w = k && k < 11 ? 0.12 : 0; pk.setXYZ(k, Math.cos(a) * r + (Math.random() - 0.5) * w, Math.sin(a) * r + (Math.random() - 0.5) * w, 0.15) } pk.needsUpdate = true }
  })
  const sw = phase(t, T.EINSCHLAG, T.EINSCHLAG + 1.6)
  teile.welle.scale.setScalar(0.5 + raus(sw) * 22); teile.welle.material.opacity = sw > 0 && sw < 1 ? (1 - sw) ** 2 * 0.7 : 0

  // Hintergrund (läuft durchgehend über alle drei Bildschirme)
  const warp = weich(phase(t, T.VERWANDLUNG + 1.5, T.DUNKEL - 0.2)) * (1 - phase(t, T.DUNKEL - 0.2, T.DUNKEL))
  teile.sterne.material.opacity = (dunkel ? 0.05 : 0.55) * phase(t, 1, 3) * aus; teile.sterne.position.z = (t * 0.6) % 10
  {
    const s = teile.streifen, pk = s.geometry.attributes.position, tempo = 2 + warp * 60, l = 0.2 + warp * 9
    s.userData.saat.forEach((q, i) => { q.z += tempo * 0.016; if (q.z > -13) q.z -= 70; pk.setXYZ(i * 2, q.x, q.y, q.z); pk.setXYZ(i * 2 + 1, q.x, q.y, q.z - l) })
    pk.needsUpdate = true; s.material.opacity = warp * 0.8 * aus
  }
  teile.boden.material.opacity = (dunkel ? 0 : 0.16 * Math.max(phase(t, 2, 4), nach)) * aus; teile.boden.position.z = (t * 2) % 2
  if (teile.scanner) { teile.scanner.position.y = Math.sin(t * 0.9) * 2.4; teile.scanner.material.opacity = (dunkel ? 0 : 0.22 * Math.max(phase(t, 2, 3), nach)) * aus }

  const schlag = t > T.EINSCHLAG ? (1 - phase(t, T.EINSCHLAG, T.EINSCHLAG + 0.9)) ** 2 : 0
  bloom.strength = 0.75 + 0.35 * laden + 2.2 * schlag
  farbsaum.uniforms.amount.value = 0.001 + 0.012 * schlag + (t > 9 && t < 9.4 ? 0.006 : 0)
  korn.uniforms.zeit.value = t
}

// ---------- Größe, Abspielen ----------
function groesse() {
  // ausgeblendete Seite hat die Größe 0 – dann mit einer Ersatzgröße im richtigen Verhältnis rechnen
  const w = buehne.clientWidth || 1600, h = buehne.clientHeight || 300
  renderer.setSize(w, h, false); kamera.aspect = w / h; kamera.updateProjectionMatrix()
  composer?.setSize(w, h); bloom?.resolution.set(w, h)
  if (teile) platzieren()
}
addEventListener('resize', groesse)
document.addEventListener('fullscreenchange', () => setTimeout(groesse, 50))

let aktuell = VARIANTEN[0], start = null, laeuft = false, tonAus = null
const wahl = document.getElementById('wahl'), knopf = document.getElementById('spielen'), info = document.getElementById('info')
VARIANTEN.forEach((v) => {
  const b = document.createElement('button'); b.textContent = v.name
  b.onclick = () => { stoppen(); aktuell = v; bauen(v); markieren(); standbild() }
  wahl.appendChild(b); v.knopf = b
})
function markieren() { VARIANTEN.forEach((v) => v.knopf.classList.toggle('an', v === aktuell)); info.textContent = aktuell.beschr }
function standbild() { bild(16); composer.render() }
function stoppen() { laeuft = false; start = null; tonAus?.(); tonAus = null; knopf.textContent = '▶ Abspielen' }
knopf.onclick = async () => {
  if (laeuft) { stoppen(); standbild(); return }
  knopf.textContent = '■ Stopp'; laeuft = true; info.textContent = 'Lade Töne …'
  await tonVorbereiten(aktuell.gruss)
  if (!laeuft) return
  info.textContent = aktuell.beschr
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
window.startSequenz = { kamera, teile: () => teile, nurZeichnen: () => composer.render(), bild: (t) => { bild(t); composer.render() }, waehle: (id) => VARIANTEN.find((v) => v.id === id)?.knopf.click(), ZEIT, feld: (nr) => feld(nr, TAFEL_TIEFE, kamera.aspect) }

// Testmodus über alle drei Bildschirme (drei-bildschirme.cjs): ?flaeche&entwurf=1 – startet von selbst,
// Tasten 1–4 wählen und starten neu, Leertaste wiederholt, Esc schließt.
const par = new URLSearchParams(location.search)
if (par.has('flaeche')) {
  document.body.classList.add('flaeche')
  setTimeout(() => {
    groesse()
    VARIANTEN.find((v) => v.id === (par.get('entwurf') || '1'))?.knopf.click()
    knopf.click()
  }, 400)
  addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') { stoppen(); window.close() }
    else if ('1234'.includes(ev.key) && ev.key.length === 1) { VARIANTEN.find((v) => v.id === ev.key).knopf.click(); knopf.click() }
    else if (ev.key === ' ') { stoppen(); knopf.click() }
  })
}
