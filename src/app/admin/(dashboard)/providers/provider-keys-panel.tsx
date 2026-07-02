'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Toggle } from '../../toggle'
import type { Dict } from '../../i18n/dictionaries'

export function ProviderKeysPanel({
  t,
  providerId,
  isCustom,
}: {
  t: Dict
  providerId: string
  isCustom: boolean
}) {
  const utils = trpc.useUtils()
  const { data: keys, isLoading } = trpc.providerKeys.listForProvider.useQuery({ providerId })

  const [label, setLabel] = useState('')
  const [key, setKey] = useState('')

  function invalidate() {
    utils.providerKeys.listForProvider.invalidate({ providerId })
    utils.providers.list.invalidate()
  }

  const addKey = trpc.providerKeys.add.useMutation({
    onSuccess: () => {
      setLabel('')
      setKey('')
      invalidate()
    },
  })
  const setActive = trpc.providerKeys.setActive.useMutation({ onSuccess: invalidate })
  const remove = trpc.providerKeys.remove.useMutation({ onSuccess: invalidate })

  return (
    <div className="space-y-3 rounded-xl border border-surface-border bg-background/40 p-4">
      {isLoading ? (
        <p className="text-xs text-muted">{t.common.loading}</p>
      ) : keys && keys.length > 0 ? (
        <ul className="space-y-2">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3">
                <Toggle checked={k.isActive} onChange={(isActive) => setActive.mutate({ id: k.id, isActive })} />
                <code className="rounded bg-surface px-2 py-0.5 text-xs">{k.maskedKey}</code>
                {k.label && <span className="text-xs text-muted">{k.label}</span>}
              </div>
              <button
                type="button"
                onClick={() => remove.mutate({ id: k.id })}
                className="text-xs text-danger underline"
              >
                {t.providers.removeKey}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">{isCustom ? t.providers.keysNoneCustom : t.providers.keysNoneEnv}</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          addKey.mutate({ providerId, label: label || undefined, key })
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
