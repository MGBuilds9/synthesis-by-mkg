import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RateLimiter } from '../../lib/ratelimit'

describe('RateLimiter Auto-Pruning', () => {
  let rateLimiter: RateLimiter
  const windowMs = 1000

  beforeEach(() => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)
    rateLimiter = new RateLimiter(windowMs, 10)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('prunes old keys after window expires', () => {
    // Add requests for multiple keys
    rateLimiter.check('user1')
    rateLimiter.check('user2')

    const requestsMap = (rateLimiter as any).requests
    expect(requestsMap.size).toBe(2)

    // Advance time past the window
    vi.advanceTimersByTime(windowMs + 100)

    // Trigger check on a new key, which should trigger prune
    rateLimiter.check('user3')

    // Expect 'user1' and 'user2' to be removed because they are expired
    // 'user3' should be present
    expect(requestsMap.has('user1')).toBe(false)
    expect(requestsMap.has('user2')).toBe(false)
    expect(requestsMap.has('user3')).toBe(true)
    expect(requestsMap.size).toBe(1)
  })

  it('does not prune if window has not expired', () => {
    // Add requests for multiple keys
    rateLimiter.check('user1')

    const requestsMap = (rateLimiter as any).requests
    expect(requestsMap.size).toBe(1)

    // Advance time slightly, but less than window
    vi.advanceTimersByTime(windowMs / 2)

    // Trigger check on another key
    rateLimiter.check('user2')

    // Prune should not have run (or if run, shouldn't remove valid keys)
    // But since implementation will check lastPrune vs windowMs, it shouldn't run if < windowMs

    expect(requestsMap.has('user1')).toBe(true)
    expect(requestsMap.has('user2')).toBe(true)
    expect(requestsMap.size).toBe(2)
  })
})
