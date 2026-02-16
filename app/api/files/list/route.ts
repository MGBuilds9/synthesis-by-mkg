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
    const search = searchParams.get('search')
    const includeCount = searchParams.get('includeCount') === 'true'

    // Bolt: Fetch connected account IDs first to avoid join and leverage indexes
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

    // Bolt: Optimized to run findMany and optional count in parallel to reduce latency
    // Bolt: Only count if explicitly requested to avoid expensive aggregation on every request
    const [files, total] = await Promise.all([
      prisma.fileItem.findMany({
        where: whereClause,
        // Bolt: Optimized to select only necessary fields to reduce payload size
        // Bolt: Removed connectedAccount join to improve performance, re-attached in memory
        select: {
          id: true,
          name: true,
          provider: true,
          size: true,
          modifiedTime: true,
          webViewLink: true,
          connectedAccountId: true,
        },
        orderBy: { modifiedTime: 'desc' },
        take: limit,
        skip: offset,
      }),
      includeCount ? prisma.fileItem.count({ where: whereClause }) : Promise.resolve(-1),
    ])

    // Bolt: Attach connected account details in memory to avoid N+1/JOIN query overhead
    const filesWithAccount = files.map((file) => {
      const account = accountMap.get(file.connectedAccountId)

      // Sentinel: Sanitize webViewLink to prevent XSS
      let safeWebViewLink = file.webViewLink
      if (safeWebViewLink && !safeWebViewLink.startsWith('http://') && !safeWebViewLink.startsWith('https://')) {
        safeWebViewLink = null
      }

      return {
        ...file,
        webViewLink: safeWebViewLink,
        connectedAccount: {
          accountLabel: account?.accountLabel || null,
          provider: account?.provider || file.provider,
        },
      }
    })

    return NextResponse.json({
      files: filesWithAccount,
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
