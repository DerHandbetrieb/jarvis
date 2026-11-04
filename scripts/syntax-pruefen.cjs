// Prüft vor dem Bau alle Dateien des Hauptprozesses auf Schreibfehler (04.11.2026: ein kaputter Zeilenumbruch in
// main.cjs kam bis in den Installer, weil tsc/vite die .cjs-Dateien nicht prüfen). Aufruf: node scripts/syntax-pruefen.cjs
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const ordner = path.join(__dirname, '..', 'electron')
let fehler = 0
for (const d of fs.readdirSync(ordner).filter((n) => n.endsWith('.cjs'))) {
  try { execFileSync(process.execPath, ['--check', path.join(ordner, d)], { stdio: 'pipe' }) } catch (e) { fehler++; console.error(String(e.stderr)) }
}
if (fehler) { console.error(`${fehler} Datei(en) mit Schreibfehlern`); process.exit(1) }
