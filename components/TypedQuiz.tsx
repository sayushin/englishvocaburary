"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuizMode, TypedQuizItem } from "@/lib/types";

type Props = {
  mode: Exclude<QuizMode, "vocabulary">;
  onBack: () => void;
};

function normalizeAnswer(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, "");
}

export default function TypedQuiz({ mode, onBack }: Props) {
  const [items, setItems] = useState<TypedQuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [memorized, setMemorized] = useState<string[]>([]);
  const [notMemorized, setNotMemorized] = useState<string[]>([]);
  const [phase, setPhase] = useState<"loading" | "quiz" | "saving" | "done" | "error">(
    "loading"
  );
  const [error, setError] = useState<string | null>(null);

  const loadQuiz = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setIndex(0);
    setAnswer("");
    setChecked(null);
    setCorrectCount(0);
    setMemorized([]);
    setNotMemorized([]);

    try {
      const res = await fetch(`/api/quiz-content?mode=${mode}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to load quiz");
        setPhase("error");
        return;
      }

      setItems(data.items);
      setPhase("quiz");
    } catch {
      setError("Network error. Please try again.");
      setPhase("error");
    }
  }, [mode]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadQuiz();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadQuiz]);

  function checkAnswer() {
    if (!answer.trim()) return;

    const isCorrect =
      normalizeAnswer(answer) === normalizeAnswer(items[index].answer);
    setChecked(isCorrect);
    if (isCorrect) setCorrectCount((count) => count + 1);

    const vocabularyWord = items[index].vocabularyWord;
    if (vocabularyWord) {
      if (isCorrect) setMemorized((words) => [...words, vocabularyWord]);
      else setNotMemorized((words) => [...words, vocabularyWord]);
    }
  }

  async function finishQuiz() {
    setPhase("saving");

    if (mode === "mixed" && (memorized.length > 0 || notMemorized.length > 0)) {
      try {
        const res = await fetch("/api/quiz-results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memorized, notMemorized }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Failed to save vocabulary results");
          setPhase("error");
          return;
        }
      } catch {
        setError("Network error while saving results.");
        setPhase("error");
        return;
      }
    }

    setPhase("done");
  }

  function nextQuestion() {
    if (index + 1 >= items.length) {
      void finishQuiz();
      return;
    }

    setIndex((current) => current + 1);
    setAnswer("");
    setChecked(null);
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadQuiz}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
          >
            Change quiz
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
        <h2 className="text-xl font-bold">Quiz complete!</h2>
        <p className="mt-2 text-sm text-gray-600">
          Correct: {correctCount} of {items.length}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={loadQuiz}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Start again
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
          >
            Change quiz
          </button>
        </div>
      </div>
    );
  }

  const current = items[index];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
        <span>
          Question {index + 1} of {items.length}
        </span>
        <span className="capitalize">{current.source}</span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {current.questionLabel}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-xl font-bold">
          {current.question}
        </p>

        <label htmlFor="quiz-answer" className="mb-1 mt-6 block text-sm font-medium">
          Your answer ({current.answerLabel})
        </label>
        <textarea
          id="quiz-answer"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={checked !== null}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50"
        />

        {checked === null ? (
          <button
            type="button"
            onClick={checkAnswer}
            disabled={!answer.trim()}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Check answer
          </button>
        ) : (
          <div className="mt-4">
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                checked
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-orange-50 text-orange-700"
              }`}
            >
              <p className="font-semibold">
                {checked ? "Correct!" : "Not quite"}
              </p>
              <p className="mt-1 whitespace-pre-wrap">
                Answer: {current.answer}
              </p>
            </div>
            <button
              type="button"
              onClick={nextQuestion}
              className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              {index + 1 >= items.length ? "Finish quiz" : "Next question"}
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-4 text-sm font-semibold text-gray-500 hover:text-gray-700"
      >
        ← Change quiz type
      </button>
    </div>
  );
}
