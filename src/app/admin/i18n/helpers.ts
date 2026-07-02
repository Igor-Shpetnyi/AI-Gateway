import type { Dict } from './dictionaries'

export function statusLabel(t: Dict, status: string): string {
  return (t.common.status as Record<string, string>)[status] ?? status
}

export function requestStatusLabel(t: Dict, status: string): string {
  return (t.common.requestStatus as Record<string, string>)[status] ?? status
}
