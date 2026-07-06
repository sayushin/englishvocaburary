import { supabase } from "@/lib/supabaseClient";

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("EnglishVocaburary")
      .select("word, meaning_ja, sample_sentence");

    if (error) {
      console.error(error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data?.length) {
      return Response.json({ error: "No words available for quiz" }, { status: 404 });
    }

    const words = shuffle(data).slice(0, Math.min(10, data.length));

    return Response.json({ words });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return Response.json({ error: message }, { status: 500 });
  }
}
