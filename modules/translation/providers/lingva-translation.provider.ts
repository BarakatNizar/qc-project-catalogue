import "server-only";

import { configuredTranslationAdapters } from "./configured-translation-providers";

/** Database-configured Lingva adapter. Provider settings are passed per request. */
export const lingvaTranslationProvider = configuredTranslationAdapters.lingva;
