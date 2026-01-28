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
    const search = searchParams.get('search')

    const whereClause: any = {
      connectedAccount: {
        userId: session.user.id,
      },
    }

    if (provider) {
      whereClause.provider = provider
    }

    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Bolt: Optimized to run findMany and count in parallel to reduce latency
    const [files, total] = await Promise.all([
      prisma.fileItem.findMany({
        where: whereClause,
        include: {
          connectedAccount: {
            select: {
              accountLabel: true,
              provider: true,
            },
          },
        },
        orderBy: { modifiedTime: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.fileItem.count({ where: whereClause }),
    ])

    return NextResponse.json({
      files,
      total,
      limit,
      offset,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch files', details: error.message },
      { status: 500 }
    )
  }
}
