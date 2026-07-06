"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type VocabularyItem = {
  word: string;
  meaning_ja: string;
  sample_sentence: string;
};

type VocabularyListProps = {
  words: VocabularyItem[];
};

export default function VocabularyList({ words: initialWords }: VocabularyListProps) {
  const router = useRouter();
  const [words, setWords] = useState(initialWords);
  const [editingWord, setEditingWord] = useState<string | null>(null);
  const [form, setForm] = useState({ meaning_ja: "", sample_sentence: "" });
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWords(initialWords);
  }, [initialWords]);

  function startEdit(item: VocabularyItem) {
    setEditingWord(item.word);
    setForm({
      meaning_ja: item.meaning_ja,
      sample_sentence: item.sample_sentence,
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingWord(null);
    setError(null);
  }

  async function handleUpdate(word: string) {
    setLoading(`update-${word}`);
    setError(null);

    try {
      const res = await fetch("/api/update-word", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, ...form }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to update word");
        return;
      }

      setWords((prev) =>
        prev.map((item) => (item.word === word ? data : item))
      );
      setEditingWord(null);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(word: string) {
    if (!confirm(`Delete "${word}"?`)) return;

    setLoading(`delete-${word}`);
    setError(null);

    try {
      const res = await fetch("/api/delete-word", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to delete word");
        return;
      }

      setWords((prev) => prev.filter((item) => item.word !== word));
      if (editingWord === word) setEditingWord(null);
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
          const isEditing = editingWord === item.word;

          return (
            <li
              key={item.word}
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
                      onClick={() => handleUpdate(item.word)}
                      disabled={loading !== null}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading === `update-${item.word}` ? "Saving…" : "Save"}
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
                      onClick={() => handleDelete(item.word)}
                      disabled={loading !== null}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {loading === `delete-${item.word}` ? "Deleting…" : "Delete"}
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
