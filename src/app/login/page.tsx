"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [translation, setTranslation] = useState<"csb" | "esv">("csb");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.userId) {
          router.push("/practice");
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null, translation }),
      });
      const data = await res.json();
      if (data.userId) {
        router.push("/practice");
      }
    } catch (error) {
      console.error("Login error:", error);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md px-4"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display">Welcome to Romans 8</CardTitle>
            <CardDescription>
              Start your journey to memorize one of the most powerful chapters in the Bible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Your name (optional)
                </label>
                <Input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bible Translation</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={translation === "csb" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setTranslation("csb")}
                  >
                    CSB
                  </Button>
                  <Button
                    type="button"
                    variant={translation === "esv" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setTranslation("esv")}
                  >
                    ESV
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {translation === "csb"
                    ? "Christian Standard Bible – clear and readable"
                    : "English Standard Version – word-for-word accuracy"}
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Start Memorizing"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
