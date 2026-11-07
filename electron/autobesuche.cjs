// Autos benennen (07.11.2026, Wunsch Auftraggeber: „immer, wenn ein neues Auto da war, gleich benennen und abhaken“).
// Liest die Testbilder aus dem Machbarkeitstest (autotest.cjs, Ordner auto-test) als Besuche – je Auto-Meldung bis zu drei
// Bilder mit gleichem Zeitstempel – und merkt sich je Besuch einen Namen oder „kein Auto“ in auto-test/namen.json.
// Die Namen sind später die Lösungen, an denen die Erkennung gemessen und angelernt wird. Nichts verlässt den PC.
// Ohne Electron-Abhängigkeit (autobesuche.test.js).
const path = require('node:path')

const ID = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/
const DATEI = /^(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})_([1-3])\.jpg$/
const KEIN_AUTO = '__kein_auto__'

/** "2026-11-07_14-03-22" → "07.11.2026, 14:03 Uhr" */
function zeitText(id) {
  const [d, z] = id.split('_'), [j, m, t] = d.split('-'), [h, mi] = z.split('-')
  return `${t}.${m}.${j}, ${h}:${mi} Uhr`
}

/** @param {{ ordner: string, fs?: typeof import('node:fs') }} o */
function erstelleAutobesuche({ ordner, fs = require('node:fs') }) {
  const namenDatei = path.join(ordner, 'namen.json')
  function namen() {
    try { const n = JSON.parse(fs.readFileSync(namenDatei, 'utf8')); return n && typeof n === 'object' ? n : {} } catch { return {} }
  }
  function besuche() {
    let dateien = []
    try { dateien = fs.readdirSync(ordner) } catch { return [] }
    const je = new Map()
    for (const d of dateien) {
      const m = DATEI.exec(d)
      if (!m) continue
      if (!je.has(m[1])) je.set(m[1], [])
      je.get(m[1]).push(Number(m[2]))
    }
    const n = namen()
    return [...je.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([id, bilder]) => {
      const e = n[id]
      return { id, zeit: zeitText(id), bilder: bilder.sort(), name: e && e.name !== KEIN_AUTO ? e.name : null, keinAuto: e?.name === KEIN_AUTO, erledigt: !!e }
    })
  }
  /** offene (noch nicht benannte) Besuche */
  const offen = () => besuche().filter((b) => !b.erledigt).length
  /** bisher vergebene Namen, häufigste zuerst (Vorschläge beim Tippen) */
  function bekannte() {
    const z = new Map()
    for (const e of Object.values(namen())) if (e?.name && e.name !== KEIN_AUTO) z.set(e.name, (z.get(e.name) ?? 0) + 1)
    return [...z.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de')).map(([n]) => n)
  }
  /** Name setzen; name = null → wieder offen; keinAuto = Fehlalarm */
  function benennen(id, name, keinAuto = false) {
    if (!ID.test(String(id))) return false
    const n = namen()
    const sauber = String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, 60)
    if (keinAuto) n[id] = { name: KEIN_AUTO, am: Date.now() }
    else if (sauber) n[id] = { name: sauber, am: Date.now() }
    else delete n[id]
    fs.mkdirSync(ordner, { recursive: true })
    const zw = namenDatei + '.neu'
    fs.writeFileSync(zw, JSON.stringify(n, null, 1))
    fs.renameSync(zw, namenDatei)
    return true
  }
  /** ein Bild als data-URL (nur gültige Kennungen, kein Zugriff außerhalb des Ordners) */
  function bild(id, nr) {
    if (!ID.test(String(id)) || ![1, 2, 3].includes(Number(nr))) return null
    try { return `data:image/jpeg;base64,${fs.readFileSync(path.join(ordner, `${id}_${Number(nr)}.jpg`)).toString('base64')}` } catch { return null }
  }
  return { besuche, offen, bekannte, benennen, bild }
}

module.exports = { erstelleAutobesuche, zeitText, KEIN_AUTO }
