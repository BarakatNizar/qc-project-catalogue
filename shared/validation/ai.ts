import { z } from "zod";

export const requestAiSuggestionsSchema = z.object({
  projectId: z.uuid("Invalid project ID format."),
});

export const deleteAiSuggestionSchema = z.object({
  suggestionId: z.uuid("Invalid suggestion ID format."),
});

export const aiSuggestionResponseSchema = z.object({
  suggestions: z
    .array(
      z.object({
        title: z
          .string( "Suggestion title is required." )
          .trim()
          .min(1, "Suggestion title cannot be empty.")
          .max(400, "Suggestion title must not exceed 400 characters."),
        content: z
          .string( "Suggestion content is required." )
          .trim()
          .min(1, "Suggestion content cannot be empty.")
          .max(1200, "Suggestion content must not exceed 1200 characters."),
      })
    )
    .min(1, "At least one suggestion is required.")
    .max(4, "Provide no more than 4 suggestions."),
});

export type AiSuggestionResponsePayload = z.infer<typeof aiSuggestionResponseSchema>;
export type AiSuggestionNormalized = AiSuggestionResponsePayload["suggestions"][number];