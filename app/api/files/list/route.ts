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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    // Bolt: Fetch connected accounts first to leverage indexes and avoid joins
    // This allows filtering FileItem by connectedAccountId which is indexed
    const accountWhere: any = {
      userId: session.user.id,
    }

    if (provider) {
      accountWhere.provider = provider
    }

    const accounts = await prisma.connectedAccount.findMany({
      where: accountWhere,
      select: {
        id: true,
        accountLabel: true,
        provider: true,
      },
    })

    const accountIds = accounts.map((account) => account.id)
    const accountMap = new Map(accounts.map((a) => [a.id, a]))

    const whereClause: any = {
      connectedAccountId: { in: accountIds },
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
        // Bolt: Optimized to select only necessary fields and avoid nested relation fetch
        select: {
          id: true,
          name: true,
          provider: true,
          size: true,
          modifiedTime: true,
          webViewLink: true,
          connectedAccountId: true, // Needed for manual mapping
        },
        orderBy: { modifiedTime: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.fileItem.count({ where: whereClause }),
    ])

    // Bolt: Attach connected account details in memory to avoid N+1 DB joins
    const enrichedFiles = files.map((file) => ({
      ...file,
      connectedAccount: {
        accountLabel: accountMap.get(file.connectedAccountId)?.accountLabel,
        provider: accountMap.get(file.connectedAccountId)?.provider,
      },
    }))

    return NextResponse.json({
      files: enrichedFiles,
      total,
      limit,
      offset,
    })
  } catch (error: any) {
    logger.error('Failed to fetch files', { error })
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}
