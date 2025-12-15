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

    const user = db.prepare(`SELECT translation FROM users WHERE id = ?`).get(userId) as { translation: string } | undefined;
    const translation = user?.translation || 'csb';

    const today = new Date().toISOString().split('T')[0];

    const phrasesTotal = (db.prepare(`
      SELECT COUNT(*) as count FROM phrases p
      JOIN verses v ON p.verse_id = v.id
      WHERE v.translation = ?
    `).get(translation) as { count: number }).count;

    const phrasesMastered = (db.prepare(`
      SELECT COUNT(*) as count FROM phrase_progress pp
      JOIN phrases p ON pp.phrase_id = p.id
      JOIN verses v ON p.verse_id = v.id
      WHERE pp.user_id = ? AND pp.mastery_level >= 3 AND v.translation = ?
    `).get(userId, translation) as { count: number }).count;

    const verseMastery = db.prepare(`
      SELECT v.id, v.verse_number,
        COUNT(p.id) as total_phrases,
        SUM(CASE WHEN pp.mastery_level >= 3 THEN 1 ELSE 0 END) as mastered_phrases
      FROM verses v
      JOIN phrases p ON p.verse_id = v.id
      LEFT JOIN phrase_progress pp ON pp.phrase_id = p.id AND pp.user_id = ?
      WHERE v.translation = ?
      GROUP BY v.id
    `).all(userId, translation) as Array<{ id: number; verse_number: number; total_phrases: number; mastered_phrases: number }>;

    const versesMastered = verseMastery.filter(v => v.total_phrases === v.mastered_phrases && v.mastered_phrases > 0).length;

    const reviewsDueToday = (db.prepare(`
      SELECT COUNT(*) as count FROM phrase_progress pp
      JOIN phrases p ON pp.phrase_id = p.id
      JOIN verses v ON p.verse_id = v.id
      WHERE pp.user_id = ? AND pp.due_date <= ? AND v.translation = ?
    `).get(userId, today, translation) as { count: number }).count;

    const recentDays = db.prepare(`
      SELECT DISTINCT DATE(created_at) as day
      FROM practice_events
      WHERE user_id = ?
      ORDER BY day DESC
      LIMIT 30
    `).all(userId) as Array<{ day: string }>;

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
