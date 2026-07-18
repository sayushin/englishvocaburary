import { supabase } from "@/lib/supabaseClient";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, meaning_ja, sample_sentence, askJAorEN } = body;

    if (id === undefined || id === null) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    const updates: Record<string, string> = {};

    if (meaning_ja !== undefined) {
      updates.meaning_ja = meaning_ja ?? "";
    }
    if (sample_sentence !== undefined) {
      updates.sample_sentence = sample_sentence ?? "";
    }
    if (askJAorEN !== undefined) {
      if (askJAorEN !== "JA" && askJAorEN !== "EN") {
        return Response.json(
          { error: 'askJAorEN must be "JA" or "EN"' },
          { status: 400 }
        );
      }
      updates.askJAorEN = askJAorEN;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("EnglishVocaburary")
      .update(updates)
      .eq("id", id)
      .select(
        "id, word, meaning_ja, sample_sentence, memorized, notMemorized, askJAorEN"
      )
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
