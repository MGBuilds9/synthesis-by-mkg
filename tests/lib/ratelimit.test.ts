import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RateLimiter } from '@/lib/ratelimit'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter
  const windowMs = 1000 // 1 second
  const limit = 2 // 2 requests per window

  beforeEach(() => {
    vi.useFakeTimers()
    rateLimiter = new RateLimiter(windowMs, limit)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests within limit', () => {
    const key = 'user-1'
    expect(rateLimiter.check(key).success).toBe(true)
    expect(rateLimiter.check(key).success).toBe(true)
    expect(rateLimiter.check(key).success).toBe(false)
  })

  it('resets after window', () => {
    const key = 'user-1'
    expect(rateLimiter.check(key).success).toBe(true)
    expect(rateLimiter.check(key).success).toBe(true)

    // Advance time by windowMs
    vi.advanceTimersByTime(windowMs + 10)

    expect(rateLimiter.check(key).success).toBe(true)
  })

  it('prune removes expired keys', () => {
    const key = 'user-1'
    rateLimiter.check(key)

    // Access private property 'requests' for testing (using any cast or similar hack)
    // Assuming RateLimiter is a class with private requests map.
    // Since it's private, we can't directly check map size easily unless we expose it.
    // But we can check behavior. Pruning shouldn't affect current active keys.

    // Let's rely on internal state check if possible, or assume it works if we can force prune.
    // To verify memory leak fix, we need to inspect the map size.
    // Since 'requests' is private, we can access it via (rateLimiter as any).requests

    expect((rateLimiter as any).requests.has(key)).toBe(true)

    vi.advanceTimersByTime(windowMs + 10)

    // Call prune manually
    rateLimiter.prune()

    expect((rateLimiter as any).requests.has(key)).toBe(false)
  })

  it('check() automatically prunes occasionally', () => {
    // This test will FAIL until we implement the fix.

    // Mock Math.random to return 0 (force prune if we implement probabilistic prune)
    // Assuming we use Math.random() < 0.01
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)
    const pruneSpy = vi.spyOn(rateLimiter, 'prune')

    const key = 'user-1'
    rateLimiter.check(key)

    // We expect prune to be called because Math.random() returned 0
    expect(pruneSpy).toHaveBeenCalled()

    randomSpy.mockRestore()
  })
})
