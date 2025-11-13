import { AiProvider } from '@prisma/client'
import { LLMProvider } from '../types'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { ClaudeProvider } from './claude'

export function getLLMProvider(provider: AiProvider): LLMProvider {
  switch (provider) {
    case 'OPENAI':
      return new OpenAIProvider(process.env.OPENAI_API_KEY || '')
    case 'GEMINI':
      return new GeminiProvider(process.env.GEMINI_API_KEY || '')
    case 'CLAUDE':
      return new ClaudeProvider(process.env.ANTHROPIC_API_KEY || '')
    default:
      throw new Error(`Unsupported AI provider: ${provider}`)
  }
}

export * from './openai'
export * from './gemini'
export * from './claude'
