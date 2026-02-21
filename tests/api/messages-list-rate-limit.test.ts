import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/messages/list/route'
import { rateLimiter } from '@/lib/ratelimit'

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

vi.mock('@/lib/ratelimit', () => ({
  rateLimiter: {
    check: vi.fn(),
  },
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

describe('GET /api/messages/list - Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)
    vi.mocked(prisma.connectedAccount.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.count).mockResolvedValue(0)

    // Default to success
    vi.mocked(rateLimiter.check).mockReturnValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
    })
  })

  function createRequest(): NextRequest {
    return new NextRequest('http://localhost/api/messages/list', { method: 'GET' })
  }

  it('enforces rate limits', async () => {
    // Simulate rate limit exceeded
    vi.mocked(rateLimiter.check).mockReturnValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60000,
    })

    const response = await GET(createRequest())

    expect(rateLimiter.check).toHaveBeenCalledWith('user-123')
    expect(response.status).toBe(429)

    const data = await response.json()
    expect(data.error).toBe('Too many requests')
  })

  it('sets rate limit headers on success', async () => {
    const response = await GET(createRequest())

    expect(rateLimiter.check).toHaveBeenCalledWith('user-123')
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('9')
  })
})
