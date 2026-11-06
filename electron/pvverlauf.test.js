// Tests für den PV-Tagesverlauf (electron/pvverlauf.cjs), 06.11.2026
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const { auswerten, holeTag, KANAELE, ENERGIE } = createRequire(import.meta.url)('./pvverlauf.cjs')

const verlauf = { timestamps: ['a', 'b', 'c'], data: { [KANAELE.pv]: [0, 1200, null], [KANAELE.haus]: [300, 500, null], [KANAELE.netz]: [300, -700, null] } }
const energie = { data: { [ENERGIE.erzeugt]: 5000, [ENERGIE.verbraucht]: 3000, [ENERGIE.bezug]: 1000, [ENERGIE.verkauf]: 2500 } }

/** nachgestellte Anlage: antwortet wie FEMS, merkt sich alles Gesendete */
function falscheAnlage({ anmeldung = true } = {}) {
  const gesendet = []
  class Ws {
    constructor(url) { this.url = url; Ws.url = url; setTimeout(() => this.onopen(), 0) }
    close() {}
    send(t) {
      const j = JSON.parse(t); gesendet.push(j)
      const raus = (d) => setTimeout(() => this.onmessage({ data: JSON.stringify(d) }), 0)
      if (j.method === 'authenticateWithPassword') raus(anmeldung ? { id: j.id, result: { edges: [] } } : { id: j.id, error: { code: 1 } })
      else if (j.params.payload.method === 'queryHistoricTimeseriesData') raus({ id: j.id, result: { payload: { result: verlauf } } })
      else raus({ id: j.id, result: { payload: { result: energie } } })
    }
  }
  return { Ws, gesendet }
}

describe('PV-Tagesverlauf', () => {
  it('wandelt die Antwort um, künftige Viertelstunden bleiben leer', () => {
    const w = auswerten(verlauf, energie)
    expect(w.punkte).toEqual([{ pv: 0, haus: 300, netz: 300 }, { pv: 1200, haus: 500, netz: -700 }, null])
    expect(w.summen).toEqual({ erzeugt: 5, verbraucht: 3, bezug: 1, verkauf: 2.5 })
  })
  it('kommt ohne Summen aus, leere Antworten ergeben nichts', () => {
    expect(auswerten(verlauf, null).summen).toBeNull()
    expect(auswerten(null, null)).toBeNull()
    expect(auswerten({ timestamps: ['a'], data: {} }, null)).toBeNull()
    expect(auswerten({ timestamps: ['a', 'b'], data: { [KANAELE.pv]: [100, 5], [KANAELE.haus]: [null, 7] } }, null).punkte[0]).toBeNull()
  })
  it('meldet sich an und stellt nur lesende Abfragen', async () => {
    const a = falscheAnlage()
    const t = await holeTag({ adresse: '192.168.0.2', passwort: 'p', Ws: a.Ws, jetzt: () => Date.UTC(2026, 10, 6, 12) })
    expect(a.Ws.url).toBe('ws://192.168.0.2:8085')
    expect(t.datum).toBe('2026-11-06')
    expect(t.punkte.length).toBe(3)
    expect(a.gesendet.map((j) => j.params.payload?.method ?? j.method)).toEqual(['authenticateWithPassword', 'queryHistoricTimeseriesData', 'queryHistoricTimeseriesEnergy'])
  })
  it('abgelehnte Anmeldung ergibt einen Fehler', async () => {
    await expect(holeTag({ adresse: '192.168.0.2', passwort: 'p', Ws: falscheAnlage({ anmeldung: false }).Ws })).rejects.toThrow('Anmeldung')
  })
})
