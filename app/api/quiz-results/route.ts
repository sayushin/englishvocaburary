import { supabase } from "@/lib/supabaseClient";

type QuizResult = {
  memorized: string[];
  notMemorized: string[];
};

async function incrementField(word: string, field: "memorized" | "notMemorized") {
  const { data: current, error: fetchError } = await supabase
    .from("EnglishVocaburary")
    .select("memorized, notMemorized")
    .eq("word", word.trim().toLowerCase())
    .single();

  if (fetchError) {
    throw fetchError;
  }

  const currentValue = current?.[field] ?? 0;

  const { error: updateError } = await supabase
    .from("EnglishVocaburary")
    .update({ [field]: currentValue + 1 })
    .eq("word", word.trim().toLowerCase());

  if (updateError) {
    throw updateError;
  }
}

export async function POST(req: Request) {
  try {
    const { memorized, notMemorized } = (await req.json()) as QuizResult;

    if (!Array.isArray(memorized) || !Array.isArray(notMemorized)) {
      return Response.json({ error: "Invalid quiz results" }, { status: 400 });
    }

    for (const word of memorized) {
      await incrementField(word, "memorized");
    }

    for (const word of notMemorized) {
      await incrementField(word, "notMemorized");
    }

    return Response.json({
      success: true,
      memorized: memorized.length,
      notMemorized: notMemorized.length,
    });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return Response.json({ error: message }, { status: 500 });
  }
}
