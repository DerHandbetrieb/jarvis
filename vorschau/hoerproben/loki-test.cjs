// Wie schreibt Whisper „Loki“? (03.11.2026) Die Thorsten-Stimme spricht Sätze mit dem Namen in mehreren Tempi,
// Whisper small (int8) erkennt sie wieder. Nur ein erster Anhaltspunkt – die echte Stimme des Auftraggebers zählt.
// Aufruf: node vorschau/hoerproben/loki-test.cjs <Ordner mit jarvis/-Modellen>
const path = require('node:path')
const sherpa = require('sherpa-onnx-node')

const o = process.argv[2]
const st = path.join(o, 'vits-piper-de_DE-thorsten-high')
const w = path.join(o, 'sherpa-onnx-whisper-small')
const tts = new sherpa.OfflineTts({ model: { vits: { model: path.join(st, 'de_DE-thorsten-high.onnx'), tokens: path.join(st, 'tokens.txt'), dataDir: path.join(st, 'espeak-ng-data') }, numThreads: 4 }, maxNumSentences: 1 })
const erkenner = new sherpa.OfflineRecognizer({
  featConfig: { sampleRate: 16000, featureDim: 80 },
  modelConfig: { whisper: { encoder: path.join(w, 'small-encoder.int8.onnx'), decoder: path.join(w, 'small-decoder.int8.onnx'), language: 'de', task: 'transcribe' }, tokens: path.join(w, 'small-tokens.txt'), numThreads: 4 },
})

const SAETZE = ['Guten Morgen, Loki.', 'Hey Loki, öffne das Lager.', 'Hey Loki.', 'Loki, was steht heute an?', 'Hallo Loki, wie viele Tassen haben wir verkauft?', 'Hey Jarvis, öffne das Lager.']
for (const satz of SAETZE) {
  const gehoert = []
  for (const speed of [0.85, 1.0, 1.15]) {
    const a = tts.generate({ text: satz, sid: 0, speed, enableExternalBuffer: false })
    const mit = new Float32Array(a.samples.length + a.sampleRate / 2)
    mit.set(a.samples)
    const s = erkenner.createStream()
    s.acceptWaveform({ samples: mit, sampleRate: a.sampleRate })
    erkenner.decode(s)
    gehoert.push(erkenner.getResult(s).text.trim())
  }
  console.log(`${satz}  →  ${gehoert.join('  |  ')}`)
}
