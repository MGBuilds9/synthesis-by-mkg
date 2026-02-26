import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
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

  // Sentinel: Protect sensitive routes
  // Checks for exact match or sub-paths to avoid matching similarly named routes (e.g. /dashboard-public)
  const protectedPaths = ['/dashboard', '/api/messages', '/api/files', '/api/ai']
  const isProtected = protectedPaths.some(path =>
    request.nextUrl.pathname === path ||
    request.nextUrl.pathname.startsWith(path + '/')
  )

  if (isProtected) {
    const token = await getToken({ req: request })
    if (!token) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)

      const redirectResponse = NextResponse.redirect(signInUrl)

      // Sentinel: Copy security headers to redirect response for defense in depth
      headers.forEach((value, key) => {
        redirectResponse.headers.set(key, value)
      })

      return redirectResponse
    }
  }

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
