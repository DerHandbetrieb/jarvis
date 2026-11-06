// PV-Anlage FENECON eintragen und testen (05.11.2026): nur lesen (offizielle Schnittstelle „REST/JSON lesend“), die Werte
// erscheinen im Dauer-HUD. Das Passwort bleibt nur bis zum Abschicken im Feld; L.O.K.I. speichert es verschlüsselt.
import { useEffect, useState } from 'react'
import { pvBruecke, type PvStatus } from './desktop'

const watt = (w: number | null | undefined) => (w == null ? '–' : Math.abs(w) >= 1000 ? `${(w / 1000).toFixed(1).replace('.', ',')} kW` : `${Math.round(w)} W`)

export default function PvVerbindung() {
  const p = pvBruecke()
  const [s, setS] = useState<PvStatus | null>(null)
  const [f, setF] = useState({ adresse: '', passwort: '' })
  const [laeuft, setLaeuft] = useState(false)
  useEffect(() => { void p?.status().then(setS) }, [p])
  useEffect(() => {
    if (!p || !s?.eingerichtet) return
    const t = setInterval(() => { if (!document.hidden) void p.status().then((n) => n && setS(n)) }, 5000)
    return () => clearInterval(t)
  }, [p, s?.eingerichtet])
  if (!p) return null
  const tun = async (fn: () => Promise<PvStatus | null>) => { setLaeuft(true); try { const n = await fn(); if (n) setS(n) } finally { setLaeuft(false) } }
  const feld = 'mt-1 w-44 rounded-lg border border-neutral-300 px-2 py-1.5'
  const w = s?.werte
  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
      <p className="font-medium text-neutral-700">PV-Anlage FENECON (nur lesen – Anzeige im Dauer-HUD)</p>
      {s?.eingerichtet ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-emerald-700">Verbunden: {s.adresse}</span>
          {w && <span className="text-neutral-600">PV {watt(w.pvW)} · Haus {watt(w.hausW)} · Akku {w.akku ?? '–'} % · Netz {watt(w.netzW)}</span>}
          <button type="button" className="rounded-lg border border-neutral-300 px-3 py-1.5" disabled={laeuft} onClick={() => void tun(p.entfernen)}>Trennen</button>
        </div>
      ) : (
        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => {
          e.preventDefault()
          const d = f
          setF({ ...f, passwort: '' })
          void tun(() => p.einrichten(d))
        }}>
          <label className="block">Adresse des FEMS<br /><input className={feld} placeholder="192.168.…" value={f.adresse} onChange={(x) => setF({ ...f, adresse: x.target.value })} /></label>
          <label className="block">Passwort (Standard „user“)<br /><input className={feld} type="password" autoComplete="new-password" value={f.passwort} onChange={(x) => setF({ ...f, passwort: x.target.value })} /></label>
          <button type="submit" className="rounded-lg border border-neutral-300 px-3 py-1.5" disabled={laeuft || !f.adresse || !f.passwort}>{laeuft ? 'Teste …' : 'Eintragen und testen'}</button>
        </form>
      )}
      {s?.fehler && <p className="text-red-700">{s.fehler}</p>}
      <p className="text-xs text-neutral-500">Hinweis: Die FENECON-Schnittstelle arbeitet im Heimnetz unverschlüsselt (so vorgegeben) – L.O.K.I. liest nur.</p>
    </div>
  )
}
