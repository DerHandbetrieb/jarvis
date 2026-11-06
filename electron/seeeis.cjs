// Zugefrorener See im Dauer-HUD (06.11.2026, Wunsch Auftraggeber): friert erst, wenn es mehrere Tage durchgehend Minusgrade
// hatte. Maßstab ist die Tageshöchsttemperatur (aus dem Tagebuch der eigenen Station, wettertage.cjs): liegt sie unter 0 °C,
// war der ganze Tag Frost. Tauen geht langsamer los als Frieren, damit ein milder Mittag das Eis nicht wegnimmt.
const FROST_UNTER = 0, TAUWETTER_AB = 2, HOECHSTENS = 4

/** tageshoechst: älteste zuerst, heute zuletzt. → Eis 0 (keins), 0,5 (vom Ufer her), 1 (ganzer See) */
function eisStufe(tageshoechst) {
  let frosttage = 0
  for (const m of tageshoechst ?? []) {
    if (typeof m !== 'number') continue
    if (m < FROST_UNTER) frosttage = Math.min(HOECHSTENS, frosttage + 1)
    else if (frosttage < 3) frosttage = 0 // nur durchgehender Frost zählt
    else if (m >= TAUWETTER_AB) frosttage = Math.max(0, frosttage - 1.5)
  }
  return frosttage >= 3 ? 1 : frosttage >= 2 ? 0.5 : 0
}

module.exports = { eisStufe }
