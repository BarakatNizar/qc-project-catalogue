"use client";

import { useEffect, useState, useTransition } from "react";
import { Languages, Moon, Sun } from "lucide-react";
import { setApplicationLanguageAction } from "@/Interfaces/setters/application-language.setter";
import { TranslationLanguage } from "@/modules/translation/types/translation.types";
import { notify } from "../notificationToaster";
import { getTranslationState } from "@/Interfaces/actions/admin-translation.actions";
import { DEFAULT_TRANSLATION_LANGUAGE } from "@/modules/translation/constants/language.constants";

export function PreferencesControls() {
  const [theme, setTheme] = useState("qc-light");
  const [locale, setLocale] = useState("en");
  const [isPending, startTransition] = useTransition();
  const [translatable, setTranslatable ]= useState(false);

  async function checkTranslation() {
    try {
      const result = await getTranslationState();
      if("error" in result){
        notify.error("Error", result.error as string);
      }else{
        if (!result.enabled){
          await setApplicationLanguageAction(DEFAULT_TRANSLATION_LANGUAGE)
        }
        setTranslatable(result.enabled);
      }
    } catch (error) {
      notify.error("Network Error");
      console.error(error);
    }
  }

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme ?? "qc-light");
    setLocale(document.documentElement.lang === "ar" ? "ar" : "en");
    checkTranslation()
  }, []);

  function toggleTheme() {
    const next = theme === "qc-dark" ? "qc-light" : "qc-dark";

    setTheme(next);
    document.documentElement.dataset.theme = next;

    document.cookie = `qc_theme=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  async function toggleLocale() {
    const next = locale === "ar" ? "en" : "ar";

    setLocale(next);
    document.cookie = `qc_locale=${next}; path=/; max-age=31536000; samesite=lax`;

    await setApplicationLanguageAction(next as TranslationLanguage);
    startTransition(() => {
      window.location.reload();
    });
  }

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-card/80 p-1 shadow-sm shadow-foreground/[0.03]"
      aria-label="Display preferences"
    >
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-circle size-8 min-h-8 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
        onClick={toggleTheme}
        aria-label={
          theme === "qc-dark"
            ? "Switch to light theme"
            : "Switch to dark theme"
        }
        aria-pressed={theme === "qc-dark"}
        title={theme === "qc-dark" ? "Light theme" : "Dark theme"}
      >
        {theme === "qc-dark" ? (
          <Sun size={16} className="text-primary" aria-hidden="true" />
        ) : (
          <Moon size={16} className="text-primary" aria-hidden="true" />
        )}
      </button>

      <span
        aria-hidden="true"
        className="h-5 w-px bg-border"
      />

      <button
        type="button"
        className="btn btn-ghost btn-sm min-h-8 gap-1.5 rounded-full px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
        onClick={toggleLocale}
        disabled={isPending || !translatable}
        aria-label={locale === "ar" ? "Switch to English" : "Switch to Arabic"}
        title={locale === "ar" ? "Switch to English" : "Switch to Arabic"}
      >
        {translatable===true&&<>
        <Languages size={15} className="shrink-0 text-primary" aria-hidden="true" />
        <span className="max-[380px]:hidden">
          {locale === "ar" ? "English" : "العربية"}
        </span>
        </>
        }
      </button>
    </div>
  );
}