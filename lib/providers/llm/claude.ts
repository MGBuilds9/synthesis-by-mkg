import Anthropic from '@anthropic-ai/sdk'
import { LLMProvider, ChatMessage } from '../types'

export class ClaudeProvider implements LLMProvider {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async chat(messages: ChatMessage[], model = 'claude-3-5-sonnet-20241022', systemPrompt?: string): Promise<string> {
    const formattedMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

    const response = await this.client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: formattedMessages,
    })

    const content = response.content[0]
    return content.type === 'text' ? content.text : ''
  }

  async *streamChat(messages: ChatMessage[], model = 'claude-3-5-sonnet-20241022', systemPrompt?: string): AsyncGenerator<string> {
    const formattedMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

    const stream = await this.client.messages.stream({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: formattedMessages,
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text
      }
    }
  }
}
