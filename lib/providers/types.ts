export interface LLMProvider {
  chat(messages: ChatMessage[], model?: string, systemPrompt?: string): Promise<string>
  streamChat?(messages: ChatMessage[], model?: string, systemPrompt?: string): AsyncGenerator<string>
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}
