import cron from 'node-cron'
import { syncEngine } from './engine'
import logger from '../logger'

export function startSyncScheduler() {
  // Run sync every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    logger.info('Starting scheduled sync for all enabled scopes')
    try {
      await syncEngine.syncAllEnabledScopes()
      logger.info('Completed scheduled sync')
    } catch (error) {
      logger.error('Scheduled sync failed', { error })
    }
  })

  logger.info('Sync scheduler started - running every 15 minutes')
}
