// Was das Windows-Programm der Oberfläche über die Brücke (electron/preload.cjs) gibt
import type { JarvisBruecke } from './jarvis/desktop'

declare global {
  interface Window {
    jarvisDesktop?: { version: string; jarvis: JarvisBruecke }
  }
}
