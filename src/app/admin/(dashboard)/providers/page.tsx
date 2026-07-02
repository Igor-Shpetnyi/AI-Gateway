'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'

type ProviderRow = {
  id: string
  name: string
  is_active: boolean
  priority: number
  requests_per_minute: number
  requests_per_day: number
  status: string
  circuit_breaker_until: Date | null
  isConfigured: boolean
}

const STATUS_STYLES: Record<string, string> = {
  healthy: 'bg-green-500/15 text-green-600 dark:text-green-400',
  degraded: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  down: 'bg-red-500/15 text-red-600 dark:text-red-400',
}

export default function ProvidersPage() {
  const utils = trpc.useUtils()
  const { data: providers, isLoading } = trpc.providers.list.useQuery()

  const update = trpc.providers.update.useMutation({
    onSuccess: () => utils.providers.list.invalidate(),
  })
  const resetCircuitBreaker = trpc.providers.resetCircuitBreaker.useMutation({
    onSuccess: () => utils.providers.list.invalidate(),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Providers</h1>

      {isLoading ? (
        <p className="text-sm text-black/60 dark:text-white/60">Loading…</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10 text-left">
              <th className="py-2 pr-4">Provider</th>
              <th className="py-2 pr-4">Active</th>
              <th className="py-2 pr-4">Priority</th>
              <th className="py-2 pr-4">Req/min</th>
              <th className="py-2 pr-4">Req/day</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4" />
            </tr>
          </thead>
          <tbody>
            {providers?.map((provider) => (
              <ProviderRowView
                key={provider.id}
                provider={provider}
                onSave={(fields) => update.mutate({ id: provider.id, ...fields })}
                onResetCircuitBreaker={() => resetCircuitBreaker.mutate({ id: provider.id })}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function ProviderRowView({
  provider,
  onSave,
  onResetCircuitBreaker,
}: {
  provider: ProviderRow
  onSave: (fields: {
    isActive: boolean
    priority: number
    requestsPerMinute: number
    requestsPerDay: number
  }) => void
  onResetCircuitBreaker: () => void
}) {
  const [isActive, setIsActive] = useState(provider.is_active)
  const [priority, setPriority] = useState(String(provider.priority))
  const [rpm, setRpm] = useState(String(provider.requests_per_minute))
  const [rpd, setRpd] = useState(String(provider.requests_per_day))

  const circuitOpen = provider.circuit_breaker_until && new Date(provider.circuit_breaker_until) > new Date()

  return (
    <tr className="border-b border-black/5 dark:border-white/5 align-top">
      <td className="py-2 pr-4">
        <div className="font-medium">{provider.name}</div>
        <div className="text-xs text-black/50 dark:text-white/50">
          {provider.isConfigured ? 'API key configured' : 'API key missing (env not set)'}
        </div>
      </td>
      <td className="py-2 pr-4">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
      </td>
      <td className="py-2 pr-4">
        <input
          type="number"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-16 rounded border border-black/20 dark:border-white/20 bg-transparent px-2 py-0.5"
        />
      </td>
      <td className="py-2 pr-4">
        <input
          type="number"
          min={1}
          value={rpm}
          onChange={(e) => setRpm(e.target.value)}
          className="w-20 rounded border border-black/20 dark:border-white/20 bg-transparent px-2 py-0.5"
        />
      </td>
      <td className="py-2 pr-4">
        <input
          type="number"
          min={1}
          value={rpd}
          onChange={(e) => setRpd(e.target.value)}
          className="w-24 rounded border border-black/20 dark:border-white/20 bg-transparent px-2 py-0.5"
        />
      </td>
      <td className="py-2 pr-4">
        <span className={`rounded px-2 py-0.5 text-xs ${STATUS_STYLES[provider.status] ?? ''}`}>
          {provider.status}
        </span>
        {circuitOpen && (
          <div className="mt-1 text-xs text-black/50 dark:text-white/50">
            open until {new Date(provider.circuit_breaker_until!).toLocaleTimeString()}
            <button type="button" onClick={onResetCircuitBreaker} className="ml-2 underline">
              reset
            </button>
          </div>
        )}
      </td>
      <td className="py-2 pr-4">
        <button
          type="button"
          onClick={() =>
            onSave({
              isActive,
              priority: Number(priority),
              requestsPerMinute: Number(rpm),
              requestsPerDay: Number(rpd),
            })
          }
          className="text-xs underline"
        >
          Save
        </button>
      </td>
    </tr>
  )
}
