import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

async function getStats() {
  const { count: inputted, error: totalError } = await supabase
    .from("EnglishVocaburary")
    .select("*", { count: "exact", head: true });

  const { count: mastered, error: masteredError } = await supabase
    .from("EnglishVocaburary")
    .select("*", { count: "exact", head: true })
    .gt("memorized", 3);

  if (totalError || masteredError) {
    return {
      error: totalError?.message ?? masteredError?.message ?? "Failed to load stats",
      inputted: 0,
      mastered: 0,
      needReview: 0,
    };
  }

  const inputtedCount = inputted ?? 0;
  const masteredCount = mastered ?? 0;

  return {
    error: null,
    inputted: inputtedCount,
    mastered: masteredCount,
    needReview: inputtedCount - masteredCount,
  };
}

export default async function HomePage() {
  const stats = await getStats();

  const items = [
    { label: "Inputted words", value: stats.inputted, color: "text-blue-600" },
    { label: "Mastered words", value: stats.mastered, color: "text-emerald-600" },
    { label: "Need review", value: stats.needReview, color: "text-orange-500" },
  ];

  return (
    <main className="mx-auto max-w-lg px-4 pb-24 pt-8">
      <h1 className="mb-2 text-2xl font-bold">Home</h1>
      <p className="mb-6 text-sm text-gray-500">
        Your vocabulary learning progress
      </p>

      {stats.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {stats.error}
        </div>
      )}

      <div className="grid gap-4">
        {items.map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-200 bg-gray-50 p-5"
          >
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className={`mt-1 text-4xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Mastered = memorized more than 3 times in quiz
      </p>
    </main>
  );
}
