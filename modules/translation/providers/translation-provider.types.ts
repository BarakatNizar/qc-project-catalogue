import type {
  TranslationLanguage,
  TranslationProviderName,
  TranslationProviderOutput,
  TranslationResult,
} from "../types/translation.types";
import type { RuntimeTranslationProviderConfig } from "@/modules/translation/types/provider-config.types";

export interface TranslationProviderAdapter {
  readonly name: TranslationProviderName;
  translateMany(
    texts: string[],
    targetLanguage: TranslationLanguage,
    config: RuntimeTranslationProviderConfig,
  ): Promise<TranslationResult<TranslationProviderOutput[]>>;
  /** Optional provider-native detection. Providers without a detect endpoint omit this method. */
  detectLanguages?(
    texts: string[],
    config: RuntimeTranslationProviderConfig,
  ): Promise<TranslationResult<Array<string | null>>>;
}
