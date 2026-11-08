//@/modules/translation/types/translation.types"

export type TranslationLanguage = "en" | "ar";

  export type TranslationField =
  | "project.title"
  | "project.summary"
  | "project.description"
  | "project.problemStatement"
  | "project.proposedSolution"
  | "project.objectives"
  | "project.targetUsers"
  | "project.availableResources"
  | "project.constraints"
  | "projectFeature.content"
  | "projectSuggestion.title"
  | "projectSuggestion.content";

export interface TranslationInput {
  id: string;
  field: TranslationField;
  text: string;
}


export interface CachedTranslation {
  translatedText: string;
  detectedSourceLanguage: string | null;
}

export interface TranslationOutput extends CachedTranslation {
  id: string;
  fromCache: boolean;
}

export type TranslationProviderName =
  | "google"
  | "microsoft"
  | "deepl"
  | "libretranslate"
  | "lingva"
  | "ai_openrouter" 
  | "ai_local" ;

export type TranslationResult<T> =
  | {
      data: T;
      provider?: TranslationProviderName;
    }
  | {
      error: string;
    };

export interface TranslationProviderOutput {
  translatedText: string;
  detectedSourceLanguage: string | null;
}


/**
 * Legacy two-argument provider contract kept temporarily so existing provider
 * files can remain in the codebase during migration. The database-driven
 * fallback chain uses TranslationProviderAdapter instead.
 */
export type LegacyTranslationProviderName =
  | TranslationProviderName
  | "ai-local"
  | "ai-openrouter";

export interface TranslationProvider {
  readonly name: LegacyTranslationProviderName;
  translateMany(
    texts: string[],
    targetLanguage: TranslationLanguage,
  ): Promise<TranslationResult<TranslationProviderOutput[]>>;
}
