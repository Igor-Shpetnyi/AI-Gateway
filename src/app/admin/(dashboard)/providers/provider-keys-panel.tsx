'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Toggle } from '../../toggle'
import type { Dict } from '../../i18n/dictionaries'

export function ProviderKeysPanel({
  t,
  providerId,
  isCustom,
  defaultRpm,
}: {
  t: Dict
  providerId: string
  isCustom: boolean
  defaultRpm: number
}) {
  const utils = trpc.useUtils()
  const { data: keys, isLoading } = trpc.providerKeys.listForProvider.useQuery({ providerId })

  const [label, setLabel] = useState('')
  const [key, setKey] = useState('')
  const [rpm, setRpm] = useState('')

  function invalidate() {
    utils.providerKeys.listForProvider.invalidate({ providerId })
    utils.providers.list.invalidate()
  }

  const addKey = trpc.providerKeys.add.useMutation({
    onSuccess: () => {
      setLabel('')
      setKey('')
      setRpm('')
      invalidate()
    },
  })
  const setActive = trpc.providerKeys.setActive.useMutation({ onSuccess: invalidate })
  const updateLimit = trpc.providerKeys.updateLimit.useMutation({ onSuccess: invalidate })
  const remove = trpc.providerKeys.remove.useMutation({ onSuccess: invalidate })

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
              onToggleActive={(isActive) => setActive.mutate({ id: k.id, isActive })}
              onSaveLimit={(requestsPerMinute) => updateLimit.mutate({ id: k.id, requestsPerMinute })}
              onRemove={() => remove.mutate({ id: k.id })}
            />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">{isCustom ? t.providers.keysNoneCustom : t.providers.keysNoneEnv}</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          addKey.mutate({ providerId, label: label || undefined, key, requestsPerMinute: rpm ? Number(rpm) : undefined })
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t.providers.keyLabelPlaceholder}
          className="w-32 rounded-lg border border-surface-border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
        />
        <input
          required
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={t.providers.keyValuePlaceholder}
          className="min-w-[180px] flex-1 rounded-lg border border-surface-border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
        />
        <input
          type="number"
          min={1}
          value={rpm}
          onChange={(e) => setRpm(e.target.value)}
          placeholder={`${t.providers.keyRpmPlaceholder} (${defaultRpm})`}
          className="w-40 rounded-lg border border-surface-border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
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
  onToggleActive,
  onSaveLimit,
  onRemove,
}: {
  t: Dict
  keyRow: {
    id: string
    label: string | null
    maskedKey: string
    isActive: boolean
    requestsPerMinute: number | null
  }
  defaultRpm: number
  onToggleActive: (isActive: boolean) => void
  onSaveLimit: (requestsPerMinute: number | null) => void
  onRemove: () => void
}) {
  const [rpm, setRpm] = useState(keyRow.requestsPerMinute?.toString() ?? '')

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-3">
        <Toggle checked={keyRow.isActive} onChange={onToggleActive} />
        <code className="rounded bg-surface px-2 py-0.5 text-xs">{keyRow.maskedKey}</code>
        {keyRow.label && <span className="text-xs text-muted">{keyRow.label}</span>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={rpm}
          onChange={(e) => setRpm(e.target.value)}
          placeholder={`${t.providers.keyRpmPlaceholder} (${defaultRpm})`}
          className="w-40 rounded-lg border border-surface-border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => onSaveLimit(rpm ? Number(rpm) : null)}
          className="rounded-lg border border-surface-border px-2 py-1 text-xs text-muted hover:text-foreground"
        >
          {t.common.save}
        </button>
        <button type="button" onClick={onRemove} className="text-xs text-danger underline">
          {t.providers.removeKey}
        </button>
      </div>
    </li>
  )
}
