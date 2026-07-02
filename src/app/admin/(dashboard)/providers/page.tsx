'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Toggle } from '../../toggle'
import { useI18n } from '../../i18n/LanguageProvider'
import { statusLabel } from '../../i18n/helpers'
import type { Dict } from '../../i18n/dictionaries'

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
  healthy: 'bg-success/15 text-success',
  degraded: 'bg-warning/15 text-warning',
  down: 'bg-danger/15 text-danger',
}

export default function ProvidersPage() {
  const { t } = useI18n()
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
      <div>
        <h1 className="text-2xl font-bold">{t.providers.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.providers.subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
        {isLoading ? (
          <p className="p-5 text-sm text-muted">{t.common.loading}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="px-5 py-3 font-medium">{t.providers.colProvider}</th>
                <th className="px-5 py-3 font-medium">{t.providers.colActive}</th>
                <th className="px-5 py-3 font-medium">{t.providers.colPriority}</th>
                <th className="px-5 py-3 font-medium">{t.providers.colReqMin}</th>
                <th className="px-5 py-3 font-medium">{t.providers.colReqDay}</th>
                <th className="px-5 py-3 font-medium">{t.providers.colStatus}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {providers?.map((provider) => (
                <ProviderRowView
                  key={provider.id}
                  t={t}
                  provider={provider}
                  onSave={(fields) => update.mutate({ id: provider.id, ...fields })}
                  onResetCircuitBreaker={() => resetCircuitBreaker.mutate({ id: provider.id })}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function ProviderRowView({
  t,
  provider,
  onSave,
  onResetCircuitBreaker,
}: {
  t: Dict
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
    <tr className="align-top">
      <td className="min-w-[190px] px-5 py-3">
        <div className="whitespace-nowrap font-medium">{provider.name}</div>
        <div className="mt-0.5 whitespace-nowrap text-xs text-muted">
          {provider.isConfigured ? t.providers.keyConfigured : t.providers.keyMissing}
        </div>
      </td>
      <td className="px-5 py-3">
        <Toggle checked={isActive} onChange={setIsActive} />
      </td>
      <td className="px-5 py-3">
        <input
          type="number"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-16 rounded-lg border border-surface-border bg-background px-2 py-1 outline-none focus:border-accent"
        />
      </td>
      <td className="px-5 py-3">
        <input
          type="number"
          min={1}
          value={rpm}
          onChange={(e) => setRpm(e.target.value)}
          className="w-20 rounded-lg border border-surface-border bg-background px-2 py-1 outline-none focus:border-accent"
        />
      </td>
      <td className="px-5 py-3">
        <input
          type="number"
          min={1}
          value={rpd}
          onChange={(e) => setRpd(e.target.value)}
          className="w-24 rounded-lg border border-surface-border bg-background px-2 py-1 outline-none focus:border-accent"
        />
      </td>
      <td className="px-5 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[provider.status] ?? ''}`}>
          {statusLabel(t, provider.status)}
        </span>
        {circuitOpen && (
          <div className="mt-1 text-xs text-muted">
            {t.providers.openUntil} {new Date(provider.circuit_breaker_until!).toLocaleTimeString()}
            <button type="button" onClick={onResetCircuitBreaker} className="ml-2 text-accent underline">
              {t.providers.reset}
            </button>
          </div>
        )}
      </td>
      <td className="px-5 py-3">
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
          className="rounded-lg border border-surface-border px-2 py-1 text-xs text-muted hover:text-foreground"
        >
          {t.common.save}
        </button>
      </td>
    </tr>
  )
}
