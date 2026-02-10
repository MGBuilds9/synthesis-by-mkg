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
  const contextData: any = {
    messages: [],
    files: [],
    notionPages: [],
  }

  // Bolt: Group connectedAccountIds by category to batch queries
  // This reduces N+1 query overhead by executing one query per category instead of per scope.
  const scopeMap = {
    messages: new Set<string>(),
    files: new Set<string>(),
    notion: new Set<string>(),
  }

  contextScopes.forEach((contextScope: any) => {
    if (!contextScope.syncScope) return

    const { connectedAccountId, scopeType } = contextScope.syncScope

    if (['DISCORD_CHANNEL', 'GMAIL_LABEL', 'OUTLOOK_FOLDER'].includes(scopeType)) {
      scopeMap.messages.add(connectedAccountId)
    } else if (['DRIVE_FOLDER', 'ONEDRIVE_FOLDER'].includes(scopeType)) {
      scopeMap.files.add(connectedAccountId)
    } else if (['NOTION_WORKSPACE', 'NOTION_DATABASE', 'NOTION_PAGE'].includes(scopeType)) {
      scopeMap.notion.add(connectedAccountId)
    }
  })

  // Execute parallel queries for each category
  const [messages, files, notionPages] = await Promise.all([
    // Messages Query
    (async () => {
      const accountIds = Array.from(scopeMap.messages)
      if (accountIds.length === 0) return []

      // 1. Find active threads across all accounts
      const activeThreads = await prisma.messageThread.findMany({
        where: {
          connectedAccountId: { in: accountIds },
          lastMessageAt: { gte: cutoffDate },
        },
        select: { id: true },
        // Bolt: Fetch strictly the most recent threads across all accounts
        orderBy: { lastMessageAt: 'desc' },
        take: maxItemsPerScope * 2,
      })

      const threadIds = activeThreads.map(t => t.id)
      if (threadIds.length === 0) return []

      // 2. Fetch messages
      return prisma.message.findMany({
        where: {
            threadId: { in: threadIds },
            sentAt: { gte: cutoffDate }
        },
        orderBy: { sentAt: 'desc' },
        take: maxItemsPerScope,
        select: {
          id: true,
          provider: true,
          sender: true,
          content: true,
          sentAt: true,
          thread: { select: { subject: true } }
        }
      })
    })(),

    // Files Query
    (async () => {
      const accountIds = Array.from(scopeMap.files)
      if (accountIds.length === 0) return []

      return prisma.fileItem.findMany({
        where: {
          connectedAccountId: { in: accountIds },
          modifiedTime: { gte: cutoffDate }
        },
        orderBy: { modifiedTime: 'desc' },
        take: maxItemsPerScope,
        select: {
          id: true,
          provider: true,
          name: true,
          modifiedTime: true,
          webViewLink: true
        }
      })
    })(),

    // Notion Query
    (async () => {
       const accountIds = Array.from(scopeMap.notion)
       if (accountIds.length === 0) return []

       return prisma.notionResource.findMany({
         where: {
           connectedAccountId: { in: accountIds },
           lastEditedTime: { gte: cutoffDate }
         },
         orderBy: { lastEditedTime: 'desc' },
         take: maxItemsPerScope,
         select: {
           id: true,
           title: true,
           resourceType: true,
           lastEditedTime: true,
           url: true
         }
       })
    })()
  ])

  // Map results to contextData
  contextData.messages = messages.map(msg => ({
    id: msg.id,
    provider: msg.provider,
    sender: msg.sender,
    content: msg.content,
    sentAt: msg.sentAt,
    subject: msg.thread.subject
  }))

  contextData.files = files.map(file => ({
    id: file.id,
    provider: file.provider,
    name: file.name,
    modifiedTime: file.modifiedTime,
    webViewLink: file.webViewLink
  }))

  contextData.notionPages = notionPages.map(page => ({
    id: page.id,
    title: page.title,
    type: page.resourceType,
    lastEditedTime: page.lastEditedTime,
    url: page.url
  }))

  return contextData
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
