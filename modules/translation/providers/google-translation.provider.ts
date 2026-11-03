import "server-only";

import { configuredTranslationAdapters } from "./configured-translation-providers";

/** Database-configured Google adapter. Provider settings are passed per request. */
export const googleTranslationProvider = configuredTranslationAdapters.google;
