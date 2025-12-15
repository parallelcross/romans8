"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Trophy, Target, CheckCircle, Circle, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ProgressData {
  phrasesMastered: number;
  totalPhrases: number;
  versesMastered: number;
  totalVerses: number;
  reviewsDueToday: number;
  streak: number;
  milestones: {
    name: string;
    complete: boolean;
  }[];
  translation: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

function CircularProgress({ value, size = 120, strokeWidth = 10 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
          className="text-green-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{value}%</span>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState({ phrases: 0, verses: 0 });

  useEffect(() => {
    fetchProgress();
  }, []);

  useEffect(() => {
    if (progress) {
      const phrasePercent = Math.round((progress.phrasesMastered / progress.totalPhrases) * 100);
      const versePercent = Math.round((progress.versesMastered / progress.totalVerses) * 100);
      const timer = setTimeout(() => {
        setAnimatedProgress({ phrases: phrasePercent, verses: versePercent });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  const fetchProgress = async () => {
    try {
      const res = await fetch("/api/progress");
      const data = await res.json();
      setProgress(data);
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslationChange = async (newTranslation: string) => {
    if (!progress || newTranslation === progress.translation) return;
    setIsSwitching(true);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translation: newTranslation }),
      });
      await fetchProgress();
    } catch (error) {
      console.error("Failed to update translation:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading progress...</p>
      </main>
    );
  }

  if (!progress) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Failed to load progress</p>
      </main>
    );
  }

  const overallMastery = Math.round(
    ((progress.phrasesMastered / progress.totalPhrases) * 0.5 +
      (progress.versesMastered / progress.totalVerses) * 0.5) * 100
  );

  return (
    <main className="min-h-screen p-6 md:p-8">
      <motion.div
        className="max-w-2xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Your Progress</h1>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Bible Translation</span>
                {isSwitching && (
                  <Badge variant="secondary">Switching...</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleTranslationChange("csb")}
                  disabled={isSwitching}
                  variant={progress.translation === "csb" ? "default" : "outline"}
                  className="flex-1"
                >
                  CSB
                </Button>
                <Button
                  onClick={() => handleTranslationChange("esv")}
                  disabled={isSwitching}
                  variant={progress.translation === "esv" ? "default" : "outline"}
                  className="flex-1"
                >
                  ESV
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6 text-center">
              <Flame className="size-8 mx-auto text-orange-500 mb-2" />
              <div className="text-3xl font-bold">{progress.streak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6 text-center">
              <Target className="size-8 mx-auto text-green-500 mb-2" />
              <div className="text-3xl font-bold">
                {progress.phrasesMastered}
                <span className="text-lg text-muted-foreground">/{progress.totalPhrases}</span>
              </div>
              <div className="text-sm text-muted-foreground">Phrases</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6 text-center">
              <Trophy className="size-8 mx-auto text-amber-500 mb-2" />
              <div className="text-3xl font-bold">
                {progress.versesMastered}
                <span className="text-lg text-muted-foreground">/39</span>
              </div>
              <div className="text-sm text-muted-foreground">Verses</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Overall Mastery</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-6">
              <CircularProgress value={overallMastery} />
              <div className="flex-1 space-y-4 w-full">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Phrases Mastered</span>
                    <span className="text-muted-foreground">
                      {progress.phrasesMastered}/{progress.totalPhrases}
                    </span>
                  </div>
                  <Progress value={animatedProgress.phrases} className="h-3 bg-green-500/20 [&>[data-slot=progress-indicator]]:bg-green-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Verses Mastered</span>
                    <span className="text-muted-foreground">
                      {progress.versesMastered}/{progress.totalVerses}
                    </span>
                  </div>
                  <Progress value={animatedProgress.verses} className="h-3 bg-blue-500/20 [&>[data-slot=progress-indicator]]:bg-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {progress.milestones.map((milestone, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    {milestone.complete ? (
                      <CheckCircle className="size-5 text-green-500" />
                    ) : (
                      <Circle className="size-5 text-muted-foreground/50" />
                    )}
                    <span className={milestone.complete ? "text-foreground" : "text-muted-foreground"}>
                      {milestone.name}
                    </span>
                    {milestone.complete && (
                      <Badge variant="secondary" className="ml-auto text-green-600 bg-green-500/10">
                        Complete
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button asChild className="w-full" size="lg">
            <Link href="/practice">Continue Practice</Link>
          </Button>
        </motion.div>

      </motion.div>
    </main>
  );
}
