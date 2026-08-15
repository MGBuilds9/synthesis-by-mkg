import { AiProvider } from '@prisma/client'
import { LLMProvider } from '../types'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { ClaudeProvider } from './claude'

// Cache external SDK client instances at the module level rather than instantiating per-request.
// This allows reuse of underlying HTTP keep-alive agents and significantly reduces TLS handshake latency (TTFB).
let providerCache: Partial<Record<AiProvider, LLMProvider>> = {}

export function resetProviderCache() {
  providerCache = {}
}

export function getLLMProvider(provider: AiProvider): LLMProvider {
  if (providerCache[provider]) {
    return providerCache[provider]!
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

  providerCache[provider] = instance
  return instance
}

export * from './openai'
export * from './gemini'
export * from './claude'
