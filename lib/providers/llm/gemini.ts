import { GoogleGenerativeAI } from '@google/generative-ai'
import { LLMProvider, ChatMessage } from '../types'

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey)
  }

  async chat(messages: ChatMessage[], model = 'gemini-pro', systemPrompt?: string): Promise<string> {
    const genModel = this.client.getGenerativeModel({ model })

    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    const chat = genModel.startChat({
      history: formattedMessages.slice(0, -1),
      systemInstruction: systemPrompt,
    })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(lastMessage.content)
    return result.response.text()
  }

  async *streamChat(messages: ChatMessage[], model = 'gemini-pro', systemPrompt?: string): AsyncGenerator<string> {
    const genModel = this.client.getGenerativeModel({ model })

    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    const chat = genModel.startChat({
      history: formattedMessages.slice(0, -1),
      systemInstruction: systemPrompt,
    })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessageStream(lastMessage.content)

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) {
        yield text
      }
    }
  }
}
