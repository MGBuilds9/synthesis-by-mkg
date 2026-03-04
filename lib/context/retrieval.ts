import { prisma } from '../prisma'
import { subDays } from 'date-fns'

export interface ContextOptions {
  sessionId: string
  timeWindowDays?: number
  maxItemsPerScope?: number
  truncateContentLength?: number
}

export async function retrieveAIContext(options: ContextOptions, preFetchedScopes?: any[]) {
  const { sessionId, timeWindowDays = 30, maxItemsPerScope = 10, truncateContentLength } = options
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
          subject: true,
        },
        orderBy: { lastMessageAt: 'desc' },
        take: limit, // Fetch enough threads to potentially satisfy the message limit
      })

      const threadMap = new Map(activeThreads.map(t => [t.id, t.subject]))
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
          threadId: true,
        },
      })

      // Bolt: Optimized mapping and string truncation
      // Using a pre-allocated array and manual loop is faster for high-frequency operations.
      // String slicing is only performed if the length exceeds the limit, avoiding unnecessary allocations.
      const mappedMsgs = new Array(msgs.length)
      for (let i = 0; i < msgs.length; i++) {
        const msg = msgs[i]
        let content = msg.content
        if (truncateContentLength && content.length > truncateContentLength) {
          content = content.slice(0, truncateContentLength)
        }
        mappedMsgs[i] = {
          id: msg.id,
          provider: msg.provider,
          sender: msg.sender,
          content: content,
          sentAt: msg.sentAt,
          subject: threadMap.get(msg.threadId) || null,
        }
      }
      return mappedMsgs
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

      // Bolt: Pre-allocated array mapping for files
      const mappedFiles = new Array(files.length)
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        mappedFiles[i] = {
          id: file.id,
          provider: file.provider,
          name: file.name,
          modifiedTime: file.modifiedTime,
          webViewLink: file.webViewLink,
        }
      }
      return mappedFiles
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

      // Bolt: Pre-allocated array mapping for notion pages
      const mappedResources = new Array(resources.length)
      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i]
        mappedResources[i] = {
          id: resource.id,
          title: resource.title,
          type: resource.resourceType,
          lastEditedTime: resource.lastEditedTime,
          url: resource.url,
        }
      }
      return mappedResources
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
    // Bolt: Optimized context summarization loops
    // Avoids creating new arrays with slice() and function overhead of forEach()
    // Conditionally slices string contents to reduce memory allocations.
    const msgLimit = Math.min(contextData.messages.length, 5)
    for (let i = 0; i < msgLimit; i++) {
      const msg = contextData.messages[i]
      const content = msg.content.length > 100 ? `${msg.content.slice(0, 100)}...` : msg.content
      parts.push(`- ${msg.sender}: ${content}`)
    }
  }

  if (contextData.files.length > 0) {
    parts.push(`\nRecent Files (${contextData.files.length}):`)
    const fileLimit = Math.min(contextData.files.length, 5)
    for (let i = 0; i < fileLimit; i++) {
      const file = contextData.files[i]
      parts.push(`- ${file.name} (${file.provider})`)
    }
  }

  if (contextData.notionPages.length > 0) {
    parts.push(`\nNotion Pages (${contextData.notionPages.length}):`)
    const pageLimit = Math.min(contextData.notionPages.length, 5)
    for (let i = 0; i < pageLimit; i++) {
      const page = contextData.notionPages[i]
      parts.push(`- ${page.title} (${page.type})`)
    }
  }

  return parts.join('\n')
}
