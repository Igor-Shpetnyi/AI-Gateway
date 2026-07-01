import { sql } from './db'
import { GatewayError } from './errors'

export async function checkQuota(projectId: string, dailyQuota: number | null): Promise<void> {
  if (dailyQuota === null) return

  const rows = await sql<[{ count: string }]>`
    SELECT COUNT(*)::text AS count
    FROM request_logs
    WHERE project_id = ${projectId}
      AND status = 'success'
      AND created_at >= CURRENT_DATE
      AND created_at < CURRENT_DATE + INTERVAL '1 day'
  `

  const usedToday = parseInt(rows[0].count, 10)
  if (usedToday >= dailyQuota) {
    throw new GatewayError(
      'QUOTA_EXCEEDED',
      `Daily quota of ${dailyQuota} requests exceeded`,
      429
    )
  }
}
