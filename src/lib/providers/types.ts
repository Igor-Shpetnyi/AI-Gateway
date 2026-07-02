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
  isConfigured(): boolean
  chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResponse>
}
