export type AskLanguage = "JA" | "EN";

/** Detect if input contains Japanese characters (hiragana, katakana, or kanji). */
export function detectAskLanguage(input: string): AskLanguage {
  const hasJapanese = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/.test(input);
  return hasJapanese ? "JA" : "EN";
}

/** Resolve askJAorEN, falling back to detection from text when null/invalid. */
export function resolveAskLanguage(
  askJAorEN: string | null | undefined,
  fallbackText: string
): AskLanguage {
  if (askJAorEN === "JA" || askJAorEN === "EN") {
    return askJAorEN;
  }
  return detectAskLanguage(fallbackText);
}
