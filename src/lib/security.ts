import { NextRequest } from 'next/server';

export function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  // Allow requests without Origin header (same-origin navigations, curl, etc.)
  if (!origin) return true;

  if (!host) return false;

  try {
    const originUrl = new URL(origin);
    // Compare host (includes port if present)
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export const MAX_INPUT_LENGTH = 5000;
export const MAX_NAME_LENGTH = 100;
export const VALID_TRANSLATIONS = ['csb', 'esv'] as const;
export const VALID_RATINGS = ['too_easy', 'good', 'hard', 'fail'] as const;
export const VALID_HINT_LEVELS = [0, 1, 2, 3] as const;
export const MIN_VERSE = 1;
export const MAX_VERSE = 39;
export const MAX_DURATION_MS = 60 * 60 * 1000; // 1 hour

export function isValidVerseRange(start: number, end: number): boolean {
  return (
    Number.isInteger(start) &&
    Number.isInteger(end) &&
    start >= MIN_VERSE &&
    end <= MAX_VERSE &&
    start <= end
  );
}

export function isValidTranslation(translation: unknown): translation is 'csb' | 'esv' {
  return typeof translation === 'string' && VALID_TRANSLATIONS.includes(translation as 'csb' | 'esv');
}

export function isValidRating(rating: unknown): rating is 'too_easy' | 'good' | 'hard' | 'fail' {
  return typeof rating === 'string' && VALID_RATINGS.includes(rating as 'too_easy' | 'good' | 'hard' | 'fail');
}

export function isValidHintLevel(level: unknown): level is 0 | 1 | 2 | 3 {
  return typeof level === 'number' && VALID_HINT_LEVELS.includes(level as 0 | 1 | 2 | 3);
}

export function sanitizeName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_NAME_LENGTH);
}

export function isValidInputText(text: unknown): text is string {
  return typeof text === 'string' && text.length > 0 && text.length <= MAX_INPUT_LENGTH;
}

export function isValidDuration(duration: unknown): duration is number {
  return typeof duration === 'number' && Number.isInteger(duration) && duration >= 0 && duration <= MAX_DURATION_MS;
}

export function isValidPhraseId(id: unknown): id is number {
  return typeof id === 'number' && Number.isInteger(id) && id > 0;
}
