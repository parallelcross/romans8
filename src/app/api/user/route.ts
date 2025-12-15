import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { isValidOrigin, isValidTranslation } from '@/lib/security';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = getUserFromCookie(cookieStore);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db.execute({
      sql: `SELECT id, name, translation, created_at FROM users WHERE id = ?`,
      args: [userId]
    });
    const user = result.rows[0] as unknown as { id: string; name: string | null; translation: string; created_at: string } | undefined;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isValidOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }

    const cookieStore = await cookies();
    const userId = getUserFromCookie(cookieStore);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { translation } = body ?? {};

    if (translation !== undefined && !isValidTranslation(translation)) {
      return NextResponse.json({ error: 'Invalid translation' }, { status: 400 });
    }

    if (translation) {
      await db.execute({
        sql: `UPDATE users SET translation = ? WHERE id = ?`,
        args: [translation, userId]
      });
    }

    const result = await db.execute({
      sql: `SELECT id, name, translation, created_at FROM users WHERE id = ?`,
      args: [userId]
    });
    const user = result.rows[0] as unknown as { id: string; name: string | null; translation: string; created_at: string } | undefined;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      translation: user.translation,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
