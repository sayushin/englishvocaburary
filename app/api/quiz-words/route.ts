import { resolveAskLanguage, type AskLanguage } from "@/lib/detectLanguage";
import { supabase } from "@/lib/supabaseClient";

type RawQuizWord = {
  word: string;
  meaning_ja: string;
  meaning_en: string | null;
  sample_sentence: string;
  askJAorEN: string | null;
};

export type QuizWord = {
  word: string;
  meaning_ja: string;
  meaning_en: string;
  sample_sentence: string;
  askJAorEN: AskLanguage;
  /** Text shown on the front of the card */
  question: string;
  /** Text shown on the back of the card (expected answer) */
  answer: string;
  questionLabel: string;
  answerLabel: string;
};

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function toQuizWord(row: RawQuizWord): QuizWord {
  // Null/invalid askJAorEN: detect from stored English word (defaults to EN for legacy rows)
  const askJAorEN = resolveAskLanguage(row.askJAorEN, row.word);

  if (askJAorEN === "JA") {
    return {
      word: row.word,
      meaning_ja: row.meaning_ja,
      meaning_en: row.meaning_en ?? "",
      sample_sentence: row.sample_sentence,
      askJAorEN,
      question: row.meaning_ja,
      answer: row.word,
      questionLabel: "Japanese",
      answerLabel: "English",
    };
  }

  return {
    word: row.word,
    meaning_ja: row.meaning_ja,
    meaning_en: row.meaning_en ?? "",
    sample_sentence: row.sample_sentence,
    askJAorEN,
    question: row.word,
    answer: row.meaning_ja,
    questionLabel: "English",
    answerLabel: "Japanese",
  };
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("EnglishVocaburary")
      .select("word, meaning_ja, meaning_en, sample_sentence, askJAorEN");

    if (error) {
      console.error(error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data?.length) {
      return Response.json(
        { error: "No words available for quiz" },
        { status: 404 }
      );
    }

    const rows = data as RawQuizWord[];
    const words = shuffle(rows)
      .slice(0, Math.min(10, rows.length))
      .map(toQuizWord);

    // Optionally backfill missing askJAorEN (best-effort; does not block quiz)
    for (const row of rows) {
      if (row.askJAorEN === "JA" || row.askJAorEN === "EN") continue;
      const resolved = resolveAskLanguage(null, row.word);
      void supabase
        .from("EnglishVocaburary")
        .update({ askJAorEN: resolved })
        .eq("word", row.word)
        .is("askJAorEN", null);
    }

    return Response.json({ words });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return Response.json({ error: message }, { status: 500 });
  }
}
