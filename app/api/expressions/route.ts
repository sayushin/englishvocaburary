import { supabase } from "@/lib/supabaseClient";

function validateText(value: unknown, name: string) {
  if (typeof value !== "string" || !value.trim()) {
    return `${name} is required`;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { englishSentence, japaneseMeaning } = await req.json();
    const validationError =
      validateText(englishSentence, "English text") ??
      validateText(japaneseMeaning, "Japanese meaning");

    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("expressions")
      .insert({
        englishSentence: englishSentence.trim(),
        japaneseMeaning: japaneseMeaning.trim(),
      })
      .select("*")
      .single();

    if (error) {
      console.error(error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, englishSentence, japaneseMeaning } = await req.json();

    if (typeof id !== "string" || !id) {
      return Response.json({ error: "Expression ID is required" }, { status: 400 });
    }

    const validationError =
      validateText(englishSentence, "English text") ??
      validateText(japaneseMeaning, "Japanese meaning");

    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("expressions")
      .update({
        englishSentence: englishSentence.trim(),
        japaneseMeaning: japaneseMeaning.trim(),
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
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

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (typeof id !== "string" || !id) {
      return Response.json({ error: "Expression ID is required" }, { status: 400 });
    }

    const { error } = await supabase.from("expressions").delete().eq("id", id);

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
