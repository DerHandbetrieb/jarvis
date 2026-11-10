// Tests für den Abruf der Deutschlandfunk-Nachrichten (electron/dlfnachrichten.cjs), 10.11.2026
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const { erstelleDlfNachrichten, lesen } = createRequire(import.meta.url)('./dlfnachrichten.cjs')

const ITEM = (titel, text, datum) => `<item>
  <title>${titel}</title>
  <description>
    <![CDATA[<img src="x.jpg" alt="Bild &amp; Text" title="t"/>${text}<br clear="all"/><br/><p><br/></p>]]>
  </description>
  <pubDate>${datum}</pubDate>
</item>`
const FEED = `<rss><channel><title>Deutschlandfunk</title>${ITEM('Mögliche Spionageaffäre - Trump: FBI ermittelt', 'Die US-Bundespolizei FBI hat Ermittlungen aufgenommen.', 'Tue, 10 Nov 2026 05:39:33 +0100')}
${ITEM('Ukraine-Hilfe - Merz fordert &quot;Beteiligung&quot; &#252;berall', 'Bundeskanzler Merz hat die EU-Staaten aufgefordert.', 'Tue, 10 Nov 2026 06:01:12 +0100')}
<item><title></title><description>leer</description></item></channel></rss>`

describe('Deutschlandfunk-Nachrichten', () => {
  it('liest Überschrift und Satz wortgetreu, ohne Bild und HTML, mit Zeichen-Codes', () => {
    const { meldungen, stand } = lesen(FEED)
    expect(meldungen).toEqual([
      { titel: 'Mögliche Spionageaffäre - Trump: FBI ermittelt', text: 'Die US-Bundespolizei FBI hat Ermittlungen aufgenommen.' },
      { titel: 'Ukraine-Hilfe - Merz fordert "Beteiligung" überall', text: 'Bundeskanzler Merz hat die EU-Staaten aufgefordert.' },
    ])
    expect(stand.toISOString()).toBe('2026-11-10T05:01:12.000Z')
  })
  it('höchstens 20 Meldungen', () => {
    const viele = `<rss>${Array.from({ length: 25 }, (_, i) => ITEM(`T${i}`, 'x', 'Tue, 10 Nov 2026 06:00:00 +0100')).join('')}</rss>`
    expect(lesen(viele).meldungen).toHaveLength(20)
  })
  it('hält das Ergebnis 5 Minuten und meldet Fehler ehrlich', async () => {
    let aufrufe = 0, zeit = 0
    const abruf = async () => { aufrufe++; return { ok: true, status: 200, text: async () => FEED } }
    const n = erstelleDlfNachrichten({ abruf, jetzt: () => zeit })
    expect((await n.holen()).meldungen).toHaveLength(2)
    zeit = 4 * 60_000; await n.holen(); expect(aufrufe).toBe(1)
    zeit = 6 * 60_000; await n.holen(); expect(aufrufe).toBe(2)
    const kaputt = erstelleDlfNachrichten({ abruf: async () => ({ ok: false, status: 404, text: async () => '' }) })
    expect(await kaputt.holen()).toEqual({ fehler: 'Antwort 404' })
    const leer = erstelleDlfNachrichten({ abruf: async () => ({ ok: true, status: 200, text: async () => '<rss></rss>' }) })
    expect((await leer.holen()).fehler).toBe('keine Meldungen im Feed')
  })
})
