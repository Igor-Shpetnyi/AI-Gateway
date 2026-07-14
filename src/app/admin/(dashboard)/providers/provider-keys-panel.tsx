'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Toggle } from '../../toggle'
import { statusLabel } from '../../i18n/helpers'
import type { Dict } from '../../i18n/dictionaries'

const STATUS_STYLES: Record<string, string> = {
  healthy: 'bg-success/15 text-success',
  degraded: 'bg-warning/15 text-warning',
  down: 'bg-danger/15 text-danger',
}

export function ProviderKeysPanel({
  t,
  providerId,
  defaultRpm,
  defaultRpd,
}: {
  t: Dict
  providerId: string
  defaultRpm: number
  defaultRpd: number
}) {
  const utils = trpc.useUtils()
  const { data: keys, isLoading } = trpc.providerKeys.listForProvider.useQuery({ providerId })

  const [label, setLabel] = useState('')
  const [key, setKey] = useState('')
  const [rpm, setRpm] = useState('')
  const [rpd, setRpd] = useState('')

  function invalidate() {
    utils.providerKeys.listForProvider.invalidate({ providerId })
    utils.providers.list.invalidate()
  }

  const addKey = trpc.providerKeys.add.useMutation({
    onSuccess: () => {
      setLabel('')
      setKey('')
      setRpm('')
      setRpd('')
      testKey.reset()
      invalidate()
    },
  })
  const setActive = trpc.providerKeys.setActive.useMutation({ onSuccess: invalidate })
  const updateLimits = trpc.providerKeys.updateLimits.useMutation({ onSuccess: invalidate })
  const remove = trpc.providerKeys.remove.useMutation({ onSuccess: invalidate })
  const resetCircuitBreaker = trpc.providerKeys.resetCircuitBreaker.useMutation({ onSuccess: invalidate })
  const testKey = trpc.providerKeys.test.useMutation()

  return (
    <div className="space-y-3 rounded-xl border border-surface-border bg-background/40 p-4">
      {isLoading ? (
        <p className="text-xs text-muted">{t.common.loading}</p>
      ) : keys && keys.length > 0 ? (
        <ul className="space-y-2">
          {keys.map((k) => (
            <KeyRow
              key={k.id}
              t={t}
              keyRow={k}
              defaultRpm={defaultRpm}
              defaultRpd={defaultRpd}
              onToggleActive={(isActive) => setActive.mutate({ id: k.id, isActive })}
              onSaveLimits={(requestsPerMinute, requestsPerDay) =>
                updateLimits.mutate({ id: k.id, requestsPerMinute, requestsPerDay })
              }
              onRemove={() => remove.mutate({ id: k.id })}
              onResetCircuitBreaker={() => resetCircuitBreaker.mutate({ id: k.id })}
            />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">{t.providers.keysNoneCustom}</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          addKey.mutate({
            providerId,
            label: label || undefined,
            key,
            requestsPerMinute: rpm ? Number(rpm) : undefined,
            requestsPerDay: rpd ? Number(rpd) : undefined,
          })
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t.providers.keyLabelPlaceholder}
          className="w-44 rounded-lg border border-surface-border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
        />
        <input
          required
          type="password"
          value={key}
          onChange={(e) => {
            setKey(e.target.value)
            testKey.reset()
          }}
          placeholder={t.providers.keyValuePlaceholder}
          className="min-w-[180px] flex-1 rounded-lg border border-surface-border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
        />
        <button
          type="button"
          disabled={!key || testKey.isPending}
          onClick={() => testKey.mutate({ providerId, key })}
          className="rounded-lg border border-surface-border px-2 py-1 text-xs text-muted hover:text-foreground disabled:opacity-50"
        >
          {testKey.isPending ? t.common.loading : t.providers.testKey}
        </button>
        {testKey.data && (
          <span className={`text-xs ${testKey.data.ok ? 'text-success' : 'text-danger'}`}>
            {testKey.data.ok ? t.providers.testKeyOk(testKey.data.modelCount) : `${t.providers.testKeyFail} ${testKey.data.error}`}
          </span>
        )}
        <input
          type="number"
          min={1}
          value={rpm}
          onChange={(e) => setRpm(e.target.value)}
          placeholder={`${t.providers.keyRpmPlaceholder} (${defaultRpm})`}
          className="w-36 rounded-lg border border-surface-border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
        />
        <input
          type="number"
          min={1}
          value={rpd}
          onChange={(e) => setRpd(e.target.value)}
          placeholder={`${t.providers.keyRpdPlaceholder} (${defaultRpd})`}
          className="w-44 rounded-lg border border-surface-border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={addKey.isPending}
          className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {t.providers.addKey}
        </button>
      </form>
    </div>
  )
}

function KeyRow({
  t,
  keyRow,
  defaultRpm,
  defaultRpd,
  onToggleActive,
  onSaveLimits,
  onRemove,
  onResetCircuitBreaker,
}: {
  t: Dict
  keyRow: {
    id: string
    label: string | null
    maskedKey: string
    isActive: boolean
    requestsPerMinute: number | null
    requestsPerDay: number | null
    status: string
    circuitBreakerUntil: Date | null
    requestsToday: number
  }
  defaultRpm: number
  defaultRpd: number
  onToggleActive: (isActive: boolean) => void
  onSaveLimits: (requestsPerMinute: number | null, requestsPerDay: number | null) => void
  onRemove: () => void
  onResetCircuitBreaker: () => void
}) {
  const [rpm, setRpm] = useState(keyRow.requestsPerMinute?.toString() ?? '')
  const [rpd, setRpd] = useState(keyRow.requestsPerDay?.toString() ?? '')

  const circuitOpen = keyRow.circuitBreakerUntil && new Date(keyRow.circuitBreakerUntil) > new Date()
  const effectiveRpd = keyRow.requestsPerDay ?? defaultRpd
  const usagePct = Math.min(100, Math.round((keyRow.requestsToday / effectiveRpd) * 100))

  return (
    <li className="space-y-2 rounded-lg border border-surface-border/60 p-2">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3">
          <Toggle checked={keyRow.isActive} onChange={onToggleActive} />
          <code className="rounded bg-surface px-2 py-0.5 text-xs">{keyRow.maskedKey}</code>
          {keyRow.label && <span className="text-xs text-muted">{keyRow.label}</span>}
          <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[keyRow.status] ?? ''}`}>
            {statusLabel(t, keyRow.status)}
          </span>
          {circuitOpen && (
            <button type="button" onClick={onResetCircuitBreaker} className="text-xs text-accent underline">
              {t.providers.reset}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={rpm}
            onChange={(e) => setRpm(e.target.value)}
            placeholder={`${t.providers.keyRpmPlaceholder} (${defaultRpm})`}
            className="w-36 rounded-lg border border-surface-border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
          />
          <input
            type="number"
            min={1}
            value={rpd}
            onChange={(e) => setRpd(e.target.value)}
            placeholder={`${t.providers.keyRpdPlaceholder} (${defaultRpd})`}
            className="w-44 rounded-lg border border-surface-border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => onSaveLimits(rpm ? Number(rpm) : null, rpd ? Number(rpd) : null)}
            className="rounded-lg border border-surface-border px-2 py-1 text-xs text-muted hover:text-foreground"
          >
            {t.common.save}
          </button>
          <button type="button" onClick={onRemove} className="text-xs text-danger underline">
            {t.providers.removeKey}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-surface-border">
          <div className="h-full rounded-full bg-accent" style={{ width: `${usagePct}%` }} />
        </div>
        <span className="text-[11px] text-muted">
          {t.providers.usageToday(keyRow.requestsToday, keyRow.requestsPerDay ?? defaultRpd)}
        </span>
      </div>
    </li>
  )
}
