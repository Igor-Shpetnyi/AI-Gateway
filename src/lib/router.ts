import crypto from 'crypto'
import { sql } from './db'
import { providers } from './providers'
import { createOpenAICompatibleAdapter } from './providers/openai-compatible'
import { decryptSecret } from './crypto'
import { GatewayError } from './errors'
import { isCircuitOpen, onProviderSuccess, onProviderFailure } from './circuit-breaker'
import { isProviderRateLimited, recordProviderCall } from './rate-limiter'
import type { ChatMessage, ChatOptions, ChatResponse, ProviderAdapter } from './providers/types'

interface ProviderConfig {
  id: string
  name: string
  base_url: string
  requests_per_minute: number
}

interface ResolvedKey {
  keyId: string
  apiKey: string | undefined // undefined = let the adapter fall back to its own env var
  requestsPerMinute: number | null // null = inherit the provider's default
}

async function getActiveProviderConfigs(): Promise<ProviderConfig[]> {
  return sql<ProviderConfig[]>`
    SELECT id, name, base_url, requests_per_minute
    FROM providers
    WHERE is_active = true
    ORDER BY priority
  `
}

async function getKeysForProvider(providerId: string, adapter: ProviderAdapter): Promise<ResolvedKey[]> {
  const rows = await sql<{ id: string; key_encrypted: string; requests_per_minute: number | null }[]>`
    SELECT id, key_encrypted, requests_per_minute FROM provider_api_keys
    WHERE provider_id = ${providerId} AND is_active = true
    ORDER BY created_at
  `

  if (rows.length > 0) {
    return rows.map((row) => ({
      keyId: row.id,
      apiKey: decryptSecret(row.key_encrypted),
      requestsPerMinute: row.requests_per_minute,
    }))
  }

  // No DB-managed keys — fall back to the code adapter's own env var, if any
  return adapter.isConfigured() ? [{ keyId: 'env', apiKey: undefined, requestsPerMinute: null }] : []
}

// Distributes load across a provider's keys over time rather than always
// hammering the first one; resets on process restart (same tradeoff as
// rate-limiter.ts and circuit-breaker.ts's in-memory failure counters).
const keyRotation = new Map<string, number>()

function rotationOrder(providerId: string, count: number): number[] {
  const start = keyRotation.get(providerId) ?? 0
  keyRotation.set(providerId, (start + 1) % count)
  return Array.from({ length: count }, (_, i) => (start + i) % count)
}

export async function route(
  projectId: string,
  messages: ChatMessage[],
  options: ChatOptions
): Promise<ChatResponse> {
  const configs = await getActiveProviderConfigs()
  let lastError: Error | null = null
  let allSkipped = true

  for (const config of configs) {
    const adapter = providers[config.id] ?? createOpenAICompatibleAdapter(config.id, config.name, config.base_url)

    const keys = await getKeysForProvider(config.id, adapter)
    if (keys.length === 0) continue // not configured at all — no DB keys, no env var

    // Skip if circuit breaker is open (provider-wide, trips after exhausting all keys repeatedly)
    if (await isCircuitOpen(config.id)) {
      console.info(`[Router] Skipping ${config.id} — circuit open`)
      continue
    }

    let attemptedAnyKey = false

    for (const idx of rotationOrder(config.id, keys.length)) {
      const { keyId, apiKey, requestsPerMinute } = keys[idx]
      const bucket = `${config.id}:${keyId}`
      const effectiveRpm = requestsPerMinute ?? config.requests_per_minute

      // Skip if this specific key is at its rate limit
      if (isProviderRateLimited(bucket, effectiveRpm)) {
        console.info(`[Router] Skipping ${config.id} key ${keyId} — rate limited`)
        lastError = new Error(`${adapter.name} rate limit reached`)
        continue
      }

      attemptedAnyKey = true
      allSkipped = false
      const start = Date.now()

      try {
        recordProviderCall(bucket)
        const response = await adapter.chat(messages, options, apiKey)

        await onProviderSuccess(config.id)
        await logRequest({
          projectId,
          providerId: config.id,
          model: response.model,
          promptTokens: response.promptTokens,
          completionTokens: response.completionTokens,
          latencyMs: Date.now() - start,
          status: 'success',
        })

        return response
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))

        await logRequest({
          projectId,
          providerId: config.id,
          model: options.model,
          promptTokens: 0,
          completionTokens: 0,
          latencyMs: Date.now() - start,
          status: 'error',
          errorMessage: error.message,
        })

        // MODEL_UNAVAILABLE is propagated immediately — no point trying other keys or providers
        if (err instanceof GatewayError && err.code === 'MODEL_UNAVAILABLE') throw err

        lastError = error
        // try the next key for this same provider
      }
    }

    if (attemptedAnyKey) {
      await onProviderFailure(config.id)
    }
  }

  if (allSkipped) {
    throw new GatewayError('ALL_PROVIDERS_DOWN', 'No providers are configured or available', 503)
  }

  throw new GatewayError(
    'ALL_PROVIDERS_DOWN',
    `All providers failed. Last error: ${lastError?.message ?? 'unknown'}`,
    503
  )
}

export async function logRequest(params: {
  projectId: string
  providerId: string
  model: string
  promptTokens: number
  completionTokens: number
  latencyMs: number
  status: string
  errorMessage?: string
}) {
  await sql`
    INSERT INTO request_logs
      (id, project_id, provider_id, model, prompt_tokens, completion_tokens, latency_ms, status, error_message, cache_hit)
    VALUES
      (${crypto.randomUUID()}, ${params.projectId}, ${params.providerId}, ${params.model},
       ${params.promptTokens}, ${params.completionTokens}, ${params.latencyMs},
       ${params.status}, ${params.errorMessage ?? null}, ${params.status === 'cached'})
  `
}
