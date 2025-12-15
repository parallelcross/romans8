"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Play, ChevronDown, RotateCcw, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  "First word",
  "First letters",
  "Full text",
];

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 },
};

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
      return <p className="text-muted-foreground italic">No hint - recall from memory</p>;
    }
    
    const words = combinedText.split(" ");
    
    if (hintLevel === 1) {
      const firstWord = words[0];
      return (
        <p className="text-lg leading-relaxed font-serif">
          <span className="font-medium">{firstWord}</span>
          <span className="text-muted-foreground/50"> {"_ ".repeat(Math.min(words.length - 1, 20))}...</span>
        </p>
      );
    }
    
    if (hintLevel === 2) {
      return (
        <p className="text-lg text-muted-foreground leading-relaxed font-serif">
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
      return <p className="text-lg text-foreground/80 leading-relaxed font-serif">{combinedText}</p>;
    }
    
    return null;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "text-green-600 dark:text-green-400";
    if (score >= 0.7) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (!isRunning) {
    return (
      <motion.main 
        className="min-h-screen p-6 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="size-6 text-primary" />
              <h1 className="text-2xl font-bold">Practice Verses</h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Translation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex rounded-lg border overflow-hidden">
                <Button
                  variant={translation === "csb" ? "default" : "ghost"}
                  onClick={() => handleTranslationChange("csb")}
                  disabled={isSwitching}
                  className="flex-1 rounded-none"
                >
                  CSB
                </Button>
                <Button
                  variant={translation === "esv" ? "default" : "ghost"}
                  onClick={() => handleTranslationChange("esv")}
                  disabled={isSwitching}
                  className="flex-1 rounded-none border-l"
                >
                  ESV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Select</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Full Chapter", range: [1, 39] },
                  { label: "First 4 Verses", range: [1, 4] },
                  { label: "First Half", range: [1, 19] },
                  { label: "Second Half", range: [20, 39] },
                ].map(({ label, range }) => (
                  <Button
                    key={label}
                    variant={verseStart === range[0] && verseEnd === range[1] ? "default" : "outline"}
                    onClick={() => setQuickRange(range[0], range[1])}
                    className="h-auto py-3"
                  >
                    <span className="text-sm">{label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm text-muted-foreground">Start Verse</label>
                  <div className="relative">
                    <select
                      value={verseStart}
                      onChange={(e) => {
                        const newStart = parseInt(e.target.value, 10);
                        setVerseStart(newStart);
                        if (newStart > verseEnd) setVerseEnd(newStart);
                      }}
                      className="w-full h-10 px-3 pr-8 bg-background border rounded-md appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {Array.from({ length: 39 }, (_, i) => i + 1).map((v) => (
                        <option key={v} value={v}>
                          Verse {v}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm text-muted-foreground">End Verse</label>
                  <div className="relative">
                    <select
                      value={verseEnd}
                      onChange={(e) => setVerseEnd(parseInt(e.target.value, 10))}
                      className="w-full h-10 px-3 pr-8 bg-background border rounded-md appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {Array.from({ length: 39 - verseStart + 1 }, (_, i) => verseStart + i).map((v) => (
                        <option key={v} value={v}>
                          Verse {v}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hint Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex rounded-lg border overflow-hidden">
                {([0, 1, 2, 3] as const).map((level) => (
                  <Button
                    key={level}
                    variant={hintLevel === level ? "default" : "ghost"}
                    onClick={() => setHintLevel(level)}
                    className="flex-1 rounded-none text-xs px-2 h-10"
                  >
                    {HINT_LABELS[level]}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={startRun}
            disabled={isLoading}
            size="lg"
            className="w-full h-14 text-lg gap-2"
          >
            <Play className="size-5" />
            {isLoading ? "Loading..." : "Start Run"}
          </Button>
        </div>
      </motion.main>
    );
  }

  return (
    <motion.main 
      className="min-h-screen p-6 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Badge variant="secondary" className="text-sm">
            Romans 8:{verseStart}-{verseEnd} • Hint {hintLevel}
          </Badge>
        </div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="input" {...fadeIn} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground font-normal">
                    Romans 8:{verseStart}-{verseEnd}
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-48 overflow-y-auto">
                  {renderHint()}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type the passage from memory..."
                  className="w-full h-64 p-4 bg-muted/50 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-shadow duration-150 font-serif text-lg"
                  autoFocus
                />
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !userInput.trim()}
                  size="lg"
                  className="w-full h-12 gap-2"
                >
                  <Check className="size-5" />
                  {isSubmitting ? "Checking..." : "Submit"}
                </Button>
              </div>
              
              <div className="flex justify-center">
                <Progress value={userInput.length > 0 ? Math.min((userInput.length / (combinedText.length || 1)) * 100, 100) : 0} className="w-48" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="results" {...fadeIn} className="space-y-6">
              <Card className="overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative size-32">
                      <svg className="size-32 -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-muted"
                        />
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeLinecap="round"
                          className={getScoreColor(result.score)}
                          strokeDasharray={`${result.score * 283} 283`}
                          initial={{ strokeDasharray: "0 283" }}
                          animate={{ strokeDasharray: `${result.score * 283} 283` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                          {Math.round(result.score * 100)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground">Overall Score</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Word-by-Word Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg leading-relaxed max-h-64 overflow-y-auto font-serif">
                    {(result.wordResults || []).map((wr, i) => (
                      <span key={i}>
                        <WordResult word={wr.word} status={wr.status} />
                        {i < (result.wordResults || []).length - 1 ? " " : ""}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-green-500" /> correct
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-yellow-500" /> close
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-red-500" /> missing/extra
                    </span>
                  </div>
                </CardContent>
              </Card>

              {result.weakPhrases.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="size-4 text-yellow-500" />
                      Weak Phrases to Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.weakPhrases.map((wp) => (
                      <motion.div
                        key={wp.phraseId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex justify-between items-start gap-4 p-3 rounded-lg bg-muted/50"
                      >
                        <span className="text-foreground/80 font-serif">{wp.phraseText}</span>
                        <Badge variant="outline" className="shrink-0">
                          {Math.round(wp.score * 100)}%
                        </Badge>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4">
                <Button onClick={handleTryAgain} className="flex-1 h-12 gap-2">
                  <RotateCcw className="size-4" />
                  Try Again
                </Button>
                <Button variant="outline" asChild className="flex-1 h-12">
                  <Link href="/practice">Back to Practice</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}
