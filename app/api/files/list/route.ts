import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import logger from '@/lib/logger'
import { rateLimiter } from '@/lib/ratelimit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sentinel: Rate limiting
    const rateLimit = rateLimiter.check(session.user.id)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          },
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const rawLimit = parseInt(searchParams.get('limit') || '50')
    // Sentinel: Cap limit to 100 to prevent DoS
    const limit = Math.max(1, Math.min(100, isNaN(rawLimit) ? 50 : rawLimit))
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

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

    // Bolt: Optimized to run findMany and count in parallel to reduce latency
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
      prisma.fileItem.count({ where: whereClause }),
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

    const response = NextResponse.json({
      files: filesWithAccount,
      total,
      limit,
      offset,
    })

    // Sentinel: Add rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimit.reset.toString())

    return response
  } catch (error: any) {
    logger.error('Failed to fetch files', { error })
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}
