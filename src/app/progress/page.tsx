"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function ProgressPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

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
        <p className="text-foreground/50">Loading progress...</p>
      </main>
    );
  }

  if (!progress) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/50">Failed to load progress</p>
      </main>
    );
  }

  const phrasePercent = Math.round((progress.phrasesMastered / progress.totalPhrases) * 100);
  const versePercent = Math.round((progress.versesMastered / progress.totalVerses) * 100);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Your Progress</h1>
          <Link href="/" className="text-foreground/50 hover:text-foreground transition-colors">
            ← Back
          </Link>
        </div>

        <div className="bg-foreground/5 rounded-xl p-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">Bible Translation</span>
            <span className="text-foreground/50">{progress.translation.toUpperCase()}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleTranslationChange("csb")}
              disabled={isSwitching}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                progress.translation === "csb"
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
                progress.translation === "esv"
                  ? "bg-blue-600 text-white"
                  : "border border-foreground/20 hover:bg-foreground/5"
              }`}
            >
              ESV
            </button>
          </div>
          {isSwitching && (
            <p className="text-sm text-foreground/50 text-center">Switching translation...</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-foreground/5 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-blue-600">{progress.streak}</div>
            <div className="text-sm text-foreground/50 mt-1">Day Streak</div>
          </div>
          <div className="bg-foreground/5 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-orange-600">{progress.reviewsDueToday}</div>
            <div className="text-sm text-foreground/50 mt-1">Due Today</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-foreground/5 rounded-xl p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Phrases Mastered</span>
              <span className="text-foreground/50">
                {progress.phrasesMastered} / {progress.totalPhrases}
              </span>
            </div>
            <div className="h-3 bg-foreground/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all duration-500"
                style={{ width: `${phrasePercent}%` }}
              />
            </div>
            <div className="text-right text-sm text-foreground/50">{phrasePercent}%</div>
          </div>

          <div className="bg-foreground/5 rounded-xl p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Verses Mastered</span>
              <span className="text-foreground/50">
                {progress.versesMastered} / {progress.totalVerses}
              </span>
            </div>
            <div className="h-3 bg-foreground/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${versePercent}%` }}
              />
            </div>
            <div className="text-right text-sm text-foreground/50">{versePercent}%</div>
          </div>
        </div>

        <div className="bg-foreground/5 rounded-xl p-6 space-y-4">
          <h2 className="font-medium">Milestones</h2>
          <div className="space-y-3">
            {progress.milestones.map((milestone, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                    milestone.complete
                      ? "bg-green-600 text-white"
                      : "bg-foreground/10 text-foreground/30"
                  }`}
                >
                  {milestone.complete ? "✓" : "○"}
                </div>
                <span className={milestone.complete ? "" : "text-foreground/50"}>
                  {milestone.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/practice"
          className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-center"
        >
          Continue Practice
        </Link>

        <button
          onClick={handleLogout}
          className="block w-full py-3 border border-foreground/20 hover:bg-foreground/5 text-foreground/70 font-medium rounded-lg transition-colors text-center"
        >
          Forget Me
        </button>
      </div>
    </main>
  );
}
