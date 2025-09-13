import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication (excluding user routes)
const protectedRoutes = ['/dashboard', '/profile'];

// Define auth routes that authenticated users shouldn't access (excluding user routes)
const authRoutes = ['/auth/login', '/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip user routes - they have their own middleware
  if (pathname.startsWith('/user')) {
    return NextResponse.next();
  }
  
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Debug: Log all cookies
  const allCookies = Array.from(request.cookies.getAll());
  console.log(`🛡️ Main Middleware: ${pathname}, Token: ${token ? 'Present' : 'None'}`);
  console.log(`🍪 All cookies:`, allCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`));

  // If user has token and tries to access auth pages, redirect to dashboard
  if (token && authRoutes.some(route => pathname.startsWith(route))) {
    console.log(`🔄 Redirecting authenticated user from ${pathname} to /dashboard`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user doesn't have token and tries to access protected pages, redirect to login
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    console.log(`🔒 Redirecting unauthenticated user from ${pathname} to /auth/login`);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (home page)
     * - /components/ (component files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|$|components).*)',
  ],
}; 