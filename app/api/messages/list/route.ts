import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Bolt: Optimize query by fetching relevant account IDs first.
    // This avoids a cross-table join filter on MessageThread, allowing the database
    // to utilize the `@@index([connectedAccountId, lastMessageAt])` for efficient
    // sorting and pagination (O(K) vs O(N)).
    const accountWhere: any = {
      userId: session.user.id,
    }
    if (provider) {
      accountWhere.provider = provider
    }

    const connectedAccounts = await prisma.connectedAccount.findMany({
      where: accountWhere,
      select: { id: true },
    })

    const connectedAccountIds = connectedAccounts.map((acc) => acc.id)

    const whereClause: any = {
      connectedAccountId: {
        in: connectedAccountIds,
      },
    }

    if (provider) {
      whereClause.provider = provider
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
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error.message },
      { status: 500 }
    )
  }
}
