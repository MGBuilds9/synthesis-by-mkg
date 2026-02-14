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
