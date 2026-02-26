import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/messages/list/route'
import { rateLimiter } from '@/lib/ratelimit'

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    messageThread: { findMany: vi.fn(), count: vi.fn() },
    connectedAccount: { findMany: vi.fn() },
  },
}))

vi.mock('@/lib/ratelimit', () => ({
  rateLimiter: {
    check: vi.fn(),
  },
}))

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
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

    // Mock prisma responses to allow successful execution if rate limit passes
    vi.mocked(prisma.connectedAccount.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.count).mockResolvedValue(0)
  })

  it('returns 429 when rate limit is exceeded', async () => {
    // Mock rate limiter failure
    vi.mocked(rateLimiter.check).mockReturnValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: Date.now() + 60000,
    })

    const request = new NextRequest('http://localhost/api/messages/list', { method: 'GET' })
    const response = await GET(request)

    expect(response.status).toBe(429)
    const data = await response.json()
    expect(data.error).toBe('Too many requests')

    // Verify headers
    expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
  })

  it('proceeds when rate limit is not exceeded', async () => {
    // Mock rate limiter success
    vi.mocked(rateLimiter.check).mockReturnValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60000,
    })

    const request = new NextRequest('http://localhost/api/messages/list', { method: 'GET' })
    const response = await GET(request)

    expect(response.status).toBe(200)
  })
})
