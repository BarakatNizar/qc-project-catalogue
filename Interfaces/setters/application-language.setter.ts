"use server";

import { cookies } from "next/headers";

import { APPLICATION_LANGUAGE_COOKIE } from "@/modules/translation/constants/language.constants";
import type { TranslationLanguage, TranslationResult } from "@/modules/translation/types/translation.types";

export async function setApplicationLanguageAction(
  language: TranslationLanguage,
): Promise<TranslationResult<TranslationLanguage>> {
  if (language !== "en" && language !== "ar") {
    return { error: "Unsupported application language." };
  }

  try {
    const cookieStore = await cookies();

    cookieStore.set(APPLICATION_LANGUAGE_COOKIE, language, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return { data: language };
  } catch {
    return { error: "Could not update the application language." };
  }
}
