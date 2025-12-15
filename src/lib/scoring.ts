export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/^\d+\s*/, '')
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?'"()\[\]{}—–-]/g, '')
    .trim();
}

export function tokenize(text: string): string[] {
  return normalizeText(text).split(/\s+/).filter(w => w.length > 0);
}

function editDistance(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export type WordStatus = 'correct' | 'close' | 'missing' | 'extra';

export interface WordResult {
  word: string;
  status: WordStatus;
}

export interface ScoreResult {
  score: number;
  wordResults: WordResult[];
}

export function calculateScore(input: string, expected: string): ScoreResult {
  const inputWords = tokenize(input);
  const expectedWords = tokenize(expected);

  const maxLen = Math.max(inputWords.length, expectedWords.length);
  if (maxLen === 0) {
    return { score: 1, wordResults: [] };
  }

  const dist = editDistance(inputWords, expectedWords);
  const score = 1 - dist / maxLen;

  const wordResults: WordResult[] = [];
  const expectedSet = new Set(expectedWords);
  const inputSet = new Set(inputWords);

  for (const word of expectedWords) {
    if (inputSet.has(word)) {
      wordResults.push({ word, status: 'correct' });
    } else {
      const closeMatch = inputWords.find(iw => {
        if (iw.length < 3 || word.length < 3) return false;
        const minLen = Math.min(iw.length, word.length);
        let matches = 0;
        for (let i = 0; i < minLen; i++) {
          if (iw[i] === word[i]) matches++;
        }
        return matches / Math.max(iw.length, word.length) >= 0.6;
      });
      wordResults.push({ word, status: closeMatch ? 'close' : 'missing' });
    }
  }

  for (const word of inputWords) {
    if (!expectedSet.has(word)) {
      wordResults.push({ word, status: 'extra' });
    }
  }

  return { score, wordResults };
}

export const THRESHOLDS = {
  PASS: 0.92,
  NEAR_MISS: 0.80,
} as const;

export type ScoreCategory = 'pass' | 'near_miss' | 'fail';

export function categorizeScore(score: number): ScoreCategory {
  if (score >= THRESHOLDS.PASS) return 'pass';
  if (score >= THRESHOLDS.NEAR_MISS) return 'near_miss';
  return 'fail';
}
