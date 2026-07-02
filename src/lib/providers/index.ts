import { groqProvider } from './groq'
import { geminiProvider } from './gemini'
import { openrouterProvider } from './openrouter'
import type { ProviderAdapter } from './types'

// Registry of code-implemented adapters, keyed by id. Routing order, active
// status, and rate limits are NOT decided here — they live in the `providers`
// DB table (editable from the admin panel) and are resolved by router.ts.
export const providers: Record<string, ProviderAdapter> = {
  groq: groqProvider,
  gemini: geminiProvider,
  openrouter: openrouterProvider,
}
