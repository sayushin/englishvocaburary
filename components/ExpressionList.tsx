"use client";

import { useState } from "react";
import type { SavedExpression } from "@/lib/types";

type Props = {
  expressions: SavedExpression[];
};

export default function ExpressionList({ expressions: initialExpressions }: Props) {
  const [expressions, setExpressions] = useState(initialExpressions);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    englishSentence: "",
    japaneseMeaning: "",
  });
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startEdit(item: SavedExpression) {
    setEditingId(item.id);
    setForm({
      englishSentence: item.englishSentence,
      japaneseMeaning: item.japaneseMeaning,
    });
    setError(null);
  }

  async function updateExpression(id: string) {
    if (!form.englishSentence.trim() || !form.japaneseMeaning.trim()) {
      setError("English text and Japanese meaning are required");
      return;
    }

    setLoadingId(id);
    setError(null);

    try {
      const res = await fetch("/api/expressions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...form }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to update expression");
        return;
      }

      setExpressions((items) =>
        items.map((item) => (item.id === id ? data : item))
      );
      setEditingId(null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteExpression(item: SavedExpression) {
    if (!confirm(`Delete "${item.englishSentence}"?`)) return;

    setLoadingId(item.id);
    setError(null);

    try {
      const res = await fetch("/api/expressions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to delete expression");
        return;
      }

      setExpressions((items) => items.filter(({ id }) => id !== item.id));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  if (expressions.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No expressions saved yet. Generate some on the Add page.
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
        {expressions.map((item) => {
          const isEditing = editingId === item.id;
          const isRevealed = revealedIds.has(item.id);

          return (
            <li
              key={item.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      English
                    </label>
                    <textarea
                      value={form.englishSentence}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          englishSentence: event.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Japanese
                    </label>
                    <textarea
                      value={form.japaneseMeaning}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          japaneseMeaning: event.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateExpression(item.id)}
                      disabled={loadingId !== null}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loadingId === item.id ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      disabled={loadingId !== null}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-sm font-medium text-gray-900">
                    {item.englishSentence}
                  </p>
                  {isRevealed ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                      {item.japaneseMeaning}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-400">
                      Japanese is hidden
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedIds((current) => {
                          const next = new Set(current);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          return next;
                        })
                      }
                      className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      {isRevealed ? "Hide Japanese" : "Reveal Japanese"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      disabled={loadingId !== null}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteExpression(item)}
                      disabled={loadingId !== null}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {loadingId === item.id ? "Deleting…" : "Delete"}
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
