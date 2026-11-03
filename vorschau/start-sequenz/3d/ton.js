// Ton der 3D-Start-Sequenz – Runde 3 (03.11.2026): vier Klangwelten aus den Sonniss-GDC-Bundles (toene/, aus
// toene.json erzeugt). Gemeinsamer Ablauf (Visier → Verwandlung → Dunkel → Einschlag → Gruß), je Variante andere Geräusche:
//   kommando – Trailer-Wucht, Metall, Servos (Runde 2, verfeinert)
//   mechanik – Zahnräder, Ratschen, Uhrwerk-Takt, Hydraulik, schwere Eisenschläge
//   energie  – elektromagnetische Felder, Plasma, Energie-Steigerungen, digitale Störungen
//   ritual   – Gong, Kriegstrommeln aus Metall/Fässern, tiefe Metallhörner, dann Sci-Fi-Einschlag
// Mischung: Geräusche → Musikbus (Klangsenke im Sprachbereich + Absenkung um 12 dB, solange Loki spricht) → Summe →
// Begrenzer. Lokis Stimme getrennt: Tiefen weg, Präsenz, verdichtet, angehoben (Vorgabe: immer gut verständlich).

// Pfade relativ zu dieser Datei, damit auch andere Seiten (z. B. ../hud/) die Töne nutzen können
// (als Text gebildet: Vite schreibt new URL('./', import.meta.url) beim Ausliefern um und verliert dabei den Schrägstrich)
const BASIS = String(import.meta.url).split('?')[0].replace(/[^/]*$/, '')
let ac = null
const puffer = {}
let analyseSumme = null, analyseStimme = null, stimmeAktiv = false, grussGeladen = 0
const freq = new Uint8Array(1024), welle = new Uint8Array(2048)

const NAMEN = ['start_metall', 'braam_metall', 'rumpeln', 'hud_an', 'hud_piep', 'hud_akzent', 'hud_daten', 'hud_prozess', 'hud_scan', 'hud_klick',
  'verwandlung_1', 'verwandlung_2', 'mechanik_glitch', 'mech_kraft', 'servo_1', 'servo_2', 'servo_3', 'einrasten_1', 'einrasten_2', 'riser', 'aufladen',
  'warp', 'abschalten', 'downer', 'einsaugen', 'boom', 'einschlag_episch', 'amboss', 'braam', 'braam_gold', 'einschlag_warp', 'blitzschlag', 'ping',
  'hydraulik', 'pneumatik', 'nano_komplex', 'zahnrad_hammer', 'flaeche', 'reaktor_brumm', 'zahnrad_takt', 'hologramm', 'alarm', 'schluss_hit', 'stinger',
  'subdrop', 'metall_boom', 'metall_riser', 'modern_boom', 'gong', 'hud_zoom', 'hud_rueckmeldung', 'metall_schieben', 'zahnraeder', 'hud_glitch',
  'eisen_hammer', 'fass_hammer', 'metall_ton', 'metall_kreischen', 'metall_rueckwaerts', 'dunkle_drohne', 'elektro_feld', 'elektro_feld_2', 'plasma_vorbei',
  'puls', 'mech_metall', 'metall_rassel', 'tor_metall', 'zahnrad_lang', 'spannung', 'energie_flaeche', 'granular', 'braam_dystopie', 'verzerrt_boom',
  'daten_glitch', 'computer_lauf']

export async function tonVorbereiten(grussNr = 1) {
  if (!ac) ac = new AudioContext({ latencyHint: 'playback' })
  if (ac.state === 'suspended') await ac.resume()
  if (grussGeladen !== grussNr) { delete puffer.gruss; grussGeladen = grussNr }
  const fehlt = [...NAMEN.filter((n) => !(n in puffer)), ...('gruss' in puffer ? [] : ['gruss'])]
  await Promise.all(fehlt.map(async (n) => {
    try { puffer[n] = await ac.decodeAudioData(await (await fetch(new URL(n === 'gruss' ? `../gruss-${grussNr}.wav` : `toene/${n}.ogg`, BASIS))).arrayBuffer()) } catch { puffer[n] = null }
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

export function tonStarten(v, Z) {
  const t0 = ac.currentTime + 0.08, T = (s) => t0 + s, quellen = []
  const summe = ac.createGain(); summe.gain.value = 0.85
  const begrenzer = ac.createDynamicsCompressor()
  begrenzer.threshold.value = -4; begrenzer.knee.value = 2; begrenzer.ratio.value = 20; begrenzer.attack.value = 0.002; begrenzer.release.value = 0.15
  summe.connect(begrenzer).connect(ac.destination)
  analyseSumme = ac.createAnalyser(); analyseSumme.fftSize = 2048; summe.connect(analyseSumme)
  summe.gain.setValueAtTime(0.85, T(Z.AUS)); summe.gain.linearRampToValueAtTime(0, T(Z.ENDE))
  const musik = ac.createGain()
  const senke = ac.createBiquadFilter(); senke.type = 'peaking'; senke.frequency.value = 2400; senke.Q.value = 0.7; senke.gain.value = 0
  const absenken = ac.createGain(); absenken.gain.value = 1
  musik.connect(senke).connect(absenken).connect(summe)
  const raum = hall(), raumPegel = ac.createGain(); raumPegel.gain.value = 0.28; raum.connect(raumPegel).connect(musik)

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
  const kante = T(Z.DUNKEL), E = T(Z.EINSCHLAG), k = v.klang
  const seiteVon = (i) => (i % 2 ? 0.55 : -0.55)

  // ===== Akt 1: Lichtlinie + Visier bootet =====
  if (k === 'ritual') { spiel('gong', T(0.1), { laut: 0.85 }); spiel('metall_ton', T(0.6), { laut: 0.5, bis: kante }) }
  else spiel('start_metall', T(0.1), { laut: 0.9 })
  spiel(k === 'energie' ? 'dunkle_drohne' : 'braam_metall', T(0.5), { laut: k === 'energie' ? 0.55 : 0.32, bis: kante })
  spiel('rumpeln', T(1.2), { laut: 0.55, bis: kante, hallAnteil: 0 })
  spiel(k === 'energie' ? 'elektro_feld' : 'hud_an', T(Z.VISIER), { laut: 0.65, bis: k === 'energie' ? kante : null })
  spiel('hud_zoom', T(Z.VISIER + 0.05), { laut: 0.5 })
  // je Anzeige ein Ton beim Erscheinen – je Klangwelt ein anderer
  const auftauchen = { kommando: 'hud_piep', mechanik: 'einrasten_1', energie: 'puls', ritual: 'hud_klick' }[k]
  for (let i = 0; i < 10; i++) spiel(auftauchen, T(Z.VISIER + 0.15 + i * 0.24), { laut: k === 'mechanik' ? 0.45 : 0.3, tempo: 0.85 + (i % 4) * 0.08, seite: seiteVon(i), hallAnteil: 0.15 })
  if (k === 'kommando') { spiel('hud_scan', T(2.0), { laut: 0.5, seite: -0.5 }); spiel('hud_daten', T(2.4), { laut: 0.35, seite: 0.5, bis: kante }); spiel('hud_prozess', T(3.0), { laut: 0.45 }); spiel('hud_glitch', T(3.9), { laut: 0.35, seite: -0.4, bis: kante }) }
  if (k === 'mechanik') { spiel('zahnrad_lang', T(1.8), { laut: 0.5, bis: kante }); for (let s = 2.0; s < 9.0; s += 0.5) spiel('einrasten_1', T(s), { laut: 0.28, tempo: 1.15, hallAnteil: 0.1 }); spiel('metall_rassel', T(3.2), { laut: 0.4, seite: 0.4 }) }
  if (k === 'energie') { spiel('computer_lauf', T(2.0), { laut: 0.35, bis: kante }); spiel('daten_glitch', T(2.6), { laut: 0.3, seite: 0.4, bis: kante }); spiel('plasma_vorbei', T(3.4), { laut: 0.5, seite: -0.6 }) }
  if (k === 'ritual') { for (let s = 2.0, n = 0; s < 4.6; s += 0.75, n++) spiel(n % 2 ? 'fass_hammer' : 'eisen_hammer', T(s), { laut: 0.35, tempo: 0.8, hallAnteil: 0.45 }) }
  spiel('hud_rueckmeldung', T(3.05), { laut: 0.45 })

  // ===== Verwandlung =====
  spiel(k === 'energie' ? 'aufladen' : 'verwandlung_1', T(Z.VERWANDLUNG), { laut: 0.95 })
  spiel(k === 'energie' ? 'energie_flaeche' : 'metall_riser', T(Z.VERWANDLUNG + 0.1), { laut: 0.6, bis: kante })
  const teile = k === 'mechanik' ? 2 : k === 'energie' ? 14 : 10
  for (let i = 0; i < teile; i++) {
    const takt = k === 'mechanik' ? Z.VERWANDLUNG + (i ? 2.2 : 0.4) : Z.VERWANDLUNG + 0.3 + i * (3.3 / teile), seite = Math.cos((i / teile) * Math.PI * 2) * 0.5
    if (k === 'energie') { spiel('puls', T(takt), { laut: 0.3, tempo: 0.7 + i * 0.04, seite }); continue }
    spiel(['servo_1', 'servo_2', 'servo_3'][i % 3], T(takt), { laut: 0.5, tempo: 0.85 + (i % 3) * 0.08, seite })
    spiel(i % 2 ? 'einrasten_2' : 'einrasten_1', T(takt + 1.0), { laut: k === 'mechanik' ? 1 : 0.75, tempo: k === 'mechanik' ? 0.7 : 0.9 + (i % 4) * 0.05, seite })
    if (k === 'mechanik') spiel('tor_metall', T(takt + 0.9), { laut: 0.6 })
    else if (i % 3 === 0) spiel('metall_schieben', T(takt + 0.6), { laut: 0.35, seite })
  }
  spiel('riser', T(3.2), { laut: 0.65, bis: kante })
  spiel(k === 'energie' ? 'elektro_feld_2' : 'warp', T(2.9), { laut: 0.55, bis: kante })
  if (k === 'kommando') { spiel('verwandlung_2', T(6.0), { laut: 0.9 }); spiel('aufladen', T(6.4), { laut: 0.6 }); spiel('mechanik_glitch', T(7.0), { laut: 0.7 }); spiel('mech_kraft', T(7.8), { laut: 0.9 }) }
  if (k === 'mechanik') { spiel('zahnraeder', T(6.2), { laut: 0.6 }); spiel('hydraulik', T(7.0), { laut: 0.7 }); spiel('zahnrad_hammer', T(7.6), { laut: 0.7 }); spiel('metall_kreischen', T(8.1), { laut: 0.45 }) }
  if (k === 'energie') { spiel('blitzschlag', T(6.2), { laut: 0.6, seite: -0.3 }); spiel('hologramm', T(6.6), { laut: 0.5, bis: kante }); spiel('daten_glitch', T(7.5), { laut: 0.4 }); spiel('blitzschlag', T(8.3), { laut: 0.7, seite: 0.3 }) }
  if (k === 'ritual') {
    // Kriegstrommeln werden schneller bis zum Schnitt
    let s = Z.VERWANDLUNG, abstand = 0.6, n = 0
    while (s < Z.DUNKEL - 0.05) { spiel(n % 4 === 0 ? 'boom' : n % 2 ? 'fass_hammer' : 'eisen_hammer', T(s), { laut: n % 4 === 0 ? 0.7 : 0.45, tempo: 0.8, hallAnteil: 0.4 }); s += abstand; abstand = Math.max(0.18, abstand * 0.9); n++ }
    spiel('braam_metall', T(6.0), { laut: 0.5, bis: kante }); spiel('verwandlung_2', T(6.8), { laut: 0.6 })
  }

  // ===== Dunkel =====
  spiel('abschalten', kante, { laut: 0.7 }); spiel('downer', T(Z.DUNKEL + 0.02), { laut: 0.55 })
  if (k === 'ritual') spiel('metall_rueckwaerts', T(Z.EINSCHLAG - 2.8), { laut: 0.6 })
  const sog = puffer.einsaugen
  if (sog) spiel('einsaugen', T(Z.EINSCHLAG - 1.0), { laut: 0.95, ab: Math.max(0, sog.duration - 1.0), hallAnteil: 0 })

  // ===== Einschlag =====
  spiel('boom', E, { laut: 1 }); spiel('subdrop', E, { laut: 0.9, hallAnteil: 0 }); spiel('einschlag_episch', E, { laut: 0.9 })
  if (k === 'kommando') { spiel('metall_boom', E, { laut: 0.95 }); spiel('modern_boom', E, { laut: 0.8 }); spiel('amboss', E, { laut: 0.8 }); spiel('braam', E, { laut: 0.9 }); spiel('einschlag_warp', E, { laut: 0.75 }) }
  if (k === 'mechanik') { spiel('eisen_hammer', E, { laut: 1, tempo: 0.7 }); spiel('amboss', E, { laut: 0.9 }); spiel('metall_boom', E, { laut: 0.8 }); spiel('braam_metall', E, { laut: 0.6 }); spiel('tor_metall', E + 0.15, { laut: 0.8 }) }
  if (k === 'energie') { spiel('braam_dystopie', E, { laut: 0.9 }); spiel('blitzschlag', E, { laut: 0.8 }); spiel('modern_boom', E, { laut: 0.8 }); spiel('plasma_vorbei', E + 0.1, { laut: 0.6 }); spiel('elektro_feld', E + 0.2, { laut: 0.4 }) }
  if (k === 'ritual') { spiel('gong', E, { laut: 1 }); spiel('verzerrt_boom', E, { laut: 0.9 }); spiel('braam_gold', E, { laut: 0.85 }); spiel('fass_hammer', E, { laut: 0.8, tempo: 0.6 }); spiel('metall_boom', E, { laut: 0.8 }) }
  spiel('ping', T(Z.EINSCHLAG + 0.2), { laut: 0.5 })
  for (let n = 0; n < 24; n += 2) spiel(k === 'mechanik' ? 'einrasten_1' : 'hud_klick', T(Z.EINSCHLAG + 0.2 + n * 0.07), { laut: 0.22, tempo: 1.1 + n * 0.02, seite: Math.sin(n / 24 * Math.PI * 2) * 0.6, hallAnteil: 0.1 })
  // Anzeigen kommen zurück
  if (k === 'energie') { spiel('daten_glitch', T(Z.EINSCHLAG + 0.5), { laut: 0.4 }); spiel('puls', T(Z.EINSCHLAG + 0.7), { laut: 0.4 }); spiel('puls', T(Z.EINSCHLAG + 0.95), { laut: 0.35, tempo: 1.2 }) }
  else { spiel('pneumatik', T(Z.EINSCHLAG + 0.45), { laut: 0.6, seite: -0.4 }); spiel('hydraulik', T(Z.EINSCHLAG + 0.6), { laut: 0.6, seite: 0.4 }); spiel('nano_komplex', T(Z.EINSCHLAG + 0.8), { laut: 0.5 }) }
  if (k !== 'energie') for (let n = 0; n < 4; n++) spiel('metall_schieben', T(Z.EINSCHLAG + 0.5 + n * 0.28), { laut: 0.28, seite: n % 2 ? 0.6 : -0.6 })
  // Teppich bis zum Schluss
  const teppich = { kommando: 'flaeche', mechanik: 'spannung', energie: 'energie_flaeche', ritual: 'metall_ton' }[k]
  spiel(teppich, T(Z.EINSCHLAG + 1.0), { laut: 0.45, schleife: true, bis: T(Z.ENDE) })
  spiel(k === 'energie' ? 'elektro_feld_2' : 'reaktor_brumm', T(Z.EINSCHLAG + 1.5), { laut: 0.4, schleife: true, bis: T(Z.ENDE), hallAnteil: 0 })
  if (k === 'mechanik') spiel('zahnrad_takt', T(Z.EINSCHLAG + 1.2), { laut: 0.55, schleife: true, bis: T(Z.AUS) })
  if (k === 'kommando') spiel('zahnrad_takt', T(Z.EINSCHLAG + 1.5), { laut: 0.25, schleife: true, bis: T(Z.AUS) })
  if (k === 'energie') spiel('hologramm', T(Z.EINSCHLAG + 1.0), { laut: 0.35 })
  if (k === 'ritual') for (let s = Z.EINSCHLAG + 1.6, n = 0; s < Z.AUS; s += 1.2, n++) spiel(n % 2 ? 'fass_hammer' : 'boom', T(s), { laut: n % 2 ? 0.25 : 0.3, tempo: 0.75, hallAnteil: 0.5 })

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
    q.connect(tief).connect(praesenz).connect(dicht).connect(pegel).connect(summe); pegel.connect(analyseStimme)
    const kleinerHall = ac.createGain(); kleinerHall.gain.value = 0.12; pegel.connect(kleinerHall).connect(raum)
    q.start(S); quellen.push(q)
    const an = setTimeout(() => { stimmeAktiv = true }, (S - ac.currentTime) * 1000)
    const ab = setTimeout(() => { stimmeAktiv = false }, (ende - ac.currentTime) * 1000)
    quellen.push({ stop: () => { clearTimeout(an); clearTimeout(ab); stimmeAktiv = false } })
    for (const f of [44.5, 45.3]) {
      const o = ac.createOscillator(); o.frequency.value = f
      const og = ac.createGain(); og.gain.setValueAtTime(0, S - 0.4); og.gain.linearRampToValueAtTime(0.18, S + 0.6); og.gain.setValueAtTime(0.18, ende); og.gain.linearRampToValueAtTime(0, ende + 1.5)
      o.connect(og).connect(summe); o.start(S - 0.4); o.stop(ende + 1.6); quellen.push(o)
    }
    spiel(k === 'ritual' ? 'gong' : 'schluss_hit', ende + 0.35, { laut: k === 'ritual' ? 0.6 : 0.75 })
    spiel('stinger', ende + 0.35, { laut: 0.5 })
  }
  return () => { quellen.forEach((q) => { try { q.stop() } catch { /* schon aus */ } }); try { summe.disconnect() } catch { /* */ } }
}
