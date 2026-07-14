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
  // apiKey always comes from provider_api_keys (DB) — no env var fallback
  chat(messages: ChatMessage[], options: ChatOptions, apiKey: string): Promise<ChatResponse>
  // real model ids currently available from this provider's own API, using an already-resolved key
  listModels(apiKey: string): Promise<string[]>
}
