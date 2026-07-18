"use client";

import { useState } from "react";
import ExpressionList from "@/components/ExpressionList";
import VocabularyList, {
  type VocabularyItem,
} from "@/components/VocabularyList";
import type { SavedExpression } from "@/lib/types";

type Filter = "all" | "vocabulary" | "expressions";

type Props = {
  words: VocabularyItem[];
  expressions: SavedExpression[];
};

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "expressions", label: "Expressions" },
];

export default function ReviewTabs({ words, expressions }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <>
      <div className="mb-6 flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
              filter === value
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(filter === "all" || filter === "vocabulary") && (
        <section>
          {filter === "all" && (
            <h2 className="mb-3 text-lg font-bold">Vocabulary</h2>
          )}
          <VocabularyList words={words} />
        </section>
      )}

      {(filter === "all" || filter === "expressions") && (
        <section className={filter === "all" ? "mt-8" : ""}>
          {filter === "all" && (
            <h2 className="mb-3 text-lg font-bold">Expressions</h2>
          )}
          <ExpressionList expressions={expressions} />
        </section>
      )}
    </>
  );
}
