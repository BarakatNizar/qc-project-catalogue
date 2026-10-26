import { z } from "zod";

const baseUrlSchema = z
  .string()
  .trim()
  .min(1, "Base URL is required.")
  .max(500)
  .url("Enter a valid provider base URL.")
  .refine((value) => {
    try {
      const url = new URL(value);
      return (url.protocol === "https:" || url.protocol === "http:") &&
        !url.username && !url.password && !url.search && !url.hash;
    } catch {
      return false;
    }
  }, "Use an HTTP(S) base URL without embedded credentials, query parameters, or fragments.");

export const aiProviderConfigSaveSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1).max(80),
    provider: z.enum(["OPENROUTER", "LOCAL"]),
    baseUrl: baseUrlSchema,
    // Empty means preserve the existing key on update; create without a key is allowed only for LOCAL.
    apiKey: z.string().max(2000).optional().default(""),
    clearApiKey: z.boolean().optional().default(false),
    model: z.string().trim().min(1).max(180),
    timeoutMs: z.coerce.number().int().min(1000).max(1800000),
    enabled: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).max(3),
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

export const aiProviderIdSchema = z.object({ id: z.string().uuid() });
export const aiProviderEnabledSchema = z.object({ id: z.string().uuid(), enabled: z.boolean() });
export const aiServiceEnabledSchema = z.object({ enabled: z.boolean() });

export type AiProviderConfigSaveInput = z.input<typeof aiProviderConfigSaveSchema>;
export type AiProviderConfigSave = z.output<typeof aiProviderConfigSaveSchema>;
