import { GatewayError } from '../errors'
import type { ProviderAdapter, ChatMessage, ChatOptions, ChatResponse } from './types'

// Generic adapter for any OpenAI-compatible /chat/completions endpoint —
// backs admin-panel-added custom providers. Their base URL and keys live in
// the DB (providers.base_url, provider_api_keys), never in code.
export function createOpenAICompatibleAdapter(id: string, name: string, baseUrl: string): ProviderAdapter {
  return {
    id,
    name,

    async chat(messages: ChatMessage[], options: ChatOptions, apiKey: string): Promise<ChatResponse> {
      if (!apiKey) throw new Error(`${name} has no API key configured`)

      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model,
          messages,
          temperature: options.temperature ?? 0.7,
          ...(options.max_tokens && { max_tokens: options.max_tokens }),
        }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        const msg = body.error?.message ?? res.statusText

        if (res.status === 404 || (res.status === 400 && msg.toLowerCase().includes('model'))) {
          throw new GatewayError('MODEL_UNAVAILABLE', `Model not available on ${name}: ${options.model}`, 409)
        }
        if (res.status === 429) {
          throw new Error(`${name} rate limited: ${msg}`)
        }
        throw new Error(`${name} error ${res.status}: ${msg}`)
      }

      const data = (await res.json()) as {
        id: string
        model: string
        choices: [{ message: { content: string } }]
        usage: { prompt_tokens: number; completion_tokens: number }
      }

      return {
        id: data.id,
        model: data.model,
        content: data.choices[0].message.content,
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        provider: id,
      }
    },

    // Not every OpenAI-compatible endpoint implements GET /models — fail soft
    // so the chat UI can fall back to a free-text model field.
    async listModels(apiKey: string): Promise<string[]> {
      try {
        const res = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (!res.ok) return []
        const data = (await res.json()) as { data: { id: string }[] }
        return data.data.map((m) => m.id)
      } catch {
        return []
      }
    },
  }
}
