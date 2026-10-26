import "server-only";

import { ChatCompletionsProvider, type ProviderConfig } from "@/infrastructure/ai/chat-completions-provider";
import type { AiProvider, AiProviderIdentity } from "@/infrastructure/ai/ai-provider";
import type { AiProvider as DbAiProvider } from "@prisma/client";

export type ConfiguredProviderInput = AiProviderIdentity & ProviderConfig;

/** Infrastructure factory only constructs a provider; it does not read env variables or query the database. */
export function createAiProvider(config: ConfiguredProviderInput): AiProvider {
  return new ChatCompletionsProvider(
    {
      provider: config.provider as DbAiProvider,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.model,
      timeoutMs: config.timeoutMs,
    },
    { id: config.id, name: config.name, sortOrder: config.sortOrder },
  );
}
