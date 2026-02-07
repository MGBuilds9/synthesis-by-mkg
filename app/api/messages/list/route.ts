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

    // Bolt: Optimization - Fetch connected account IDs first to avoid implicit join on MessageThread query
    // This leverages the [connectedAccountId, lastMessageAt] index more effectively
    const connectedAccounts = await prisma.connectedAccount.findMany({
      where: {
        userId: session.user.id,
        ...(provider ? { provider: provider as any } : {}),
      },
      select: { id: true },
    })

    const connectedAccountIds = connectedAccounts.map((ca) => ca.id)

    const whereClause: any = {
      connectedAccountId: { in: connectedAccountIds },
      ...(provider ? { provider: provider as any } : {}),
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
