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
        is_active: boolean
        priority: number
        requests_per_minute: number
        requests_per_day: number
        status: string
        circuit_breaker_until: Date | null
      }[]
    >`
      SELECT id, name, is_active, priority, requests_per_minute, requests_per_day, status, circuit_breaker_until
      FROM providers
      ORDER BY priority
    `

    return rows.map((row) => ({
      ...row,
      isConfigured: adapterRegistry[row.id]?.isConfigured() ?? false,
    }))
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
