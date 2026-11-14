// Bestellfrist fürs Dauer-HUD (14.11.2026, Wunsch Auftraggeber): dieselbe Regel wie die Werkstatt-Übersicht
// (Werkstatt-App src/startseite/frist.ts, Stand Werkstatt 0.230.0). Frist = 2 Zähltage nach dem Bestelltag; es zählen
// Montag bis Samstag, Sonntag und gesetzliche Feiertage in Baden-Württemberg nicht. Im eigenen Shop läuft die Frist ab
// Zahlung. Ändert sich die Regel in der Werkstatt, hier nachziehen (Tests in frist.test.js mit den Beispielen der Werkstatt).

/** Kalendertag in deutscher Zeit (JJJJ-MM-TT) */
export function berlinTag(d) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}
export function tagPlus(t, n) {
  const d = new Date(`${t}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
/** 0 = Sonntag … 6 = Samstag */
export function wochentag(t) { return new Date(`${t}T12:00:00Z`).getUTCDay() }

export function ostersonntag(jahr) {
  const a = jahr % 19, b = Math.floor(jahr / 100), c = jahr % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451)
  const monat = Math.floor((h + l - 7 * m + 114) / 31), tag = ((h + l - 7 * m + 114) % 31) + 1
  return `${jahr}-${String(monat).padStart(2, '0')}-${String(tag).padStart(2, '0')}`
}
/** gesetzliche Feiertage in Baden-Württemberg */
export function feiertageBW(jahr) {
  const o = ostersonntag(jahr)
  const fest = ['01-01', '01-06', '05-01', '10-03', '11-01', '12-25', '12-26'].map((md) => `${jahr}-${md}`)
  return [...fest, ...[-2, 1, 39, 50, 60].map((n) => tagPlus(o, n))].sort()
}
const speicher = new Map()
export function istFeiertag(t) {
  const jahr = Number(t.slice(0, 4))
  if (!speicher.has(jahr)) speicher.set(jahr, new Set(feiertageBW(jahr)))
  return speicher.get(jahr).has(t)
}
const zaehlt = (t) => wochentag(t) !== 0 && !istFeiertag(t)

/** Frist: 2 Zähltage nach dem Tag des Fristbeginns (deutsche Zeit) */
export function fristFuer(beginn) {
  let t = berlinTag(new Date(beginn)), n = 0
  while (n < 2) { t = tagPlus(t, 1); if (zaehlt(t)) n++ }
  return t
}
/** eigener Shop (PrestaShop) – dort wird auf die Zahlung gewartet (wie Werkstatt _geteilt/kanal.ts istEigenerShop) */
export const istEigenerShop = (kanal) => /eigen|presta/i.test(String(kanal ?? ''))

/**
 * Einordnung einer offenen Bestellung: 'ueberfaellig' | 'heute' | 'spaeter' | 'zahlung' (eigener Shop, noch nicht bezahlt).
 * bezahlt fehlt ganz (undefined), solange jarvis-lage das Zahlungsdatum nicht liefert – dann gilt der Bestelltag.
 */
export function einordnen(b, jetzt) {
  let beginn = b.am
  if (istEigenerShop(b.kanal) && b.bezahlt !== undefined) {
    if (!b.bezahlt) return { gruppe: 'zahlung', frist: '' }
    if (b.bezahlt > b.am) beginn = b.bezahlt
  }
  if (!beginn || !Number.isFinite(new Date(beginn).getTime())) return { gruppe: 'spaeter', frist: '' }
  const frist = fristFuer(beginn), heute = berlinTag(jetzt)
  return { gruppe: frist < heute ? 'ueberfaellig' : frist === heute ? 'heute' : 'spaeter', frist }
}

/** nächster DHL-Abholtag (Mo, Mi, Fr; nicht an Feiertagen) ab heute, heute eingeschlossen */
export function naechsteAbholung(jetzt) {
  let t = berlinTag(jetzt)
  for (let i = 0; i < 14; i++) { if ([1, 3, 5].includes(wochentag(t)) && !istFeiertag(t)) return t; t = tagPlus(t, 1) }
  return t
}

const WT = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA']
/** „DI 17.11.“ */
export const tagKurz = (t) => (t ? `${WT[wochentag(t)]} ${t.slice(8, 10)}.${t.slice(5, 7)}.` : '')
