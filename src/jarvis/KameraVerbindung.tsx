// Kamera eintragen und testen (Etappe 5, 03.11.2026): Reolink-Standbild, nur live, nichts wird aufgezeichnet.
// Das Passwort bleibt nur bis zum Abschicken im Feld und wird danach geleert; Loki speichert es verschlüsselt im Hauptprozess.
import { useEffect, useState } from 'react'
import { kameraBruecke, type KameraStatus } from './desktop'

export default function KameraVerbindung() {
  const k = kameraBruecke()
  const [s, setS] = useState<KameraStatus | null>(null)
  const [f, setF] = useState({ name: 'Carport', adresse: '', benutzer: '', passwort: '' })
  const [laeuft, setLaeuft] = useState(false)
  useEffect(() => { void k?.status().then(setS) }, [k])
  // Vorschau alle 3 Sekunden auffrischen, solange das Fenster zu sehen ist; nach 2 Minuten von selbst zu
  useEffect(() => {
    if (!k || !s?.eingerichtet || !s.vorschau) return
    const bis = Date.now() + 120_000
    const t = setInterval(() => {
      if (Date.now() > bis) { setS((a) => (a ? { ...a, vorschau: null } : a)); return }
      if (!document.hidden) void k.bild().then((n) => n && setS(n))
    }, 3000)
    return () => clearInterval(t)
  }, [k, s?.eingerichtet, !!s?.vorschau])
  if (!k) return null
  const tun = async (fn: () => Promise<KameraStatus | null>) => { setLaeuft(true); try { const n = await fn(); if (n) setS(n) } finally { setLaeuft(false) } }
  const feld = 'mt-1 w-44 rounded-lg border border-neutral-300 px-2 py-1.5'
  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
      <p className="font-medium text-neutral-700">Kamera (Standbild fürs Dauer-HUD, nur live – Loki zeichnet nichts auf)</p>
      {s?.eingerichtet ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-emerald-700">Eingetragen: {s.name} ({s.adresse})</span>
          <button type="button" className="rounded-lg border border-neutral-300 px-3 py-1.5" disabled={laeuft} onClick={() => void tun(k.bild)}>{laeuft ? 'Hole Bild …' : 'Bild zeigen'}</button>
          <button type="button" className="rounded-lg border border-neutral-300 px-3 py-1.5" disabled={laeuft} onClick={() => void tun(k.entfernen)}>Kamera entfernen</button>
        </div>
      ) : (
        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => {
          e.preventDefault()
          const d = f
          setF({ ...f, passwort: '' })
          void tun(() => k.einrichten(d))
        }}>
          <label className="block">Name<br /><input className={feld} value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} /></label>
          <label className="block">Adresse im Heimnetz<br /><input className={feld} placeholder="192.168.…" value={f.adresse} onChange={(x) => setF({ ...f, adresse: x.target.value })} /></label>
          <label className="block">Benutzer (nur Ansehen)<br /><input className={feld} autoComplete="off" value={f.benutzer} onChange={(x) => setF({ ...f, benutzer: x.target.value })} /></label>
          <label className="block">Passwort<br /><input className={feld} type="password" autoComplete="new-password" value={f.passwort} onChange={(x) => setF({ ...f, passwort: x.target.value })} /></label>
          <button type="submit" className="rounded-lg border border-neutral-300 px-3 py-1.5" disabled={laeuft || !f.adresse || !f.benutzer || !f.passwort}>{laeuft ? 'Teste …' : 'Eintragen und testen'}</button>
        </form>
      )}
      {s?.fehler && <p className="text-red-700">{s.fehler}</p>}
      {s?.vorschau && <img src={s.vorschau} alt="Kamerabild" className="max-h-64 rounded-lg border border-neutral-200" />}
    </div>
  )
}
