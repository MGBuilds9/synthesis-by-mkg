import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/messages/list/route'

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    messageThread: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    connectedAccount: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// Mock the rate limiter
const { mockCheck } = vi.hoisted(() => ({
  mockCheck: vi.fn(),
}))

vi.mock('@/lib/ratelimit', () => ({
  rateLimiter: {
    check: mockCheck
  }
}))

import { getServerSession } from 'next-auth'

describe('GET /api/messages/list - Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)
    // Default mock implementation
    mockCheck.mockReturnValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: 1234567890
    })
  })

  function createRequest(): NextRequest {
    return new NextRequest('http://localhost/api/messages/list', { method: 'GET' })
  }

  it('checks rate limit for the user', async () => {
    const request = createRequest()
    await GET(request)

    expect(mockCheck).toHaveBeenCalledWith('user-123')
  })

  it('returns 429 when rate limit is exceeded', async () => {
    mockCheck.mockReturnValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 1234567890
    })

    const request = createRequest()
    const response = await GET(request)

    expect(response.status).toBe(429)
    const data = await response.json()
    expect(data.error).toBe('Too many requests')
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(response.headers.get('X-RateLimit-Reset')).toBe('1234567890')
  })
})
