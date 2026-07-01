import { groqProvider } from './groq'
import type { ProviderAdapter } from './types'

// Providers sorted by priority (lowest number = highest priority)
export const providers: ProviderAdapter[] = [
  groqProvider,
]
