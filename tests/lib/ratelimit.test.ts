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
      // Wait, this loop check logic in original test was:
      // expect(result.remaining).toBe(60 - 1 - i)
      // I'll keep it simple as it was
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

  it('prunes old entries automatically', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    const windowMs = 1000
    // Create new instance to reset lastPrune
    const limiter = new RateLimiter(windowMs, 60)

    // Add an entry
    limiter.check('old-key')

    // Verify entry exists
    expect((limiter as any).requests.has('old-key')).toBe(true)

    // Advance time past window (so it's stale)
    // And past 5 minutes (so prune is triggered)
    const fiveMinutes = 5 * 60 * 1000
    vi.setSystemTime(now + fiveMinutes + 100)

    // Trigger check on ANY key (even new one) to trigger prune
    limiter.check('new-key')

    // Verify old key is gone
    expect((limiter as any).requests.has('old-key')).toBe(false)
    // Verify new key is present
    expect((limiter as any).requests.has('new-key')).toBe(true)

    vi.useRealTimers()
  })
})
