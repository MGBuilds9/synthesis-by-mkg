import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/ai/chat/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
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

describe('POST /api/ai/chat - Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('prevents IDOR: user cannot access another user\'s chat session', async () => {
    // Authenticate as User A
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-A' },
    } as any)

    // Mock DB to return a session belonging to User B
    const mockSession = {
      id: 'session-user-B',
      userId: 'user-B', // Different user!
      provider: 'OPENAI',
      model: 'gpt-4',
      messages: [],
    }

    vi.mocked(prisma.aiChatSession.findUnique).mockResolvedValue(mockSession as any)

    // Mock aiMessage.create to return a promise (so .catch works)
    vi.mocked(prisma.aiMessage.create).mockResolvedValue({} as any)
    vi.mocked(getLLMProvider).mockReturnValue({ chat: vi.fn().mockResolvedValue('response') } as any)

    const request = createRequest({
      sessionId: 'session-user-B',
      message: 'Hello',
      provider: 'OPENAI',
    })

    const response = await POST(request)
    const data = await response.json()

    // Expect 403 Forbidden (or 401 Unauthorized if simpler, but 403 is more correct for authorized user accessing unauthorized resource)
    // Currently, this test will FAIL because the implementation returns 200.
    // I am writing the test to assert the DESIRED behavior.
    expect(response.status).toBe(403)
    expect(data.error).toBe('Unauthorized')
  })
})
