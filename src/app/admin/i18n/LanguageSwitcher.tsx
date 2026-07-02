'use client'

import type { Lang } from './shared'

const LANGS: Lang[] = ['en', 'uk']

export function LanguageSwitcher({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-surface-border text-xs">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          aria-pressed={l === lang}
          className={`px-2 py-1 font-medium uppercase transition-colors ${
            l === lang ? 'bg-accent text-white' : 'text-muted hover:text-foreground'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
