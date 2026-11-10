// Jarvis – Brücke zum Windows-Programm und Einstellungen je Gerät (03.11.2026). Jarvis gibt es nur im Windows-Programm
// (Stimme und Spracherkennung laufen dort lokal); im Browser ist window.jarvisDesktop nicht da.
import { useSyncExternalStore } from 'react'
import { BAUSTEINE, type BausteinSchluessel } from './morgenlage'
import { NEU_GRUPPEN, type Neuigkeit, type NeuGruppe } from './neuigkeiten'

/** Lokis Stimme (Qwen3-TTS als eigenes Python-Programm): fehlt = nicht eingerichtet, fehler = abgestürzt/Laden misslungen */
export type LokiZustand = 'aus' | 'laedt' | 'bereit' | 'fehlt' | 'fehler'
export type MikrofonStufe = 'ruhig' | 'normal' | 'laut' | 'sehrlaut'
export const MIKROFON_SCHWELLE: Record<MikrofonStufe, number> = { ruhig: 0.35, normal: 0.5, laut: 0.7, sehrlaut: 0.85 }
export type JarvisStatus = { verfuegbar: boolean; modelle: Record<string, boolean>; bereit: boolean; zuhoeren: boolean; groesseMb: number; loki?: { zustand: LokiZustand; fehler: string }
  /** Lokis Gehör (Whisper turbo auf der Grafikkarte, 04.11.2026) – gleiche Zustände wie die Stimme */
  gehoer?: { zustand: LokiZustand; fehler: string; art: Hoeren } }
export type Stimme = 'loki' | 'piper'
/** Spracherkennung: turbo = Grafikkarte (genauer), klein = Whisper small auf dem Prozessor (alter Stand, immer als Ersatz da) */
export type Hoeren = 'turbo' | 'klein'
/** Autostart mit Windows – nur im installierten Programm verfügbar */
export type Autostart = { verfuegbar: boolean; an: boolean }
export type JarvisBruecke = {
  /** Zustand fürs Symbol im Infobereich unten rechts */
  meldeZustand: (zustand: string, mikrofon: boolean) => void
  /** Rechtsklick-Menü des Symbols: „Mikrofon aus/an“ */
  beiTrayMikrofon: (fn: () => void) => () => void
  /** roter Knopf im Dauer-HUD (Wallpaper) */
  beiStummKnopf: (fn: () => void) => () => void
  status: () => Promise<JarvisStatus | null>
  vorbereiten: () => Promise<JarvisStatus | null>
  /** text = Originalsatz für Loki, piperText = mit Aussprache-Liste für Piper (springt ein, wenn Loki nicht bereit ist) */
  sprechen: (a: { text: string; piperText: string; tempo: number; stimme: Stimme }) => Promise<{ samples: Float32Array; sampleRate: number; stimme: Stimme } | null>
  /** Lokis Stimme laden (im Hintergrund) oder beenden (gibt den Grafikspeicher frei) */
  stimme: (an: boolean) => Promise<JarvisStatus | null>
  /** Lokis Gehör laden (im Hintergrund) oder beenden; worte = eigene Wörter für die Wortliste */
  gehoer?: (a: { an: boolean; art: Hoeren; worte: string; nurWorte?: boolean }) => Promise<JarvisStatus | null>
  empfindlichkeit?: (wert: number) => Promise<JarvisStatus | null>
  zuhoeren: (an: boolean) => Promise<JarvisStatus | null>
  frage: (modell: string, nachrichten: { role: 'system' | 'user' | 'assistant'; content: string }[]) => Promise<{ text: string; fehler?: 'modell' | 'ollama' | 'fehlt'; tokens?: number; ladenS?: number } | null>
  /** Sprachmodell schon laden, sobald „Loki“ fällt (die Frage kommt gleich) */
  vorwaermen?: (modell: string) => void
  /** er hat L.O.K.I. angesprochen (für den Abwesenheits-Modus) */
  nutzerAktiv?: () => void
  /** Deutschlandfunk-Nachrichten (10.11.2026) */
  nachrichten?: () => Promise<import('./nachrichten').NachrichtenAntwort | null>
  /** Modell-Prüfung (monatlich, 04.11.2026): stand aktuell | neuer | fehlt | unbekannt */
  modellPruefen?: (modell: string) => Promise<{ stand: 'aktuell' | 'neuer' | 'fehlt' | 'unbekannt'; text: string } | null>
  /** neue Fassung über Ollama herunterladen (kann einige Minuten dauern) */
  modellHolen?: (modell: string) => Promise<{ ok: boolean; text?: string } | null>
  /** eine Zeile ins Gesprächs-Protokoll (gespraech.log im Datenordner) */
  protokoll?: (zeile: string) => void
  /** Stand der Spruch-Sammlungen (wie viele noch nie dran waren) → sprueche-stand.json für Claude */
  spruchStand?: (json: string) => void
  /** Anwesenheit: Sekunden ohne Maus/Tastatur, Vollbild-Spiel läuft (Neuigkeiten, 04.11.2026) */
  anwesenheit?: () => Promise<{ ruhe: number; spiel: boolean } | null>
  /** neue Ereignisse aus der Werkstatt abholen (schon mit dem Bekannten abgeglichen; der Hauptprozess hält sie bis dahin) */
  holeNeuigkeiten?: () => Promise<{ n: Neuigkeit; zeit: number }[] | null>
  ton: (stueck: Float32Array) => void
  beiErkannt: (fn: (d: { text: string; sekunden: number; art?: Hoeren }) => void) => () => void
  beiNiesen: (fn: () => void) => () => void
  beiFortschritt: (fn: (d: { name: string; anteil: number }) => void) => () => void
}

/** Werkstatt-Anbindung (Anmeldung des Loki-Kontos): einrichten = QR-Code scannen, code = 6-stelligen Code eingeben */
export type WerkstattStatus = { verfuegbar: boolean; zustand: 'aus' | 'einrichten' | 'code' | 'verbunden' | 'fehler'; fehler: string; qr: string; stand: number | null
  /** Einrichtungsschlüssel zum Abtippen in die Authenticator-App (nur während „einrichten“) */
  schluessel?: string }
export type WerkstattBruecke = {
  status: () => Promise<WerkstattStatus | null>
  verbinden: (email: string, passwort: string) => Promise<WerkstattStatus | null>
  code: (code: string) => Promise<WerkstattStatus | null>
  trennen: () => Promise<WerkstattStatus | null>
  /** erzwingen = frisch holen statt aus dem Zwischenspeicher (bis 2 Minuten alt) */
  lage: (erzwingen?: boolean) => Promise<WerkstattLage | null>
  beiAenderung: (fn: (s: WerkstattStatus) => void) => () => void
}
/** Antwort der Serverfunktion jarvis-lage (Werkstatt-App, supabase/functions/jarvis-lage) */
export type WerkstattLage = {
  stand: string
  geholt: number
  aufgaben: { offen: number; neu: number; wichtigste: { titel: string; faellig: string | null; art?: string | null }[]; amazonProbleme: string[] }
  lagerKnapp: { name: string; variante: string | null; bestand: number; meldebestand: number }[]
  verkauf: {
    gestern: { tag: string; bestellungen: number; stueck: number; umsatzCent: number; kanaele: { kanal: string; bestellungen: number; stueck: number; umsatzCent: number }[] }
    tage: { tag: string; bestellungen: number; stueck: number; umsatzCent: number }[]
    kanaele14: { kanal: string; bestellungen: number; stueck: number; umsatzCent: number }[]
  }
  freigaben: number
  selbsttest: { am: string; rot: number } | null
  offeneBestellungen?: { anzahl: number; liste: { id?: number; kanal: string; artikel: string[] }[] }
}
export const werkstattBruecke = (): WerkstattBruecke | null => (typeof window !== 'undefined' ? window.jarvisDesktop?.werkstatt ?? null : null)

/** Kamera (Reolink, Standbild): Benutzer/Passwort gehen nur hinein, kommen nie zurück; vorschau = JPEG als data:-Adresse */
export type KameraStatus = { eingerichtet: boolean; name: string; adresse: string; fehler: string; stand: number | null; vorschau?: string | null }
export type KameraBruecke = {
  status: () => Promise<KameraStatus | null>
  einrichten: (d: { adresse: string; benutzer: string; passwort: string; name: string }) => Promise<KameraStatus | null>
  bild: () => Promise<KameraStatus | null>
  gross?: (kanal: number | null) => Promise<boolean | null>
  entfernen: () => Promise<KameraStatus | null>
}
export const kameraBruecke = (): KameraBruecke | null => (typeof window !== 'undefined' ? window.jarvisDesktop?.kamera ?? null : null)

/** PV-Anlage FENECON (05.11.2026): nur lesen; Passwort wird nur weitergereicht, verschlüsselt im Hauptprozess gespeichert */
export type PvWerte = { akku: number | null; akkuW: number | null; netzW: number | null; pvW: number | null; hausW: number | null; zustand: number | null; inselbetrieb: boolean; zeit: number }
export type PvStatus = { eingerichtet: boolean; adresse: string | null; werte: PvWerte | null; fehler: string | null }
export type PvBruecke = {
  status: () => Promise<PvStatus | null>
  einrichten: (d: { adresse: string; passwort: string }) => Promise<PvStatus | null>
  entfernen: () => Promise<PvStatus | null>
}
/** Wetterstation Ecowitt (05.11.2026): Schlüssel werden nur weitergereicht, verschlüsselt im Hauptprozess gespeichert */
export type StationWerte = { grad: number | null; feuchte: number | null; wind: number | null; boe: number | null; druck: number | null; regenHeute: number | null; zeit: number }
export type StationStatus = { eingerichtet: boolean; station: string | null; werte: StationWerte | null; fehler: string | null; veraltet?: boolean }
export type StationBruecke = {
  status: () => Promise<StationStatus | null>
  /** Wetter allein aus der Station (electron/himmel.cjs); code null = Himmel nicht messbar, null = keine frischen Daten */
  wetter?: () => Promise<{ grad: number; code?: number | null; wolken?: number | null; feuchte?: number | null; wind?: number | null; boe?: number | null; druck?: number | null; regenRate?: number | null; regenHeute?: number | null } | null>
  einrichten: (d: { appKey: string; apiKey: string; mac: string }) => Promise<StationStatus | null>
  entfernen: () => Promise<StationStatus | null>
}
export const stationBruecke = (): StationBruecke | null => (typeof window !== 'undefined' ? window.jarvisDesktop?.station ?? null : null)
export const pvBruecke = (): PvBruecke | null => (typeof window !== 'undefined' ? window.jarvisDesktop?.pv ?? null : null)

/** Start-Sequenz über alle Bildschirme; Meldungen: gruss (Loki hat dort gesprochen), ohne-gruss, abgebrochen, ende */
export type SequenzBruecke = {
  starten: (lautstaerke: number) => Promise<boolean>
  gruss: (samples: Float32Array, sampleRate: number) => void
  keinGruss: () => void
  beiMeldung: (fn: (art: string) => void) => () => void
}
export const sequenzBruecke = (): SequenzBruecke | null => (typeof window !== 'undefined' ? window.jarvisDesktop?.sequenz ?? null : null)

export const bruecke = (): JarvisBruecke | null => (typeof window !== 'undefined' ? window.jarvisDesktop?.jarvis ?? null : null)

export type JarvisEinstellungen = {
  an: boolean
  anrede: string
  humor: boolean
  /** loki = neue Stimme (Probe S), piper = alte Computerstimme Thorsten */
  stimme: Stimme
  /** Spracherkennung: turbo (Grafikkarte, Standard) oder klein (Prozessor) */
  hoeren: Hoeren
  /** Mikrofon: ruhig = hört auch Leises, laut = nur klare Sprache (Werkstatt-Lärm) */
  mikrofonStufe: MikrofonStufe
  /** eigene Wörter, die L.O.K.I. besser verstehen soll (Produkt- und Namen), durch Komma oder Zeile getrennt */
  wortliste: string
  /** Neuigkeiten aus der Werkstatt von selbst ansagen (Wunsch Auftraggeber 04.11.2026) */
  neuigkeiten: boolean
  /** welche Arten angesagt werden */
  neuGruppen: NeuGruppe[]
  /** Kamera-Wache: Person oder Auto am linken Objektiv ansagen (04.11.2026, Autos 06.11.2026) */
  kameraMelden: boolean
  niesen: boolean
  /** Deutschlandfunk-Nachrichten einmal am Tag nach der Morgen-Lage vorlesen (10.11.2026) */
  nachrichten: boolean
  /** Tag, an dem die Nachrichten nach der Lage schon kamen (JJJJ-M-T) */
  zuletztNachrichten: string
  /** Sprechtempo – nur für Piper, Loki hat sein Tempo aus der Vorlage */
  tempo: number
  bausteine: BausteinSchluessel[]
  /** eigene Aussprache-Einträge, eine Zeile je „Wort = Aussprache“ – nur für Piper */
  aussprache: string
  modell: string
  /** letzte Modell-Prüfung (JJJJ-MM-TT) – höchstens alle 30 Tage */
  zuletztModellPruefung: string
  /** Morgen-Lage am Tag schon vorgetragen (JJJJ-MM-TT) – damit „Guten Morgen“ später nur noch kurz antwortet */
  zuletztLage: string
  /** Nummer der letzten Begrüßung beim Rechnerstart (-1 = noch keine) – damit nie zweimal dieselbe kommt */
  letzteBegruessung: number
  /** Start-Sequenz über alle Bildschirme beim Rechnerstart (Lokis Spruch im Finale) */
  startSequenz: boolean
  /** Lautstärke der Start-Sequenz (0 bis 1) – Lokis Stimme bleibt dabei verständlich */
  sequenzLautstaerke: number
}

const STANDARD: JarvisEinstellungen = {
  an: false, anrede: 'Sir', humor: true, stimme: 'loki', hoeren: 'turbo', mikrofonStufe: 'normal', wortliste: '', niesen: true, neuigkeiten: true, neuGruppen: NEU_GRUPPEN.map((g) => g.schluessel), kameraMelden: true, tempo: 0.88, bausteine: BAUSTEINE.map((b) => b.schluessel), aussprache: '', modell: 'qwen3:8b', zuletztModellPruefung: '', zuletztLage: '', letzteBegruessung: -1, startSequenz: true, sequenzLautstaerke: 0.8, nachrichten: true, zuletztNachrichten: '',
}
const SCHLUESSEL = 'jarvis.einstellungen'
const zuhoerer = new Set<() => void>()

function lesen(): JarvisEinstellungen {
  try {
    const roh = JSON.parse(localStorage.getItem(SCHLUESSEL) ?? 'null') as Partial<JarvisEinstellungen> | null
    const e = { ...STANDARD, ...(roh ?? {}) }
    // altes Standardmodell (war nie installiert) → neues Standardmodell qwen3:8b (03.11.2026)
    if (e.modell === 'qwen2.5:7b') e.modell = STANDARD.modell
    return e
  } catch { return { ...STANDARD } }
}
let aktuell = lesen()

export function jarvisEinstellungen(): JarvisEinstellungen { return aktuell }
export function setzeJarvis(teil: Partial<JarvisEinstellungen>) {
  aktuell = { ...aktuell, ...teil }
  try { localStorage.setItem(SCHLUESSEL, JSON.stringify(aktuell)) } catch { /* dann eben nicht gemerkt */ }
  zuhoerer.forEach((z) => z())
}
export function useJarvisEinstellungen(): JarvisEinstellungen {
  return useSyncExternalStore((z) => { zuhoerer.add(z); return () => { zuhoerer.delete(z) } }, () => aktuell)
}
