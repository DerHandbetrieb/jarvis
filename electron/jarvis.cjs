// Jarvis im Windows-Programm (03.11.2026, Wunsch Auftraggeber): Stimme und Spracherkennung laufen lokal auf dem PC,
// kostenlos und ohne Internet (sherpa-onnx, Apache-2.0). Die Modelle lädt das Programm beim ersten Einschalten aus den
// offiziellen sherpa-onnx-Veröffentlichungen auf GitHub in den App-Datenordner:
// - Stimme: Piper „Thorsten high“ (Stimme CC0, Programm GPL-3.0 bzw. sherpa-onnx Apache-2.0)
// - Sprechpausen-Erkennung: Silero VAD (MIT)
// - Spracherkennung: Whisper small, int8 (MIT) – seit 04.11.2026 nur noch Ersatz, siehe Lokis Gehör unten
// Lokis eigentliche Stimme (Qwen3-TTS, Probe S) läuft als eigenes Python-Programm (loki.cjs); Piper springt ein, solange
// sie lädt, fehlt oder abstürzt – Loki bleibt nie stumm.
// Die Oberfläche schickt Mikrofon-Ton (16 kHz) über die Brücke; erkannte Sätze gehen als Text zurück.
// Die Oberfläche bekommt nur: Status, Laden, Sprechen, Ton senden, Text-Ereignisse – keinen Datei- oder Programmzugriff.
const { app, ipcMain, net } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { spawn } = require('node:child_process')
const { erstelleLoki } = require('./loki.cjs')
const { pruefeModell } = require('./modellpruefung.cjs')

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
let vadSchwelle = 0.5 // Empfindlichkeit: höher = nur klare Sprache löst aus (Werkstatt-Lärm), Einstellung in der Oberfläche
let baueVad = null
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
// Lokis Gehör (04.11.2026, Rückmeldung Auftraggeber „versteht mich oft schlecht“, Entscheidung „Ja, einbauen“):
// Whisper large-v3-turbo auf der Grafikkarte (faster-whisper, gehoer/loki_gehoer.py) mit Wortliste – gemessen ca. ein
// Drittel der Fehler von small und 0,11 s je Satz, ca. 1,2 GB Grafikspeicher. Eigene Python-Umgebung aus
// gehoer/einrichten.ps1 (%APPDATA%\Jarvis\gehoer-python), Modell in jarvis\faster-whisper. Whisper small (oben, Prozessor)
// bleibt geladen und springt ein, solange das Gehör lädt, fehlt, gestört ist, ein Vollbild-Spiel läuft oder „Klein“ gewählt ist.
const gehoerModelle = () => path.join(ordner(), 'faster-whisper')
const gehoer = erstelleLoki({
  bezeichnung: 'Das Gehör von L.O.K.I.',
  fehltText: 'Das Gehör von L.O.K.I. ist auf diesem PC nicht eingerichtet (gehoer/einrichten.ps1).',
  python: () => { const p = path.join(app.getPath('userData'), 'gehoer-python', 'Scripts', 'python.exe'); return fs.existsSync(p) ? p : null }, // beim Entwickeln dieselbe Einrichtung
  skript: app.isPackaged ? path.join(process.resourcesPath, 'gehoer', 'loki_gehoer.py') : path.join(projekt, 'gehoer', 'loki_gehoer.py'),
  get noetig() { return [gehoerModelle()] },
  get argumente() { return [gehoerModelle()] },
  starten: spawn,
  toeten: (p) => { if (p.exitCode !== null || p.signalCode !== null) return; if (p.pid) spawn(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'taskkill.exe'), ['/T', '/F', '/PID', String(p.pid)], { windowsHide: true }).on('error', () => p.kill()); else p.kill() },
  log: (...a) => console.log(...a),
})
/** Sprachmodell: Stichproben-Werte laut Qwen3-Modellkarte (Modus ohne Nachdenken), presence_penalty gegen Wiederholungen.
 *  num_ctx 4096 (04.11.2026): Anweisung + Daten + Verlauf sind ca. 2.500 Token; gemessen 5,2 statt 5,9 GB Grafikspeicher –
 *  sonst lagerte Ollama bei vollem Speicher 0,5 GB in den Arbeitsspeicher aus und wurde langsam. Größe steht im gespraech.log. */
const OLLAMA_OPTIONEN = { temperature: 0.7, top_p: 0.8, top_k: 20, min_p: 0, presence_penalty: 1.5, num_ctx: 4096 }
const OLLAMA_HALTEN = '3m' // danach gibt Ollama den Grafikspeicher frei (Wunsch Auftraggeber 04.11.2026)
/** feste Wörter, die Whisper als Hinweis bekommt (Namen und Befehle, die sonst oft falsch ankommen) – eigene aus den Einstellungen dazu */
// Reihenfolge mit Absicht: „Loki“ steht nicht direkt vor einem Befehlswort – ein Echo der Liste ergäbe sonst „Loki, Lage“ (Prüf-Agent)
const GRUNDWORTE = 'Neuigkeiten, Etsy, Amazon, Loki, Freigaben, Werbung, Abarbeiten, Auswertung, Marketing, Lager, Selbsttest, Emma, Öhringen, Carport, Kerzenständer, Lage'
let hoerArt = 'turbo' // turbo = Grafikkarte, klein = Whisper small auf dem Prozessor
let worte = GRUNDWORTE
/** längste Wartezeit je Satz: gemessen 0,11 s im Mittel – großzügig 8 s + 0,5 s je Sekunde Ton (Grafikkarte kann gerade
 *  von Stimme/Sprachmodell belegt sein), danach gilt das Gehör als gestört und small übernimmt */
const hoerZeit = (sekunden) => 8_000 + 500 * sekunden
let spielAktiv = false // während eines Vollbild-Spiels das Gehör nie laden (Prüf-Agent)
app.on('will-quit', () => { loki.beenden(); gehoer.beenden() })

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
    gehoer: { ...gehoer.status(), art: hoerArt },
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
  baueVad = () => new s.Vad({ sileroVad: { model: path.join(o, MODELLE.vad.einzeln), threshold: vadSchwelle, minSilenceDuration: 0.6, minSpeechDuration: 0.3, maxSpeechDuration: 15, windowSize: 512 }, sampleRate: 16000, numThreads: 1 }, 30)
  if (!vad) vad = baueVad()
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
      const { text, art } = await erkennen(samples)
      if (text && fenster && !fenster.isDestroyed()) fenster.webContents.send('jarvis-erkannt', { text, sekunden: samples.length / 16000, art })
    }).catch((e) => console.error('Jarvis-Erkennung:', e))
  }
}

/** Ein Sprachstück (16 kHz) erkennen: mit dem Gehör auf der Grafikkarte, wenn gewählt und bereit – sonst (oder bei einem
 *  Fehler) mit Whisper small. → { text, art: 'turbo' | 'klein' } */
async function erkennen(samples) {
  if (hoerArt === 'turbo' && gehoer.status().zustand === 'bereit') {
    try {
      const ton = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength).toString('base64')
      const d = await gehoer.auftrag({ ton, worte }, hoerZeit(samples.length / 16000))
      const text = String(d?.text ?? '').trim()
      // leer trotz ≥ 1 s Ton (z. B. als Einbildung oder zu unsicher verworfen): small hört zur Sicherheit noch einmal hin,
      // damit L.O.K.I. bei leiser Sprache im Lärm nicht taub wirkt (Prüf-Agent); dessen Floskeln filtert istNachfrage
      if (text || samples.length < 16000 * 1.5) return { text, art: 'turbo' }
    } catch (f) { console.error('Gehör, Whisper small springt ein:', f.message) }
  }
  const st = erkenner.createStream()
  st.acceptWaveform({ samples, sampleRate: 16000 })
  const r = await erkenner.decodeAsync(st)
  return { text: String(r?.text ?? '').trim(), art: 'klein' }
}

// Stimme und Gehör vorübergehend aus – bei einem Vollbild-Spiel (04.11.2026: Grafikspeicher fürs Spiel) oder im
// Abwesenheits-Modus (04.11.2026, Wunsch Auftraggeber: Speicher sparen ohne Qualitätsverlust; 20 min ohne Maus/Tastatur
// und ohne dass er L.O.K.I. angesprochen hat → gemessen 4,9 GB Grafik-, ca. 3 GB Arbeitsspeicher frei). Was dabei aus-
// geschaltet wurde, lädt wieder, sobald weder Spiel noch Abwesenheit gilt – ein gemeinsamer Weg, damit nichts hängen
// bleibt (Prüf-Agent). Nur was lief (bereit/lädt), wird gemerkt – eine gestörte Stimme startet so nicht ungefragt neu.
// Kamera-Wache und Neuigkeiten laufen im Hauptprozess weiter; Whisper small hört weiter zu, Piper spricht solange.
let weg = false
let lokiZurueck = false, gehoerZurueck = false
const laeuft = (z) => z === 'bereit' || z === 'laedt'
function vorlaeufigAus() {
  if (laeuft(loki.status().zustand)) { lokiZurueck = true; loki.beenden() }
  if (laeuft(gehoer.status().zustand)) { gehoerZurueck = true; gehoer.beenden() }
}
function wiederLaden() {
  if (spielAktiv || weg) return
  if (lokiZurueck) { lokiZurueck = false; loki.starten() }
  if (gehoerZurueck) { gehoerZurueck = false; if (hoerArt === 'turbo') gehoer.starten() }
}
async function spielLaeuft(an) {
  if (an) {
    spielAktiv = true
    vorlaeufigAus() // small hört weiter, Piper spricht
    try {
      // geladene Modelle sofort entladen (offizieller Weg: keep_alive 0)
      const r = await fetch('http://127.0.0.1:11434/api/ps', { signal: AbortSignal.timeout(3000) })
      for (const m of (await r.json())?.models ?? []) await fetch('http://127.0.0.1:11434/api/generate', { method: 'POST', body: JSON.stringify({ model: m.name, keep_alive: 0 }), signal: AbortSignal.timeout(10_000) })
    } catch { /* Ollama läuft nicht – nichts zu entladen */ }
  } else { spielAktiv = false; wiederLaden() }
}
function abwesend(an) {
  if (an === weg) return
  weg = an
  if (an) { vorlaeufigAus(); protokoll('Abwesend: Stimme und Gehör beendet (Speicher frei)') }
  else { wiederLaden(); protokoll('Zurück: Stimme und Gehör laden wieder') }
}
/** eine Zeile ins Gesprächs-Protokoll (gespraech.log) aus dem Hauptprozess */
function protokoll(zeile) {
  try {
    const datei = path.join(app.getPath('userData'), 'gespraech.log')
    if (fs.existsSync(datei) && fs.statSync(datei).size > 200_000) fs.renameSync(datei, datei + '.alt')
    fs.appendFileSync(datei, `${new Date().toLocaleString('de-DE')} ${String(zeile).replace(/[\r\n]+/g, ' ').slice(0, 600)}\n`)
  } catch { /* Protokoll ist nur Hilfe */ }
}
// er hat L.O.K.I. angesprochen (Codewort oder Nachfrage) – dann ist er da, auch ohne Maus/Tastatur; Lokis eigene
// Ansagen zählen nicht (sonst hielte eine Neuigkeit ihn „anwesend“, Prüf-Agent)
let zuletztAngesprochen = 0
/** Ruhezeit von Maus/Tastatur (alle 10 s aus vollbild.cjs) → abwesend nach 20 min, zurück bei Bewegung */
function ruheMelden(sekunden) {
  if (!weg && sekunden >= 20 * 60 && Date.now() - zuletztAngesprochen > 20 * 60_000) abwesend(true)
  else if (weg && sekunden < 60) abwesend(false)
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
    // Lokis Stimme lädt noch (auch: kommt gerade aus dem Abwesenheits-Modus zurück): warten statt Ersatzstimme – er soll
    // nur mit seiner richtigen Stimme sprechen (Vorgabe Auftraggeber 06.11.2026). Piper nur bei Spiel oder Störung.
    if (auftrag?.stimme === 'loki') {
      const bis = Date.now() + 180_000
      while ((loki.status().zustand === 'laedt' || (lokiZurueck && !spielAktiv)) && Date.now() < bis) await new Promise((w) => setTimeout(w, 200))
      if (loki.status().zustand === 'laedt' || (lokiZurueck && !spielAktiv)) return null
    }
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
  // Empfindlichkeit des Mikrofons: Schwelle der Sprechpausen-Erkennung (Werkstatt-Lärm)
  ipcMain.handle('jarvis-empfindlichkeit', (e, wert) => {
    if (!von(e)) return null
    const v = Math.min(0.9, Math.max(0.2, Number(wert) || 0.5))
    if (v === vadSchwelle) return status()
    vadSchwelle = v
    if (baueVad && vad) { vad = baueVad(); rest = new Float32Array(0) }
    return status()
  })
  // Lokis Stimme ein (lädt im Hintergrund, ca. 12 s, 3,4 GB Grafikspeicher) oder aus (gibt den Speicher frei)
  ipcMain.handle('jarvis-stimme', (e, an) => {
    if (!von(e)) return null
    // ausdrücklich geschaltet: das Gemerkte gilt nicht mehr (aus bleibt aus – auch nach Spiel/Abwesenheit, Prüf-Agent)
    lokiZurueck = !!an && (spielAktiv || weg)
    if (an && !lokiZurueck) loki.starten(); else if (!an) loki.beenden()
    return status()
  })
  // er hat L.O.K.I. angesprochen → anwesend (auch ohne Maus/Tastatur), aus dem Abwesenheits-Modus zurück
  ipcMain.on('jarvis-nutzer-aktiv', (e) => { if (!von(e)) return; zuletztAngesprochen = Date.now(); if (weg) abwesend(false) })
  // Lokis Gehör: an (lädt im Hintergrund, ca. 5–30 s, ca. 1,2 GB Grafikspeicher) oder aus; art turbo/klein, eigene Wörter
  ipcMain.handle('jarvis-gehoer', (e, a) => {
    if (!von(e)) return null
    hoerArt = a?.art === 'klein' ? 'klein' : 'turbo'
    const eigene = String(a?.worte ?? '').split(/[\n,;]+/).map((w) => w.trim().replace(/[^\p{L}\p{N} .'-]/gu, '').slice(0, 40)).filter(Boolean)
    worte = [GRUNDWORTE, ...eigene].join(', ').slice(0, 400)
    if (a?.nurWorte) return status() // Tippen in der Wortliste: nur die Wörter übernehmen, nichts starten (Prüf-Agent)
    const an = !!a?.an && hoerArt === 'turbo'
    if (spielAktiv || weg) { gehoerZurueck = an; gehoer.beenden(); return status() } // danach lädt es von selbst
    gehoerZurueck = false // ausdrücklich geschaltet
    if (an) gehoer.starten(); else gehoer.beenden()
    return status()
  })
  // Gesprächs-Protokoll (04.11.2026, Rückmeldung „irgendwann hat er nicht mehr geantwortet“): was gehört wurde und was
  // L.O.K.I. damit gemacht hat, nach %APPDATA%\Jarvis\gespraech.log (nur auf diesem PC, höchstens ca. 200 kB, dann neu)
  ipcMain.on('jarvis-protokoll', (e, zeile) => {
    if (!von(e)) return
    try {
      const datei = path.join(app.getPath('userData'), 'gespraech.log')
      if (fs.existsSync(datei) && fs.statSync(datei).size > 200_000) fs.renameSync(datei, datei + '.alt')
      fs.appendFileSync(datei, `${new Date().toLocaleString('de-DE')} ${String(zeile ?? '').replace(/[\r\n]+/g, ' ').slice(0, 600)}\n`)
    } catch { /* Protokoll ist nur Hilfe */ }
  })
  // Spruch-Stand (04.11.2026): wie viele Sprüche je Sammlung noch nie dran waren – Claude füllt danach nach
  ipcMain.on('jarvis-spruch-stand', (e, json) => {
    if (!von(e)) return
    try { JSON.parse(String(json)); fs.writeFileSync(path.join(app.getPath('userData'), 'sprueche-stand.json'), String(json).slice(0, 20000)) } catch { /* nur gültiges JSON */ }
  })
  ipcMain.on('jarvis-ton', (e, stueck) => {
    if (!von(e) || !(stueck instanceof Float32Array)) return
    tonAnnehmen(stueck)
  })
  // Etappe 2: freie Fragen an das lokale Sprachmodell (Ollama auf diesem PC, http://127.0.0.1:11434). Der Aufruf läuft
  // hier im Hauptprozess (Node), damit die Oberfläche keine Sonderrechte für localhost braucht. Nur Text rein, Text raus.
  // Vorwärmen (04.11.2026, Rückmeldung „Grafikspeicher voll, er hakt“): Sobald „Loki“ fällt, lädt das Sprachmodell
  // schon, während die Frage noch gesprochen wird (gemessen: Laden 2,1 s bei freiem Speicher, 7,3 s bei vollem).
  // Gleiche Optionen wie die Frage – sonst lädt Ollama das Modell beim eigentlichen Aufruf noch einmal neu.
  let waermt = null
  ipcMain.on('jarvis-vorwaermen', (e, m) => {
    if (!von(e) || waermt || spielAktiv) return // während eines Vollbild-Spiels nichts in den Grafikspeicher laden (Prüf-Agent)
    const modell = /^[a-z0-9._:-]{1,60}$/i.test(String(m ?? '')) ? String(m) : 'qwen3:8b'
    waermt = fetch('http://127.0.0.1:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: modell, keep_alive: OLLAMA_HALTEN, options: OLLAMA_OPTIONEN }), signal: AbortSignal.timeout(60_000) })
      .then((r) => r.body?.cancel()).catch(() => {}).finally(() => { waermt = null })
  })
  ipcMain.handle('jarvis-frage', async (e, anfrage) => {
    if (!von(e)) return null
    const modell = /^[a-z0-9._:-]{1,60}$/i.test(String(anfrage?.modell ?? '')) ? String(anfrage.modell) : 'qwen3:8b'
    const nachrichten = (Array.isArray(anfrage?.nachrichten) ? anfrage.nachrichten : []).slice(-12)
      .map((n) => ({ role: ['system', 'user', 'assistant'].includes(n?.role) ? n.role : 'user', content: String(n?.content ?? '').slice(0, 20000) }))
    try {
      const r = await fetch('http://127.0.0.1:11434/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        // think: false – Qwen3 würde sonst erst lange „nachdenken“ (zu langsam fürs Gespräch); keep_alive: Modell 3 Minuten im Grafikspeicher halten (Wunsch Auftraggeber 04.11.2026: Speicher schneller freigeben).
        // Stichproben-Werte laut Qwen3-Modellkarte für den Modus ohne Nachdenken (temperature 0.7, top_p 0.8, top_k 20, min_p 0,
        // presence_penalty 1.5 gegen Wiederholungen); num_ctx siehe OLLAMA_OPTIONEN (oben) – Rückmeldung Auftraggeber 04.11.2026: Loki wiederholte im Gespräch seine erste Antwort
        body: JSON.stringify({ model: modell, messages: nachrichten, stream: false, think: false, keep_alive: OLLAMA_HALTEN, options: OLLAMA_OPTIONEN }),
        signal: AbortSignal.timeout(60_000),
      })
      if (r.status === 404) return { fehler: 'modell', text: `Das Sprachmodell ${modell} ist noch nicht geladen.` }
      if (!r.ok) return { fehler: 'ollama', text: `Ollama antwortet mit Fehler ${r.status}.` }
      const j = await r.json()
      return { text: String(j?.message?.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim(), tokens: Number(j?.prompt_eval_count) || 0, ladenS: Math.round((Number(j?.load_duration) || 0) / 1e8) / 10 }
    } catch {
      return { fehler: 'fehlt', text: 'Ollama läuft nicht auf diesem PC.' }
    }
  })
  // Monatliche Modell-Prüfung + Aktualisieren auf Knopfdruck (Wunsch Auftraggeber 04.11.2026)
  const modellName = (m) => (/^[a-z0-9._:/-]{1,60}$/i.test(String(m ?? '')) ? String(m) : 'qwen3:8b')
  ipcMain.handle('jarvis-modell-pruefen', async (e, m) => (von(e) ? pruefeModell(modellName(m)) : null))
  let holtModell = false
  ipcMain.handle('jarvis-modell-holen', async (e, m) => {
    if (!von(e) || holtModell) return null
    holtModell = true
    try {
      // offizieller Weg: Ollama lädt die neue Fassung selbst (POST /api/pull); das alte Modell bleibt bis dahin nutzbar
      // mit stream: true (Fortschrittszeilen) – ohne kämen die Kopfzeilen erst am Ende und fetch bräche nach 5 Minuten ab (Prüf-Agent)
      const r = await fetch('http://127.0.0.1:11434/api/pull', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: modellName(m), stream: true }), signal: AbortSignal.timeout(60 * 60_000) })
      if (!r.ok || !r.body) return { ok: false, text: `Fehler ${r.status}` }
      let rest = '', letzte = {}
      for await (const stueck of r.body) {
        rest += Buffer.from(stueck).toString('utf8')
        const zeilen = rest.split('\n'); rest = zeilen.pop() ?? ''
        for (const z of zeilen) { try { if (z.trim()) letzte = JSON.parse(z) } catch { /* unvollständige Zeile */ } }
        if (letzte?.error) break
      }
      return letzte?.status === 'success' ? { ok: true } : { ok: false, text: String(letzte?.error ?? 'Herunterladen nicht abgeschlossen') }
    } catch (f) { return { ok: false, text: f?.name === 'TimeoutError' ? 'Herunterladen dauerte über eine Stunde.' : 'Ollama läuft nicht.' } } finally { holtModell = false }
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
  stimmeBeenden: () => { loki.beenden(); gehoer.beenden() },
  /** Vollbild-Spiel läuft (true) bzw. ist vorbei (false) – electron/vollbild.cjs */
  spielLaeuft,
  /** Ruhezeit von Maus/Tastatur in Sekunden (Abwesenheits-Modus) */
  ruheMelden,
  // nur für den Selbsttest (electron electron/jarvis-test.cjs)
  _test: {
    vorbereiten, status,
    sprechen: async (text) => tts.generateAsync({ text, sid: 0, speed: 0.88, enableExternalBuffer: false }),
    loki,
    gehoer,
    erkennenTurbo: async (samples) => { const mit = new Float32Array(samples.length + 8000); mit.set(samples); const d = await gehoer.auftrag({ ton: Buffer.from(mit.buffer).toString('base64'), worte }, 20_000); return String(d?.text ?? '') },
    erkennen: async (samples, rate) => { const st = erkenner.createStream(); const mit = new Float32Array(samples.length + rate / 2); mit.set(samples); st.acceptWaveform({ samples: mit, sampleRate: rate }); return (await erkenner.decodeAsync(st)).text },
  },
}
