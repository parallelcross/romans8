import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { calculateScore, THRESHOLDS } from '@/lib/scoring';
import {
  QualityRating,
  mapScoreToQuality,
  calculateNextReview,
  createInitialState,
} from '@/lib/spaced-repetition';
import { getUserFromCookie } from '@/lib/auth';
import {
  isValidOrigin,
  isValidPhraseId,
  isValidInputText,
  isValidRating,
  isValidDuration,
} from '@/lib/security';

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

    const body = await request.json();
    const { phraseId, inputText, selfRating, durationMs } = body ?? {};

    if (!isValidPhraseId(phraseId)) {
      return NextResponse.json({ error: 'Invalid phraseId' }, { status: 400 });
    }

    if (!isValidInputText(inputText)) {
      return NextResponse.json({ error: 'Invalid inputText' }, { status: 400 });
    }

    if (!isValidRating(selfRating)) {
      return NextResponse.json({ error: 'Invalid selfRating' }, { status: 400 });
    }

    if (!isValidDuration(durationMs)) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
    }

    const phraseResult = await db.execute({
      sql: `SELECT phrase_text FROM phrases WHERE id = ?`,
      args: [phraseId]
    });
    const phrase = phraseResult.rows[0] as unknown as { phrase_text: string } | undefined;

    if (!phrase) {
      return NextResponse.json({ error: 'Phrase not found' }, { status: 404 });
    }

    const scoreResult = calculateScore(inputText, phrase.phrase_text);
    const passed = scoreResult.score >= THRESHOLDS.PASS;

    const progressResult = await db.execute({
      sql: `SELECT ease_factor, interval_days, repetitions, lapses, mastery_level
            FROM phrase_progress
            WHERE user_id = ? AND phrase_id = ?`,
      args: [userId, phraseId]
    });
    const progress = progressResult.rows[0] as unknown as {
      ease_factor: number;
      interval_days: number;
      repetitions: number;
      lapses: number;
      mastery_level: number;
    } | undefined;

    const currentState = progress ?? createInitialState();
    const quality = mapScoreToQuality(scoreResult.score, selfRating as QualityRating);
    const nextReview = calculateNextReview(currentState, quality);

    let newMasteryLevel = progress?.mastery_level ?? 0;
    if (passed && selfRating !== 'fail') {
      newMasteryLevel = Math.min(5, newMasteryLevel + 1);
    } else if (!passed || selfRating === 'fail') {
      newMasteryLevel = Math.max(0, newMasteryLevel - 1);
    }

    if (progress) {
      await db.execute({
        sql: `UPDATE phrase_progress
              SET ease_factor = ?, interval_days = ?, due_date = ?, repetitions = ?, lapses = ?, mastery_level = ?
              WHERE user_id = ? AND phrase_id = ?`,
        args: [
          nextReview.ease_factor,
          nextReview.interval_days,
          nextReview.due_date,
          nextReview.repetitions,
          nextReview.lapses,
          newMasteryLevel,
          userId,
          phraseId
        ]
      });
    } else {
      await db.execute({
        sql: `INSERT INTO phrase_progress (user_id, phrase_id, ease_factor, interval_days, due_date, repetitions, lapses, mastery_level)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          userId,
          phraseId,
          nextReview.ease_factor,
          nextReview.interval_days,
          nextReview.due_date,
          nextReview.repetitions,
          nextReview.lapses,
          newMasteryLevel
        ]
      });
    }

    const hintLevel = newMasteryLevel >= 5 ? 3 : newMasteryLevel >= 3 ? 2 : newMasteryLevel >= 1 ? 1 : 0;

    await db.execute({
      sql: `INSERT INTO practice_events (user_id, phrase_id, event_type, hint_level, input_text, score, self_rating, duration_ms, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        userId,
        phraseId,
        'review',
        hintLevel,
        inputText,
        scoreResult.score,
        selfRating,
        durationMs,
        new Date().toISOString()
      ]
    });

    return NextResponse.json({
      score: scoreResult.score,
      wordResults: scoreResult.wordResults,
      passed,
      nextReview: nextReview.due_date,
    });
  } catch (error) {
    console.error('Error processing review:', error);
    return NextResponse.json({ error: 'Failed to process review' }, { status: 500 });
  }
}
