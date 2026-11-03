// Selbsttest Jarvis im Windows-Programm: lädt sherpa-onnx in Electron, spricht einen Satz und erkennt ihn wieder.
// Aufruf: npx electron electron/jarvis-test.cjs --user-data-dir=<Ordner mit jarvis/-Modellen>
const { app } = require('electron')
const arg = process.argv.find((a) => a.startsWith('--user-data-dir='))
if (arg) app.setPath('userData', arg.slice(arg.indexOf('=') + 1))
app.whenReady().then(async () => {
  try {
    const j = require('./jarvis.cjs')._test
    const t0 = Date.now()
    await j.vorbereiten((n, a) => process.stdout.write(`\r${n} ${Math.round(a * 100)} %   `))
    console.log('\nbereit nach', Date.now() - t0, 'ms', JSON.stringify(j.status()))
    const a = await j.sprechen('Hey Dschahrwis, öffne das Lager.')
    console.log('gesprochen', a.samples.length, 'Werte bei', a.sampleRate, 'Hz')
    console.log('JARVIS-TEST erkannt:', JSON.stringify(await j.erkennen(a.samples, a.sampleRate)))
    // Lokis eigene Stimme (03.11.2026): laden, einen Satz sprechen, von Whisper wiedererkennen lassen
    const t1 = Date.now()
    j.loki.starten()
    while (j.loki.status().zustand === 'laedt' && Date.now() - t1 < 180_000) await new Promise((w) => setTimeout(w, 500))
    console.log('LOKI-STIMME', JSON.stringify(j.loki.status()), 'nach', Date.now() - t1, 'ms')
    if (j.loki.status().zustand === 'bereit') {
      const t2 = Date.now()
      const l = await j.loki.sprechen('Hey Loki, öffne das Lager. Sehr wohl, Sir.')
      console.log('Loki gesprochen:', (l.samples.length / l.sampleRate).toFixed(1), 's Ton in', Date.now() - t2, 'ms')
      console.log('LOKI-TEST erkannt:', JSON.stringify(await j.erkennen(l.samples, l.sampleRate)))
    }
    // nach dem Ausschalten darf kein Python der Stimme mehr Grafikspeicher belegen (python.exe ist nur ein Starter)
    const smi = (...a) => require('node:child_process').execFileSync('nvidia-smi', [...a, '--format=csv,noheader'], { encoding: 'utf8' })
    const gpu = () => ({
      python: smi('--query-compute-apps=pid,process_name').split(/\r?\n/).filter((z) => /python/i.test(z)),
      belegt: smi('--query-gpu=memory.used').trim(),
    })
    console.log('Grafikkarte vorher:', JSON.stringify(gpu()))
    j.loki.beenden()
    await new Promise((w) => setTimeout(w, 3000))
    console.log('LOKI-BEENDEN Grafikkarte nachher:', JSON.stringify(gpu()), JSON.stringify(j.loki.status()))
  } catch (e) {
    console.log('JARVIS-TEST Fehler:', e && e.stack || e)
  }
  app.quit()
})
