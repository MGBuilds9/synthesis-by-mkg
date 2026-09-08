import { describe, it, expect, vi, afterEach } from 'vitest'
import { middleware } from '../middleware'
import { NextRequest } from 'next/server'

describe('Middleware Security Headers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should add standard security headers to the response', () => {
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

  it('should include unsafe-eval in CSP during development', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const req = new NextRequest(new URL('http://localhost:3000/'))
    const res = middleware(req)

    const csp = res.headers.get('Content-Security-Policy')
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'")
  })

  it('should remove unsafe-eval from CSP in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const req = new NextRequest(new URL('http://localhost:3000/'))
    const res = middleware(req)

    const csp = res.headers.get('Content-Security-Policy')
    expect(csp).toContain("script-src 'self' 'unsafe-inline';")
    expect(csp).not.toContain("'unsafe-eval'")
  })
})
