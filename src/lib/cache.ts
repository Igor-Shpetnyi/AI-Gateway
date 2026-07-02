import crypto from 'crypto'
import { sql } from './db'
import type { ChatMessage, ChatResponse } from './providers/types'

// temperature buckets as a proxy for task determinism: unset/0 = deterministic
// (safe to reuse for a while), higher temperature = more creative/random output
// (reuse only within a tight window so cached replies don't go stale fast)
const TTL_DETERMINISTIC = 60 * 60 * 24 * 7
const TTL_STANDARD = 60 * 60 * 24
const TTL_CREATIVE = 60 * 60

export function cacheKey(model: string, messages: ChatMessage[], temperature?: number): string {
  const normalized = JSON.stringify({
    model,
    temperature: temperature ?? null,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

export function cacheTtlSeconds(temperature?: number): number {
  if (!temperature) return TTL_DETERMINISTIC
  if (temperature <= 1) return TTL_STANDARD
  return TTL_CREATIVE
}

export async function getCachedResponse(key: string): Promise<ChatResponse | null> {
  const rows = await sql<{ response: string }[]>`
    SELECT response FROM response_cache
    WHERE cache_key = ${key} AND expires_at > now()
  `
  if (rows.length === 0) return null

  await sql`UPDATE response_cache SET hit_count = hit_count + 1 WHERE cache_key = ${key}`
  return JSON.parse(rows[0].response) as ChatResponse
}

export async function setCachedResponse(
  key: string,
  response: ChatResponse,
  ttlSeconds: number
): Promise<void> {
  await sql`
    INSERT INTO response_cache (cache_key, response, model, provider_id, expires_at, hit_count)
    VALUES (
      ${key}, ${JSON.stringify(response)}, ${response.model}, ${response.provider},
      now() + ${ttlSeconds} * interval '1 second', 0
    )
    ON CONFLICT (cache_key) DO UPDATE SET
      response = EXCLUDED.response,
      model = EXCLUDED.model,
      provider_id = EXCLUDED.provider_id,
      expires_at = EXCLUDED.expires_at,
      hit_count = 0
  `
}
