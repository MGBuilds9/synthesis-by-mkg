import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { getLLMProvider, OpenAIProvider, ClaudeProvider, GeminiProvider } from '@/lib/providers/llm'

// Mock the SDK modules
vi.mock('openai', () => {
  return {
    default: class OpenAI {
      chat = {
        completions: {
          create: vi.fn()
        }
      }
    }
  }
})

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class Anthropic {
      messages = {
        create: vi.fn(),
        stream: vi.fn()
      }
    }
  }
})

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class GoogleGenerativeAI {
      getGenerativeModel = vi.fn()
    }
  }
})

describe('LLM Provider Factory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = 'test-openai-key'
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
    process.env.GEMINI_API_KEY = 'test-gemini-key'
  })

  describe('getLLMProvider', () => {
    it('should return OpenAIProvider for OPENAI provider', () => {
      const provider = getLLMProvider('OPENAI' as any)
      expect(provider).toBeInstanceOf(OpenAIProvider)
    })

    it('should return ClaudeProvider for CLAUDE provider', () => {
      const provider = getLLMProvider('CLAUDE' as any)
      expect(provider).toBeInstanceOf(ClaudeProvider)
    })

    it('should return GeminiProvider for GEMINI provider', () => {
      const provider = getLLMProvider('GEMINI' as any)
      expect(provider).toBeInstanceOf(GeminiProvider)
    })

    it('should throw error for unsupported provider', () => {
      expect(() => getLLMProvider('INVALID' as any)).toThrow('Unsupported AI provider: INVALID')
    })
  })
})

describe('OpenAIProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call OpenAI constructor with API key', () => {
    const provider = new OpenAIProvider('test-api-key')
    expect(provider).toBeInstanceOf(OpenAIProvider)
  })

  it('should call completions.create with correct params', async () => {
    const provider = new OpenAIProvider('test-key')
    const mockCreate = vi.spyOn(provider['client'].chat.completions, 'create')
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Test response' } }]
    } as any)

    const messages = [
      { role: 'user' as const, content: 'Hello' }
    ]

    const result = await provider.chat(messages)

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-4o-mini',
      messages: messages
    })
    expect(result).toBe('Test response')
  })

  it('should use custom model when provided', async () => {
    const provider = new OpenAIProvider('test-key')
    const mockCreate = vi.spyOn(provider['client'].chat.completions, 'create')
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Response' } }]
    } as any)

    await provider.chat([{ role: 'user' as const, content: 'Hi' }], 'gpt-4')

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hi' }]
    })
  })

  it('should prepend system message when systemPrompt provided', async () => {
    const provider = new OpenAIProvider('test-key')
    const mockCreate = vi.spyOn(provider['client'].chat.completions, 'create')
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Response' } }]
    } as any)

    const messages = [{ role: 'user' as const, content: 'Hello' }]

    await provider.chat(messages, 'gpt-4o-mini', 'You are a helpful assistant')

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' }
      ]
    })
  })

  it('should return empty string if no content in response', async () => {
    const provider = new OpenAIProvider('test-key')
    const mockCreate = vi.spyOn(provider['client'].chat.completions, 'create')
    mockCreate.mockResolvedValue({
      choices: [{ message: {} }]
    } as any)

    const result = await provider.chat([{ role: 'user' as const, content: 'Hi' }])

    expect(result).toBe('')
  })

  it('should handle streaming responses', async () => {
    const provider = new OpenAIProvider('test-key')
    const mockCreate = vi.spyOn(provider['client'].chat.completions, 'create')

    const mockStream = {
      async *[Symbol.asyncIterator]() {
        yield { choices: [{ delta: { content: 'Hello' } }] }
        yield { choices: [{ delta: { content: ' world' } }] }
        yield { choices: [{ delta: {} }] }
      }
    }

    mockCreate.mockResolvedValue(mockStream as any)

    const messages = [{ role: 'user' as const, content: 'Hi' }]

    const chunks: string[] = []
    for await (const chunk of provider.streamChat(messages)) {
      chunks.push(chunk)
    }

    expect(chunks).toEqual(['Hello', ' world'])
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-4o-mini',
      messages: messages,
      stream: true
    })
  })
})

describe('ClaudeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call Anthropic constructor with API key', () => {
    const provider = new ClaudeProvider('test-api-key')
    expect(provider).toBeInstanceOf(ClaudeProvider)
  })

  it('should filter out system messages and pass system as separate param', async () => {
    const provider = new ClaudeProvider('test-key')
    const mockCreate = vi.spyOn(provider['client'].messages, 'create')
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Test response' }]
    } as any)

    const messages = [
      { role: 'system' as const, content: 'System prompt' },
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi there' }
    ]

    const result = await provider.chat(messages, undefined, 'You are helpful')

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: 'You are helpful',
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' }
      ]
    })
    expect(result).toBe('Test response')
  })

  it('should use custom model when provided', async () => {
    const provider = new ClaudeProvider('test-key')
    const mockCreate = vi.spyOn(provider['client'].messages, 'create')
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Response' }]
    } as any)

    await provider.chat([{ role: 'user' as const, content: 'Hi' }], 'claude-3-opus-20240229')

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      system: undefined,
      messages: [{ role: 'user', content: 'Hi' }]
    })
  })

  it('should return empty string for non-text content', async () => {
    const provider = new ClaudeProvider('test-key')
    const mockCreate = vi.spyOn(provider['client'].messages, 'create')
    mockCreate.mockResolvedValue({
      content: [{ type: 'image', source: {} }]
    } as any)

    const result = await provider.chat([{ role: 'user' as const, content: 'Hi' }])

    expect(result).toBe('')
  })

  it('should return text from first content block', async () => {
    const provider = new ClaudeProvider('test-key')
    const mockCreate = vi.spyOn(provider['client'].messages, 'create')
    mockCreate.mockResolvedValue({
      content: [
        { type: 'text', text: 'First response' },
        { type: 'text', text: 'Second response' }
      ]
    } as any)

    const result = await provider.chat([{ role: 'user' as const, content: 'Hi' }])

    expect(result).toBe('First response')
  })
})

describe('GeminiProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call GoogleGenerativeAI constructor with API key', () => {
    const provider = new GeminiProvider('test-api-key')
    expect(provider).toBeInstanceOf(GeminiProvider)
  })

  it('should map assistant role to model and use startChat', async () => {
    const provider = new GeminiProvider('test-key')
    const mockSendMessage = vi.fn().mockResolvedValue({
      response: {
        text: () => 'Test response'
      }
    })
    const mockStartChat = vi.fn().mockReturnValue({
      sendMessage: mockSendMessage
    })
    const mockGetModel = vi.spyOn(provider['client'], 'getGenerativeModel')
    mockGetModel.mockReturnValue({
      startChat: mockStartChat
    } as any)

    const messages = [
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi there' },
      { role: 'user' as const, content: 'How are you?' }
    ]

    const result = await provider.chat(messages)

    expect(mockGetModel).toHaveBeenCalledWith({ model: 'gemini-pro' })
    expect(mockStartChat).toHaveBeenCalledWith({
      history: [
        { role: 'user', parts: [{ text: 'Hello' }] },
        { role: 'model', parts: [{ text: 'Hi there' }] }
      ],
      systemInstruction: undefined
    })
    expect(mockSendMessage).toHaveBeenCalledWith('How are you?')
    expect(result).toBe('Test response')
  })

  it('should use custom model when provided', async () => {
    const provider = new GeminiProvider('test-key')
    const mockGetModel = vi.spyOn(provider['client'], 'getGenerativeModel')
    mockGetModel.mockReturnValue({
      startChat: vi.fn().mockReturnValue({
        sendMessage: vi.fn().mockResolvedValue({
          response: { text: () => 'Response' }
        })
      })
    } as any)

    await provider.chat([{ role: 'user' as const, content: 'Hi' }], 'gemini-pro-vision')

    expect(mockGetModel).toHaveBeenCalledWith({ model: 'gemini-pro-vision' })
  })

  it('should pass systemPrompt as systemInstruction', async () => {
    const provider = new GeminiProvider('test-key')
    const mockStartChat = vi.fn().mockReturnValue({
      sendMessage: vi.fn().mockResolvedValue({
        response: { text: () => 'Response' }
      })
    })
    const mockGetModel = vi.spyOn(provider['client'], 'getGenerativeModel')
    mockGetModel.mockReturnValue({
      startChat: mockStartChat
    } as any)

    const messages = [{ role: 'user' as const, content: 'Hello' }]

    await provider.chat(messages, 'gemini-pro', 'You are helpful')

    expect(mockStartChat).toHaveBeenCalledWith({
      history: [],
      systemInstruction: 'You are helpful'
    })
  })

  it('should use history slice excluding last message', async () => {
    const provider = new GeminiProvider('test-key')
    const mockSendMessage = vi.fn().mockResolvedValue({
      response: { text: () => 'Response' }
    })
    const mockStartChat = vi.fn().mockReturnValue({
      sendMessage: mockSendMessage
    })
    const mockGetModel = vi.spyOn(provider['client'], 'getGenerativeModel')
    mockGetModel.mockReturnValue({
      startChat: mockStartChat
    } as any)

    const messages = [
      { role: 'user' as const, content: 'First' },
      { role: 'assistant' as const, content: 'Second' },
      { role: 'user' as const, content: 'Third' },
      { role: 'assistant' as const, content: 'Fourth' },
      { role: 'user' as const, content: 'Fifth' }
    ]

    await provider.chat(messages)

    expect(mockStartChat).toHaveBeenCalledWith({
      history: [
        { role: 'user', parts: [{ text: 'First' }] },
        { role: 'model', parts: [{ text: 'Second' }] },
        { role: 'user', parts: [{ text: 'Third' }] },
        { role: 'model', parts: [{ text: 'Fourth' }] }
      ],
      systemInstruction: undefined
    })
    expect(mockSendMessage).toHaveBeenCalledWith('Fifth')
  })
})
