// Jarvis im Windows-Programm (03.11.2026, Wunsch Auftraggeber): Stimme und Spracherkennung laufen lokal auf dem PC,
// kostenlos und ohne Internet (sherpa-onnx, Apache-2.0). Die Modelle lädt das Programm beim ersten Einschalten aus den
// offiziellen sherpa-onnx-Veröffentlichungen auf GitHub in den App-Datenordner:
// - Stimme: Piper „Thorsten high“ (Stimme CC0, Programm GPL-3.0 bzw. sherpa-onnx Apache-2.0)
// - Sprechpausen-Erkennung: Silero VAD (MIT)
// - Spracherkennung: Whisper small, int8 (MIT)
// Lokis eigentliche Stimme (Qwen3-TTS, Probe S) läuft als eigenes Python-Programm (loki.cjs); Piper springt ein, solange
// sie lädt, fehlt oder abstürzt – Loki bleibt nie stumm.
// Die Oberfläche schickt Mikrofon-Ton (16 kHz) über die Brücke; erkannte Sätze gehen als Text zurück.
// Die Oberfläche bekommt nur: Status, Laden, Sprechen, Ton senden, Text-Ereignisse – keinen Datei- oder Programmzugriff.
const { app, ipcMain, net } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { spawn } = require('node:child_process')
const { erstelleLoki } = require('./loki.cjs')

const QUELLE = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/'
const MODELLE = {
  stimme: { datei: 'tts-models/vits-piper-de_DE-thorsten-high.tar.bz2', ordner: 'vits-piper-de_DE-thorsten-high', noetig: ['de_DE-thorsten-high.onnx', 'tokens.txt', 'espeak-ng-data'], mb: 120 },
  vad: { datei: 'asr-models/silero_vad.onnx', einzeln: 'silero_vad.onnx', mb: 1 },
  whisper: { datei: 'asr-models/sherpa-onnx-whisper-small.tar.bz2', ordner: 'sherpa-onnx-whisper-small', noetig: ['small-encoder.int8.onnx', 'small-decoder.int8.onnx', 'small-tokens.txt'], weg: ['small-encoder.onnx', 'small-decoder.onnx', 'test_wavs'], mb: 640 },
}

const ordner = () => path.join(app.getPath('userData'), 'jarvis')
let sherpa = null
let tts = null
let erkenner = null
let vad = null
let laedt = null // laufendes Laden (Promise), damit doppelte Klicks nicht doppelt laden
let fenster = null
let zuhoeren = false

// Lokis Stimme: Python-Umgebung zuerst aus stimme/einrichten.ps1 (%APPDATA%\Jarvis\loki-python), beim Entwickeln auch
// die Test-Umgebung im Projekt (modelle/tts/faster); das Skript liegt im Programm (extraResources) bzw. im Projekt.
const projekt = path.join(__dirname, '..')
const loki = erstelleLoki({
  python: () => [
    path.join(app.getPath('userData'), 'loki-python', 'Scripts', 'python.exe'),
    ...(app.isPackaged ? [] : [path.join(projekt, 'modelle', 'tts', 'faster', 'Scripts', 'python.exe')]),
  ].find((p) => fs.existsSync(p)) ?? null,
  skript: app.isPackaged ? path.join(process.resourcesPath, 'stimme', 'loki_stimme.py') : path.join(projekt, 'stimme', 'loki_stimme.py'),
  starten: spawn,
  // python.exe der uv-Umgebung ist nur ein Starter für das eigentliche Python – ganzen Prozessbaum beenden, sonst bleibt
  // der Grafikspeicher belegt (Prüf-Agent 03.11.2026)
  // nur solange das Programm noch läuft – eine frei gewordene Prozessnummer könnte Windows sonst neu vergeben haben
  toeten: (p) => { if (p.exitCode !== null || p.signalCode !== null) return; if (p.pid) spawn(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'taskkill.exe'), ['/T', '/F', '/PID', String(p.pid)], { windowsHide: true }).on('error', () => p.kill()); else p.kill() },
  log: (...a) => console.log(...a),
})
app.on('will-quit', () => loki.beenden())

function sherpaLaden() {
  if (!sherpa) sherpa = require('sherpa-onnx-node')
  return sherpa
}

/** Modell fertig da? Erst nach vollständigem Laden + Entpacken entsteht die Marke „<name>.fertig“ (Prüf-Agent 03.11.2026) */
function vorhanden(name) {
  return fs.existsSync(path.join(ordner(), `${name}.fertig`))
}

function status() {
  return {
    verfuegbar: true,
    modelle: Object.fromEntries(Object.keys(MODELLE).map((k) => [k, vorhanden(k)])),
    bereit: !!tts && !!erkenner && !!vad,
    zuhoeren,
    groesseMb: Object.values(MODELLE).reduce((s, m) => s + m.mb, 0),
    loki: loki.status(),
  }
}

/**
 * Datei aus den offiziellen Releases laden (mit Fortschritt, 60 s ohne Daten = Abbruch) und Archive mit dem
 * Windows-eigenen tar in einen Zwischenordner entpacken; erst wenn alles da ist, umbenennen und Marke setzen.
 * Bei einem Fehler bleiben keine halben Dateien liegen.
 */
async function herunterladen(name, fortschritt) {
  const m = MODELLE[name]
  const o = ordner()
  fs.mkdirSync(o, { recursive: true })
  const teil = path.join(o, `${name}.teil`)
  const zwischen = path.join(o, `${name}.entpacken`)
  const aufraeumen = () => { fs.rmSync(teil, { force: true }); fs.rmSync(zwischen, { recursive: true, force: true }) }
  aufraeumen()
  const abbruch = new AbortController()
  let wecker = setTimeout(() => abbruch.abort(), 60_000)
  try {
    const r = await net.fetch(QUELLE + m.datei, { signal: abbruch.signal })
    if (!r.ok || !r.body) throw new Error(`Download ${name}: Fehler ${r.status}`)
    const gesamt = Number(r.headers.get('content-length')) || m.mb * 1024 * 1024
    const aus = fs.createWriteStream(teil)
    let schreibfehler = null
    aus.on('error', (e) => { schreibfehler = e; abbruch.abort() })
    let geladen = 0
    let gemeldet = -1
    const leser = r.body.getReader()
    for (;;) {
      const { done, value } = await leser.read()
      if (schreibfehler) throw schreibfehler
      if (done) break
      clearTimeout(wecker); wecker = setTimeout(() => abbruch.abort(), 60_000)
      geladen += value.length
      if (!aus.write(Buffer.from(value))) await new Promise((w) => aus.once('drain', w))
      const prozent = Math.floor((geladen / gesamt) * 100)
      if (prozent !== gemeldet) { gemeldet = prozent; fortschritt(name, Math.min(1, geladen / gesamt)) }
    }
    await new Promise((w, f) => aus.end((e) => (e || schreibfehler ? f(e || schreibfehler) : w())))
    if (m.einzeln) {
      fs.renameSync(teil, path.join(o, m.einzeln))
    } else {
      fs.mkdirSync(zwischen, { recursive: true })
      await new Promise((w, f) => {
        const tar = spawn(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe'), ['-xjf', teil, '-C', zwischen], { windowsHide: true })
        tar.on('error', f)
        tar.on('exit', (code) => (code === 0 ? w() : f(new Error(`Entpacken ${name}: Fehler ${code}`))))
      })
      const quelle = path.join(zwischen, m.ordner)
      for (const datei of m.noetig) if (!fs.existsSync(path.join(quelle, datei))) throw new Error(`Modell ${name} ist unvollständig (${datei} fehlt).`)
      // nicht gebrauchte große Dateien (z. B. Whisper in voller Genauigkeit) gleich wieder löschen – spart Platz
      for (const datei of m.weg ?? []) fs.rmSync(path.join(quelle, datei), { recursive: true, force: true })
      fs.rmSync(path.join(o, m.ordner), { recursive: true, force: true })
      fs.renameSync(quelle, path.join(o, m.ordner))
    }
    fs.writeFileSync(path.join(o, `${name}.fertig`), new Date().toISOString())
  } finally {
    clearTimeout(wecker)
    aufraeumen()
  }
}

/** Modelle laden (falls nötig) und Stimme, Pausen-Erkennung und Spracherkennung starten */
async function vorbereiten(fortschritt) {
  for (const name of Object.keys(MODELLE)) if (!vorhanden(name)) await herunterladen(name, fortschritt)
  const s = sherpaLaden()
  const o = ordner()
  if (!tts) {
    const st = path.join(o, MODELLE.stimme.ordner)
    tts = await s.OfflineTts.createAsync({
      model: { vits: { model: path.join(st, 'de_DE-thorsten-high.onnx'), tokens: path.join(st, 'tokens.txt'), dataDir: path.join(st, 'espeak-ng-data') }, numThreads: 4, provider: 'cpu' },
      maxNumSentences: 1,
    })
  }
  if (!erkenner) {
    const w = path.join(o, MODELLE.whisper.ordner)
    erkenner = await s.OfflineRecognizer.createAsync({
      featConfig: { sampleRate: 16000, featureDim: 80 },
      modelConfig: { whisper: { encoder: path.join(w, 'small-encoder.int8.onnx'), decoder: path.join(w, 'small-decoder.int8.onnx'), language: 'de', task: 'transcribe' }, tokens: path.join(w, 'small-tokens.txt'), numThreads: 4, provider: 'cpu' },
    })
  }
  if (!vad) {
    vad = new s.Vad({ sileroVad: { model: path.join(o, MODELLE.vad.einzeln), threshold: 0.5, minSilenceDuration: 0.6, minSpeechDuration: 0.3, maxSpeechDuration: 15, windowSize: 512 }, sampleRate: 16000, numThreads: 1 }, 30)
  }
}

// Ton kommt in kleinen Stücken; die VAD braucht Blöcke zu 512 Werten
let rest = new Float32Array(0)
let erkennt = Promise.resolve()
function tonAnnehmen(stueck) {
  if (!vad || !erkenner || !zuhoeren) return
  const alles = new Float32Array(rest.length + stueck.length)
  alles.set(rest); alles.set(stueck, rest.length)
  let i = 0
  for (; i + 512 <= alles.length; i += 512) vad.acceptWaveform(alles.subarray(i, i + 512))
  rest = alles.slice(i)
  while (!vad.isEmpty()) {
    const seg = vad.front(false)
    vad.pop()
    // eine halbe Sekunde Stille anhängen – sonst schneidet Whisper das letzte Wort ab (Selbsttest 03.11.2026)
    const samples = new Float32Array(seg.samples.length + 8000)
    samples.set(seg.samples)
    // nacheinander erkennen, damit Sätze in der richtigen Reihenfolge ankommen
    erkennt = erkennt.then(async () => {
      const st = erkenner.createStream()
      st.acceptWaveform({ samples, sampleRate: 16000 })
      const r = await erkenner.decodeAsync(st)
      const text = String(r?.text ?? '').trim()
      if (text && fenster && !fenster.isDestroyed()) fenster.webContents.send('jarvis-erkannt', { text, sekunden: samples.length / 16000 })
    }).catch((e) => console.error('Jarvis-Erkennung:', e))
  }
}

/** Brücke einrichten; nur Anfragen aus dem Hauptfenster werden beantwortet */
function einrichten(hauptfenster, erlaubt) {
  fenster = hauptfenster
  const von = (e) => e.sender === fenster.webContents && erlaubt(e.senderFrame?.url ?? '')
  ipcMain.handle('jarvis-status', (e) => (von(e) ? status() : null))
  ipcMain.handle('jarvis-vorbereiten', async (e) => {
    if (!von(e)) return null
    if (!laedt) laedt = vorbereiten((name, anteil) => { if (!fenster.isDestroyed()) fenster.webContents.send('jarvis-fortschritt', { name, anteil }) }).finally(() => { laedt = null })
    await laedt
    return status()
  })
  // Satz sprechen: mit Lokis Stimme, wenn gewünscht und bereit – sonst (oder bei einem Fehler) mit Piper.
  // text = Originalsatz (Loki spricht englische Wörter selbst), piperText = mit Aussprache-Liste („Sir“ → „Sörr“) für Piper
  ipcMain.handle('jarvis-sprechen', async (e, auftrag) => {
    if (!von(e) || !tts) return null
    const text = String(auftrag?.text ?? '').slice(0, 2000)
    if (auftrag?.stimme === 'loki' && loki.status().zustand === 'bereit') {
      try {
        return { ...(await loki.sprechen(text)), stimme: 'loki' }
      } catch (f) {
        console.error('Loki-Stimme, Piper springt ein:', f.message)
      }
    }
    const speed = Math.min(1.5, Math.max(0.6, Number(auftrag?.tempo) || 0.88))
    const a = await tts.generateAsync({ text: String(auftrag?.piperText || text).slice(0, 2000), sid: 0, speed, enableExternalBuffer: false })
    return { samples: a.samples, sampleRate: a.sampleRate, stimme: 'piper' }
  })
  // Lokis Stimme ein (lädt im Hintergrund, ca. 12 s, 3,4 GB Grafikspeicher) oder aus (gibt den Speicher frei)
  ipcMain.handle('jarvis-stimme', (e, an) => {
    if (!von(e)) return null
    if (an) loki.starten(); else loki.beenden()
    return status()
  })
  ipcMain.on('jarvis-ton', (e, stueck) => {
    if (!von(e) || !(stueck instanceof Float32Array)) return
    tonAnnehmen(stueck)
  })
  // Etappe 2: freie Fragen an das lokale Sprachmodell (Ollama auf diesem PC, http://127.0.0.1:11434). Der Aufruf läuft
  // hier im Hauptprozess (Node), damit die Oberfläche keine Sonderrechte für localhost braucht. Nur Text rein, Text raus.
  ipcMain.handle('jarvis-frage', async (e, anfrage) => {
    if (!von(e)) return null
    const modell = /^[a-z0-9._:-]{1,60}$/i.test(String(anfrage?.modell ?? '')) ? String(anfrage.modell) : 'qwen3:8b'
    const nachrichten = (Array.isArray(anfrage?.nachrichten) ? anfrage.nachrichten : []).slice(-12)
      .map((n) => ({ role: ['system', 'user', 'assistant'].includes(n?.role) ? n.role : 'user', content: String(n?.content ?? '').slice(0, 20000) }))
    try {
      const r = await fetch('http://127.0.0.1:11434/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        // think: false – Qwen3 würde sonst erst lange „nachdenken“ (zu langsam fürs Gespräch); keep_alive: Modell 10 Minuten im Grafikspeicher halten
        body: JSON.stringify({ model: modell, messages: nachrichten, stream: false, think: false, keep_alive: '10m', options: { temperature: 0.6 } }),
        signal: AbortSignal.timeout(60_000),
      })
      if (r.status === 404) return { fehler: 'modell', text: `Das Sprachmodell ${modell} ist noch nicht geladen.` }
      if (!r.ok) return { fehler: 'ollama', text: `Ollama antwortet mit Fehler ${r.status}.` }
      const j = await r.json()
      return { text: String(j?.message?.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim() }
    } catch {
      return { fehler: 'fehlt', text: 'Ollama läuft nicht auf diesem PC.' }
    }
  })
  ipcMain.handle('jarvis-zuhoeren', (e, an) => {
    if (!von(e)) return null
    zuhoeren = !!an
    if (!zuhoeren && vad) { vad.clear(); rest = new Float32Array(0) }
    return status()
  })
}

module.exports = {
  einrichten,
  /** Lokis Stimme beenden (Windows meldet ab / fährt herunter) */
  stimmeBeenden: () => loki.beenden(),
  // nur für den Selbsttest (electron electron/jarvis-test.cjs)
  _test: {
    vorbereiten, status,
    sprechen: async (text) => tts.generateAsync({ text, sid: 0, speed: 0.88, enableExternalBuffer: false }),
    loki,
    erkennen: async (samples, rate) => { const st = erkenner.createStream(); const mit = new Float32Array(samples.length + rate / 2); mit.set(samples); st.acceptWaveform({ samples: mit, sampleRate: rate }); return (await erkenner.decodeAsync(st)).text },
  },
}
