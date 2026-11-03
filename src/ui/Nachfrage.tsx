// Nachfrage im App-Stil statt des grauen Browser-Fensters (vereinfacht aus der Werkstatt-App, src/ui/Nachfrage.tsx).
// Aufruf: `if (!(await nachfragen('…?', { ja: 'Einschalten' }))) return`. `NachfrageHost` steht einmal in App.tsx.
// Escape = Abbrechen.
import { useEffect, useRef, useState } from 'react'

type Anfrage = { text: string; ja: string; nein: string; fertig: (ok: boolean) => void }

let zeigen: ((a: Anfrage) => void) | null = null

/** Nachfrage mit zwei Knöpfen; liefert true bei „ja“. Ohne Host fällt sie auf das Browser-Fenster zurück. */
export function nachfragen(text: string, optionen: { ja?: string; nein?: string } = {}): Promise<boolean> {
  if (!zeigen) return Promise.resolve(window.confirm(text))
  const anzeigen = zeigen
  return new Promise((fertig) => anzeigen({ text, ja: optionen.ja ?? 'Ja', nein: optionen.nein ?? 'Abbrechen', fertig }))
}

export function NachfrageHost() {
  const [anfrage, setAnfrage] = useState<Anfrage | null>(null)
  const jaKnopf = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // eine neue Nachfrage ersetzt eine offene – die alte gilt dann als abgebrochen
    zeigen = (neu) => setAnfrage((alt) => { alt?.fertig(false); return neu })
    return () => { zeigen = null }
  }, [])

  useEffect(() => {
    if (!anfrage) return
    jaKnopf.current?.focus()
    const taste = (e: KeyboardEvent) => { if (e.key === 'Escape') { anfrage.fertig(false); setAnfrage(null) } }
    window.addEventListener('keydown', taste)
    return () => window.removeEventListener('keydown', taste)
  }, [anfrage])

  if (!anfrage) return null
  const schliessen = (ok: boolean) => { anfrage.fertig(ok); setAnfrage(null) }
  const [titel, ...rest] = anfrage.text.split('\n\n')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) schliessen(false) }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="nachfrage-titel" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <p id="nachfrage-titel" className="font-semibold">{titel}</p>
        {rest.map((absatz, i) => <p key={i} className="mt-2 text-sm text-neutral-600">{absatz}</p>)}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-lg border border-neutral-300 px-3 py-1.5" onClick={() => schliessen(false)}>{anfrage.nein}</button>
          <button ref={jaKnopf} type="button" className="rounded-lg bg-akzent px-3 py-1.5 text-white" onClick={() => schliessen(true)}>{anfrage.ja}</button>
        </div>
      </div>
    </div>
  )
}
