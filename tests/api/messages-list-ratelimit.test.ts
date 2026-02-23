import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/messages/list/route'

// Hoist the mock function so it can be used in vi.mock
const { mockCheck } = vi.hoisted(() => {
  return { mockCheck: vi.fn() }
})

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    connectedAccount: {
      findMany: vi.fn(),
    },
    messageThread: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}))

// Mock RateLimiter
vi.mock('@/lib/ratelimit', () => ({
  rateLimiter: {
    check: mockCheck,
  },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

describe('GET /api/messages/list - Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mocks
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    vi.mocked(prisma.connectedAccount.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.count).mockResolvedValue(0)

    // Default rate limit success
    mockCheck.mockReturnValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60000,
    })
  })

  function createRequest(): NextRequest {
    // NextRequest constructor requires a full URL
    return new NextRequest('http://localhost/api/messages/list', { method: 'GET' })
  }

  it('returns 200 when rate limit is not exceeded', async () => {
    const response = await GET(createRequest())
    expect(response.status).toBe(200)
    expect(mockCheck).toHaveBeenCalledWith('user-123')

    // Verify headers
    expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('59')
  })

  it('returns 429 when rate limit is exceeded', async () => {
    // Mock rate limit failure
    mockCheck.mockReturnValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: Date.now() + 60000,
    })

    const response = await GET(createRequest())
    expect(response.status).toBe(429)
    const json = await response.json()
    expect(json.error).toBe('Too many requests')

    // Verify headers
    expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
  })
})
