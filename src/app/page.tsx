"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, BookOpen, BarChart3, Brain, Calendar, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Practice",
    description: "Active recall with spaced repetition to build lasting memory",
    icon: Zap,
    href: "/practice",
    color: "text-amber-500",
  },
  {
    title: "Verses",
    description: "Choose specific verses or ranges to focus your practice",
    icon: BookOpen,
    href: "/run",
    color: "text-emerald-500",
  },
  {
    title: "Progress",
    description: "Track your streak, mastery level, and weak spots",
    icon: BarChart3,
    href: "/progress",
    color: "text-blue-500",
  },
];

const steps = [
  {
    icon: BookOpen,
    title: "Pick your verses",
    description: "Start with the full chapter or focus on specific sections",
  },
  {
    icon: Brain,
    title: "Practice daily",
    description: "Type from memory with progressive hints that fade as you learn",
  },
  {
    icon: Trophy,
    title: "Track progress",
    description: "Watch your mastery grow with streaks and milestone celebrations",
  },
];

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
    <div className="container-page py-12 md:py-20">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4">
          Memorize Romans 8
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-2">
          Master scripture through active recall and spaced repetition
        </p>
        <p className="text-sm text-muted-foreground/70">
          Currently studying: {displayTranslation}
        </p>
      </motion.div>

      {/* Feature Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid md:grid-cols-3 gap-6 mb-20"
      >
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
            >
              <Link href={feature.href}>
                <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer group">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 ${feature.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="max-w-3xl mx-auto"
      >
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-center mb-10">
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Step {i + 1}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="text-center mt-16"
      >
        <Button asChild size="lg" className="text-base px-8">
          <Link href="/practice">Start Practicing</Link>
        </Button>
      </motion.div>
    </div>
  );
}
