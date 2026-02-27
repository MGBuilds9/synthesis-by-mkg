
/**
 * Simple in-memory rate limiter using a sliding window algorithm.
 *
 * Note: In a serverless environment (e.g., Vercel), this state is not shared across
 * multiple function instances. It works best for single-instance deployments or
 * as a "best effort" protection layer. For strict distributed rate limiting,
 * consider using Redis (e.g., @upstash/ratelimit).
 */
export class RateLimiter {
  private requests: Map<string, number[]>
  private windowMs: number
  private limit: number

  constructor(windowMs: number = 60000, limit: number = 60) {
    this.requests = new Map()
    this.windowMs = windowMs
    this.limit = limit
  }

  /**
   * Checks if a request is allowed for the given key.
   * Returns an object with the result and rate limit headers information.
   */
  check(key: string): { success: boolean; limit: number; remaining: number; reset: number } {
    const now = Date.now()
    const windowStart = now - this.windowMs

    let timestamps = this.requests.get(key) || []

    // Bolt: Optimization - Avoid O(N) filter on every request
    // Since timestamps are chronological, check if the oldest one is expired first.
    if (timestamps.length > 0 && timestamps[0] <= windowStart) {
      // Find the first valid timestamp index
      // In worst case this is O(N), but for typical rate limits (small N),
      // checking index 0 first is a huge win for the common case (not expired or few items).
      // For larger N, binary search could be used, but overhead might not be worth it for <100 items.
      const firstValidIndex = timestamps.findIndex(t => t > windowStart)

      if (firstValidIndex === -1) {
        // All timestamps are expired
        timestamps = []
      } else if (firstValidIndex > 0) {
        // Remove expired timestamps
        timestamps = timestamps.slice(firstValidIndex)
      }
    }

    const currentUsage = timestamps.length
    const success = currentUsage < this.limit

    if (success) {
      timestamps.push(now)
    }

    // Update the map with the cleaned (and potentially updated) timestamps
    this.requests.set(key, timestamps)

    // Calculate remaining requests
    const remaining = Math.max(0, this.limit - timestamps.length)

    // Calculate reset time (when the oldest request expires)
    // If no requests, the "reset" is effectively now (or window end, but convention varies)
    // We'll return the time when the current window effectively clears the oldest request
    const oldestTimestamp = timestamps.length > 0 ? timestamps[0] : now
    const reset = oldestTimestamp + this.windowMs

    // Bolt: Optimization - Probabilistic pruning to prevent memory leaks
    // 1% chance to prune expired keys on every check
    if (Math.random() < 0.01) {
      this.prune()
    }

    return {
      success,
      limit: this.limit,
      remaining,
      reset
    }
  }

  /**
   * Prunes keys that have no active requests in the window.
   * This prevents memory leaks from old keys.
   */
  prune() {
    const now = Date.now()
    const windowStart = now - this.windowMs

    for (const [key, timestamps] of this.requests.entries()) {
      // Bolt: Optimization - Check only the newest timestamp
      // If the newest timestamp is expired, then ALL timestamps for this key are expired.
      // This makes the check O(1) per key instead of O(M) where M is requests per key.
      if (timestamps.length === 0 || timestamps[timestamps.length - 1] <= windowStart) {
        this.requests.delete(key)
      } else {
        // If there are valid timestamps but some are old, we could filter them here,
        // but 'check()' handles lazy cleanup on access.
        // We only care about removing completely dead keys to free map slots.
        // However, if we want to be strict about memory, we can slice here too.
        // For performance, we'll stick to just deleting fully expired keys.
      }
    }
  }
}

// Default instance: 60 requests per minute
export const rateLimiter = new RateLimiter(60 * 1000, 60)
