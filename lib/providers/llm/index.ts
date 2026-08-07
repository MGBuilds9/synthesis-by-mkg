import { AiProvider } from '@prisma/client'
import { LLMProvider } from '../types'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { ClaudeProvider } from './claude'

// Bolt: Cache external SDK client instances at the module level rather than instantiating them per-request.
// This allows the reuse of underlying HTTP keep-alive agents and significantly reduces TLS handshake latency (TTFB).
let openaiProvider: OpenAIProvider | null = null
let geminiProvider: GeminiProvider | null = null
let claudeProvider: ClaudeProvider | null = null

export function getLLMProvider(provider: AiProvider): LLMProvider {
  switch (provider) {
    case 'OPENAI':
      if (!openaiProvider) {
        openaiProvider = new OpenAIProvider(process.env.OPENAI_API_KEY || '')
      }
      return openaiProvider
    case 'GEMINI':
      if (!geminiProvider) {
        geminiProvider = new GeminiProvider(process.env.GEMINI_API_KEY || '')
      }
      return geminiProvider
    case 'CLAUDE':
      if (!claudeProvider) {
        claudeProvider = new ClaudeProvider(process.env.ANTHROPIC_API_KEY || '')
      }
      return claudeProvider
    default:
      throw new Error(`Unsupported AI provider: ${provider}`)
  }
}

export * from './openai'
export * from './gemini'
export * from './claude'
