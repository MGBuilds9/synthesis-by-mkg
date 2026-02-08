import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'

// Mock winston
vi.mock('winston', () => {
  const mockLogger = {
    log: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }

  return {
    default: {
      createLogger: vi.fn(() => mockLogger),
      format: {
        combine: vi.fn((...args) => args),
        timestamp: vi.fn(() => 'timestamp'),
        json: vi.fn(() => 'json'),
        colorize: vi.fn(() => 'colorize'),
        simple: vi.fn(() => 'simple')
      },
      transports: {
        Console: vi.fn()
      }
    }
  }
})

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    providerLog: {
      create: vi.fn().mockResolvedValue({})
    }
  }
}))

describe('Logger Module', () => {
  let mockWinston: any
  let mockPrisma: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockWinston = (await import('winston')).default
    mockPrisma = (await import('@/lib/prisma')).prisma
  })

  it('should export a winston logger instance', async () => {
    const logger = (await import('@/lib/logger')).default

    expect(logger).toBeDefined()
    expect(mockWinston.createLogger).toHaveBeenCalled()
  })

  it('should configure logger with correct options', async () => {
    vi.resetModules()
    const mockWinston = (await import('winston')).default
    await import('@/lib/logger')

    expect(mockWinston.createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info'
      })
    )
  })

  describe('logProviderActivity', () => {
    it('should call winston logger with correct params', async () => {
      const mockWinston = (await import('winston')).default
      const logger = (await import('@/lib/logger')).default
      const { logProviderActivity } = await import('@/lib/logger')

      const mockLog = vi.fn()
      logger.log = mockLog

      await logProviderActivity(
        'GMAIL',
        'FETCH_MESSAGES',
        'INFO',
        'Successfully fetched messages'
      )

      expect(mockLog).toHaveBeenCalledWith(
        'info',
        '[GMAIL] FETCH_MESSAGES: Successfully fetched messages',
        { metadata: undefined }
      )
    })

    it('should call prisma.providerLog.create with correct data', async () => {
      vi.resetModules()
      const { logProviderActivity } = await import('@/lib/logger')
      const mockPrisma = (await import('@/lib/prisma')).prisma

      const mockCreate = vi.fn().mockResolvedValue({})
      mockPrisma.providerLog.create = mockCreate

      await logProviderActivity(
        'DISCORD',
        'SYNC_MESSAGES',
        'WARN',
        'Rate limit approaching',
        undefined,
        { channelId: '123' }
      )

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          provider: 'DISCORD',
          operation: 'SYNC_MESSAGES',
          level: 'WARN',
          message: 'Rate limit approaching',
          errorDetails: undefined,
          metadata: { channelId: '123' }
        }
      })
    })

    it('should include error details when provided', async () => {
      vi.resetModules()
      const { logProviderActivity } = await import('@/lib/logger')
      const mockPrisma = (await import('@/lib/prisma')).prisma

      const mockCreate = vi.fn().mockResolvedValue({})
      mockPrisma.providerLog.create = mockCreate

      await logProviderActivity(
        'GMAIL',
        'FETCH_MESSAGES',
        'ERROR',
        'Failed to fetch messages',
        'Network timeout error'
      )

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          provider: 'GMAIL',
          operation: 'FETCH_MESSAGES',
          level: 'ERROR',
          message: 'Failed to fetch messages',
          errorDetails: 'Network timeout error',
          metadata: undefined
        }
      })
    })

    it('should handle DB write failure gracefully', async () => {
      vi.resetModules()
      const logger = (await import('@/lib/logger')).default
      const { logProviderActivity } = await import('@/lib/logger')
      const mockPrisma = (await import('@/lib/prisma')).prisma

      const dbError = new Error('Database connection failed')
      mockPrisma.providerLog.create = vi.fn().mockRejectedValue(dbError)

      // Should not throw
      await expect(
        logProviderActivity('GMAIL', 'SYNC', 'INFO', 'Test message')
      ).resolves.toBeUndefined()

      // Wait for the catch block to execute
      await new Promise(resolve => setTimeout(resolve, 10))

      // Should log the DB error
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to write provider log to database',
        { error: dbError }
      )
    })

    it('should convert level to lowercase for winston', async () => {
      vi.resetModules()
      const logger = (await import('@/lib/logger')).default
      const { logProviderActivity } = await import('@/lib/logger')

      await logProviderActivity('GDRIVE', 'SYNC_FILES', 'ERROR', 'Sync failed')

      expect(logger.log).toHaveBeenCalledWith(
        'error',
        '[GDRIVE] SYNC_FILES: Sync failed',
        { metadata: undefined }
      )
    })

    it('should serialize metadata as JSON for database', async () => {
      vi.resetModules()
      const { logProviderActivity } = await import('@/lib/logger')
      const mockPrisma = (await import('@/lib/prisma')).prisma

      const mockCreate = vi.fn().mockResolvedValue({})
      mockPrisma.providerLog.create = mockCreate

      const metadata = {
        userId: '123',
        timestamp: new Date('2024-01-01'),
        nested: { value: 'test' }
      }

      await logProviderActivity(
        'NOTION',
        'FETCH_PAGES',
        'INFO',
        'Pages fetched',
        undefined,
        metadata
      )

      await new Promise(resolve => setTimeout(resolve, 10))

      const callArgs = mockCreate.mock.calls[0][0]
      expect(callArgs.data.metadata).toEqual(expect.objectContaining({
        userId: '123',
        nested: { value: 'test' }
      }))
    })

    it('should handle undefined metadata', async () => {
      vi.resetModules()
      const { logProviderActivity } = await import('@/lib/logger')
      const mockPrisma = (await import('@/lib/prisma')).prisma

      const mockCreate = vi.fn().mockResolvedValue({})
      mockPrisma.providerLog.create = mockCreate

      await logProviderActivity(
        'OUTLOOK',
        'SYNC',
        'INFO',
        'Sync completed'
      )

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: undefined
        })
      })
    })
  })
})
