import { sql } from './db'

const FAILURE_THRESHOLD = 3
const RECOVERY_MS = 5 * 60 * 1000 // 5 minutes

// In-memory consecutive failure counters (reset on process restart)
const failureCounters = new Map<string, number>()

export async function isCircuitOpen(providerId: string): Promise<boolean> {
  const rows = await sql<{ circuit_breaker_until: Date | null }[]>`
    SELECT circuit_breaker_until FROM providers WHERE id = ${providerId}
  `
  const until = rows[0]?.circuit_breaker_until
  return !!(until && new Date(until) > new Date())
}

export async function onProviderSuccess(providerId: string): Promise<void> {
  if ((failureCounters.get(providerId) ?? 0) === 0) return

  failureCounters.set(providerId, 0)
  await sql`
    UPDATE providers
    SET status = 'healthy', circuit_breaker_until = NULL
    WHERE id = ${providerId} AND status != 'healthy'
  `
}

export async function onProviderFailure(providerId: string): Promise<void> {
  const count = (failureCounters.get(providerId) ?? 0) + 1
  failureCounters.set(providerId, count)

  if (count >= FAILURE_THRESHOLD) {
    const until = new Date(Date.now() + RECOVERY_MS)
    await sql`
      UPDATE providers
      SET status = 'down', circuit_breaker_until = ${until.toISOString()}
      WHERE id = ${providerId}
    `
    failureCounters.set(providerId, 0)
    console.warn(
      `[CircuitBreaker] ${providerId} tripped — down until ${until.toISOString()}`
    )
  } else if (count > 1) {
    await sql`
      UPDATE providers SET status = 'degraded'
      WHERE id = ${providerId} AND status = 'healthy'
    `
  }
}
