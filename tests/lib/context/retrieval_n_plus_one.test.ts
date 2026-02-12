import { describe, it, expect, vi, beforeEach } from 'vitest'
import { retrieveAIContext } from '@/lib/context/retrieval'

// Mock Prisma
const prismaMock = vi.hoisted(() => ({
  aiChatSession: {
    findUnique: vi.fn(),
  },
  messageThread: {
    findMany: vi.fn(),
  },
  message: {
    findMany: vi.fn(),
  },
  fileItem: {
    findMany: vi.fn(),
  },
  notionResource: {
    findMany: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

describe('retrieveAIContext N+1 Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should optimize message retrieval by avoiding N+1 join on thread', async () => {
    const sessionId = 'session-opt'
    const accountId = 'acc-1'

    // Mock session
    prismaMock.aiChatSession.findUnique.mockResolvedValue({
      id: sessionId,
      contextScopes: [
        { syncScope: { connectedAccountId: accountId, scopeType: 'GMAIL_LABEL' } }
      ],
    })

    // Mock threads (return both id and subject to satisfy new implementation requirements if any)
    prismaMock.messageThread.findMany.mockResolvedValue([
      { id: 'thread-1', subject: 'Thread Subject 1' }
    ])

    // Mock messages (return both nested thread and threadId to satisfy both implementations)
    prismaMock.message.findMany.mockResolvedValue([
      {
        id: 'msg-1',
        provider: 'GMAIL',
        sender: 'alice',
        content: 'Hi',
        sentAt: new Date(),
        threadId: 'thread-1',
        thread: { subject: 'Thread Subject 1' }
      }
    ])

    await retrieveAIContext({ sessionId })

    // ASSERTION FOR OPTIMIZED BEHAVIOR:

    // 1. messageThread.findMany should Select 'subject'
    expect(prismaMock.messageThread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          id: true,
          subject: true, // This is the new requirement
        })
      })
    )

    // 2. message.findMany should Select 'threadId' but NOT 'thread' (relation)
    const messageCallArgs = prismaMock.message.findMany.mock.calls[0][0] as any
    expect(messageCallArgs.select).toBeDefined()
    expect(messageCallArgs.select.threadId).toBe(true)
    expect(messageCallArgs.select.thread).toBeUndefined() // Should NOT join thread
  })
})
