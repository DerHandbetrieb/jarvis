// Einstellungen → Jarvis (03.11.2026): je Gerät gemerkt (Jarvis läuft nur im Windows-Programm dieses PCs).
import { Abschnitt } from '../ui/Abschnitt'
import { BAUSTEINE, type BausteinSchluessel } from './morgenlage'
import { bruecke, setzeJarvis, useJarvisEinstellungen } from './desktop'
import { sprechen, useJarvis } from './dienst'

const PROBE = 'Guten Tag, Sir. Ich bin bereit. Und ich darf sagen: Ich habe schon schlechtere Tage erlebt. Theoretisch.'

export default function JarvisEinstellungen() {
  const e = useJarvisEinstellungen()
  const j = useJarvis()
  const da = !!bruecke()
  const umschalten = (b: BausteinSchluessel) => setzeJarvis({ bausteine: e.bausteine.includes(b) ? e.bausteine.filter((x) => x !== b) : [...e.bausteine, b] })
  return (
    <Abschnitt titel="Jarvis (Sprachassistent)">
      {!da ? (
        <p className="text-sm text-neutral-500">Jarvis läuft nur im Windows-Programm – dort laufen Stimme und Spracherkennung kostenlos auf dem PC. Im normalen Browser fehlt die Verbindung dazu.</p>
      ) : (
        <div className="space-y-4 text-sm">
          <p className="text-neutral-600">Ein- und ausschalten über den runden Knopf oben rechts. Danach genügt „Guten Morgen, Jarvis“ für die Morgen-Lage oder „Hey Jarvis, …“ für Befehle.</p>
          <div className="flex flex-wrap items-end gap-4">
            <label className="block">Anrede<br /><input className="mt-1 w-40 rounded-lg border border-neutral-300 px-2 py-1.5" value={e.anrede} onChange={(x) => setzeJarvis({ anrede: x.target.value })} /></label>
            <label className="block">Sprechtempo ({e.tempo.toFixed(2)})<br /><input type="range" min="0.7" max="1.2" step="0.02" value={e.tempo} onChange={(x) => setzeJarvis({ tempo: Number(x.target.value) })} /></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={e.humor} onChange={(x) => setzeJarvis({ humor: x.target.checked })} /> Humor (ab und zu ein Spruch)</label>
            <button type="button" className="rounded-lg border border-neutral-300 px-3 py-1.5" disabled={j.zustand !== 'bereit'} onClick={() => void sprechen([PROBE])}>Stimme testen</button>
          </div>
          <div>
            <p className="font-medium text-neutral-700">Inhalte der Morgen-Lage</p>
            <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
              {BAUSTEINE.map((b) => (
                <label key={b.schluessel} className="flex items-center gap-2"><input type="checkbox" checked={e.bausteine.includes(b.schluessel)} onChange={() => umschalten(b.schluessel)} /> {b.titel}</label>
              ))}
            </div>
          </div>
          <label className="block">Aussprache (eine Zeile je „Wort = so gesprochen“, ergänzt die eingebaute Liste)<br />
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
