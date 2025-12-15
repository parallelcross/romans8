import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { generateUserId, getUserFromCookie, setUserCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    let userId = getUserFromCookie(cookieStore);

    if (userId) {
      return NextResponse.json({ userId });
    }

    const body = await request.json().catch(() => ({}));
    const name = body.name || null;
    const translation = body.translation || 'csb';

    userId = generateUserId();
    db.prepare(`
      INSERT INTO users (id, name, translation, created_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, name, translation, new Date().toISOString());

    const response = NextResponse.json({ userId });
    setUserCookie(response, userId);
    return response;
  } catch (error) {
    console.error('Error in auth:', error);
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
  }
}
