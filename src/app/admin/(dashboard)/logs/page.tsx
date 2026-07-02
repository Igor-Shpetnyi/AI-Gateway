'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'

const STATUS_STYLES: Record<string, string> = {
  success: 'bg-green-500/15 text-green-600 dark:text-green-400',
  cached: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  error: 'bg-red-500/15 text-red-600 dark:text-red-400',
  rate_limited: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  fallback: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
}

export default function LogsPage() {
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
      <h1 className="text-xl font-semibold">Logs</h1>

      <div className="flex flex-wrap gap-3">
        <select
          value={projectId}
          onChange={(e) => resetAndSet(setProjectId)(e.target.value)}
          className="rounded border border-black/20 dark:border-white/20 bg-transparent px-2 py-1 text-sm"
        >
          <option value="">All projects</option>
          {filterOptions?.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={providerId}
          onChange={(e) => resetAndSet(setProviderId)(e.target.value)}
          className="rounded border border-black/20 dark:border-white/20 bg-transparent px-2 py-1 text-sm"
        >
          <option value="">All providers</option>
          {filterOptions?.providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => resetAndSet(setStatus)(e.target.value)}
          className="rounded border border-black/20 dark:border-white/20 bg-transparent px-2 py-1 text-sm"
        >
          <option value="">All statuses</option>
          <option value="success">success</option>
          <option value="cached">cached</option>
          <option value="error">error</option>
          <option value="rate_limited">rate_limited</option>
          <option value="fallback">fallback</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-black/60 dark:text-white/60">Loading…</p>
      ) : (
        <>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10 text-left">
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Project</th>
                <th className="py-2 pr-4">Provider</th>
                <th className="py-2 pr-4">Model</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Tokens</th>
                <th className="py-2 pr-4">Latency</th>
              </tr>
            </thead>
            <tbody>
              {data?.rows.map((log) => (
                <tr key={log.id} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-2 pr-4 text-black/60 dark:text-white/60">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">{log.project_name ?? '—'}</td>
                  <td className="py-2 pr-4">{log.provider_name ?? '—'}</td>
                  <td className="py-2 pr-4">{log.model}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded px-2 py-0.5 text-xs ${STATUS_STYLES[log.status] ?? ''}`}>
                      {log.status}
                    </span>
                    {log.error_message && (
                      <div className="mt-1 max-w-xs truncate text-xs text-red-500" title={log.error_message}>
                        {log.error_message}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {log.prompt_tokens}+{log.completion_tokens}
                  </td>
                  <td className="py-2 pr-4">{log.latency_ms}ms</td>
                </tr>
              ))}
              {data?.rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-black/60 dark:text-white/60">
                    No logs match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={cursor === 0}
              onClick={() => setCursor(Math.max(0, cursor - 50))}
              className="rounded border border-black/20 dark:border-white/20 px-3 py-1 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={data?.nextCursor == null}
              onClick={() => data?.nextCursor != null && setCursor(data.nextCursor)}
              className="rounded border border-black/20 dark:border-white/20 px-3 py-1 text-sm disabled:opacity-40"
            >
              {isFetching ? 'Loading…' : 'Next'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
