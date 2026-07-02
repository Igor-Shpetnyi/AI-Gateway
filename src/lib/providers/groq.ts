import { GatewayError } from '../errors'
import type { ProviderAdapter, ChatMessage, ChatOptions, ChatResponse } from './types'

const DEFAULT_MODEL = 'llama-3.1-8b-instant'

export const groqProvider: ProviderAdapter = {
  id: 'groq',
  name: 'Groq',

  isConfigured: () => !!process.env.GROQ_API_KEY,

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResponse> {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error('GROQ_API_KEY is not configured')

    const model = options.model === 'auto' ? DEFAULT_MODEL : options.model

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        ...(options.max_tokens && { max_tokens: options.max_tokens }),
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: { message?: string } }
      const msg = body.error?.message ?? res.statusText

      if (res.status === 404 || (res.status === 400 && msg.toLowerCase().includes('model'))) {
        throw new GatewayError('MODEL_UNAVAILABLE', `Model not available on Groq: ${model}`, 409)
      }
      if (res.status === 429) {
        throw new Error(`Groq rate limited: ${msg}`)
      }
      throw new Error(`Groq error ${res.status}: ${msg}`)
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
      provider: 'groq',
    }
  },
}
