type WordStatus = "correct" | "close" | "missing" | "extra";

interface WordResultProps {
  word: string;
  status: WordStatus;
}

const statusStyles: Record<WordStatus, string> = {
  correct: "text-green-600 dark:text-green-400",
  close: "text-yellow-600 dark:text-yellow-400",
  missing: "text-red-600 dark:text-red-400 line-through",
  extra: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1 rounded",
};

export default function WordResult({ word, status }: WordResultProps) {
  return (
    <span className={`${statusStyles[status]} font-medium`}>
      {word}
    </span>
  );
}
