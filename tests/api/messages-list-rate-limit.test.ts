import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../../app/api/messages/list/route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { rateLimiter } from '@/lib/ratelimit'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock rate limiter
vi.mock('@/lib/ratelimit', () => ({
  rateLimiter: {
    check: vi.fn(),
  },
}))

// Mock prisma to avoid DB calls
vi.mock('@/lib/prisma', () => ({
  prisma: {
    connectedAccount: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    messageThread: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}))

describe('GET /api/messages/list Rate Limiting', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user1' },
    })
  })

  it('checks rate limit for authenticated user', async () => {
    ;(rateLimiter.check as any).mockReturnValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: 123456789,
    })

    const req = new NextRequest('http://localhost/api/messages/list')
    await GET(req)

    expect(rateLimiter.check).toHaveBeenCalledWith('user1')
  })

  it('returns 429 when rate limit exceeded', async () => {
    ;(rateLimiter.check as any).mockReturnValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 123456789,
    })

    const req = new NextRequest('http://localhost/api/messages/list')
    const res = await GET(req)

    expect(res.status).toBe(429)
    const data = await res.json()
    expect(data.error).toBe('Too many requests')
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0')
  })
})
