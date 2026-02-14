import { describe, it, expect } from 'vitest'
import { middleware } from '../middleware'
import { NextRequest } from 'next/server'

describe('Middleware Security Headers', () => {
  it('should add security headers to the response', () => {
    // Create a mock request
    const req = new NextRequest(new URL('http://localhost:3000/'))

    // Call the middleware
    const res = middleware(req)

    // Assert headers are present
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    // Note: Vitest/JSDOM environment might handle headers differently, but NextRequest/Response
    // are standard Fetch API objects or polyfills provided by Next.js
    expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains')
  })
})
