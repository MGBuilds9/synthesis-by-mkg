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

describe('retrieveAIContext Limit Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not multiply limit by number of accounts', async () => {
    const sessionId = 'session-multi'
    // 3 accounts
    const accounts = ['acc-1', 'acc-2', 'acc-3']
    const maxItemsPerScope = 5

    prismaMock.aiChatSession.findUnique.mockResolvedValue({
      id: sessionId,
      contextScopes: accounts.map(acc => ({
        syncScope: { connectedAccountId: acc, scopeType: 'GMAIL_LABEL' }
      })),
    })

    prismaMock.messageThread.findMany.mockResolvedValue([{ id: 't1' }])
    prismaMock.message.findMany.mockResolvedValue([])

    await retrieveAIContext({ sessionId, maxItemsPerScope })

    // Check what 'take' was called with.
    // Currently, it multiplies by account count (5 * 3 = 15).
    // The optimization goal is to make it exactly maxItemsPerScope (5).

    // Check messageThread query
    expect(prismaMock.messageThread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5
      })
    )

    // Check message query
    expect(prismaMock.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5
      })
    )
  })

  it('should apply optimization to files and notion pages too', async () => {
    const sessionId = 'session-files'
    const accounts = ['acc-1', 'acc-2'] // 2 accounts
    const maxItemsPerScope = 5

    prismaMock.aiChatSession.findUnique.mockResolvedValue({
      id: sessionId,
      contextScopes: [
        ...accounts.map(acc => ({
          syncScope: { connectedAccountId: acc, scopeType: 'DRIVE_FOLDER' }
        })),
        ...accounts.map(acc => ({
            syncScope: { connectedAccountId: acc, scopeType: 'NOTION_WORKSPACE' }
        }))
      ],
    })

    prismaMock.fileItem.findMany.mockResolvedValue([])
    prismaMock.notionResource.findMany.mockResolvedValue([])

    await retrieveAIContext({ sessionId, maxItemsPerScope })

    expect(prismaMock.fileItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5
      })
    )

    expect(prismaMock.notionResource.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5
      })
    )
  })
})
