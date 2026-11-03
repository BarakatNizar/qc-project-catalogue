import "server-only";

import type { TranslationProviderName } from "../types/translation.types";
import { getConfiguredTranslationAdapter } from "./configured-translation-providers";

/** Resolves an adapter by the providerType stored in TranslationProviderConfig. */
export function getTranslationProvider(providerType: TranslationProviderName) {
  return getConfiguredTranslationAdapter(providerType);
}
