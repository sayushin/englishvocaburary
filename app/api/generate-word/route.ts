import {
  getApiKey,
  getClient,
  getModel,
  getProviderName,
  isProvider,
} from "@/lib/aiClient";
import { normalizeSynonyms } from "@/lib/synonyms";

const PROMPT = (word: string) => `

You are an experienced English vocabulary teacher specializing in EIKEN examinations for Japanese learners.

The user's input is "${word}".

First, determine whether the input is Japanese or English.

Rules:

- If the input is an English word or phrase, analyze that English word.

- If the input is Japanese, first determine the most common English translation that an English learner would naturally use, and analyze that English word instead.

- If multiple English translations are possible, choose the most common and useful one for everyday English and EIKEN learners.

- Always return the selected English word in the "word" field.

- Do not return Japanese in the "word" field.

Analyze the English word "${word}" and return the following information.

Instructions:

- The Japanese meaning must be natural, concise, and commonly used.

- The English meaning must be written in simple English suitable for English learners.

- The sample sentence must be natural, grammatically correct, and demonstrate the most common usage of the word.

- The Japanese translation must accurately translate the sample sentence.

- The pronunciation must be in IPA format.

- The part of speech must be exactly one of:

  noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection.

- The synonyms must be 3 to 5 common English words or short phrases with a similar meaning and the same part of speech. Order them from most to least common. If the word has no natural synonym, return an empty array.

Determine the EIKEN level using the following criteria:

- EIKEN Grade 5: very basic junior high school words

- EIKEN Grade 4: basic junior high school words

- EIKEN Grade 3: standard junior high school words

- EIKEN Pre-2: basic high school words

- EIKEN Grade 2: standard high school and academic words

- EIKEN Pre-1: advanced academic or business words

- EIKEN Grade 1: very advanced, abstract, formal, or rare words

Choose exactly one of the following values:

- "EIKEN Grade 1"

- "EIKEN Pre-1"

- "EIKEN Grade 2"

- "EIKEN Pre-2"

- "EIKEN Grade 3"

- "EIKEN Grade 4"

- "EIKEN Grade 5"

Do not invent new levels.

If the word falls between two levels, choose the lower (easier) level.

Return ONLY valid JSON.

Do not include markdown, explanations, or comments.

{

  "word": "",

  "meaning_ja": "",

  "meaning_en": "",

  "sample_sentence": "",

  "sample_sentence_ja": "",

  "pronunciation": "",

  "part_of_speech": "",

  "difficulty": "",

  "synonyms": []

}

`;

export async function POST(req: Request) {
  try {
    const { word, provider = "openai" } = await req.json();

    if (!word?.trim()) {
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
      messages: [{ role: "user", content: PROMPT(word.trim()) }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "No response from AI" }, { status: 500 });
    }

    const result = JSON.parse(content);

    return Response.json({
      word: word.trim(),
      ...result,
      provider,
      synonyms: normalizeSynonyms(result.synonyms),
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error ? error.message : "Something went wrong";

    return Response.json({ error: message }, { status: 500 });
  }
}
