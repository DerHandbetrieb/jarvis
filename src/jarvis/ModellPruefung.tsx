// Einstellungen → Sprachmodell prüfen/aktualisieren (04.11.2026, Wunsch Auftraggeber: regelmäßig auf neuere Fassungen prüfen).
// Automatisch prüft Loki höchstens alle 30 Tage vor der Morgen-Lage; hier geht es auch sofort.
import { useState } from 'react'
import { bruecke, setzeJarvis } from './desktop'

export default function ModellPruefung({ modell }: { modell: string }) {
  const [text, setText] = useState('')
  const [neuer, setNeuer] = useState(false)
  const [laeuft, setLaeuft] = useState(false)
  const b = bruecke()
  if (!b?.modellPruefen || !b.modellHolen) return null
  const heute = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }
  async function pruefen() {
    setLaeuft(true); setText('Prüfe …')
    const r = await b!.modellPruefen!(modell).catch(() => null)
    setLaeuft(false)
    setText(r?.text ?? 'Prüfen nicht möglich.'); setNeuer(r?.stand === 'neuer')
    if (r && r.stand !== 'unbekannt') setzeJarvis({ zuletztModellPruefung: heute() })
  }
  async function holen() {
    setLaeuft(true); setText('Lade die neue Fassung herunter (einige Gigabyte, kann mehrere Minuten dauern) …')
    const r = await b!.modellHolen!(modell).catch(() => null)
    setLaeuft(false)
    setText(r?.ok ? 'Aktualisiert. Ab der nächsten Frage antwortet die neue Fassung.' : `Nicht geklappt: ${r?.text ?? 'unbekannter Fehler'}`)
    if (r?.ok) setNeuer(false)
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button type="button" disabled={laeuft} onClick={pruefen} className="rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50 disabled:opacity-50">Auf neuere Fassung prüfen</button>
      {neuer && <button type="button" disabled={laeuft} onClick={holen} className="rounded-lg bg-neutral-900 px-3 py-1.5 text-white disabled:opacity-50">Sprachmodell aktualisieren</button>}
      {text && <span className="text-neutral-600">{text}</span>}
    </div>
  )
}
