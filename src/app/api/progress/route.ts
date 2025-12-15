import { NextResponse } from 'next/server';
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

    const userResult = await db.execute({
      sql: `SELECT translation FROM users WHERE id = ?`,
      args: [userId]
    });
    const user = userResult.rows[0] as unknown as { translation: string } | undefined;
    const translation = user?.translation || 'csb';

    const today = new Date().toISOString().split('T')[0];

    const phrasesTotalResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM phrases p
            JOIN verses v ON p.verse_id = v.id
            WHERE v.translation = ?`,
      args: [translation]
    });
    const phrasesTotal = (phrasesTotalResult.rows[0] as unknown as { count: number }).count;

    const phrasesMasteredResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM phrase_progress pp
            JOIN phrases p ON pp.phrase_id = p.id
            JOIN verses v ON p.verse_id = v.id
            WHERE pp.user_id = ? AND pp.mastery_level >= 3 AND v.translation = ?`,
      args: [userId, translation]
    });
    const phrasesMastered = (phrasesMasteredResult.rows[0] as unknown as { count: number }).count;

    const verseMasteryResult = await db.execute({
      sql: `SELECT v.id, v.verse_number,
              COUNT(p.id) as total_phrases,
              SUM(CASE WHEN pp.mastery_level >= 3 THEN 1 ELSE 0 END) as mastered_phrases
            FROM verses v
            JOIN phrases p ON p.verse_id = v.id
            LEFT JOIN phrase_progress pp ON pp.phrase_id = p.id AND pp.user_id = ?
            WHERE v.translation = ?
            GROUP BY v.id`,
      args: [userId, translation]
    });
    const verseMastery = verseMasteryResult.rows as unknown as Array<{ id: number; verse_number: number; total_phrases: number; mastered_phrases: number }>;

    const versesMastered = verseMastery.filter(v => v.total_phrases === v.mastered_phrases && v.mastered_phrases > 0).length;

    const reviewsDueTodayResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM phrase_progress pp
            JOIN phrases p ON pp.phrase_id = p.id
            JOIN verses v ON p.verse_id = v.id
            WHERE pp.user_id = ? AND pp.due_date <= ? AND v.translation = ?`,
      args: [userId, today, translation]
    });
    const reviewsDueToday = (reviewsDueTodayResult.rows[0] as unknown as { count: number }).count;

    const recentDaysResult = await db.execute({
      sql: `SELECT DISTINCT DATE(created_at) as day
            FROM practice_events
            WHERE user_id = ?
            ORDER BY day DESC
            LIMIT 30`,
      args: [userId]
    });
    const recentDays = recentDaysResult.rows as unknown as Array<{ day: string }>;

    let streak = 0;
    const now = new Date();
    for (let i = 0; i < recentDays.length; i++) {
      const expectedDate = new Date(now);
      expectedDate.setDate(now.getDate() - i);
      const expectedStr = expectedDate.toISOString().split('T')[0];
      if (recentDays[i]?.day === expectedStr) {
        streak++;
      } else {
        break;
      }
    }

    const milestones = [
      {
        name: 'Romans 8:1-4 Memorized',
        achieved: verseMastery.slice(0, 4).every(v => v.total_phrases === v.mastered_phrases && v.mastered_phrases > 0),
      },
      {
        name: 'Half Chapter Recalled',
        achieved: versesMastered >= 20,
      },
      {
        name: 'Full Chapter Mastered',
        achieved: versesMastered >= 39,
      },
    ];

    return NextResponse.json({
      totalPhrases: phrasesTotal,
      phrasesMastered,
      totalVerses: 39,
      versesMastered,
      reviewsDueToday,
      streak,
      milestones: milestones.map(m => ({ name: m.name, complete: m.achieved })),
      translation,
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
