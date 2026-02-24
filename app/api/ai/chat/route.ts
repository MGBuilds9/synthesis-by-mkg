import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLLMProvider } from '@/lib/providers/llm'
import { retrieveAIContext, summarizeContext } from '@/lib/context/retrieval'
import { ALLOWED_MODELS } from '@/lib/providers/llm/constants'
import { AiProvider } from '@prisma/client'
import { z } from 'zod'
import { chatRateLimiter } from '@/lib/ratelimit'

// Sentinel: Validation schema
const chatRequestSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  provider: z.nativeEnum(AiProvider).or(z.string()),
  model: z.string().optional(),
  useContext: z.boolean().optional(),
  contextDomains: z.object({
    emails: z.boolean().optional(),
    chats: z.boolean().optional(),
    files: z.boolean().optional(),
    notion: z.boolean().optional(),
  }).optional(),
}).passthrough()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Sentinel: Validate request body
    const validation = chatRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.format() },
        { status: 400 }
      )
    }

    const { sessionId, message, provider, model, useContext, contextDomains } = validation.data

    // Sentinel: Validate model support for provider
    if (model) {
      const allowedModels = ALLOWED_MODELS[provider as AiProvider]
      if (!allowedModels || !allowedModels.includes(model)) {
        return NextResponse.json(
          { error: 'Invalid request', details: `Model ${model} is not supported for provider ${provider}` },
          { status: 400 }
        )
      }
    }

    // Sentinel: Rate Limiting
    // Bolt: Optimized to use in-memory rate limiter to avoid expensive database query on every request
    const rateLimit = chatRateLimiter.check(session.user.id)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          },
        }
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
            },
          },
        },
      }
    }

    let chatSession: any = await prisma.aiChatSession.findUnique({
      where: { id: sessionId },
      include,
    })

    // Bolt: Reverse messages to restore chronological order (oldest -> newest) for the LLM
    if (chatSession) {
      // Sentinel: Prevent IDOR by verifying session ownership
      if (chatSession.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
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
      // Sentinel: Filter context scopes based on user preference (contextDomains)
      // This prevents data leakage of excluded domains (e.g. emails) to the LLM
      let activeScopes = (chatSession as any).contextScopes || []

      if (contextDomains) {
        activeScopes = activeScopes.filter((scope: any) => {
          if (!scope.syncScope) return false
          const type = scope.syncScope.scopeType

          // Map scope types to domains
          if (['GMAIL_LABEL', 'OUTLOOK_FOLDER'].includes(type)) {
            return contextDomains.emails !== false
          }
          if (['DISCORD_SERVER', 'DISCORD_CHANNEL', 'WHATSAPP_ACCOUNT', 'SLACK_WORKSPACE', 'SLACK_CHANNEL', 'TELEGRAM_CHAT', 'TEAMS_WORKSPACE', 'TEAMS_CHANNEL'].includes(type)) {
            return contextDomains.chats !== false
          }
          if (['DRIVE_FOLDER', 'ONEDRIVE_FOLDER'].includes(type)) {
            return contextDomains.files !== false
          }
          if (['NOTION_WORKSPACE', 'NOTION_DATABASE', 'NOTION_PAGE'].includes(type)) {
            return contextDomains.notion !== false
          }
          return true
        })
      }

      // Bolt: Context retrieval runs while user message is being saved.
      // We pass the pre-fetched contextScopes to avoid re-fetching the session.
      // Bolt: Limit context items per scope to 5 (default 10) to reduce DB load, as we only summarize the top 5 anyway.
      // Bolt: Truncate content to 200 chars to save memory, as summarizeContext only uses the first 100 chars.
      const contextData = await retrieveAIContext(
        { sessionId: chatSession.id, maxItemsPerScope: 5, truncateContentLength: 200 },
        activeScopes
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
    // Sentinel: Do not leak internal error details to the client
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500 }
    )
  }
}
