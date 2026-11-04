// Dauer-HUD in Wallpaper Engine einrichten (03.11.2026): findet Wallpaper Engine über Steam (Registry
// HKCU\Software\Valve\Steam → SteamPath, dazu weitere Bibliotheken aus libraryfolders.vdf) und legt das fertige Wallpaper
// als eigenes, lokales Projekt in <wallpaper_engine>\projects\myprojects\loki-dauer-hud an (project.json + Dateien +
// zugang.js mit Port und Zugriffsschlüssel). Nichts wird veröffentlicht; das bisherige Wallpaper bleibt unverändert –
// der Auftraggeber wählt das neue in Wallpaper Engine selbst aus (Reiter „Installiert“).
const path = require('node:path')

/** Steam-Bibliotheken aus libraryfolders.vdf lesen (Zeilen wie  "path"  "D:\\GAMES\\Steam") */
function bibliotheken(vdfText, steamPfad) {
  const pfade = [steamPfad, ...[...String(vdfText ?? '').matchAll(/"path"\s+"([^"]+)"/g)].map((m) => m[1].replace(/\\\\/g, '\\'))]
  return [...new Set(pfade.filter(Boolean).map((p) => path.normalize(p)))]
}

/** Ordner von Wallpaper Engine suchen; leseSteamPfad() liefert den SteamPath aus der Registry */
function findeWallpaperEngine({ fs, leseSteamPfad }) {
  const steam = leseSteamPfad()
  if (!steam) return null
  let vdf = ''
  try { vdf = fs.readFileSync(path.join(steam, 'steamapps', 'libraryfolders.vdf'), 'utf8') } catch { /* nur Hauptbibliothek */ }
  for (const b of bibliotheken(vdf, steam)) {
    const we = path.join(b, 'steamapps', 'common', 'wallpaper_engine')
    if (fs.existsSync(path.join(we, 'wallpaper32.exe')) || fs.existsSync(path.join(we, 'wallpaper64.exe'))) return we
  }
  return null
}

const PROJEKT = 'loki-dauer-hud'
/** Wallpaper anlegen bzw. aktualisieren. quelle = gebautes Wallpaper (dist-hud), gibt den Projektordner zurück */
function einrichten({ fs, we, quelle, port, schluessel }) {
  const ziel = path.join(we, 'projects', 'myprojects', PROJEKT)
  // nicht erst löschen (läuft das Wallpaper gerade, hält Wallpaper Engine Dateien offen → halb gelöschter Ordner):
  // Dateien überschreiben, danach nur veraltete Programmteile in assets/ entfernen (nur in unserem eigenen Ordner)
  fs.mkdirSync(ziel, { recursive: true })
  fs.cpSync(quelle, ziel, { recursive: true, force: true })
  const neu = new Set(fs.readdirSync(path.join(quelle, 'assets'), { withFileTypes: false }).map(String))
  const altOrdner = path.join(ziel, 'assets')
  for (const f of fs.existsSync(altOrdner) ? fs.readdirSync(altOrdner) : []) if (!neu.has(f)) { try { fs.rmSync(path.join(altOrdner, f), { force: true }) } catch { /* gerade in Benutzung – beim nächsten Mal */ } }
  fs.writeFileSync(path.join(ziel, 'zugang.js'), `window.LOKI_HUD = ${JSON.stringify({ port: Number(port), schluessel: String(schluessel) })}\n`)
  fs.writeFileSync(path.join(ziel, 'project.json'), JSON.stringify({
    file: 'dauer-hud.html', title: 'L.O.K.I. Dauer-HUD', type: 'web',
    description: 'Dauer-HUD von L.O.K.I. (Der Handbetrieb). Nur lokal – NICHT im Workshop veröffentlichen (Werkstatt-Daten, Zugriffsschlüssel).',
  }, null, 2))
  return ziel
}

module.exports = { bibliotheken, findeWallpaperEngine, einrichten, PROJEKT }
