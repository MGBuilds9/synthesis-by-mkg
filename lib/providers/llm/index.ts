import { AiProvider } from '@prisma/client'
import { LLMProvider } from '../types'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { ClaudeProvider } from './claude'

// Cache instances of LLM providers to avoid repeated instantiation of SDK clients
// per-request. This significantly reduces TLS handshake latency (TTFB) in serverless environments.
const providerCache = new Map<AiProvider, LLMProvider>()

export function resetProviderCache() {
  providerCache.clear()
}

export function getLLMProvider(provider: AiProvider): LLMProvider {
  if (!providerCache.has(provider)) {
    switch (provider) {
      case 'OPENAI':
        providerCache.set(provider, new OpenAIProvider(process.env.OPENAI_API_KEY || ''))
        break
      case 'GEMINI':
        providerCache.set(provider, new GeminiProvider(process.env.GEMINI_API_KEY || ''))
        break
      case 'CLAUDE':
        providerCache.set(provider, new ClaudeProvider(process.env.ANTHROPIC_API_KEY || ''))
        break
      default:
        throw new Error(`Unsupported AI provider: ${provider}`)
    }
  }
  return providerCache.get(provider)!
}

export * from './openai'
export * from './gemini'
export * from './claude'
