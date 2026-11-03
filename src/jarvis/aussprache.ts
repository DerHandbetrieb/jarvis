// Jarvis – Aussprache (Wunsch Auftraggeber 03.11.2026: englische Wörter sauber aussprechen, „Sir“ nicht „sier“).
// Die deutsche Piper-Stimme liest alles deutsch – darum vor dem Vorlesen englische Begriffe in deutsche Lautschrift
// umschreiben. Die Liste lässt sich in den Einstellungen ergänzen (eigene Einträge gewinnen). Getestet in aussprache.test.ts.

/** Wort (Groß/klein egal, ganzes Wort) → so schreiben, dass die deutsche Stimme es richtig ausspricht */
export const AUSSPRACHE: Record<string, string> = {
  'sir': 'Sörr',
  'jarvis': 'Dschahrwis',
  'amazon': 'Ämmasonn',
  'etsy': 'Ettsi',
  'billbee': 'Billbie',
  'prestashop': 'Presta-Schopp',
  'shop': 'Schopp',
  'shops': 'Schopps',
  'online': 'Onlein',
  'to-do': 'Tudu',
  'to-dos': 'Tudus',
  'update': 'Apdejt',
  'updates': 'Apdejts',
  'upload': 'Applohd',
  'keyword': 'Kiwörd',
  'keywords': 'Kiwörds',
  'highlight': 'Hailait',
  'highlights': 'Hailaits',
  'listing': 'Listing',
  'push': 'Pusch',
  'app': 'Äpp',
  'apps': 'Äpps',
  'whiteboard': 'Waitbord',
  'marketing': 'Marketing',
  'workflow': 'Wörkflo',
  'feedback': 'Fiedbäck',
  'team': 'Tiem',
  'okay': 'Okeh',
  'ok': 'Okeh',
  'e-mail': 'Iemehl',
  'e-mails': 'Iemehls',
  'gps': 'Ge-Pe-Es',
  'gpsr': 'Ge-Pe-Es-Er',
  'sku': 'Es-Ka-U',
  'asin': 'Ehsin',
  'led': 'El-E-De',
  'usb': 'U-Es-Be',
  'labrador': 'Labrador',
}

/** Text so umschreiben, dass die Stimme englische Begriffe richtig ausspricht */
export function fuerStimme(text: string, eigene: Record<string, string> = {}): string {
  const liste: Record<string, string> = { ...AUSSPRACHE }
  for (const [k, v] of Object.entries(eigene)) if (k.trim() && v.trim()) liste[k.trim().toLowerCase()] = v.trim()
  // Wortgrenzen über Buchstaben (auch Umlaute) und Bindestrich, damit „Shop“ nicht in „Shopping“ ersetzt wird
  return text.replace(/[A-Za-zÄÖÜäöüß]+(?:-[A-Za-zÄÖÜäöüß]+)*/g, (wort) => {
    const ersatz = liste[wort.toLowerCase()]
    return ersatz ?? wort
  })
}

/** eigene Einträge aus einer Textliste „Wort = Aussprache“ (eine Zeile je Eintrag) */
export function leseEigene(text: string): Record<string, string> {
  const aus: Record<string, string> = {}
  for (const zeile of text.split(/\r?\n/)) {
    const m = zeile.match(/^\s*([^=]+?)\s*=\s*(.+?)\s*$/)
    if (m) aus[m[1].toLowerCase()] = m[2]
  }
  return aus
}
