import db from '@/lib/db';
import type { HintLevel } from '@/lib/hints';

export interface SessionPhrase {
  id: number;
  phrase_text: string;
  verse_number: number;
  hint_level: HintLevel;
}

export interface DailySession {
  warmup: SessionPhrase[];
  reviews: SessionPhrase[];
  newPhrases: SessionPhrase[];
}

function masteryToHintLevel(masteryLevel: number): HintLevel {
  if (masteryLevel >= 5) return 3;
  if (masteryLevel >= 3) return 2;
  if (masteryLevel >= 1) return 1;
  return 0;
}

export function generateDailySession(userId: string, translation: string = 'csb'): DailySession {
  const today = new Date().toISOString().split('T')[0];

  const masteredPhrases = db.prepare(`
    SELECT p.id, p.phrase_text, v.verse_number, pp.mastery_level
    FROM phrases p
    JOIN verses v ON p.verse_id = v.id
    JOIN phrase_progress pp ON pp.phrase_id = p.id AND pp.user_id = ?
    WHERE pp.mastery_level >= 3 AND v.translation = ?
    ORDER BY RANDOM()
    LIMIT 3
  `).all(userId, translation) as Array<{ id: number; phrase_text: string; verse_number: number; mastery_level: number }>;

  const warmup: SessionPhrase[] = masteredPhrases.map(p => ({
    id: p.id,
    phrase_text: p.phrase_text,
    verse_number: p.verse_number,
    hint_level: masteryToHintLevel(p.mastery_level),
  }));

  const reviewPhrases = db.prepare(`
    SELECT p.id, p.phrase_text, v.verse_number, pp.mastery_level
    FROM phrases p
    JOIN verses v ON p.verse_id = v.id
    JOIN phrase_progress pp ON pp.phrase_id = p.id AND pp.user_id = ?
    WHERE pp.due_date <= ? AND v.translation = ?
    ORDER BY pp.due_date ASC
  `).all(userId, today, translation) as Array<{ id: number; phrase_text: string; verse_number: number; mastery_level: number }>;

  const reviews: SessionPhrase[] = reviewPhrases.map(p => ({
    id: p.id,
    phrase_text: p.phrase_text,
    verse_number: p.verse_number,
    hint_level: masteryToHintLevel(p.mastery_level),
  }));

  const newPhrasesData = db.prepare(`
    SELECT p.id, p.phrase_text, v.verse_number
    FROM phrases p
    JOIN verses v ON p.verse_id = v.id
    WHERE p.id NOT IN (
      SELECT phrase_id FROM phrase_progress WHERE user_id = ?
    ) AND v.translation = ?
    ORDER BY v.verse_number, p.order_in_verse
    LIMIT 5
  `).all(userId, translation) as Array<{ id: number; phrase_text: string; verse_number: number }>;

  const newPhrases: SessionPhrase[] = newPhrasesData.map(p => ({
    id: p.id,
    phrase_text: p.phrase_text,
    verse_number: p.verse_number,
    hint_level: 0 as HintLevel,
  }));

  return { warmup, reviews, newPhrases };
}
