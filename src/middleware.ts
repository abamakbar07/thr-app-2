import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth/authOptions';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the token
  const token = await getToken({ 
    req: request, 
    secret: authOptions.secret || process.env.NEXTAUTH_SECRET 
  });
  
  // Check if pathname is a protected route
  const isProtectedRoute = pathname === '/dashboard' || 
                          pathname.startsWith('/dashboard/') ||
                          pathname.startsWith('/rooms') || 
                          pathname.startsWith('/questions') || 
                          pathname.startsWith('/participants') || 
                          pathname.startsWith('/rewards');
  
  // If it's a protected route and no token exists, redirect to signin
  if (isProtectedRoute && !token) {
    const url = new URL('/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// Configure paths that should be checked by this middleware
export const config = {
  matcher: [
    // Protected routes that require authentication
    '/dashboard',
    '/rooms/:path*',
    '/questions/:path*',
    '/participants/:path*',
    '/rewards/:path*',
  ],
}; 