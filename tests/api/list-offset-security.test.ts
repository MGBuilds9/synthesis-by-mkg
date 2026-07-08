import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/messages/list/route'
import { GET as FilesGET } from '@/app/api/files/list/route'
import { prisma } from '@/lib/prisma'
import { rateLimiter } from '@/lib/ratelimit'
import { getServerSession } from 'next-auth'

vi.mock('@/lib/ratelimit', () => ({
  rateLimiter: {
    check: vi.fn(),
  },
}))

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    messageThread: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    fileItem: {
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

describe('GET /api/list - Security Offset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(rateLimiter.check).mockReturnValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60000,
    })
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)
    vi.mocked(prisma.connectedAccount.findMany).mockResolvedValue([
      { id: 'account-1' },
    ] as any)
  })

  function createRequest(urlBase: string, searchParams: Record<string, string> = {}): NextRequest {
    const params = new URLSearchParams(searchParams)
    const url = `http://localhost${urlBase}${params.toString() ? '?' + params.toString() : ''}`
    return new NextRequest(url, { method: 'GET' })
  }

  it('messages - caps negative offset to 0', async () => {
    vi.mocked(prisma.messageThread.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.count).mockResolvedValue(0)

    const request = createRequest('/api/messages/list', { offset: '-5' })
    await GET(request)

    expect(prisma.messageThread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
      })
    )
  })

  it('files - caps negative offset to 0', async () => {
    vi.mocked(prisma.fileItem.findMany).mockResolvedValue([])
    vi.mocked(prisma.fileItem.count).mockResolvedValue(0)

    const request = createRequest('/api/files/list', { offset: '-5' })
    await FilesGET(request)

    expect(prisma.fileItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
      })
    )
  })
})
