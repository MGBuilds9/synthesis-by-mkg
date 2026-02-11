import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/ai/chat/route'

// Mock dependencies
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

describe('POST /api/ai/chat - Rate Limit Fail Closed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fails closed: returns 503 when rate limit check (DB) fails', async () => {
    // 1. Mock authenticated user
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    // 2. Mock DB failure for count (rate limit check)
    // This simulates a database outage or transient error
    vi.mocked(prisma.aiMessage.count).mockRejectedValue(new Error('DB Connection Failed'))

    // 3. Mock subsequent calls to succeed if the check fails open
    // If the vulnerability exists (Fail Open), code proceeds to findUnique
    vi.mocked(prisma.aiChatSession.findUnique).mockResolvedValue({
      id: 'session-1',
      userId: 'user-123',
      messages: [],
    } as any)

    // Mock message creation
    vi.mocked(prisma.aiMessage.create).mockResolvedValue({} as any)

    // Mock LLM provider
    const mockLLMProvider = {
      chat: vi.fn().mockResolvedValue('I am working despite the error'),
    }
    vi.mocked(getLLMProvider).mockReturnValue(mockLLMProvider)

    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'session-1',
        message: 'Hello',
        provider: 'OPENAI',
      }),
    })

    const response = await POST(request)

    // Verify fail-closed behavior
    expect(response.status).toBe(503)
    const data = await response.json()
    expect(data.error).toBe('Service temporarily unavailable')
  })
})
