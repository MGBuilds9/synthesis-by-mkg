import { AiProvider } from '@prisma/client'
import { LLMProvider } from '../types'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { ClaudeProvider } from './claude'

// Cache provider instances to reuse underlying HTTP keep-alive agents
// and significantly reduce TLS handshake latency (TTFB) across API requests
let providerCache: Partial<Record<AiProvider, LLMProvider>> = {}

export function getLLMProvider(provider: AiProvider): LLMProvider {
  if (providerCache[provider]) {
    return providerCache[provider] as LLMProvider
  }

  let llmProvider: LLMProvider
  switch (provider) {
    case 'OPENAI':
      llmProvider = new OpenAIProvider(process.env.OPENAI_API_KEY || '')
      break
    case 'GEMINI':
      llmProvider = new GeminiProvider(process.env.GEMINI_API_KEY || '')
      break
    case 'CLAUDE':
      llmProvider = new ClaudeProvider(process.env.ANTHROPIC_API_KEY || '')
      break
    default:
      throw new Error(`Unsupported AI provider: ${provider}`)
  }

  providerCache[provider] = llmProvider
  return llmProvider
}

export function resetProviderCache() {
  providerCache = {}
}

export * from './openai'
export * from './gemini'
export * from './claude'
