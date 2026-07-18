"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { detectAskLanguage, type AskLanguage } from "@/lib/detectLanguage";
import ExpressionGenerator from "@/components/ExpressionGenerator";

type Provider = "openai" | "deepseek";

type WordResult = {
  word: string;
  provider: Provider;
  meaning_ja: string;
  meaning_en: string;
  sample_sentence: string;
  sample_sentence_ja: string;
  pronunciation: string;
  part_of_speech: string;
  difficulty: string;
  askJAorEN: AskLanguage;
};

export default function AddPage() {
  const router = useRouter();
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState<Provider | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WordResult | null>(null);

  async function handleGenerate(provider: Provider) {
    if (!word.trim()) {
      setError("Please enter a word");
      return;
    }

    setLoading(provider);
    setError(null);
    setResult(null);
    setSaved(false);

    try {
      const res = await fetch("/api/generate-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.trim(), provider }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to generate word details");
        return;
      }

      const askJAorEN = detectAskLanguage(word.trim());
      setResult({ ...data, askJAorEN });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleSave() {
    if (!result) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/save-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save word");
        return;
      }

      setWord("");
      setResult(null);
      setSaved(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 pb-24 pt-8">
      <h1 className="mb-2 text-2xl font-bold">Add Vocabulary</h1>
      <p className="mb-6 text-sm text-gray-500">
        Enter an English or Japanese word and choose an AI to generate the details.
      </p>

      <label htmlFor="word" className="mb-1 block text-sm font-medium">
        Word (English or Japanese)
      </label>
      <input
        id="word"
        type="text"
        value={word}
        onChange={(e) => setWord(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !loading) handleGenerate("openai");
        }}
        placeholder="e.g. ephemeral or りんご"
        className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      <div className="mb-6 flex gap-3">
        <button
          type="button"
          onClick={() => handleGenerate("openai")}
          disabled={loading !== null}
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "openai" ? "Generating…" : "ChatGPT"}
        </button>
        <button
          type="button"
          onClick={() => handleGenerate("deepseek")}
          disabled={loading !== null}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "deepseek" ? "Generating…" : "DeepSeek"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold capitalize">{result.word}</h2>
            <span className="shrink-0 rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {result.provider === "openai" ? "ChatGPT" : "DeepSeek"}
            </span>
          </div>

          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-medium text-gray-500">Pronunciation</dt>
              <dd className="mt-0.5 font-mono">{result.pronunciation}</dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Part of speech</dt>
              <dd className="mt-0.5 capitalize">{result.part_of_speech}</dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Difficulty</dt>
              <dd className="mt-0.5 capitalize">{result.difficulty}</dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Meaning (English)</dt>
              <dd className="mt-0.5">{result.meaning_en}</dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Meaning (Japanese)</dt>
              <dd className="mt-0.5">{result.meaning_ja}</dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Sample sentence</dt>
              <dd className="mt-0.5 italic">{result.sample_sentence}</dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">
                Sample sentence (Japanese)
              </dt>
              <dd className="mt-0.5">{result.sample_sentence_ja}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saved}
            className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saved ? "Saved ✓" : saving ? "Saving…" : "Save to database"}
          </button>
        </section>
      )}

      <ExpressionGenerator />
    </main>
  );
}
