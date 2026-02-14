import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Sentinel: Create response
  const response = NextResponse.next()

  // Sentinel: Add security headers to protect against common attacks

  // X-DNS-Prefetch-Control: Controls DNS prefetching (off for privacy)
  response.headers.set('X-DNS-Prefetch-Control', 'off')

  // Strict-Transport-Security: Enforce HTTPS (no preload by default to avoid breaking changes)
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains')

  // X-Frame-Options: Prevent clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')

  // X-Content-Type-Options: Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer-Policy: Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy: Removed for now to avoid breaking camera/mic if used in future
  // response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: '/:path*',
}
