// PV-Tagesverlauf fürs Dauer-HUD (06.11.2026, Wunsch Auftraggeber: wie „Energiemonitor“ in der FEMS-App). Die REST-Schnittstelle
// gibt keinen Verlauf heraus (geprüft: „Read-Only mode“). Darum derselbe Weg wie die Seite der Anlage: WebSocket auf Port 8085,
// Anmeldung mit demselben Passwort, dann die lesenden Abfragen queryHistoricTimeseriesData und queryHistoricTimeseriesEnergy
// (openems.github.io/openems.io/javadoc). Nicht öffentlich als Schnittstelle zugesagt, kann sich mit Updates ändern; dann fehlt
// nur der Verlauf. Es wird nur gelesen, und nur vom Gerät mit der eingetragenen Heimnetz-Adresse.
const ZEITGRENZE_MS = 20_000
const KANAELE = { pv: '_sum/ProductionActivePower', haus: '_sum/ConsumptionActivePower', netz: '_sum/GridActivePower' }
const ENERGIE = { erzeugt: '_sum/ProductionActiveEnergy', verbraucht: '_sum/ConsumptionActiveEnergy', bezug: '_sum/GridBuyActiveEnergy', verkauf: '_sum/GridSellActiveEnergy' }

const heuteBerlin = (ms) => new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })

/** Reine Auswertung (getestet): Antworten der Anlage → { punkte: [{pv, haus, netz} | null], summen: {…kWh} | null } */
function auswerten(verlauf, energie) {
  const d = verlauf?.data, n = verlauf?.timestamps?.length ?? 0
  if (!d || !n) return null
  const punkte = Array.from({ length: n }, (_, i) => {
    const w = (k) => { const v = d[KANAELE[k]]?.[i]; return typeof v === 'number' ? v : null }
    const pv = w('pv'), haus = w('haus'), netz = w('netz')
    return pv == null || haus == null ? null : { pv: Math.max(0, pv), haus: Math.max(0, haus), netz: netz ?? 0 }
  })
  if (!punkte.some(Boolean)) return null
  let summen = null
  if (energie?.data) {
    const k = (s) => { const v = energie.data[ENERGIE[s]]; return typeof v === 'number' ? v / 1000 : null }
    summen = { erzeugt: k('erzeugt'), verbraucht: k('verbraucht'), bezug: k('bezug'), verkauf: k('verkauf') }
    if (Object.values(summen).some((v) => v == null)) summen = null
  }
  return { punkte, summen }
}

/** holt den heutigen Tag; → { datum, zeit, punkte, summen } oder wirft einen Fehler */
function holeTag({ adresse, passwort, Ws = globalThis.WebSocket, jetzt = () => Date.now() }) {
  const datum = heuteBerlin(jetzt())
  const anfrage = (id, method, params) => JSON.stringify({ jsonrpc: '2.0', id, method, params })
  const ID = { an: '10000000-0000-4000-8000-000000000001', verlauf: '10000000-0000-4000-8000-000000000002', energie: '10000000-0000-4000-8000-000000000003' }
  return new Promise((fertig, fehler) => {
    const ws = new Ws(`ws://${adresse}:8085`)
    let verlauf = null, edgeId = '0', vorbei = false
    const ende = (f, w) => {
      if (vorbei) return
      vorbei = true; clearTimeout(uhr); try { ws.close() } catch { /* schon zu */ }
      if (f) fehler(f); else fertig(w)
    }
    const uhr = setTimeout(() => ende(new Error('Zeitgrenze')), ZEITGRENZE_MS)
    const rpc = (id, method, params) => ws.send(anfrage(id, 'edgeRpc', { edgeId, payload: JSON.parse(anfrage(id, method, params)) }))
    const zeitraum = { timezone: 'Europe/Berlin', fromDate: datum, toDate: datum }
    const antwortVon = (j) => j.result?.payload?.result ?? j.result ?? null
    ws.onerror = () => ende(new Error('Verbindung fehlgeschlagen'))
    ws.onclose = () => ende(new Error('Verbindung geschlossen'))
    ws.onopen = () => ws.send(anfrage(ID.an, 'authenticateWithPassword', { password: passwort }))
    ws.onmessage = (m) => {
      let j = null
      try { j = JSON.parse(String(m.data)) } catch { return }
      if (j?.id === ID.an) {
        if (j.error) return ende(new Error('Anmeldung abgelehnt'))
        edgeId = String(j.result?.edges?.[0]?.id ?? '0')
        rpc(ID.verlauf, 'queryHistoricTimeseriesData', { ...zeitraum, channels: Object.values(KANAELE), resolution: { value: 15, unit: 'Minutes' } })
      } else if (j?.id === ID.verlauf) {
        if (j.error || j.result?.payload?.error) return ende(new Error('Verlauf abgelehnt'))
        verlauf = antwortVon(j)
        rpc(ID.energie, 'queryHistoricTimeseriesEnergy', { ...zeitraum, channels: Object.values(ENERGIE) })
      } else if (j?.id === ID.energie) {
        const w = auswerten(verlauf, j.error || j.result?.payload?.error ? null : antwortVon(j)) // Summen sind Zugabe, ohne sie rechnet die Anzeige selbst
        if (!w) return ende(new Error('Verlauf leer'))
        ende(null, { datum, zeit: jetzt(), ...w })
      }
    }
  })
}

module.exports = { holeTag, auswerten, heuteBerlin, KANAELE, ENERGIE }
