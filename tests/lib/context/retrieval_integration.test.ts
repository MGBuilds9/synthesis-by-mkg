import { describe, it, expect, vi, beforeEach } from 'vitest'
import { retrieveAIContext } from '@/lib/context/retrieval'

// Hoist the mock object so it can be used in vi.mock
const prismaMock = vi.hoisted(() => ({
  message: {
    findMany: vi.fn(),
  },
  // messageThread.findMany is no longer called in the optimized path
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

  it('should retrieve messages using the optimized single query', async () => {
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

    const mockMessages = [
      {
        id: 'msg-1',
        provider: 'GMAIL',
        sender: 'alice@example.com',
        content: 'Hello',
        sentAt: new Date(),
        threadId: 'thread-1',
        thread: { subject: 'Hi' },
      },
    ]
    prismaMock.message.findMany.mockResolvedValue(mockMessages)

    const result = await retrieveAIContext({ sessionId })

    // Check results
    expect(result).not.toBeNull()
    expect(result?.messages).toHaveLength(1)
    expect(result?.messages[0].subject).toBe('Hi')

    // Verify optimization calls
    // Expect message.findMany with nested thread relation filter
    expect(prismaMock.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        thread: expect.objectContaining({
          connectedAccountId: { in: expect.arrayContaining([connectedAccountId]) }
        })
      }),
      select: expect.objectContaining({
        thread: {
          select: {
            subject: true
          }
        }
      })
    }))

    // Ensure messageThread.findMany is NOT called
    expect(prismaMock.messageThread.findMany).not.toHaveBeenCalled()
  })

  it('should batch queries for multiple connected accounts', async () => {
    const sessionId = 'session-multi'
    const account1 = 'acc-1'
    const account2 = 'acc-2'

    prismaMock.aiChatSession.findUnique.mockResolvedValue({
        id: sessionId,
        contextScopes: [
            { syncScope: { connectedAccountId: account1, scopeType: 'GMAIL_LABEL' } },
            { syncScope: { connectedAccountId: account2, scopeType: 'OUTLOOK_FOLDER' } }
        ]
    })

    prismaMock.message.findMany.mockResolvedValue([])

    await retrieveAIContext({ sessionId })

    // Should only call findMany once
    expect(prismaMock.message.findMany).toHaveBeenCalledTimes(1)
    expect(prismaMock.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
            thread: expect.objectContaining({
                connectedAccountId: { in: expect.arrayContaining([account1, account2]) }
            })
        })
    }))
  })
})
