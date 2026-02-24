import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RateLimiter, chatRateLimiter } from '../../lib/ratelimit'

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

  it('auto-prunes old entries after window expires', () => {
    vi.useFakeTimers()
    const limiter = new RateLimiter(1000, 10)
    // Spy on prune method
    const pruneSpy = vi.spyOn(limiter, 'prune')

    // 1. First check
    limiter.check('user1')
    expect(pruneSpy).not.toHaveBeenCalled()

    // 2. Advance time by > window (1001ms)
    vi.advanceTimersByTime(1001)

    // 3. Second check - should trigger prune
    limiter.check('user2')
    expect(pruneSpy).toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('chatRateLimiter is configured correctly', () => {
    const result = chatRateLimiter.check('test-config')
    // Limit should be 10
    expect(result.limit).toBe(10)
  })
})
