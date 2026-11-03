
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  Bot,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import { requireUserForService } from "@/core/auth/session";
import { aiProviderConfigService } from "@/modules/ai/services/ai-provider-config-service";
import { AdminAiProviderManager } from "@/components/admin-ai-provider-manager";
import { getCurrentApplicationLanguage } from "@/modules/translation/services/application-language.service";
import { t } from "@/shared/i18n/dictionary";

export default async function AdminAiProvidersPage() {
  const actor = await requireUserForService();

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

  const locale = await getCurrentApplicationLanguage();

  if (actor.user.role !== "ADMIN") {
    return (
      <main className="mx-auto w-full max-w-5xl p-4 sm:p-8">
        <div className="alert alert-error" role="alert">
          <ShieldCheck className="size-5 shrink-0" aria-hidden="true" />
          <span>{t(locale, "onlyAdminsManageAiProviders")}</span>
        </div>
      </main>
    );
  }

  const config = await aiProviderConfigService.getAdminConfiguration(
    actor.user,
  );

  return (
    <main className="mx-auto w-full max-w-screen-3xl min-w-0 space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm">
        <div
          className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-primary/5 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex min-w-0 flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-base-content/85">
              <span>{t(locale, "adminBreadcrumb")}</span>
              <span aria-hidden="true">/</span>
              <span className="text-primary">
                {t(locale, "aiInfrastructureBreadcrumb")}
              </span>
            </div>

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary sm:size-14">
                <Bot className="size-6 sm:size-7" aria-hidden="true" />
              </div>

              <div className="min-w-0 space-y-4">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                  {t(locale, "aiProviderConfigTitle")}
                </h1>
                <p className="max-w-4xl text-lg leading-6 text-base-content/85">
                  {t(locale, "aiProviderConfigDesc")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-base-content/85 sm:text-[16px]">
              <span className="inline-flex items-center gap-2">
                <Workflow
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
                {t(locale, "upToFourProviders")}
              </span>

              <span className="inline-flex items-center gap-2">
                <ShieldCheck
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
                {t(locale, "savedApiKeysHidden")}
              </span>
            </div>
          </div>

          <Link
            className="btn btn-outline btn-sm w-full shrink-0 gap-2 sm:w-fit text-[15px]"
            href="/admin/ai/logs"
          >
            <Activity className="size-5" aria-hidden="true" />
            {t(locale, "viewAiLogsButton")}
            <ArrowUpRight className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <AdminAiProviderManager
        initialProviders={config.providers}
        initialAiEnabled={config.aiEnabled}
        locale={locale}
      />
    </main>
  );
}
