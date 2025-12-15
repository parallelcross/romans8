export type QualityRating = 'too_easy' | 'good' | 'hard' | 'fail';

export interface ReviewState {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
}

export interface ReviewResult extends ReviewState {
  due_date: string;
}

export function mapScoreToQuality(score: number, selfRating: QualityRating): number {
  if (selfRating === 'fail' || score < 0.80) return 2;
  if (selfRating === 'too_easy' && score >= 0.98) return 5;
  if (selfRating === 'good' && score >= 0.92) return 4;
  if (selfRating === 'hard' || (score >= 0.80 && score < 0.92)) return 3;
  if (score >= 0.98) return 5;
  if (score >= 0.92) return 4;
  return 3;
}

export function calculateNextReview(
  current: ReviewState,
  quality: number
): ReviewResult {
  let { ease_factor, interval_days, repetitions, lapses } = current;

  if (quality < 3) {
    interval_days = 1;
    repetitions = 0;
    lapses += 1;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval_days = 1;
    } else if (repetitions === 2) {
      interval_days = 3;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval_days);
  const due_date = dueDate.toISOString().split('T')[0];

  return {
    ease_factor,
    interval_days,
    repetitions,
    lapses,
    due_date,
  };
}

export function createInitialState(): ReviewState {
  return {
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    lapses: 0,
  };
}
