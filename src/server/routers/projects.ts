import crypto from 'crypto'
import { z } from 'zod'
import { router, adminProcedure } from '../trpc'
import { sql } from '@/lib/db'

export const projectsRouter = router({
  list: adminProcedure.query(async () => {
    return sql<
      {
        id: string
        name: string
        is_active: boolean
        daily_quota: number | null
        monthly_quota: number | null
        created_at: Date
        allowed_models: string[] | null
        allowed_ips: string[] | null
      }[]
    >`
      SELECT id, name, is_active, daily_quota, monthly_quota, created_at, allowed_models, allowed_ips
      FROM projects
      WHERE is_system = false
      ORDER BY created_at DESC
    `
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        dailyQuota: z.number().int().positive().nullable().optional(),
        monthlyQuota: z.number().int().positive().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const key = `gw_live_${crypto.randomBytes(16).toString('hex')}`
      const keyHash = crypto.createHash('sha256').update(key).digest('hex')
      const id = crypto.randomUUID()

      await sql`
        INSERT INTO projects (id, name, api_key_hash, is_active, daily_quota, monthly_quota)
        VALUES (${id}, ${input.name}, ${keyHash}, true, ${input.dailyQuota ?? null}, ${input.monthlyQuota ?? null})
      `

      return { id, apiKey: key }
    }),

  setActive: adminProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      await sql`UPDATE projects SET is_active = ${input.isActive} WHERE id = ${input.id}`
    }),

  updateQuota: adminProcedure
    .input(
      z.object({
        id: z.string(),
        dailyQuota: z.number().int().positive().nullable(),
        monthlyQuota: z.number().int().positive().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      await sql`
        UPDATE projects
        SET daily_quota = ${input.dailyQuota}, monthly_quota = ${input.monthlyQuota}
        WHERE id = ${input.id}
      `
    }),

  // null = unrestricted for that dimension
  updateRestrictions: adminProcedure
    .input(
      z.object({
        id: z.string(),
        allowedModels: z.array(z.string()).nullable(),
        allowedIps: z.array(z.string()).nullable(),
      })
    )
    .mutation(async ({ input }) => {
      // postgres.js JSON-encodes the parameter itself once it sees a jsonb-cast
      // position — passing an already-JSON.stringify()'d string here would
      // double-encode it into a jsonb *string* instead of a jsonb *array*.
      await sql`
        UPDATE projects
        SET allowed_models = ${sql.json(input.allowedModels)}, allowed_ips = ${sql.json(input.allowedIps)}
        WHERE id = ${input.id}
      `
    }),
})
