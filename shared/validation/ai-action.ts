import { z } from "zod";

/** Maximum bytes accepted for a document sent for AI extraction. */
export const AI_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

const supportedMimeTypes = new Set([
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "",
]);

const projectIdSchema = z.uuid("Invalid project ID format.");
const suggestionIdSchema = z.uuid("Invalid suggestion ID format.");

export const requestAiSuggestionsActionSchema = z.object({
  projectId: projectIdSchema,
});
export type RequestAiSuggestionsActionPayload = z.infer<
  typeof requestAiSuggestionsActionSchema
>;

export const deleteAiSuggestionActionSchema = z.object({
  projectId: projectIdSchema,
  suggestionId: suggestionIdSchema,
});
export type DeleteAiSuggestionActionPayload = z.infer<
  typeof deleteAiSuggestionActionSchema
>;

export const setAiEnabledActionSchema = z.object({
  enabled: z.boolean("AI enabled status is required.")
});
export type SetAiEnabledActionPayload = z.infer<
  typeof setAiEnabledActionSchema
>;

/**
 * Server Action payload for file extraction. The client reads the selected file
 * into an ArrayBuffer and sends a typed object; this deliberately does not use
 * FormData. ArrayBuffer is serializable through React Server Functions.
 */
export const extractProjectFromFileActionSchema = z.object({
  fileName: z
    .string("File name is required.").trim()
    .min(1, "File name cannot be empty.")
    .max(255, "File name must not exceed 255 characters."),
  mimeType: z
    .string("MIME type is required.").max(120, "MIME type must not exceed 120 characters.")
    .refine((value) => supportedMimeTypes.has(value), "Unsupported file MIME type."),
  data: z
    .instanceof(ArrayBuffer, { message: "File data must be a valid ArrayBuffer." })
    .refine((value) => value.byteLength > 0, "The uploaded file is empty.")
    .refine(
      (value) => value.byteLength <= AI_DOCUMENT_MAX_BYTES,
      "The uploaded file exceeds the 10 MB limit."
    ),
});
export type ExtractProjectFromFileActionPayload = z.infer<
  typeof extractProjectFromFileActionSchema
>;