import { cookies } from 'next/headers'
import { LANG_COOKIE, isValidLang, type Lang } from './shared'

export async function getServerLang(): Promise<Lang> {
  const store = await cookies()
  const value = store.get(LANG_COOKIE)?.value
  return isValidLang(value) ? value : 'en'
}
