import "server-only";

import { cookies } from "next/headers";

import {
  APPLICATION_LANGUAGE_COOKIE,
  DEFAULT_TRANSLATION_LANGUAGE,
} from "../constants/language.constants";
import type { TranslationLanguage } from "../types/translation.types";

export async function getCurrentApplicationLanguage(): Promise<TranslationLanguage> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(APPLICATION_LANGUAGE_COOKIE)?.value;

  if (cookieValue === "ar" || cookieValue === "en") {
    return cookieValue;
  }

  return process.env.DEFAULT_APPLICATION_LANGUAGE === "ar"
    ? "ar"
    : DEFAULT_TRANSLATION_LANGUAGE;
}
