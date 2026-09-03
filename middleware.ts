import { type NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase-middleware'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/customers', '/settings', '/api', '/reports', '/transactions', '/announcements', '/products']

// Public routes that don't require authentication
const publicRoutes = ['/login', '/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get the middleware client
  const { supabase, response } = createMiddlewareClient(request)

  // Get the user from the session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some((route) => pathname === route)

  // If accessing protected route without authentication, redirect to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If accessing login page while authenticated, redirect to dashboard
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Return the response with updated cookies
  return response
}

export const config = {
  matcher: [
    // Match all request paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)',
  ],
}
