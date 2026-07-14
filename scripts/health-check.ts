import postgres from 'postgres'
import { providers as adapterRegistry } from '../src/lib/providers'
import { createOpenAICompatibleAdapter } from '../src/lib/providers/openai-compatible'
import { decryptSecret } from '../src/lib/crypto'

// Mirrors circuit-breaker.ts's recovery window — a health-check failure trips
// the same circuit that real traffic failures do, so router.ts skips a
// provider that's known-down before a real user request ever has to fail.
const RECOVERY_MS = 5 * 60 * 1000

async function healthCheck() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const sql = postgres(url)
  try {
    const providerRows = await sql<{ id: string; name: string; base_url: string }[]>`
      SELECT id, name, base_url FROM providers WHERE is_active = true
    `

    for (const p of providerRows) {
      const [key] = await sql<{ key_encrypted: string }[]>`
        SELECT key_encrypted FROM provider_api_keys
        WHERE provider_id = ${p.id} AND is_active = true
        ORDER BY created_at LIMIT 1
      `

      if (!key) {
        console.log(`- ${p.id}: no active API key, skipped`)
        continue
      }

      const adapter = adapterRegistry[p.id] ?? createOpenAICompatibleAdapter(p.id, p.name, p.base_url)

      try {
        await adapter.listModels(decryptSecret(key.key_encrypted))
        // Don't clear an in-progress circuit-breaker cooldown early — only
        // mark healthy if nothing else currently has this provider tripped.
        await sql`
          UPDATE providers SET status = 'healthy', circuit_breaker_until = NULL
          WHERE id = ${p.id} AND (circuit_breaker_until IS NULL OR circuit_breaker_until <= now())
        `
        console.log(`✓ ${p.id}: healthy`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        const until = new Date(Date.now() + RECOVERY_MS)
        await sql`
          UPDATE providers SET status = 'down', circuit_breaker_until = ${until.toISOString()}
          WHERE id = ${p.id}
        `
        console.warn(`✗ ${p.id}: unreachable — ${message}`)
      }
    }
  } finally {
    await sql.end()
  }
}

healthCheck().catch((err) => {
  console.error('Health check failed:', err.message)
  process.exit(1)
})
