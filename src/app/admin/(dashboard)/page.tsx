'use client'

import { trpc } from '@/lib/trpc'
import { useI18n } from '../i18n/LanguageProvider'
import { statusLabel } from '../i18n/helpers'

export default function DashboardPage() {
  const { t } = useI18n()
  const { data, isLoading } = trpc.stats.summary.useQuery()

  if (isLoading || !data) {
    return <p className="text-sm text-muted">{t.common.loading}</p>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.dashboard.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t.dashboard.requestsToday} value={data.requestsToday} />
        <StatCard label={t.dashboard.cacheHitRate} value={`${(data.cacheHitRate * 100).toFixed(0)}%`} accent />
        <StatCard label={t.dashboard.errorsToday} value={data.errorsToday} danger={data.errorsToday > 0} />
        <StatCard label={t.dashboard.activeProjects} value={`${data.activeProjects} / ${data.totalProjects}`} />
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-muted">{t.dashboard.providerHealth}</h2>
        <ul className="divide-y divide-surface-border">
          {data.providerHealth.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span
                  className={`h-2 w-2 rounded-full ${
                    !p.is_active
                      ? 'bg-muted'
                      : p.status === 'healthy'
                        ? 'bg-success'
                        : p.status === 'degraded'
                          ? 'bg-warning'
                          : 'bg-danger'
                  }`}
                />
                {p.name}
              </div>
              <span className="text-xs text-muted">
                {!p.is_active ? statusLabel(t, 'inactive') : statusLabel(t, p.status)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
  danger,
}: {
  label: string
  value: string | number
  accent?: boolean
  danger?: boolean
}) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      <div
        className={`mt-2 text-3xl font-bold ${danger ? 'text-danger' : accent ? 'text-accent' : 'text-foreground'}`}
      >
        {value}
      </div>
    </div>
  )
}
