import crypto from 'crypto'
import { z } from 'zod'
import { router, adminProcedure } from '../trpc'
import { sql } from '@/lib/db'
import { encryptSecret, decryptSecret, maskSecret } from '@/lib/crypto'

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
          created_at: Date
        }[]
      >`
        SELECT id, label, key_encrypted, is_active, requests_per_minute, created_at
        FROM provider_api_keys
        WHERE provider_id = ${input.providerId}
        ORDER BY created_at
      `

      return rows.map((row) => ({
        id: row.id,
        label: row.label,
        isActive: row.is_active,
        requestsPerMinute: row.requests_per_minute,
        createdAt: row.created_at,
        maskedKey: maskSecret(decryptSecret(row.key_encrypted)),
      }))
    }),

  add: adminProcedure
    .input(
      z.object({
        providerId: z.string(),
        label: z.string().max(100).optional(),
        key: z.string().min(1),
        requestsPerMinute: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = crypto.randomUUID()
      await sql`
        INSERT INTO provider_api_keys (id, provider_id, label, key_encrypted, is_active, requests_per_minute)
        VALUES (${id}, ${input.providerId}, ${input.label ?? null}, ${encryptSecret(input.key)}, true, ${input.requestsPerMinute ?? null})
      `
      return { id }
    }),

  setActive: adminProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      await sql`UPDATE provider_api_keys SET is_active = ${input.isActive} WHERE id = ${input.id}`
    }),

  // requestsPerMinute: null clears the override, falling back to the provider's default
  updateLimit: adminProcedure
    .input(z.object({ id: z.string(), requestsPerMinute: z.number().int().positive().nullable() }))
    .mutation(async ({ input }) => {
      await sql`UPDATE provider_api_keys SET requests_per_minute = ${input.requestsPerMinute} WHERE id = ${input.id}`
    }),

  remove: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await sql`DELETE FROM provider_api_keys WHERE id = ${input.id}`
    }),
})
