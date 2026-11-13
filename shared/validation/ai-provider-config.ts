import { z } from "zod";

const baseUrlSchema = z
  .string("Base URL is required.")

  .trim()
  .min(1, "Base URL is required.")
  .max(500, "Base URL must not exceed 500 characters.")
  .url("Enter a valid provider base URL.")
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        (url.protocol === "https:" || url.protocol === "http:") &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash
      );
    } catch {
      return false;
    }
  }, "Use an HTTP(S) base URL without embedded credentials, query parameters, or fragments.");

export const aiProviderConfigSaveSchema = z
  .object({
    id: z.uuid("Invalid provider ID format.").optional(),
    name: z
      .string("Provider name is required.")

      .trim()
      .min(1, "Provider name is required.")
      .max(80, "Provider name must not exceed 80 characters."),
    provider: z.enum(["OPENROUTER", "LOCAL"], "Select a valid provider type."),
    baseUrl: baseUrlSchema,
    apiKey: z.string().max(2000, "API key must not exceed 2000 characters.").optional().default(""),
    clearApiKey: z.boolean().optional().default(false),
    model: z
      .string("Model identifier is required.")

      .trim()
      .min(1, "Model identifier is required.")
      .max(180, "Model identifier must not exceed 180 characters."),
    timeoutMs: z.coerce
      .number("Timeout must be a valid number.")
      .int("Timeout must be an integer.")
      .min(1000, "Timeout must be at least 1,000 ms (1 second).")
      .max(1800000, "Timeout must not exceed 1,800,000 ms (30 minutes)."),
    enabled: z.boolean().default(true),
    sortOrder: z.coerce
      .number("Sort order must be a valid number.")
      .int("Sort order must be an integer.")
      .min(0, "Sort order cannot be negative.")
      .max(3, "Sort order cannot exceed 3."),
  })
  .superRefine((value, context) => {
    if (value.provider === "OPENROUTER") {
      let protocol = "";
      try {
        protocol = new URL(value.baseUrl).protocol;
      } catch {
        // baseUrlSchema already reports malformed URLs.
      }
      if (protocol && protocol !== "https:") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["baseUrl"],
          message: "OpenRouter endpoints must use HTTPS.",
        });
      }
      if (value.clearApiKey && !value.apiKey?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["clearApiKey"],
          message: "An OpenRouter provider must have an API key.",
        });
      }
    }
  });

export const aiProviderIdSchema = z.object({ id: z.uuid("Invalid provider ID format.") });
export const aiProviderEnabledSchema = z.object({
  id: z.uuid("Invalid provider ID format."),
  enabled: z.boolean("Enabled status is required."),

});
export const aiServiceEnabledSchema = z.object({
  enabled: z.boolean("Service enabled status is required."),

});

export type AiProviderConfigSaveInput = z.input<typeof aiProviderConfigSaveSchema>;
export type AiProviderConfigSave = z.output<typeof aiProviderConfigSaveSchema>;