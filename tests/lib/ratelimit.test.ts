import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RateLimiter } from '../../lib/ratelimit'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    // 60 requests per 1 minute
    rateLimiter = new RateLimiter(60000, 60)
  })

  it('allows requests within limit', () => {
    const key = 'user1'
    for (let i = 0; i < 60; i++) {
      const result = rateLimiter.check(key)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(60 - 1 - i)
    }
  })

  it('blocks requests over limit', () => {
    const key = 'user2'
    for (let i = 0; i < 60; i++) {
      rateLimiter.check(key)
    }
    const result = rateLimiter.check(key)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('resets after window', () => {
    const key = 'user3'
    const windowMs = 1000
    rateLimiter = new RateLimiter(windowMs, 2)

    // Use fake timers
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    // 1st request
    let result = rateLimiter.check(key)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(1)

    // 2nd request
    result = rateLimiter.check(key)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(0)

    // 3rd request (blocked)
    result = rateLimiter.check(key)
    expect(result.success).toBe(false)

    // Advance time by window + 1ms
    vi.setSystemTime(now + windowMs + 1)

    // Should be allowed again
    result = rateLimiter.check(key)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(1)

    vi.useRealTimers()
  })

  it('prunes expired keys', () => {
    const key = 'user4'
    const windowMs = 1000
    rateLimiter = new RateLimiter(windowMs, 2)

    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    // Add a request
    rateLimiter.check(key)

    // Verify key is in map
    expect((rateLimiter as any).requests.has(key)).toBe(true)

    // Advance time
    vi.setSystemTime(now + windowMs + 1)

    rateLimiter.prune()

    expect((rateLimiter as any).requests.has(key)).toBe(false)
    vi.useRealTimers()
  })

  it('probabilistically prunes on check', () => {
    const key = 'user5'
    // Spy on prune
    const pruneSpy = vi.spyOn(rateLimiter, 'prune')

    // Mock Math.random to return 0 (always prune)
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)

    rateLimiter.check(key)
    expect(pruneSpy).toHaveBeenCalled()

    // Mock Math.random to return 0.5 (don't prune)
    randomSpy.mockReturnValue(0.5)
    pruneSpy.mockClear()

    rateLimiter.check(key)
    expect(pruneSpy).not.toHaveBeenCalled()

    vi.restoreAllMocks()
  })
})
