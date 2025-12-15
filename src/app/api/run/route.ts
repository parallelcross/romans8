import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { calculateScore, THRESHOLDS } from '@/lib/scoring';
import { getUserFromCookie } from '@/lib/auth';
import {
  isValidOrigin,
  isValidVerseRange,
  isValidHintLevel,
  isValidInputText,
  isValidDuration,
  MIN_VERSE,
  MAX_VERSE,
} from '@/lib/security';

interface Phrase {
  id: number;
  phrase_text: string;
  verse_number: number;
  order_in_verse: number;
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const verseStart = parseInt(searchParams.get('verseStart') ?? '1', 10);
    const verseEnd = parseInt(searchParams.get('verseEnd') ?? '39', 10);

    if (!isValidVerseRange(verseStart, verseEnd)) {
      return NextResponse.json({ error: 'Invalid verse range' }, { status: 400 });
    }

    const phrasesResult = await db.execute({
      sql: `SELECT p.id, p.phrase_text, v.verse_number, p.order_in_verse
            FROM phrases p
            JOIN verses v ON p.verse_id = v.id
            WHERE v.verse_number >= ? AND v.verse_number <= ? AND v.translation = ?
            ORDER BY v.verse_number, p.order_in_verse`,
      args: [verseStart, verseEnd, translation]
    });
    const phrases = phrasesResult.rows as unknown as Phrase[];

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
    if (!isValidOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }

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
    if (!user) {
      return NextResponse.json({ error: 'User not found. Please log in again.' }, { status: 401 });
    }
    const translation = user.translation || 'csb';

    const body = await request.json();
    const { verseStart, verseEnd, hintLevel, inputText, durationMs } = body ?? {};

    if (!isValidVerseRange(verseStart, verseEnd)) {
      return NextResponse.json({ error: `Invalid verse range (must be ${MIN_VERSE}-${MAX_VERSE})` }, { status: 400 });
    }

    if (!isValidHintLevel(hintLevel)) {
      return NextResponse.json({ error: 'Invalid hint level' }, { status: 400 });
    }

    if (!isValidInputText(inputText)) {
      return NextResponse.json({ error: 'Invalid inputText' }, { status: 400 });
    }

    if (!isValidDuration(durationMs)) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
    }

    const phrasesResult = await db.execute({
      sql: `SELECT p.id, p.phrase_text, v.verse_number, p.order_in_verse
            FROM phrases p
            JOIN verses v ON p.verse_id = v.id
            WHERE v.verse_number >= ? AND v.verse_number <= ? AND v.translation = ?
            ORDER BY v.verse_number, p.order_in_verse`,
      args: [verseStart, verseEnd, translation]
    });
    const phrases = phrasesResult.rows as unknown as Phrase[];

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

    await db.execute({
      sql: `INSERT INTO practice_events (user_id, phrase_id, event_type, hint_level, input_text, score, self_rating, duration_ms, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        userId,
        null,
        eventType,
        hintLevel,
        inputText,
        scoreResult.score,
        null,
        durationMs,
        new Date().toISOString()
      ]
    });

    return NextResponse.json({
      score: scoreResult.score,
      wordResults: scoreResult.wordResults,
      weakPhrases,
    });
  } catch (error) {
    console.error('Error processing run:', error);
    return NextResponse.json({ error: 'Failed to process run' }, { status: 500 });
  }
}
