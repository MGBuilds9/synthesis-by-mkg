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
                connectedAccount: {
                  select: {
                    provider: true,
                  },
                },
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

  // Bolt: Request batching to avoid redundant queries for the same account
  const queryCache = new Map<string, Promise<any>>()

  const scopePromises = contextScopes.map(async (contextScope: any) => {
    if (!contextScope.syncScope) return null

    const { connectedAccountId, scopeType, connectedAccount } = contextScope.syncScope
    let category = ''
    if (['DISCORD_CHANNEL', 'GMAIL_LABEL', 'OUTLOOK_FOLDER'].includes(scopeType)) category = 'messages'
    else if (['DRIVE_FOLDER', 'ONEDRIVE_FOLDER'].includes(scopeType)) category = 'files'
    else if (['NOTION_WORKSPACE', 'NOTION_DATABASE', 'NOTION_PAGE'].includes(scopeType)) category = 'notion'

    if (!category) return null

    const cacheKey = `${connectedAccountId}:${category}`

    if (queryCache.has(cacheKey)) {
      return queryCache.get(cacheKey)
    }

    const queryPromise = (async () => {
      // Fetch messages if this is a messaging scope
      if (category === 'messages') {
        // Bolt: Optimized query strategy
        // 1. Fetch relevant thread IDs using the efficient [connectedAccountId, lastMessageAt] index
        // This avoids scanning the large Message table by provider and joining on thread
        const threads = await prisma.messageThread.findMany({
          where: {
            connectedAccountId: connectedAccountId,
            lastMessageAt: {
              gte: cutoffDate,
            },
          },
          select: { id: true },
          orderBy: { lastMessageAt: 'desc' },
          take: maxItemsPerScope, // Optimistic take: top threads likely contain top messages
        })

        const threadIds = threads.map(t => t.id)

        if (threadIds.length === 0) {
          return { type: 'messages', data: [] }
        }

        // 2. Fetch messages using the thread IDs
        const messages = await prisma.message.findMany({
          where: {
            threadId: { in: threadIds },
            sentAt: {
              gte: cutoffDate,
            },
          },
          orderBy: { sentAt: 'desc' },
          take: maxItemsPerScope,
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

        return {
          type: 'messages',
          data: messages.map(msg => ({
            id: msg.id,
            provider: msg.provider,
            sender: msg.sender,
            content: msg.content,
            sentAt: msg.sentAt,
            subject: msg.thread.subject,
          }))
        }
      }

      // Fetch files if this is a storage scope
      if (category === 'files') {
        const files = await prisma.fileItem.findMany({
          where: {
            connectedAccountId: connectedAccountId,
            modifiedTime: {
              gte: cutoffDate,
            },
          },
          orderBy: { modifiedTime: 'desc' },
          take: maxItemsPerScope,
          select: {
            id: true, // Bolt: Added ID for deduplication
            provider: true,
            name: true,
            modifiedTime: true,
            webViewLink: true,
          },
        })

        return {
          type: 'files',
          data: files.map(file => ({
            id: file.id,
            provider: file.provider,
            name: file.name,
            modifiedTime: file.modifiedTime,
            webViewLink: file.webViewLink,
          }))
        }
      }

      // Fetch Notion resources if this is a Notion scope
      if (category === 'notion') {
        const notionResources = await prisma.notionResource.findMany({
          where: {
            connectedAccountId: connectedAccountId,
            lastEditedTime: {
              gte: cutoffDate,
            },
          },
          orderBy: { lastEditedTime: 'desc' },
          take: maxItemsPerScope,
          select: {
            id: true, // Bolt: Added ID for deduplication
            title: true,
            resourceType: true,
            lastEditedTime: true,
            url: true,
          },
        })

        return {
          type: 'notionPages',
          data: notionResources.map(resource => ({
            id: resource.id,
            title: resource.title,
            type: resource.resourceType,
            lastEditedTime: resource.lastEditedTime,
            url: resource.url,
          }))
        }
      }

      return null
    })()

    queryCache.set(cacheKey, queryPromise)
    return queryPromise
  })

  const results = await Promise.all(scopePromises)
  const processedMessageIds = new Set<string>()
  const processedFileIds = new Set<string>()
  const processedNotionIds = new Set<string>()

  results.forEach(result => {
    if (!result) return

    if (result.type === 'messages') {
      result.data.forEach((item: any) => {
        if (!processedMessageIds.has(item.id)) {
          processedMessageIds.add(item.id)
          contextData.messages.push(item)
        }
      })
    } else if (result.type === 'files') {
      result.data.forEach((item: any) => {
        if (!processedFileIds.has(item.id)) {
          processedFileIds.add(item.id)
          contextData.files.push(item)
        }
      })
    } else if (result.type === 'notionPages') {
      result.data.forEach((item: any) => {
        if (!processedNotionIds.has(item.id)) {
          processedNotionIds.add(item.id)
          contextData.notionPages.push(item)
        }
      })
    }
  })

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
