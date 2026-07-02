'use client'

import { useRouter } from 'next/navigation'
import { LANG_COOKIE, type Lang } from '../i18n/shared'
import { LanguageSwitcher } from '../i18n/LanguageSwitcher'

export function LoginLanguageSwitcher({ lang }: { lang: Lang }) {
  const router = useRouter()

  function handleChange(next: Lang) {
    document.cookie = `${LANG_COOKIE}=${next}; path=/admin; max-age=${60 * 60 * 24 * 365}`
    router.refresh()
  }

  return <LanguageSwitcher lang={lang} onChange={handleChange} />
}
