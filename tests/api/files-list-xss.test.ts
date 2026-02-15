import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/files/list/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fileItem: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    connectedAccount: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

describe('GET /api/files/list - XSS Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)
    vi.mocked(prisma.connectedAccount.findMany).mockResolvedValue([
      { id: 'acc-1', accountLabel: 'My Drive', provider: 'GDRIVE' }
    ] as any)
  })

  it('sanitizes webViewLink to prevent javascript: XSS vectors', async () => {
    // Mock a file with a malicious javascript: link
    vi.mocked(prisma.fileItem.findMany).mockResolvedValue([
      {
        id: 'file-1',
        name: 'Malicious File',
        provider: 'GDRIVE',
        size: 1024,
        modifiedTime: new Date(),
        webViewLink: 'javascript:alert(1)',
        connectedAccountId: 'acc-1',
      }
    ] as any)
    vi.mocked(prisma.fileItem.count).mockResolvedValue(1)

    const request = new NextRequest('http://localhost/api/files/list')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.files).toHaveLength(1)

    // The malicious link should be removed or sanitized
    // Currently (before fix) it returns the link as is, so this expectation would fail if the code was secure
    // We expect it to be null or safe URL after fix
    expect(data.files[0].webViewLink).not.toBe('javascript:alert(1)')
  })
})
