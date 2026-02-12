import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/ai/chat/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { getLLMProvider } from '@/lib/providers/llm'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    aiChatSession: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    aiMessage: {
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('@/lib/providers/llm', () => ({
  getLLMProvider: vi.fn(),
}))

vi.mock('@/lib/context/retrieval', () => ({
  retrieveAIContext: vi.fn(),
  summarizeContext: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

describe('POST /api/ai/chat - Model Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.aiMessage.count).mockResolvedValue(0)
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)
    // Fix: Ensure create returns a Promise to avoid 'undefined.catch' error
    vi.mocked(prisma.aiMessage.create).mockResolvedValue({} as any)
  })

  function createRequest(body: any): NextRequest {
    return new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  it('rejects invalid model for OpenAI provider', async () => {
    // Mock valid session ownership
    vi.mocked(prisma.aiChatSession.findUnique).mockResolvedValue({
      id: 'session-1',
      userId: 'user-123',
      messages: [],
    } as any)

    const request = createRequest({
      sessionId: 'session-1',
      message: 'Hello',
      provider: 'OPENAI',
      model: 'gpt-4-evil-variant', // Invalid model
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid model for the selected provider')
  })

  it('accepts valid model for OpenAI provider', async () => {
    vi.mocked(prisma.aiChatSession.findUnique).mockResolvedValue({
      id: 'session-1',
      userId: 'user-123',
      messages: [],
    } as any)

    // Mock successful LLM call
    const mockLLMProvider = {
      chat: vi.fn().mockResolvedValue('Response from GPT-4o'),
    }
    vi.mocked(getLLMProvider).mockReturnValue(mockLLMProvider)

    const request = createRequest({
      sessionId: 'session-1',
      message: 'Hello',
      provider: 'OPENAI',
      model: 'gpt-4o', // Valid model
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
  })
})
