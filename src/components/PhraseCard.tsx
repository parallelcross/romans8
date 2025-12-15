interface PhraseCardProps {
  phrase: string;
  hintLevel: number;
  verseNumber: string;
}

export default function PhraseCard({ phrase, hintLevel, verseNumber }: PhraseCardProps) {
  const renderHint = () => {
    if (hintLevel === 0) {
      return <p className="text-foreground/50 italic">No hint - recall from memory</p>;
    }
    
    const words = phrase.split(" ");
    
    if (hintLevel === 1) {
      const firstWord = words[0];
      return (
        <p className="text-lg">
          <span className="font-medium">{firstWord}</span>
          <span className="text-foreground/30"> {"_ ".repeat(words.length - 1)}</span>
        </p>
      );
    }
    
    if (hintLevel === 2) {
      return (
        <p className="text-lg text-foreground/50">
          {words.map((word, i) => (
            <span key={i}>
              {word[0]}{"_".repeat(word.length - 1)}
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </p>
      );
    }
    
    if (hintLevel >= 3) {
      return <p className="text-lg text-foreground/70">{phrase}</p>;
    }
    
    return null;
  };

  return (
    <div className="bg-foreground/5 rounded-xl p-6 space-y-3">
      <div className="text-sm text-foreground/50 font-medium">
        Romans {verseNumber}
      </div>
      {renderHint()}
    </div>
  );
}
