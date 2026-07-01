import crypto from 'crypto'
import { sql } from './db'
import { providers } from './providers'
import { GatewayError } from './errors'
import type { ChatMessage, ChatOptions, ChatResponse } from './providers/types'

export async function route(
  projectId: string,
  messages: ChatMessage[],
  options: ChatOptions
): Promise<ChatResponse> {
  const sorted = [...providers].sort((a, b) => a.priority - b.priority)
  let lastError: Error | null = null

  for (const provider of sorted) {
    const start = Date.now()
    try {
      const response = await provider.chat(messages, options)

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

      // MODEL_UNAVAILABLE is not retried — other providers likely don't have it either
      if (err instanceof GatewayError && err.code === 'MODEL_UNAVAILABLE') throw err

      lastError = error
    }
  }

  throw new GatewayError(
    'ALL_PROVIDERS_DOWN',
    `All providers failed. Last error: ${lastError?.message ?? 'unknown'}`,
    503
  )
}

async function logRequest(params: {
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
       ${params.status}, ${params.errorMessage ?? null}, false)
  `
}
