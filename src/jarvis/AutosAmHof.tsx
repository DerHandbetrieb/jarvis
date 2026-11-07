// Autos benennen (07.11.2026, Wunsch Auftraggeber: „wenn ein neues Auto da war, gleich benennen und abhaken“).
// Zeigt die Fotos jeder Auto-Meldung der Kamera-Wache; der Auftraggeber tippt einen Namen ein oder markiert „kein Auto“.
// Die Namen sind die Lösungen, an denen die spätere Erkennung (Kennzeichen, Farbe, Form) gemessen und angelernt wird.
import { useEffect, useRef, useState } from 'react'
import { Abschnitt } from '../ui/Abschnitt'
import { autosBruecke, type AutoBesuch } from './desktop'

function Bilder({ id, nummern }: { id: string; nummern: number[] }) {
  const a = autosBruecke()
  const [urls, setUrls] = useState<(string | null)[]>([])
  const [gross, setGross] = useState<string | null>(null)
  useEffect(() => {
    if (!gross) return
    const taste = (e: KeyboardEvent) => { if (e.key === 'Escape') setGross(null) }
    window.addEventListener('keydown', taste)
    return () => window.removeEventListener('keydown', taste)
  }, [gross])
  useEffect(() => {
    let aus = false
    void Promise.all(nummern.map((n) => a?.bild(id, n) ?? Promise.resolve(null))).then((u) => { if (!aus) setUrls(u) })
    return () => { aus = true }
  }, [a, id, nummern.join(',')])
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {urls.map((u, i) => u && (
          <button key={i} type="button" title="Groß ansehen" onClick={() => setGross(u)}>
            <img src={u} alt={`Foto ${i + 1}`} className="h-28 rounded-lg border border-neutral-200 object-cover" />
          </button>
        ))}
        {!urls.length && <span className="text-sm text-neutral-400">Lade Fotos …</span>}
        {urls.length > 0 && !urls.some(Boolean) && <span className="text-sm text-neutral-400">Fotos nicht mehr vorhanden.</span>}
      </div>
      {gross && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setGross(null)}>
          <img src={gross} alt="Foto groß" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </>
  )
}

function Besuch({ b, bekannte, vorher, fertig }: { b: AutoBesuch; bekannte: string[]; vorher?: string; fertig: () => void }) {
  const a = autosBruecke()
  const [name, setName] = useState(b.name ?? vorher ?? '')
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState(false)
  const tun = async (n: string | null, keinAuto = false) => {
    if (!a) return
    setLaeuft(true)
    setFehler(false)
    try { if (await a.benennen(b.id, n, keinAuto)) fertig(); else setFehler(true) } catch { setFehler(true) } finally { setLaeuft(false) }
  }
  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
      <p className="text-sm font-medium text-neutral-600">{b.zeit}</p>
      <Bilder id={b.id} nummern={b.bilder} />
      <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) void tun(name) }}>
        <input
          className="w-56 rounded-lg border border-neutral-300 px-2 py-1.5"
          placeholder="Wer war das? z. B. Chrissy, Post"
          list="auto-namen"
          value={name}
          onChange={(x) => setName(x.target.value)}
        />
        <button type="submit" className="rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-emerald-800" disabled={laeuft || !name.trim()}>Speichern</button>
        <button type="button" className="rounded-lg border border-neutral-300 px-3 py-1.5" disabled={laeuft} onClick={() => void tun(null, true)}>Kein Auto / Fehlalarm</button>
      </form>
      {fehler && <p className="text-sm text-red-700">Speichern hat nicht geklappt – bitte noch einmal versuchen.</p>}
      {bekannte.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {bekannte.slice(0, 8).map((n) => (
            <button key={n} type="button" className="rounded-full border border-neutral-300 px-2.5 py-0.5 text-sm hover:bg-neutral-50" disabled={laeuft} onClick={() => void tun(n)}>{n}</button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AutosAmHof() {
  const a = autosBruecke()
  const ref = useRef<HTMLDivElement>(null)
  const [d, setD] = useState<{ besuche: AutoBesuch[]; bekannte: string[]; offen: number } | null>(null)
  const [alle, setAlle] = useState(false)
  const [scrollen, setScrollen] = useState(false)
  const [vorher, setVorher] = useState<Record<string, string>>({})
  const laden = () => { void a?.liste().then((x) => x && setD(x)) }
  useEffect(() => {
    if (!a) return
    laden()
    const weg1 = a.beiAenderung(laden)
    const weg2 = a.beimZeigen(() => { laden(); setScrollen(true) })
    const sichtbar = () => { if (!document.hidden) laden() }
    document.addEventListener('visibilitychange', sichtbar)
    return () => { weg1(); weg2(); document.removeEventListener('visibilitychange', sichtbar) }
  }, [a])
  // nach dem Klick auf die Windows-Mitteilung hinscrollen, sobald die Liste da ist
  useEffect(() => {
    if (!scrollen || !ref.current) return
    ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setScrollen(false)
  }, [scrollen, d])
  if (!a || !d || !d.besuche.length) return null
  const offen = d.besuche.filter((b) => !b.erledigt)
  const erledigt = d.besuche.filter((b) => b.erledigt)
  return (
    <div ref={ref} className="mb-6">
      <Abschnitt titel={offen.length ? `Autos am Hof · ${offen.length} zu benennen` : 'Autos am Hof'}>
        <datalist id="auto-namen">{d.bekannte.map((n) => <option key={n} value={n} />)}</datalist>
        <div className="space-y-3">
          {offen.length === 0 && <p className="text-sm text-emerald-700">Alles benannt.</p>}
          {offen.map((b) => <Besuch key={b.id} b={b} bekannte={d.bekannte} vorher={vorher[b.id]} fertig={laden} />)}
          {erledigt.length > 0 && (
            <button type="button" className="text-sm text-neutral-500 underline" onClick={() => setAlle(!alle)}>
              {alle ? 'Benannte ausblenden' : `Benannte zeigen (${erledigt.length})`}
            </button>
          )}
          {alle && erledigt.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-neutral-500">{b.zeit}</span>
              <span className="font-medium">{b.keinAuto ? 'kein Auto' : b.name}</span>
              <button type="button" className="text-neutral-500 underline" onClick={() => { if (b.name) setVorher((v) => ({ ...v, [b.id]: b.name ?? '' })); void a.benennen(b.id, null).then(laden) }}>ändern</button>
            </div>
          ))}
          <p className="text-xs text-neutral-400">Fotos und Namen bleiben nur auf diesem PC. Fotografiert wird nur in der Testwoche; nach der Auswertung werden Fotos und diese Liste gelöscht. Mit den Namen lernt L.O.K.I. später, wer vorfährt.</p>
        </div>
      </Abschnitt>
    </div>
  )
}
