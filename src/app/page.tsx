"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [translation, setTranslation] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTranslation(data?.translation?.toUpperCase() || null))
      .catch(() => setTranslation(null));
  }, []);

  const displayTranslation = translation || "CSB";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight">
          Memorize Romans 8 ({displayTranslation})
        </h1>

        <p className="text-lg text-foreground/70">
          Master scripture through active recall and spaced repetition
        </p>

        <div className="flex flex-col gap-4 pt-4">
          <Link
            href="/practice"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Start Practice
          </Link>

          <Link
            href="/run"
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Practice Verses
          </Link>

          <Link
            href="/progress"
            className="px-8 py-3 border border-foreground/20 hover:bg-foreground/5 font-medium rounded-lg transition-colors"
          >
            View Progress
          </Link>
        </div>
      </div>
    </main>
  );
}
