import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { SyncEngine } from '@/lib/sync/engine'
import { subDays } from 'date-fns'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    syncScope: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    }
  }
}))

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn()
  },
  logProviderActivity: vi.fn()
}))

describe('SyncEngine', () => {
  let engine: SyncEngine
  let mockPrisma: any
  let mockLogger: any
  let mockLogProviderActivity: Mock

  beforeEach(async () => {
    vi.clearAllMocks()
    engine = new SyncEngine()
    mockPrisma = (await import('@/lib/prisma')).prisma
    mockLogger = (await import('@/lib/logger')).default
    mockLogProviderActivity = (await import('@/lib/logger')).logProviderActivity as Mock
  })

  describe('syncScope', () => {
    it('should return early if scope not found', async () => {
      mockPrisma.syncScope.findUnique.mockResolvedValue(null)

      await engine.syncScope('non-existent-id')

      expect(mockPrisma.syncScope.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        include: {
          connectedAccount: {
            select: {
              id: true,
              provider: true,
              providerAccountId: true,
              accessToken: true,
              refreshToken: true,
              metadata: true,
              accountLabel: true
            }
          }
        }
      })
      expect(mockPrisma.syncScope.update).not.toHaveBeenCalled()
    })

    it('should fetch scope with connectedAccount included', async () => {
      const mockScope = {
        id: 'scope-1',
        scopeName: 'Test Scope',
        syncEnabled: true,
        connectedAccount: {
          id: 'account-1',
          provider: 'GMAIL',
          providerAccountId: 'gmail-123',
          accessToken: 'token',
          refreshToken: 'refresh',
          metadata: {},
          accountLabel: 'Test Account'
        }
      }

      mockPrisma.syncScope.findUnique.mockResolvedValue(mockScope)
      mockPrisma.syncScope.update.mockResolvedValue({})

      await engine.syncScope('scope-1')

      expect(mockPrisma.syncScope.findUnique).toHaveBeenCalledWith({
        where: { id: 'scope-1' },
        include: expect.objectContaining({
          connectedAccount: expect.any(Object)
        })
      })
    })
  })

  describe('processSync', () => {
    it('should skip if syncEnabled is false', async () => {
      const mockScope = {
        id: 'scope-1',
        scopeName: 'Disabled Scope',
        syncEnabled: false,
        connectedAccount: {
          provider: 'GMAIL'
        }
      }

      mockPrisma.syncScope.findUnique.mockResolvedValue(mockScope)

      await engine.syncScope('scope-1')

      expect(mockPrisma.syncScope.update).not.toHaveBeenCalled()
      expect(mockLogProviderActivity).not.toHaveBeenCalled()
    })

    it('should skip if connectedAccount is null', async () => {
      const mockScope = {
        id: 'scope-1',
        scopeName: 'Orphaned Scope',
        syncEnabled: true,
        connectedAccount: null
      }

      mockPrisma.syncScope.findUnique.mockResolvedValue(mockScope)

      await engine.syncScope('scope-1')

      expect(mockPrisma.syncScope.update).not.toHaveBeenCalled()
      expect(mockLogProviderActivity).not.toHaveBeenCalled()
    })

    it('should update lastSyncedAt on success', async () => {
      const mockScope = {
        id: 'scope-1',
        scopeName: 'Test Scope',
        scopeType: 'GMAIL_LABEL',
        syncEnabled: true,
        historicalDays: 30,
        lastSyncedAt: new Date('2024-01-01'),
        connectedAccount: {
          id: 'account-1',
          provider: 'GMAIL',
          providerAccountId: 'gmail-123',
          accessToken: 'token',
          refreshToken: 'refresh',
          metadata: {},
          accountLabel: 'Test'
        }
      }

      mockPrisma.syncScope.findUnique.mockResolvedValue(mockScope)
      mockPrisma.syncScope.update.mockResolvedValue({})

      await engine.syncScope('scope-1')

      expect(mockPrisma.syncScope.update).toHaveBeenCalledWith({
        where: { id: 'scope-1' },
        data: { lastSyncedAt: expect.any(Date) }
      })
    })

    it('should call logProviderActivity on success', async () => {
      const mockScope = {
        id: 'scope-1',
        scopeName: 'Test Scope',
        scopeType: 'GMAIL_LABEL',
        syncEnabled: true,
        historicalDays: 30,
        connectedAccount: {
          provider: 'GMAIL',
          providerAccountId: 'gmail-123',
          accessToken: 'token'
        }
      }

      mockPrisma.syncScope.findUnique.mockResolvedValue(mockScope)
      mockPrisma.syncScope.update.mockResolvedValue({})

      await engine.syncScope('scope-1')

      expect(mockLogProviderActivity).toHaveBeenCalledWith(
        'GMAIL',
        'SYNC_SUCCESS',
        'INFO',
        'Completed sync for scope: Test Scope',
        undefined,
        { syncScopeId: 'scope-1' }
      )
    })

    it('should log error and rethrow on failure', async () => {
      const mockScope = {
        id: 'scope-1',
        scopeName: 'Test Scope',
        scopeType: 'GMAIL_LABEL',
        syncEnabled: true,
        historicalDays: 30,
        connectedAccount: {
          provider: 'GMAIL',
          providerAccountId: 'gmail-123',
          accessToken: 'token'
        }
      }

      const syncError = new Error('Sync failed')
      mockPrisma.syncScope.findUnique.mockResolvedValue(mockScope)
      mockPrisma.syncScope.update.mockRejectedValue(syncError)

      await expect(engine.syncScope('scope-1')).rejects.toThrow('Sync failed')

      expect(mockLogProviderActivity).toHaveBeenCalledWith(
        'GMAIL',
        'SYNC_ERROR',
        'ERROR',
        'Failed to sync scope: Test Scope',
        'Sync failed',
        expect.objectContaining({
          syncScopeId: 'scope-1'
        })
      )
    })

    it('should route to syncGmail for GMAIL provider', async () => {
      const mockScope = {
        id: 'scope-1',
        scopeName: 'Gmail Inbox',
        scopeType: 'GMAIL_LABEL',
        syncEnabled: true,
        historicalDays: 30,
        connectedAccount: {
          provider: 'GMAIL',
          providerAccountId: 'gmail-123',
          accessToken: 'token'
        }
      }

      mockPrisma.syncScope.findUnique.mockResolvedValue(mockScope)
      mockPrisma.syncScope.update.mockResolvedValue({})

      // Spy on the private method via logging
      await engine.syncScope('scope-1')

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('[GMAIL]'),
        expect.objectContaining({
          metadata: expect.objectContaining({ scopeType: 'GMAIL_LABEL' })
        })
      )
    })

    it('should route to syncDiscord for DISCORD provider', async () => {
      const mockScope = {
        id: 'scope-1',
        scopeName: 'Discord Channel',
        scopeType: 'DISCORD_CHANNEL',
        syncEnabled: true,
        historicalDays: 30,
        connectedAccount: {
          provider: 'DISCORD',
          providerAccountId: 'discord-123',
          accessToken: 'token'
        }
      }

      mockPrisma.syncScope.findUnique.mockResolvedValue(mockScope)
      mockPrisma.syncScope.update.mockResolvedValue({})

      await engine.syncScope('scope-1')

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('[DISCORD]'),
        expect.any(Object)
      )
    })

    it('should use historicalDays for cutoff date calculation', async () => {
      const mockScope = {
        id: 'scope-1',
        scopeName: 'Test Scope',
        scopeType: 'GMAIL_LABEL',
        syncEnabled: true,
        historicalDays: 60,
        lastSyncedAt: null,
        connectedAccount: {
          provider: 'GMAIL',
          providerAccountId: 'gmail-123',
          accessToken: 'token'
        }
      }

      mockPrisma.syncScope.findUnique.mockResolvedValue(mockScope)
      mockPrisma.syncScope.update.mockResolvedValue({})

      await engine.syncScope('scope-1')

      // Verify sync happened (update was called)
      expect(mockPrisma.syncScope.update).toHaveBeenCalled()
    })
  })

  describe('syncAllEnabledScopes', () => {
    it('should fetch all enabled scopes with connectedAccount', async () => {
      mockPrisma.syncScope.findMany.mockResolvedValue([])

      await engine.syncAllEnabledScopes()

      expect(mockPrisma.syncScope.findMany).toHaveBeenCalledWith({
        where: { syncEnabled: true },
        include: {
          connectedAccount: {
            select: {
              id: true,
              provider: true,
              providerAccountId: true,
              accessToken: true,
              refreshToken: true,
              metadata: true,
              accountLabel: true
            }
          }
        }
      })
    })

    it('should process all enabled scopes', async () => {
      const mockScopes = [
        {
          id: 'scope-1',
          scopeName: 'Scope 1',
          scopeType: 'GMAIL_LABEL',
          syncEnabled: true,
          historicalDays: 30,
          connectedAccount: {
            provider: 'GMAIL',
            providerAccountId: 'gmail-1',
            accessToken: 'token1'
          }
        },
        {
          id: 'scope-2',
          scopeName: 'Scope 2',
          scopeType: 'DISCORD_CHANNEL',
          syncEnabled: true,
          historicalDays: 30,
          connectedAccount: {
            provider: 'DISCORD',
            providerAccountId: 'discord-1',
            accessToken: 'token2'
          }
        }
      ]

      mockPrisma.syncScope.findMany.mockResolvedValue(mockScopes)
      mockPrisma.syncScope.update.mockResolvedValue({})

      await engine.syncAllEnabledScopes()

      expect(mockPrisma.syncScope.update).toHaveBeenCalledTimes(2)
      expect(mockLogProviderActivity).toHaveBeenCalledWith(
        'GMAIL',
        'SYNC_SUCCESS',
        'INFO',
        'Completed sync for scope: Scope 1',
        undefined,
        { syncScopeId: 'scope-1' }
      )
      expect(mockLogProviderActivity).toHaveBeenCalledWith(
        'DISCORD',
        'SYNC_SUCCESS',
        'INFO',
        'Completed sync for scope: Scope 2',
        undefined,
        { syncScopeId: 'scope-2' }
      )
    })

    it('should use Promise.allSettled and not fail if one scope fails', async () => {
      const mockScopes = [
        {
          id: 'scope-1',
          scopeName: 'Good Scope',
          scopeType: 'GMAIL_LABEL',
          syncEnabled: true,
          historicalDays: 30,
          connectedAccount: {
            provider: 'GMAIL',
            providerAccountId: 'gmail-1',
            accessToken: 'token1'
          }
        },
        {
          id: 'scope-2',
          scopeName: 'Bad Scope',
          scopeType: 'GMAIL_LABEL',
          syncEnabled: true,
          historicalDays: 30,
          connectedAccount: {
            provider: 'GMAIL',
            providerAccountId: 'gmail-2',
            accessToken: 'token2'
          }
        }
      ]

      mockPrisma.syncScope.findMany.mockResolvedValue(mockScopes)

      // Make second scope fail
      let callCount = 0
      mockPrisma.syncScope.update.mockImplementation(() => {
        callCount++
        if (callCount === 2) {
          return Promise.reject(new Error('Update failed'))
        }
        return Promise.resolve({})
      })

      // Should not throw
      await expect(engine.syncAllEnabledScopes()).resolves.toBeUndefined()

      // Both scopes should have been attempted
      expect(mockPrisma.syncScope.update).toHaveBeenCalledTimes(2)
    })

    it('should handle empty enabled scopes list', async () => {
      mockPrisma.syncScope.findMany.mockResolvedValue([])

      await engine.syncAllEnabledScopes()

      expect(mockPrisma.syncScope.findMany).toHaveBeenCalled()
      expect(mockPrisma.syncScope.update).not.toHaveBeenCalled()
    })

    it('should catch and log errors without throwing', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const mockScope = {
        id: 'scope-1',
        scopeName: 'Failing Scope',
        scopeType: 'GMAIL_LABEL',
        syncEnabled: true,
        historicalDays: 30,
        connectedAccount: {
          provider: 'GMAIL',
          providerAccountId: 'gmail-1',
          accessToken: 'token1'
        }
      }

      mockPrisma.syncScope.findMany.mockResolvedValue([mockScope])
      mockPrisma.syncScope.update.mockRejectedValue(new Error('Database error'))

      await engine.syncAllEnabledScopes()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to sync scope scope-1'),
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })
  })
})
