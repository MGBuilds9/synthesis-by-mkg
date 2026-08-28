import { AiProvider } from '@prisma/client'
import { LLMProvider } from '../types'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { ClaudeProvider } from './claude'

// ⚡ Bolt Performance Optimization:
// Cache provider instances at the module level to reuse underlying HTTP keep-alive agents.
// This prevents dropping the connection and forcing a new TLS handshake for every single LLM request,
// reducing TTFB (Time to First Byte) latency significantly in serverless environments.
const providerCache = new Map<AiProvider, LLMProvider>()

export function getLLMProvider(provider: AiProvider): LLMProvider {
  if (providerCache.has(provider)) {
    return providerCache.get(provider)!
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

  providerCache.set(provider, newProvider)
  return newProvider
}

export function resetProviderCache(): void {
  providerCache.clear()
}

export * from './openai'
export * from './gemini'
export * from './claude'
