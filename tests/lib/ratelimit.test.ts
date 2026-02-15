import { describe, it, expect, vi } from 'vitest'
import { RateLimiter } from '@/lib/ratelimit'

describe('RateLimiter', () => {
  it('should allow requests within the limit', () => {
    const limiter = new RateLimiter({ windowMs: 1000, max: 2 })
    const id = 'user-1'

    expect(limiter.check(id).success).toBe(true)
    expect(limiter.check(id).success).toBe(true)
  })

  it('should block requests exceeding the limit', () => {
    const limiter = new RateLimiter({ windowMs: 1000, max: 2 })
    const id = 'user-1'

    limiter.check(id)
    limiter.check(id)

    const result = limiter.check(id)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should reset limit after window expires', async () => {
    vi.useFakeTimers()
    const limiter = new RateLimiter({ windowMs: 1000, max: 1 })
    const id = 'user-1'

    limiter.check(id)
    expect(limiter.check(id).success).toBe(false)

    vi.advanceTimersByTime(1001)

    expect(limiter.check(id).success).toBe(true)
    vi.useRealTimers()
  })

  it('should track different identifiers separately', () => {
    const limiter = new RateLimiter({ windowMs: 1000, max: 1 })
    const id1 = 'user-1'
    const id2 = 'user-2'

    limiter.check(id1)
    expect(limiter.check(id1).success).toBe(false)
    expect(limiter.check(id2).success).toBe(true)
  })

  it('should cleanup old entries', async () => {
    vi.useFakeTimers()
    const limiter = new RateLimiter({ windowMs: 1000, max: 1 })
    const id = 'user-1'

    limiter.check(id)

    // Access private property for testing
    const tokens = (limiter as any).tokens as Map<string, any>
    expect(tokens.has(id)).toBe(true)

    vi.advanceTimersByTime(1001)
    limiter.cleanup()

    expect(tokens.has(id)).toBe(false)
    vi.useRealTimers()
  })
})
