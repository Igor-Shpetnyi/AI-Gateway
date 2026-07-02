'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { dictionaries, type Dict } from './dictionaries'
import { LANG_COOKIE, type Lang } from './shared'

const LanguageContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void; t: Dict } | null>(null)

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang
  children: React.ReactNode
}) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    document.cookie = `${LANG_COOKIE}=${next}; path=/admin; max-age=${60 * 60 * 24 * 365}`
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: dictionaries[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider')
  return ctx
}
