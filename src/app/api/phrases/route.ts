import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verseNumber = searchParams.get('verseNumber');

    let result;
    if (verseNumber) {
      result = await db.execute({
        sql: `SELECT p.id, p.phrase_text, p.order_in_verse, v.verse_number, v.verse_text
              FROM phrases p
              JOIN verses v ON p.verse_id = v.id
              WHERE v.verse_number = ?
              ORDER BY p.order_in_verse`,
        args: [parseInt(verseNumber, 10)]
      });
    } else {
      result = await db.execute({
        sql: `SELECT p.id, p.phrase_text, p.order_in_verse, v.verse_number, v.verse_text
              FROM phrases p
              JOIN verses v ON p.verse_id = v.id
              ORDER BY v.verse_number, p.order_in_verse`,
        args: []
      });
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching phrases:', error);
    return NextResponse.json({ error: 'Failed to fetch phrases' }, { status: 500 });
  }
}
