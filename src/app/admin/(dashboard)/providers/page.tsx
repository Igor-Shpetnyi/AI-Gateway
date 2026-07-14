'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Toggle } from '../../toggle'
import { useI18n } from '../../i18n/LanguageProvider'
import { statusLabel } from '../../i18n/helpers'
import type { Dict } from '../../i18n/dictionaries'
import { ProviderKeysPanel } from './provider-keys-panel'
import { QueryError } from '../../query-error'

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
  isCustom: boolean
  activeKeyCount: number
}

const STATUS_STYLES: Record<string, string> = {
  healthy: 'bg-success/15 text-success',
  degraded: 'bg-warning/15 text-warning',
  down: 'bg-danger/15 text-danger',
}

export default function ProvidersPage() {
  const { t } = useI18n()
  const utils = trpc.useUtils()
  const { data: providers, isLoading, isError, refetch } = trpc.providers.list.useQuery()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [priority, setPriority] = useState('10')
  const [rpm, setRpm] = useState('20')
  const [rpd, setRpd] = useState('500')

  const create = trpc.providers.create.useMutation({
    onSuccess: () => {
      setName('')
      setBaseUrl('')
      setPriority('10')
      setRpm('20')
      setRpd('500')
      utils.providers.list.invalidate()
    },
  })

  const update = trpc.providers.update.useMutation({
    onSuccess: () => utils.providers.list.invalidate(),
  })
  const resetCircuitBreaker = trpc.providers.resetCircuitBreaker.useMutation({
    onSuccess: () => utils.providers.list.invalidate(),
  })
  const remove = trpc.providers.remove.useMutation({
    onSuccess: (_, variables) => {
      if (expandedId === variables.id) setExpandedId(null)
      utils.providers.list.invalidate()
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.providers.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.providers.subtitle}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          create.mutate({
            name,
            baseUrl,
            priority: Number(priority),
            requestsPerMinute: Number(rpm),
            requestsPerDay: Number(rpd),
          })
        }}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-surface-border bg-surface p-5"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs text-muted">{t.providers.formName}</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-40 rounded-lg border border-surface-border bg-background px-3 py-1.5 outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs text-muted">{t.providers.formBaseUrl}</span>
          <input
            required
            type="url"
            placeholder="https://api.example.com/v1"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="w-64 rounded-lg border border-surface-border bg-background px-3 py-1.5 outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs text-muted">{t.providers.formPriority}</span>
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-20 rounded-lg border border-surface-border bg-background px-3 py-1.5 outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs text-muted">{t.providers.formReqMin}</span>
          <input
            type="number"
            min={1}
            value={rpm}
            onChange={(e) => setRpm(e.target.value)}
            className="w-24 rounded-lg border border-surface-border bg-background px-3 py-1.5 outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs text-muted">{t.providers.formReqDay}</span>
          <input
            type="number"
            min={1}
            value={rpd}
            onChange={(e) => setRpd(e.target.value)}
            className="w-24 rounded-lg border border-surface-border bg-background px-3 py-1.5 outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {create.isPending ? t.providers.adding : t.providers.addProvider}
        </button>
      </form>

      {isError ? (
        <QueryError onRetry={refetch} />
      ) : (
      <div className="overflow-x-auto rounded-2xl border border-surface-border bg-surface">
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
                  expanded={expandedId === provider.id}
                  onToggleExpanded={() => setExpandedId(expandedId === provider.id ? null : provider.id)}
                  onSave={(fields) => update.mutate({ id: provider.id, ...fields })}
                  onResetCircuitBreaker={() => resetCircuitBreaker.mutate({ id: provider.id })}
                  onDelete={() => {
                    if (window.confirm(t.providers.confirmDeleteProvider)) {
                      remove.mutate({ id: provider.id })
                    }
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}
    </div>
  )
}

function ProviderRowView({
  t,
  provider,
  expanded,
  onToggleExpanded,
  onSave,
  onResetCircuitBreaker,
  onDelete,
}: {
  t: Dict
  provider: ProviderRow
  expanded: boolean
  onToggleExpanded: () => void
  onSave: (fields: {
    isActive: boolean
    priority: number
    requestsPerMinute: number
    requestsPerDay: number
  }) => void
  onResetCircuitBreaker: () => void
  onDelete: () => void
}) {
  const [isActive, setIsActive] = useState(provider.is_active)
  const [priority, setPriority] = useState(String(provider.priority))
  const [rpm, setRpm] = useState(String(provider.requests_per_minute))
  const [rpd, setRpd] = useState(String(provider.requests_per_day))

  const circuitOpen = provider.circuit_breaker_until && new Date(provider.circuit_breaker_until) > new Date()
  const keyStatusText = provider.isConfigured ? t.providers.keyConfigured : t.providers.keysNoneCustom

  return (
    <>
      <tr className="align-top">
        <td className="min-w-[190px] px-5 py-3">
          <div className="flex items-center gap-2 whitespace-nowrap font-medium">
            {provider.name}
            {provider.isCustom && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-muted">
                {t.providers.custom}
              </span>
            )}
          </div>
          <div className="mt-0.5 whitespace-nowrap text-xs text-muted">{keyStatusText}</div>
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
        <td className="space-y-1 px-5 py-3">
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
            className="block w-full rounded-lg border border-surface-border px-2 py-1 text-xs text-muted hover:text-foreground"
          >
            {t.common.save}
          </button>
          <button
            type="button"
            onClick={onToggleExpanded}
            className="block w-full rounded-lg border border-surface-border px-2 py-1 text-xs text-muted hover:text-foreground"
          >
            {expanded ? t.providers.hideKeys : `${t.providers.manageKeys} (${provider.activeKeyCount})`}
          </button>
          {provider.isCustom && (
            <button
              type="button"
              onClick={onDelete}
              className="block w-full rounded-lg border border-danger/30 px-2 py-1 text-xs text-danger hover:bg-danger/10"
            >
              {t.providers.deleteProvider}
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="px-5 pb-4">
            <ProviderKeysPanel
              t={t}
              providerId={provider.id}
              defaultRpm={provider.requests_per_minute}
              defaultRpd={provider.requests_per_day}
            />
          </td>
        </tr>
      )}
    </>
  )
}
