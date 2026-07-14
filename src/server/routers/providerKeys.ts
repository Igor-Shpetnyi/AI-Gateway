import crypto from 'crypto'
import { z } from 'zod'
import { router, adminProcedure } from '../trpc'
import { sql } from '@/lib/db'
import { encryptSecret, decryptSecret, maskSecret } from '@/lib/crypto'
import { providers as adapterRegistry } from '@/lib/providers'
import { createOpenAICompatibleAdapter } from '@/lib/providers/openai-compatible'

export const providerKeysRouter = router({
  listForProvider: adminProcedure
    .input(z.object({ providerId: z.string() }))
    .query(async ({ input }) => {
      const rows = await sql<
        {
          id: string
          label: string | null
          key_encrypted: string
          is_active: boolean
          requests_per_minute: number | null
          requests_per_day: number | null
          created_at: Date
          status: string
          circuit_breaker_until: Date | null
          requests_today: number
        }[]
      >`
        SELECT
          k.id, k.label, k.key_encrypted, k.is_active, k.requests_per_minute, k.requests_per_day, k.created_at,
          k.status, k.circuit_breaker_until,
          COALESCE(l.requests_today, 0)::int AS requests_today
        FROM provider_api_keys k
        LEFT JOIN (
          SELECT provider_key_id, COUNT(*) AS requests_today
          FROM request_logs
          WHERE status = 'success' AND created_at >= CURRENT_DATE AND created_at < CURRENT_DATE + INTERVAL '1 day'
          GROUP BY provider_key_id
        ) l ON l.provider_key_id = k.id
        WHERE k.provider_id = ${input.providerId}
        ORDER BY k.created_at
      `

      return rows.map((row) => ({
        id: row.id,
        label: row.label,
        isActive: row.is_active,
        requestsPerMinute: row.requests_per_minute,
        requestsPerDay: row.requests_per_day,
        createdAt: row.created_at,
        maskedKey: maskSecret(decryptSecret(row.key_encrypted)),
        status: row.status,
        circuitBreakerUntil: row.circuit_breaker_until,
        requestsToday: row.requests_today,
      }))
    }),

  resetCircuitBreaker: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await sql`
        UPDATE provider_api_keys SET status = 'healthy', circuit_breaker_until = NULL WHERE id = ${input.id}
      `
    }),

  test: adminProcedure
    .input(z.object({ providerId: z.string(), key: z.string().min(1) }))
    .mutation(async ({ input }): Promise<{ ok: true; modelCount: number } | { ok: false; error: string }> => {
      const [row] = await sql<{ name: string; base_url: string }[]>`
        SELECT name, base_url FROM providers WHERE id = ${input.providerId}
      `
      if (!row) return { ok: false, error: 'Unknown provider' }

      const adapter =
        adapterRegistry[input.providerId] ?? createOpenAICompatibleAdapter(input.providerId, row.name, row.base_url)

      try {
        const models = await adapter.listModels(input.key)
        return { ok: true, modelCount: models.length }
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) }
      }
    }),

  add: adminProcedure
    .input(
      z.object({
        providerId: z.string(),
        label: z.string().max(100).optional(),
        key: z.string().min(1),
        requestsPerMinute: z.number().int().positive().optional(),
        requestsPerDay: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = crypto.randomUUID()
      await sql`
        INSERT INTO provider_api_keys (id, provider_id, label, key_encrypted, is_active, requests_per_minute, requests_per_day)
        VALUES (
          ${id}, ${input.providerId}, ${input.label ?? null}, ${encryptSecret(input.key)}, true,
          ${input.requestsPerMinute ?? null}, ${input.requestsPerDay ?? null}
        )
      `
      return { id }
    }),

  setActive: adminProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      await sql`UPDATE provider_api_keys SET is_active = ${input.isActive} WHERE id = ${input.id}`
    }),

  // null clears an override, falling back to the provider's default
  updateLimits: adminProcedure
    .input(
      z.object({
        id: z.string(),
        requestsPerMinute: z.number().int().positive().nullable(),
        requestsPerDay: z.number().int().positive().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      await sql`
        UPDATE provider_api_keys
        SET requests_per_minute = ${input.requestsPerMinute}, requests_per_day = ${input.requestsPerDay}
        WHERE id = ${input.id}
      `
    }),

  remove: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await sql`DELETE FROM provider_api_keys WHERE id = ${input.id}`
    }),
})
