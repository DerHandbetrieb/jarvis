// Wetterstation Ecowitt eintragen und testen (05.11.2026): Station steht im Netz des Nachbarn, darum über die Ecowitt-Cloud.
// Schlüssel bleiben nur bis zum Abschicken im Feld; L.O.K.I. speichert sie verschlüsselt und zeigt sie nie wieder an.
import { useEffect, useState } from 'react'
import { stationBruecke, type StationStatus } from './desktop'

const z = (v: number | null | undefined, e: string) => (v == null ? '–' : `${String(Math.round(v * 10) / 10).replace('.', ',')} ${e}`)

export default function StationVerbindung() {
  const b = stationBruecke()
  const [s, setS] = useState<StationStatus | null>(null)
  const [f, setF] = useState({ appKey: '', apiKey: '', mac: '' })
  const [laeuft, setLaeuft] = useState(false)
  useEffect(() => { void b?.status().then(setS) }, [b])
  useEffect(() => {
    if (!b || !s?.eingerichtet) return
    const t = setInterval(() => { if (!document.hidden) void b.status().then((n) => n && setS(n)) }, 30_000)
    return () => clearInterval(t)
  }, [b, s?.eingerichtet])
  if (!b) return null
  const tun = async (fn: () => Promise<StationStatus | null>) => { setLaeuft(true); try { const n = await fn(); if (n) setS(n) } finally { setLaeuft(false) } }
  const feld = 'mt-1 w-56 rounded-lg border border-neutral-300 px-2 py-1.5'
  const w = s?.werte
  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
      <p className="font-medium text-neutral-700">Wetterstation Ecowitt (über ecowitt.net – Anzeige im Dauer-HUD)</p>
      {s?.eingerichtet ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-emerald-700">Verbunden: Station {s.station}</span>
          {w && <span className="text-neutral-600">{z(w.grad, '°C')} · {z(w.feuchte, '%')} · Wind {z(w.wind, 'km/h')} · {z(w.druck, 'hPa')} · Regen heute {z(w.regenHeute, 'mm')}</span>}
          {s.veraltet && <span className="text-amber-700">Keine frischen Werte: L.O.K.I. nennt solange kein Wetter.</span>}
          <button type="button" className="rounded-lg border border-neutral-300 px-3 py-1.5" disabled={laeuft} onClick={() => void tun(b.entfernen)}>Trennen</button>
        </div>
      ) : (
        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => {
          e.preventDefault()
          const d = f
          setF({ appKey: '', apiKey: '', mac: f.mac })
          void tun(() => b.einrichten(d))
        }}>
          <label className="block">Application Key<br /><input className={feld} type="password" autoComplete="off" value={f.appKey} onChange={(x) => setF({ ...f, appKey: x.target.value })} /></label>
          <label className="block">API Key<br /><input className={feld} type="password" autoComplete="off" value={f.apiKey} onChange={(x) => setF({ ...f, apiKey: x.target.value })} /></label>
          <label className="block">MAC-Adresse der Station<br /><input className={feld} placeholder="AA:BB:CC:DD:EE:FF" value={f.mac} onChange={(x) => setF({ ...f, mac: x.target.value })} /></label>
          <button type="submit" className="rounded-lg border border-neutral-300 px-3 py-1.5" disabled={laeuft || !f.appKey || !f.apiKey || !f.mac}>{laeuft ? 'Teste …' : 'Eintragen und testen'}</button>
        </form>
      )}
      {s?.fehler && <p className="text-red-700">{s.fehler}</p>}
      <p className="text-xs text-neutral-500">Die Schlüssel legst du auf ecowitt.net unter Profil an („Create Application Key“, „Create API Key“). L.O.K.I. liest nur.</p>
    </div>
  )
}
