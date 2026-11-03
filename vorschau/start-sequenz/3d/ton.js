// Ton der 3D-Start-Sequenz (03.11.2026): Kino-Geräusche aus den Sonniss-GDC-Bundles (toene/, aus toene.json erzeugt),
// geschichtet nach dem Vorbild der Transformers-/Iron-Man-Tonarbeit (echtes Metall + Mechanik + Trailer-Wucht).
// Mischung: alle Geräusche → Musikbus (Klangsenke im Sprachbereich + Absenkung um 12 dB, solange Loki spricht) →
// Summe → Begrenzer. Lokis Stimme läuft getrennt: Tiefen weg, verdichtet, angehoben – damit man ihn immer versteht
// (Vorgabe Auftraggeber 03.11.2026).

let ac = null
const puffer = {}
let analyseSumme = null, analyseStimme = null, stimmeAktiv = false
const freq = new Uint8Array(1024), welle = new Uint8Array(2048)

const NAMEN = ['start_metall', 'braam_metall', 'rumpeln', 'hud_an', 'hud_piep', 'hud_akzent', 'hud_daten', 'hud_prozess', 'hud_scan', 'hud_klick',
  'verwandlung_1', 'verwandlung_2', 'mechanik_glitch', 'mech_kraft', 'servo_1', 'servo_2', 'servo_3', 'einrasten_1', 'einrasten_2', 'riser', 'aufladen',
  'warp', 'abschalten', 'downer', 'einsaugen', 'boom', 'einschlag_episch', 'amboss', 'braam', 'braam_gold', 'einschlag_warp', 'blitzschlag', 'ping',
  'hydraulik', 'pneumatik', 'nano_komplex', 'zahnrad_hammer', 'flaeche', 'reaktor_brumm', 'zahnrad_takt', 'hologramm', 'alarm', 'schluss_hit', 'stinger',
  'subdrop', 'metall_boom', 'metall_riser', 'modern_boom', 'gong', 'hud_zoom', 'hud_rueckmeldung', 'metall_schieben', 'zahnraeder', 'hud_glitch']

export async function tonVorbereiten() {
  if (!ac) ac = new AudioContext({ latencyHint: 'playback' })
  if (ac.state === 'suspended') await ac.resume()
  const fehlt = [...NAMEN.filter((n) => !(n in puffer)), ...('gruss' in puffer ? [] : ['gruss'])]
  await Promise.all(fehlt.map(async (n) => {
    try { puffer[n] = await ac.decodeAudioData(await (await fetch(n === 'gruss' ? '../loki-gruss.wav' : `toene/${n}.ogg`)).arrayBuffer()) } catch { puffer[n] = null }
  }))
  return NAMEN.filter((n) => !puffer[n])
}

export function tonDaten() {
  if (!analyseSumme) return {}
  analyseSumme.getByteFrequencyData(freq)
  if (stimmeAktiv) analyseStimme.getByteTimeDomainData(welle)
  return { frequenz: freq, welle: stimmeAktiv ? welle : null }
}

function hall() {
  const len = ac.sampleRate * 3.2, b = ac.createBuffer(2, len, ac.sampleRate)
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3) }
  const k = ac.createConvolver(); k.buffer = b; return k
}

export function tonStarten(e, Z) {
  const t0 = ac.currentTime + 0.08, T = (s) => t0 + s, quellen = []
  // --- Summe mit Begrenzer
  const summe = ac.createGain(); summe.gain.value = 0.85
  const begrenzer = ac.createDynamicsCompressor()
  begrenzer.threshold.value = -4; begrenzer.knee.value = 2; begrenzer.ratio.value = 20; begrenzer.attack.value = 0.002; begrenzer.release.value = 0.15
  summe.connect(begrenzer).connect(ac.destination)
  analyseSumme = ac.createAnalyser(); analyseSumme.fftSize = 2048; summe.connect(analyseSumme)
  summe.gain.setValueAtTime(0.85, T(Z.AUS)); summe.gain.linearRampToValueAtTime(0, T(Z.ENDE))
  // --- Musikbus: Klangsenke im Sprachbereich + Absenkung, solange Loki spricht
  const musik = ac.createGain()
  const senke = ac.createBiquadFilter(); senke.type = 'peaking'; senke.frequency.value = 2400; senke.Q.value = 0.7; senke.gain.value = 0
  const absenken = ac.createGain(); absenken.gain.value = 1
  musik.connect(senke).connect(absenken).connect(summe)
  const raum = hall(), raumPegel = ac.createGain(); raumPegel.gain.value = 0.28; raum.connect(raumPegel).connect(musik)

  // ein Geräusch abspielen
  const spiel = (name, wann, { laut = 1, tempo = 1, ab = 0, bis = null, schleife = false, seite = 0, hallAnteil = 0.25 } = {}) => {
    const b = puffer[name]; if (!b) return null
    const q = ac.createBufferSource(); q.buffer = b; q.playbackRate.value = tempo; q.loop = schleife
    const g = ac.createGain(); g.gain.value = laut
    const p = ac.createStereoPanner(); p.pan.value = seite
    q.connect(g).connect(p); p.connect(musik)
    if (hallAnteil) { const h = ac.createGain(); h.gain.value = hallAnteil; p.connect(h).connect(raum) }
    q.start(Math.max(ac.currentTime, wann), ab)
    if (bis != null) { g.gain.setValueAtTime(laut, bis - 0.03); g.gain.linearRampToValueAtTime(0, bis); q.stop(bis + 0.05) }
    quellen.push(q); return { q, g }
  }
  const harteKante = T(Z.DUNKEL) // alles, was vorher läuft, endet hier mit hartem Schnitt
  const B = e.id === 'B', C = e.id === 'C', D = e.id === 'D'

  // ===== Akt 1: Lichtlinie, Visier bootet =====
  spiel('start_metall', T(0.1), { laut: 0.9 })
  spiel('braam_metall', T(0.5), { laut: 0.32, bis: harteKante })
  spiel('rumpeln', T(1.2), { laut: 0.6, bis: harteKante, hallAnteil: 0 })
  spiel('hud_an', T(Z.VISIER), { laut: 0.7 })
  spiel('hud_zoom', T(Z.VISIER + 0.05), { laut: 0.55 })
  const winkel = [-48, -34, -48, -34, -48, -34, 34, 48, 34, 48, 34, 48]
  winkel.forEach((w, i) => spiel('hud_piep', T(Z.VISIER + 0.15 + i * 0.22), { laut: 0.32, tempo: 0.85 + (i % 4) * 0.08, seite: w / 60, hallAnteil: 0.15 }))
  spiel('hud_scan', T(2.0), { laut: 0.5, seite: -0.5 })
  spiel('hud_daten', T(2.4), { laut: 0.35, seite: 0.5, bis: harteKante })
  spiel('hud_prozess', T(3.0), { laut: 0.45 })
  spiel('hud_rueckmeldung', T(3.05), { laut: 0.5 })
  spiel('hud_akzent', T(3.6), { laut: 0.5, seite: 0.3 })
  spiel('hud_glitch', T(3.9), { laut: 0.35, seite: -0.4, bis: harteKante })
  if (B) spiel('alarm', T(1.6), { laut: 0.22, bis: harteKante })

  // ===== Verwandlung: Platten fliegen heran, Servos, Einrasten, Steigerung =====
  spiel('verwandlung_1', T(Z.VERWANDLUNG), { laut: 0.95 })
  spiel('metall_riser', T(Z.VERWANDLUNG + 0.1), { laut: 0.6, bis: harteKante })
  for (let i = 0; i < 10; i++) {
    const takt = Z.VERWANDLUNG + 0.3 + i * 0.33, seite = Math.cos((i / 10) * Math.PI * 2) * 0.5
    spiel(['servo_1', 'servo_2', 'servo_3'][i % 3], T(takt), { laut: 0.5, tempo: 0.85 + (i % 3) * 0.08, seite })
    spiel(i % 2 ? 'einrasten_2' : 'einrasten_1', T(takt + 1.0), { laut: 0.75, tempo: 0.9 + (i % 4) * 0.05, seite })
    if (i % 3 === 0) spiel('metall_schieben', T(takt + 0.6), { laut: 0.35, seite })
  }
  spiel('riser', T(3.2), { laut: 0.65, bis: harteKante })
  spiel('warp', T(2.9), { laut: 0.55, bis: harteKante })
  spiel('verwandlung_2', T(6.0), { laut: 0.9 })
  spiel('aufladen', T(6.4), { laut: 0.6 })
  spiel('zahnraeder', T(6.9), { laut: 0.45 })
  spiel('mechanik_glitch', T(7.0), { laut: 0.7 })
  spiel('mech_kraft', T(7.8), { laut: 0.9 })

  // ===== Dunkel: harter Schnitt, Abschalten, Einsaugen vor dem Einschlag =====
  spiel('abschalten', T(Z.DUNKEL), { laut: 0.7 })
  spiel('downer', T(Z.DUNKEL + 0.02), { laut: 0.55 })
  const sog = puffer.einsaugen
  if (sog) spiel('einsaugen', T(Z.EINSCHLAG - 1.0), { laut: 0.95, ab: Math.max(0, sog.duration - 1.0), hallAnteil: 0 })

  // ===== Einschlag: alles auf einmal, metallisch und tief =====
  const E = T(Z.EINSCHLAG)
  spiel('boom', E, { laut: 1 }); spiel('einschlag_episch', E, { laut: 1 }); spiel('metall_boom', E, { laut: 0.95 })
  spiel('modern_boom', E, { laut: 0.8 }); spiel('amboss', E, { laut: 0.8 }); spiel('einschlag_warp', E, { laut: 0.75 })
  spiel(C ? 'braam_gold' : 'braam', E, { laut: 0.9 }); spiel('blitzschlag', E + 0.05, { laut: 0.55 }); spiel('subdrop', E, { laut: 0.9, hallAnteil: 0 })
  spiel('gong', E + 0.02, { laut: C ? 0.9 : 0.4 })
  spiel('ping', T(Z.EINSCHLAG + 0.2), { laut: 0.55 })
  for (let k = 0; k < 24; k += 2) spiel('hud_klick', T(Z.EINSCHLAG + 0.2 + k * 0.07), { laut: 0.22, tempo: 1.1 + k * 0.02, seite: Math.sin(k / 24 * Math.PI * 2) * 0.6, hallAnteil: 0.1 })
  // Anzeigen schwingen zurück – Pneumatik, Hydraulik, Mechanik
  spiel('pneumatik', T(Z.EINSCHLAG + 0.45), { laut: 0.6, seite: -0.4 })
  spiel('hydraulik', T(Z.EINSCHLAG + 0.6), { laut: 0.65, seite: 0.4 })
  spiel('nano_komplex', T(Z.EINSCHLAG + 0.8), { laut: 0.55 })
  spiel('zahnrad_hammer', T(Z.EINSCHLAG + 1.1), { laut: 0.55 })
  for (let k = 0; k < 4; k++) spiel('metall_schieben', T(Z.EINSCHLAG + 0.5 + k * 0.28), { laut: 0.28, seite: k % 2 ? 0.6 : -0.6 })
  spiel('hud_rueckmeldung', T(Z.EINSCHLAG + 0.95), { laut: 0.4 })
  // Fläche, Reaktor-Brummen und mechanischer Takt bis zum Schluss
  spiel('flaeche', T(Z.EINSCHLAG + 1.0), { laut: 0.45, schleife: true, bis: T(Z.ENDE) })
  spiel('reaktor_brumm', T(Z.EINSCHLAG + 1.5), { laut: 0.45, schleife: true, bis: T(Z.ENDE), hallAnteil: 0 })
  spiel('zahnrad_takt', T(Z.EINSCHLAG + 1.5), { laut: 0.3, schleife: true, bis: T(Z.AUS) })
  if (D) spiel('hologramm', T(Z.EINSCHLAG + 1.0), { laut: 0.4 })

  // ===== Lokis Begrüßung: Musik runter, Klangsenke, Stimme klar und laut =====
  const g = puffer.gruss
  if (g) {
    const S = T(Z.GRUSS), ende = S + g.duration
    absenken.gain.setValueAtTime(1, S - 0.3); absenken.gain.linearRampToValueAtTime(0.25, S - 0.05) // ≈ −12 dB
    absenken.gain.setValueAtTime(0.25, ende + 0.1); absenken.gain.linearRampToValueAtTime(1, ende + 0.8)
    senke.gain.setValueAtTime(0, S - 0.3); senke.gain.linearRampToValueAtTime(-9, S - 0.05)
    senke.gain.setValueAtTime(-9, ende + 0.1); senke.gain.linearRampToValueAtTime(0, ende + 0.8)
    const q = ac.createBufferSource(); q.buffer = g
    const tief = ac.createBiquadFilter(); tief.type = 'highpass'; tief.frequency.value = 90
    const praesenz = ac.createBiquadFilter(); praesenz.type = 'peaking'; praesenz.frequency.value = 3000; praesenz.Q.value = 0.9; praesenz.gain.value = 3
    const dicht = ac.createDynamicsCompressor(); dicht.threshold.value = -26; dicht.ratio.value = 4; dicht.attack.value = 0.005; dicht.release.value = 0.12
    const pegel = ac.createGain(); pegel.gain.value = 1.9
    analyseStimme = ac.createAnalyser(); analyseStimme.fftSize = 2048
    q.connect(tief).connect(praesenz).connect(dicht).connect(pegel).connect(summe)
    pegel.connect(analyseStimme)
    const kleinerHall = ac.createGain(); kleinerHall.gain.value = 0.12; pegel.connect(kleinerHall).connect(raum)
    q.start(S); quellen.push(q)
    const an = setTimeout(() => { stimmeAktiv = true }, (S - ac.currentTime) * 1000)
    const aus = setTimeout(() => { stimmeAktiv = false }, (ende - ac.currentTime) * 1000)
    quellen.push({ stop: () => { clearTimeout(an); clearTimeout(aus); stimmeAktiv = false } })
    // tiefes Brummen unter der Stimme (stört die Verständlichkeit nicht – liegt weit unter dem Sprachbereich)
    for (const f of [44.5, 45.3]) {
      const o = ac.createOscillator(); o.frequency.value = f
      const og = ac.createGain(); og.gain.setValueAtTime(0, S - 0.4); og.gain.linearRampToValueAtTime(0.18, S + 0.6); og.gain.setValueAtTime(0.18, ende); og.gain.linearRampToValueAtTime(0, ende + 1.5)
      o.connect(og).connect(summe); o.start(S - 0.4); o.stop(ende + 1.6); quellen.push(o)
    }
    spiel('schluss_hit', ende + 0.35, { laut: 0.75 })
    spiel('stinger', ende + 0.35, { laut: 0.55 })
  }
  return () => { quellen.forEach((q) => { try { q.stop() } catch { /* schon aus */ } }); try { summe.disconnect() } catch { /* */ } }
}
