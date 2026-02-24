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

  it('prunes old entries probabilistically', () => {
    // Force Math.random to trigger prune (return 0)
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)

    // Create a limiter with a short window
    const windowMs = 1000
    rateLimiter = new RateLimiter(windowMs, 60)

    // Access private map for testing setup
    const requestsMap = (rateLimiter as any).requests

    // Add a stale entry (older than window)
    const staleTime = Date.now() - windowMs - 100
    requestsMap.set('staleKey', [staleTime])

    // Add an active entry
    const activeTime = Date.now()
    requestsMap.set('activeKey', [activeTime])

    // Perform a check (any key) to trigger prune
    rateLimiter.check('newKey')

    // Verify stale key is removed
    expect(requestsMap.has('staleKey')).toBe(false)

    // Verify active key remains
    expect(requestsMap.has('activeKey')).toBe(true)

    randomSpy.mockRestore()
  })
})
