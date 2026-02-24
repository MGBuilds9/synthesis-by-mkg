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

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}))

// Mock Rate Limiter
vi.mock('@/lib/ratelimit', () => ({
  rateLimiter: {
    check: vi.fn(),
  },
}))

import { getServerSession } from 'next-auth'
import { rateLimiter } from '@/lib/ratelimit'

describe('GET /api/messages/list - Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)
  })

  function createRequest(): NextRequest {
    return new NextRequest('http://localhost/api/messages/list', { method: 'GET' })
  }

  it('returns 429 Too Many Requests when rate limit is exceeded', async () => {
    // Mock rate limiter to fail
    vi.mocked(rateLimiter.check).mockReturnValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60000,
    })

    const request = createRequest()
    const response = await GET(request)

    expect(response.status).toBe(429)
    const body = await response.json()
    expect(body.error).toBe('Too many requests')

    // Check headers
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
  })

  it('allows request when rate limit is not exceeded', async () => {
    // Mock rate limiter to succeed
    vi.mocked(rateLimiter.check).mockReturnValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
    })

    // Mock Prisma behavior for success path
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.connectedAccount.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.count).mockResolvedValue(0)

    const request = createRequest()
    const response = await GET(request)

    expect(response.status).toBe(200)
    // Should call rate limiter check
    expect(rateLimiter.check).toHaveBeenCalledWith('user-123')
  })
})
