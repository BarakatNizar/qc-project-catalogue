import "server-only";

import type { ServerUser } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { encryptAiSecret } from "@/infrastructure/ai/secret-crypto";
import { aiProviderConfigRepository, AiProviderConfigLimitError, AiProviderConfigNotFoundError } from "@/modules/ai/repositories/ai-provider-config-repository";
import { aiProviderConfigSaveSchema, aiProviderEnabledSchema, aiProviderIdSchema, type AiProviderConfigSaveInput } from "@/shared/validation/ai-provider-config";
import { aiRepository } from "@/modules/ai/repositories/ai-repository";

function requireAdmin(actor: ServerUser): void {
  if (actor.role !== "ADMIN") throw new AppError("FORBIDDEN");
}

function mapRepositoryError(error: unknown): never {
  if (error instanceof AiProviderConfigLimitError) {
    throw new AppError("VALIDATION", error.message);
  }
  if (error instanceof AiProviderConfigNotFoundError) {
    throw new AppError("NOT_FOUND", error.message);
  }
  // Concurrent serializable writes may be retried by the administrator.
  if (
    typeof error === "object" && error !== null && "code" in error &&
    (error as { code?: unknown }).code === "P2034"
  ) {
    throw new AppError("VALIDATION", "Provider settings changed concurrently. Refresh and try again.", { cause: error });
  }
  throw error;
}

export const aiProviderConfigService = {
  async getAdminConfiguration(actor: ServerUser) {
    requireAdmin(actor);
    const [providers, settings] = await Promise.all([
      aiProviderConfigRepository.listForAdmin(),
      aiRepository.getSettings(),
    ]);
    return {
      aiEnabled: settings.enabled,
      providers: providers.map((provider) => ({
        ...provider,
        createdAt: provider.createdAt.toISOString(),
        updatedAt: provider.updatedAt.toISOString(),
      })),
    };
  },

  async saveProvider(actor: ServerUser, raw: AiProviderConfigSaveInput) {
    requireAdmin(actor);
    const input = aiProviderConfigSaveSchema.parse(raw);

    const existing = input.id
      ? await aiProviderConfigRepository.findByIdWithSecret(input.id)
      : null;

    if (input.id && !existing) throw new AppError("NOT_FOUND", "The provider configuration was not found.");

    let encryptedApiKey: string | null;
    const suppliedKey = input.apiKey.trim();
    if (suppliedKey) {
      encryptedApiKey = encryptAiSecret(suppliedKey);
    } else if (input.clearApiKey) {
      encryptedApiKey = null;
    } else if (existing && existing.provider === input.provider) {
      encryptedApiKey = existing.encryptedApiKey;
    } else {
      // Never silently reuse credentials when changing provider type.
      encryptedApiKey = null;
    }
    console.log("encryptedApiKey:  ", encryptedApiKey )

    if (input.provider === "OPENROUTER" && !encryptedApiKey) {
      throw new AppError("VALIDATION", "An API key is required for OpenRouter providers.");
    }

    try {
      const providers = await aiProviderConfigRepository.save({
        ...(input.id ? { id: input.id } : {}),
        name: input.name,
        provider: input.provider,
        baseUrl: input.baseUrl.replace(/\/+$/, ""),
        encryptedApiKey,
        model: input.model,
        timeoutMs: input.timeoutMs,
        enabled: input.enabled,
        sortOrder: input.sortOrder,
      });
      return providers.map((provider) => ({ ...provider, createdAt: provider.createdAt.toISOString(), updatedAt: provider.updatedAt.toISOString() }));
    } catch (error) {
      mapRepositoryError(error);
    }
  },

  async setProviderEnabled(actor: ServerUser, raw: { id: string; enabled: boolean }) {
    requireAdmin(actor);
    const input = aiProviderEnabledSchema.parse(raw);
    try {
      await aiProviderConfigRepository.setEnabled(input.id, input.enabled);
      return (await aiProviderConfigService.getAdminConfiguration(actor)).providers;
    } catch (error) {
      mapRepositoryError(error);
    }
  },

  async deleteProvider(actor: ServerUser, raw: { id: string }) {
    requireAdmin(actor);
    const input = aiProviderIdSchema.parse(raw);
    try {
      await aiProviderConfigRepository.delete(input.id);
      return (await aiProviderConfigService.getAdminConfiguration(actor)).providers;
    } catch (error) {
      mapRepositoryError(error);
    }
  },
};
