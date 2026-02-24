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

  it('prunes old entries to prevent memory leak', () => {
    const windowMs = 1000
    rateLimiter = new RateLimiter(windowMs, 2)

    // Access private requests map via casting
    const requestsMap = (rateLimiter as any).requests as Map<string, number[]>

    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    // Add entries for user1
    rateLimiter.check('user1')
    expect(requestsMap.has('user1')).toBe(true)

    // Advance time past window to trigger prune on next check
    vi.setSystemTime(now + windowMs + 10)

    // Check for user2 (this should trigger prune for user1)
    rateLimiter.check('user2')

    // user1 should be removed because its timestamp is older than window
    expect(requestsMap.has('user1')).toBe(false)
    expect(requestsMap.has('user2')).toBe(true)

    vi.useRealTimers()
  })
})
