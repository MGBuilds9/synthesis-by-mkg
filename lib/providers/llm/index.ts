import { AiProvider } from '@prisma/client'
import { LLMProvider } from '../types'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { ClaudeProvider } from './claude'

// Bolt: Cache LLM instances to avoid repeatedly instantiating clients and underlying HTTP keep-alive agents per-request, significantly reducing TLS handshake latency (TTFB).
let openaiInstance: LLMProvider | null = null
let geminiInstance: LLMProvider | null = null
let claudeInstance: LLMProvider | null = null

export function getLLMProvider(provider: AiProvider): LLMProvider {
  switch (provider) {
    case 'OPENAI':
      if (!openaiInstance) openaiInstance = new OpenAIProvider(process.env.OPENAI_API_KEY || '')
      return openaiInstance
    case 'GEMINI':
      if (!geminiInstance) geminiInstance = new GeminiProvider(process.env.GEMINI_API_KEY || '')
      return geminiInstance
    case 'CLAUDE':
      if (!claudeInstance) claudeInstance = new ClaudeProvider(process.env.ANTHROPIC_API_KEY || '')
      return claudeInstance
    default:
      throw new Error(`Unsupported AI provider: ${provider}`)
  }
}

export * from './openai'
export * from './gemini'
export * from './claude'
