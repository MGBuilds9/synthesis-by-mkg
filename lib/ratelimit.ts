export class RateLimiter {
  private tokens: Map<string, { count: number; resetTime: number }>
  private windowMs: number
  private max: number

  constructor(options: { windowMs: number; max: number }) {
    this.windowMs = options.windowMs
    this.max = options.max
    this.tokens = new Map()
  }

  check(identifier: string): { success: boolean; limit: number; remaining: number; reset: number } {
    const now = Date.now()
    const record = this.tokens.get(identifier)

    if (!record || now > record.resetTime) {
      this.tokens.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return {
        success: true,
        limit: this.max,
        remaining: this.max - 1,
        reset: now + this.windowMs,
      }
    }

    if (record.count >= this.max) {
      return {
        success: false,
        limit: this.max,
        remaining: 0,
        reset: record.resetTime,
      }
    }

    record.count += 1

    // Probabilistic cleanup to prevent memory leaks (1% chance)
    if (Math.random() < 0.01) {
      this.cleanup()
    }

    return {
      success: true,
      limit: this.max,
      remaining: this.max - record.count,
      reset: record.resetTime,
    }
  }

  cleanup() {
    const now = Date.now()
    for (const [key, record] of this.tokens.entries()) {
      if (now > record.resetTime) {
        this.tokens.delete(key)
      }
    }
  }
}
