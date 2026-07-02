'use client'

import { trpc } from '@/lib/trpc'

export default function DashboardPage() {
  const { data, isLoading } = trpc.stats.summary.useQuery()

  if (isLoading || !data) {
    return <p className="text-sm text-black/60 dark:text-white/60">Loading…</p>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Requests today" value={data.requestsToday} />
        <StatCard label="Cache hit rate" value={`${(data.cacheHitRate * 100).toFixed(0)}%`} />
        <StatCard label="Errors today" value={data.errorsToday} />
        <StatCard label="Active projects" value={`${data.activeProjects} / ${data.totalProjects}`} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-black/60 dark:text-white/60">Provider health</h2>
        <ul className="space-y-1 text-sm">
          {data.providerHealth.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  !p.is_active
                    ? 'bg-black/30 dark:bg-white/30'
                    : p.status === 'healthy'
                      ? 'bg-green-500'
                      : p.status === 'degraded'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                }`}
              />
              {p.name} — {!p.is_active ? 'inactive' : p.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-black/10 dark:border-white/10 p-4">
      <div className="text-xs text-black/50 dark:text-white/50">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}
