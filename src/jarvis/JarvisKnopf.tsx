// Jarvis in der Kopfzeile (03.11.2026, erste schlichte Fassung – Gestaltung folgt mit vier Entwürfen zur Wahl).
// Nur im Windows-Programm sichtbar. Ring zeigt den Zustand: aus (grau), hört zu (ruhig), spricht/denkt (pulsiert).
// Klick öffnet ein kleines Feld mit Ein/Aus, Mikrofon, „Lage vorlesen“, Stopp und dem zuletzt Gehörten.
// Im eigenen Jarvis-Projekt (03.11.2026) ohne Seiten-Navigation – „öffne …“ für Werkstatt-Seiten folgt später.
import { useEffect, useRef, useState } from 'react'
import { bruecke, setzeJarvis, useJarvisEinstellungen } from './desktop'
import { ausschalten, einschalten, mikrofonUmschalten, morgenLageVortragen, rechnerStart, stopp, stummUmschalten, useJarvis } from './dienst'
import { nachfragen } from '../ui/Nachfrage'

const TEXT: Record<string, string> = { aus: 'aus', laedt: 'wird vorbereitet …', bereit: 'hört zu', spricht: 'spricht', denkt: 'denkt nach', fehler: 'Störung' }

export default function JarvisKnopf({ klasse }: { klasse: string }) {
  const e = useJarvisEinstellungen()
  const j = useJarvis()
  const [offen, setOffen] = useState(false)
  const feld = useRef<HTMLDivElement>(null)
  const da = !!bruecke()

  // von Windows beim Anmelden gestartet → ohne Klick einschalten, begrüßen, Morgen-Lage; sonst: eingeschaltet → gleich
  // zuhören (für „Guten Morgen, Loki“)
  useEffect(() => {
    if (!da) return
    if (window.jarvisDesktop?.beimStart) void rechnerStart()
    else if (e.an) void einschalten()
  }, [da, e.an])
  // Rechtsklick auf das Symbol unten rechts → „Mikrofon aus/an“
  useEffect(() => (da ? bruecke()!.beiTrayMikrofon(() => void mikrofonUmschalten()) : undefined), [da])
  // roter Knopf im Dauer-HUD
  useEffect(() => (da ? bruecke()!.beiStummKnopf(() => void stummUmschalten()) : undefined), [da])
  useEffect(() => {
    if (!offen) return
    const zu = (ev: MouseEvent) => { if (feld.current && !feld.current.contains(ev.target as Node)) setOffen(false) }
    document.addEventListener('mousedown', zu)
    return () => document.removeEventListener('mousedown', zu)
  }, [offen])
  if (!da) return null

  async function anschalten() {
    const st = await bruecke()!.status()
    const fehlt = st && Object.values(st.modelle).some((v) => !v)
    if (fehlt && !await nachfragen(`Jarvis einschalten?\n\nBeim ersten Mal lädt das Windows-Programm Stimme und Spracherkennung (zusammen etwa ${st!.groesseMb} MB, kostenlos, aus den offiziellen sherpa-onnx-Veröffentlichungen). Danach läuft alles ohne Internet auf diesem PC. Das Mikrofon hört dann zu, sobald Jarvis offen ist – der Ton verlässt den PC nicht.`, { ja: 'Einschalten', nein: 'Abbrechen' })) return
    setzeJarvis({ an: true })
    void einschalten()
  }
  async function abschalten() { setzeJarvis({ an: false }); await ausschalten() }

  const aktiv = j.zustand === 'spricht' || j.zustand === 'denkt' || j.zustand === 'laedt'
  const farbe = j.zustand === 'fehler' ? '#c0392b' : j.zustand === 'aus' ? '#8a8f94' : j.mikrofon ? '#179994' : '#c8a24a'
  return (
    <div className="relative" ref={feld}>
      <button type="button" className={klasse} title={`L.O.K.I.: ${TEXT[j.zustand]}`} aria-label={`L.O.K.I.: ${TEXT[j.zustand]}`} onClick={() => setOffen((o) => !o)}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke={farbe} strokeWidth="2" style={aktiv ? { animation: 'jarvis-puls 1.2s ease-in-out infinite' } : undefined} />
          <circle cx="12" cy="12" r="3.2" fill={farbe} />
        </svg>
      </button>
      <style>{'@keyframes jarvis-puls{0%,100%{opacity:1}50%{opacity:.35}}'}</style>
      {offen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-800 shadow-lg">
          <p className="font-medium">L.O.K.I. · {TEXT[j.zustand]}{j.zustand !== 'aus' && !j.mikrofon ? ' (Mikrofon aus)' : ''}</p>
          {j.fortschritt && <p className="mt-1 text-neutral-500">Lädt {j.fortschritt.name === 'whisper' ? 'Spracherkennung' : j.fortschritt.name === 'stimme' ? 'Stimme' : 'Pausen-Erkennung'}: {Math.round(j.fortschritt.anteil * 100)} %</p>}
          {j.fehler && <p className="mt-1 text-red-600">{j.fehler}</p>}
          {j.gehoert && <p className="mt-2 text-neutral-500">Gehört: „{j.gehoert}“</p>}
          {j.gesagt && j.zustand === 'spricht' && <p className="mt-1 text-neutral-500">Sagt: {j.gesagt.slice(0, 160)}{j.gesagt.length > 160 ? ' …' : ''}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {!e.an || j.zustand === 'aus' ? (
              <button type="button" className="rounded-lg bg-akzent px-3 py-1.5 text-white" onClick={() => void anschalten()}>Einschalten</button>
            ) : (
              <>
                <button type="button" className="rounded-lg border border-neutral-300 px-3 py-1.5" disabled={j.zustand !== 'bereit'} onClick={() => void morgenLageVortragen()}>Lage vorlesen</button>
                <button type="button" className="rounded-lg border border-neutral-300 px-3 py-1.5" onClick={() => void mikrofonUmschalten()}>{j.mikrofon ? 'Mikrofon aus' : 'Mikrofon an'}</button>
                {j.zustand === 'spricht' && <button type="button" className="rounded-lg border border-neutral-300 px-3 py-1.5" onClick={stopp}>Stopp</button>}
                <button type="button" className="rounded-lg border border-neutral-300 px-3 py-1.5" onClick={() => void abschalten()}>Ausschalten</button>
              </>
            )}
          </div>
          <p className="mt-3 text-xs text-neutral-500">Sagen Sie „Guten Morgen, L.O.K.I.“ für die Lage oder „L.O.K.I., …“ bzw. „…, L.O.K.I.?“ für Befehle und Fragen (z. B. „Lage“). „Jarvis“ versteht er weiterhin. Während L.O.K.I. spricht, hört er nicht zu – zum Unterbrechen den Knopf „Stopp“ nehmen.</p>
        </div>
      )}
    </div>
  )
}
