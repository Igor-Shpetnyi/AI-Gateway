// In-memory sliding window rate limiter for outgoing provider calls.
// Prevents us from hitting provider rate limits before they block us.
// State resets on process restart — acceptable for Phase 2.

const windows = new Map<string, number[]>()

export function isProviderRateLimited(providerId: string, requestsPerMinute: number): boolean {
  const now = Date.now()
  const recent = (windows.get(providerId) ?? []).filter(t => now - t < 60_000)
  windows.set(providerId, recent)
  return recent.length >= requestsPerMinute
}

export function recordProviderCall(providerId: string): void {
  const timestamps = windows.get(providerId) ?? []
  timestamps.push(Date.now())
  windows.set(providerId, timestamps)
}
