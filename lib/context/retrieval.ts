import { prisma } from '../prisma'
import { subDays } from 'date-fns'

export interface ContextOptions {
  sessionId: string
  timeWindowDays?: number
  maxItemsPerScope?: number
}

export async function retrieveAIContext(options: ContextOptions, preFetchedScopes?: any[]) {
  const { sessionId, timeWindowDays = 30, maxItemsPerScope = 10 } = options
  let contextScopes = preFetchedScopes

  if (!contextScopes) {
    const session = await prisma.aiChatSession.findUnique({
      where: { id: sessionId },
      include: {
        contextScopes: {
          where: { enabled: true },
          include: {
            syncScope: {
              select: {
                connectedAccountId: true,
                scopeType: true,
              },
            },
          },
        },
      },
    })

    if (!session) {
      return null
    }
    contextScopes = session.contextScopes
  }

  const cutoffDate = subDays(new Date(), timeWindowDays)

  // Bolt: Group connected accounts by category to batch queries
  const messageAccountIds = new Set<string>()
  const fileAccountIds = new Set<string>()
  const notionAccountIds = new Set<string>()

  contextScopes.forEach((contextScope: any) => {
    if (!contextScope.syncScope) return

    const { connectedAccountId, scopeType } = contextScope.syncScope

    if (['DISCORD_CHANNEL', 'GMAIL_LABEL', 'OUTLOOK_FOLDER'].includes(scopeType)) {
      messageAccountIds.add(connectedAccountId)
    } else if (['DRIVE_FOLDER', 'ONEDRIVE_FOLDER'].includes(scopeType)) {
      fileAccountIds.add(connectedAccountId)
    } else if (['NOTION_WORKSPACE', 'NOTION_DATABASE', 'NOTION_PAGE'].includes(scopeType)) {
      notionAccountIds.add(connectedAccountId)
    }
  })

  // Bolt: Execute parallel batch queries
  const [messages, files, notionPages] = await Promise.all([
    // 1. Fetch Messages
    (async () => {
      if (messageAccountIds.size === 0) return []

      // Bolt: Use strict limit to avoid over-fetching across multiple accounts, since we only summarize the top few items anyway
      const limit = maxItemsPerScope

      // Fetch threads first to filter by connected accounts efficiently
      const activeThreads = await prisma.messageThread.findMany({
        where: {
          connectedAccountId: { in: Array.from(messageAccountIds) },
          lastMessageAt: {
            gte: cutoffDate,
          },
        },
        select: {
          id: true,
        },
        orderBy: { lastMessageAt: 'desc' },
        take: limit, // Fetch enough threads to potentially satisfy the message limit
      })

      const threadIds = activeThreads.map(t => t.id)
      if (threadIds.length === 0) return []

      const msgs = await prisma.message.findMany({
        where: {
          threadId: {
            in: threadIds,
          },
          sentAt: {
            gte: cutoffDate,
          },
        },
        orderBy: { sentAt: 'desc' },
        take: limit,
        select: {
          id: true,
          provider: true,
          sender: true,
          content: true,
          sentAt: true,
          thread: {
            select: {
              subject: true,
            },
          },
        },
      })

      return msgs.map(msg => ({
        id: msg.id,
        provider: msg.provider,
        sender: msg.sender,
        content: msg.content,
        sentAt: msg.sentAt,
        subject: msg.thread.subject,
      }))
    })(),

    // 2. Fetch Files
    (async () => {
      if (fileAccountIds.size === 0) return []
      const limit = maxItemsPerScope

      const files = await prisma.fileItem.findMany({
        where: {
          connectedAccountId: { in: Array.from(fileAccountIds) },
          modifiedTime: {
            gte: cutoffDate,
          },
        },
        orderBy: { modifiedTime: 'desc' },
        take: limit,
        select: {
          id: true,
          provider: true,
          name: true,
          modifiedTime: true,
          webViewLink: true,
        },
      })

      return files.map(file => ({
        id: file.id,
        provider: file.provider,
        name: file.name,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
      }))
    })(),

    // 3. Fetch Notion Pages
    (async () => {
      if (notionAccountIds.size === 0) return []
      const limit = maxItemsPerScope

      const resources = await prisma.notionResource.findMany({
        where: {
          connectedAccountId: { in: Array.from(notionAccountIds) },
          lastEditedTime: {
            gte: cutoffDate,
          },
        },
        orderBy: { lastEditedTime: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          resourceType: true,
          lastEditedTime: true,
          url: true,
        },
      })

      return resources.map(resource => ({
        id: resource.id,
        title: resource.title,
        type: resource.resourceType,
        lastEditedTime: resource.lastEditedTime,
        url: resource.url,
      }))
    })(),
  ])

  return {
    messages,
    files,
    notionPages,
  }
}

export function summarizeContext(contextData: any): string {
  const parts: string[] = []

  if (contextData.messages.length > 0) {
    parts.push(`Recent Messages (${contextData.messages.length}):`)
    contextData.messages.slice(0, 5).forEach((msg: any) => {
      parts.push(`- ${msg.sender}: ${msg.content.slice(0, 100)}...`)
    })
  }

  if (contextData.files.length > 0) {
    parts.push(`\nRecent Files (${contextData.files.length}):`)
    contextData.files.slice(0, 5).forEach((file: any) => {
      parts.push(`- ${file.name} (${file.provider})`)
    })
  }

  if (contextData.notionPages.length > 0) {
    parts.push(`\nNotion Pages (${contextData.notionPages.length}):`)
    contextData.notionPages.slice(0, 5).forEach((page: any) => {
      parts.push(`- ${page.title} (${page.type})`)
    })
  }

  return parts.join('\n')
}
