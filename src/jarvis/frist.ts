// Bestellfrist fürs Dauer-HUD und die Morgen-Lage (eine Quelle seit 20.11.2026; hud5/frist.js reicht nur weiter).
// Feste Regel (Vorgabe Auftraggeber 20.11.2026, gilt genauso für die Werkstatt-App): Frist = nächster DHL-Abholtag
// (Montag, Mittwoch, Freitag) NACH dem Bestelltag – Mo → Mi, Di → Mi, Mi → Fr, Do → Fr, Fr/Sa/So → Mo. Das ganze Jahr
// gleich, Feiertage werden bewusst nicht berücksichtigt. (Vorher: „2 Zähltage“ mit Feiertagen BW – verworfen.)
// Im eigenen Shop läuft die Frist ab Zahlung.

/** Kalendertag in deutscher Zeit (JJJJ-MM-TT) */
export function berlinTag(d: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}
export function tagPlus(t: string, n: number): string {
  const d = new Date(`${t}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
/** 0 = Sonntag … 6 = Samstag */
export function wochentag(t: string): number { return new Date(`${t}T12:00:00Z`).getUTCDay() }

/** Abholtag: Montag, Mittwoch oder Freitag */
const istAbholtag = (t: string) => [1, 3, 5].includes(wochentag(t))
/** nächster Versandtag (DHL-Abholung Mo/Mi/Fr) NACH Tag t – Samstag → Montag, Montag → Mittwoch */
export function naechsterVersandtag(t: string): string {
  let x = tagPlus(t, 1)
  while (!istAbholtag(x)) x = tagPlus(x, 1)
  return x
}

/** Frist: nächster Abholtag nach dem Tag des Fristbeginns (deutsche Zeit) */
export function fristFuer(beginn: string | Date): string {
  return naechsterVersandtag(berlinTag(new Date(beginn)))
}
/** eigener Shop (PrestaShop) – dort wird auf die Zahlung gewartet (wie Werkstatt _geteilt/kanal.ts istEigenerShop) */
export const istEigenerShop = (kanal: unknown) => /eigen|presta/i.test(String(kanal ?? ''))

/**
 * Einordnung einer offenen Bestellung: 'ueberfaellig' | 'heute' | 'spaeter' | 'zahlung' (eigener Shop, noch nicht bezahlt).
 * bezahlt fehlt ganz (undefined), wenn jarvis-lage kein Zahlungsdatum liefert – dann gilt der Bestelltag.
 */
export type FristGruppe = 'ueberfaellig' | 'heute' | 'spaeter' | 'zahlung'
export type FristBestellung = { am: string; kanal: string; bezahlt?: string | null }
export function einordnen(b: FristBestellung, jetzt: Date): { gruppe: FristGruppe; frist: string } {
  let beginn = b.am
  if (istEigenerShop(b.kanal) && b.bezahlt !== undefined) {
    if (!b.bezahlt) return { gruppe: 'zahlung', frist: '' }
    if (b.bezahlt > b.am) beginn = b.bezahlt
  }
  if (!beginn || !Number.isFinite(new Date(beginn).getTime())) return { gruppe: 'spaeter', frist: '' }
  const frist = fristFuer(beginn), heute = berlinTag(jetzt)
  return { gruppe: frist < heute ? 'ueberfaellig' : frist === heute ? 'heute' : 'spaeter', frist }
}

/** nächster DHL-Abholtag (Mo, Mi, Fr) ab heute, heute eingeschlossen */
export function naechsteAbholung(jetzt: Date): string {
  const t = berlinTag(jetzt)
  return istAbholtag(t) ? t : naechsterVersandtag(t)
}

const WT = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA']
/** „DI 17.11.“ */
export const tagKurz = (t: string) => (t ? `${WT[wochentag(t)]} ${t.slice(8, 10)}.${t.slice(5, 7)}.` : '')
