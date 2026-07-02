import crypto from 'crypto'
import { sql } from './db'
import { providers } from './providers'
import { GatewayError } from './errors'
import { isCircuitOpen, onProviderSuccess, onProviderFailure } from './circuit-breaker'
import { isProviderRateLimited, recordProviderCall } from './rate-limiter'
import type { ChatMessage, ChatOptions, ChatResponse } from './providers/types'

export async function route(
  projectId: string,
  messages: ChatMessage[],
  options: ChatOptions
): Promise<ChatResponse> {
  const sorted = [...providers].sort((a, b) => a.priority - b.priority)
  let lastError: Error | null = null
  let allSkipped = true

  for (const provider of sorted) {
    // Skip providers without API keys configured
    if (!provider.isConfigured()) continue

    // Skip if circuit breaker is open
    if (await isCircuitOpen(provider.id)) {
      console.info(`[Router] Skipping ${provider.id} — circuit open`)
      continue
    }

    // Skip if we're at the provider's rate limit
    if (isProviderRateLimited(provider.id, provider.limits.requestsPerMinute)) {
      console.info(`[Router] Skipping ${provider.id} — rate limited`)
      lastError = new Error(`${provider.name} rate limit reached`)
      continue
    }

    allSkipped = false
    const start = Date.now()

    try {
      recordProviderCall(provider.id)
      const response = await provider.chat(messages, options)

      await onProviderSuccess(provider.id)
      await logRequest({
        projectId,
        providerId: provider.id,
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
        providerId: provider.id,
        model: options.model,
        promptTokens: 0,
        completionTokens: 0,
        latencyMs: Date.now() - start,
        status: 'error',
        errorMessage: error.message,
      })

      // MODEL_UNAVAILABLE is propagated immediately — no point trying other providers
      if (err instanceof GatewayError && err.code === 'MODEL_UNAVAILABLE') throw err

      await onProviderFailure(provider.id)
      lastError = error
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
