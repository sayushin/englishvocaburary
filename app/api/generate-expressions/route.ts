import OpenAI from "openai";
import type {
  ExpressionKind,
  ExpressionSuggestion,
  Provider,
} from "@/lib/types";

const ALLOWED_KINDS: ExpressionKind[] = [
  "short_expression",
  "sentence",
  "paragraph",
];

function getClient(provider: Provider) {
  if (provider === "deepseek") {
    return new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    });
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getModel(provider: Provider) {
  return provider === "deepseek" ? "deepseek-chat" : "gpt-4o-mini";
}

function makePrompt(input: string) {
  return `
You help Japanese learners express themselves naturally in English.
The user entered: "${input}"

The input may be Japanese or English. Understand its intended meaning, then
produce exactly three natural English suggestions:
1. A concise short expression
2. A complete natural sentence
3. A short paragraph or speech of 2-4 sentences

For each suggestion, include a natural Japanese translation.
Return ONLY valid JSON in this exact structure:
{
  "suggestions": [
    {
      "kind": "short_expression",
      "englishSentence": "",
      "japaneseMeaning": ""
    },
    {
      "kind": "sentence",
      "englishSentence": "",
      "japaneseMeaning": ""
    },
    {
      "kind": "paragraph",
      "englishSentence": "",
      "japaneseMeaning": ""
    }
  ]
}
`;
}

function isSuggestion(value: unknown): value is ExpressionSuggestion {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    ALLOWED_KINDS.includes(item.kind as ExpressionKind) &&
    typeof item.englishSentence === "string" &&
    typeof item.japaneseMeaning === "string"
  );
}

export async function POST(req: Request) {
  try {
    const { input, provider = "openai" } = await req.json();

    if (typeof input !== "string" || !input.trim()) {
      return Response.json({ error: "Input is required" }, { status: 400 });
    }

    if (provider !== "openai" && provider !== "deepseek") {
      return Response.json({ error: "Invalid provider" }, { status: 400 });
    }

    const apiKey =
      provider === "deepseek"
        ? process.env.DEEPSEEK_API_KEY
        : process.env.OPENAI_API_KEY;

    if (!apiKey) {
      const name = provider === "deepseek" ? "DeepSeek" : "OpenAI";
      return Response.json(
        { error: `${name} API key is not configured` },
        { status: 500 }
      );
    }

    const completion = await getClient(provider).chat.completions.create({
      model: getModel(provider),
      messages: [{ role: "user", content: makePrompt(input.trim()) }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "No response from AI" }, { status: 500 });
    }

    const parsed = JSON.parse(content) as { suggestions?: unknown[] };
    const suggestions = parsed.suggestions?.filter(isSuggestion) ?? [];

    if (suggestions.length !== 3) {
      return Response.json(
        { error: "AI returned an invalid expression response" },
        { status: 502 }
      );
    }

    return Response.json({ provider, suggestions });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return Response.json({ error: message }, { status: 500 });
  }
}
