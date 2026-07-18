import { resolveAskLanguage } from "@/lib/detectLanguage";
import { supabase } from "@/lib/supabaseClient";
import type { QuizMode, TypedQuizItem } from "@/lib/types";

type VocabularyRow = {
  id: number;
  word: string;
  meaning_ja: string;
  askJAorEN: string | null;
};

type ExpressionRow = {
  id: string;
  englishSentence: string;
  japaneseMeaning: string;
};

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function vocabularyItem(row: VocabularyRow): TypedQuizItem {
  const language = resolveAskLanguage(row.askJAorEN, row.word);
  const japaneseFirst = language === "JA";

  return {
    id: `vocabulary-${row.id}`,
    source: "vocabulary",
    sourceId: row.id,
    question: japaneseFirst ? row.meaning_ja : row.word,
    answer: japaneseFirst ? row.word : row.meaning_ja,
    questionLabel: japaneseFirst ? "Japanese" : "English",
    answerLabel: japaneseFirst ? "English" : "Japanese",
    vocabularyWord: row.word,
  };
}

function expressionItem(row: ExpressionRow): TypedQuizItem {
  const japaneseFirst = Math.random() < 0.5;

  return {
    id: `expression-${row.id}`,
    source: "expression",
    sourceId: row.id,
    question: japaneseFirst ? row.japaneseMeaning : row.englishSentence,
    answer: japaneseFirst ? row.englishSentence : row.japaneseMeaning,
    questionLabel: japaneseFirst ? "Japanese" : "English",
    answerLabel: japaneseFirst ? "English" : "Japanese",
  };
}

export async function GET(req: Request) {
  try {
    const mode = new URL(req.url).searchParams.get("mode") as QuizMode | null;

    if (mode !== "expression" && mode !== "mixed") {
      return Response.json({ error: "Invalid quiz mode" }, { status: 400 });
    }

    const [vocabularyResult, expressionResult] = await Promise.all([
      mode === "mixed"
        ? supabase
            .from("EnglishVocaburary")
            .select("id, word, meaning_ja, askJAorEN")
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("expressions")
        .select("id, englishSentence, japaneseMeaning"),
    ]);

    const error = vocabularyResult.error ?? expressionResult.error;
    if (error) {
      console.error(error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    const vocabulary = (vocabularyResult.data ?? []) as VocabularyRow[];
    const expressions = (expressionResult.data ?? []) as ExpressionRow[];
    const vocabularyItems = shuffle(vocabulary.map(vocabularyItem));
    const expressionItems = shuffle(expressions.map(expressionItem));
    let items: TypedQuizItem[];

    if (
      mode === "mixed" &&
      vocabularyItems.length > 0 &&
      expressionItems.length > 0
    ) {
      const balanced = [
        ...vocabularyItems.slice(0, 5),
        ...expressionItems.slice(0, 5),
      ];
      const selectedIds = new Set(balanced.map(({ id }) => id));
      const remaining = [...vocabularyItems, ...expressionItems].filter(
        ({ id }) => !selectedIds.has(id)
      );
      items = [...balanced, ...shuffle(remaining).slice(0, 10 - balanced.length)];
    } else {
      items = [...vocabularyItems, ...expressionItems];
    }

    if (items.length === 0) {
      return Response.json(
        { error: `No content is available for the ${mode} quiz` },
        { status: 404 }
      );
    }

    return Response.json({ items: shuffle(items).slice(0, 10) });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return Response.json({ error: message }, { status: 500 });
  }
}
