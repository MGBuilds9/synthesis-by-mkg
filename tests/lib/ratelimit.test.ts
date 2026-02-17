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

  it('probabilistically prunes old keys', () => {
    // 1. Setup
    const rateLimiter = new RateLimiter(100, 60)
    const map = (rateLimiter as any).requests as Map<string, number[]>

    // 2. Add a key
    rateLimiter.check('user1')
    expect(map.has('user1')).toBe(true)

    // 3. Wait for window to pass so 'user1' becomes prunable
    vi.useFakeTimers()
    vi.advanceTimersByTime(200)

    // 4. Mock Math.random to force prune (return 0, which is < 0.01)
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)

    // 5. Trigger check with a new key
    rateLimiter.check('user2')

    // 6. Verification
    // 'user1' should be gone because prune() was called
    expect(map.has('user1')).toBe(false)
    // 'user2' should be present
    expect(map.has('user2')).toBe(true)

    vi.useRealTimers()
    randomSpy.mockRestore()
  })
})
