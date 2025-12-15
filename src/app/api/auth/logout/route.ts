import { NextRequest, NextResponse } from 'next/server';
import { isValidOrigin } from '@/lib/security';

export async function POST(request: NextRequest) {
  if (!isValidOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('romans8_user_id', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
