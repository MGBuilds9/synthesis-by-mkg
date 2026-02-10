import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import logger from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const rawLimit = parseInt(searchParams.get('limit') || '50')
    // Sentinel: Cap limit to 100 to prevent DoS
    const limit = Math.max(1, Math.min(100, isNaN(rawLimit) ? 50 : rawLimit))
    const offset = parseInt(searchParams.get('offset') || '0')

    // Bolt: Fetch connected account IDs first to avoid join and leverage indexes
    // This allows filtering MessageThread by connectedAccountId which is indexed
    const accountWhere: any = {
      userId: session.user.id,
    }

    if (provider) {
      accountWhere.provider = provider
    }

    const accounts = await prisma.connectedAccount.findMany({
      where: accountWhere,
      select: { id: true },
    })

    const accountIds = accounts.map((account) => account.id)

    const whereClause: any = {
      connectedAccountId: { in: accountIds },
    }

    // Bolt: Optimized to run findMany and count in parallel to reduce latency
    const [threads, total] = await Promise.all([
      prisma.messageThread.findMany({
        where: whereClause,
        include: {
          messages: {
            // Bolt: Select only necessary fields to reduce payload size (excludes htmlContent)
            select: {
              id: true,
              sender: true,
              content: true,
              sentAt: true,
              isRead: true,
              providerMessageId: true,
            },
            orderBy: { sentAt: 'desc' },
            take: 1,
          },
          connectedAccount: {
            select: {
              accountLabel: true,
              provider: true,
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.messageThread.count({ where: whereClause }),
    ])

    return NextResponse.json({
      threads,
      total,
      limit,
      offset,
    })
  } catch (error: any) {
    logger.error('Failed to fetch messages', { error })
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
