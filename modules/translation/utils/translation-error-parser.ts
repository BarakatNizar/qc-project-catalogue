import { AppError, toSafeMessage } from "@/core/errors/app-error";

export type TranslationErrorOperation =
  | "TRANSLATE"
  | "SETTINGS_READ"
  | "SETTINGS_UPDATE";

/**
 * Converts unexpected translation-service exceptions into stable messages.
 * Provider adapters already return sanitized errors; this parser is for
 * exceptions that escape repository, authorization, or orchestration calls.
 */
export function parseTranslationError(
  error: unknown,
  operation: TranslationErrorOperation,
): string {
  if (error instanceof AppError) {
    return toSafeMessage(error);
  }

  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === "string"
        ? error.toLowerCase()
        : "";

  if (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("etimedout") ||
    (error instanceof Error && error.name === "AbortError")
  ) {
    return "The translation request timed out.";
  }

  if (
    message.includes("fetch failed") ||
    message.includes("networkerror") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("eai_again")
  ) {
    return "Translation providers are unavailable or disconnected.";
  }

  switch (operation) {
    case "SETTINGS_READ":
      return "Could not load translation service settings.";
    case "SETTINGS_UPDATE":
      return "Could not update translation service settings.";
    case "TRANSLATE":
    default:
      return "The translation operation failed.";
  }
}
