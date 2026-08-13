import { AiProvider } from '@prisma/client'
import { LLMProvider } from '../types'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { ClaudeProvider } from './claude'

// ⚡ Bolt: Cache LLM Provider instances at the module level.
// 🎯 Why: Re-instantiating the underlying SDK clients (e.g., OpenAI, Anthropic) on every request
// forces the runtime to tear down and recreate HTTP keep-alive agents.
// 📊 Impact: Reusing clients maintains the TLS connection pool, significantly reducing Time-To-First-Byte (TTFB) latency.
const instances: Partial<Record<AiProvider, LLMProvider>> = {}

export function getLLMProvider(provider: AiProvider): LLMProvider {
  if (instances[provider]) {
    return instances[provider] as LLMProvider
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

  instances[provider] = instance
  return instance
}

export * from './openai'
export * from './gemini'
export * from './claude'
