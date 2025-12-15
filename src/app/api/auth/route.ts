import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { generateUserId, getUserFromCookie, setUserCookie } from '@/lib/auth';
import { isValidOrigin, isValidTranslation, sanitizeName } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    if (!isValidOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }

    const cookieStore = await cookies();
    let userId = getUserFromCookie(cookieStore);

    if (userId) {
      return NextResponse.json({ userId });
    }

    const body = await request.json().catch(() => ({}));
    const name = sanitizeName(body.name);
    const translation = isValidTranslation(body.translation) ? body.translation : 'csb';

    userId = generateUserId();
    await db.execute({
      sql: `INSERT INTO users (id, name, translation, created_at) VALUES (?, ?, ?, ?)`,
      args: [userId, name, translation, new Date().toISOString()]
    });

    const response = NextResponse.json({ userId });
    setUserCookie(response, userId);
    return response;
  } catch (error) {
    console.error('Error in auth:', error);
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
  }
}
