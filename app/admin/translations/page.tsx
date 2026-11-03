
import { redirect } from "next/navigation";
import {
  Languages,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import { requireUserForService } from "@/core/auth/session";
import { AdminTranslationProviderManager } from "@/components/admin-translation-provider-manager";
import ErrorState from "@/components/ErrorState";
import { getTranslationConfigurationAction } from "@/Interfaces/actions/admin-translation.actions";
import { t, type Locale } from "@/shared/i18n/dictionary";
import { getCurrentApplicationLanguage } from "@/modules/translation/services/application-language.service";

export default async function AdminTranslationPage() {
  
  const actor = await requireUserForService();
  const locale= await getCurrentApplicationLanguage();

  if ("redirect" in actor) {
    redirect(actor.redirect);
  }

  if ("error" in actor) {
    return (
      <main className="mx-auto w-full max-w-5xl p-4 sm:p-8">
        <div className="alert alert-error" role="alert">
          <ShieldCheck className="size-5 shrink-0" aria-hidden="true" />
          <span>{actor.error}</span>
        </div>
      </main>
    );
  }

  if (actor.user.role !== "ADMIN") {
    return (
      <main className="mx-auto w-full max-w-5xl p-4 sm:p-8">
        <div className="alert alert-error" role="alert">
          <ShieldCheck className="size-5 shrink-0" aria-hidden="true" />
          <span>{t(locale, "onlyAdminsManageTranslationProviders")}</span>
        </div>
      </main>
    );
  }

  const data = await getTranslationConfigurationAction();

  if ("error" in data) {
    return <ErrorState message={data.error as string} />;
  }

  const { enabled, providers } = data;

  return (
    <main className="mx-auto w-full max-w-screen-3xl min-w-0 space-y-6 p-4 sm:p-6 lg:p-8 pt-0 sm:pt-0 lg:pt-0">
      <header className="relative overflow-hidden rounded-3xl border border-base-300 bg-base-100 border border-primary/40 shadow shadow-primary/80 bg-primary/5">
        <div
          className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-primary/5 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex min-w-0 flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-4">
            {/* <div className="flex flex-wrap items-center gap-2 text-[15px] font-semibold uppercase tracking-wide text-base-content/90">
              <span>{t(locale, "adminBreadcrumb")}</span>
              <span aria-hidden="true">/</span>
              <span className="text-primary">
                {t(locale, "localizationTranslationBreadcrumb")}
              </span>
            </div> */}

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary sm:size-14">
                <Languages className="size-6 sm:size-7" aria-hidden="true" />
              </div>

              <div className="min-w-0 space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                  {t(locale, "translationProviderConfigTitle")}
                </h1>

                <p className="max-w-5xl text-lg leading-8 text-base-content/90">
                  {t(locale, "translationProviderConfigDesc")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[15px] text-base-content/90 sm:text-[17px]">
              <span className="inline-flex items-center gap-2">
                <Workflow
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
                {t(locale, "upToSevenFallbackProviders")}
              </span>

              <span className="inline-flex items-center gap-2">
                <ShieldCheck
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
                {t(locale, "secureEncryptedKeyStorage")}
              </span>
            </div>
          </div>
        </div>
      </header>

      <AdminTranslationProviderManager
        initialProviders={providers.data}
        initialServiceEnabled={enabled}
      />
    </main>
  );
}
