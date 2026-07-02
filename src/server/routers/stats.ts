import { router, adminProcedure } from '../trpc'
import { sql } from '@/lib/db'

export const statsRouter = router({
  summary: adminProcedure.query(async () => {
    const [[todayStats], [projectStats], providerHealth] = await Promise.all([
      sql<{ total: string; cache_hits: string; errors: string }[]>`
        SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE status = 'cached')::text AS cache_hits,
          COUNT(*) FILTER (WHERE status = 'error')::text AS errors
        FROM request_logs
        WHERE created_at >= CURRENT_DATE AND created_at < CURRENT_DATE + INTERVAL '1 day'
      `,
      sql<{ active: string; total: string }[]>`
        SELECT
          COUNT(*) FILTER (WHERE is_active)::text AS active,
          COUNT(*)::text AS total
        FROM projects
      `,
      sql<{ id: string; name: string; status: string; is_active: boolean }[]>`
        SELECT id, name, status, is_active FROM providers ORDER BY priority
      `,
    ])

    const total = Number(todayStats.total)
    const cacheHits = Number(todayStats.cache_hits)

    return {
      requestsToday: total,
      cacheHitRate: total > 0 ? cacheHits / total : 0,
      errorsToday: Number(todayStats.errors),
      activeProjects: Number(projectStats.active),
      totalProjects: Number(projectStats.total),
      providerHealth,
    }
  }),
})
