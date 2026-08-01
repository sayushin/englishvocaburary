/**
 * Synonyms are stored as a single comma-separated string, but models return
 * them as either an array or an already joined string.
 */
export function normalizeSynonyms(value: unknown): string {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return list
    .map((item) => String(item).trim())
    .filter(Boolean)
    .join(", ");
}
