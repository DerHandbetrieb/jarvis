// Gegenstelle für das Dauer-HUD (03.11.2026, Entscheidung: Web-Wallpaper in Wallpaper Engine, Test A bestanden – das
// Wallpaper darf http://127.0.0.1 abfragen). Loki liefert hier nur fertige Anzeige-Daten: Werkstatt-Lage (Zahlen und
// Titel, keine Anmeldedaten), Wetter, Uhrzeit. Sicherheit: lauscht NUR auf 127.0.0.1 (nicht im Netzwerk erreichbar),
// jede Anfrage braucht den Zugriffsschlüssel im Kopf „x-loki-schluessel“ (zufällig, liegt nur im Wallpaper-Ordner und in
// Lokis Datenordner), nur GET /hud, /kamera, /bild/0|1 und POST /stumm, kein Zugriff auf Dateien oder Befehle.
const http = require('node:http')
const crypto = require('node:crypto')

function gleich(a, b) {
  const x = Buffer.from(String(a ?? '')), y = Buffer.from(String(b ?? ''))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

/** daten: async () => Objekt für die Anzeige; kamera: async () => JPEG-Buffer|null (Etappe 6, GET /kamera);
 *  stumm: async () => Objekt (POST /stumm – roter Knopf im Wallpaper: Loki stumm/wieder an, Wunsch 03.11.2026);
 *  liveBild: async (kanal, nach) => { daten, nr }|null (GET /bild/0|1?nach=<nr> – nächstes Bild aus dem Live-Strom je
 *        Objektiv, wartet bis 1,5 s darauf; Nummer im Kopf x-bild-nr; 04.11.2026; nur im Arbeitsspeicher);
 *  schluessel: Zugriffsschlüssel; port: fester Port auf 127.0.0.1 */
function erstelleHudServer({ port, schluessel, daten, kamera = async () => null, stumm = async () => null, liveBild = async () => null, ton = async () => null, protokoll = console.error }) {
  let server = null
  const kopf = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'x-loki-schluessel', 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Expose-Headers': 'x-bild-nr', 'Cache-Control': 'no-store' }
  async function antwort(req, res) {
    if (req.method === 'OPTIONS') { res.writeHead(204, kopf); res.end(); return }
    const pfad = String(req.url ?? '').split('?')[0]
    const erlaubt = (req.method === 'GET' && (pfad === '/hud' || pfad === '/kamera' || pfad === '/bild/0' || pfad === '/bild/1' || pfad === '/ton')) || (req.method === 'POST' && pfad === '/stumm')
    if (!erlaubt) { res.writeHead(404, kopf); res.end(); return }
    // nur Aufrufe an 127.0.0.1/localhost annehmen (zusätzlicher Schutz gegen „DNS-Rebinding“ fremder Webseiten)
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/i.test(String(req.headers.host ?? ''))) { res.writeHead(403, kopf); res.end(); return }
    if (!gleich(req.headers['x-loki-schluessel'], schluessel)) { res.writeHead(403, kopf); res.end(); return }
    try {
      if (pfad === '/stumm') {
        req.resume() // Inhalt der Anfrage wird nicht gebraucht
        res.writeHead(200, { ...kopf, 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify((await stumm()) ?? {}))
        return
      }
      if (pfad.startsWith('/bild/')) {
        const nach = Number(new URL(String(req.url), 'http://x').searchParams.get('nach')) || 0
        const b = await liveBild(Number(pfad.slice(6)), nach)
        if (!b) { res.writeHead(204, kopf); res.end(); return }
        res.writeHead(200, { ...kopf, 'Content-Type': 'image/jpeg', 'x-bild-nr': String(b.nr) })
        res.end(b.daten)
        return
      }
      if (pfad === '/ton') { // PC-Ton (05.11.2026): 128 Lautstärke-Werte 0..1 oder 204
        const w = await ton()
        if (!w) { res.writeHead(204, kopf); res.end(); return }
        res.writeHead(200, { ...kopf, 'Content-Type': 'application/json' })
        res.end(JSON.stringify(w))
        return
      }
      if (pfad === '/kamera') {
        const b = await kamera()
        if (!b) { res.writeHead(204, kopf); res.end(); return }
        res.writeHead(200, { ...kopf, 'Content-Type': 'image/jpeg' })
        res.end(b)
        return
      }
      const d = await daten()
      res.writeHead(200, { ...kopf, 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify(d))
    } catch (f) { protokoll('Dauer-HUD:', f?.message); res.writeHead(500, kopf); res.end() }
  }
  return {
    start: () => new Promise((fertig, fehler) => {
      server = http.createServer((req, res) => { void antwort(req, res) })
      server.on('error', (f) => { protokoll('Dauer-HUD-Gegenstelle:', f?.message); fehler(f) })
      server.listen(port, '127.0.0.1', () => fertig(server.address().port))
    }),
    stop: () => new Promise((fertig) => { if (!server) return fertig(); server.close(() => fertig()); server = null }),
  }
}

/** Zugriffsschlüssel: einmal zufällig erzeugen und merken (Datei in Lokis Datenordner) */
function hudSchluessel(fs, datei) {
  try { const s = fs.readFileSync(datei, 'utf8').trim(); if (/^[0-9a-f]{64}$/.test(s)) return s } catch { /* neu anlegen */ }
  const s = crypto.randomBytes(32).toString('hex')
  fs.writeFileSync(datei, s)
  return s
}

module.exports = { erstelleHudServer, hudSchluessel }
