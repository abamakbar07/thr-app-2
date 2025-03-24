import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  
  if (session) {
    // Redirect to the sign-out endpoint handled by NextAuth
    return NextResponse.redirect(new URL('/api/auth/signout?callbackUrl=/', req.url));
  }
  
  // Already signed out, redirect to home
  return NextResponse.redirect(new URL('/', req.url));
} 