'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { useI18n } from '../../i18n/LanguageProvider'
import { requestStatusLabel } from '../../i18n/helpers'

const STATUS_STYLES: Record<string, string> = {
  success: 'bg-success/15 text-success',
  cached: 'bg-accent/15 text-accent',
  error: 'bg-danger/15 text-danger',
  rate_limited: 'bg-warning/15 text-warning',
  fallback: 'bg-warning/15 text-warning',
}

const REQUEST_STATUSES = ['success', 'cached', 'error', 'rate_limited', 'fallback'] as const

const selectClass =
  'rounded-full border border-surface-border bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent'

export default function LogsPage() {
  const { t } = useI18n()
  const [projectId, setProjectId] = useState('')
  const [providerId, setProviderId] = useState('')
  const [status, setStatus] = useState('')
  const [cursor, setCursor] = useState(0)

  const { data: filterOptions } = trpc.logs.filterOptions.useQuery()
  const { data, isLoading, isFetching } = trpc.logs.list.useQuery({
    cursor,
    projectId: projectId || undefined,
    providerId: providerId || undefined,
    status: status || undefined,
  })

  function resetAndSet(setter: (v: string) => void) {
    return (value: string) => {
      setter(value)
      setCursor(0)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.logs.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.logs.subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={projectId} onChange={(e) => resetAndSet(setProjectId)(e.target.value)} className={selectClass}>
            <option value="">{t.logs.filterAllProjects}</option>
            {filterOptions?.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select value={providerId} onChange={(e) => resetAndSet(setProviderId)(e.target.value)} className={selectClass}>
            <option value="">{t.logs.filterAllProviders}</option>
            {filterOptions?.providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => resetAndSet(setStatus)(e.target.value)} className={selectClass}>
            <option value="">{t.logs.filterAllStatuses}</option>
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {requestStatusLabel(t, s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
        {isLoading ? (
          <p className="p-5 text-sm text-muted">{t.common.loading}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="px-5 py-3 font-medium">{t.logs.colTime}</th>
                <th className="px-5 py-3 font-medium">{t.logs.colProject}</th>
                <th className="px-5 py-3 font-medium">{t.logs.colProvider}</th>
                <th className="px-5 py-3 font-medium">{t.logs.colModel}</th>
                <th className="px-5 py-3 font-medium">{t.logs.colStatus}</th>
                <th className="px-5 py-3 font-medium">{t.logs.colTokens}</th>
                <th className="px-5 py-3 font-medium">{t.logs.colLatency}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {data?.rows.map((log) => (
                <tr key={log.id}>
                  <td className="px-5 py-3 text-muted">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-5 py-3">{log.project_name ?? '—'}</td>
                  <td className="px-5 py-3">{log.provider_name ?? '—'}</td>
                  <td className="px-5 py-3">{log.model}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[log.status] ?? ''}`}>
                      {requestStatusLabel(t, log.status)}
                    </span>
                    {log.error_message && (
                      <div className="mt-1 max-w-xs truncate text-xs text-danger" title={log.error_message}>
                        {log.error_message}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {log.prompt_tokens}+{log.completion_tokens}
                  </td>
                  <td className="px-5 py-3 text-muted">{log.latency_ms}ms</td>
                </tr>
              ))}
              {data?.rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-muted">
                    {t.logs.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={cursor === 0}
          onClick={() => setCursor(Math.max(0, cursor - 50))}
          className="rounded-lg border border-surface-border px-3 py-1.5 text-sm text-foreground disabled:opacity-40"
        >
          {t.common.previous}
        </button>
        <button
          type="button"
          disabled={data?.nextCursor == null}
          onClick={() => data?.nextCursor != null && setCursor(data.nextCursor)}
          className="rounded-lg border border-surface-border px-3 py-1.5 text-sm text-foreground disabled:opacity-40"
        >
          {isFetching ? t.common.loading : t.common.next}
        </button>
      </div>
    </div>
  )
}
