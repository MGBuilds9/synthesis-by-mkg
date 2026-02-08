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
  },
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
  logProviderActivity: vi.fn(),
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

describe('GET /api/messages/list', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('returns threads with default pagination', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const mockThreads = [
      {
        id: 'thread-1',
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
        connectedAccount: {
          accountLabel: 'My Gmail',
          provider: 'GMAIL',
        },
      },
      {
        id: 'thread-2',
        subject: 'Meeting Notes',
        provider: 'GMAIL',
        lastMessageAt: new Date('2024-01-14'),
        messages: [
          {
            id: 'msg-2',
            sender: 'colleague@example.com',
            content: 'Meeting summary',
            sentAt: new Date('2024-01-14'),
            isRead: false,
            providerMessageId: 'gmail-msg-2',
          },
        ],
        connectedAccount: {
          accountLabel: 'My Gmail',
          provider: 'GMAIL',
        },
      },
    ]

    vi.mocked(prisma.messageThread.findMany).mockResolvedValue(mockThreads as any)
    vi.mocked(prisma.messageThread.count).mockResolvedValue(2)

    const request = createRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.threads).toHaveLength(2)
    expect(data.threads[0].id).toBe('thread-1')
    expect(data.threads[0].subject).toBe('Project Update')
    expect(data.threads[1].id).toBe('thread-2')
    expect(data.threads[1].subject).toBe('Meeting Notes')
    expect(data.total).toBe(2)
    expect(data.limit).toBe(50)
    expect(data.offset).toBe(0)

    expect(prisma.messageThread.findMany).toHaveBeenCalledWith({
      where: {
        connectedAccount: {
          userId: 'user-123',
        },
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
        connectedAccount: {
          select: {
            accountLabel: true,
            provider: true,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
      skip: 0,
    })

    expect(prisma.messageThread.count).toHaveBeenCalledWith({
      where: {
        connectedAccount: {
          userId: 'user-123',
        },
      },
    })
  })

  it('filters by provider when specified', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const mockThreads = [
      {
        id: 'thread-1',
        subject: 'Project Update',
        provider: 'GMAIL',
        lastMessageAt: new Date('2024-01-15'),
        messages: [
          {
            id: 'msg-1',
            sender: 'sender@example.com',
            content: 'Latest message',
            sentAt: new Date('2024-01-15'),
            isRead: true,
            providerMessageId: 'gmail-msg-1',
          },
        ],
        connectedAccount: {
          accountLabel: 'My Gmail',
          provider: 'GMAIL',
        },
      },
    ]

    vi.mocked(prisma.messageThread.findMany).mockResolvedValue(mockThreads as any)
    vi.mocked(prisma.messageThread.count).mockResolvedValue(1)

    const request = createRequest({ provider: 'GMAIL' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.threads).toHaveLength(1)
    expect(data.threads[0].id).toBe('thread-1')
    expect(data.threads[0].provider).toBe('GMAIL')
    expect(data.total).toBe(1)

    expect(prisma.messageThread.findMany).toHaveBeenCalledWith({
      where: {
        connectedAccount: {
          userId: 'user-123',
        },
        provider: 'GMAIL',
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
        subject: 'Thread 11',
        provider: 'GMAIL',
        lastMessageAt: new Date('2024-01-05'),
        messages: [
          {
            id: 'msg-11',
            sender: 'sender@example.com',
            content: 'Message 11',
            sentAt: new Date('2024-01-05'),
            isRead: true,
            providerMessageId: 'gmail-msg-11',
          },
        ],
        connectedAccount: {
          accountLabel: 'My Gmail',
          provider: 'GMAIL',
        },
      },
    ]

    vi.mocked(prisma.messageThread.findMany).mockResolvedValue(mockThreads as any)
    vi.mocked(prisma.messageThread.count).mockResolvedValue(25)

    const request = createRequest({ limit: '10', offset: '10' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.threads).toHaveLength(1)
    expect(data.threads[0].id).toBe('thread-11')
    expect(data.total).toBe(25)
    expect(data.limit).toBe(10)
    expect(data.offset).toBe(10)

    expect(prisma.messageThread.findMany).toHaveBeenCalledWith({
      where: {
        connectedAccount: {
          userId: 'user-123',
        },
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
        connectedAccount: {
          accountLabel: 'My Gmail',
          provider: 'GMAIL',
        },
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

    expect(prisma.messageThread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          messages: expect.objectContaining({
            take: 1,
            orderBy: { sentAt: 'desc' },
          }),
        }),
      })
    )
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

  it('handles multiple providers correctly', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const mockThreads = [
      {
        id: 'thread-1',
        subject: 'Gmail Thread',
        provider: 'GMAIL',
        lastMessageAt: new Date('2024-01-15'),
        messages: [
          {
            id: 'msg-1',
            sender: 'gmail@example.com',
            content: 'Gmail message',
            sentAt: new Date('2024-01-15'),
            isRead: true,
            providerMessageId: 'gmail-msg-1',
          },
        ],
        connectedAccount: {
          accountLabel: 'My Gmail',
          provider: 'GMAIL',
        },
      },
      {
        id: 'thread-2',
        subject: 'Slack Thread',
        provider: 'SLACK',
        lastMessageAt: new Date('2024-01-14'),
        messages: [
          {
            id: 'msg-2',
            sender: 'user123',
            content: 'Slack message',
            sentAt: new Date('2024-01-14'),
            isRead: false,
            providerMessageId: 'slack-msg-1',
          },
        ],
        connectedAccount: {
          accountLabel: 'My Slack',
          provider: 'SLACK',
        },
      },
    ]

    vi.mocked(prisma.messageThread.findMany).mockResolvedValue(mockThreads as any)
    vi.mocked(prisma.messageThread.count).mockResolvedValue(2)

    const request = createRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.threads).toHaveLength(2)
    expect(data.threads[0].provider).toBe('GMAIL')
    expect(data.threads[1].provider).toBe('SLACK')
  })

  it('returns 500 on internal error', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const error = new Error('Database connection failed')
    vi.mocked(prisma.messageThread.findMany).mockRejectedValue(error)

    const request = createRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch messages')
    expect(data.details).toBeUndefined()
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch messages', { error })
  })
})
