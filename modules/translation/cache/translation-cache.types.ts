import type {
  CachedTranslation,
  TranslationField,
  TranslationLanguage,
} from "../types/translation.types";

export interface TranslationCacheInput {
  id: string;
  field: TranslationField;
  sourceText: string;
}

export interface TranslationCacheWrite extends TranslationCacheInput {
  value: CachedTranslation;
}

export type TranslationCacheLookup = Record<string, CachedTranslation | null>;

export type { TranslationLanguage };
