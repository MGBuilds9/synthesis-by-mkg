import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock PrismaClient before importing
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class PrismaClient {
      $connect = vi.fn()
      $disconnect = vi.fn()
    }
  }
})

describe('Prisma Singleton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear the global singleton between tests
    const globalForPrisma = globalThis as any
    delete globalForPrisma.prisma
  })

  it('should export a prisma instance', async () => {
    const { prisma } = await import('@/lib/prisma')
    expect(prisma).toBeDefined()
    expect(typeof prisma).toBe('object')
  })

  it('should create a PrismaClient instance', async () => {
    const { prisma } = await import('@/lib/prisma')

    expect(prisma).toBeDefined()
    expect(prisma.$connect).toBeDefined()
    expect(prisma.$disconnect).toBeDefined()
  })

  it('should reuse the same instance in non-production environment', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    // Force re-import by clearing module cache
    vi.resetModules()

    const { prisma: prisma1 } = await import('@/lib/prisma')
    const { prisma: prisma2 } = await import('@/lib/prisma')

    expect(prisma1).toBe(prisma2)

    process.env.NODE_ENV = originalEnv
  })

  it('should cache prisma instance on globalThis in non-production', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    vi.resetModules()

    const globalForPrisma = globalThis as any
    expect(globalForPrisma.prisma).toBeUndefined()

    const { prisma } = await import('@/lib/prisma')

    expect(globalForPrisma.prisma).toBeDefined()
    expect(globalForPrisma.prisma).toBe(prisma)

    process.env.NODE_ENV = originalEnv
  })

  it('should not create multiple instances when imported multiple times in non-production', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'test'

    vi.resetModules()

    // Import multiple times
    const { prisma: p1 } = await import('@/lib/prisma')
    const { prisma: p2 } = await import('@/lib/prisma')
    const { prisma: p3 } = await import('@/lib/prisma')

    // Should be the same instance due to globalThis caching
    expect(p1).toBe(p2)
    expect(p2).toBe(p3)

    process.env.NODE_ENV = originalEnv
  })
})
