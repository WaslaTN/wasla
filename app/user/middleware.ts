import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define user protected routes that require authentication
const userProtectedRoutes = [
  '/user/dashboard', 
  '/user/profile', 
  '/user/booking-history', 
  '/user/booking-details',
  '/user/book-trip',
  '/user/payment'
];

// Define user auth routes that authenticated users shouldn't access
const userAuthRoutes = ['/user/auth/login', '/user/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only apply this middleware to user routes
  if (!pathname.startsWith('/user')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('userToken')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Debug: Log user middleware activity
  console.log(`👤 User Middleware: ${pathname}, Token: ${token ? 'Present' : 'None'}`);

  // If user has token and tries to access auth pages, redirect to user dashboard
  if (token && userAuthRoutes.some(route => pathname.startsWith(route))) {
    console.log(`🔄 Redirecting authenticated user from ${pathname} to /user/dashboard`);
    return NextResponse.redirect(new URL('/user/dashboard', request.url));
  }

  // If user doesn't have token and tries to access protected pages, redirect to user login
  if (!token && userProtectedRoutes.some(route => pathname.startsWith(route))) {
    console.log(`🔒 Redirecting unauthenticated user from ${pathname} to /user/auth/login`);
    return NextResponse.redirect(new URL('/user/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all user request paths
     */
    '/user/:path*',
  ],
}; 