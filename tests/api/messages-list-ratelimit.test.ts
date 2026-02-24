import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/messages/list/route'

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

// Explicitly mock the rate limiter
vi.mock('@/lib/ratelimit', () => ({
  rateLimiter: {
    check: vi.fn(),
  },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { rateLimiter } from '@/lib/ratelimit'

describe('GET /api/messages/list - Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)
    vi.mocked(prisma.connectedAccount.findMany).mockResolvedValue([
      { id: 'acc-1' }
    ] as any)
    vi.mocked(prisma.messageThread.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.count).mockResolvedValue(0)
  })

  function createRequest(): NextRequest {
    return new NextRequest('http://localhost/api/messages/list', { method: 'GET' })
  }

  it('allows request when rate limit is not exceeded', async () => {
    vi.mocked(rateLimiter.check).mockReturnValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    })

    const request = createRequest()
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('59')
    expect(response.headers.get('X-RateLimit-Reset')).toBe('123456789')

    expect(rateLimiter.check).toHaveBeenCalledWith('user-123')
  })

  it('blocks request when rate limit is exceeded', async () => {
    vi.mocked(rateLimiter.check).mockReturnValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 123456789,
    })

    const request = createRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('Too many requests')

    expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(response.headers.get('X-RateLimit-Reset')).toBe('123456789')

    expect(rateLimiter.check).toHaveBeenCalledWith('user-123')
  })
})
