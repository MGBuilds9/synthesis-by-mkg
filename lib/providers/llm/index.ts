import { AiProvider } from '@prisma/client'
import { LLMProvider } from '../types'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { ClaudeProvider } from './claude'

// Cache SDK instances at the module level to reuse HTTP keep-alive agents
// across requests. This prevents expensive TLS handshakes on every chat call,
// significantly improving Time to First Byte (TTFB).
let openaiProvider: OpenAIProvider | null = null
let geminiProvider: GeminiProvider | null = null
let claudeProvider: ClaudeProvider | null = null

export function getLLMProvider(provider: AiProvider): LLMProvider {
  switch (provider) {
    case 'OPENAI':
      if (!openaiProvider) openaiProvider = new OpenAIProvider(process.env.OPENAI_API_KEY || '')
      return openaiProvider
    case 'GEMINI':
      if (!geminiProvider) geminiProvider = new GeminiProvider(process.env.GEMINI_API_KEY || '')
      return geminiProvider
    case 'CLAUDE':
      if (!claudeProvider) claudeProvider = new ClaudeProvider(process.env.ANTHROPIC_API_KEY || '')
      return claudeProvider
    default:
      throw new Error(`Unsupported AI provider: ${provider}`)
  }
}

export * from './openai'
export * from './gemini'
export * from './claude'
