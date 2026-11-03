// Einstellungen → Werkstatt-Verbindung (03.11.2026, Etappe L1): Loki meldet sich mit seinem eigenen Konto und Zwei-Faktor
// an der Werkstatt-Datenbank an. Einmalig: E-Mail + Passwort, dann QR-Code mit der Authenticator-App scannen und Code
// eingeben. Das Passwort bleibt nur in diesem Formular, bis es abgeschickt ist – gespeichert wird nur die Sitzung
// (verschlüsselt, im Hauptprozess).
import { useEffect, useRef, useState } from 'react'
import { werkstattBruecke, type WerkstattStatus } from './desktop'

const feld = 'mt-1 rounded-lg border border-neutral-300 px-2 py-1.5'
const knopf = 'rounded-lg border border-neutral-300 px-3 py-1.5 disabled:opacity-50'

export default function WerkstattVerbindung() {
  // Brücke einmal festhalten (nicht bei jedem Zeichnen neu holen – sonst liefe der Effekt unten immer wieder)
  const [b] = useState(() => werkstattBruecke())
  const [s, setS] = useState<WerkstattStatus | null>(null)
  const ereignisDa = useRef(false)
  const [email, setEmail] = useState('loki@der-handbetrieb.de')
  const [passwort, setPasswort] = useState('')
  const [code, setCode] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  useEffect(() => {
    if (!b) return
    const weg = b.beiAenderung((n) => { ereignisDa.current = true; setS(n) })
    // erster Stand – aber kein neueres Ereignis überschreiben
    void b.status().then((n) => { if (!ereignisDa.current) setS(n) })
    return weg
  }, [b])
  if (!b || !s) return null
  const tun = async (fn: () => Promise<WerkstattStatus | null>) => {
    setLaeuft(true)
    try { const n = await fn(); if (n) setS(n) } catch { setS((v) => (v ? { ...v, fehler: 'Unerwarteter Fehler – bitte noch einmal versuchen.' } : v)) } finally { setLaeuft(false) }
  }
  const stand = s.stand ? new Date(s.stand).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : null
  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
      <p className="font-medium text-neutral-700">Werkstatt-Verbindung (echte Zahlen für Morgen-Lage und Start-Sequenz)</p>
      {!s.verfuegbar && <p className="text-neutral-500">In diesem Programm fehlen die Zugangsdaten der Werkstatt (.env.werkstatt).</p>}
      {s.verfuegbar && s.zustand === 'verbunden' && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-emerald-700">Verbunden{stand ? ` · zuletzt geholt ${stand} Uhr` : ''} – Loki liest nur, ändert nichts.</span>
          <button type="button" className={knopf} disabled={laeuft} onClick={() => void tun(async () => { await b.lage(true); return b.status() })}>Jetzt aktualisieren</button>
          <button type="button" className={knopf} disabled={laeuft} onClick={() => void tun(() => b.trennen())}>Trennen</button>
        </div>
      )}
      {s.verfuegbar && (s.zustand === 'aus' || s.zustand === 'fehler') && (
        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); const p = passwort; setPasswort(''); void tun(() => b.verbinden(email, p)) }}>
          <label className="block">E-Mail des Loki-Kontos<br /><input className={`${feld} w-64`} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></label>
          <label className="block">Passwort<br /><input className={`${feld} w-56`} type="password" value={passwort} onChange={(e) => setPasswort(e.target.value)} autoComplete="current-password" /></label>
          <button type="submit" className={knopf} disabled={laeuft || !email || !passwort}>{laeuft ? 'Verbinde …' : 'Mit Werkstatt verbinden'}</button>
        </form>
      )}
      {s.verfuegbar && s.zustand === 'einrichten' && (
        <div className="space-y-2">
          <p className="text-neutral-600">Einmalig: Diesen QR-Code mit deiner Authenticator-App scannen (neuer Eintrag „Loki“), dann den 6-stelligen Code eingeben.</p>
          {s.qr && <img src={s.qr} alt="QR-Code für die Authenticator-App" className="h-48 w-48 rounded bg-white p-2" />}
          {s.schluessel && (
            <p className="text-neutral-600">Klappt das Scannen nicht: in der App „Schlüssel eingeben“ wählen, Name „Loki“, Schlüssel{' '}
              <span className="select-all rounded bg-neutral-100 px-1.5 py-0.5 font-mono tracking-wider">{s.schluessel.match(/.{1,4}/g)?.join(' ')}</span> (zeitbasiert).</p>
          )}
        </div>
      )}
      {s.verfuegbar && (s.zustand === 'einrichten' || s.zustand === 'code') && (
        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); const c = code; setCode(''); void tun(() => b.code(c)) }}>
          <label className="block">Code aus der Authenticator-App (Eintrag „Loki“)<br /><input className={`${feld} w-32 font-mono tracking-widest`} inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoComplete="one-time-code" /></label>
          <button type="submit" className={knopf} disabled={laeuft || code.length !== 6}>Bestätigen</button>
          <button type="button" className={knopf} disabled={laeuft} onClick={() => void tun(() => b.trennen())}>Abbrechen</button>
        </form>
      )}
      {s.fehler && <p className="text-red-700">{s.fehler}</p>}
    </div>
  )
}
