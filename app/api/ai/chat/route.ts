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
    // Bolt: Optimized to select only necessary fields (role, content) for context construction.
    // This avoids fetching potentially large 'sources' and 'metadata' JSON fields.
    const include: any = {
      messages: {
        // Bolt: Optimized to fetch only the last 50 messages to prevent context overflow and reduce DB load
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          role: true,
          content: true,
        },
      },
    }

    // Bolt: Pre-fetch context scopes if context is requested to avoid redundant DB query in retrieveAIContext
    if (useContext) {
      include.contextScopes = {
        where: { enabled: true },
        include: {
          syncScope: {
            select: {
              connectedAccountId: true,
              scopeType: true,
              connectedAccount: {
                select: {
                  provider: true,
                },
              },
            },
          },
        },
      }
    }

    let chatSession: any = await prisma.aiChatSession.findUnique({
      where: { id: sessionId },
      include,
    })

    if (chatSession && chatSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Bolt: Reverse messages to restore chronological order (oldest -> newest) for the LLM
    if (chatSession) {
      chatSession.messages.reverse()
    }

    if (!chatSession) {
      chatSession = await prisma.aiChatSession.create({
        data: {
          userId: session.user.id,
          provider: provider as AiProvider,
          model,
        },
        include,
      })
    }

    // Add user message to database
    // Bolt: Optimized to start DB write in background and await it in parallel with LLM call
    const saveUserMessagePromise = prisma.aiMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'user',
        content: message,
      },
    })
    // Bolt: Ensure unhandled rejections are caught if the request fails early (e.g. context retrieval error)
    saveUserMessagePromise.catch(() => {})

    // Retrieve context if requested
    let systemPrompt: string | undefined
    if (useContext) {
      // Bolt: Context retrieval runs while user message is being saved.
      // We pass the pre-fetched contextScopes to avoid re-fetching the session.
      const contextData = await retrieveAIContext(
        { sessionId: chatSession.id },
        (chatSession as any).contextScopes
      )
      if (contextData) {
        systemPrompt = `You have access to the following context from the user's connected accounts:\n\n${summarizeContext(contextData)}`
      }
    }

    // Prepare messages for LLM
    const messages = chatSession.messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))
    messages.push({ role: 'user', content: message })

    // Call LLM
    const llmProvider = getLLMProvider(provider as AiProvider)

    // Bolt: Optimized to await user message save and LLM response in parallel
    // This removes the DB write latency from the critical path
    const [_, response] = await Promise.all([
      saveUserMessagePromise,
      llmProvider.chat(messages, model, systemPrompt),
    ])

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
