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
  } catch (e) {
    console.log('JARVIS-TEST Fehler:', e && e.stack || e)
  }
  app.quit()
})
