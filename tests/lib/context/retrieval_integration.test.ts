import { describe, it, expect, vi, beforeEach } from 'vitest'
import { retrieveAIContext } from '@/lib/context/retrieval'

// Hoist the mock object so it can be used in vi.mock
const prismaMock = vi.hoisted(() => ({
  message: {
    findMany: vi.fn(),
  },
  messageThread: {
    findMany: vi.fn(),
  },
  fileItem: {
    findMany: vi.fn(),
  },
  notionResource: {
    findMany: vi.fn(),
  },
  aiChatSession: {
    findUnique: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

describe('retrieveAIContext Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should retrieve messages using the optimized two-step query', async () => {
    const sessionId = 'session-123'
    const connectedAccountId = 'account-123'
    // cutoffDate is internal to the function, but we can infer it.

    // Mock session with context scope
    prismaMock.aiChatSession.findUnique.mockResolvedValue({
      id: sessionId,
      contextScopes: [
        {
          syncScope: {
            connectedAccountId,
            scopeType: 'GMAIL_LABEL',
            connectedAccount: {
              provider: 'GMAIL',
            },
          },
        },
      ],
    })

    // Mock return values for findMany
    const mockThreads = [{ id: 'thread-1' }, { id: 'thread-2' }]
    prismaMock.messageThread.findMany.mockResolvedValue(mockThreads)

    const mockMessages = [
      {
        id: 'msg-1',
        provider: 'GMAIL',
        sender: 'alice@example.com',
        content: 'Hello',
        sentAt: new Date(),
        thread: { subject: 'Hi' },
      },
    ]
    prismaMock.message.findMany.mockResolvedValue(mockMessages)

    const result = await retrieveAIContext({ sessionId })

    // Check results
    expect(result).not.toBeNull()

    // Verify optimization calls
    expect(prismaMock.messageThread.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        connectedAccountId: { in: expect.arrayContaining([connectedAccountId]) },
        lastMessageAt: expect.any(Object)
      })
    }))

    // And message.findMany should use threadId IN [...]
    expect(prismaMock.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        threadId: { in: ['thread-1', 'thread-2'] }
      })
    }))
  })
})
