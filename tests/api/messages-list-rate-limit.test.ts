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

describe('GET /api/messages/list - Rate Limit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear rate limiter state between tests to prevent flakiness
    ;(rateLimiter as any).requests.clear()

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)
  })

  function createRequest(searchParams: Record<string, string> = {}): NextRequest {
    const params = new URLSearchParams(searchParams)
    const url = `http://localhost/api/messages/list${params.toString() ? '?' + params.toString() : ''}`
    return new NextRequest(url, { method: 'GET' })
  }

  it('enforces rate limits per user', async () => {
    // Exhaust rate limit (default is 60)
    for (let i = 0; i < 60; i++) {
      rateLimiter.check('user-123')
    }

    const request = createRequest()
    const response = await GET(request)

    expect(response.status).toBe(429)
    const data = await response.json()
    expect(data.error).toBe('Too many requests')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
  })
})
