// Akzent-Versuch (03.11.2026): In einer KOPIE einer Piper-Stimme (ONNX-Datei) die Angabe „voice“ in den Metadaten
// ändern – sherpa-onnx wählt danach die Lautschrift (espeak-ng) aus dieser Angabe. Eine britische Stimme mit „de“
// bekommt deutsche Laute und spricht Deutsch so, wie sie es kann: mit britischem Klang. Ohne Zusatzpakete.
// Aufruf: node lautschrift.cjs <quelle.onnx> <ziel.onnx> [neue Lautschrift, z. B. de]   (ohne dritten Wert: nur anzeigen)
const fs = require('node:fs')

function varint(buf, pos) {
  let wert = 0n, schritt = 0n
  for (;;) {
    const b = buf[pos++]
    wert |= BigInt(b & 0x7f) << schritt
    if (!(b & 0x80)) return [wert, pos]
    schritt += 7n
  }
}
function alsVarint(n) {
  const aus = []
  let v = BigInt(n)
  do { let b = Number(v & 0x7fn); v >>= 7n; if (v) b |= 0x80; aus.push(b) } while (v)
  return Buffer.from(aus)
}
const feld = (nr, typ) => alsVarint((nr << 3) | typ)
const text = (nr, s) => { const b = Buffer.from(s, 'utf8'); return Buffer.concat([feld(nr, 2), alsVarint(b.length), b]) }

/** Felder einer Protobuf-Nachricht (nur oberste Ebene) als { nr, typ, start, ende, inhalt } */
function felder(buf) {
  const liste = []
  let pos = 0
  while (pos < buf.length) {
    const start = pos
    let kopf
    ;[kopf, pos] = varint(buf, pos)
    const nr = Number(kopf >> 3n), typ = Number(kopf & 7n)
    let inhalt = null
    if (typ === 0) [, pos] = varint(buf, pos)
    else if (typ === 1) pos += 8
    else if (typ === 5) pos += 4
    else if (typ === 2) { let l; [l, pos] = varint(buf, pos); inhalt = buf.subarray(pos, pos + Number(l)); pos += Number(l) }
    else throw new Error(`unbekannter Feldtyp ${typ}`)
    liste.push({ nr, typ, start, ende: pos, inhalt })
  }
  return liste
}

const [quelle, ziel, neu] = process.argv.slice(2)
const buf = fs.readFileSync(quelle)
const teile = []
for (const f of felder(buf)) {
  if (f.nr === 14 && f.typ === 2) { // metadata_props: { 1 key, 2 value }
    const kv = Object.fromEntries(felder(f.inhalt).map((x) => [x.nr, x.inhalt.toString('utf8')]))
    console.log(`  ${kv[1]} = ${kv[2]}`)
    if (neu && kv[1] === 'voice') {
      const eintrag = Buffer.concat([text(1, 'voice'), text(2, neu)])
      teile.push(Buffer.concat([feld(14, 2), alsVarint(eintrag.length), eintrag]))
      console.log(`  → voice = ${neu}`)
      continue
    }
  }
  teile.push(buf.subarray(f.start, f.ende))
}
if (neu && ziel) fs.writeFileSync(ziel, Buffer.concat(teile))
