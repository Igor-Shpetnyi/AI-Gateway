import { z } from 'zod'
import { router, adminProcedure } from '../trpc'
import { sql } from '@/lib/db'

const PAGE_SIZE = 50

export const logsRouter = router({
  list: adminProcedure
    .input(
      z.object({
        cursor: z.number().int().min(0).default(0),
        projectId: z.string().optional(),
        providerId: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const rows = await sql<
        {
          id: string
          model: string
          prompt_tokens: number
          completion_tokens: number
          latency_ms: number
          status: string
          error_message: string | null
          cache_hit: boolean
          created_at: Date
          project_name: string | null
          provider_name: string | null
        }[]
      >`
        SELECT
          rl.id, rl.model, rl.prompt_tokens, rl.completion_tokens, rl.latency_ms,
          rl.status, rl.error_message, rl.cache_hit, rl.created_at,
          p.name AS project_name, pr.name AS provider_name
        FROM request_logs rl
        LEFT JOIN projects p ON p.id = rl.project_id
        LEFT JOIN providers pr ON pr.id = rl.provider_id
        WHERE (${input.projectId ?? null}::text IS NULL OR rl.project_id = ${input.projectId ?? null})
          AND (${input.providerId ?? null}::text IS NULL OR rl.provider_id = ${input.providerId ?? null})
          AND (${input.status ?? null}::text IS NULL OR rl.status = ${input.status ?? null})
        ORDER BY rl.created_at DESC
        LIMIT ${PAGE_SIZE} OFFSET ${input.cursor}
      `

      return {
        rows,
        nextCursor: rows.length === PAGE_SIZE ? input.cursor + PAGE_SIZE : null,
      }
    }),

  filterOptions: adminProcedure.query(async () => {
    const [projects, providers] = await Promise.all([
      sql<{ id: string; name: string }[]>`SELECT id, name FROM projects ORDER BY name`,
      sql<{ id: string; name: string }[]>`SELECT id, name FROM providers ORDER BY name`,
    ])
    return { projects, providers }
  }),
})
