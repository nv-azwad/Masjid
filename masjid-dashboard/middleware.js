import { NextResponse } from 'next/server'

export function middleware(request) {
  const token = request.cookies.get('auth-token')?.value
  const { pathname } = request.nextUrl

  // Allow login page and public API routes
  if (pathname.startsWith('/login')) {
    // If already logged in, redirect to dashboard
    if (token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Public API routes (mobile app reads)
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/logout')) {
    return NextResponse.next()
  }

  const publicGetApis = ['/api/prayers', '/api/imams', '/api/jummah', '/api/mosque', '/api/notifications']
  if (request.method === 'GET' && publicGetApis.some(api => pathname.startsWith(api))) {
    return NextResponse.next()
  }

  // Allow member registration and push token endpoints (mobile app)
  if (pathname === '/api/members' && request.method === 'POST') return NextResponse.next()
  if (pathname.startsWith('/api/push-tokens')) return NextResponse.next()
  if (pathname.startsWith('/api/members/me')) return NextResponse.next()

  // All other routes require auth token
  if (!token) {
    // API routes return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Pages redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
