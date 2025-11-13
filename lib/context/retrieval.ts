import { prisma } from '../prisma'
import { subDays } from 'date-fns'

export interface ContextOptions {
  sessionId: string
  timeWindowDays?: number
  maxItemsPerScope?: number
}

export async function retrieveAIContext(options: ContextOptions) {
  const { sessionId, timeWindowDays = 30, maxItemsPerScope = 10 } = options

  const session = await prisma.aiChatSession.findUnique({
    where: { id: sessionId },
    include: {
      contextScopes: {
        where: { enabled: true },
        include: {
          syncScope: {
            include: {
              connectedAccount: true,
            },
          },
        },
      },
    },
  })

  if (!session) {
    return null
  }

  const cutoffDate = subDays(new Date(), timeWindowDays)
  const contextData: any = {
    messages: [],
    files: [],
    notionPages: [],
  }

  for (const contextScope of session.contextScopes) {
    if (!contextScope.syncScope) continue

    const { connectedAccount, scopeType } = contextScope.syncScope

    // Fetch messages if this is a messaging scope
    if (['DISCORD_CHANNEL', 'GMAIL_LABEL', 'OUTLOOK_FOLDER'].includes(scopeType)) {
      const messages = await prisma.message.findMany({
        where: {
          thread: {
            connectedAccountId: connectedAccount.id,
          },
          sentAt: {
            gte: cutoffDate,
          },
        },
        orderBy: { sentAt: 'desc' },
        take: maxItemsPerScope,
        include: {
          thread: true,
        },
      })

      contextData.messages.push(...messages.map(msg => ({
        provider: msg.provider,
        sender: msg.sender,
        content: msg.content,
        sentAt: msg.sentAt,
        subject: msg.thread.subject,
      })))
    }

    // Fetch files if this is a storage scope
    if (['DRIVE_FOLDER', 'ONEDRIVE_FOLDER'].includes(scopeType)) {
      const files = await prisma.fileItem.findMany({
        where: {
          connectedAccountId: connectedAccount.id,
          modifiedTime: {
            gte: cutoffDate,
          },
        },
        orderBy: { modifiedTime: 'desc' },
        take: maxItemsPerScope,
      })

      contextData.files.push(...files.map(file => ({
        provider: file.provider,
        name: file.name,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
      })))
    }

    // Fetch Notion resources if this is a Notion scope
    if (['NOTION_WORKSPACE', 'NOTION_DATABASE', 'NOTION_PAGE'].includes(scopeType)) {
      const notionResources = await prisma.notionResource.findMany({
        where: {
          connectedAccountId: connectedAccount.id,
          lastEditedTime: {
            gte: cutoffDate,
          },
        },
        orderBy: { lastEditedTime: 'desc' },
        take: maxItemsPerScope,
      })

      contextData.notionPages.push(...notionResources.map(resource => ({
        title: resource.title,
        type: resource.resourceType,
        lastEditedTime: resource.lastEditedTime,
        url: resource.url,
      })))
    }
  }

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
