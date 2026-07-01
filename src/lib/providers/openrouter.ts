import { GatewayError } from '../errors'
import type { ProviderAdapter, ChatMessage, ChatOptions, ChatResponse } from './types'

const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct:free'
const BASE_URL = 'https://openrouter.ai/api/v1'

export const openrouterProvider: ProviderAdapter = {
  id: 'openrouter',
  name: 'OpenRouter',
  priority: 3,
  limits: { requestsPerMinute: 20 },

  isConfigured: () => !!process.env.OPENROUTER_API_KEY,

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY!
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
}
