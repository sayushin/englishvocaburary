"use client";

import { useState } from "react";
import FlashcardQuiz from "@/components/FlashcardQuiz";
import TypedQuiz from "@/components/TypedQuiz";
import type { QuizMode } from "@/lib/types";

const OPTIONS: {
  mode: QuizMode;
  title: string;
  description: string;
}[] = [
  {
    mode: "vocabulary",
    title: "Vocabulary Quiz",
    description: "Use your saved words and existing memorized scoring.",
  },
  {
    mode: "expression",
    title: "Expression Quiz",
    description: "Type English or Japanese answers for saved expressions.",
  },
  {
    mode: "mixed",
    title: "Mixed Quiz",
    description: "Practice vocabulary and expressions together.",
  },
];

export default function QuizSelector() {
  const [mode, setMode] = useState<QuizMode | null>(null);

  if (mode === "vocabulary") {
    return (
      <>
        <FlashcardQuiz />
        <button
          type="button"
          onClick={() => setMode(null)}
          className="mt-4 text-sm font-semibold text-gray-500 hover:text-gray-700"
        >
          ← Change quiz type
        </button>
      </>
    );
  }

  if (mode === "expression" || mode === "mixed") {
    return <TypedQuiz mode={mode} onBack={() => setMode(null)} />;
  }

  return (
    <div className="space-y-3">
      {OPTIONS.map((option) => (
        <button
          key={option.mode}
          type="button"
          onClick={() => setMode(option.mode)}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 p-5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
        >
          <span className="block font-bold text-gray-900">{option.title}</span>
          <span className="mt-1 block text-sm text-gray-500">
            {option.description}
          </span>
        </button>
      ))}
    </div>
  );
}
