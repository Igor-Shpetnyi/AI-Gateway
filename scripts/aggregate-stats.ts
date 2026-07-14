import postgres from 'postgres'

// Raw per-request rows older than this are summarized into daily_stats and
// no longer needed individually.
const RETENTION_DAYS = 30

async function aggregateStats() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const sql = postgres(url)
  try {
    // Aggregate every completed day (created_at < today) that has request_logs —
    // not just "yesterday" — so a missed run (downtime, first run, etc.) is
    // caught up automatically. ON CONFLICT makes re-running always safe.
    // provider_id/model are excluded when NULL (deleted provider, or a request
    // that errored before a model was resolved) since daily_stats' primary key
    // requires all four columns non-null.
    const { count: aggregated } = await sql`
      INSERT INTO daily_stats (date, project_id, provider_id, model, total_requests, cache_hits, total_tokens, avg_latency_ms, error_count)
      SELECT
        created_at::date AS date,
        project_id,
        provider_id,
        model,
        COUNT(*)::int AS total_requests,
        COUNT(*) FILTER (WHERE status = 'cached')::int AS cache_hits,
        COALESCE(SUM(prompt_tokens + completion_tokens), 0)::int AS total_tokens,
        COALESCE(AVG(latency_ms), 0)::int AS avg_latency_ms,
        COUNT(*) FILTER (WHERE status = 'error')::int AS error_count
      FROM request_logs
      WHERE provider_id IS NOT NULL
        AND model IS NOT NULL
        AND created_at < CURRENT_DATE
      GROUP BY 1, 2, 3, 4
      ON CONFLICT (date, project_id, provider_id, model) DO UPDATE SET
        total_requests = EXCLUDED.total_requests,
        cache_hits = EXCLUDED.cache_hits,
        total_tokens = EXCLUDED.total_tokens,
        avg_latency_ms = EXCLUDED.avg_latency_ms,
        error_count = EXCLUDED.error_count
    `
    console.log(`✓ Aggregated ${aggregated} daily_stats row(s)`)

    const { count: deletedLogs } = await sql`
      DELETE FROM request_logs WHERE created_at < now() - ${RETENTION_DAYS} * interval '1 day'
    `
    console.log(`✓ Pruned ${deletedLogs} request_logs row(s) older than ${RETENTION_DAYS} days`)

    const { count: deletedCache } = await sql`
      DELETE FROM response_cache WHERE expires_at <= now()
    `
    console.log(`✓ Pruned ${deletedCache} expired response_cache row(s)`)
  } finally {
    await sql.end()
  }
}

aggregateStats().catch((err) => {
  console.error('Stats aggregation failed:', err.message)
  process.exit(1)
})
