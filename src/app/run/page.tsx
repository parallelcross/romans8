"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import WordResult from "@/components/WordResult";

interface PhraseInfo {
  phraseId: number;
  phraseText: string;
  verseNumber: number;
}

interface WordScore {
  word: string;
  status: "correct" | "close" | "missing" | "extra";
}

interface WeakPhrase {
  phraseId: number;
  phraseText: string;
  score: number;
}

interface RunResult {
  score: number;
  wordResults: WordScore[];
  weakPhrases: WeakPhrase[];
}

const HINT_LABELS = [
  "No hints",
  "First word only",
  "First letters",
  "Full text",
];

export default function RunPage() {
  const [verseStart, setVerseStart] = useState(1);
  const [verseEnd, setVerseEnd] = useState(4);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [phrases, setPhrases] = useState<PhraseInfo[]>([]);
  const [combinedText, setCombinedText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState<RunResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [translation, setTranslation] = useState<string>("csb");
  const [isSwitching, setIsSwitching] = useState(false);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    fetch("/api/user")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.translation) setTranslation(data.translation);
      })
      .catch(() => {});
  }, []);

  const handleTranslationChange = async (newTranslation: string) => {
    if (newTranslation === translation) return;
    setIsSwitching(true);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translation: newTranslation }),
      });
      setTranslation(newTranslation);
    } catch (error) {
      console.error("Failed to update translation:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  const startRun = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/run?verseStart=${verseStart}&verseEnd=${verseEnd}`);
      const data = await res.json();
      setPhrases(data.phrases);
      setCombinedText(data.combinedText);
      setIsRunning(true);
      setUserInput("");
      setResult(null);
      startTimeRef.current = Date.now();
    } catch (error) {
      console.error("Failed to start run:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!userInput.trim()) return;
    
    setIsSubmitting(true);
    const durationMs = Date.now() - startTimeRef.current;
    
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verseStart,
          verseEnd,
          hintLevel,
          inputText: userInput.trim(),
          durationMs,
        }),
      });
      const data = await res.json();
      if (data.error) {
        console.error("Run error:", data.error);
        return;
      }
      setResult({
        score: data.score,
        wordResults: data.wordResults || [],
        weakPhrases: data.weakPhrases || [],
      });
    } catch (error) {
      console.error("Failed to submit run:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setUserInput("");
    setResult(null);
    startTimeRef.current = Date.now();
  };

  const handleBack = () => {
    setIsRunning(false);
    setResult(null);
    setUserInput("");
  };

  const setQuickRange = (start: number, end: number) => {
    setVerseStart(start);
    setVerseEnd(end);
  };

  const renderHint = () => {
    if (hintLevel === 0) {
      return <p className="text-foreground/50 italic">No hint - recall from memory</p>;
    }
    
    const words = combinedText.split(" ");
    
    if (hintLevel === 1) {
      const firstWord = words[0];
      return (
        <p className="text-lg leading-relaxed">
          <span className="font-medium">{firstWord}</span>
          <span className="text-foreground/30"> {"_ ".repeat(Math.min(words.length - 1, 20))}...</span>
        </p>
      );
    }
    
    if (hintLevel === 2) {
      return (
        <p className="text-lg text-foreground/50 leading-relaxed">
          {words.slice(0, 50).map((word, i) => (
            <span key={i}>
              {word[0]}{"_".repeat(Math.min(word.length - 1, 8))}
              {i < 49 ? " " : ""}
            </span>
          ))}
          {words.length > 50 && "..."}
        </p>
      );
    }
    
    if (hintLevel >= 3) {
      return <p className="text-lg text-foreground/70 leading-relaxed">{combinedText}</p>;
    }
    
    return null;
  };

  if (!isRunning) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-foreground/50 hover:text-foreground transition-colors">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold">Practice Verses</h1>
            <div />
          </div>

          <div className="bg-foreground/5 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Translation</span>
              <span className="text-foreground/50">{translation.toUpperCase()}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleTranslationChange("csb")}
                disabled={isSwitching}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  translation === "csb"
                    ? "bg-blue-600 text-white"
                    : "border border-foreground/20 hover:bg-foreground/5"
                }`}
              >
                CSB
              </button>
              <button
                onClick={() => handleTranslationChange("esv")}
                disabled={isSwitching}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  translation === "esv"
                    ? "bg-blue-600 text-white"
                    : "border border-foreground/20 hover:bg-foreground/5"
                }`}
              >
                ESV
              </button>
            </div>
          </div>

          <div className="bg-foreground/5 rounded-xl p-6 space-y-6">
            <div className="space-y-4">
              <h2 className="font-medium">Quick Select</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setQuickRange(1, 39)}
                  className="py-2 px-4 border border-foreground/20 hover:bg-foreground/10 rounded-lg transition-colors"
                >
                  Full Chapter (1-39)
                </button>
                <button
                  onClick={() => setQuickRange(1, 4)}
                  className="py-2 px-4 border border-foreground/20 hover:bg-foreground/10 rounded-lg transition-colors"
                >
                  First 4 Verses
                </button>
                <button
                  onClick={() => setQuickRange(1, 19)}
                  className="py-2 px-4 border border-foreground/20 hover:bg-foreground/10 rounded-lg transition-colors"
                >
                  First Half (1-19)
                </button>
                <button
                  onClick={() => setQuickRange(20, 39)}
                  className="py-2 px-4 border border-foreground/20 hover:bg-foreground/10 rounded-lg transition-colors"
                >
                  Second Half (20-39)
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-medium">Custom Range</h2>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="block text-sm text-foreground/50 mb-1">Start Verse</label>
                  <select
                    value={verseStart}
                    onChange={(e) => {
                      const newStart = parseInt(e.target.value, 10);
                      setVerseStart(newStart);
                      if (newStart > verseEnd) setVerseEnd(newStart);
                    }}
                    className="w-full p-2 bg-background border border-foreground/20 rounded-lg"
                  >
                    {Array.from({ length: 39 }, (_, i) => i + 1).map((v) => (
                      <option key={v} value={v}>
                        Verse {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-foreground/50 mb-1">End Verse</label>
                  <select
                    value={verseEnd}
                    onChange={(e) => setVerseEnd(parseInt(e.target.value, 10))}
                    className="w-full p-2 bg-background border border-foreground/20 rounded-lg"
                  >
                    {Array.from({ length: 39 - verseStart + 1 }, (_, i) => verseStart + i).map((v) => (
                      <option key={v} value={v}>
                        Verse {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-medium">Hint Level</h2>
              <div className="grid grid-cols-2 gap-3">
                {([0, 1, 2, 3] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setHintLevel(level)}
                    className={`py-2 px-4 border rounded-lg transition-colors ${
                      hintLevel === level
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-foreground/20 hover:bg-foreground/10"
                    }`}
                  >
                    {level}: {HINT_LABELS[level]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={startRun}
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-lg"
          >
            {isLoading ? "Loading..." : "Start Run"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            className="text-foreground/50 hover:text-foreground transition-colors"
          >
            ← Back
          </button>
          <span className="text-sm text-foreground/50">
            Romans 8:{verseStart}-{verseEnd} • Hint Level {hintLevel}
          </span>
        </div>

        {!result ? (
          <>
            <div className="bg-foreground/5 rounded-xl p-6 space-y-3 max-h-64 overflow-y-auto">
              <div className="text-sm text-foreground/50 font-medium">
                Romans 8:{verseStart}-{verseEnd}
              </div>
              {renderHint()}
            </div>

            <div className="space-y-4">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the passage from memory..."
                className="w-full h-64 p-4 bg-foreground/5 border border-foreground/10 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !userInput.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {isSubmitting ? "Checking..." : "Submit"}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="bg-foreground/5 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground/50">Overall Score</span>
                <span className="text-3xl font-bold">{Math.round(result.score * 100)}%</span>
              </div>
            </div>

            <div className="bg-foreground/5 rounded-xl p-6 space-y-4">
              <h3 className="font-medium">Word-by-Word Results</h3>
              <div className="text-lg leading-relaxed max-h-64 overflow-y-auto">
                {(result.wordResults || []).map((wr, i) => (
                  <span key={i}>
                    <WordResult word={wr.word} status={wr.status} />
                    {i < (result.wordResults || []).length - 1 ? " " : ""}
                  </span>
                ))}
              </div>
              <div className="pt-2 text-sm text-foreground/50">
                <span className="text-green-600 dark:text-green-400">●</span> correct{" "}
                <span className="text-yellow-600 dark:text-yellow-400">●</span> close{" "}
                <span className="text-red-600 dark:text-red-400">●</span> missing/extra
              </div>
            </div>

            {result.weakPhrases.length > 0 && (
              <div className="bg-foreground/5 rounded-xl p-6 space-y-4">
                <h3 className="font-medium">Weak Phrases to Review</h3>
                <ul className="space-y-3">
                  {result.weakPhrases.map((wp) => (
                    <li key={wp.phraseId} className="flex justify-between items-start gap-4">
                      <span className="text-foreground/70">{wp.phraseText}</span>
                      <span className="text-sm text-foreground/50 whitespace-nowrap">
                        {Math.round(wp.score * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleTryAgain}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/practice"
                className="flex-1 py-3 border border-foreground/20 hover:bg-foreground/5 font-medium rounded-lg transition-colors text-center"
              >
                Back to Practice
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
