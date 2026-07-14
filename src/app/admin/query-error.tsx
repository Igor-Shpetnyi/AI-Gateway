'use client'

import { useI18n } from './i18n/LanguageProvider'

export function QueryError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
      <span>{t.common.loadError}</span>
      <button
        type="button"
        onClick={() => onRetry()}
        className="shrink-0 rounded-lg border border-danger/30 px-3 py-1 text-xs hover:bg-danger/10"
      >
        {t.common.retry}
      </button>
    </div>
  )
}
