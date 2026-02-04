import { prisma } from '../prisma'
import logger, { logProviderActivity } from '../logger'
import { ProviderType, SyncScopeType } from '@prisma/client'
import { subDays } from 'date-fns'

export class SyncEngine {
  async syncScope(syncScopeId: string) {
    const syncScope = await prisma.syncScope.findUnique({
      where: { id: syncScopeId },
      include: {
        connectedAccount: {
          select: {
            id: true,
            provider: true,
            providerAccountId: true,
            accessToken: true,
            refreshToken: true,
            metadata: true,
            accountLabel: true,
          }
        },
      },
    })

    if (!syncScope) {
      return
    }

    await this.processSync(syncScope)
  }

  private async processSync(syncScope: any) {
    if (!syncScope.syncEnabled) {
      return
    }

    const { connectedAccount } = syncScope
    if (!connectedAccount) {
      return
    }

    const syncScopeId = syncScope.id
    const cutoffDate = subDays(new Date(), syncScope.historicalDays)
    const lastSyncedAt = syncScope.lastSyncedAt || cutoffDate

    try {
      // Bolt: Use default logger for SYNC_START to avoid DB write (optimization)
      logger.info(`Starting sync for scope: ${syncScope.scopeName}`, {
        provider: connectedAccount.provider,
        operation: 'SYNC_START',
        syncScopeId,
        scopeType: syncScope.scopeType
      })

      // Route to appropriate sync handler based on provider type
      switch (connectedAccount.provider) {
        case 'GMAIL':
          await this.syncGmail(syncScope, connectedAccount, lastSyncedAt)
          break
        case 'OUTLOOK':
          await this.syncOutlook(syncScope, connectedAccount, lastSyncedAt)
          break
        case 'DISCORD':
          await this.syncDiscord(syncScope, connectedAccount, lastSyncedAt)
          break
        case 'WHATSAPP_BUSINESS':
          // WhatsApp uses webhooks, minimal polling needed
          break
        case 'GDRIVE':
          await this.syncGoogleDrive(syncScope, connectedAccount, lastSyncedAt)
          break
        case 'ONEDRIVE':
          await this.syncOneDrive(syncScope, connectedAccount, lastSyncedAt)
          break
        case 'NOTION':
          await this.syncNotion(syncScope, connectedAccount, lastSyncedAt)
          break
      }

      await prisma.syncScope.update({
        where: { id: syncScopeId },
        data: { lastSyncedAt: new Date() },
      })

      await logProviderActivity(
        connectedAccount.provider,
        'SYNC_SUCCESS',
        'INFO',
        `Completed sync for scope: ${syncScope.scopeName}`,
        undefined,
        { syncScopeId }
      )
    } catch (error: any) {
      await logProviderActivity(
        connectedAccount.provider,
        'SYNC_ERROR',
        'ERROR',
        `Failed to sync scope: ${syncScope.scopeName}`,
        error.message,
        { syncScopeId, error: error.toString() }
      )
      throw error
    }
  }

  private async syncGmail(syncScope: any, connectedAccount: any, lastSyncedAt: Date) {
    // Gmail sync implementation placeholder
    // Will be implemented with Gmail API
  }

  private async syncOutlook(syncScope: any, connectedAccount: any, lastSyncedAt: Date) {
    // Outlook sync implementation placeholder
    // Will be implemented with Microsoft Graph API
  }

  private async syncDiscord(syncScope: any, connectedAccount: any, lastSyncedAt: Date) {
    // Discord sync implementation placeholder
    // Will be implemented with Discord.js
  }

  private async syncGoogleDrive(syncScope: any, connectedAccount: any, lastSyncedAt: Date) {
    // Google Drive sync implementation placeholder
    // Will be implemented with Google Drive API
  }

  private async syncOneDrive(syncScope: any, connectedAccount: any, lastSyncedAt: Date) {
    // OneDrive sync implementation placeholder
    // Will be implemented with Microsoft Graph API
  }

  private async syncNotion(syncScope: any, connectedAccount: any, lastSyncedAt: Date) {
    // Notion sync implementation placeholder
    // Will be implemented with Notion API
  }

  async syncAllEnabledScopes() {
    // Bolt: Optimized to fetch all necessary data in one query to avoid N+1 problem
    const enabledScopes = await prisma.syncScope.findMany({
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
            accountLabel: true,
          }
        },
      },
    })

    const syncPromises = enabledScopes.map(scope => 
      this.processSync(scope).catch(error => {
        console.error(`Failed to sync scope ${scope.id}:`, error)
      })
    )

    await Promise.allSettled(syncPromises)
  }
}

export const syncEngine = new SyncEngine()
