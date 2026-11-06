// Einstellungen → Jarvis (03.11.2026): je Gerät gemerkt (Jarvis läuft nur im Windows-Programm dieses PCs).
import { Abschnitt } from '../ui/Abschnitt'
import { useEffect, useState } from 'react'
import { BAUSTEINE, type BausteinSchluessel } from './morgenlage'
import { bruecke, setzeJarvis, useJarvisEinstellungen, type Autostart, type Hoeren, type JarvisStatus, type MikrofonStufe, type Stimme } from './desktop'
import { gehoerSchalten, hoerenWaehlen, mikrofonStufeWaehlen, sprechen, stimmeWaehlen, useJarvis } from './dienst'
import WerkstattVerbindung from './WerkstattVerbindung'
import KameraVerbindung from './KameraVerbindung'
import PvVerbindung from './PvVerbindung'
import StationVerbindung from './StationVerbindung'
import ModellPruefung from './ModellPruefung'
import { NEU_GRUPPEN, type NeuGruppe } from './neuigkeiten'

// Was gerade mit Lokis Stimme los ist (Piper springt ein, solange sie nicht bereit ist)
const LOKI_TEXT: Record<string, string> = {
  aus: 'Lädt, sobald L.O.K.I. eingeschaltet wird (ca. 15 Sekunden, bis dahin spricht Piper).',
  laedt: 'Die Stimme von L.O.K.I. lädt … bis dahin spricht Piper.',
  bereit: 'L.O.K.I. spricht mit seiner eigenen Stimme.',
  fehlt: 'Die Stimme von L.O.K.I. ist auf diesem PC nicht eingerichtet – es spricht Piper.',
  fehler: 'Die Stimme von L.O.K.I. hat eine Störung – es spricht Piper.',
}

// Was gerade mit Lokis Gehör los ist (Whisper small springt ein, solange es nicht bereit ist)
const GEHOER_TEXT: Record<string, string> = {
  aus: 'Lädt, sobald L.O.K.I. eingeschaltet wird (ca. 5–30 Sekunden, bis dahin hört das kleine Modell).',
  laedt: 'Das Gehör von L.O.K.I. lädt … bis dahin hört das kleine Modell.',
  bereit: 'L.O.K.I. hört mit dem genauen Modell auf der Grafikkarte.',
  fehlt: 'Das genaue Gehör ist auf diesem PC nicht eingerichtet – es hört das kleine Modell.',
  fehler: 'Das Gehör von L.O.K.I. hat eine Störung – es hört das kleine Modell.',
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
  const gz = st?.gehoer?.zustand ?? 'aus'
  // Autostart mit Windows (nur im installierten Programm)
  const [autostart, setAutostart] = useState<Autostart | null>(null)
  useEffect(() => { void window.jarvisDesktop?.autostart.lesen().then(setAutostart) }, [])
  const umschalten = (b: BausteinSchluessel) => setzeJarvis({ bausteine: e.bausteine.includes(b) ? e.bausteine.filter((x) => x !== b) : [...e.bausteine, b] })
  return (
    <Abschnitt titel="L.O.K.I. – Lokale, Ohnehin Klügere Intelligenz">
      {!da ? (
        <p className="text-sm text-neutral-500">Jarvis läuft nur im Windows-Programm – dort laufen Stimme und Spracherkennung kostenlos auf dem PC. Im normalen Browser fehlt die Verbindung dazu.</p>
      ) : (
        <div className="space-y-4 text-sm">
          <p className="text-neutral-600">Ein- und ausschalten über den runden Knopf oben rechts. Danach genügt „Guten Morgen, L.O.K.I.“ für die Morgen-Lage oder „L.O.K.I., …“ bzw. „…, L.O.K.I.?“ für Befehle und Fragen („Jarvis“ geht auch).</p>
          {autostart?.verfuegbar ? (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={autostart.an} onChange={(x) => void window.jarvisDesktop?.autostart.setzen(x.target.checked).then(setAutostart)} />
              Mit Windows starten – L.O.K.I. wartet dann unsichtbar (Symbol unten rechts neben der Uhr), begrüßt Sie und trägt einmal am Tag die Morgen-Lage vor
            </label>
          ) : (
            <p className="text-neutral-500">Mit Windows starten: nur im installierten Programm möglich.</p>
          )}
          <WerkstattVerbindung />
          <HudEinrichten />
          <KameraVerbindung />
          <PvVerbindung />
          <StationVerbindung />
          <p className="text-neutral-500">Das X oben rechts versteckt nur das Fenster – L.O.K.I. hört weiter zu. Ganz beenden: Rechtsklick auf das L.O.K.I.-Symbol unten rechts → „Beenden“.</p>
          <div className="flex flex-wrap items-end gap-4">
            <label className="block">Anrede<br /><input className="mt-1 w-40 rounded-lg border border-neutral-300 px-2 py-1.5" value={e.anrede} onChange={(x) => setzeJarvis({ anrede: x.target.value })} /></label>
            <label className="block">Stimme<br />
              <select className="mt-1 rounded-lg border border-neutral-300 px-2 py-1.5" value={e.stimme} onChange={(x) => void stimmeWaehlen(x.target.value as Stimme)}>
                <option value="loki">L.O.K.I. (eigene Stimme)</option>
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
          <div className="flex flex-wrap items-end gap-4">
            <label className="block">Spracherkennung<br />
              <select className="mt-1 rounded-lg border border-neutral-300 px-2 py-1.5" value={e.hoeren} onChange={(x) => void hoerenWaehlen({ hoeren: x.target.value as Hoeren })}>
                <option value="turbo">Genau (Grafikkarte, ca. 1,2 GB)</option>
                <option value="klein">Klein (Prozessor, alter Stand)</option>
              </select>
            </label>
            <label className="block">Mikrofon-Empfindlichkeit<br />
              <select className="mt-1 rounded-lg border border-neutral-300 px-2 py-1.5" value={e.mikrofonStufe} onChange={(x) => void mikrofonStufeWaehlen(x.target.value as MikrofonStufe)}>
                <option value="ruhig">Ruhiger Raum (hört auch Leises)</option>
                <option value="normal">Normal</option>
                <option value="laut">Laute Werkstatt</option>
                <option value="sehrlaut">Sehr laut (nur deutliche Sprache)</option>
              </select>
            </label>
            {e.hoeren === 'turbo' && (
              <p className="text-neutral-600">
                {GEHOER_TEXT[gz]}{gz === 'fehler' && st?.gehoer?.fehler ? ` (${st.gehoer.fehler})` : ''}{' '}
                {gz === 'fehler' && j.zustand !== 'aus' && j.zustand !== 'fehler' && <button type="button" className="underline" onClick={() => void gehoerSchalten(true)}>Neu starten</button>}
              </p>
            )}
          </div>
          {e.hoeren === 'turbo' && (
            <label className="block">Wörter, die L.O.K.I. besser verstehen soll (Namen, Produkte – durch Komma getrennt; L.O.K.I., Lage, Neuigkeiten, Etsy, Amazon, Emma u. a. sind schon drin)<br />
              <input className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5" value={e.wortliste} placeholder="Kasuwa, Billbee, Boulder-Tasse" onChange={(x) => void hoerenWaehlen({ wortliste: x.target.value })} />
            </label>
          )}
          <div>
            <label className="flex items-center gap-2 font-medium text-neutral-700"><input type="checkbox" checked={e.neuigkeiten} onChange={(x) => setzeJarvis({ neuigkeiten: x.target.checked })} /> Neuigkeiten aus der Werkstatt von selbst ansagen</label>
            {e.neuigkeiten && (
              <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 pl-6">
                {NEU_GRUPPEN.map((g) => (
                  <label key={g.schluessel} className="flex items-center gap-2"><input type="checkbox" checked={e.neuGruppen.includes(g.schluessel)} onChange={() => setzeJarvis({ neuGruppen: e.neuGruppen.includes(g.schluessel) ? e.neuGruppen.filter((x: NeuGruppe) => x !== g.schluessel) : [...e.neuGruppen, g.schluessel] })} /> {g.titel}</label>
                ))}
              </div>
            )}
            <label className="mt-2 flex items-center gap-2 font-medium text-neutral-700"><input type="checkbox" checked={e.kameraMelden} onChange={(x) => setzeJarvis({ kameraMelden: x.target.checked })} /> Kamera: Person am linken Objektiv ansagen (die Kamera erkennt Personen selbst; im Dauer-HUD wird das Bild hervorgehoben)</label>
            <p className="mt-1 pl-6 text-neutral-500">Nur Neues, nur wenn Sie am PC sind (Maus oder Tastatur in den letzten 10 Minuten) – Verpasstes kommt gesammelt. Ihre eigenen Karten (Konto „Alex“) sagt L.O.K.I. nicht an. Abgleich alle 2 Minuten, Bestellungen kommen bis zu 15 Minuten später (Billbee).</p>
            <label className="mt-2 flex items-center gap-2 font-medium text-neutral-700"><input type="checkbox" checked={e.niesen} onChange={(x) => setzeJarvis({ niesen: x.target.checked })} /> Niesen: L.O.K.I. wünscht Gesundheit (läuft nur auf diesem PC)</label>
          </div>
          <div>
            <p className="font-medium text-neutral-700">Inhalte der Morgen-Lage</p>
            <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
              {BAUSTEINE.map((b) => (
                <label key={b.schluessel} className="flex items-center gap-2"><input type="checkbox" checked={e.bausteine.includes(b.schluessel)} onChange={() => umschalten(b.schluessel)} /> {b.titel}</label>
              ))}
            </div>
          </div>
          <label className="block">Aussprache für Piper (eine Zeile je „Wort = so gesprochen“, ergänzt die eingebaute Liste – L.O.K.I. braucht das nicht)<br />
            <textarea className="mt-1 h-24 w-full rounded-lg border border-neutral-300 px-2 py-1.5 font-mono text-xs" value={e.aussprache} placeholder={'Kasuwa = Kasuwa\nBillbee = Billbie'} onChange={(x) => setzeJarvis({ aussprache: x.target.value })} />
          </label>
          <label className="block">Sprachmodell für freie Fragen (Ollama auf diesem PC)<br />
            <input className="mt-1 w-56 rounded-lg border border-neutral-300 px-2 py-1.5 font-mono" value={e.modell} onChange={(x) => setzeJarvis({ modell: x.target.value.trim() })} />
          </label>
          <ModellPruefung modell={e.modell} />
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
        <span className="text-neutral-500">Legt das Wallpaper „L.O.K.I. Dauer-HUD“ an bzw. aktualisiert es. L.O.K.I. muss laufen, damit es Daten zeigt.</span>
      </div>
      {meldung && <p className={meldung.ok ? 'text-emerald-700' : 'text-red-700'}>{meldung.meldung}</p>}
    </div>
  )
}
