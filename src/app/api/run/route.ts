import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { calculateScore, THRESHOLDS } from '@/lib/scoring';
import { getUserFromCookie } from '@/lib/auth';

interface Phrase {
  id: number;
  phrase_text: string;
  verse_number: number;
  order_in_verse: number;
}

interface RunRequest {
  verseStart: number;
  verseEnd: number;
  hintLevel: 0 | 1 | 2 | 3;
  inputText: string;
  durationMs: number;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = getUserFromCookie(cookieStore);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = db.prepare(`SELECT translation FROM users WHERE id = ?`).get(userId) as { translation: string } | undefined;
    const translation = user?.translation || 'csb';

    const { searchParams } = new URL(request.url);
    const verseStart = parseInt(searchParams.get('verseStart') ?? '1', 10);
    const verseEnd = parseInt(searchParams.get('verseEnd') ?? '39', 10);

    const phrases = db.prepare(`
      SELECT p.id, p.phrase_text, v.verse_number, p.order_in_verse
      FROM phrases p
      JOIN verses v ON p.verse_id = v.id
      WHERE v.verse_number >= ? AND v.verse_number <= ? AND v.translation = ?
      ORDER BY v.verse_number, p.order_in_verse
    `).all(verseStart, verseEnd, translation) as Phrase[];

    const combinedText = phrases.map(p => p.phrase_text).join(' ');

    return NextResponse.json({
      phrases: phrases.map(p => ({
        phraseId: p.id,
        phraseText: p.phrase_text,
        verseNumber: p.verse_number,
      })),
      combinedText,
      verseStart,
      verseEnd,
      translation,
    });
  } catch (error) {
    console.error('Error fetching run phrases:', error);
    return NextResponse.json({ error: 'Failed to fetch phrases' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = getUserFromCookie(cookieStore);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = db.prepare(`SELECT translation FROM users WHERE id = ?`).get(userId) as { translation: string } | undefined;
    if (!user) {
      return NextResponse.json({ error: 'User not found. Please log in again.' }, { status: 401 });
    }
    const translation = user.translation || 'csb';

    const body: RunRequest = await request.json();
    const { verseStart, verseEnd, hintLevel, inputText, durationMs } = body;

    const phrases = db.prepare(`
      SELECT p.id, p.phrase_text, v.verse_number, p.order_in_verse
      FROM phrases p
      JOIN verses v ON p.verse_id = v.id
      WHERE v.verse_number >= ? AND v.verse_number <= ? AND v.translation = ?
      ORDER BY v.verse_number, p.order_in_verse
    `).all(verseStart, verseEnd, translation) as Phrase[];

    const combinedText = phrases.map(p => p.phrase_text).join(' ');
    const scoreResult = calculateScore(inputText, combinedText);

    const eventType = (verseStart === 1 && verseEnd === 39) ? 'chapter' : 'verse';

    const weakPhrases: { phraseId: number; phraseText: string; score: number }[] = [];
    for (const phrase of phrases) {
      const phraseScore = calculateScore(inputText, phrase.phrase_text);
      if (phraseScore.score < THRESHOLDS.PASS) {
        weakPhrases.push({
          phraseId: phrase.id,
          phraseText: phrase.phrase_text,
          score: phraseScore.score,
        });
      }
    }

    db.prepare(`
      INSERT INTO practice_events (user_id, phrase_id, event_type, hint_level, input_text, score, self_rating, duration_ms, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      null,
      eventType,
      hintLevel,
      inputText,
      scoreResult.score,
      null,
      durationMs,
      new Date().toISOString()
    );

    return NextResponse.json({
      score: scoreResult.score,
      wordResults: scoreResult.wordResults,
      weakPhrases,
    });
  } catch (error) {
    console.error('Error processing run:', error instanceof Error ? error.message : error, error instanceof Error ? error.stack : '');
    return NextResponse.json({ error: 'Failed to process run', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
