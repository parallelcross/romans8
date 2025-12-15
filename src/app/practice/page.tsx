"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PhraseCard from "@/components/PhraseCard";
import WordResult from "@/components/WordResult";

interface PhraseItem {
  phraseId: number;
  phraseText: string;
  verseNumber: string;
  masteryLevel: number;
}

interface Session {
  sessionId: number;
  phrases: PhraseItem[];
  translation: string;
}

interface WordScore {
  word: string;
  status: "correct" | "close" | "missing" | "extra";
}

interface CheckResult {
  score: number;
  wordResults: WordScore[];
}

export default function PracticePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/session/today");
      const data = await res.json();
      if (data.phrases && data.phrases.length > 0) {
        setSession(data);
      } else {
        setSessionComplete(true);
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!session || !userInput.trim()) return;
    
    setIsSubmitting(true);
    const currentPhrase = session.phrases[currentIndex];
    
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phraseId: currentPhrase.phraseId,
          userInput: userInput.trim(),
        }),
      });
      const result = await res.json();
      setCheckResult(result);
    } catch (error) {
      console.error("Failed to check answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRating = async (rating: "easy" | "good" | "hard") => {
    if (!session) return;
    
    const currentPhrase = session.phrases[currentIndex];
    
    try {
      await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phraseId: currentPhrase.phraseId,
          sessionId: session.sessionId,
          rating,
          score: checkResult?.score ?? 0,
        }),
      });
    } catch (error) {
      console.error("Failed to submit rating:", error);
    }

    handleNext();
  };

  const handleNext = () => {
    if (!session) return;
    
    if (currentIndex + 1 >= session.phrases.length) {
      setSessionComplete(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setUserInput("");
      setCheckResult(null);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/50">Loading session...</p>
      </main>
    );
  }

  if (sessionComplete) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <h1 className="text-3xl font-bold">Session Complete!</h1>
          <p className="text-foreground/70">
            {session ? `You reviewed ${session.phrases.length} phrases.` : "No phrases due for review today."}
          </p>
          <div className="flex flex-col gap-4 pt-4">
            <Link
              href="/progress"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              View Progress
            </Link>
            <Link
              href="/"
              className="px-8 py-3 border border-foreground/20 hover:bg-foreground/5 font-medium rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/50">No session available</p>
      </main>
    );
  }

  const currentPhrase = session.phrases[currentIndex];

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-foreground/50 hover:text-foreground transition-colors">
            ← Back
          </Link>
          <div className="text-center">
            <span className="text-sm font-medium">Romans 8 ({session.translation.toUpperCase()})</span>
          </div>
          <span className="text-sm text-foreground/50">
            {currentIndex + 1} of {session.phrases.length}
          </span>
        </div>

        <PhraseCard
          phrase={currentPhrase.phraseText}
          hintLevel={currentPhrase.masteryLevel}
          verseNumber={currentPhrase.verseNumber}
        />

        {!checkResult ? (
          <div className="space-y-4">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type the phrase from memory..."
              className="w-full h-32 p-4 bg-foreground/5 border border-foreground/10 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !userInput.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? "Checking..." : "Check Answer"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-foreground/5 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground/50">Score</span>
                <span className="text-2xl font-bold">{Math.round(checkResult.score * 100)}%</span>
              </div>
              
              <div className="text-lg leading-relaxed">
                {checkResult.wordResults.map((wr, i) => (
                  <span key={i}>
                    <WordResult word={wr.word} status={wr.status} />
                    {i < checkResult.wordResults.length - 1 ? " " : ""}
                  </span>
                ))}
              </div>
              
              <div className="pt-2 text-sm text-foreground/50">
                <span className="text-green-600 dark:text-green-400">●</span> correct{" "}
                <span className="text-yellow-600 dark:text-yellow-400">●</span> close{" "}
                <span className="text-red-600 dark:text-red-400">●</span> missing/extra
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-center text-sm text-foreground/50">How did that feel?</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleRating("easy")}
                  className="py-3 border border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-medium rounded-lg transition-colors"
                >
                  Too Easy
                </button>
                <button
                  onClick={() => handleRating("good")}
                  className="py-3 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-medium rounded-lg transition-colors"
                >
                  Good
                </button>
                <button
                  onClick={() => handleRating("hard")}
                  className="py-3 border border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white font-medium rounded-lg transition-colors"
                >
                  Hard
                </button>
              </div>
              <button
                onClick={handleNext}
                className="w-full py-3 bg-foreground/10 hover:bg-foreground/20 font-medium rounded-lg transition-colors"
              >
                Skip Rating → Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
