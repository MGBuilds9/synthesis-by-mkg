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

  it('should optimize message retrieval by using single query with relation filtering', async () => {
    const sessionId = 'session-opt'
    const accountId = 'acc-1'

    // Mock session
    prismaMock.aiChatSession.findUnique.mockResolvedValue({
      id: sessionId,
      contextScopes: [
        { syncScope: { connectedAccountId: accountId, scopeType: 'GMAIL_LABEL' } }
      ],
    })

    // Mock messages
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

    // 1. messageThread.findMany should NOT be called
    expect(prismaMock.messageThread.findMany).not.toHaveBeenCalled()

    // 2. message.findMany should Select 'thread.subject' via nested selection
    const messageCallArgs = prismaMock.message.findMany.mock.calls[0][0] as any
    expect(messageCallArgs.select).toBeDefined()
    expect(messageCallArgs.select.thread).toEqual({
      select: {
        subject: true
      }
    })
  })
})
