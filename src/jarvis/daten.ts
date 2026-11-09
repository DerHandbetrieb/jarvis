// Jarvis – Daten für die Morgen-Lage (03.11.2026). Jeder Baustein für sich: scheitert einer (z. B. kein Internet
// fürs Wetter), fehlt nur dieser Satz.
// Werkstatt-Daten (Aufgaben, Amazon-Probleme, Selbsttest, Lager, Verkäufe gestern, Freigaben) kommen seit Etappe L2
// (03.11.2026) aus der lesenden Serverfunktion „jarvis-lage“ der Werkstatt-Datenbank – über die Anmeldung des
// Loki-Kontos im Hauptprozess (electron/werkstatt.cjs). Ohne Verbindung oder mit veralteten Daten (älter als eine
// Stunde) liefern diese Bausteine „null“ und die Morgen-Lage lässt sie weg – Loki erfindet nichts.
// Entscheidung Auftraggeber: Loki darf alles laut sagen, auch den Umsatz in Euro.
import { wetterAusCode, WETTER_WORT } from './wetter'
import type { BausteinSchluessel, LageEingabe } from './morgenlage'
import { stationBruecke, werkstattBruecke, type WerkstattLage } from './desktop'
import { istFreigabeSammelkarte } from './neuigkeiten'

/** „2× Tasse“ → „2 mal Tasse“ */
const artikelGesprochen = (a: string) => a.replace(/^1× /, '').replace(/^(\d+)× /, '$1 mal ')
const HOECHSTENS_ALT = 60 * 60_000

const sicher = async <T,>(f: () => Promise<T>): Promise<T | null> => { try { return await f() } catch { return null } }
const mitZeitgrenze = <T,>(p: Promise<T>, ms = 20_000): Promise<T> => Promise.race([p, new Promise<T>((_, nein) => setTimeout(() => nein(new Error('Zeitüberschreitung')), ms))])

type WerkstattTeil = Pick<LageEingabe, 'aufgaben' | 'probleme' | 'lager' | 'verkauf' | 'freigaben' | 'offen'>
/** Antwort der Serverfunktion in die Bausteine der Morgen-Lage umrechnen (getestet) */
export function ausWerkstatt(l: WerkstattLage | null, jetzt: Date): WerkstattTeil {
  if (!l || !(jetzt.getTime() - l.geholt < HOECHSTENS_ALT)) return { aufgaben: null, probleme: null, lager: null, verkauf: null, freigaben: null, offen: null }
  // Selbsttest zählt nur, wenn er aus den letzten 24 Stunden stammt
  const nachproduzieren = l.aufgaben.wichtigste.filter((w) => w.art === 'nachproduzieren').length
  const testRot = !!l.selbsttest && l.selbsttest.rot > 0 && jetzt.getTime() - new Date(l.selbsttest.am).getTime() < 24 * 3_600_000
  return {
    // die Freigabe-Sammelkarte nicht als „wichtigste Aufgabe“ vorlesen – die Freigaben hat ein eigener Baustein
    // alle Karten (nicht nur die obersten 3), sonst rutschen alte nach und gelten als neu; Nachproduzieren hat einen eigenen Baustein (Lager knapp), darum nicht unter Abarbeiten
    aufgaben: { anzahl: Math.max(0, l.aufgaben.offen - nachproduzieren), neu: l.aufgaben.neu, wichtigste: l.aufgaben.wichtigste.filter((w) => !istFreigabeSammelkarte(w.titel) && w.art !== 'nachproduzieren').map((w) => w.titel) },
    probleme: { amazon: l.aufgaben.amazonProbleme, selbsttestRot: testRot },
    lager: { namen: l.lagerKnapp.map((k) => (k.variante ? `${k.name} ${k.variante}` : k.name)) },
    verkauf: { bestellungen: l.verkauf.gestern.bestellungen, stueck: l.verkauf.gestern.stueck, umsatzCent: l.verkauf.gestern.umsatzCent },
    freigaben: l.freigaben,
    offen: l.offeneBestellungen ? { anzahl: Number(l.offeneBestellungen.anzahl) || 0, liste: (l.offeneBestellungen.liste ?? []).map((b) => ({ id: b.id, kanal: b.kanal, artikel: (b.artikel ?? []).map(artikelGesprochen) })) } : null,
  }
}

const WERKSTATT_BAUSTEINE: BausteinSchluessel[] = ['aufgaben', 'probleme', 'lager', 'verkauf', 'freigaben']

export async function ladeLageDaten(bausteine: Set<BausteinSchluessel>): Promise<Omit<LageEingabe, 'jetzt' | 'anrede' | 'humor' | 'bausteine'>> {
  const brauchtWerkstatt = WERKSTATT_BAUSTEINE.some((b) => bausteine.has(b))
  // höchstens 20 Sekunden warten – die Morgen-Lage darf nie an einer hängenden Verbindung hängen bleiben
  const [wetter, werkstatt] = await Promise.all([
    // ausnahmslos die eigene Station (06.11.2026): ohne frische Werte entfällt der Wettersatz
    bausteine.has('wetter') ? sicher(async () => (await mitZeitgrenze(stationBruecke()?.wetter?.() ?? Promise.resolve(null))) ?? null) : Promise.resolve(null),
    brauchtWerkstatt ? sicher(async () => (await mitZeitgrenze(werkstattBruecke()?.lage() ?? Promise.resolve(null))) ?? null) : Promise.resolve(null),
  ])
  // fehlt in der Antwort etwas (andere Fassung der Serverfunktion), entfallen nur die Werkstatt-Sätze
  let werkstattTeil: WerkstattTeil
  try { werkstattTeil = ausWerkstatt(werkstatt, new Date()) } catch { werkstattTeil = ausWerkstatt(null, new Date()) }
  return {
    ...werkstattTeil,
    wetter: wetter ? { grad: wetter.grad, text: wetter.code != null ? WETTER_WORT[wetterAusCode(wetter.code, wetter.wolken ?? 0)] : null } : null,
  }
}
