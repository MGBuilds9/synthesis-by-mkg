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

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

describe('GET /api/messages/list - Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Clear the real rate limiter's internal state
    const limiter = rateLimiter as any
    if (limiter.requests) {
      limiter.requests.clear()
    }

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)
    vi.mocked(prisma.connectedAccount.findMany).mockResolvedValue([
      { id: 'account-1' },
    ] as any)
  })

  function createRequest(searchParams: Record<string, string> = {}): NextRequest {
    const params = new URLSearchParams(searchParams)
    const url = `http://localhost/api/messages/list${params.toString() ? '?' + params.toString() : ''}`
    return new NextRequest(url, { method: 'GET' })
  }

  it('caps the limit parameter to 100 when a larger value is requested', async () => {
    vi.mocked(prisma.messageThread.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.count).mockResolvedValue(0)

    const request = createRequest({ limit: '1000' })
    await GET(request)

    expect(prisma.messageThread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100, // Expect capped value
      })
    )
  })

  it('caps the limit parameter to 1 even if negative or zero', async () => {
    vi.mocked(prisma.messageThread.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.count).mockResolvedValue(0)

    const request = createRequest({ limit: '-5' })
    await GET(request)

    expect(prisma.messageThread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 1, // Expect min value
      })
    )
  })

  it('enforces rate limiting returning 429 when limit is exceeded', async () => {
    vi.mocked(prisma.messageThread.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.count).mockResolvedValue(0)

    const userId = 'rate-limited-user'
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: userId },
    } as any)

    const request = createRequest()

    // Send 60 requests (default limit is 60 per minute)
    for (let i = 0; i < 60; i++) {
      const res = await GET(request)
      expect(res.status).toBe(200)
    }

    // 61st request should be rate limited
    const rateLimitedRes = await GET(request)
    expect(rateLimitedRes.status).toBe(429)

    const data = await rateLimitedRes.json()
    expect(data.error).toBe('Too many requests')

    expect(rateLimitedRes.headers.get('X-RateLimit-Limit')).toBe('60')
    expect(rateLimitedRes.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(rateLimitedRes.headers.has('X-RateLimit-Reset')).toBe(true)
  })
})
