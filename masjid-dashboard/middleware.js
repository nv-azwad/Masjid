import { NextResponse } from 'next/server'

export function middleware(request) {
  const token = request.cookies.get('auth-token')?.value
  const { pathname } = request.nextUrl

  // Allow login, forgot-password, and reset-password pages
  if (pathname.startsWith('/login') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password')) {
    // If already logged in, redirect to dashboard
    if (token && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Public auth API routes
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/logout') || pathname.startsWith('/api/auth/forgot-password') || pathname.startsWith('/api/auth/reset-password')) {
    return NextResponse.next()
  }

  // Allow CORS preflight requests with proper headers
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  const publicGetApis = ['/api/prayers', '/api/imams', '/api/jummah', '/api/mosque', '/api/notifications', '/api/keepalive']
  if (request.method === 'GET' && publicGetApis.some(api => pathname.startsWith(api))) {
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }

  // Allow cron jobs (authenticated by CRON_SECRET in the route handler)
  if (pathname.startsWith('/api/cron/')) return NextResponse.next()

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
