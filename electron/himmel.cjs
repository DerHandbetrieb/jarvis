// Wetter kommt ausnahmslos von der eigenen Station (06.11.2026, Vorgabe Auftraggeber). Anlass: Der frühere Wetterdienst rechnete
// ein Modell und meldete „Regen“ bei strahlender Sonne, die Station zugleich 0 mm und 295 W/m². Aus den Messwerten ergibt sich:
// Regen und Schnee aus der Regenrate, Sonne oder Wolken aus der Strahlung im Vergleich zum wolkenlosen Himmel. Nachts und bei tief
// stehender Sonne ist der Himmel nicht messbar: dann code null, und L.O.K.I. behauptet nichts über Wolken. Nebel lässt sich aus
// Feuchte und Wind nur schätzen (klare, windstille Nächte sähen genauso aus), darum wird er nicht behauptet.
// Fehlt auch die Regenmessung, bleibt code undefined („keine Daten“). Ohne frische Stationsdaten gibt es gar keine Angabe (null).
const STATION_FRISCH_MS = 15 * 60_000, BREITE = 49.057, LAENGE = 9.899
const MIN_SIN_HOEHE = Math.sin((8 * Math.PI) / 180) // tiefer steht die Sonne zu flach für eine Aussage
const SONNIG_AB = 0.7, FAST_SONNIG_AB = 0.5, HEITER_AB = 0.3

/** Sinus der Sonnenhöhe (übliche Näherung für Sonnendeklination und Zeitgleichung) */
function sinSonnenhoehe(ms, breite = BREITE, laenge = LAENGE) {
  const d = new Date(ms), rad = Math.PI / 180
  const n = (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86_400_000
  const dekl = -23.44 * Math.cos(((2 * Math.PI) / 365) * (n + 10)) * rad, b = ((2 * Math.PI) / 364) * (n - 81)
  const zeitgleichung = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b) // Minuten
  const stunde = d.getUTCHours() + d.getUTCMinutes() / 60 + laenge / 15 + zeitgleichung / 60
  const h = (stunde - 12) * 15 * rad, phi = breite * rad
  return Math.sin(phi) * Math.sin(dekl) + Math.cos(phi) * Math.cos(dekl) * Math.cos(h)
}

/** Strahlung bei wolkenlosem Himmel in W/m² (Haurwitz-Näherung, auch bei tiefer Sonne brauchbar), null = Sonne zu tief für eine Aussage */
function klarhimmel(ms) {
  const s = sinSonnenhoehe(ms)
  return s < MIN_SIN_HOEHE ? null : 1098 * s * Math.exp(-0.057 / s)
}

/** Wettercode nach WMO allein aus den Messwerten, null = trocken, Himmel nicht messbar, undefined = nichts gemessen */
function codeAusStation(st, jetzt) {
  const rate = st.regenRate, regenBekannt = Number.isFinite(rate)
  if (rate > 0) return st.grad <= 1 ? 71 : rate > 7.6 ? 65 : rate > 2.5 ? 63 : 61
  const klar = klarhimmel(jetzt)
  if (!klar || !Number.isFinite(st.sonne)) return regenBekannt ? null : undefined
  const anteil = st.sonne / klar
  return anteil >= SONNIG_AB ? 0 : anteil >= FAST_SONNIG_AB ? 1 : anteil >= HEITER_AB ? 2 : 3
}

/** st: Messwerte der Station → { grad, code, wolken, … } oder null, wenn sie nichts Frisches hat */
function wetterAusStation(st, jetzt = Date.now()) {
  const gemessen = st?.gemessen ?? st?.zeit // Messzeit der Station, nicht die Zeit der Cloud-Abfrage
  if (!st || !Number.isFinite(gemessen) || jetzt - gemessen > STATION_FRISCH_MS || !Number.isFinite(st.grad)) return null
  const { feuchte, wind, boe, druck, regenRate, regenHeute } = st
  return { grad: st.grad, code: codeAusStation(st, jetzt), wolken: null, feuchte, wind, boe, druck, regenRate, regenHeute }
}

module.exports = { wetterAusStation, sinSonnenhoehe, klarhimmel }
