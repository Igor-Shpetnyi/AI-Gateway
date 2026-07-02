export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  model: string
  temperature?: number
  max_tokens?: number
}

export interface ChatResponse {
  id: string
  model: string
  content: string
  promptTokens: number
  completionTokens: number
  provider: string
}

export interface ProviderAdapter {
  id: string
  name: string
  // env-var-only capability check, used as a fallback when no DB-managed key exists
  isConfigured(): boolean
  // apiKey comes from provider_api_keys (DB) when set; falls back to the
  // adapter's own env var when omitted
  chat(messages: ChatMessage[], options: ChatOptions, apiKey?: string): Promise<ChatResponse>
}
