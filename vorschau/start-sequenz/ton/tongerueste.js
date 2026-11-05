// Tongerüste für Lokis Start-Sequenz (03.11.2026) – nur Ton, kein Bild. Wunsch Auftraggeber: 6–10 deutlich
// verschiedene Klangrichtungen zum Anhören, um die Richtung zu finden. Gleiche Zeitachse wie die Sequenz (hud/main.js).
// Bausteine: Sonniss-Töne aus ../3d/toene/ (nicht in Git, siehe 3d/toene.json) + Klänge, die Web Audio selbst erzeugt.
// Mischung wie in 3d/ton.js: Geräusche → Musikbus (Klangsenke 2,4 kHz + −12 dB, solange Loki spricht) → Summe → Begrenzer;
// Lokis Stimme getrennt (Tiefen weg, Präsenz, verdichtet, angehoben) – Vorgabe: immer gut verständlich.
// Vorgabe für den Anfang: nichts Schrilles oder Piepsiges in den ersten Sekunden (Rückmeldung „Töne am Anfang komisch“).

export const ZEIT = { VISIER: 1.4, VERWANDLUNG: 4.6, DUNKEL: 9.2, EINSCHLAG: 10.5, GRUSS: 12.8, AUS: 23, ENDE: 25 }
// (als Text gebildet: Vite schreibt new URL('./', import.meta.url) beim Ausliefern um und verliert dabei den Schrägstrich)
const BASIS = String(import.meta.url).split('?')[0].replace(/[^/]*$/, '')
const NAMEN = ['start_metall', 'braam_metall', 'rumpeln', 'hud_akzent', 'hud_klick', 'hud_rueckmeldung', 'verwandlung_1', 'verwandlung_2',
  'mechanik_glitch', 'mech_kraft', 'servo_1', 'servo_2', 'servo_3', 'einrasten_1', 'einrasten_2', 'riser', 'aufladen', 'warp', 'abschalten', 'downer',
  'einsaugen', 'boom', 'einschlag_episch', 'amboss', 'braam', 'braam_gold', 'einschlag_warp', 'blitzschlag', 'ping', 'hydraulik', 'pneumatik',
  'nano_komplex', 'flaeche', 'reaktor_brumm', 'zahnrad_takt', 'hologramm', 'schluss_hit', 'stinger', 'subdrop', 'metall_boom', 'metall_riser',
  'modern_boom', 'gong', 'metall_schieben', 'zahnraeder', 'eisen_hammer', 'fass_hammer', 'metall_ton', 'metall_kreischen', 'metall_rueckwaerts',
  'dunkle_drohne', 'elektro_feld', 'elektro_feld_2', 'plasma_vorbei', 'puls', 'tor_metall', 'zahnrad_lang', 'spannung', 'energie_flaeche',
  'granular', 'braam_dystopie', 'verzerrt_boom', 'hud_an', 'hud_glitch', 'hud_piep', 'zahnrad_hammer'] // letzte vier: Intro Runensturm (05.11.2026)

let ac = null
let tonOrdner = new URL('../3d/toene/', BASIS).href
/** Ordner der Sonniss-Töne setzen (im Jarvis-Programm: mitgelieferter Ordner) */
export function setzeTonOrdner(url) { tonOrdner = String(url).endsWith('/') ? String(url) : String(url) + '/' }
const puffer = {}
let rausch = null

export async function vorbereiten(grussNr) {
  if (!ac) ac = new AudioContext({ latencyHint: 'playback' })
  if (ac.state === 'suspended') await ac.resume()
  if (puffer.grussNr !== grussNr) { delete puffer.gruss; puffer.grussNr = grussNr }
  const mitGruss = grussNr != null
  const fehlt = [...NAMEN.filter((n) => !(n in puffer)), ...(!mitGruss || 'gruss' in puffer ? [] : ['gruss'])]
  await Promise.all(fehlt.map(async (n) => {
    try { puffer[n] = await ac.decodeAudioData(await (await fetch(n === 'gruss' ? new URL(`../gruss-${grussNr}.wav`, BASIS) : `${tonOrdner}${n}.ogg`)).arrayBuffer()) } catch { puffer[n] = null }
  }))
  if (!rausch) { rausch = ac.createBuffer(1, ac.sampleRate * 4, ac.sampleRate); const d = rausch.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1 }
  return [...NAMEN, ...(mitGruss ? ['gruss'] : [])].filter((n) => !puffer[n])
}
/** Ton aus Lokis Stimme (Float32-Abtastwerte) in einen abspielbaren Puffer verwandeln */
export function pufferAus(samples, sampleRate) { const b = ac.createBuffer(1, samples.length, sampleRate); b.copyToChannel(samples instanceof Float32Array ? samples : new Float32Array(samples), 0); return b }
export const jetzt = () => (ac ? ac.currentTime : 0)
// wie lange ein Ton braucht, bis er aus dem Lautsprecher kommt (für Bild-Ton-Gleichlauf)
export const verzoegerung = () => (ac ? ac.outputLatency || ac.baseLatency || 0 : 0)

function hall(sek = 3.2, abfall = 3) {
  const len = Math.floor(ac.sampleRate * sek), b = ac.createBuffer(2, len, ac.sampleRate)
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, abfall) }
  const k = ac.createConvolver(); k.buffer = b; return k
}

// Startet ein Gerüst; gibt { t0, gesamt, stimme, stopp, gruss, ausblenden } zurück.
// offen = true (Jarvis-Programm): kein fester Schluss – der Gruß kommt, sobald Lokis Stimme ihn erzeugt hat (gruss()), danach
// blendet das Programm aus (ausblenden()); Dauertöne laufen bis dahin weiter. lautstaerke = Regler in den Einstellungen.
export function starten(geruest, { offen = false, lautstaerke = 1 } = {}) {
  const Z = offen ? { ...ZEIT, AUS: 58, ENDE: 60 } : ZEIT, t0 = ac.currentTime + 0.1, T = (s) => t0 + s, quellen = []
  // Lautstärke-Regler wirkt nur auf Musik und Effekte – Lokis Stimme bleibt immer hörbar
  const grundPegel = 0.8, musikRegler = ac.createGain(); musikRegler.gain.value = Math.max(0, Math.min(1, lautstaerke))
  const summe = ac.createGain(); summe.gain.value = grundPegel
  const begrenzer = ac.createDynamicsCompressor()
  begrenzer.threshold.value = -8; begrenzer.knee.value = 0; begrenzer.ratio.value = 20; begrenzer.attack.value = 0.002; begrenzer.release.value = 0.2
  // Sicherheit gegen Übersteuern: nach dem Kompressor weiche Kappung bei 0,95 (kein hartes Knacken)
  const kappe = ac.createWaveShaper(), kurve = new Float32Array(1024)
  for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; kurve[i] = Math.abs(x) < 0.8 ? x : Math.sign(x) * (0.8 + 0.15 * Math.tanh((Math.abs(x) - 0.8) / 0.15)) }
  kappe.curve = kurve; kappe.oversample = '4x'
  summe.connect(begrenzer).connect(kappe).connect(ac.destination)
  // Messpunkte für die Bild-Anzeigen (Wellenform/Spektrum): alles zusammen und nur die Stimme
  const gesamt = ac.createAnalyser(); gesamt.fftSize = 1024; gesamt.smoothingTimeConstant = 0.7; kappe.connect(gesamt)
  const stimme = ac.createAnalyser(); stimme.fftSize = 1024; stimme.smoothingTimeConstant = 0.6
  summe.gain.setValueAtTime(grundPegel, T(Z.AUS)); summe.gain.linearRampToValueAtTime(0, T(Z.ENDE))
  const musik = ac.createGain()
  const senke = ac.createBiquadFilter(); senke.type = 'peaking'; senke.frequency.value = 2400; senke.Q.value = 0.7; senke.gain.value = 0
  const absenken = ac.createGain()
  musik.connect(senke).connect(absenken).connect(musikRegler).connect(summe)
  const raum = hall(geruest.hallSek ?? 3.2), raumPegel = ac.createGain(); raumPegel.gain.value = 0.3; raum.connect(raumPegel).connect(musik)

  const ausgang = (knoten, { seite = 0, hallAnteil = 0.25 } = {}) => {
    const p = ac.createStereoPanner(); p.pan.value = seite; knoten.connect(p); p.connect(musik)
    if (hallAnteil) { const h = ac.createGain(); h.gain.value = hallAnteil; p.connect(h).connect(raum) }
  }
  // Sonniss-Ton abspielen
  const spiel = (name, wann, { laut = 1, tempo = 1, ab = 0, bis = null, schleife = false, seite = 0, hallAnteil = 0.25, ein = 0, schlussBei = null } = {}) => {
    const b = puffer[name]; if (!b) return
    if (schlussBei != null) ab = Math.max(0, b.duration - (schlussBei - wann) * tempo) // so starten, dass der Ton genau bei schlussBei endet (z. B. Sog vor dem Einschlag)
    const q = ac.createBufferSource(); q.buffer = b; q.playbackRate.value = tempo; q.loop = schleife
    const g = ac.createGain()
    if (ein) { g.gain.setValueAtTime(0, wann); g.gain.linearRampToValueAtTime(laut, wann + ein) } else g.gain.value = laut
    q.connect(g); ausgang(g, { seite, hallAnteil })
    q.start(Math.max(ac.currentTime, wann), ab)
    if (bis != null) { g.gain.setValueAtTime(laut, bis - 0.4); g.gain.linearRampToValueAtTime(0, bis); q.stop(bis + 0.05) }
    quellen.push(q)
  }
  // Hüllkurve: an (Anstieg), halten bis, aus (Abklingen)
  const huelle = (g, a, an, b, aus, laut) => { g.gain.setValueAtTime(0, a); g.gain.linearRampToValueAtTime(laut, a + an); g.gain.setValueAtTime(laut, Math.max(a + an, b)); g.gain.exponentialRampToValueAtTime(0.0001, Math.max(a + an, b) + aus) }
  const osz = (typ, f, a, b) => { const o = ac.createOscillator(); o.type = typ; o.frequency.value = f; o.start(a); o.stop(b); quellen.push(o); return o }
  const S = {
    // tiefer Schlag/Abfall (Sub)
    sub(wann, { von = 90, bis = 32, dauer = 1.8, laut = 0.8 } = {}) {
      const o = osz('sine', von, wann, wann + dauer + 0.1); o.frequency.setValueAtTime(von, wann); o.frequency.exponentialRampToValueAtTime(bis, wann + dauer * 0.6)
      const g = ac.createGain(); huelle(g, wann, 0.01, wann + 0.05, dauer, laut); o.connect(g); ausgang(g, { hallAnteil: 0 })
    },
    // anschwellendes Rauschen mit wanderndem Filter
    riser(a, b, { von = 300, bis = 7000, laut = 0.25, seite = 0 } = {}) {
      const q = ac.createBufferSource(); q.buffer = rausch; q.loop = true; q.start(a); q.stop(b + 0.1); quellen.push(q)
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2.5; f.frequency.setValueAtTime(von, a); f.frequency.exponentialRampToValueAtTime(bis, b)
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, a); g.gain.exponentialRampToValueAtTime(laut, b - 0.05); g.gain.linearRampToValueAtTime(0, b + 0.05)
      q.connect(f).connect(g); ausgang(g, { seite, hallAnteil: 0.3 })
    },
    // Flächenklang aus verstimmten Sägezähnen, weich gefiltert
    pad(a, b, freqs, { laut = 0.12, lp = 900, lpBis = null, an = 2, aus = 2.5, typ = 'sawtooth', hallAnteil = 0.45 } = {}) {
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.6; f.frequency.setValueAtTime(lp, a); if (lpBis) f.frequency.exponentialRampToValueAtTime(lpBis, b)
      const g = ac.createGain(); huelle(g, a, an, b, aus, laut); f.connect(g); ausgang(g, { hallAnteil })
      freqs.forEach((fr, i) => [-7, 0, 7].forEach((cent) => { const o = osz(typ, fr, a, b + aus + 0.1); o.detune.value = cent + (i % 2 ? 3 : -3); const m = ac.createGain(); m.gain.value = 1 / (freqs.length * 3); o.connect(m).connect(f) }))
    },
    // Chor: Sägezähne durch zwei Formant-Filter („aah“) mit leichtem Vibrato
    chor(a, b, freqs, { laut = 0.2, an = 2.5, aus = 3, vokal = [650, 1080] } = {}) {
      const sum = ac.createGain(), g = ac.createGain(); huelle(g, a, an, b, aus, laut)
      vokal.forEach((fv, i) => { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fv; bp.Q.value = 6; const bg = ac.createGain(); bg.gain.value = i ? 0.6 : 1; sum.connect(bp).connect(bg).connect(g) })
      const tiefp = ac.createBiquadFilter(); tiefp.type = 'lowpass'; tiefp.frequency.value = 420; const tg = ac.createGain(); tg.gain.value = 0.5; sum.connect(tiefp).connect(tg).connect(g)
      ausgang(g, { hallAnteil: 0.7 })
      const vib = osz('sine', 5.2, a, b + aus + 0.1), vibG = ac.createGain(); vibG.gain.value = 6; vib.connect(vibG)
      freqs.forEach((fr) => [-9, -2, 5, 11].forEach((cent) => { const o = osz('sawtooth', fr, a, b + aus + 0.1); o.detune.value = cent; vibG.connect(o.detune); const m = ac.createGain(); m.gain.value = 0.9 / (freqs.length * 4); o.connect(m).connect(sum) }))
    },
    // Trommel (tiefer Schlag + kurzes gefiltertes Rauschen)
    trommel(wann, { f = 62, laut = 0.6, seite = 0, fell = 0.35, hallAnteil = 0.35 } = {}) {
      const o = osz('sine', f * 2.2, wann, wann + 1); o.frequency.setValueAtTime(f * 2.2, wann); o.frequency.exponentialRampToValueAtTime(f, wann + 0.07)
      const g = ac.createGain(); huelle(g, wann, 0.003, wann + 0.01, 0.55, laut); o.connect(g); ausgang(g, { seite, hallAnteil })
      const q = ac.createBufferSource(); q.buffer = rausch; q.start(wann, Math.random() * 3); q.stop(wann + 0.2); quellen.push(q)
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const ng = ac.createGain(); huelle(ng, wann, 0.002, wann + 0.005, 0.12, laut * fell)
      q.connect(lp).connect(ng); ausgang(ng, { seite, hallAnteil })
    },
    // Glas/Kristall: unharmonische Teiltöne, langes Ausklingen
    glas(wann, f, { laut = 0.12, aus = 3.5, seite = 0 } = {}) {
      const g = ac.createGain(); g.gain.value = 1; ausgang(g, { seite, hallAnteil: 0.6 })
      ;[[1, 1], [2.76, 0.45], [5.4, 0.22], [8.93, 0.1]].forEach(([m, a]) => { const o = osz('sine', f * m, wann, wann + aus + 0.1); const og = ac.createGain(); huelle(og, wann, 0.004, wann + 0.01, aus / m ** 0.4, laut * a); o.connect(og).connect(g) })
    },
    // Herzschlag (zwei weiche Sub-Schläge)
    herz(wann, { laut = 0.7 } = {}) { S.sub(wann, { von: 70, bis: 42, dauer: 0.35, laut }); S.sub(wann + 0.28, { von: 62, bis: 38, dauer: 0.45, laut: laut * 0.75 }) },
    // elektrische Entladung: kurzes, hart gefiltertes Rauschen mit Knistern
    entladung(wann, { laut = 0.35, dauer = 0.6, seite = 0 } = {}) {
      const q = ac.createBufferSource(); q.buffer = rausch; q.start(wann, Math.random() * 3); q.stop(wann + dauer); quellen.push(q)
      const hp = ac.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.setValueAtTime(5000, wann); hp.frequency.exponentialRampToValueAtTime(600, wann + dauer); hp.Q.value = 1.5
      const g = ac.createGain(); g.gain.setValueAtTime(laut, wann); for (let k = 0; k < 10; k++) g.gain.setValueAtTime(Math.random() * laut, wann + (k * dauer) / 10); g.gain.linearRampToValueAtTime(0, wann + dauer)
      q.connect(hp).connect(g); ausgang(g, { seite, hallAnteil: 0.3 })
    },
    // tiefes Brummen (zwei leicht verstimmte Sinustöne → Schwebung)
    brumm(a, b, { f = 44, laut = 0.15, an = 1.5 } = {}) {
      const g = ac.createGain(); huelle(g, a, an, b, 1.5, laut); ausgang(g, { hallAnteil: 0 })
      ;[f, f * 1.018, f * 2.003].forEach((fr, i) => { const o = osz('sine', fr, a, b + 1.6); const m = ac.createGain(); m.gain.value = i === 2 ? 0.25 : 0.5; o.connect(m).connect(g) })
    },
  }

  geruest.spielen({ spiel, T, Z, S, kante: T(Z.DUNKEL), E: T(Z.EINSCHLAG) })

  // Lokis Begrüßung: Musik runter (≈ −12 dB), Klangsenke im Sprachbereich, Stimme klar und laut
  // gibt das Ende des Grußes (Sekunden ab Start) zurück
  const gruss = (gq, wann) => {
    const s = T(wann), ende = s + gq.duration
    absenken.gain.setValueAtTime(1, s - 0.3); absenken.gain.linearRampToValueAtTime(0.25, s - 0.05)
    absenken.gain.setValueAtTime(0.25, ende + 0.1); absenken.gain.linearRampToValueAtTime(1, ende + 0.8)
    senke.gain.setValueAtTime(0, s - 0.3); senke.gain.linearRampToValueAtTime(-9, s - 0.05)
    senke.gain.setValueAtTime(-9, ende + 0.1); senke.gain.linearRampToValueAtTime(0, ende + 0.8)
    const q = ac.createBufferSource(); q.buffer = gq
    const tief = ac.createBiquadFilter(); tief.type = 'highpass'; tief.frequency.value = 90
    const praesenz = ac.createBiquadFilter(); praesenz.type = 'peaking'; praesenz.frequency.value = 3000; praesenz.Q.value = 0.9; praesenz.gain.value = 3
    const dicht = ac.createDynamicsCompressor(); dicht.threshold.value = -26; dicht.ratio.value = 4; dicht.attack.value = 0.005; dicht.release.value = 0.12
    const pegel = ac.createGain(); pegel.gain.value = 1.9
    q.connect(tief).connect(praesenz).connect(dicht).connect(pegel).connect(summe); pegel.connect(stimme)
    const kleinerHall = ac.createGain(); kleinerHall.gain.value = 0.12; pegel.connect(kleinerHall).connect(raum)
    q.start(s); quellen.push(q)
    geruest.nachGruss?.({ spiel, S, ende })
    return ende - t0
  }
  if (!offen && puffer.gruss) gruss(puffer.gruss, Z.GRUSS)
  const ausblenden = (wann, dauer = 2) => { const jetzt0 = ac.currentTime, a = Math.max(jetzt0, T(wann)); summe.gain.cancelScheduledValues(jetzt0); summe.gain.setValueAtTime(summe.gain.value, jetzt0); summe.gain.setValueAtTime(summe.gain.value, a); summe.gain.linearRampToValueAtTime(0, a + dauer) }
  return { t0, gesamt, stimme, gruss, ausblenden, stopp: () => { quellen.forEach((q) => { try { q.stop() } catch { /* schon aus */ } }); try { summe.disconnect() } catch { /* */ } } }
}

// Prüfhilfe: ein Gerüst ohne Lautsprecher berechnen (für Pegelmessung), danach normale Wiedergabe wiederherstellen
export async function offlineRendern(geruest) {
  const echt = ac
  ac = new OfflineAudioContext(2, Math.ceil(44100 * (ZEIT.ENDE + 1)), 44100)
  try { starten(geruest); return await ac.startRendering() } finally { ac = echt }
}

// ---------- die acht Gerüste ----------
// Töne in Hz: D-Moll als gemeinsame Grundtonart (ernst, nordisch)
const D1 = 36.7, D2 = 73.4, A2 = 110, F2 = 87.3, C3 = 130.8, D3 = 146.8, F3 = 174.6, A3 = 220, E3 = 164.8, B2b = 116.5, G2 = 98

export const GERUESTE = [
  {
    name: 'Trailer-Wucht', text: 'Kino-Trailer: tiefe Braams, schwere Einschläge, Rumpeln, steigende Spannung – wie ein Blockbuster-Vorspann.',
    spielen({ spiel, T, Z, S, kante, E }) {
      spiel('rumpeln', T(0.2), { laut: 0.6, ein: 1.2, bis: kante, hallAnteil: 0 })
      S.sub(T(0.3), { von: 55, bis: 30, dauer: 3, laut: 0.5 })
      spiel('braam_metall', T(Z.VISIER), { laut: 0.55 })
      S.pad(T(Z.VISIER), kante, [D2, A2, F3], { laut: 0.08, lp: 300, lpBis: 1600, an: 3 })
      spiel('braam', T(Z.VERWANDLUNG), { laut: 0.7 }); S.sub(T(Z.VERWANDLUNG), { laut: 0.6 })
      spiel('metall_riser', T(Z.VERWANDLUNG + 0.5), { laut: 0.5, bis: kante })
      spiel('braam_dystopie', T(7.0), { laut: 0.6 }); S.sub(T(7.0), { laut: 0.5 })
      S.riser(T(6.2), kante, { laut: 0.3 })
      spiel('abschalten', kante, { laut: 0.5 }); spiel('einsaugen', T(Z.EINSCHLAG - 1.0), { laut: 0.9, hallAnteil: 0, schlussBei: E })
      spiel('boom', E, { laut: 1 }); spiel('braam', E, { laut: 0.9 }); spiel('einschlag_episch', E, { laut: 0.9 }); spiel('subdrop', E, { laut: 0.9, hallAnteil: 0 }); spiel('metall_boom', E, { laut: 0.8 })
      S.sub(E, { von: 80, bis: 28, dauer: 3, laut: 0.8 })
      S.pad(E + 0.3, T(Z.AUS), [D2, A2, D3, F3], { laut: 0.1, lp: 1200, an: 1.5, aus: 2 })
      spiel('flaeche', E + 1, { laut: 0.35, schleife: true, bis: T(Z.ENDE) })
    },
    nachGruss({ spiel, ende }) { spiel('schluss_hit', ende + 0.9, { laut: 0.8 }) },
  },
  {
    name: 'Runen-Ritual 2', text: 'Weiterentwicklung deiner Lieblingsrichtung: dunkler Anfang, Kriegstrommeln, Metallhörner, Gong – mehr Wucht, sauberer Start.',
    hallSek: 4,
    spielen({ spiel, T, Z, S, kante, E }) {
      spiel('dunkle_drohne', T(0.1), { laut: 0.45, ein: 2, bis: kante })
      S.brumm(T(0.2), kante, { f: D1 * 1.2, laut: 0.12, an: 2 })
      spiel('gong', T(Z.VISIER), { laut: 0.65, tempo: 0.85 })
      spiel('metall_ton', T(2.2), { laut: 0.4, ein: 1.5, bis: kante })
      for (let s = 2.4, n = 0; s < Z.VERWANDLUNG; s += 1.1, n++) S.trommel(T(s), { f: 55, laut: 0.55, seite: n % 2 ? 0.3 : -0.3 })
      let s = Z.VERWANDLUNG, abst = 0.62, n = 0
      while (s < Z.DUNKEL - 0.05) {
        S.trommel(T(s), { f: n % 4 === 0 ? 48 : 70, laut: n % 4 === 0 ? 0.8 : 0.45, seite: n % 2 ? 0.4 : -0.4 })
        if (n % 4 === 0) spiel('fass_hammer', T(s), { laut: 0.35, tempo: 0.75, hallAnteil: 0.5 })
        s += abst; abst = Math.max(0.17, abst * 0.9); n++
      }
      spiel('braam_gold', T(Z.VERWANDLUNG + 0.2), { laut: 0.55 }); spiel('braam_metall', T(6.6), { laut: 0.5, bis: kante })
      S.riser(T(7.0), kante, { laut: 0.22, von: 150, bis: 4000 })
      spiel('metall_rueckwaerts', T(Z.EINSCHLAG - 2.8), { laut: 0.55 })
      spiel('einsaugen', T(Z.EINSCHLAG - 1.0), { laut: 0.8, hallAnteil: 0, schlussBei: E })
      spiel('gong', E, { laut: 1 }); spiel('verzerrt_boom', E, { laut: 0.9 }); spiel('braam_gold', E, { laut: 0.85 }); spiel('boom', E, { laut: 0.9 }); S.sub(E, { laut: 0.8, dauer: 2.5 })
      S.trommel(E, { f: 40, laut: 0.9 })
      spiel('metall_ton', E + 1.0, { laut: 0.4, schleife: true, bis: T(Z.ENDE) })
      for (let t = Z.EINSCHLAG + 1.6, k = 0; t < Z.AUS; t += 1.2, k++) S.trommel(T(t), { f: k % 2 ? 70 : 50, laut: 0.3 })
    },
    nachGruss({ spiel, ende }) { spiel('gong', ende + 0.9, { laut: 0.6 }) },
  },
  {
    name: 'Hightech-Glas', text: 'Sauber und edel: kristalline Glasklänge, weiche Flächen, feine metallische Akzente – modernes Apple-/Raumschiff-Gefühl, kein Gepiepse.',
    hallSek: 4.5,
    spielen({ spiel, T, Z, S, kante, E }) {
      S.pad(T(0.2), kante, [D3, A3, E3 * 2], { laut: 0.07, typ: 'triangle', lp: 2500, an: 3, aus: 1.5 })
      const ton = [D3 * 4, A3 * 2, F3 * 4, E3 * 4, A3 * 4, D3 * 8]
      for (let i = 0; i < 6; i++) S.glas(T(Z.VISIER + i * 0.45), ton[i], { laut: 0.09, seite: i % 2 ? 0.5 : -0.5 })
      spiel('hud_akzent', T(Z.VISIER + 0.1), { laut: 0.35, hallAnteil: 0.5 })
      spiel('hologramm', T(3.0), { laut: 0.3, ein: 1, bis: kante })
      S.pad(T(Z.VERWANDLUNG), kante, [D2, A2, F3, C3 * 2], { laut: 0.09, lp: 600, lpBis: 4000, an: 2, aus: 0.5 })
      for (let i = 0; i < 8; i++) S.glas(T(Z.VERWANDLUNG + 0.5 + i * 0.5), ton[(i * 2) % 6] * (i > 4 ? 2 : 1), { laut: 0.07, aus: 2, seite: Math.sin(i) * 0.6 })
      spiel('nano_komplex', T(6.4), { laut: 0.35 }); spiel('hud_rueckmeldung', T(7.4), { laut: 0.3 })
      S.riser(T(7.0), kante, { laut: 0.18, von: 1500, bis: 12000 })
      spiel('downer', kante, { laut: 0.4 })
      spiel('modern_boom', E, { laut: 0.9 }); spiel('subdrop', E, { laut: 0.8, hallAnteil: 0 }); S.sub(E, { laut: 0.6 })
      ;[D3 * 2, A3 * 2, F3 * 4, D3 * 8].forEach((f, i) => S.glas(E + i * 0.02, f, { laut: 0.12, aus: 5 }))
      S.pad(E + 0.4, T(Z.AUS), [D2, A2, F3, A3], { laut: 0.09, typ: 'triangle', lp: 3000, an: 1.5 })
      spiel('ping', E + 0.3, { laut: 0.35 })
    },
    nachGruss({ S, ende }) { [D3 * 4, A3 * 4].forEach((f, i) => S.glas(ende + 0.9 + i * 0.12, f, { laut: 0.1, aus: 4 })) },
  },
  {
    name: 'Mechanische Verwandlung', text: 'Metall in Bewegung: Servos, Hydraulik, Einrasten, Zahnräder – Maschinen setzen sich zusammen (Transformers-Stil als Vorbild).',
    spielen({ spiel, T, Z, S, kante, E }) {
      spiel('rumpeln', T(0.2), { laut: 0.5, ein: 1, bis: kante, hallAnteil: 0 })
      spiel('start_metall', T(0.8), { laut: 0.6 })
      spiel('hydraulik', T(Z.VISIER), { laut: 0.6 }); spiel('zahnrad_lang', T(2.0), { laut: 0.4, bis: kante })
      for (let i = 0; i < 5; i++) spiel(i % 2 ? 'einrasten_2' : 'einrasten_1', T(2.2 + i * 0.45), { laut: 0.55, tempo: 0.85, seite: i % 2 ? 0.5 : -0.5, hallAnteil: 0.15 })
      spiel('verwandlung_1', T(Z.VERWANDLUNG), { laut: 0.9 })
      for (let i = 0; i < 8; i++) {
        const t = Z.VERWANDLUNG + 0.3 + i * 0.5, seite = Math.cos(i) * 0.6
        spiel(['servo_1', 'servo_2', 'servo_3'][i % 3], T(t), { laut: 0.5, tempo: 0.8 + (i % 3) * 0.08, seite })
        spiel(i % 2 ? 'einrasten_2' : 'einrasten_1', T(t + 0.4), { laut: 0.7, tempo: 0.75, seite })
      }
      spiel('verwandlung_2', T(6.6), { laut: 0.8 }); spiel('mech_kraft', T(7.6), { laut: 0.9 }); spiel('metall_kreischen', T(8.2), { laut: 0.35 })
      spiel('tor_metall', T(8.6), { laut: 0.6 })
      spiel('abschalten', kante, { laut: 0.5 }); spiel('einsaugen', T(Z.EINSCHLAG - 1.0), { laut: 0.8, hallAnteil: 0, schlussBei: E })
      spiel('metall_boom', E, { laut: 1 }); spiel('amboss', E, { laut: 0.8 }); spiel('boom', E, { laut: 0.8 }); spiel('tor_metall', E + 0.15, { laut: 0.7 }); S.sub(E, { laut: 0.7 })
      spiel('pneumatik', E + 0.5, { laut: 0.5, seite: -0.4 }); spiel('hydraulik', E + 0.7, { laut: 0.5, seite: 0.4 })
      spiel('zahnrad_takt', E + 1.2, { laut: 0.35, schleife: true, bis: T(Z.AUS) })
      spiel('reaktor_brumm', E + 1.5, { laut: 0.35, schleife: true, bis: T(Z.ENDE), hallAnteil: 0 })
    },
    nachGruss({ spiel, ende }) { spiel('einrasten_2', ende + 0.3, { laut: 0.8, tempo: 0.7 }); spiel('schluss_hit', ende + 0.4, { laut: 0.6 }) },
  },
  {
    name: 'Ambient-Puls', text: 'Ruhig und spannend: ein tiefer Herzschlag, der langsam schneller wird, darüber weiche Flächen – eher Thriller als Action.',
    spielen({ spiel, T, Z, S, kante, E }) {
      let s = 0.5, abst = 1.2
      while (s < Z.DUNKEL - 0.3) { S.herz(T(s), { laut: 0.55 + s * 0.03 }); s += abst; abst = Math.max(0.55, abst * 0.94) }
      S.pad(T(0.5), kante, [D2, A2], { laut: 0.08, lp: 250, lpBis: 1200, an: 4 })
      S.pad(T(Z.VERWANDLUNG), kante, [F3, A3, C3 * 2], { laut: 0.06, lp: 500, lpBis: 2500, an: 3, aus: 0.5 })
      spiel('spannung', T(3.0), { laut: 0.3, ein: 2, bis: kante })
      S.riser(T(6.0), kante, { laut: 0.2, von: 200, bis: 5000 })
      spiel('downer', kante, { laut: 0.4 })
      S.herz(T(Z.EINSCHLAG - 0.9), { laut: 0.5 })
      spiel('boom', E, { laut: 0.9 }); spiel('subdrop', E, { laut: 0.8, hallAnteil: 0 }); S.sub(E, { von: 70, bis: 30, dauer: 3, laut: 0.8 })
      S.pad(E + 0.2, T(Z.AUS), [D2, A2, D3, F3, A3], { laut: 0.1, lp: 1500, an: 2 })
      for (let t = Z.EINSCHLAG + 1.5; t < Z.AUS; t += 1.6) S.herz(T(t), { laut: 0.3 })
    },
  },
  {
    name: 'Elektrisch / Plasma', text: 'Energie lädt sich auf: Summen, Knistern, Plasma-Vorbeiflüge, Blitzentladungen – ein Reaktor fährt hoch.',
    spielen({ spiel, T, Z, S, kante, E }) {
      S.brumm(T(0.2), kante, { f: 50, laut: 0.14, an: 2 })
      spiel('elektro_feld', T(0.6), { laut: 0.35, ein: 1.5, bis: kante })
      spiel('aufladen', T(Z.VISIER), { laut: 0.6 })
      for (let i = 0; i < 4; i++) S.entladung(T(2.4 + i * 0.6), { laut: 0.18, dauer: 0.3, seite: i % 2 ? 0.6 : -0.6 })
      spiel('energie_flaeche', T(Z.VERWANDLUNG), { laut: 0.5, ein: 1, bis: kante })
      spiel('plasma_vorbei', T(5.2), { laut: 0.55, seite: -0.6 }); spiel('plasma_vorbei', T(6.6), { laut: 0.55, seite: 0.6, tempo: 0.9 })
      spiel('blitzschlag', T(7.4), { laut: 0.55 }); S.entladung(T(8.0), { laut: 0.3, dauer: 0.8 })
      spiel('elektro_feld_2', T(7.0), { laut: 0.4, bis: kante }); S.riser(T(6.5), kante, { laut: 0.25, von: 400, bis: 9000 })
      spiel('abschalten', kante, { laut: 0.5 }); spiel('einsaugen', T(Z.EINSCHLAG - 1.0), { laut: 0.8, hallAnteil: 0, schlussBei: E })
      spiel('braam_dystopie', E, { laut: 0.9 }); spiel('blitzschlag', E, { laut: 0.8 }); spiel('modern_boom', E, { laut: 0.8 }); S.sub(E, { laut: 0.7 })
      spiel('plasma_vorbei', E + 0.15, { laut: 0.5 })
      spiel('energie_flaeche', E + 1, { laut: 0.3, schleife: true, bis: T(Z.ENDE) }); S.brumm(E + 0.5, T(Z.ENDE), { f: 50, laut: 0.1 })
    },
    nachGruss({ spiel, S, ende }) { S.entladung(ende + 0.3, { laut: 0.25, dauer: 0.5 }); spiel('stinger', ende + 0.9, { laut: 0.5 }) },
  },
  {
    name: 'Nordischer Chor', text: 'Wikinger-Stimmung: tiefer Männerchor (künstlich), Schamanentrommel, Metallhorn, dann ein mächtiger Akkord beim Einschlag.',
    hallSek: 5,
    spielen({ spiel, T, Z, S, kante, E }) {
      S.chor(T(0.3), T(Z.VERWANDLUNG), [D2, A2], { laut: 0.18, an: 3 })
      for (let s = 1.2, n = 0; s < Z.DUNKEL - 0.2; s += n < 6 ? 0.9 : 0.45, n++) S.trommel(T(s), { f: 58, laut: 0.45 + Math.min(n, 12) * 0.02, fell: 0.6, seite: n % 2 ? 0.25 : -0.25 })
      spiel('metall_ton', T(2.6), { laut: 0.35, ein: 1.5, bis: kante })
      S.chor(T(Z.VERWANDLUNG), kante, [D2, F2 * 2, A2, D3], { laut: 0.22, an: 2, aus: 0.4, vokal: [500, 900] })
      S.brumm(T(Z.VERWANDLUNG), kante, { f: D1, laut: 0.14 })
      S.riser(T(7.2), kante, { laut: 0.15, von: 150, bis: 3000 })
      spiel('einsaugen', T(Z.EINSCHLAG - 1.0), { laut: 0.7, hallAnteil: 0, schlussBei: E })
      spiel('gong', E, { laut: 0.9 }); spiel('boom', E, { laut: 0.9 }); spiel('braam_gold', E, { laut: 0.6 }); S.sub(E, { laut: 0.7 }); S.trommel(E, { f: 42, laut: 0.9, fell: 0.8 })
      S.chor(E, T(Z.AUS), [D2, A2, D3, F3, A3], { laut: 0.24, an: 0.4, aus: 2, vokal: [650, 1080] })
      for (let t = Z.EINSCHLAG + 2, k = 0; t < Z.AUS; t += 1.8, k++) S.trommel(T(t), { f: 55, laut: 0.25, fell: 0.6 })
    },
    nachGruss({ spiel, ende }) { spiel('gong', ende + 0.9, { laut: 0.5, tempo: 0.9 }) },
  },
  {
    name: 'Minimal-Edel', text: 'Wenig, aber sehr hochwertig: viel Stille, ein tiefer Atemzug, ein einziger großer Schlag – wie ein Luxus-Werbespot.',
    hallSek: 5,
    spielen({ spiel, T, Z, S, kante, E }) {
      S.brumm(T(1.0), kante, { f: D1 * 1.5, laut: 0.1, an: 3 })
      S.glas(T(Z.VISIER), D3 * 2, { laut: 0.1, aus: 5 })
      S.pad(T(Z.VERWANDLUNG), kante, [D2, A2, F3], { laut: 0.06, typ: 'triangle', lp: 800, lpBis: 2500, an: 3, aus: 0.3 })
      S.glas(T(Z.VERWANDLUNG), A3 * 2, { laut: 0.08, aus: 5 }); S.glas(T(7.0), F3 * 4, { laut: 0.06, aus: 4, seite: 0.4 })
      S.riser(T(7.8), kante, { laut: 0.12, von: 300, bis: 3000 })
      spiel('einsaugen', T(Z.EINSCHLAG - 1.0), { laut: 0.6, hallAnteil: 0, schlussBei: E })
      spiel('modern_boom', E, { laut: 0.95 }); S.sub(E, { von: 60, bis: 26, dauer: 4, laut: 0.8 })
      S.pad(E + 1, T(Z.AUS), [D2, A2, F3, A3], { laut: 0.07, typ: 'triangle', lp: 1800, an: 3 })
    },
    nachGruss({ S, ende }) { S.glas(ende + 0.4, D3 * 4, { laut: 0.1, aus: 5 }) },
  },
  {
    // Wunsch Auftraggeber 03.11.2026: „mehr Fokus auf Nummer 1 mit ein bisschen von Nummer 4“; der Abschnitt „Dunkel“
    // von 1 (Abschalt-Geräusch) klang billig → ersetzt durch eine mechanische Verriegelung, die immer schneller einrastet.
    name: 'Trailer-Wucht + Verwandlung', text: 'Nummer 1 als Grundlage; der Teil „Verwandlung“ ist jetzt genau wie in Nummer 1. Aus Nummer 4 nur noch: Hydraulik und Einrasten am Anfang, im Dunkel-Teil Druckluft, Verwandlungs-Geräusch und Einrasten, beim Einschlag Amboss, Metalltor, Druckluft und Hydraulik. Der „Dunkel“-Teil ist neu: Druck entweicht, Metall rastet immer schneller ein, Herzschlag-Bass zieht an – dann der Einschlag.',
    spielen({ spiel, T, Z, S, kante, E }) {
      spiel('rumpeln', T(0.2), { laut: 0.6, ein: 1.2, bis: kante, hallAnteil: 0 })
      S.sub(T(0.3), { von: 55, bis: 30, dauer: 3, laut: 0.5 })
      spiel('braam_metall', T(Z.VISIER), { laut: 0.55 }); spiel('hydraulik', T(Z.VISIER + 0.3), { laut: 0.4, seite: -0.4 })
      S.pad(T(Z.VISIER), kante, [D2, A2, F3], { laut: 0.08, lp: 300, lpBis: 1600, an: 3 })
      for (let i = 0; i < 3; i++) spiel(i % 2 ? 'einrasten_2' : 'einrasten_1', T(2.6 + i * 0.55), { laut: 0.45, tempo: 0.8, seite: i % 2 ? 0.5 : -0.5, hallAnteil: 0.2 })
      // Verwandlung: genau wie in Nummer 1 (Wunsch Auftraggeber 03.11.2026 – die Maschinen-Fassung gefiel ihm hier nicht)
      spiel('braam', T(Z.VERWANDLUNG), { laut: 0.7 }); S.sub(T(Z.VERWANDLUNG), { laut: 0.6 })
      spiel('metall_riser', T(Z.VERWANDLUNG + 0.5), { laut: 0.5, bis: kante })
      spiel('braam_dystopie', T(7.0), { laut: 0.6 }); S.sub(T(7.0), { laut: 0.5 })
      S.riser(T(6.2), kante, { laut: 0.3 })
      // Dunkel (neu): Druck entweicht, Verriegelung rastet immer schneller ein, Herzschlag-Bass, Sog in den Einschlag
      spiel('pneumatik', kante, { laut: 0.7 }); spiel('verwandlung_2', kante + 0.1, { laut: 0.55, tempo: 0.7 })
      let t = 0; for (let i = 0; i < 12; i++) { t += 0.13 - i * 0.007; /* letzter Schlag bei Dunkel + 1,25 s, also vor dem Einschlag */ spiel(i % 2 ? 'einrasten_2' : 'einrasten_1', kante + 0.15 + t, { laut: 0.35 + i * 0.03, tempo: 0.7 + i * 0.02, seite: i % 2 ? 0.6 : -0.6, hallAnteil: 0.1 }) }
      S.herz(kante + 0.2, { laut: 0.5 }); S.herz(kante + 0.75, { laut: 0.6 })
      S.riser(kante + 0.2, E, { laut: 0.18, von: 80, bis: 2500 })
      spiel('einsaugen', T(Z.EINSCHLAG - 1.0), { laut: 0.9, hallAnteil: 0, schlussBei: E })
      // Einschlag: Trailer-Wucht plus Metall
      spiel('boom', E, { laut: 1 }); spiel('braam', E, { laut: 0.9 }); spiel('einschlag_episch', E, { laut: 0.85 }); spiel('subdrop', E, { laut: 0.9, hallAnteil: 0 }); spiel('metall_boom', E, { laut: 0.8 }); spiel('amboss', E, { laut: 0.5 }); spiel('tor_metall', E + 0.15, { laut: 0.5 })
      S.sub(E, { von: 80, bis: 28, dauer: 3, laut: 0.8 })
      spiel('pneumatik', E + 0.6, { laut: 0.35, seite: -0.4 }); spiel('hydraulik', E + 0.8, { laut: 0.35, seite: 0.4 })
      S.pad(E + 0.3, T(Z.AUS), [D2, A2, D3, F3], { laut: 0.1, lp: 1200, an: 1.5, aus: 2 })
      spiel('flaeche', E + 1, { laut: 0.35, schleife: true, bis: T(Z.ENDE) })
    },
    nachGruss({ spiel, ende }) { spiel('einrasten_2', ende + 0.8, { laut: 0.6, tempo: 0.7 }); spiel('schluss_hit', ende + 0.9, { laut: 0.8 }) },
  },
]
