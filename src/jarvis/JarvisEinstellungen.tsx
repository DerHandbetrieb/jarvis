// Einstellungen → Jarvis (03.11.2026): je Gerät gemerkt (Jarvis läuft nur im Windows-Programm dieses PCs).
import { Abschnitt } from '../ui/Abschnitt'
import { useEffect, useState } from 'react'
import { BAUSTEINE, type BausteinSchluessel } from './morgenlage'
import { bruecke, sequenzBruecke, setzeJarvis, useJarvisEinstellungen, type Autostart, type JarvisStatus, type Stimme } from './desktop'
import { sprechen, startSequenzJetzt, stimmeWaehlen, useJarvis } from './dienst'
import WerkstattVerbindung from './WerkstattVerbindung'
import KameraVerbindung from './KameraVerbindung'

// Was gerade mit Lokis Stimme los ist (Piper springt ein, solange sie nicht bereit ist)
const LOKI_TEXT: Record<string, string> = {
  aus: 'Lädt, sobald Loki eingeschaltet wird (ca. 15 Sekunden, bis dahin spricht Piper).',
  laedt: 'Lokis Stimme lädt … bis dahin spricht Piper.',
  bereit: 'Loki spricht mit seiner eigenen Stimme.',
  fehlt: 'Lokis Stimme ist auf diesem PC nicht eingerichtet – es spricht Piper.',
  fehler: 'Lokis Stimme hat eine Störung – es spricht Piper.',
}

const PROBE = 'Guten Tag, Sir. Ich bin bereit. Ob Sie es auch sind, wird sich zeigen. Ich bin vorsichtig optimistisch. Sehr vorsichtig.'

export default function JarvisEinstellungen() {
  const e = useJarvisEinstellungen()
  const j = useJarvis()
  const da = !!bruecke()
  const [st, setSt] = useState<JarvisStatus | null>(null)
  // Zustand der Stimme alle 2 Sekunden nachsehen, solange die Einstellungen offen sind
  useEffect(() => {
    const b = bruecke()
    if (!b) return
    let weg = false
    const holen = () => void b.status().then((s) => { if (!weg) setSt(s) })
    holen()
    const t = setInterval(holen, 2000)
    return () => { weg = true; clearInterval(t) }
  }, [])
  const lz = st?.loki?.zustand ?? 'aus'
  // Autostart mit Windows (nur im installierten Programm)
  const [autostart, setAutostart] = useState<Autostart | null>(null)
  useEffect(() => { void window.jarvisDesktop?.autostart.lesen().then(setAutostart) }, [])
  const umschalten = (b: BausteinSchluessel) => setzeJarvis({ bausteine: e.bausteine.includes(b) ? e.bausteine.filter((x) => x !== b) : [...e.bausteine, b] })
  return (
    <Abschnitt titel="Loki (Sprachassistent)">
      {!da ? (
        <p className="text-sm text-neutral-500">Jarvis läuft nur im Windows-Programm – dort laufen Stimme und Spracherkennung kostenlos auf dem PC. Im normalen Browser fehlt die Verbindung dazu.</p>
      ) : (
        <div className="space-y-4 text-sm">
          <p className="text-neutral-600">Ein- und ausschalten über den runden Knopf oben rechts. Danach genügt „Guten Morgen, Loki“ für die Morgen-Lage oder „Hey Loki, …“ für Befehle und Fragen („Jarvis“ geht auch).</p>
          {autostart?.verfuegbar ? (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={autostart.an} onChange={(x) => void window.jarvisDesktop?.autostart.setzen(x.target.checked).then(setAutostart)} />
              Mit Windows starten – Loki wartet dann unsichtbar (Symbol unten rechts neben der Uhr), begrüßt Sie und trägt einmal am Tag die Morgen-Lage vor
            </label>
          ) : (
            <p className="text-neutral-500">Mit Windows starten: nur im installierten Programm möglich.</p>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={e.startSequenz} onChange={(x) => setzeJarvis({ startSequenz: x.target.checked })} />
              Start-Sequenz beim Rechnerstart (über alle Bildschirme, Loki begrüßt im Finale; jede Taste oder ein Klick bricht ab)
            </label>
            <label className="flex items-center gap-2">Lautstärke ({Math.round(e.sequenzLautstaerke * 100)} %)
              <input type="range" min="0" max="1" step="0.05" value={e.sequenzLautstaerke} onChange={(x) => setzeJarvis({ sequenzLautstaerke: Number(x.target.value) })} />
            </label>
            <button type="button" className="rounded-lg border border-neutral-300 px-3 py-1.5" disabled={!sequenzBruecke()} onClick={() => void startSequenzJetzt()}>Start-Sequenz jetzt abspielen</button>
          </div>
          <WerkstattVerbindung />
          <HudEinrichten />
          <KameraVerbindung />
          <p className="text-neutral-500">Das X oben rechts versteckt nur das Fenster – Loki hört weiter zu. Ganz beenden: Rechtsklick auf das Loki-Symbol unten rechts → „Beenden“.</p>
          <div className="flex flex-wrap items-end gap-4">
            <label className="block">Anrede<br /><input className="mt-1 w-40 rounded-lg border border-neutral-300 px-2 py-1.5" value={e.anrede} onChange={(x) => setzeJarvis({ anrede: x.target.value })} /></label>
            <label className="block">Stimme<br />
              <select className="mt-1 rounded-lg border border-neutral-300 px-2 py-1.5" value={e.stimme} onChange={(x) => void stimmeWaehlen(x.target.value as Stimme)}>
                <option value="loki">Loki (eigene Stimme)</option>
                <option value="piper">Piper Thorsten (alte Computerstimme)</option>
              </select>
            </label>
            {e.stimme === 'piper' && <label className="block">Sprechtempo ({e.tempo.toFixed(2)})<br /><input type="range" min="0.7" max="1.2" step="0.02" value={e.tempo} onChange={(x) => setzeJarvis({ tempo: Number(x.target.value) })} /></label>}
            <label className="flex items-center gap-2"><input type="checkbox" checked={e.humor} onChange={(x) => setzeJarvis({ humor: x.target.checked })} /> Humor (Seitenhiebe und Sprüche)</label>
            <button type="button" className="rounded-lg border border-neutral-300 px-3 py-1.5" disabled={j.zustand !== 'bereit'} onClick={() => void sprechen([PROBE])}>Stimme testen</button>
          </div>
          {e.stimme === 'loki' && (
            <p className="text-neutral-600">
              {LOKI_TEXT[lz]}{lz === 'fehler' && st?.loki?.fehler ? ` (${st.loki.fehler})` : ''}{' '}
              {lz === 'fehler' && j.zustand !== 'aus' && j.zustand !== 'fehler' &&<button type="button" className="underline" onClick={() => void bruecke()?.stimme(true)}>Neu starten</button>}
            </p>
          )}
          <div>
            <p className="font-medium text-neutral-700">Inhalte der Morgen-Lage</p>
            <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
              {BAUSTEINE.map((b) => (
                <label key={b.schluessel} className="flex items-center gap-2"><input type="checkbox" checked={e.bausteine.includes(b.schluessel)} onChange={() => umschalten(b.schluessel)} /> {b.titel}</label>
              ))}
            </div>
          </div>
          <label className="block">Aussprache für Piper (eine Zeile je „Wort = so gesprochen“, ergänzt die eingebaute Liste – Loki braucht das nicht)<br />
            <textarea className="mt-1 h-24 w-full rounded-lg border border-neutral-300 px-2 py-1.5 font-mono text-xs" value={e.aussprache} placeholder={'Kasuwa = Kasuwa\nBillbee = Billbie'} onChange={(x) => setzeJarvis({ aussprache: x.target.value })} />
          </label>
          <label className="block">Sprachmodell für freie Fragen (Ollama auf diesem PC)<br />
            <input className="mt-1 w-56 rounded-lg border border-neutral-300 px-2 py-1.5 font-mono" value={e.modell} onChange={(x) => setzeJarvis({ modell: x.target.value.trim() })} />
          </label>
        </div>
      )}
    </Abschnitt>
  )
}

/** Dauer-HUD (03.11.2026): Wallpaper in Wallpaper Engine anlegen – das aktive Wallpaper bleibt, bis man das neue auswählt */
function HudEinrichten() {
  const [meldung, setMeldung] = useState<{ ok: boolean; meldung: string } | null>(null)
  const da = typeof window !== 'undefined' && !!window.jarvisDesktop?.hud
  if (!da) return null
  return (
    <div className="space-y-1 rounded-lg border border-neutral-200 p-3">
      <p className="font-medium text-neutral-700">Dauer-HUD (Hintergrund über alle drei Bildschirme, Wallpaper Engine)</p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="rounded-lg border border-neutral-300 px-3 py-1.5" onClick={() => void window.jarvisDesktop?.hud?.einrichten().then(setMeldung)}>In Wallpaper Engine einrichten</button>
        <span className="text-neutral-500">Legt das Wallpaper „Loki Dauer-HUD“ an bzw. aktualisiert es. Loki muss laufen, damit es Daten zeigt.</span>
      </div>
      {meldung && <p className={meldung.ok ? 'text-emerald-700' : 'text-red-700'}>{meldung.meldung}</p>}
    </div>
  )
}
