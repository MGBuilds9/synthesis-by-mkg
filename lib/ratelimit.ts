
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

    let timestamps = this.requests.get(key)

    // Replace O(N) filter with O(log N) binary search since array is chronologically sorted
    if (timestamps) {
      let low = 0
      let high = timestamps.length
      while (low < high) {
        const mid = (low + high) >>> 1
        if (timestamps[mid] > windowStart) {
          high = mid
        } else {
          low = mid + 1
        }
      }
      if (low > 0) {
        timestamps = timestamps.slice(low)
      }
    } else {
      timestamps = []
    }

    const currentUsage = timestamps.length
    const success = currentUsage < this.limit

    if (success) {
      timestamps.push(now)
    }

    // Proactively remove empty keys to prevent memory leaks
    if (timestamps.length === 0) {
      this.requests.delete(key)
    } else {
      this.requests.set(key, timestamps)
    }

    // Calculate remaining requests
    const remaining = Math.max(0, this.limit - timestamps.length)

    // Calculate reset time (when the oldest request expires)
    // If no requests, the "reset" is effectively now (or window end, but convention varies)
    // We'll return the time when the current window effectively clears the oldest request
    const oldestTimestamp = timestamps.length > 0 ? timestamps[0] : now
    const reset = oldestTimestamp + this.windowMs

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
      // Replace O(N) filter with O(log N) binary search since array is chronologically sorted
      let low = 0
      let high = timestamps.length
      while (low < high) {
        const mid = (low + high) >>> 1
        if (timestamps[mid] > windowStart) {
          high = mid
        } else {
          low = mid + 1
        }
      }

      if (low === timestamps.length) {
        this.requests.delete(key)
      } else if (low > 0) {
        this.requests.set(key, timestamps.slice(low))
      }
    }
  }
}

// Default instance: 60 requests per minute
export const rateLimiter = new RateLimiter(60 * 1000, 60)
