import crypto from 'crypto'
import { GatewayError } from '../errors'
import type { ProviderAdapter, ChatMessage, ChatOptions, ChatResponse } from './types'

const DEFAULT_MODEL = 'gemini-1.5-flash'
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

export const geminiProvider: ProviderAdapter = {
  id: 'gemini',
  name: 'Google Gemini',

  isConfigured: () => !!process.env.GEMINI_API_KEY,

  async chat(messages: ChatMessage[], options: ChatOptions, apiKey = process.env.GEMINI_API_KEY): Promise<ChatResponse> {
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')
    const model = options.model === 'auto' ? DEFAULT_MODEL : options.model

    // Gemini uses systemInstruction for system messages, separate from contents
    const systemMsg = messages.find(m => m.role === 'system')
    const conversationMsgs = messages.filter(m => m.role !== 'system')

    const body: Record<string, unknown> = {
      contents: conversationMsgs.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        ...(options.max_tokens && { maxOutputTokens: options.max_tokens }),
      },
    }

    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] }
    }

    const res = await fetch(
      `${BASE_URL}/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string; status?: string } }
      const msg = err.error?.message ?? res.statusText

      if (res.status === 404 || err.error?.status === 'NOT_FOUND') {
        throw new GatewayError('MODEL_UNAVAILABLE', `Model not available on Gemini: ${model}`, 409)
      }
      if (res.status === 429) {
        throw new Error(`Gemini rate limited: ${msg}`)
      }
      throw new Error(`Gemini error ${res.status}: ${msg}`)
    }

    const data = await res.json() as {
      candidates: [{ content: { parts: [{ text: string }] } }]
      usageMetadata: { promptTokenCount: number; candidatesTokenCount: number }
      modelVersion?: string
    }

    return {
      id: `gemini-${crypto.randomUUID()}`,
      model: data.modelVersion ?? model,
      content: data.candidates[0].content.parts[0].text,
      promptTokens: data.usageMetadata.promptTokenCount,
      completionTokens: data.usageMetadata.candidatesTokenCount,
      provider: 'gemini',
    }
  },
}
