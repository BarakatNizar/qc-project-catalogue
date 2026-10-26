//@/infrastructure/config/env.ts


import "server-only";
import { z } from "zod";

const optionalString = z.string().optional().transform((value) => value?.trim() || undefined);

const envSchema = z.object({
  DATABASE_URL: z.string().url().or(z.string().startsWith("postgres://")).or(z.string().startsWith("postgresql://")),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must contain at least 32 characters"),
  AI_CONFIG_ENCRYPTION_KEY: z.string().min(1, "AI_CONFIG_ENCRYPTION_KEY must be configured"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

let cached: z.infer<typeof envSchema> | undefined;

export function getEnv() {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    console.log(`Invalid environment configuration: ${problems}`)
    throw new Error(`Invalid environment configuration: ${problems}`);
  }
  cached = parsed.data;
  return cached;
}

// export function getAiProviderConfig(mode: "MAIN" | "FALLBACK") {
  
//   const env = getEnv();
//   if (mode === "MAIN") {
//     if (!env.AI_MAIN_BASE_URL || !env.AI_MAIN_API_KEY || !env.AI_MAIN_MODEL) return null;
//     return { provider: env.AI_MAIN_PROVIDER, baseUrl: env.AI_MAIN_BASE_URL, apiKey: env.AI_MAIN_API_KEY, model: env.AI_MAIN_MODEL, timeoutMs: env.AI_MAIN_TIMEOUT_MS };
//   }
//   if (!env.AI_FALLBACK_PROVIDER || !env.AI_FALLBACK_BASE_URL || !env.AI_FALLBACK_API_KEY || !env.AI_FALLBACK_MODEL) return null;
//   return { provider: env.AI_FALLBACK_PROVIDER, baseUrl: env.AI_FALLBACK_BASE_URL, apiKey: env.AI_FALLBACK_API_KEY, model: env.AI_FALLBACK_MODEL, timeoutMs: env.AI_FALLBACK_TIMEOUT_MS };
// }
