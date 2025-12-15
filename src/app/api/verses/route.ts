import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const result = await db.execute({
      sql: `SELECT id, verse_number, verse_text FROM verses ORDER BY verse_number`,
      args: []
    });

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching verses:', error);
    return NextResponse.json({ error: 'Failed to fetch verses' }, { status: 500 });
  }
}
