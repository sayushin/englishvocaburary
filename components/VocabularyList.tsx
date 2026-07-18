"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resolveAskLanguage, type AskLanguage } from "@/lib/detectLanguage";

export type VocabularyItem = {
  id: number;
  word: string;
  meaning_ja: string;
  sample_sentence: string;
  memorized: number;
  notMemorized: number;
  askJAorEN: string | null;
};

type VocabularyListProps = {
  words: VocabularyItem[];
};

export default function VocabularyList({
  words: initialWords,
}: VocabularyListProps) {
  const router = useRouter();
  const [words, setWords] = useState(initialWords);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ meaning_ja: "", sample_sentence: "" });
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWords(initialWords);
  }, [initialWords]);

  function startEdit(item: VocabularyItem) {
    setEditingId(item.id);
    setForm({
      meaning_ja: item.meaning_ja,
      sample_sentence: item.sample_sentence,
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function handleUpdate(id: number) {
    setLoading(`update-${id}`);
    setError(null);

    try {
      const res = await fetch("/api/update-word", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...form }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to update word");
        return;
      }

      setWords((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data } : item))
      );
      setEditingId(null);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleToggleAskLanguage(item: VocabularyItem) {
    const current = resolveAskLanguage(item.askJAorEN, item.word);
    const next: AskLanguage = current === "JA" ? "EN" : "JA";

    setLoading(`ask-${item.id}`);
    setError(null);

    // Optimistic UI update
    setWords((prev) =>
      prev.map((w) => (w.id === item.id ? { ...w, askJAorEN: next } : w))
    );

    try {
      const res = await fetch("/api/update-word", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, askJAorEN: next }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Revert on failure
        setWords((prev) =>
          prev.map((w) =>
            w.id === item.id ? { ...w, askJAorEN: item.askJAorEN } : w
          )
        );
        setError(data.error ?? "Failed to update quiz language");
        return;
      }

      setWords((prev) =>
        prev.map((w) => (w.id === item.id ? { ...w, ...data } : w))
      );
      router.refresh();
    } catch {
      setWords((prev) =>
        prev.map((w) =>
          w.id === item.id ? { ...w, askJAorEN: item.askJAorEN } : w
        )
      );
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(id: number, word: string) {
    if (!confirm(`Delete "${word}"?`)) return;

    setLoading(`delete-${id}`);
    setError(null);

    try {
      const res = await fetch("/api/delete-word", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to delete word");
        return;
      }

      setWords((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) setEditingId(null);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  if (words.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No words saved yet. Add some on the Add page.
      </p>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ul className="space-y-3">
        {words.map((item) => {
          const isEditing = editingId === item.id;
          const askLang = resolveAskLanguage(item.askJAorEN, item.word);

          return (
            <li
              key={item.id}
              className="flex gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              {isEditing ? (
                <>
                  <h2 className="w-24 shrink-0 text-lg font-bold capitalize">
                    {item.word}
                  </h2>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Japanese meaning
                      </label>
                      <input
                        type="text"
                        value={form.meaning_ja}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, meaning_ja: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Sample sentence
                      </label>
                      <textarea
                        value={form.sample_sentence}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            sample_sentence: e.target.value,
                          }))
                        }
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate(item.id)}
                      disabled={loading !== null}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading === `update-${item.id}` ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={loading !== null}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="w-24 shrink-0 text-lg font-bold capitalize">
                    {item.word}
                  </h2>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700">{item.meaning_ja}</p>
                    <p className="mt-1 text-sm italic text-gray-600">
                      {item.sample_sentence}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      <span className="text-emerald-600">
                        Memorized: {item.memorized ?? 0}
                      </span>
                      {" · "}
                      <span className="text-orange-500">
                        Not memorized: {item.notMemorized ?? 0}
                      </span>
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">
                        Quiz:
                      </span>
                      <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (askLang !== "EN") handleToggleAskLanguage(item);
                          }}
                          disabled={loading !== null}
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                            askLang === "EN"
                              ? "bg-blue-600 text-white"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          EN
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (askLang !== "JA") handleToggleAskLanguage(item);
                          }}
                          disabled={loading !== null}
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                            askLang === "JA"
                              ? "bg-blue-600 text-white"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          JA
                        </button>
                      </div>
                      <span className="text-xs text-gray-400">
                        {loading === `ask-${item.id}`
                          ? "Saving…"
                          : askLang === "JA"
                            ? "JA → EN"
                            : "EN → JA"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      disabled={loading !== null}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.word)}
                      disabled={loading !== null}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {loading === `delete-${item.id}` ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
