import { supabase } from "@/lib/supabaseClient";

export async function DELETE(req: Request) {
  try {
    const { word } = await req.json();

    if (!word?.trim()) {
      return Response.json({ error: "Word is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("EnglishVocaburary")
      .delete()
      .eq("word", word.trim().toLowerCase());

    if (error) {
      console.error(error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return Response.json({ error: message }, { status: 500 });
  }
}
