// /admin/page.tsx
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  FolderKanban,
  Users,
  UserCog,
  ShieldCheck,
  Sparkles,
  Languages,
} from "lucide-react";

import { PageHeading } from "@/components/ui/page-heading";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCountsAction } from "@/Interfaces/getters/user.getters";
import ErrorState from "@/components/ErrorState";
import { getCurrentApplicationLanguage } from "@/modules/translation/services/application-language.service";
import { t } from "@/shared/i18n/dictionary";

export default async function AdminDashboard() {
  const adminData = await getCountsAction();
  const locale = await getCurrentApplicationLanguage();
  if ("error" in adminData) {
    return <ErrorState message={adminData.error} />;
  }

  const { data: counts } = adminData;

  const cards = [
    {
      labelKey: "supervisors",
      value: counts.supervisors,
      detailKey: "supervisorsCardDetail",
      icon: UserCog,
      accent: "text-primary bg-primary/10 ring-primary/15",
    },
    {
      labelKey: "students",
      value: counts.students,
      detailKey: "studentsCardDetail",
      icon: Users,
      accent: "text-sky-600 bg-sky-500/10 ring-sky-500/15 dark:text-sky-400",
    },
    {
      labelKey: "projects",
      value: counts.projects,
      detailKey: "projectsCardDetail",
      icon: FolderKanban,
      accent:
        "text-emerald-700 bg-emerald-500/10 ring-emerald-500/15 dark:text-emerald-400",
    },
  ] as const;


  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <PageHeading
        eyebrow={t(locale, "adminSystemOverviewEyebrow")}
        title={t(locale, "adminWelcomeTitle")}
        description={t(locale, "adminWelcomeDesc")}
      />

      {/* Platform overview */}
      <section aria-labelledby="overview-heading" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2
              id="overview-heading"
              className="font-bold text-foreground text-xl"
            >
              {t(locale, "platformOverviewTitle")}
            </h2>

            <p className="text-lg font-semibold leading-relaxed leading-7 text-muted-foreground">
              {t(locale, "platformOverviewDesc")}
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-md lg:text-lg  lg:text-lg font-medium leading-7 text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-primary"
            />
            {t(locale, "currentTotals")}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {cards.map(({ labelKey, value, detailKey, icon: Icon, accent }) => (
            <Card
              key={labelKey}
              className="group relative min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/70 via-primary/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              />

              <CardHeader className="flex sm:flex- flex-row items-start justify-between gap-3 space-y-0 p-5 pb-0 sm:p-6 sm:pb-0">
                <div className="min-w-0 space-y-1">
                  <p className="text-md lg:text-lg font-semibold leading-7 text-muted-foreground">
                    {t(locale, labelKey)}
                  </p>

                  <p className="text-md lg:text-lg leading-relaxed leading-7 text-muted-foreground/80">
                    {t(locale, "platformTotal")}
                  </p>
                </div>
                <div className="flex gap-5">
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-xl ring-1 transition-transform duration-200 group-hover:scale-105 ${accent}`}
                  >
                    <Icon size={26} strokeWidth={1.8} aria-hidden="true" />
                  </span>

                  <CardTitle className="break-words text-3xl font-bold tabular-nums text-foreground sm:text-4xl">
                    {value}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-2">
                <p className="mt-3 max-w-sm text-md lg:text-lg leading-7 text-muted-foreground">
                  {t(locale, detailKey)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* AI availability management */}
      <section aria-labelledby="ai-controls-heading">
        <Card className="relative isolate overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-sm">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.09] via-transparent to-transparent"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-16 -z-10 size-48 rounded-full bg-primary/10 blur-3xl sm:size-64"
          />

          <CardContent className="p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col min-w-0 items-start gap-4 sm:gap-5">
                <div className="flex gap-4 items-center">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary sm:size-14">
                    <Bot size={26} strokeWidth={1.7} aria-hidden="true" />
                  </div>
                  <div className="flex flex-col flex-wrap items-start gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                      <Sparkles size={20} aria-hidden="true" />
                      {t(locale, "aiControlsBadge")}
                    </span>

                    <span className="text-md lg:text-lg  lg:text-lg leading-7 text-muted-foreground">
                      {t(locale, "administrativeSettings")}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-3">

                  <div className="space-y-2">
                    <h2
                      id="ai-controls-heading"
                      className="text-xl font-bold text-foreground sm:text-2xl"
                    >
                      {t(locale, "aiServiceAvailabilityTitle")}
                    </h2>

                    <p className="max-w-4xl text-md lg:text-lg  leading-6 leading-7 text-muted-foreground">
                      {t(locale, "aiServiceAvailabilityDesc")}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/60 p-3 sm:max-w-xl">
                    <ShieldCheck
                      size={17}
                      className="mt-0.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />

                    <p className="text-md lg:text-lg  lg:text-lg leading-5 leading-7 text-muted-foreground">
                      {t(locale, "sensitiveProviderNote")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 lg:pl-4">
                <Link
                  href="/admin/ai"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-md lg:text-lg  font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:brightness-95 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
                >
                  <span>{t(locale, "manageAiAvailability")}</span>

                  <ArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>

                <p className="mt-2 text-center text-md lg:text-lg  lg:text-lg leading-7 text-muted-foreground lg:text-right">
                  {t(locale, "opensAiSettings")}
                  <ArrowUpRight
                    size={20}
                    className="ml-1 inline-block"
                    aria-hidden="true"
                  />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Translation service management */}
      <section aria-labelledby="translation-services-heading">
        <Card className="relative isolate overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-sm">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.09] via-transparent to-transparent"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-16 -z-10 size-48 rounded-full bg-primary/10 blur-3xl sm:size-64"
          />

          <CardContent className="p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col min-w-0 items-start gap-4 sm:gap-5">
                <div className="flex gap-4 items-center">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary sm:size-14">
                    <Languages size={26} strokeWidth={1.7} aria-hidden="true" />
                  </div>
                  <div className="flex flex-col flex-wrap items-start gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                      <Sparkles size={20} aria-hidden="true" />
                      {t(locale, "localizationControlsBadge")}
                    </span>

                    <span className="text-md lg:text-lg  lg:text-lg leading-7 text-muted-foreground">
                      {t(locale, "administrativeSettings")}
                    </span>
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-3">


                  <div className="space-y-2">
                    <h2
                      id="translation-services-heading"
                      className="text-xl font-bold text-foreground sm:text-2xl"
                    >
                      {t(locale, "translationServiceManagementTitle")}
                    </h2>

                    <p className="max-w-2xl text-md lg:text-lg  leading-6 leading-7 text-muted-foreground">
                      {t(locale, "translationServiceManagementDesc")}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/60 p-3 sm:max-w-xl">
                    <ShieldCheck
                      size={17}
                      className="mt-0.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />

                    <p className="text-md lg:text-lg  lg:text-lg leading-5 leading-7 text-muted-foreground">
                      {t(locale, "translationServiceNote")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 lg:pl-4">
                <Link
                  href="/admin/translations"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-md lg:text-lg  font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:brightness-95 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
                >
                  <span>{t(locale, "manageTranslationServices")}</span>

                  <ArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>

                <p className="mt-2 text-center text-md lg:text-lg  lg:text-lg leading-7 text-muted-foreground lg:text-right">
                  {t(locale, "opensTranslationSettings")}
                  <ArrowUpRight
                    size={20}
                    className="ml-1 inline-block"
                    aria-hidden="true"
                  />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
