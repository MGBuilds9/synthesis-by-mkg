import { AiProvider } from '@prisma/client'
import { LLMProvider } from '../types'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { ClaudeProvider } from './claude'

// Bolt: Cache provider instances at the module level to reuse underlying HTTP keep-alive agents
// and significantly reduce TLS handshake latency (TTFB) across API requests.
const providerCache = new Map<AiProvider, LLMProvider>()

export function resetProviderCache() {
  providerCache.clear()
}

export function getLLMProvider(provider: AiProvider): LLMProvider {
  if (providerCache.has(provider)) {
    return providerCache.get(provider)!
  }

  let instance: LLMProvider
  switch (provider) {
    case 'OPENAI':
      instance = new OpenAIProvider(process.env.OPENAI_API_KEY || '')
      break
    case 'GEMINI':
      instance = new GeminiProvider(process.env.GEMINI_API_KEY || '')
      break
    case 'CLAUDE':
      instance = new ClaudeProvider(process.env.ANTHROPIC_API_KEY || '')
      break
    default:
      throw new Error(`Unsupported AI provider: ${provider}`)
  }

  providerCache.set(provider, instance)
  return instance
}

export * from './openai'
export * from './gemini'
export * from './claude'
