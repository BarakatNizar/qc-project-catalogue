import "server-only";

import { providersRepository } from "@/modules/translation/repositories/providers.repository";
import type { RuntimeTranslationProviderConfig } from "@/modules/translation/types/provider-config.types";
import type {
  TranslationLanguage,
  TranslationProviderName,
  TranslationProviderOutput,
  TranslationResult,
} from "@/modules/translation/types/translation.types";
import { getConfiguredTranslationAdapter } from "./configured-translation-providers";

export interface BaseTranslationProviderOptions {
  onSuccess?: (provider: TranslationProviderName) => void;
  onFallback?: (
    failedProvider: TranslationProviderName,
    error: string,
    nextProvider: TranslationProviderName,
  ) => void;
}


class BaseTranslationProvider {
  constructor(private readonly options: BaseTranslationProviderOptions = {}) {}

  private async getEnabledConfigs(): Promise<TranslationResult<RuntimeTranslationProviderConfig[]>> {
    return providersRepository.getEnabledForRuntime();
  }

  /**
   * Uses native language-detection endpoints only. Providers without a standalone
   * detection endpoint are skipped; their translate response still carries a
   * detected language and is handled by TranslationService as a fallback.
   */
  async detectSourceLanguages(
    texts: string[],
  ): Promise<TranslationResult<Array<string | null>>> {
    if (texts.length === 0) return { data: [] };

    const configResult = await this.getEnabledConfigs();
    if ("error" in configResult) return configResult;

    const detected: Array<string | null> = texts.map(() => null);

    for (const config of configResult.data) {
      if (config.configurationError) {
        console.warn(`[Translation] ${config.providerType} detection skipped: ${config.configurationError}`);
        continue;
      }

      const adapter = getConfiguredTranslationAdapter(config.providerType);
      if (!adapter.detectLanguages) continue;

      const unresolvedIndexes = detected
        .map((value, index) => value === null ? index : -1)
        .filter((index) => index >= 0);
      if (unresolvedIndexes.length === 0) break;

      const result = await adapter.detectLanguages(
        unresolvedIndexes.map((index) => texts[index]),
        config,
      );

      if ("error" in result) {
        console.warn(`[Translation] ${config.providerType} language detection failed: ${result.error}`);
        continue;
      }

      if (result.data.length !== unresolvedIndexes.length) {
        console.warn(`[Translation] ${config.providerType} returned an invalid detection result count.`);
        continue;
      }

      result.data.forEach((language, resultIndex) => {
        if (language) detected[unresolvedIndexes[resultIndex]] = language;
      });
    }

    return { data: detected };
  }

  async translateMany(
    texts: string[],
    targetLanguage: TranslationLanguage,
  ): Promise<TranslationResult<TranslationProviderOutput[]>> {
    if (texts.length === 0) return { data: [] };

    const configResult = await this.getEnabledConfigs();
    if ("error" in configResult) return configResult;

    const configs = configResult.data;
    if (configs.length === 0) {
      return { error: "No translation providers are enabled. Configure at least one provider in the administration panel." };
    }

    const failures: Array<{ provider: TranslationProviderName; error: string }> = [];

    for (let index = 0; index < configs.length; index += 1) {
      const config = configs[index];
      const provider = config.providerType;

      if (config.configurationError) {
        failures.push({ provider, error: config.configurationError });
      } else {
        const adapter = getConfiguredTranslationAdapter(provider);
        const result = await adapter.translateMany(texts, targetLanguage, config);

        if ("data" in result) {
          try {
            this.options.onSuccess?.(provider);
          } catch (callbackError) {
            console.error("[Translation] onSuccess callback failed", {
              errorName: callbackError instanceof Error ? callbackError.name : "UnknownError",
            });
          }

          if (index > 0) {
            console.info(`[Translation] Fallback succeeded using ${provider}.`);
          }

          return { data: result.data, provider };
        }

        failures.push({ provider, error: result.error });
      }

      const next = configs[index + 1];
      if (next) {
        const failure = failures[failures.length - 1];
        console.warn(`[Translation] ${provider} failed; trying ${next.providerType}.`, {
          error: failure.error,
        });
        try {
          this.options.onFallback?.(provider, failure.error, next.providerType);
        } catch (callbackError) {
          console.error("[Translation] onFallback callback failed", {
            errorName: callbackError instanceof Error ? callbackError.name : "UnknownError",
          });
        }
      }
    }

    console.error("[Translation] All configured translation providers failed.", {
      failures: failures.map(({ provider, error }) => ({ provider, error })),
    });
    return {
      error: `All configured translation providers failed. ${failures.map(({ provider, error }) => `${provider}: ${error}`).join(" | ")}`,
    };
  }
}

export const baseTranslationProvider = new BaseTranslationProvider();
