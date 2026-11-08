// // @/modules/translation/services/translation.service.ts
// import "server-only";

// import {
//   getCachedTranslations,
//   setCachedTranslations,
// } from "../cache/translation-cache";
// import type { TranslationCacheWrite } from "../cache/translation-cache.types";
// import type {
//   CachedTranslation,
//   TranslationInput,
//   TranslationLanguage,
//   TranslationOutput,
//   TranslationResult,
// } from "../types/translation.types";
// import { baseTranslationProvider } from "../providers/base-translation.provider";
// import { ServerUser } from "@/core/auth";
// import { providersRepository } from "../repositories/providers.repository";
// import { authorize } from "@/core/authorization/authorization-layer";

// function isSameLanguage(
//   detectedSourceLanguage: string | null,
//   targetLanguage: TranslationLanguage,
// ): boolean {
//   if (!detectedSourceLanguage) return false;
//   return detectedSourceLanguage.toLowerCase().split("-")[0] === targetLanguage;
// }

// function logCacheWarning(operation: string, error: string): void {
//   console.warn(`
//     0] Cache ${operation} failed: ${error}`);
// }

// class TranslationService {
//   async translateText( input: TranslationInput, targetLanguage: TranslationLanguage, ): Promise<TranslationResult<TranslationOutput>> {
//     const enabled= await this.getServiceSettings();
//     if ("error" in enabled|| !enabled || !enabled.enabled)
//       return {error:"Translation Service not available"}
   
//     const result = await this.translateTexts([input], targetLanguage);
//     if ("error" in result) return result;

//     const translated = result.data[0];
//     if (!translated) {
//       return { error: "Translation did not produce a result." };
//     }

//     return { data: translated };
//   }

//   async translateTexts(inputs: TranslationInput[], targetLanguage: TranslationLanguage,): Promise<TranslationResult<TranslationOutput[]>> {
//     const enabled= await this.getServiceSettings();
//     if ( "error" in enabled || !enabled || !enabled.enabled)
//       return {error:"Translation Service not available"}

//     if (inputs.length === 0) return { data: [] };

//     const ids = new Set<string>();
//     for (const input of inputs) {
//       if (ids.has(input.id)) {
//         return { error: `Duplicate translation input ID: ${input.id}` };
//       }
//       ids.add(input.id);
//     }

//     const outputById = new Map<string, TranslationOutput>();
//     const nonEmptyInputs = inputs.filter((input) => input.text.trim().length > 0);

//     for (const input of inputs) {
//       if (input.text.trim().length === 0) {
//         outputById.set(input.id, {
//           id: input.id,
//           translatedText: input.text,
//           detectedSourceLanguage: null,
//           fromCache: false,
//         });
//       }
//     }

//     if (nonEmptyInputs.length === 0) {
//       return { data: inputs.map((input) => outputById.get(input.id)!) };
//     }

//     const cacheInputs = nonEmptyInputs.map((input) => ({
//       id: input.id,
//       field: input.field,
//       sourceText: input.text,
//     }));

//     const cacheResult = await getCachedTranslations(cacheInputs, targetLanguage);
//     const cacheLookup = "data" in cacheResult ? cacheResult.data : {};

//     if ("error" in cacheResult) {
//       logCacheWarning("read", cacheResult.error);
//     }

//     const missByFingerprint = new Map<
//       string,
//       { input: TranslationInput; relatedIds: string[] }
//     >();

//     for (const input of nonEmptyInputs) {
//       const cached = cacheLookup[input.id];

//       if (cached) {
//         outputById.set(input.id, {
//           id: input.id,
//           translatedText: cached.translatedText,
//           detectedSourceLanguage: cached.detectedSourceLanguage,
//           fromCache: true,
//         });
//         continue;
//       }

//       const fingerprint = `${input.field}\u0000${input.text}`;
//       const existing = missByFingerprint.get(fingerprint);

//       if (existing) {
//         existing.relatedIds.push(input.id);
//       } else {
//         missByFingerprint.set(fingerprint, {
//           input,
//           relatedIds: [input.id],
//         });
//       }
//     }

//     const misses = [...missByFingerprint.values()];

//     if (misses.length > 0) {
//       const providerResult = await baseTranslationProvider.translateMany(
//         misses.map((entry) => entry.input.text),
//         targetLanguage,
//       );

//       if ("error" in providerResult) return providerResult;

//       if (providerResult.data.length !== misses.length) {
//         return { error: "Translation provider returned an unexpected result count." };
//       }

//       const cacheWrites: TranslationCacheWrite[] = [];

//       misses.forEach((miss, index) => {
//         const input = miss.input;
//         const providerOutput = providerResult.data[index];

//         const value: CachedTranslation = {
//           translatedText:
//             isSameLanguage(providerOutput.detectedSourceLanguage, targetLanguage)
//               ? input.text
//               : providerOutput.translatedText,
//           detectedSourceLanguage: providerOutput.detectedSourceLanguage,
//         };

//         cacheWrites.push({
//           id: input.id,
//           field: input.field,
//           sourceText: input.text,
//           value,
//         });

//         for (const relatedId of miss.relatedIds) {
//           outputById.set(relatedId, {
//             id: relatedId,
//             translatedText: value.translatedText,
//             detectedSourceLanguage: value.detectedSourceLanguage,
//             fromCache: false,
//           });
//         }
//       });

//       const cacheWriteResult = await setCachedTranslations(
//         cacheWrites,
//         targetLanguage,
//       );

//       if ("error" in cacheWriteResult) {
//         logCacheWarning("write", cacheWriteResult.error);
//       }
//     }

//     return {
//       data: inputs.map((input) => outputById.get(input.id)!),
//     };
//   }
 
//   async getServiceSettings() {
//     const settings = await providersRepository.getSettings();
//     return settings;
//   }

//   async setServiceEnabled(actor: ServerUser, enabled: boolean) {
//     authorize(actor, "AI_SETTINGS_MANAGE");
//     return providersRepository.setServiceEnabled(enabled);
//   }
// }

// export const translationService = new TranslationService();

import "server-only";

import type { ServerUser } from "@/core/auth";
import { authorize } from "@/core/authorization/authorization-layer";
import { providersRepository } from "../repositories/providers.repository";
import { baseTranslationProvider } from "../providers/base-translation.provider";
import { parseTranslationError } from "../utils/translation-error-parser";
import type {
  TranslationInput,
  TranslationLanguage,
  TranslationOutput,
  TranslationProviderOutput,
  TranslationResult,
} from "../types/translation.types";

function isSameLanguage(
  detectedSourceLanguage: string | null,
  targetLanguage: TranslationLanguage,
): boolean {
  if (!detectedSourceLanguage) return false;

  return (
    detectedSourceLanguage.trim().toLowerCase().split(/[-_]/u)[0] ===
    targetLanguage
  );
}

function isValidProviderOutput(
  value: unknown,
): value is TranslationProviderOutput {
  if (typeof value !== "object" || value === null) return false;

  const output = value as Record<string, unknown>;
  return (
    typeof output.translatedText === "string" &&
    (output.detectedSourceLanguage === null ||
      typeof output.detectedSourceLanguage === "string")
  );
}

class TranslationService {
  async translateText(
    input: TranslationInput,
    targetLanguage: TranslationLanguage,
  ): Promise<TranslationResult<TranslationOutput>> {
    try {
      const result = await this.translateTexts([input], targetLanguage);
      if ("error" in result) return result;

      const translated = result.data[0];
      if (!translated) {
        return { error: "Translation did not produce a result." };
      }

      return {
        data: translated,
        ...(result.provider ? { provider: result.provider } : {}),
      };
    } catch (error) {
      return { error: parseTranslationError(error, "TRANSLATE") };
    }
  }

  async translateTexts(
    inputs: TranslationInput[],
    targetLanguage: TranslationLanguage,
  ): Promise<TranslationResult<TranslationOutput[]>> {
    try {
      const settings = await this.getServiceSettings();
      if ("error" in settings || !settings || !settings.enabled) {
        return { error: "Translation service is not available." };
      }

      if (inputs.length === 0) return { data: [] };

      const inputIds = new Set<string>();
      for (const input of inputs) {
        if (inputIds.has(input.id)) {
          return { error: `Duplicate translation input ID: ${input.id}` };
        }
        inputIds.add(input.id);

        if (
          typeof input.id !== "string" ||
          input.id.trim().length === 0 ||
          typeof input.text !== "string" ||
          typeof input.field !== "string"
        ) {
          return { error: "Translation input contains an invalid value." };
        }
      }

      const outputById = new Map<string, TranslationOutput>();
      const nonEmptyInputs = inputs.filter((input) => input.text.trim().length > 0);

      for (const input of inputs) {
        if (input.text.trim().length === 0) {
          outputById.set(input.id, {
            id: input.id,
            translatedText: input.text,
            detectedSourceLanguage: null,
            fromCache: false,
          });
        }
      }

      if (nonEmptyInputs.length === 0) {
        return {
          data: inputs.map((input) => outputById.get(input.id)!),
        };
      }

      // Deduplicate identical field/text pairs within this request only.
      // This is request-level batching, not persistent translation caching.
      const uniqueInputs = new Map<
        string,
        { input: TranslationInput; relatedIds: string[] }
      >();

      for (const input of nonEmptyInputs) {
        const fingerprint = `${input.field}\u0000${input.text}`;
        const existing = uniqueInputs.get(fingerprint);

        if (existing) {
          existing.relatedIds.push(input.id);
        } else {
          uniqueInputs.set(fingerprint, {
            input,
            relatedIds: [input.id],
          });
        }
      }

      const uniqueEntries = [...uniqueInputs.values()];
      const providerResult = await baseTranslationProvider.translateMany(
        uniqueEntries.map((entry) => entry.input.text),
        targetLanguage,
      );

      if ("error" in providerResult) return providerResult;

      if (
        !Array.isArray(providerResult.data) ||
        providerResult.data.length !== uniqueEntries.length
      ) {
        return {
          error: "Translation provider returned an unexpected result count.",
        };
      }

      for (let index = 0; index < uniqueEntries.length; index += 1) {
        const entry = uniqueEntries[index];
        const providerOutput: unknown = providerResult.data[index];

        if (!isValidProviderOutput(providerOutput)) {
          return {
            error: "Translation provider returned an invalid translation result.",
          };
        }

        const translatedText = isSameLanguage(
          providerOutput.detectedSourceLanguage,
          targetLanguage,
        )
          ? entry.input.text
          : providerOutput.translatedText;

        for (const relatedId of entry.relatedIds) {
          outputById.set(relatedId, {
            id: relatedId,
            translatedText,
            detectedSourceLanguage: providerOutput.detectedSourceLanguage,
            fromCache: false,
          });
        }
      }

      const outputs = inputs.map((input) => outputById.get(input.id));
      if (outputs.some((output) => output === undefined)) {
        return { error: "Translation did not produce every requested result." };
      }

      return {
        data: outputs as TranslationOutput[],
        ...(providerResult.provider ? { provider: providerResult.provider } : {}),
      };
    } catch (error) {
      return { error: parseTranslationError(error, "TRANSLATE") };
    }
  }

  async getServiceSettings() {
    try {
      return await providersRepository.getSettings();
    } catch (error) {
      return { error: parseTranslationError(error, "SETTINGS_READ") };
    }
  }

  async setServiceEnabled(actor: ServerUser, enabled: boolean) {
    try {
      authorize(actor, "AI_SETTINGS_MANAGE");
      return await providersRepository.setServiceEnabled(enabled);
    } catch (error) {
      return { error: parseTranslationError(error, "SETTINGS_UPDATE") };
    }
  }
}

export const translationService = new TranslationService();
