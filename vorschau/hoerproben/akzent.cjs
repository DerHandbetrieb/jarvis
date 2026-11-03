// Hörproben Akzent (03.11.2026): britische Piper-Stimmen sprechen Deutsch (Lautschrift „de“ über lautschrift.cjs),
// dazu Thorsten mit Gefühlslagen. Aufruf: node vorschau/hoerproben/akzent.cjs <Ordner modelle>
const path = require('node:path')
const fs = require('node:fs')
const { execFileSync } = require('node:child_process')
const sherpa = require('sherpa-onnx-node')

const m = process.argv[2]
const aus = __dirname
const TEXTE = {
  morgen: 'Guten Morgen, Sörr. Es ist sieben Uhr dreißig, und Sie sind tatsächlich schon wach – ich gestehe, ich hatte dagegen gewettet. Draußen sind es vier Grad und Nieselregen, also genau das Wetter, das Emma für einen ausgedehnten Spaziergang hält.',
  frage: 'Selbstverständlich kann ich Ihnen sagen, wie viele Tassen gestern verkauft wurden, Sörr. Es waren vier. Ob das ein Grund zum Feiern ist, überlasse ich Ihrem bemerkenswerten Optimismus.',
}

function stimme(ordner, onnx, sid = 0, kuerzel, akzent) {
  const o = path.join(m, ordner)
  let modell = path.join(o, onnx)
  if (akzent) {
    const kopie = path.join(m, 'akzent', `${ordner}.onnx`)
    fs.mkdirSync(path.dirname(kopie), { recursive: true })
    if (!fs.existsSync(kopie)) execFileSync(process.execPath, [path.join(aus, 'lautschrift.cjs'), modell, kopie, 'de'], { stdio: 'ignore' })
    modell = kopie
  }
  const tts = new sherpa.OfflineTts({ model: { vits: { model: modell, tokens: path.join(o, 'tokens.txt'), dataDir: path.join(o, 'espeak-ng-data'), noiseScale: 0.8, noiseScaleW: 1.0 }, numThreads: 4 }, maxNumSentences: 20 })
  for (const [t, text] of Object.entries(TEXTE)) {
    const a = tts.generate({ text, sid, speed: 0.95, enableExternalBuffer: false })
    sherpa.writeWave(path.join(aus, `${kuerzel}-${t}.wav`), { samples: a.samples, sampleRate: a.sampleRate })
  }
  console.log('fertig', kuerzel, ordner, 'sid', sid)
}

const brit = [['E', 'vits-piper-en_GB-alan-medium', 'en_GB-alan-medium.onnx'], ['F', 'vits-piper-en_GB-northern_english_male-medium', 'en_GB-northern_english_male-medium.onnx'], ['G', 'vits-piper-en_GB-southern_english_male-medium', 'en_GB-southern_english_male-medium.onnx']]
for (const [k, ordner, onnx] of brit) stimme(ordner, onnx, 0, k, true)

// Thorsten mit Gefühlslagen: Sprecher-Nummern aus der Begleitdatei
const em = 'vits-piper-de_DE-thorsten_emotional-medium'
const karte = JSON.parse(fs.readFileSync(path.join(m, em, 'de_DE-thorsten_emotional-medium.onnx.json'), 'utf8')).speaker_id_map
console.log('Gefühlslagen:', JSON.stringify(karte))
for (const [k, gefuehl] of [['J', 'amused'], ['K', 'neutral'], ['L', 'surprised']]) if (gefuehl in karte) stimme(em, 'de_DE-thorsten_emotional-medium.onnx', karte[gefuehl], k, false)
