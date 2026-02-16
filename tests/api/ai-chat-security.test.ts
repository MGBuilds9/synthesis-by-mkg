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

// Bolt: Mock rate limiter
vi.mock('@/lib/ratelimit', () => ({
  chatRateLimiter: {
    check: vi.fn(),
  },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { getLLMProvider } from '@/lib/providers/llm'
import { chatRateLimiter } from '@/lib/ratelimit'

describe('POST /api/ai/chat - Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.aiMessage.count).mockResolvedValue(0)
    // Default: allow requests
    vi.mocked(chatRateLimiter.check).mockReturnValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
    })
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

  it('prevents IDOR: accessing another user\'s session returns 403/404', async () => {
    // Current user (Attacker)
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'attacker-123' },
    } as any)

    // Existing session belonging to another user (Victim)
    const mockVictimSession = {
      id: 'session-victim',
      userId: 'victim-456', // Different user!
      provider: 'OPENAI',
      model: 'gpt-4',
      messages: [
        { id: 'msg-1', role: 'user', content: 'My secret data' },
      ],
    }

    vi.mocked(prisma.aiChatSession.findUnique).mockResolvedValue(mockVictimSession as any)

    // Mock other calls to simulate successful execution if check fails
    vi.mocked(prisma.aiMessage.create).mockResolvedValue({} as any)
    const mockLLMProvider = {
      chat: vi.fn().mockResolvedValue('I see the secret data'),
    }
    vi.mocked(getLLMProvider).mockReturnValue(mockLLMProvider)

    const request = createRequest({
      sessionId: 'session-victim',
      message: 'Steal data',
      provider: 'OPENAI',
      model: 'gpt-4',
    })

    const response = await POST(request)

    // We expect this to fail (return 403 or 404), but currently it returns 200
    // So if the vulnerability exists, status will be 200.
    // We want to assert that it is NOT 200.

    if (response.status === 200) {
      // Vulnerability confirmed! The test "fails" to be secure.
      // But for the purpose of TDD, I want this test to fail so I can fix it.
      // So expectation: status should be 403 or 404.
    }

    expect([403, 404]).toContain(response.status)
  })

  it('enforces rate limiting: returns 429 when user exceeds message limit', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'spammer-123' },
    } as any)

    // Mock rate limiter failure
    vi.mocked(chatRateLimiter.check).mockReturnValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60000,
    })

    // Mock valid session ownership
    vi.mocked(prisma.aiChatSession.findUnique).mockResolvedValue({
      id: 'session-spam',
      userId: 'spammer-123',
      messages: [],
    } as any)

    const request = createRequest({
      sessionId: 'session-spam',
      message: 'Spam',
      provider: 'OPENAI',
      model: 'gpt-4',
    })

    const response = await POST(request)

    // Should be 429
    expect(response.status).toBe(429)

    const data = await response.json()
    expect(data.error).toBe('Too many requests')
  })

  it('validates input: returns 400 when message is too long', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'attacker-123' },
    } as any)

    // Mock valid session ownership
    vi.mocked(prisma.aiChatSession.findUnique).mockResolvedValue({
      id: 'session-overflow',
      userId: 'attacker-123',
      messages: [],
    } as any)

    const longMessage = 'a'.repeat(5001)

    const request = createRequest({
      sessionId: 'session-overflow',
      message: longMessage,
      provider: 'OPENAI',
      model: 'gpt-4',
    })

    const response = await POST(request)

    expect(response.status).toBe(400)

    const data = await response.json()
    // Expect detailed validation error
    expect(data.error).toBe('Invalid request')
  })
})
