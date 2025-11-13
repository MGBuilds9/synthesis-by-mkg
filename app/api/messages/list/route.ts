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

    const whereClause: any = {
      connectedAccount: {
        userId: session.user.id,
      },
    }

    if (provider) {
      whereClause.provider = provider
    }

    const threads = await prisma.messageThread.findMany({
      where: whereClause,
      include: {
        messages: {
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
    })

    const total = await prisma.messageThread.count({ where: whereClause })

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
