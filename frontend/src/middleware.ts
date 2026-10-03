import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const role = request.cookies.get('role')?.value
  
  const isLoginPage = request.nextUrl.pathname === '/login'

  // If no token and trying to access protected route
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If logged in and trying to access login page
  if (token && isLoginPage) {
    if (role) {
      return NextResponse.redirect(new URL(`/${role.toLowerCase()}`, request.url))
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Basic Role protection
  const path = request.nextUrl.pathname
  if (path.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (path.startsWith('/kitchen') && role !== 'KITCHEN') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (path.startsWith('/dispatch') && role !== 'DISPATCH') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (path.startsWith('/driver') && role !== 'DRIVER') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
