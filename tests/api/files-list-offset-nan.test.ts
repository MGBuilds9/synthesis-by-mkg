import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/files/list/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    connectedAccount: { findMany: vi.fn() },
    fileItem: { findMany: vi.fn(), count: vi.fn() },
  },
}))

describe('Files List - Offset NaN', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1' }, expires: '2024-01-01' })
    vi.mocked(prisma.connectedAccount.findMany).mockResolvedValue([{ id: 'account1', accountLabel: 'Account', provider: 'GMAIL' } as any])
    vi.mocked(prisma.fileItem.findMany).mockResolvedValue([])
    vi.mocked(prisma.fileItem.count).mockResolvedValue(0)
  })

  it('should fallback offset to 0 when NaN', async () => {
    const req = new NextRequest('http://localhost/api/files/list?offset=invalid')
    const res = await GET(req)

    expect(prisma.fileItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 0
    }))
  })
})
