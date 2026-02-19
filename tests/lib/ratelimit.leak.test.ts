import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RateLimiter } from '../../lib/ratelimit'

describe('RateLimiter Leak', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    vi.useFakeTimers()
    rateLimiter = new RateLimiter(1000, 10)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('prunes expired keys probabilistically', () => {
    const key1 = 'user1'
    const key2 = 'user2'

    // Add requests
    rateLimiter.check(key1)
    rateLimiter.check(key2)

    // Verify keys exist
    expect((rateLimiter as any).requests.has(key1)).toBe(true)
    expect((rateLimiter as any).requests.has(key2)).toBe(true)

    // Advance time past window
    vi.advanceTimersByTime(1001)

    // Force prune (assuming 1% chance implemented as Math.random() < 0.01)
    vi.spyOn(Math, 'random').mockReturnValue(0.005)

    // Trigger check on a new key (which should trigger prune)
    rateLimiter.check('user3')

    // Verify old keys are removed
    expect((rateLimiter as any).requests.has(key1)).toBe(false)
    expect((rateLimiter as any).requests.has(key2)).toBe(false)
    expect((rateLimiter as any).requests.has('user3')).toBe(true)
  })
})
