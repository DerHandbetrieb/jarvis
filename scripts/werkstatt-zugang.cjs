// Legt .env.werkstatt an (03.11.2026): Adresse und ÖFFENTLICHER Schlüssel der Werkstatt-Datenbank, übernommen aus der
// Werkstatt-App (.env.local). Die Datei steht in .gitignore (.env.*) und kommt beim Bauen als resources/werkstatt.env in
// den Installer. Kein Geheimnis im engeren Sinn (der Schlüssel ist ohne Anmeldung wertlos), trotzdem nicht in Git.
// Aufruf aus dem Projektordner:  node scripts/werkstatt-zugang.cjs [Pfad zur Werkstatt-App]
const fs = require('node:fs'), path = require('node:path')
const quelle = path.join(process.argv[2] ?? 'C:\\Projekte-Claude\\Werkstatt-App', '.env.local')
const w = Object.fromEntries(fs.readFileSync(quelle, 'utf8').split(/\r?\n/).filter((z) => z.includes('=')).map((z) => [z.slice(0, z.indexOf('=')).trim(), z.slice(z.indexOf('=') + 1).trim()]))
if (!w.VITE_SUPABASE_URL || !w.VITE_SUPABASE_PUBLISHABLE_KEY) { console.error('In der Werkstatt-App fehlen VITE_SUPABASE_URL oder VITE_SUPABASE_PUBLISHABLE_KEY.'); process.exit(1) }
fs.writeFileSync(path.join(__dirname, '..', '.env.werkstatt'), `WERKSTATT_URL=${w.VITE_SUPABASE_URL}\nWERKSTATT_SCHLUESSEL=${w.VITE_SUPABASE_PUBLISHABLE_KEY}\n`)
console.log('.env.werkstatt angelegt (Adresse + öffentlicher Schlüssel).')
