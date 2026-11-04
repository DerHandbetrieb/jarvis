// Monatliche Prüfung des Sprachmodells (Wunsch Auftraggeber 04.11.2026: „regelmäßig prüfen, ob es neuere Modelle gibt“).
// Vergleicht den Fingerabdruck des installierten Modells (Ollama GET /api/tags, „digest“) mit der aktuellen Fassung im
// offiziellen Ollama-Verzeichnis (registry.ollama.ai, Manifest; dessen SHA-256 = digest – am 04.11.2026 für qwen3:8b
// nachgeprüft). Ein anderes, „klügeres“ Modell wählt Loki nie selbst: das braucht eine Lizenz- und Deutsch-Prüfung.
const crypto = require('node:crypto')

/** „qwen3:8b“ → { pfad: 'library/qwen3', tag: '8b' }; „nutzer/name:tag“ → { pfad: 'nutzer/name', tag } */
function zerlege(modell) {
  const m = /^([a-z0-9._-]+(?:\/[a-z0-9._-]+)?)(?::([a-z0-9._-]+))?$/i.exec(String(modell ?? '').trim())
  if (!m) return null
  return { pfad: m[1].includes('/') ? m[1] : `library/${m[1]}`, tag: m[2] || 'latest' }
}

/**
 * → { stand: 'aktuell' | 'neuer' | 'fehlt' | 'unbekannt', text }
 * holen: fetch (für Tests ersetzbar)
 */
async function pruefeModell(modell, { holen = fetch } = {}) {
  const z = zerlege(modell)
  if (!z) return { stand: 'unbekannt', text: 'Modellname nicht lesbar.' }
  let lokal
  try {
    const r = await holen('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(5000) })
    const name = modell.includes(':') ? modell : `${modell}:latest`
    lokal = (await r.json())?.models?.find((m) => m?.name === name)?.digest
  } catch { return { stand: 'unbekannt', text: 'Ollama läuft gerade nicht.' } }
  if (!lokal) return { stand: 'fehlt', text: `${modell} ist nicht installiert.` }
  try {
    const r = await holen(`https://registry.ollama.ai/v2/${z.pfad}/manifests/${z.tag}`, {
      headers: { Accept: 'application/vnd.docker.distribution.manifest.v2+json' }, signal: AbortSignal.timeout(15_000),
    })
    if (!r.ok) return { stand: 'unbekannt', text: `Ollama-Verzeichnis antwortet mit ${r.status}.` }
    const entfernt = crypto.createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex')
    return entfernt === lokal ? { stand: 'aktuell', text: `${modell} ist auf dem neuesten Stand.` } : { stand: 'neuer', text: `Für ${modell} gibt es eine neuere Fassung.` }
  } catch { return { stand: 'unbekannt', text: 'Ollama-Verzeichnis nicht erreichbar.' } }
}

module.exports = { pruefeModell, zerlege }
