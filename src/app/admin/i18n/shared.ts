export type Lang = 'en' | 'uk'

export const LANG_COOKIE = 'admin_lang'

export function isValidLang(value: string | undefined): value is Lang {
  return value === 'en' || value === 'uk'
}
