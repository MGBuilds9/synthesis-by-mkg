import { AiProvider } from '@prisma/client'
import { LLMProvider } from '../types'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { ClaudeProvider } from './claude'

// Cache provider instances to reuse underlying HTTP keep-alive agents
// and significantly reduce TLS handshake latency across requests
let openAIProviderInstance: OpenAIProvider | null = null;
let geminiProviderInstance: GeminiProvider | null = null;
let claudeProviderInstance: ClaudeProvider | null = null;

export function getLLMProvider(provider: AiProvider): LLMProvider {
  switch (provider) {
    case 'OPENAI':
      if (!openAIProviderInstance) {
        openAIProviderInstance = new OpenAIProvider(process.env.OPENAI_API_KEY || '');
      }
      return openAIProviderInstance;
    case 'GEMINI':
      if (!geminiProviderInstance) {
        geminiProviderInstance = new GeminiProvider(process.env.GEMINI_API_KEY || '');
      }
      return geminiProviderInstance;
    case 'CLAUDE':
      if (!claudeProviderInstance) {
        claudeProviderInstance = new ClaudeProvider(process.env.ANTHROPIC_API_KEY || '');
      }
      return claudeProviderInstance;
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

export function resetProviderCache(): void {
  openAIProviderInstance = null;
  geminiProviderInstance = null;
  claudeProviderInstance = null;
}

export * from './openai'
export * from './gemini'
export * from './claude'
