import winston from 'winston'
import { prisma } from './prisma'
import { ProviderType, ProviderLogLevel } from '@prisma/client'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
})

export async function logProviderActivity(
  provider: ProviderType,
  operation: string,
  level: ProviderLogLevel,
  message: string,
  errorDetails?: string,
  metadata?: any
) {
  logger.log(level.toLowerCase(), `[${provider}] ${operation}: ${message}`, { metadata });

  // Bolt: Fire-and-forget DB logging to avoid blocking the main thread
  prisma.providerLog.create({
    data: {
      provider,
      operation,
      level,
      message,
      errorDetails,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  }).catch(error => {
    logger.error('Failed to write provider log to database', { error })
  })
}

export default logger
