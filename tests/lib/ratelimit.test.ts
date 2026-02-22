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

  it('prunes expired keys probabilistically', () => {
    // Force prune to happen (Math.random() < 0.01)
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.005)

    // Create limiter with small window
    const shortWindowLimiter = new RateLimiter(100, 10)

    // Use fake timers
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    // Add request for user1
    shortWindowLimiter.check('user1')

    // Verify user1 is in map
    expect((shortWindowLimiter as any).requests.has('user1')).toBe(true)

    // Advance time past window
    vi.setSystemTime(now + 150)

    // Add request for user2, which should trigger prune
    shortWindowLimiter.check('user2')

    // user1 should be pruned (expired)
    expect((shortWindowLimiter as any).requests.has('user1')).toBe(false)
    // user2 should be present
    expect((shortWindowLimiter as any).requests.has('user2')).toBe(true)

    vi.useRealTimers()
    randomSpy.mockRestore()
  })
})
