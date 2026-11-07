// Grundgerüst der Jarvis-Oberfläche (03.11.2026): Kopfzeile mit dem Jarvis-Ring und darunter die Einstellungen.
// Bewusst schlicht – die eigentliche Gestaltung (Start-Sequenz, drei Bildschirme) folgt mit vier Entwürfen zur Wahl.
import JarvisKnopf from './jarvis/JarvisKnopf'
import JarvisEinstellungen from './jarvis/JarvisEinstellungen'
import AutosAmHof from './jarvis/AutosAmHof'
import { NachfrageHost } from './ui/Nachfrage'

export default function App() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Jarvis</h1>
          <p className="text-sm text-neutral-500">Sprachassistent · Version {window.jarvisDesktop?.version ?? '–'}</p>
        </div>
        <JarvisKnopf klasse="rounded-full border border-neutral-300 bg-white p-2 hover:bg-neutral-50" />
      </header>
      <AutosAmHof />
      <JarvisEinstellungen />
      <NachfrageHost />
    </div>
  )
}
