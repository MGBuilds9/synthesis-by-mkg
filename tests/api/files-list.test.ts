import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/files/list/route'

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

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
  logProviderActivity: vi.fn(),
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

describe('GET /api/files/list', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock for connected accounts
    vi.mocked(prisma.connectedAccount.findMany).mockResolvedValue([
      { id: 'acc-1', accountLabel: 'My Google Drive', provider: 'GOOGLE_DRIVE' }
    ] as any)
  })

  function createRequest(searchParams: Record<string, string> = {}): NextRequest {
    const params = new URLSearchParams(searchParams)
    const url = `http://localhost/api/files/list${params.toString() ? '?' + params.toString() : ''}`
    return new NextRequest(url, { method: 'GET' })
  }

  it('returns 401 when no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    const request = createRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns files with default pagination', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const mockFiles = [
      {
        id: 'file-1',
        name: 'document.pdf',
        provider: 'GOOGLE_DRIVE',
        size: 1024,
        modifiedTime: new Date('2024-01-15'),
        webViewLink: 'https://drive.google.com/file/123',
        connectedAccountId: 'acc-1',
      },
      {
        id: 'file-2',
        name: 'spreadsheet.xlsx',
        provider: 'GOOGLE_DRIVE',
        size: 2048,
        modifiedTime: new Date('2024-01-14'),
        webViewLink: 'https://drive.google.com/file/456',
        connectedAccountId: 'acc-1',
      },
    ]

    vi.mocked(prisma.fileItem.findMany).mockResolvedValue(mockFiles as any)
    vi.mocked(prisma.fileItem.count).mockResolvedValue(2)

    const request = createRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.files).toHaveLength(2)
    expect(data.files[0].id).toBe('file-1')
    expect(data.files[0].name).toBe('document.pdf')
    expect(data.files[0].connectedAccount).toEqual({
      accountLabel: 'My Google Drive',
      provider: 'GOOGLE_DRIVE',
    })
    expect(data.files[1].id).toBe('file-2')
    expect(data.files[1].name).toBe('spreadsheet.xlsx')
    expect(data.total).toBe(-1)
    expect(data.limit).toBe(50)
    expect(data.offset).toBe(0)

    // Verify connectedAccount fetch
    expect(prisma.connectedAccount.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      select: { id: true, accountLabel: true, provider: true },
    })

    expect(prisma.fileItem.findMany).toHaveBeenCalledWith({
      where: {
        connectedAccountId: { in: ['acc-1'] },
      },
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
      take: 50,
      skip: 0,
    })

    expect(prisma.fileItem.count).not.toHaveBeenCalled()
  })

  it('returns total count when requested', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const mockFiles = [
      {
        id: 'file-1',
        name: 'document.pdf',
        provider: 'GOOGLE_DRIVE',
        size: 1024,
        modifiedTime: new Date('2024-01-15'),
        webViewLink: 'https://drive.google.com/file/123',
        connectedAccountId: 'acc-1',
      },
    ]

    vi.mocked(prisma.fileItem.findMany).mockResolvedValue(mockFiles as any)
    vi.mocked(prisma.fileItem.count).mockResolvedValue(5)

    const request = createRequest({ includeCount: 'true' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.files).toHaveLength(1)
    expect(data.total).toBe(5)

    expect(prisma.fileItem.count).toHaveBeenCalledWith({
      where: {
        connectedAccountId: { in: ['acc-1'] },
      },
    })
  })

  it('filters by provider when specified', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const mockFiles = [
      {
        id: 'file-1',
        name: 'document.pdf',
        provider: 'GOOGLE_DRIVE',
        size: 1024,
        modifiedTime: new Date('2024-01-15'),
        webViewLink: 'https://drive.google.com/file/123',
        connectedAccountId: 'acc-1',
      },
    ]

    vi.mocked(prisma.fileItem.findMany).mockResolvedValue(mockFiles as any)
    vi.mocked(prisma.fileItem.count).mockResolvedValue(1)

    const request = createRequest({ provider: 'GOOGLE_DRIVE' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.files).toHaveLength(1)
    expect(data.files[0].id).toBe('file-1')
    expect(data.files[0].provider).toBe('GOOGLE_DRIVE')
    expect(data.total).toBe(-1)

    // Verify connectedAccount fetch with provider filter
    expect(prisma.connectedAccount.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-123',
        provider: 'GOOGLE_DRIVE'
      },
      select: { id: true, accountLabel: true, provider: true },
    })

    expect(prisma.fileItem.findMany).toHaveBeenCalledWith({
      where: {
        connectedAccountId: { in: ['acc-1'] },
      },
      select: expect.any(Object),
      orderBy: { modifiedTime: 'desc' },
      take: 50,
      skip: 0,
    })
  })

  it('filters by search term (case insensitive)', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const mockFiles = [
      {
        id: 'file-1',
        name: 'Important Document.pdf',
        provider: 'GOOGLE_DRIVE',
        size: 1024,
        modifiedTime: new Date('2024-01-15'),
        webViewLink: 'https://drive.google.com/file/123',
        connectedAccountId: 'acc-1',
      },
    ]

    vi.mocked(prisma.fileItem.findMany).mockResolvedValue(mockFiles as any)
    vi.mocked(prisma.fileItem.count).mockResolvedValue(1)

    const request = createRequest({ search: 'important' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.files).toHaveLength(1)
    expect(data.files[0].name).toBe('Important Document.pdf')

    expect(prisma.fileItem.findMany).toHaveBeenCalledWith({
      where: {
        connectedAccountId: { in: ['acc-1'] },
        name: {
          contains: 'important',
          mode: 'insensitive',
        },
      },
      select: expect.any(Object),
      orderBy: { modifiedTime: 'desc' },
      take: 50,
      skip: 0,
    })
  })

  it('filters by provider and search term combined', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const mockFiles = [
      {
        id: 'file-1',
        name: 'Report Q1.pdf',
        provider: 'GOOGLE_DRIVE',
        size: 1024,
        modifiedTime: new Date('2024-01-15'),
        webViewLink: 'https://drive.google.com/file/123',
        connectedAccountId: 'acc-1',
      },
    ]

    vi.mocked(prisma.fileItem.findMany).mockResolvedValue(mockFiles as any)
    vi.mocked(prisma.fileItem.count).mockResolvedValue(1)

    const request = createRequest({ provider: 'GOOGLE_DRIVE', search: 'report' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)

    // Verify connectedAccount fetch with provider filter
    expect(prisma.connectedAccount.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-123',
        provider: 'GOOGLE_DRIVE'
      },
      select: { id: true, accountLabel: true, provider: true },
    })

    expect(prisma.fileItem.findMany).toHaveBeenCalledWith({
      where: {
        connectedAccountId: { in: ['acc-1'] },
        name: {
          contains: 'report',
          mode: 'insensitive',
        },
      },
      select: expect.any(Object),
      orderBy: { modifiedTime: 'desc' },
      take: 50,
      skip: 0,
    })
  })

  it('returns correct pagination metadata with custom limit and offset', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const mockFiles = [
      {
        id: 'file-11',
        name: 'file11.pdf',
        provider: 'GOOGLE_DRIVE',
        size: 1024,
        modifiedTime: new Date('2024-01-05'),
        webViewLink: 'https://drive.google.com/file/11',
        connectedAccountId: 'acc-1',
      },
    ]

    vi.mocked(prisma.fileItem.findMany).mockResolvedValue(mockFiles as any)
    vi.mocked(prisma.fileItem.count).mockResolvedValue(25)

    const request = createRequest({ limit: '10', offset: '10' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.files).toHaveLength(1)
    expect(data.files[0].id).toBe('file-11')
    expect(data.total).toBe(-1)
    expect(data.limit).toBe(10)
    expect(data.offset).toBe(10)

    expect(prisma.fileItem.findMany).toHaveBeenCalledWith({
      where: {
        connectedAccountId: { in: ['acc-1'] },
      },
      select: expect.any(Object),
      orderBy: { modifiedTime: 'desc' },
      take: 10,
      skip: 10,
    })
  })

  it('returns empty array when no files found', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    vi.mocked(prisma.fileItem.findMany).mockResolvedValue([])
    vi.mocked(prisma.fileItem.count).mockResolvedValue(0)

    const request = createRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.files).toEqual([])
    expect(data.total).toBe(-1)
  })

  it('returns 500 on internal error', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as any)

    const error = new Error('Database connection failed')
    vi.mocked(prisma.fileItem.findMany).mockRejectedValue(error)

    const request = createRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch files')
    expect(data.details).toBeUndefined()
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch files', { error })
  })
})
