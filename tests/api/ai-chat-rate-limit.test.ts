import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist the mock function so it can be used in vi.mock
const { mockCheck } = vi.hoisted(() => {
  return { mockCheck: vi.fn() }
})

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

// Mock RateLimiter
vi.mock('@/lib/ratelimit', () => ({
  chatRateLimiter: {
    check: mockCheck
  }
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { getLLMProvider } from '@/lib/providers/llm'

describe('POST /api/ai/chat - Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows request when rate limit check succeeds', async () => {
    // Mock user
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    // Mock rate limit success
    mockCheck.mockReturnValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000
    })

    // Mock session and message creation (so it proceeds to completion)
    vi.mocked(prisma.aiChatSession.findUnique).mockResolvedValue({
      id: 'session-1',
      userId: 'user-123',
      messages: [],
    } as any)
    vi.mocked(prisma.aiMessage.create).mockResolvedValue({} as any)
    vi.mocked(getLLMProvider).mockReturnValue({
      chat: vi.fn().mockResolvedValue('Response'),
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
    expect(response.status).toBe(200)
    expect(mockCheck).toHaveBeenCalledWith('user-123')
  })

  it('blocks request when rate limit check fails', async () => {
    // Mock user
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    // Mock rate limit failure
    mockCheck.mockReturnValue({
      success: false, // Fails
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60000
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
    expect(response.status).toBe(429)
    const data = await response.json()
    expect(data.error).toBe('Too many requests')

    // Verify headers
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    // Reset header is present
    expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })
})
