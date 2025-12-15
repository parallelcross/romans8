import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const COOKIE_NAME = 'romans8_user_id';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function generateUserId(): string {
  return uuidv4();
}

export function getUserFromCookie(cookies: ReadonlyRequestCookies): string | null {
  const cookie = cookies.get(COOKIE_NAME);
  return cookie?.value ?? null;
}

export function setUserCookie(response: NextResponse, userId: string): void {
  response.cookies.set(COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(Date.now() + ONE_YEAR_MS),
  });
}
