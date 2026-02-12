import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/ai/chat/route'

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

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { getLLMProvider } from '@/lib/providers/llm'

describe('POST /api/ai/chat - Model Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.aiMessage.count).mockResolvedValue(0)
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

  it('rejects invalid model for provider', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    // Mock valid session ownership
    vi.mocked(prisma.aiChatSession.findUnique).mockResolvedValue({
      id: 'session-valid',
      userId: 'user-123',
      messages: [],
      provider: 'OPENAI',
    } as any)

    // Mock LLM provider so it doesn't crash if executed
    const mockLLMProvider = {
      chat: vi.fn().mockResolvedValue('Response'),
    }
    vi.mocked(getLLMProvider).mockReturnValue(mockLLMProvider)

    const request = createRequest({
      sessionId: 'session-valid',
      message: 'Hello',
      provider: 'OPENAI',
      model: 'invalid-model-hack',
    })

    const response = await POST(request)

    // Expect 400 Bad Request due to model validation failure
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Invalid request')
  })
})
