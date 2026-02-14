import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

describe('Middleware Security Headers', () => {
  it('should add security headers to the response', () => {
    // Create a mock request
    const request = new NextRequest('http://localhost/')

    // Call the middleware
    const response = middleware(request)

    // Verify headers
    expect(response.headers.get('X-DNS-Prefetch-Control')).toBe('off')
    expect(response.headers.get('Strict-Transport-Security')).toBe('max-age=63072000; includeSubDomains')
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    // Permissions-Policy removed
    expect(response.headers.get('Permissions-Policy')).toBeNull()
  })
})
