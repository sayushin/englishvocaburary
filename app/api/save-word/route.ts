import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { word, meaning_ja, meaning_en, sample_sentence, sample_sentence_ja, pronunciation, part_of_speech, difficulty, provider } = body;

    if (!word?.trim()) {
      return Response.json({ error: "Word is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("EnglishVocaburary")
      .insert({
        word: word.trim().toLowerCase(),
        meaning_ja: meaning_ja ?? "",
        meaning_en: meaning_en ?? "",
        sample_sentence: sample_sentence ?? "",
        sample_sentence_ja: sample_sentence_ja ?? "",
        pronunciation: pronunciation ?? "",
        part_of_speech: part_of_speech ?? "",
        difficulty: difficulty ?? "",
        provider: provider ?? "",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return Response.json(
          { error: `"${word.trim()}" is already saved` },
          { status: 409 }
        );
      }
      console.error(error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return Response.json({ error: message }, { status: 500 });
  }
}
