import { supabase } from "@/lib/supabaseClient";

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (id === undefined || id === null) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("EnglishVocaburary")
      .delete()
      .eq("id", id);

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
