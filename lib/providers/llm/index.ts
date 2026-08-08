import { AiProvider } from '@prisma/client'
import { LLMProvider } from '../types'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { ClaudeProvider } from './claude'

// Bolt: Cache LLM provider instances to reuse underlying HTTP agents and connections.
// This significantly reduces TLS handshake latency (TTFB) for subsequent API calls.
const providerCache = new Map<string, LLMProvider>()

export function getLLMProvider(provider: AiProvider): LLMProvider {
  const cacheKey = provider;

  if (providerCache.has(cacheKey)) {
    return providerCache.get(cacheKey)!;
  }

  let providerInstance: LLMProvider;

  switch (provider) {
    case 'OPENAI':
      providerInstance = new OpenAIProvider(process.env.OPENAI_API_KEY || '')
      break;
    case 'GEMINI':
      providerInstance = new GeminiProvider(process.env.GEMINI_API_KEY || '')
      break;
    case 'CLAUDE':
      providerInstance = new ClaudeProvider(process.env.ANTHROPIC_API_KEY || '')
      break;
    default:
      throw new Error(`Unsupported AI provider: ${provider}`)
  }

  providerCache.set(cacheKey, providerInstance);
  return providerInstance;
}

export * from './openai'
export * from './gemini'
export * from './claude'
