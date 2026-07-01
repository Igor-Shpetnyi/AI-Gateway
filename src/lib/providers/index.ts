import { groqProvider } from './groq'
import { geminiProvider } from './gemini'
import { openrouterProvider } from './openrouter'
import type { ProviderAdapter } from './types'

// Sorted by priority (lowest number = highest priority): Groq → Gemini → OpenRouter
export const providers: ProviderAdapter[] = [
  groqProvider,
  geminiProvider,
  openrouterProvider,
]
