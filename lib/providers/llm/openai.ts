import OpenAI from 'openai'
import { LLMProvider, ChatMessage } from '../types'

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async chat(messages: ChatMessage[], model = 'gpt-4o-mini', systemPrompt?: string): Promise<string> {
    const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages

    const response = await this.client.chat.completions.create({
      model,
      messages: formattedMessages,
    })

    return response.choices[0]?.message?.content || ''
  }

  async *streamChat(messages: ChatMessage[], model = 'gpt-4o-mini', systemPrompt?: string): AsyncGenerator<string> {
    const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages

    const stream = await this.client.chat.completions.create({
      model,
      messages: formattedMessages,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }
}
