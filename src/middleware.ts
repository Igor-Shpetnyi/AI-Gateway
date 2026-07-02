import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/admin-auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const authenticated = await verifySessionToken(token)

  if (pathname === '/admin/login') {
    if (authenticated) return NextResponse.redirect(new URL('/admin', request.url))
    return NextResponse.next()
  }

  if (!authenticated) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
