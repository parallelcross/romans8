import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'romans8_user_id';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ['/', '/login', '/api/auth'];
  const isPublic = publicPaths.some(path => pathname === path || pathname.startsWith('/api/auth'));

  if (isPublic) {
    return NextResponse.next();
  }

  const userId = request.cookies.get(COOKIE_NAME);

  if (!userId && (pathname.startsWith('/practice') || pathname.startsWith('/progress') || pathname.startsWith('/run'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
