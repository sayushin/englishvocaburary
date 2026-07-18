"use client";

import { useState } from "react";
import type {
  ExpressionKind,
  ExpressionSuggestion,
  Provider,
} from "@/lib/types";

type EditableSuggestion = ExpressionSuggestion & {
  editing: boolean;
  saving: boolean;
  saved: boolean;
};

const KIND_LABELS: Record<ExpressionKind, string> = {
  short_expression: "Short expression",
  sentence: "Complete sentence",
  paragraph: "Short paragraph / speech",
};

export default function ExpressionGenerator() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState<Provider | null>(null);
  const [suggestions, setSuggestions] = useState<EditableSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function generate(provider: Provider) {
    if (!input.trim()) {
      setError("Please enter Japanese or English text");
      return;
    }

    setLoading(provider);
    setError(null);
    setSuggestions([]);

    try {
      const res = await fetch("/api/generate-expressions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim(), provider }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to generate expressions");
        return;
      }

      setSuggestions(
        data.suggestions.map((item: ExpressionSuggestion) => ({
          ...item,
          editing: false,
          saving: false,
          saved: false,
        }))
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  function updateSuggestion(
    index: number,
    field: "englishSentence" | "japaneseMeaning",
    value: string
  ) {
    setSuggestions((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value, saved: false }
          : item
      )
    );
  }

  async function saveSuggestion(index: number) {
    const suggestion = suggestions[index];
    if (!suggestion.englishSentence.trim() || !suggestion.japaneseMeaning.trim()) {
      setError("English text and Japanese meaning are required");
      return;
    }

    setError(null);
    setSuggestions((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, saving: true } : item
      )
    );

    try {
      const res = await fetch("/api/expressions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          englishSentence: suggestion.englishSentence,
          japaneseMeaning: suggestion.japaneseMeaning,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save expression");
        return;
      }

      setSuggestions((items) =>
        items.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, saving: false, saved: true, editing: false }
            : item
        )
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSuggestions((items) =>
        items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, saving: false } : item
        )
      );
    }
  }

  return (
    <section className="mt-10 border-t border-gray-200 pt-8">
      <h2 className="text-2xl font-bold">Expression Generator</h2>
      <p className="mb-5 mt-2 text-sm text-gray-500">
        Enter Japanese or English to create natural English expressions.
      </p>

      <label htmlFor="expression-input" className="mb-1 block text-sm font-medium">
        Text (English or Japanese)
      </label>
      <textarea
        id="expression-input"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={3}
        placeholder="e.g. 会議に少し遅れます"
        className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      <div className="mb-6 flex gap-3">
        <button
          type="button"
          onClick={() => generate("openai")}
          disabled={loading !== null}
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "openai" ? "Generating…" : "ChatGPT"}
        </button>
        <button
          type="button"
          onClick={() => generate("deepseek")}
          disabled={loading !== null}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "deepseek" ? "Generating…" : "DeepSeek"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <article
            key={suggestion.kind}
            className="rounded-xl border border-gray-200 bg-gray-50 p-5"
          >
            <h3 className="mb-3 text-sm font-semibold text-blue-600">
              {KIND_LABELS[suggestion.kind]}
            </h3>

            {suggestion.editing ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    English
                  </label>
                  <textarea
                    value={suggestion.englishSentence}
                    onChange={(event) =>
                      updateSuggestion(index, "englishSentence", event.target.value)
                    }
                    rows={suggestion.kind === "paragraph" ? 4 : 2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Japanese
                  </label>
                  <textarea
                    value={suggestion.japaneseMeaning}
                    onChange={(event) =>
                      updateSuggestion(index, "japaneseMeaning", event.target.value)
                    }
                    rows={suggestion.kind === "paragraph" ? 4 : 2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="whitespace-pre-wrap text-sm font-medium text-gray-900">
                  {suggestion.englishSentence}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                  {suggestion.japaneseMeaning}
                </p>
              </>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setSuggestions((items) =>
                    items.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, editing: !item.editing }
                        : item
                    )
                  )
                }
                disabled={suggestion.saving || suggestion.saved}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                {suggestion.editing ? "Done editing" : "Edit"}
              </button>
              <button
                type="button"
                onClick={() => saveSuggestion(index)}
                disabled={suggestion.saving || suggestion.saved}
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {suggestion.saved
                  ? "Saved ✓"
                  : suggestion.saving
                    ? "Saving…"
                    : "Save"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
