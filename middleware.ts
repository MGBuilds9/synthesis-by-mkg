import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Sentinel: Add security headers to all responses
  const headers = response.headers

  // X-Frame-Options: Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY')

  // X-Content-Type-Options: Prevent MIME sniffing
  headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer-Policy: Control referrer information
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Strict-Transport-Security: Enforce HTTPS (HSTS)
  // This is critical for production environments.
  headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  )

  // Content-Security-Policy: Mitigate XSS attacks
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
