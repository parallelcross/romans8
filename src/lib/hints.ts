export type HintLevel = 0 | 1 | 2 | 3;

export function generateHint(text: string, level: HintLevel): string {
  switch (level) {
    case 0:
      return text;

    case 1:
      return generateClozeHint(text);

    case 2:
      return generateFirstLetterHint(text);

    case 3:
      return '...';
  }
}

function generateClozeHint(text: string): string {
  const words = text.split(/(\s+)/);
  let wordIndex = 0;

  return words.map(token => {
    if (/^\s+$/.test(token)) {
      return token;
    }
    wordIndex++;
    if (wordIndex % 2 === 0) {
      return '___';
    }
    return token;
  }).join('');
}

function generateFirstLetterHint(text: string): string {
  const words = text.split(/(\s+)/);

  return words.map(token => {
    if (/^\s+$/.test(token)) {
      return token;
    }
    if (token.length === 0) return token;

    const firstChar = token[0];
    const rest = token.slice(1);
    const underscores = rest.replace(/[a-zA-Z]/g, '_');
    return firstChar + underscores;
  }).join('');
}

export function getHintLevelDescription(level: HintLevel): string {
  switch (level) {
    case 0: return 'Full text';
    case 1: return 'Cloze (50% hidden)';
    case 2: return 'First letters only';
    case 3: return 'No hints';
  }
}
