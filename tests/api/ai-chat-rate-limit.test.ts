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

vi.mock('@/lib/ratelimit', () => ({
  chatRateLimiter: {
    check: vi.fn(),
  },
}))

import { getServerSession } from 'next-auth'
import { chatRateLimiter } from '@/lib/ratelimit'

describe('POST /api/ai/chat - Rate Limit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 429 when rate limit is exceeded', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    vi.mocked(chatRateLimiter.check).mockReturnValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 123456789,
    })

    const request = new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'session-1',
        message: 'Hello',
        provider: 'OPENAI',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('Too many requests')
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(response.headers.get('X-RateLimit-Reset')).toBe('123456789')
  })
})
