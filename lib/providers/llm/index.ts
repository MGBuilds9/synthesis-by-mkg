import { AiProvider } from '@prisma/client'
import { LLMProvider } from '../types'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { ClaudeProvider } from './claude'

// Bolt: Cache SDK client instances at the module level to reuse HTTP keep-alive agents
// and reduce TLS handshake latency across requests.
const providerCache: Partial<Record<AiProvider, LLMProvider>> = {}

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

export function resetProviderCache(): void {
  for (const key of Object.keys(providerCache)) {
    delete providerCache[key as AiProvider]
  }
}

export * from './openai'
export * from './gemini'
export * from './claude'
