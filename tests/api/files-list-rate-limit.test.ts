import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/files/list/route'

const { mockCheck } = vi.hoisted(() => {
  return { mockCheck: vi.fn() }
})

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fileItem: { findMany: vi.fn(), count: vi.fn() },
    connectedAccount: { findMany: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({ authOptions: {} }))

// Mock RateLimiter
vi.mock('@/lib/ratelimit', () => ({
  RateLimiter: vi.fn().mockImplementation(function() {
    return { check: mockCheck }
  })
}))

import { getServerSession } from 'next-auth'

describe('GET /api/files/list - Rate Limit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)
  })

  it('returns 429 when rate limit is exceeded', async () => {
    mockCheck.mockReturnValue({ success: false, limit: 60, remaining: 0, reset: 1234567890 })

    const request = new NextRequest('http://localhost/api/files/list', { method: 'GET' })
    const response = await GET(request)

    expect(response.status).toBe(429)
    const body = await response.json()
    expect(body.error).toBe('Too many requests')
    expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
  })

  it('allows request when rate limit is not exceeded', async () => {
    mockCheck.mockReturnValue({ success: true, limit: 60, remaining: 59, reset: 1234567890 })

    // Mock successful DB response
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.connectedAccount.findMany).mockResolvedValue([])
    vi.mocked(prisma.fileItem.findMany).mockResolvedValue([])
    vi.mocked(prisma.fileItem.count).mockResolvedValue(0)

    const request = new NextRequest('http://localhost/api/files/list', { method: 'GET' })
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('59')
  })
})
