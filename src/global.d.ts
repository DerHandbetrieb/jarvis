// Was das Windows-Programm der Oberfläche über die Brücke (electron/preload.cjs) gibt
import type { Autostart, JarvisBruecke, KameraBruecke, PvBruecke, SequenzBruecke, WerkstattBruecke } from './jarvis/desktop'

declare global {
  interface Window {
    jarvisDesktop?: {
      version: string
      /** true, wenn Windows das Programm beim Anmelden gestartet hat */
      beimStart: boolean
      autostart: { lesen: () => Promise<Autostart | null>; setzen: (an: boolean) => Promise<Autostart | null> }
      jarvis: JarvisBruecke
      sequenz?: SequenzBruecke
      werkstatt?: WerkstattBruecke
      kamera?: KameraBruecke
      pv?: PvBruecke
      hud?: { einrichten: () => Promise<{ ok: boolean; meldung: string } | null> }
    }
  }
}
