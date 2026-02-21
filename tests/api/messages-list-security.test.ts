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

// Sentinel: Mock rate limiter
vi.mock('@/lib/ratelimit', () => ({
  rateLimiter: {
    check: vi.fn(),
  },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { rateLimiter } from '@/lib/ratelimit'

describe('GET /api/messages/list - Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)
    vi.mocked(prisma.connectedAccount.findMany).mockResolvedValue([
      { id: 'account-1' },
    ] as any)

    // Default: allow request
    vi.mocked(rateLimiter.check).mockReturnValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60000,
    })
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

  it('enforces rate limiting', async () => {
    vi.mocked(rateLimiter.check).mockReturnValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: Date.now() + 60000,
    })

    const request = createRequest()
    const response = await GET(request)

    expect(response.status).toBe(429)
    const data = await response.json()
    expect(data.error).toBe('Too many requests')
    expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
  })
})
