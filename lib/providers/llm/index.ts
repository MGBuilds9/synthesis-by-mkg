import { AiProvider } from '@prisma/client'
import { LLMProvider } from '../types'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { ClaudeProvider } from './claude'

// Bolt: Cache provider instances at the module level to reuse underlying HTTP keep-alive agents.
// This avoids instantiating them per-request and significantly reduces TLS handshake latency (TTFB).
const providerCache: Partial<Record<AiProvider, LLMProvider>> = {}

export function getLLMProvider(provider: AiProvider): LLMProvider {
  if (providerCache[provider]) {
    return providerCache[provider] as LLMProvider
  }

  let newProvider: LLMProvider
  switch (provider) {
    case 'OPENAI':
      newProvider = new OpenAIProvider(process.env.OPENAI_API_KEY || '')
      break
    case 'GEMINI':
      newProvider = new GeminiProvider(process.env.GEMINI_API_KEY || '')
      break
    case 'CLAUDE':
      newProvider = new ClaudeProvider(process.env.ANTHROPIC_API_KEY || '')
      break
    default:
      throw new Error(`Unsupported AI provider: ${provider}`)
  }

  providerCache[provider] = newProvider
  return newProvider
}

export function resetProviderCache() {
  for (const key in providerCache) {
    delete providerCache[key as AiProvider]
  }
}

export * from './openai'
export * from './gemini'
export * from './claude'
