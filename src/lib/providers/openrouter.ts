import { GatewayError } from '../errors'
import type { ProviderAdapter, ChatMessage, ChatOptions, ChatResponse } from './types'

const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct:free'
const BASE_URL = 'https://openrouter.ai/api/v1'

export const openrouterProvider: ProviderAdapter = {
  id: 'openrouter',
  name: 'OpenRouter',

  async chat(messages: ChatMessage[], options: ChatOptions, apiKey: string): Promise<ChatResponse> {
    if (!apiKey) throw new Error('OpenRouter: no active API key — add one in Providers → Manage keys')
    const model = options.model === 'auto' ? DEFAULT_MODEL : options.model

    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/Igor-Shpetnyi/AI-Gateway',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        ...(options.max_tokens && { max_tokens: options.max_tokens }),
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string; code?: number } }
      const msg = err.error?.message ?? res.statusText

      if (res.status === 404) {
        throw new GatewayError('MODEL_UNAVAILABLE', `Model not available on OpenRouter: ${model}`, 409)
      }
      if (res.status === 429) {
        throw new Error(`OpenRouter rate limited: ${msg}`)
      }
      throw new Error(`OpenRouter error ${res.status}: ${msg}`)
    }

    const data = await res.json() as {
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
      provider: 'openrouter',
    }
  },

  // Free-tier only — this gateway is specifically for free LLM providers, no
  // point surfacing OpenRouter's much larger paid catalog in the picker.
  async listModels(apiKey: string): Promise<string[]> {
    const res = await fetch(`${BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) throw new Error(`OpenRouter models list error ${res.status}`)
    const data = (await res.json()) as {
      data: { id: string; pricing: { prompt: string; completion: string } }[]
    }
    return data.data
      .filter((m) => m.pricing.prompt === '0' && m.pricing.completion === '0')
      .map((m) => m.id)
  },
}
