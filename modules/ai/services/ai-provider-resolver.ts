import "server-only";

import type { AiProvider } from "@/infrastructure/ai/ai-provider";
import { createAiProvider } from "@/infrastructure/ai/provider-factory";
import { decryptAiSecret } from "@/infrastructure/ai/secret-crypto";
import { aiProviderConfigRepository } from "@/modules/ai/repositories/ai-provider-config-repository";
import { recordAiExecutionEvent, type AiExecutionHandle } from "@/modules/ai/services/ai-execution-recorder";

/** Reads the current enabled provider list from PostgreSQL in administrator-defined order. */
export async function resolveConfiguredAiProviders(execution: AiExecutionHandle): Promise<AiProvider[]> {
  const configs = await aiProviderConfigRepository.listEnabledForExecution();
  const providers: AiProvider[] = [];

  for (const config of configs) {
    try {
      const apiKey = config.encryptedApiKey ? decryptAiSecret(config.encryptedApiKey) : "";
      providers.push(createAiProvider({
        id: config.id,
        name: config.name,
        sortOrder: config.sortOrder,
        provider: config.provider,
        baseUrl: config.baseUrl,
        apiKey,
        model: config.model,
        timeoutMs: config.timeoutMs,
      }));
    } catch (error) {
      // One misconfigured secret should not prevent later configured providers from being tried.
      execution.providerTypes = [...new Set([...execution.providerTypes, config.provider])];
      await recordAiExecutionEvent(execution, {
        level: "warn",
        event: "provider_configuration_unusable",
        message: "Provider configuration could not be loaded; the next enabled provider will be tried.",
        details: {
          provider: config.provider,
          providerConfigId: config.id,
          providerName: config.name,
          model: config.model,
          errorName: error instanceof Error ? error.name : "NonErrorThrown",
        },
      });
    }
  }

  return providers.sort((a, b) => a.providerOrder - b.providerOrder);
}
