import crypto from 'crypto'
import { z } from 'zod'
import { router, adminProcedure } from '../trpc'
import { sql } from '@/lib/db'
import { providers as adapterRegistry } from '@/lib/providers'

export const providersRouter = router({
  list: adminProcedure.query(async () => {
    const rows = await sql<
      {
        id: string
        name: string
        base_url: string
        is_active: boolean
        priority: number
        requests_per_minute: number
        requests_per_day: number
        status: string
        circuit_breaker_until: Date | null
        active_key_count: string
      }[]
    >`
      SELECT
        p.id, p.name, p.base_url, p.is_active, p.priority, p.requests_per_minute, p.requests_per_day,
        p.status, p.circuit_breaker_until,
        COUNT(k.id) FILTER (WHERE k.is_active)::text AS active_key_count
      FROM providers p
      LEFT JOIN provider_api_keys k ON k.provider_id = p.id
      GROUP BY p.id
      ORDER BY p.priority
    `

    return rows.map((row) => {
      const activeKeyCount = Number(row.active_key_count)
      return {
        ...row,
        activeKeyCount,
        isCustom: !(row.id in adapterRegistry),
        isConfigured: (adapterRegistry[row.id]?.isConfigured() ?? false) || activeKeyCount > 0,
      }
    })
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        baseUrl: z.string().url(),
        priority: z.number().int(),
        requestsPerMinute: z.number().int().positive(),
        requestsPerDay: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      const id = crypto.randomUUID()
      await sql`
        INSERT INTO providers (id, name, base_url, is_active, priority, requests_per_minute, requests_per_day, status)
        VALUES (${id}, ${input.name}, ${input.baseUrl}, true, ${input.priority}, ${input.requestsPerMinute}, ${input.requestsPerDay}, 'healthy')
      `
      return { id }
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean(),
        priority: z.number().int(),
        requestsPerMinute: z.number().int().positive(),
        requestsPerDay: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      await sql`
        UPDATE providers
        SET is_active = ${input.isActive},
            priority = ${input.priority},
            requests_per_minute = ${input.requestsPerMinute},
            requests_per_day = ${input.requestsPerDay}
        WHERE id = ${input.id}
      `
    }),

  resetCircuitBreaker: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await sql`
        UPDATE providers SET status = 'healthy', circuit_breaker_until = NULL WHERE id = ${input.id}
      `
    }),
})
