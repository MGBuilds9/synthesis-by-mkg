import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/messages/list/route'
import { rateLimiter } from '@/lib/ratelimit'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

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
    prune: vi.fn(),
  },
}))

describe('GET /api/messages/list - Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)
    vi.mocked(prisma.connectedAccount.findMany).mockResolvedValue([
      { id: 'account-1' },
    ] as any)
    vi.mocked(prisma.messageThread.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.count).mockResolvedValue(0)

    // Default rate limit pass
    vi.mocked(rateLimiter.check).mockReturnValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 1234567890
    })
  })

  function createRequest(searchParams: Record<string, string> = {}): NextRequest {
    const params = new URLSearchParams(searchParams)
    const url = `http://localhost/api/messages/list${params.toString() ? '?' + params.toString() : ''}`
    return new NextRequest(url, { method: 'GET' })
  }

  it('calls rateLimiter.check with user ID', async () => {
    const request = createRequest()
    await GET(request)

    expect(rateLimiter.check).toHaveBeenCalledWith('user-123')
  })

  it('returns 429 Too Many Requests when rate limit is exceeded', async () => {
    vi.mocked(rateLimiter.check).mockReturnValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 1234567890
    })

    const request = createRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('Too many requests')
    expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(response.headers.get('X-RateLimit-Reset')).toBe('1234567890')
  })

  it('returns 200 OK when rate limit allows', async () => {
    const request = createRequest()
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(rateLimiter.check).toHaveBeenCalled()
    // Headers should also be set on success
    expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('59')
    expect(response.headers.get('X-RateLimit-Reset')).toBe('1234567890')
  })
})
