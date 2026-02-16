import { describe, it, expect, vi } from 'vitest'
import { RateLimiter } from '../../lib/ratelimit'

describe('RateLimiter Leak', () => {
  it('accumulates keys without pruning (baseline)', () => {
    // Short window of 10ms
    const rateLimiter = new RateLimiter(10, 100)

    // Add 100 unique users
    for (let i = 0; i < 100; i++) {
      rateLimiter.check(`user-${i}`)
    }

    // Expect 100 keys
    expect((rateLimiter as any).requests.size).toBe(100)

    // Wait for window to pass
    vi.useFakeTimers()
    // Advance time past the window
    const now = Date.now()
    vi.setSystemTime(now + 20)

    // Still 100 keys (leak) because we haven't triggered check yet
    expect((rateLimiter as any).requests.size).toBe(100)

    vi.useRealTimers()
  })

  it('clears keys after manual prune', () => {
    const rateLimiter = new RateLimiter(10, 100)
    rateLimiter.check('user-1')

    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now + 20)

    rateLimiter.prune()
    expect((rateLimiter as any).requests.size).toBe(0)

    vi.useRealTimers()
  })

  it('auto-prunes keys eventually', () => {
    const rateLimiter = new RateLimiter(10, 100)
    rateLimiter.check('user-1')

    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now + 20)

    // Verify key still exists
    expect((rateLimiter as any).requests.size).toBe(1)

    // Force prune trigger via Math.random
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.005) // < 0.01

    // This check should trigger prune
    rateLimiter.check('user-2')

    // Expect user-1 to be gone (pruned), user-2 exists
    expect((rateLimiter as any).requests.has('user-1')).toBe(false)
    expect((rateLimiter as any).requests.has('user-2')).toBe(true)
    expect((rateLimiter as any).requests.size).toBe(1)

    randomSpy.mockRestore()
    vi.useRealTimers()
  })
})
