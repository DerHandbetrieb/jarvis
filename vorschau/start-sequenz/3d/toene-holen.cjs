// Holt die Töne der Start-Sequenz aus dem Sonniss-Download (sounds/sonniss, nicht in Git) und wandelt sie mit ffmpeg
// in kleine OGG-Dateien (toene/, ebenfalls nicht in Git). Aufruf aus dem Projektordner:
//   node vorschau/start-sequenz/3d/toene-holen.cjs
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const hier = __dirname
const quelle = path.join(hier, '..', '..', '..', 'sounds', 'sonniss')
const ziel = path.join(hier, 'toene')
const liste = JSON.parse(fs.readFileSync(path.join(hier, 'toene.json'), 'utf8'))
fs.mkdirSync(ziel, { recursive: true })
let fehlt = 0
for (const [name, muster] of Object.entries(liste)) {
  if (name.startsWith('_')) continue
  // „*“ am Ende = Dateiname beginnt so (manche Sonniss-Namen sind sehr lang)
  const ordner = path.join(quelle, path.dirname(muster))
  const anfang = path.basename(muster).replace(/\*$/, '')
  const datei = fs.existsSync(ordner) && fs.readdirSync(ordner).find((d) => d.toLowerCase().endsWith('.wav') && (muster.endsWith('*') ? d.startsWith(anfang) : d === anfang))
  if (!datei) { console.log('FEHLT', name, '→', muster); fehlt++; continue }
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(ordner, datei), '-ac', '2', '-ar', '48000', '-c:a', 'libvorbis', '-q:a', '6', path.join(ziel, `${name}.ogg`)])
  console.log('ok', name)
}
console.log(fehlt ? `${fehlt} fehlen` : 'alle Töne bereit')
