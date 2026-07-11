import { supabase } from "@/lib/supabaseClient";

export async function PATCH(req: Request) {
  try {
    const { word, meaning_ja, sample_sentence } = await req.json();

    if (!word?.trim()) {
      return Response.json({ error: "Word is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("EnglishVocaburary")
      .update({
        meaning_ja: meaning_ja ?? "",
        sample_sentence: sample_sentence ?? "",
      })
      .eq("word", word.trim().toLowerCase())
      .select("word, meaning_ja, sample_sentence, memorized, notMemorized")
      .single();

    if (error) {
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
