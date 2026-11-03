// Hörproben „Stimme und Charakter“ (03.11.2026): dieselbe Thorsten-Stimme mit verschiedenen Stellschrauben.
// Aufruf: node vorschau/hoerproben/erzeugen.cjs <Ordner mit vits-piper-de_DE-thorsten-high>
// Die Tondateien (.wav) landen neben diesem Skript und kommen nicht in Git.
const path = require('node:path')
const sherpa = require('sherpa-onnx-node')

const st = process.argv[2]
const aus = __dirname

// Stellschrauben (Grundwerte laut de_DE-thorsten-high.onnx.json: noise_scale 0.667, noise_w 0.8, length_scale 1)
// noiseScale = Lebendigkeit der Betonung, noiseScaleW = Lebendigkeit des Rhythmus, speed = Tempo
const VARIANTEN = {
  A: { titel: 'heute (Tempo 0,88, Grundwerte, Satz für Satz)', noiseScale: 0.667, noiseScaleW: 0.8, speed: 0.88, ganz: false },
  B: { titel: 'Tempo 0,95, etwas lebendiger, am Stück', noiseScale: 0.8, noiseScaleW: 1.0, speed: 0.95, ganz: true },
  C: { titel: 'Tempo 1,0, deutlich lebendiger, am Stück', noiseScale: 0.9, noiseScaleW: 1.2, speed: 1.0, ganz: true },
  D: { titel: 'Tempo 0,92, lebendiger Rhythmus, ruhige Betonung, am Stück', noiseScale: 0.7, noiseScaleW: 1.2, speed: 0.92, ganz: true },
}

// Texte im neuen Charakter: durchgehend trocken, britisch, dem Chef gegenüber gespielt skeptisch
const TEXTE = {
  morgen: 'Guten Morgen, Sörr. Es ist sieben Uhr dreißig, und Sie sind tatsächlich schon wach – ich gestehe, ich hatte dagegen gewettet. Draußen sind es vier Grad und Nieselregen, also genau das Wetter, das Emma für einen ausgedehnten Spaziergang hält. Auf Ihrer Liste stehen elf Aufgaben. Zwei davon sind seit gestern neu, was bemerkenswert ist, da ich mich nicht erinnere, dass gestern eine erledigt wurde.',
  frage: 'Selbstverständlich kann ich Ihnen sagen, wie viele Tassen gestern verkauft wurden, Sörr. Es waren vier. Ob das ein Grund zum Feiern ist, überlasse ich Ihrem bemerkenswerten Optimismus.',
  befehl: 'Wie Sie wünschen. Ich öffne das Lager. Ich hätte es zwar für klüger gehalten, zuerst die Bestellungen anzusehen, aber ich bin ja nur der Assistent.',
}

;(async () => {
  for (const [k, v] of Object.entries(VARIANTEN)) {
    const tts = new sherpa.OfflineTts({
      model: { vits: { model: path.join(st, 'de_DE-thorsten-high.onnx'), tokens: path.join(st, 'tokens.txt'), dataDir: path.join(st, 'espeak-ng-data'), noiseScale: v.noiseScale, noiseScaleW: v.noiseScaleW }, numThreads: 4, provider: 'cpu' },
      // am Stück = viele Sätze in einem Durchgang; Satz für Satz = wie heute in der App
      maxNumSentences: v.ganz ? 20 : 1,
    })
    for (const [t, text] of Object.entries(TEXTE)) {
      const a = tts.generate({ text, sid: 0, speed: v.speed, enableExternalBuffer: false })
      sherpa.writeWave(path.join(aus, `${k}-${t}.wav`), { samples: a.samples, sampleRate: a.sampleRate })
    }
    console.log(k, v.titel)
  }
})()
