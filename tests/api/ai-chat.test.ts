import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/ai/chat/route'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    aiChatSession: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    aiMessage: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/providers/llm', () => ({
  getLLMProvider: vi.fn(),
}))

vi.mock('@/lib/context/retrieval', () => ({
  retrieveAIContext: vi.fn(),
  summarizeContext: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { getLLMProvider } from '@/lib/providers/llm'
import { retrieveAIContext, summarizeContext } from '@/lib/context/retrieval'

describe('POST /api/ai/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createRequest(body: any): NextRequest {
    return new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  it('returns 401 when no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    const request = createRequest({
      sessionId: 'session-123',
      message: 'Hello',
      provider: 'OPENAI',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 400 when sessionId is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const request = createRequest({
      message: 'Hello',
      provider: 'OPENAI',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields')
  })

  it('returns 400 when message is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const request = createRequest({
      sessionId: 'session-123',
      provider: 'OPENAI',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields')
  })

  it('returns 400 when provider is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const request = createRequest({
      sessionId: 'session-123',
      message: 'Hello',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields')
  })

  it('successfully processes chat with existing session', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const mockSession = {
      id: 'session-123',
      userId: 'user-123',
      provider: 'OPENAI',
      model: 'gpt-4',
      messages: [
        { id: 'msg-1', role: 'user', content: 'Previous message' },
        { id: 'msg-2', role: 'assistant', content: 'Previous response' },
      ],
    }

    vi.mocked(prisma.aiChatSession.findUnique).mockResolvedValue(mockSession as any)

    const mockUserMessage = { id: 'msg-3', role: 'user', content: 'Hello' }
    const mockAssistantMessage = { id: 'msg-4', role: 'assistant', content: 'Hi there!' }

    vi.mocked(prisma.aiMessage.create)
      .mockResolvedValueOnce(mockUserMessage as any)
      .mockResolvedValueOnce(mockAssistantMessage as any)

    const mockLLMProvider = {
      chat: vi.fn().mockResolvedValue('Hi there!'),
    }
    vi.mocked(getLLMProvider).mockReturnValue(mockLLMProvider)

    const request = createRequest({
      sessionId: 'session-123',
      message: 'Hello',
      provider: 'OPENAI',
      model: 'gpt-4',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.response).toBe('Hi there!')
    expect(data.sessionId).toBe('session-123')

    expect(prisma.aiChatSession.findUnique).toHaveBeenCalledWith({
      where: { id: 'session-123' },
      include: expect.objectContaining({
        messages: expect.objectContaining({
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            role: true,
            content: true,
          },
        }),
      }),
    })

    expect(prisma.aiMessage.create).toHaveBeenCalledWith({
      data: {
        sessionId: 'session-123',
        role: 'user',
        content: 'Hello',
      },
    })

    expect(mockLLMProvider.chat).toHaveBeenCalledWith(
      [
        { role: 'assistant', content: 'Previous response' },
        { role: 'user', content: 'Previous message' },
        { role: 'user', content: 'Hello' },
      ],
      'gpt-4',
      undefined
    )

    expect(prisma.aiMessage.create).toHaveBeenCalledWith({
      data: {
        sessionId: 'session-123',
        role: 'assistant',
        content: 'Hi there!',
      },
    })
  })

  it('creates new session when sessionId not found', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    vi.mocked(prisma.aiChatSession.findUnique).mockResolvedValue(null)

    const mockNewSession = {
      id: 'new-session-456',
      userId: 'user-123',
      provider: 'OPENAI',
      model: 'gpt-4',
      messages: [],
    }

    vi.mocked(prisma.aiChatSession.create).mockResolvedValue(mockNewSession as any)

    const mockUserMessage = { id: 'msg-1', role: 'user', content: 'Hello' }
    const mockAssistantMessage = { id: 'msg-2', role: 'assistant', content: 'Hi there!' }

    vi.mocked(prisma.aiMessage.create)
      .mockResolvedValueOnce(mockUserMessage as any)
      .mockResolvedValueOnce(mockAssistantMessage as any)

    const mockLLMProvider = {
      chat: vi.fn().mockResolvedValue('Hi there!'),
    }
    vi.mocked(getLLMProvider).mockReturnValue(mockLLMProvider)

    const request = createRequest({
      sessionId: 'session-not-found',
      message: 'Hello',
      provider: 'OPENAI',
      model: 'gpt-4',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.response).toBe('Hi there!')
    expect(data.sessionId).toBe('new-session-456')

    expect(prisma.aiChatSession.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        provider: 'OPENAI',
        model: 'gpt-4',
      },
      include: expect.objectContaining({
        messages: expect.any(Object),
      }),
    })
  })

  it('includes context when useContext is true', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const mockSession = {
      id: 'session-123',
      userId: 'user-123',
      provider: 'OPENAI',
      model: 'gpt-4',
      messages: [],
      contextScopes: [
        {
          id: 'scope-1',
          enabled: true,
          syncScope: {
            connectedAccountId: 'acc-1',
            scopeType: 'FILES',
            connectedAccount: {
              provider: 'GOOGLE_DRIVE',
            },
          },
        },
      ],
    }

    vi.mocked(prisma.aiChatSession.findUnique).mockResolvedValue(mockSession as any)

    const mockContextData = {
      files: [{ id: 'file-1', name: 'doc.txt', content: 'Sample content' }],
    }
    vi.mocked(retrieveAIContext).mockResolvedValue(mockContextData as any)
    vi.mocked(summarizeContext).mockReturnValue('Summarized context data')

    vi.mocked(prisma.aiMessage.create).mockResolvedValue({} as any)

    const mockLLMProvider = {
      chat: vi.fn().mockResolvedValue('Response with context'),
    }
    vi.mocked(getLLMProvider).mockReturnValue(mockLLMProvider)

    const request = createRequest({
      sessionId: 'session-123',
      message: 'Hello',
      provider: 'OPENAI',
      model: 'gpt-4',
      useContext: true,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(retrieveAIContext).toHaveBeenCalledWith(
      { sessionId: 'session-123' },
      mockSession.contextScopes
    )
    expect(summarizeContext).toHaveBeenCalledWith(mockContextData)
    expect(mockLLMProvider.chat).toHaveBeenCalledWith(
      [{ role: 'user', content: 'Hello' }],
      'gpt-4',
      'You have access to the following context from the user\'s connected accounts:\n\nSummarized context data'
    )
  })

  it('returns 500 on internal error', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    vi.mocked(prisma.aiChatSession.findUnique).mockRejectedValue(
      new Error('Database connection failed')
    )

    const request = createRequest({
      sessionId: 'session-123',
      message: 'Hello',
      provider: 'OPENAI',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to process chat')
    expect(data.details).toBe('Database connection failed')
  })

  it('returns 401 when accessing another user\'s session', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'attacker-123' },
    } as any)

    const mockSession = {
      id: 'session-123',
      userId: 'victim-456',
      provider: 'OPENAI',
      model: 'gpt-4',
      messages: [],
    }

    vi.mocked(prisma.aiChatSession.findUnique).mockResolvedValue(mockSession as any)

    const request = createRequest({
      sessionId: 'session-123',
      message: 'Steal data',
      provider: 'OPENAI',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })
})
