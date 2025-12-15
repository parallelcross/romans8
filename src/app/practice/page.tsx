"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, ChevronRight, Sparkles, Trophy } from "lucide-react";

interface PhraseItem {
  phraseId: number;
  phraseText: string;
  verseNumber: string;
  masteryLevel: number;
}

interface Session {
  phrases: PhraseItem[];
  translation: string;
}

interface WordScore {
  word: string;
  status: "correct" | "close" | "missing" | "extra";
}

interface ReviewResult {
  score: number;
  wordResults: WordScore[];
  passed: boolean;
  nextReview: string;
}

type SelfRating = "too_easy" | "good" | "hard" | "fail";

export default function PracticePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    // Reset timer when moving to new phrase
    startTimeRef.current = Date.now();
  }, [currentIndex]);

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

  const handleSubmit = async (rating: SelfRating) => {
    if (!session || !userInput.trim()) return;

    setIsSubmitting(true);
    const currentPhrase = session.phrases[currentIndex];
    const durationMs = Date.now() - startTimeRef.current;

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phraseId: currentPhrase.phraseId,
          inputText: userInput.trim(),
          selfRating: rating,
          durationMs,
        }),
      });
      const result = await res.json();
      if (result.error) {
        console.error("Review error:", result.error);
      } else {
        setReviewResult(result);
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!session) return;

    if (currentIndex + 1 >= session.phrases.length) {
      setSessionComplete(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setUserInput("");
      setReviewResult(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !reviewResult) {
      e.preventDefault();
      handleSubmit("good");
    }
  };

  const getWordColor = (status: WordScore["status"]) => {
    switch (status) {
      case "correct":
        return "text-green-600 dark:text-green-400";
      case "close":
        return "text-yellow-600 dark:text-yellow-400";
      case "missing":
      case "extra":
        return "text-red-600 dark:text-red-400 line-through";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground"
        >
          Loading session...
        </motion.div>
      </main>
    );
  }

  if (sessionComplete) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-md text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Trophy className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold">Session Complete!</h1>
          <p className="text-muted-foreground">
            {session
              ? `You reviewed ${session.phrases.length} phrases.`
              : "No phrases due for review today. Check back tomorrow!"}
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-3 pt-4"
          >
            <Button asChild size="lg">
              <Link href="/progress">View Progress</Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/run">Practice Verses</Link>
            </Button>
          </motion.div>
        </motion.div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No session available</p>
      </main>
    );
  }

  const currentPhrase = session.phrases[currentIndex];

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top: Session Info */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              Romans 8 • {session.translation.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground font-medium">
              {currentIndex + 1} of {session.phrases.length}
            </span>
          </div>
        </motion.div>

        {/* Main: Prompt Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-lg">
                    Type this phrase from memory
                  </CardTitle>
                  <Badge>Romans 8:{currentPhrase.verseNumber}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt Text - Show hint based on mastery */}
                <div className="verse-text text-xl md:text-2xl leading-relaxed text-foreground/90 bg-muted/30 p-4 rounded-lg">
                  {currentPhrase.masteryLevel >= 3 ? (
                    <span className="text-muted-foreground italic">
                      {currentPhrase.phraseText
                        .split(" ")
                        .map((w) => w[0] + "_".repeat(Math.min(w.length - 1, 6)))
                        .join(" ")}
                    </span>
                  ) : (
                    currentPhrase.phraseText
                  )}
                </div>

                {/* Input Area */}
                {!reviewResult ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4"
                  >
                    <textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type the phrase from memory..."
                      className="w-full h-32 p-4 bg-muted/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                      autoFocus
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleSubmit("hard")}
                        disabled={isSubmitting || !userInput.trim()}
                        className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
                      >
                        Hard
                      </Button>
                      <Button
                        onClick={() => handleSubmit("good")}
                        disabled={isSubmitting || !userInput.trim()}
                        size="lg"
                      >
                        {isSubmitting ? "..." : (
                          <>
                            <Check className="w-4 h-4" />
                            Good
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleSubmit("too_easy")}
                        disabled={isSubmitting || !userInput.trim()}
                        className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                      >
                        Easy
                      </Button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Press Enter to submit as &quot;Good&quot;
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Feedback Area */}
                    <div className="bg-muted/30 rounded-lg p-5 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">
                          {reviewResult.passed ? "Correct!" : "Keep practicing"}
                        </span>
                        <div className="flex items-center gap-2">
                          {reviewResult.score >= 0.9 && (
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className="text-2xl font-bold">
                            {Math.round(reviewResult.score * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="verse-text text-lg leading-relaxed">
                        {(reviewResult.wordResults || []).map((wr, i) => (
                          <span key={i}>
                            <span className={getWordColor(wr.status)}>
                              {wr.word}
                            </span>
                            {i < (reviewResult.wordResults || []).length - 1
                              ? " "
                              : ""}
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500" />{" "}
                          correct
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-yellow-500" />{" "}
                          close
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500" />{" "}
                          missing
                        </span>
                      </div>
                    </div>

                    <Button onClick={handleNext} className="w-full" size="lg">
                      Next Phrase
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
