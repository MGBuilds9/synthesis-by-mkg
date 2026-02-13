import { POST } from '@/app/api/ai/chat/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { retrieveAIContext } from '@/lib/context/retrieval'
import { getLLMProvider } from '@/lib/providers/llm'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('next-auth')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    aiMessage: {
      count: vi.fn(),
      create: vi.fn().mockResolvedValue({}),
    },
    aiChatSession: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))
vi.mock('@/lib/context/retrieval', () => ({
  retrieveAIContext: vi.fn(),
  summarizeContext: vi.fn().mockReturnValue('Mocked context summary'),
}))
vi.mock('@/lib/providers/llm', () => ({
  getLLMProvider: vi.fn(),
}))

// Mock logger to avoid cluttering test output
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('POST /api/ai/chat - Context Domain Filtering', () => {
  const mockSession = { user: { id: 'user-1' } }
  const mockLLM = { chat: vi.fn().mockResolvedValue('AI response') }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue(mockSession as any)
    vi.mocked(getLLMProvider).mockReturnValue(mockLLM)
    vi.mocked(retrieveAIContext).mockResolvedValue({ messages: [], files: [], notionPages: [] })
    vi.mocked(prisma.aiMessage.count).mockResolvedValue(0)
  })

  it('should exclude email scopes when user disables emails', async () => {
    // Setup: User has email and chat scopes enabled in DB
    const mockContextScopes = [
      {
        enabled: true,
        syncScope: { connectedAccountId: 'acc-gmail', scopeType: 'GMAIL_LABEL' }, // Email
      },
      {
        enabled: true,
        syncScope: { connectedAccountId: 'acc-discord', scopeType: 'DISCORD_CHANNEL' }, // Chat
      },
    ]

    const mockSessionData = {
      id: 'session-1',
      userId: 'user-1',
      messages: [],
      contextScopes: mockContextScopes,
    }

    vi.mocked(prisma.aiChatSession.findUnique).mockResolvedValue(mockSessionData as any)

    // Act: User requests chat with emails DISABLED
    const req = new NextRequest('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'session-1',
        message: 'Hello',
        provider: 'OPENAI',
        model: 'gpt-4o',
        useContext: true,
        contextDomains: {
          emails: false, // User explicitly disables emails
          chats: true,
          files: true,
          notion: true,
        },
      }),
    })

    await POST(req)

    // Assert
    expect(retrieveAIContext).toHaveBeenCalled()
    const actualScopes = vi.mocked(retrieveAIContext).mock.calls[0][1] as any[]

    // Should confirm the vulnerability exists by failing this expectation initially
    const hasEmailScope = actualScopes.some(s => s.syncScope.scopeType === 'GMAIL_LABEL')
    expect(hasEmailScope).toBe(false)

    const hasChatScope = actualScopes.some(s => s.syncScope.scopeType === 'DISCORD_CHANNEL')
    expect(hasChatScope).toBe(true)
  })

  it('should include all scopes by default when contextDomains is missing', async () => {
    // Setup: User has email and chat scopes enabled in DB
    const mockContextScopes = [
      {
        enabled: true,
        syncScope: { connectedAccountId: 'acc-gmail', scopeType: 'GMAIL_LABEL' },
      },
      {
        enabled: true,
        syncScope: { connectedAccountId: 'acc-discord', scopeType: 'DISCORD_CHANNEL' },
      },
    ]

    const mockSessionData = {
      id: 'session-2',
      userId: 'user-1',
      messages: [],
      contextScopes: mockContextScopes,
    }

    vi.mocked(prisma.aiChatSession.findUnique).mockResolvedValue(mockSessionData as any)

    // Act: User requests chat WITHOUT contextDomains
    const req = new NextRequest('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'session-2',
        message: 'Hello',
        provider: 'OPENAI',
        model: 'gpt-4o',
        useContext: true,
        // contextDomains missing
      }),
    })

    await POST(req)

    // Assert
    expect(retrieveAIContext).toHaveBeenCalled()
    const actualScopes = vi.mocked(retrieveAIContext).mock.calls[0][1] as any[]

    // Should include both scopes
    const hasEmailScope = actualScopes.some(s => s.syncScope.scopeType === 'GMAIL_LABEL')
    expect(hasEmailScope).toBe(true)

    const hasChatScope = actualScopes.some(s => s.syncScope.scopeType === 'DISCORD_CHANNEL')
    expect(hasChatScope).toBe(true)
  })
})
