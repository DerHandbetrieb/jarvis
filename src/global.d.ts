// Was das Windows-Programm der Oberfläche über die Brücke (electron/preload.cjs) gibt
import type { Autostart, JarvisBruecke } from './jarvis/desktop'

declare global {
  interface Window {
    jarvisDesktop?: {
      version: string
      /** true, wenn Windows das Programm beim Anmelden gestartet hat */
      beimStart: boolean
      autostart: { lesen: () => Promise<Autostart | null>; setzen: (an: boolean) => Promise<Autostart | null> }
      jarvis: JarvisBruecke
    }
  }
}
