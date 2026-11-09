// Niesen erkennen (06.11.2026, Wunsch Auftraggeber: Loki wünscht Gesundheit). Geräusche-Modell CED small (Apache-2.0 laut
// huggingface.co/mispeech/ced-small) über sherpa-onnx, läuft nur auf diesem PC, der Ton wird nicht gespeichert.
// Gemessen (modelle/niesen, ESC-50 + eigene Sprachproben): Fenster 3 s, Schwelle 0,2 = 25 von 40 Niesern erkannt,
// 1 Fehlalarm in 320 anderen Geräuschen, 0 in 347 Sprach-Stücken; ca. 20 ms Rechenzeit je Stück.
// Damit das Modell ein Niesen ganz im Fenster sieht, startet die Aufnahme erst bei einem Lautstärke-Sprung, mit
// 0,5 s Vorlauf. Bei Stille rechnet nichts.
// Schwelle 0,5 seit 09.11.2026 (Rückmeldung Auftraggeber: zu viele Fehlalarme; im Protokoll Werte 0,28–0,37 ohne Niesen).
// Gemessen ESC-50: 17 von 40 Niesern, 0 Fehlalarme in 319 Geräuschen (vorher mit 0,2: 30 von 40, 2 Fehlalarme). Lieber ein Niesen verpassen.
const RATE = 16000, VORLAUF = RATE / 2, FENSTER = RATE * 3
const SCHWELLE = 0.5, LAUT = 0.015, PAUSE_MS = 120_000, NOTIZ = 0.05

const lautstaerke = (s) => { let e = 0; for (let i = 0; i < s.length; i++) e += s[i] * s[i]; return Math.sqrt(e / Math.max(1, s.length)) }

/** auswerten(samples) → Wahrscheinlichkeit 0–1; melden(wert) bei erkanntem Niesen, höchstens alle 2 Minuten */
function erstelleNiesWache({ auswerten, melden, notiz = () => {}, jetzt = () => Date.now() }) {
  let vor = new Float32Array(0), stueck = null, voll = 0, letzte = -Infinity
  const merkeVor = (s) => {
    const neu = new Float32Array(Math.min(VORLAUF, vor.length + s.length))
    const ausS = Math.min(neu.length, s.length)
    neu.set(vor.subarray(vor.length - (neu.length - ausS)), 0)
    neu.set(s.subarray(s.length - ausS), neu.length - ausS)
    vor = neu
  }
  const fertig = () => {
    const samples = stueck; stueck = null; voll = 0
    let wert = 0
    try { wert = Number(auswerten(samples)) || 0 } catch (f) { notiz(`Niesen-Erkennung Fehler: ${f.message}`); return }
    if (wert >= NOTIZ) notiz(`Niesen? Wert ${wert.toFixed(2)}`)
    if (wert >= SCHWELLE && jetzt() - letzte >= PAUSE_MS) { letzte = jetzt(); melden(wert) }
  }
  return {
    ton(s) {
      if (!stueck) {
        if (lautstaerke(s) < LAUT) { merkeVor(s); return }
        stueck = new Float32Array(FENSTER); stueck.set(vor); voll = vor.length; vor = new Float32Array(0)
      }
      const n = Math.min(s.length, FENSTER - voll)
      stueck.set(s.subarray(0, n), voll); voll += n
      if (voll >= FENSTER) fertig()
    },
    zuruecksetzen() { vor = new Float32Array(0); stueck = null; voll = 0 },
  }
}

module.exports = { erstelleNiesWache, SCHWELLE }
