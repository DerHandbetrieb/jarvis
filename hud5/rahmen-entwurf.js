// Rahmen-Entwürfe: fünf Fenster des linken Bildschirms, je Rahmen + Inhalt in einer Leinwand, gemeinsam gekippt
import { RAHMEN_STILE } from './rahmen.js'
import { ausHud, ZEICHNER } from './inhalte.js'
import { sequenzDaten } from '../startsequenz/lageDaten.js'

const p = new URLSearchParams(location.search)
const stil = RAHMEN_STILE[p.get('stil') ?? '1'], dreh = Number(p.get('dreh') ?? 24)
document.getElementById('tafel').style.transform = `rotateY(${dreh}deg)`
const daten = { ...ausHud({ wetter: { ort: 'Obersontheim', grad: 9, wolken: 60 } }, new Date(), sequenzDaten, () => 'BEWÖLKT'), ton: Array.from({ length: 128 }, (_, i) => Math.max(0, Math.sin(i * 0.37) * Math.exp(-((i % 64) / 18)) * 0.8)), loki: { zustand: 'bereit', mikrofon: true } }
const FELDER = [['verkaeufe', 0, 0, 610, 260], ['umsatz', 630, 0, 610, 260], ['ton', 0, 280, 1240, 160], ['aufgaben', 0, 460, 610, 300], ['bestellungen', 630, 460, 610, 300]]
for (const [id, x, y, b, h] of FELDER) {
  const c = document.createElement('canvas'); c.width = b; c.height = h; c.style.left = x + 'px'; c.style.top = y + 'px'
  const g = c.getContext('2d'), innen = stil.zeichne(g, b, h)
  g.save(); g.beginPath(); g.rect(innen.x, innen.y, innen.b, innen.h); g.clip(); g.translate(innen.x, innen.y)
  ZEICHNER[id](g, innen.b, innen.h, daten, 1.3)
  g.restore()
  document.getElementById('tafel').appendChild(c)
}
window.fertig = true
