import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = getUserFromCookie(cookieStore);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = db.prepare(`
      SELECT id, name, translation, created_at FROM users WHERE id = ?
    `).get(userId) as { id: string; name: string | null; translation: string; created_at: string } | undefined;

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
    const cookieStore = await cookies();
    const userId = getUserFromCookie(cookieStore);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { translation } = body;

    if (translation && !['csb', 'esv'].includes(translation)) {
      return NextResponse.json({ error: 'Invalid translation' }, { status: 400 });
    }

    if (translation) {
      db.prepare(`UPDATE users SET translation = ? WHERE id = ?`).run(translation, userId);
    }

    const user = db.prepare(`
      SELECT id, name, translation, created_at FROM users WHERE id = ?
    `).get(userId) as { id: string; name: string | null; translation: string; created_at: string } | undefined;

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
