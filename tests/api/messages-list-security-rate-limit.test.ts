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

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/ratelimit', () => ({
  rateLimiter: {
    check: vi.fn(),
  },
}))

import { rateLimiter } from '@/lib/ratelimit'

describe('GET /api/messages/list - Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)
  })

  function createRequest(searchParams: Record<string, string> = {}): NextRequest {
    const params = new URLSearchParams(searchParams)
    const url = `http://localhost/api/messages/list${params.toString() ? '?' + params.toString() : ''}`
    return new NextRequest(url, { method: 'GET' })
  }

  it('allows requests within rate limit and sets appropriate headers', async () => {
    vi.mocked(rateLimiter.check).mockReturnValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 1000,
    })

    // Mock DB calls for successful path
    vi.mocked(prisma.connectedAccount.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.count).mockResolvedValue(0)

    const request = createRequest()
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('59')
    expect(response.headers.get('X-RateLimit-Reset')).toBe('1000')
  })

  it('blocks requests exceeding rate limit and sets appropriate headers', async () => {
    vi.mocked(rateLimiter.check).mockReturnValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 1000,
    })

    const request = createRequest()
    const response = await GET(request)

    expect(response.status).toBe(429)
    const data = await response.json()
    expect(data.error).toBe('Too many requests')

    expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(response.headers.get('X-RateLimit-Reset')).toBe('1000')
  })
})
