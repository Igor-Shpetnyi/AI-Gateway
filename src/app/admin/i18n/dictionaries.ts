import { en } from './en'
import { uk } from './uk'
import type { Lang } from './shared'

export const dictionaries = { en, uk } satisfies Record<Lang, unknown>

export type Dict = typeof en
