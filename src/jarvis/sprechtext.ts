// Vorlesen wie ein Mensch (Wunsch Auftraggeber 06.11.2026): lange Nummern bringen beim Zuhören nichts – weg damit, überall.
// Pausen zwischen den Kapiteln der Morgen-Lage: PAUSE als eigener „Satz“, sprechen() in dienst.ts macht daraus Stille.

export const PAUSE = '\u0000pause'
/** Stille zwischen Kapiteln bzw. zwischen zwei Sätzen (Millisekunden) */
export const PAUSE_KAPITEL_MS = 1300
export const PAUSE_SATZ_MS = 280

const VOR_NUMMER = /\b(fall|fallnummer|fall-nr|fallnr|case|case id|ticket|ticketnummer|vorgang|vorgangsnummer|bestellnummer|bestell-nr|auftragsnummer|rechnungsnummer|sendungsnummer|nummer|nr|id|asin|sku|ean)\b\.?\s*[:#]?\s*$/i

/** Lange Ziffernfolgen (ab 6 Ziffern, auch mit Bindestrichen wie 306-1234567-1234567) und ASINs entfernen, samt „Fall“ davor */
export function ohneLangeNummern(text: string): string {
  let t = text.replace(/#?\b\d[\d-]*\d\b|\bB0[A-Z0-9]{8}\b/g, (m, pos: number, ganz: string) => {
    const ziffern = m.replace(/\D/g, '').length
    if (ziffern < 6 && !/^B0/.test(m)) return m // Stückzahlen, Beträge, Jahreszahlen bleiben
    if (/^\d{4}-\d{2}(-\d{2})?$|^\d{4}-\d{4}$/.test(m)) return m // Datum, Jahresspanne
    return /^(,\d{1,2})?\s*(euro|€)/i.test(ganz.slice(pos + m.length, pos + m.length + 12)) ? m : '\u0001'
  })
  if (!t.includes('\u0001')) return text
  // Wort direkt davor („Fall“, „Nr.“) gehört zur Nummer
  t = t.split('\u0001').reduce((a, b) => `${a.replace(VOR_NUMMER, '').replace(VOR_NUMMER, '')}${b}`) // zweimal: „Fall Nr.“
  return t.replace(/\(\s*\)|\[\s*\]/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/^[\s,.;:–-]+/, '').replace(/[\s:–-]+$/, '').replace(/([,;:–-])\s*(?=[,;:.])/g, '').replace(/\s{2,}/g, ' ').trim()
}

/** „Amazon-Problem: Fall 1234567890 Wandregal Eiche“ → „Wandregal Eiche“ (leer, wenn nichts übrig bleibt) */
export const amazonArtikel = (titel: string) => ohneLangeNummern(titel.replace(/^\s*(neues\s+)?amazon[- ]problem\s*:?\s*/i, '')).replace(/^(fall|case)\b\s*[:–-]?\s*/i, '').trim()
