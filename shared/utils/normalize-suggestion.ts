import { AiSuggestionNormalized } from "../validation/ai";

/** Normalize only for deterministic exact-duplicate detection; this is not semantic similarity. */
export function normalizeSuggestion(value: string) {
  return value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
}

/** 
 * Removes exact duplicates from candidates by comparing their normalized content 
 * against existing suggestions and other candidates.
 */
export function removeExactDuplicates( existing: AiSuggestionNormalized[], candidates: AiSuggestionNormalized[] ): AiSuggestionNormalized[] {
  // Populate the Set with normalized existing content
  const seen = new Set(existing.map((item) => normalizeSuggestion(item.content)));
  const unique: AiSuggestionNormalized[] = [];

  for (const candidate of candidates) {
    const cleanedContent = candidate.content.trim().replace(/\s+/g, " ");
    const normalized = normalizeSuggestion(cleanedContent);

    if (cleanedContent && !seen.has(normalized)) {
      seen.add(normalized);
      unique.push({
        ...candidate,
        content: cleanedContent, // Keep the cleaned content version
      });
    }
  }

  return unique;
}