import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  // Check if the pathname starts with /admin
  const isAdminPage = pathname.startsWith('/admin');
  
  // If it's an admin page and no token exists, redirect to signin
  if (isAdminPage && !token) {
    const url = new URL('/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// Configure paths that should be checked by this middleware
export const config = {
  matcher: [
    // Admin routes that require authentication
    '/admin/:path*',
  ],
}; 