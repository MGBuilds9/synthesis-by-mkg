import { describe, it, expect, vi, beforeEach } from 'vitest'
import { retrieveAIContext, summarizeContext } from '@/lib/context/retrieval'

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

describe('retrieveAIContext Truncation Optimization', () => {
  const longContent = 'a'.repeat(5000)

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock responses
    prismaMock.aiChatSession.findUnique.mockResolvedValue({
      id: 'session-truncation',
      contextScopes: [{
        syncScope: { connectedAccountId: 'acc-1', scopeType: 'GMAIL_LABEL' }
      }],
    })

    prismaMock.messageThread.findMany.mockResolvedValue([{ id: 't1', subject: 'Test Thread' }])
    prismaMock.message.findMany.mockResolvedValue([{
      id: 'm1',
      provider: 'GMAIL',
      sender: 'test@example.com',
      content: longContent,
      sentAt: new Date(),
      threadId: 't1'
    }])
  })

  it('should truncate message content when truncateContentLength is provided', async () => {
    const result = await retrieveAIContext({
      sessionId: 'session-truncation',
      truncateContentLength: 200
    })

    expect(result).not.toBeNull()
    if (!result) return

    expect(result.messages[0].content.length).toBe(200)
    expect(result.messages[0].content).toBe(longContent.slice(0, 200))
  })

  it('should NOT truncate message content when truncateContentLength is NOT provided', async () => {
    const result = await retrieveAIContext({
      sessionId: 'session-truncation'
    })

    expect(result).not.toBeNull()
    if (!result) return

    expect(result.messages[0].content.length).toBe(5000)
    expect(result.messages[0].content).toBe(longContent)
  })

  it('summarizeContext should still work with truncated content', () => {
    const contextData = {
      messages: [{
        sender: 'sender',
        content: 'a'.repeat(200) // Simulated truncated content
      }],
      files: [],
      notionPages: []
    }

    const summary = summarizeContext(contextData)
    expect(summary).toContain('sender: ' + 'a'.repeat(100) + '...')
  })
})
