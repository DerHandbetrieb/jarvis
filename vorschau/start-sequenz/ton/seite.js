// Bedienung der Tongerüste-Seite: Knöpfe, Zeitleiste mit Abschnitten, Gruß wechselt bei jedem Abspielen.
import { GERUESTE, ZEIT, vorbereiten, starten, jetzt } from './tongerueste.js'

const ABSCHNITTE = [['Start', 0, ZEIT.VISIER], ['Visier', ZEIT.VISIER, ZEIT.VERWANDLUNG], ['Verwandlung', ZEIT.VERWANDLUNG, ZEIT.DUNKEL],
  ['Dunkel', ZEIT.DUNKEL, ZEIT.EINSCHLAG], ['Einschlag', ZEIT.EINSCHLAG, ZEIT.GRUSS], ['Loki spricht', ZEIT.GRUSS, ZEIT.AUS], ['Aus', ZEIT.AUS, ZEIT.ENDE]]
const leiste = document.getElementById('leiste'), marke = document.getElementById('marke'), uhr = document.getElementById('uhr'), phaseText = document.getElementById('phase'), info = document.getElementById('info')
const felder = ABSCHNITTE.map(([n, a, b]) => { const d = document.createElement('div'); d.className = 'phase'; d.style.width = `${((b - a) / ZEIT.ENDE) * 100}%`; d.textContent = n; leiste.insertBefore(d, marke); return d })

let laufend = null, laedt = false, grussNr = Math.floor(Math.random() * 4)
const karten = document.getElementById('karten')
GERUESTE.forEach((g, i) => {
  const k = document.createElement('div'); k.className = 'karte'
  const b = document.createElement('button'); b.textContent = `▶ ${i + 1}`
  const t = document.createElement('div'); t.innerHTML = `<div class="name">${i + 1} · ${g.name}</div><div class="text">${g.text}</div>`
  k.append(b, t); karten.append(k)
  b.onclick = async () => {
    if (laedt) return // während des Ladens keine zweite Wiedergabe
    const warSelbst = laufend?.nr === i
    stoppen()
    if (warSelbst) return
    grussNr = (grussNr % 4) + 1
    b.textContent = '…'; laedt = true
    try {
      const fehlt = await vorbereiten(grussNr)
      info.textContent = fehlt.length ? `Fehlende Töne: ${fehlt.join(', ')}` : ''
      laufend = { nr: i, karte: k, knopf: b, ...starten(g) }
    } catch (e) { info.textContent = `Fehler: ${e.message}`; b.textContent = `▶ ${i + 1}`; return } finally { laedt = false }
    k.classList.add('spielt'); b.textContent = '■ Stopp'
  }
})
function stoppen() {
  if (!laufend) return
  laufend.stopp(); laufend.karte.classList.remove('spielt'); laufend.knopf.textContent = `▶ ${laufend.nr + 1}`; laufend = null
  marke.style.display = 'none'; felder.forEach((f) => f.classList.remove('aktiv')); uhr.textContent = '0,0 s'; phaseText.textContent = '–'
}
function schleife() {
  if (!laufend) return
  const t = jetzt() - laufend.t0
  if (t > ZEIT.ENDE + 0.3) { stoppen(); return }
  const tt = Math.max(0, t)
  marke.style.display = 'block'; marke.style.left = `${(tt / ZEIT.ENDE) * 100}%`
  uhr.textContent = `${tt.toFixed(1).replace('.', ',')} s`
  ABSCHNITTE.forEach(([n, a, b], i) => { const an = tt >= a && tt < b; felder[i].classList.toggle('aktiv', an); if (an) phaseText.textContent = `${n} (${a.toString().replace('.', ',')}–${b.toString().replace('.', ',')} s)` })
}
setInterval(schleife, 50) // Takt statt Bildwiederholung: läuft auch weiter, wenn das Fenster im Hintergrund liegt
window.tonGerueste = { GERUESTE, vorbereiten, starten, stoppen }
