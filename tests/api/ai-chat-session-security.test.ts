import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/ai/chat/route'

// Mock dependencies
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
      count: vi.fn(),
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

describe('POST /api/ai/chat - Session Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.aiMessage.count).mockResolvedValue(0)
    vi.mocked(prisma.aiMessage.create).mockResolvedValue({} as any)
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)
  })

  function createRequest(body: any): NextRequest {
    return new NextRequest('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('rejects sessionId longer than 128 characters', async () => {
    const longId = 'a'.repeat(129)
    const request = createRequest({
      sessionId: longId,
      message: 'Hello',
      provider: 'OPENAI',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid request')
  })

  it('rejects model name longer than 64 characters', async () => {
    const longModel = 'a'.repeat(65)
    const request = createRequest({
      sessionId: 'valid-session',
      message: 'Hello',
      provider: 'OPENAI',
      model: longModel,
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid request')
  })

  it('allows valid sessionId (up to 128 chars)', async () => {
    const validId = 'a'.repeat(128)
    // Mock session not found -> create new
    vi.mocked(prisma.aiChatSession.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.aiChatSession.create).mockResolvedValue({
      id: 'new-session-id',
      userId: 'user-123',
      messages: [],
    } as any)

    // Mock LLM
    const mockLLM = { chat: vi.fn().mockResolvedValue('Response') }
    vi.mocked(getLLMProvider).mockReturnValue(mockLLM)

    const request = createRequest({
      sessionId: validId,
      message: 'Hello',
      provider: 'OPENAI',
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
