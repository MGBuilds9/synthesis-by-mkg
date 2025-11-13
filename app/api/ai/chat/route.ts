import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLLMProvider } from '@/lib/providers/llm'
import { retrieveAIContext, summarizeContext } from '@/lib/context/retrieval'
import { AiProvider } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, message, provider, model, useContext } = body

    if (!sessionId || !message || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get or create chat session
    let chatSession = await prisma.aiChatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })

    if (!chatSession) {
      chatSession = await prisma.aiChatSession.create({
        data: {
          userId: session.user.id,
          provider: provider as AiProvider,
          model,
        },
        include: { messages: true },
      })
    }

    // Add user message to database
    await prisma.aiMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'user',
        content: message,
      },
    })

    // Retrieve context if requested
    let systemPrompt: string | undefined
    if (useContext) {
      const contextData = await retrieveAIContext({ sessionId: chatSession.id })
      if (contextData) {
        systemPrompt = `You have access to the following context from the user's connected accounts:\n\n${summarizeContext(contextData)}`
      }
    }

    // Prepare messages for LLM
    const messages = chatSession.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))
    messages.push({ role: 'user', content: message })

    // Call LLM
    const llmProvider = getLLMProvider(provider as AiProvider)
    const response = await llmProvider.chat(messages, model, systemPrompt)

    // Save assistant response
    await prisma.aiMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'assistant',
        content: response,
      },
    })

    return NextResponse.json({
      response,
      sessionId: chatSession.id,
    })
  } catch (error: any) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat', details: error.message },
      { status: 500 }
    )
  }
}
