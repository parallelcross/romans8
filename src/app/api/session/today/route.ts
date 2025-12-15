import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { generateDailySession } from '@/lib/session';
import { getUserFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = getUserFromCookie(cookieStore);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db.execute({
      sql: `SELECT translation FROM users WHERE id = ?`,
      args: [userId]
    });
    const user = result.rows[0] as unknown as { translation: string } | undefined;
    const translation = user?.translation || 'csb';

    const session = await generateDailySession(userId, translation);
    return NextResponse.json({ ...session, translation });
  } catch (error) {
    console.error('Error generating session:', error);
    return NextResponse.json({ error: 'Failed to generate session' }, { status: 500 });
  }
}
