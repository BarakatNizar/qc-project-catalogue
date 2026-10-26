"use client";

import { useEffect, useState, useTransition } from "react";
import { Languages, Moon, Sun } from "lucide-react";

export function PreferencesControls() {
  const [theme, setTheme] = useState("qc-light");
  const [locale, setLocale] = useState("en");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme ?? "qc-light");
    setLocale(document.documentElement.lang === "ar" ? "ar" : "en");
  }, []);

  function toggleTheme() {
    const next = theme === "qc-dark" ? "qc-light" : "qc-dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `qc_theme=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  function toggleLocale() {
    const next = locale === "ar" ? "en" : "ar";
    setLocale(next);
    document.cookie = `qc_locale=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => window.location.reload());
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-base-300 bg-primary/20 p-1 backdrop-blur-xs hover:scale-[1.03] duration-300">
      <button 
        type="button" 
        className="btn btn-ghost btn-xs border-2 btn-circle text-base-content/80 hover:bg-base-100 hover:text-base-content" 
        onClick={toggleTheme} 
        aria-label={theme === "qc-dark" ? "Switch to light theme" : "Switch to dark theme"} 
        title={theme === "qc-dark" ? "Light theme" : "Dark theme"}
      >
        {theme === "qc-dark" ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-primary" />}
      </button>

      <button 
        type="button" 
        className="btn btn-ghost btn-xs border-2 gap-1.5 rounded-full px-2.5 font-semibold text-xs text-base-content/80 hover:bg-base-100 hover:text-base-content" 
        onClick={toggleLocale} 
        disabled={isPending} 
        aria-label="Change language"
      >
        <Languages size={14} className="text-primary" />
        <span>{locale === "ar" ? "English" : "العربية"}</span>
      </button>
    </div>
  );
}