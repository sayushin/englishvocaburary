import {
  getApiKey,
  getClient,
  getModel,
  getProviderName,
  isProvider,
} from "@/lib/aiClient";
import { normalizeSynonyms } from "@/lib/synonyms";

const PROMPT = (word: string, meaning: string) => `
You are an English vocabulary teacher for Japanese learners.

Find synonyms for the English word "${word}".
${meaning ? `Its Japanese meaning is "${meaning}", so match that sense of the word.` : ""}

Rules:
- Return 3 to 5 common English words or short phrases with a similar meaning.
- Every synonym must share the same part of speech as "${word}".
- Order them from most to least common in everyday English.
- Do not include "${word}" itself.
- If the word has no natural synonym, return an empty array.

Return ONLY valid JSON:
{
  "synonyms": []
}
`;

export async function POST(req: Request) {
  try {
    const { word, meaning_ja, provider = "openai" } = await req.json();

    if (typeof word !== "string" || !word.trim()) {
      return Response.json({ error: "Word is required" }, { status: 400 });
    }

    if (!isProvider(provider)) {
      return Response.json({ error: "Invalid provider" }, { status: 400 });
    }

    if (!getApiKey(provider)) {
      return Response.json(
        { error: `${getProviderName(provider)} API key is not configured` },
        { status: 500 }
      );
    }

    const completion = await getClient(provider).chat.completions.create({
      model: getModel(provider),
      messages: [
        {
          role: "user",
          content: PROMPT(
            word.trim(),
            typeof meaning_ja === "string" ? meaning_ja.trim() : ""
          ),
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "No response from AI" }, { status: 500 });
    }

    const parsed = JSON.parse(content) as { synonyms?: unknown };
    const synonyms = normalizeSynonyms(parsed.synonyms);

    if (!synonyms) {
      return Response.json(
        { error: `No synonyms found for "${word.trim()}"` },
        { status: 404 }
      );
    }

    return Response.json({ provider, synonyms });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return Response.json({ error: message }, { status: 500 });
  }
}
