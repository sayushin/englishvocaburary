"use client";

import { useCallback, useEffect, useState } from "react";

type QuizWord = {
  word: string;
  meaning_ja: string;
  sample_sentence: string;
};

type QuizPhase = "loading" | "quiz" | "saving" | "done" | "error";

export default function FlashcardQuiz() {
  const [phase, setPhase] = useState<QuizPhase>("loading");
  const [words, setWords] = useState<QuizWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [memorized, setMemorized] = useState<string[]>([]);
  const [notMemorized, setNotMemorized] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({ memorized: 0, notMemorized: 0 });

  const loadQuiz = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setCurrentIndex(0);
    setFlipped(false);
    setMemorized([]);
    setNotMemorized([]);

    try {
      const res = await fetch("/api/quiz-words");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to load quiz");
        setPhase("error");
        return;
      }

      setWords(data.words);
      setPhase("quiz");
    } catch {
      setError("Network error. Please try again.");
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  async function saveResults(
    memorizedWords: string[],
    notMemorizedWords: string[]
  ) {
    setPhase("saving");

    try {
      const res = await fetch("/api/quiz-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memorized: memorizedWords,
          notMemorized: notMemorizedWords,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save quiz results");
        setPhase("error");
        return;
      }

      setSummary({
        memorized: data.memorized,
        notMemorized: data.notMemorized,
      });
      setPhase("done");
    } catch {
      setError("Network error. Please try again.");
      setPhase("error");
    }
  }

  function handleAnswer(memorizedAnswer: boolean) {
    const currentWord = words[currentIndex].word;
    const nextMemorized = memorizedAnswer
      ? [...memorized, currentWord]
      : memorized;
    const nextNotMemorized = memorizedAnswer
      ? notMemorized
      : [...notMemorized, currentWord];

    setMemorized(nextMemorized);
    setNotMemorized(nextNotMemorized);
    setFlipped(false);

    if (currentIndex + 1 >= words.length) {
      saveResults(nextMemorized, nextNotMemorized);
      return;
    }

    setCurrentIndex((i) => i + 1);
  }

  if (phase === "loading" || phase === "saving") {
    return (
      <p className="text-sm text-gray-500">
        {phase === "loading" ? "Loading quiz…" : "Saving results…"}
      </p>
    );
  }

  if (phase === "error") {
    return (
      <div>
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
        <button
          type="button"
          onClick={loadQuiz}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
        <h2 className="text-xl font-bold">Quiz complete!</h2>
        <p className="mt-2 text-sm text-gray-600">
          Memorized: {summary.memorized} · Not memorized: {summary.notMemorized}
        </p>
        <button
          type="button"
          onClick={loadQuiz}
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Start new quiz
        </button>
      </div>
    );
  }

  const current = words[currentIndex];

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">
        Card {currentIndex + 1} of {words.length}
      </p>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="mb-6 w-full rounded-xl border border-gray-200 bg-white p-8 text-left shadow-sm transition-shadow hover:shadow-md"
      >
        {!flipped ? (
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              English
            </p>
            <p className="mt-2 text-3xl font-bold capitalize">{current.word}</p>
            <p className="mt-4 text-xs text-gray-400">Tap to reveal answer</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Answer
            </p>
            <p className="mt-2 text-lg text-gray-800">{current.meaning_ja}</p>
            <p className="mt-3 text-sm italic text-gray-600">
              {current.sample_sentence}
            </p>
          </div>
        )}
      </button>

      {flipped && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleAnswer(true)}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Memorized
          </button>
          <button
            type="button"
            onClick={() => handleAnswer(false)}
            className="flex-1 rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Not memorized
          </button>
        </div>
      )}
    </div>
  );
}
