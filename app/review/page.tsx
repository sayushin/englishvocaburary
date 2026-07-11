import VocabularyList from "@/components/VocabularyList";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

type VocabularyItem = {
  word: string;
  meaning_ja: string;
  sample_sentence: string;
  memorized: number;
  notMemorized: number;
};

export default async function ReviewPage() {
  const { data, error } = await supabase
    .from("EnglishVocaburary")
    .select("word, meaning_ja, sample_sentence, memorized, notMemorized")
    .order("word", { ascending: true });

  const words = (data ?? []) as VocabularyItem[];

  return (
    <main className="mx-auto max-w-lg px-4 pb-24 pt-8">
      <h1 className="mb-2 text-2xl font-bold">Review</h1>
      <p className="mb-6 text-sm text-gray-500">
        {words.length} word{words.length !== 1 ? "s" : ""} saved
      </p>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {!error && <VocabularyList words={words} />}
    </main>
  );
}
