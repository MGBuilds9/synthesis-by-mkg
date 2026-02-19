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

describe('GET /api/messages/list', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock for connected accounts
    vi.mocked(prisma.connectedAccount.findMany).mockResolvedValue([
      { id: 'account-1', accountLabel: 'My Gmail', provider: 'GMAIL' },
      { id: 'account-2', accountLabel: 'Work Outlook', provider: 'OUTLOOK' },
    ] as any)
  })

  function createRequest(searchParams: Record<string, string> = {}): NextRequest {
    const params = new URLSearchParams(searchParams)
    const url = `http://localhost/api/messages/list${params.toString() ? '?' + params.toString() : ''}`
    return new NextRequest(url, { method: 'GET' })
  }

  it('returns 401 when no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    const request = createRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns threads with default pagination (count INCLUDED by default)', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const mockThreads = [
      {
        id: 'thread-1',
        connectedAccountId: 'account-1',
        subject: 'Project Update',
        provider: 'GMAIL',
        lastMessageAt: new Date('2024-01-15'),
        messages: [
          {
            id: 'msg-1',
            sender: 'sender@example.com',
            content: 'Latest message content',
            sentAt: new Date('2024-01-15'),
            isRead: true,
            providerMessageId: 'gmail-msg-1',
          },
        ],
      },
    ]

    vi.mocked(prisma.messageThread.findMany).mockResolvedValue(mockThreads as any)
    vi.mocked(prisma.messageThread.count).mockResolvedValue(2)

    const request = createRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.threads).toHaveLength(1)
    expect(data.total).toBe(2) // Default behavior: count included
    expect(data.limit).toBe(50)
    expect(data.offset).toBe(0)

    expect(prisma.messageThread.count).toHaveBeenCalledWith({
      where: {
        connectedAccountId: { in: ['account-1', 'account-2'] },
      },
    })

    // Bolt: Restored detailed assertion
    expect(prisma.messageThread.findMany).toHaveBeenCalledWith({
      where: {
        connectedAccountId: { in: ['account-1', 'account-2'] },
      },
      include: {
        messages: {
          select: {
            id: true,
            sender: true,
            content: true,
            sentAt: true,
            isRead: true,
            providerMessageId: true,
          },
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
      skip: 0,
    })
  })

  it('skips total count when skipCount=true', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const mockThreads = [
      {
        id: 'thread-1',
        connectedAccountId: 'account-1',
        subject: 'Project Update',
        provider: 'GMAIL',
        lastMessageAt: new Date('2024-01-15'),
        messages: [],
      },
    ]

    vi.mocked(prisma.messageThread.findMany).mockResolvedValue(mockThreads as any)
    vi.mocked(prisma.messageThread.count).mockResolvedValue(5)

    const request = createRequest({ skipCount: 'true' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.threads).toHaveLength(1)
    expect(data.total).toBe(-1) // Count skipped

    expect(prisma.messageThread.count).not.toHaveBeenCalled()
  })

  it('filters by provider when specified', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    vi.mocked(prisma.connectedAccount.findMany).mockResolvedValue([
      { id: 'account-1', accountLabel: 'My Gmail', provider: 'GMAIL' }
    ] as any)

    const mockThreads = [
      {
        id: 'thread-1',
        connectedAccountId: 'account-1',
        subject: 'Project Update',
        provider: 'GMAIL',
        lastMessageAt: new Date('2024-01-15'),
        messages: [],
      },
    ]

    vi.mocked(prisma.messageThread.findMany).mockResolvedValue(mockThreads as any)
    vi.mocked(prisma.messageThread.count).mockResolvedValue(1)

    const request = createRequest({ provider: 'GMAIL' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.threads).toHaveLength(1)
    expect(data.threads[0].provider).toBe('GMAIL')
    expect(data.total).toBe(1) // Default: count included

    expect(prisma.connectedAccount.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123', provider: 'GMAIL' },
      select: {
        id: true,
        accountLabel: true,
        provider: true,
      },
    })

    expect(prisma.messageThread.findMany).toHaveBeenCalledWith({
      where: {
        connectedAccountId: { in: ['account-1'] },
      },
      include: expect.any(Object),
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
      skip: 0,
    })
  })

  it('returns correct pagination metadata with custom limit and offset', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const mockThreads = [
      {
        id: 'thread-11',
        connectedAccountId: 'account-1',
        subject: 'Thread 11',
        provider: 'GMAIL',
        lastMessageAt: new Date('2024-01-05'),
        messages: [],
      },
    ]

    vi.mocked(prisma.messageThread.findMany).mockResolvedValue(mockThreads as any)
    vi.mocked(prisma.messageThread.count).mockResolvedValue(25)

    const request = createRequest({ limit: '10', offset: '10' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.total).toBe(25)
    expect(data.limit).toBe(10)
    expect(data.offset).toBe(10)

    // Bolt: Restored assertion
    expect(prisma.messageThread.findMany).toHaveBeenCalledWith({
      where: {
        connectedAccountId: { in: ['account-1', 'account-2'] },
      },
      include: expect.any(Object),
      orderBy: { lastMessageAt: 'desc' },
      take: 10,
      skip: 10,
    })
  })

  it('includes latest message for each thread', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const mockThreads = [
      {
        id: 'thread-1',
        connectedAccountId: 'account-1',
        subject: 'Conversation',
        provider: 'GMAIL',
        lastMessageAt: new Date('2024-01-15'),
        messages: [
          {
            id: 'msg-latest',
            sender: 'latest@example.com',
            content: 'Most recent message',
            sentAt: new Date('2024-01-15'),
            isRead: false,
            providerMessageId: 'gmail-msg-latest',
          },
        ],
      },
    ]

    vi.mocked(prisma.messageThread.findMany).mockResolvedValue(mockThreads as any)
    vi.mocked(prisma.messageThread.count).mockResolvedValue(1)

    const request = createRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.threads[0].messages).toHaveLength(1)
    expect(data.threads[0].messages[0].content).toBe('Most recent message')
  })

  it('returns empty array when no threads found', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    vi.mocked(prisma.messageThread.findMany).mockResolvedValue([])
    vi.mocked(prisma.messageThread.count).mockResolvedValue(0)

    const request = createRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.threads).toEqual([])
    expect(data.total).toBe(0)
  })

  it('returns 500 on internal error', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    vi.mocked(prisma.connectedAccount.findMany).mockRejectedValue(
      new Error('Database connection failed')
    )

    const request = createRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch messages')
  })
})
