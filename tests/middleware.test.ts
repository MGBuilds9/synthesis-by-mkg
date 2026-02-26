import { describe, it, expect, vi } from 'vitest'
import { middleware } from '../middleware'
import { NextRequest } from 'next/server'
import * as nextAuthJwt from 'next-auth/jwt'

// Mock next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}))

describe('Middleware Security', () => {
  it('should add security headers to the response', async () => {
    // Create a mock request
    const req = new NextRequest(new URL('http://localhost:3000/'))

    // Call the middleware
    const res = await middleware(req)

    // Assert headers are present
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains')
  })

  it('should redirect unauthenticated users from protected routes with security headers', async () => {
    // Mock unauthenticated state
    vi.mocked(nextAuthJwt.getToken).mockResolvedValue(null)

    const req = new NextRequest(new URL('http://localhost:3000/dashboard'))
    const res = await middleware(req)

    // Verify redirect
    expect(res.status).toBe(307)
    expect(res.headers.get('Location')).toContain('/auth/signin')

    // Verify security headers on redirect response
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
    expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains')
  })

  it('should allow authenticated users to access protected routes', async () => {
    // Mock authenticated state
    vi.mocked(nextAuthJwt.getToken).mockResolvedValue({ name: 'Test User' } as any)

    const req = new NextRequest(new URL('http://localhost:3000/dashboard'))
    const res = await middleware(req)

    // Verify access allowed (status 200 or just next())
    expect(res.status).not.toBe(307)
    // Also check security headers are still there
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
  })
})
