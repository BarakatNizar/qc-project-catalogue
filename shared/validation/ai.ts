//@/shared/validation/ai.ts

import { z } from "zod";

export const requestAiSuggestionsSchema = z.object({ projectId: z.uuid() });
export const deleteAiSuggestionSchema = z.object({ suggestionId: z.uuid() });

export const aiSuggestionResponseSchema = z.object({
  suggestions: z.array(z.object({title:z.string().trim().min(1).max(400), content: z.string().trim().min(1).max(1200) })).min(1).max(4),
});

export type AiSuggestionResponsePayload = z.infer<typeof aiSuggestionResponseSchema>;

export type AiSuggestionNormalized=AiSuggestionResponsePayload['suggestions'][number]
