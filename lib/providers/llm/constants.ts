import { AiProvider } from '@prisma/client'

export const ALLOWED_MODELS: Record<AiProvider, string[]> = {
  OPENAI: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo'
  ],
  GEMINI: [
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-pro',
    'gemini-pro-vision'
  ],
  CLAUDE: [
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ]
}

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  OPENAI: 'gpt-4o-mini',
  GEMINI: 'gemini-1.5-flash',
  CLAUDE: 'claude-3-5-sonnet-20241022'
}
