import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verifyUserCredentials } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import * as bcrypt from 'bcryptjs'

// Mock prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('verifyUserCredentials', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null if email or password is missing', async () => {
    expect(await verifyUserCredentials(undefined, 'password')).toBeNull()
    expect(await verifyUserCredentials('email', undefined)).toBeNull()
  })

  it('returns null if user not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    expect(await verifyUserCredentials('test@example.com', 'password')).toBeNull()
  })

  it('returns null if user has no password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1', email: 'test@example.com' } as any)
    expect(await verifyUserCredentials('test@example.com', 'password')).toBeNull()
  })

  it('returns user for valid bcrypt hash', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10)
    const user = { id: '1', email: 'test@example.com', password: hashedPassword, name: 'Test User', image: null }
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any)

    // This should work once we implement bcrypt check
    const result = await verifyUserCredentials('test@example.com', 'password123')
    expect(result).toEqual({ id: '1', email: 'test@example.com', name: 'Test User', image: null })
  })

  it('migrates plaintext password to hash', async () => {
    const user = { id: '1', email: 'test@example.com', password: 'plaintextpassword', name: 'Test User', image: null }
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any)
    vi.mocked(prisma.user.update).mockResolvedValue({ ...user, password: 'hashedpassword' } as any)

    const result = await verifyUserCredentials('test@example.com', 'plaintextpassword')

    expect(result).toEqual({ id: '1', email: 'test@example.com', name: 'Test User', image: null })

    // Expect update to be called with a hashed password
    expect(prisma.user.update).toHaveBeenCalledTimes(1)
    const updateCall = vi.mocked(prisma.user.update).mock.calls[0]
    expect(updateCall[0].where).toEqual({ id: '1' })
    expect(updateCall[0].data.password).toMatch(/^\$2/)
  })

  it('returns null for invalid plaintext password', async () => {
    const user = { id: '1', email: 'test@example.com', password: 'plaintextpassword' }
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any)

    const result = await verifyUserCredentials('test@example.com', 'wrongpassword')
    expect(result).toBeNull()
  })
})
