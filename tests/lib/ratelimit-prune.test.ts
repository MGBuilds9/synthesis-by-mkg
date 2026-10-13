import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RateLimiter } from '../../lib/ratelimit'

describe('RateLimiter Background Pruning', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should automatically prune stale keys in the background', () => {
    const rl = new RateLimiter(1000, 5)

    // Add unique IPs
    for (let i = 0; i < 100; i++) {
      rl.check(`ip-${i}`)
    }

    expect((rl as any).requests.size).toBe(100)

    // Advance time past window and trigger interval
    vi.advanceTimersByTime(60000)

    expect((rl as any).requests.size).toBe(0)
  })
})
