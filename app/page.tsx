import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Compass,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { getServerUserFromAccess, roleHome } from "@/core/auth/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentApplicationLanguage } from "@/modules/translation/services/application-language.service";
import { DictionaryKey, t } from "@/shared/i18n/dictionary";
const pillars = [
  {
    icon: BookOpenCheck,
    number: "01",
    titleKey: "pillar1Title" as DictionaryKey ,
    textKey: "pillar1Text" as DictionaryKey , 
    accent: "text-primary",
    iconBackground: "bg-primary/10",
  },
  {
    icon: Search,
    number: "02",
    titleKey: "pillar2Title" as DictionaryKey,
    textKey: "pillar2Text" as DictionaryKey , 
    accent: "text-accent",
    iconBackground: "bg-accent/10",
  },
  {
    icon: BrainCircuit,
    number: "03",
    titleKey: "pillar3Title" as DictionaryKey,
    textKey: "pillar3Text" as DictionaryKey , 
    accent: "text-emerald-500",
    iconBackground: "bg-emerald-500/10",
  },
];

export default async function HomePage() {
  const getResult = await getServerUserFromAccess();
  const user = !("error" in getResult) ? getResult : undefined;
  const locale = await getCurrentApplicationLanguage();
  const catalogueHref = user ? roleHome(user.role) : "/projects";
  
  return (
    <main className="relative isolate min-h-screen overflow-x-clip bg-background">
      {/* Restrained ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] overflow-hidden"
      >
        <div className="absolute -top-56 left-1/2 h-[560px] w-[min(1000px,120vw)] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-3xl" />
  
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.12] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
      </div>
  
      {/* Hero */}
      <section className="relative border-b border-border/60">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:px-8 lg:py-24 xl:gap-20">
          {/* Hero content */}
          <div className="min-w-0">
            <Badge
              variant="outline"
              className="mb-7 inline-flex max-w-full items-center gap-2 rounded-full border-primary/30 bg-primary/5 px-4 py-3 text-[15px] font-semibold text-primary backdrop-blur-sm"
            >
              <Compass size={20} className="shrink-0" />
              <span>{t(locale, "homeBadge")}</span>
            </Badge>
  
            <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl/tight">
              {t(locale, "homeTitleStart")}{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-emerald-400 bg-clip-text text-transparent">
                {t(locale, "homeTitleHighlight")}
              </span>
            </h1>
  
            <p className="mt-6 max-w-xl text-base leading-relaxed opacity-85  sm:text-lg">
              {t(locale, "homeDesc")}
            </p>
  
            <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center">
              <Link
                href={catalogueHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {t(locale, "homeExploreIdeas")}
                <ArrowRight size={20} />
              </Link>
  
              {!user && (
                <Link
                  href="/login"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-background/70 px-6 py-3 font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {t(locale, "homeStaffSignIn")}
                </Link>
              )}
            </div>
  
            <div className="mt-10 flex flex-col gap-3 text-[16px] font-medium opacity-85 /90 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:gap-x-7">
              <span className="flex items-center gap-2">
                <ShieldCheck size={20} className="shrink-0 text-primary" />
                {t(locale, "homeCuratedBriefs")}
              </span>
  
              <span className="flex items-center gap-2">
                <Sparkles size={20} className="shrink-0 text-accent" />
                {t(locale, "homeAiInspiration")}
              </span>
            </div>
          </div>
  
          {/* Project preview */}
          <div className="relative mx-auto w-full min-w-0 max-w-xl lg:max-w-none">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-primary/20 via-accent/10 to-emerald-500/10 opacity-80 blur-2xl"
            />
  
            <Card className="relative overflow-hidden rounded-2xl border-border/80 bg-card/95 shadow-2xl shadow-black/5 backdrop-blur-xl sm:rounded-[2rem]">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4 sm:px-7">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <BookOpenCheck size={28} />
                  </div>
  
                  <div className="min-w-0">
                    <p className="text-lg font-bold uppercase tracking-wide text-primary">
                      {t(locale, "previewEyebrow")}
                    </p>
                    <p className="mt-0.5 text-[16px] opacity-90 ">
                      {t(locale, "previewSubtitle")}
                    </p>
                  </div>
                </div>
  
                <span
                  aria-hidden="true"
                  className="flex shrink-0 items-center gap-1.5"
                >
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[15px] font-medium opacity-85 ">
                    {t(locale, "previewBadge")}
                  </span>
                </span>
              </div>
  
              <CardHeader className="space-y-4 p-5 pb-4 sm:p-7 sm:pb-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <CardTitle className="min-w-0 text-2xl font-extrabold tracking-tight">
                    {t(locale, "previewTitle")}
                  </CardTitle>
  
                  <Badge className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-1 font-semibold text-primary hover:bg-primary/10">
                    {t(locale, "previewType")}
                  </Badge>
                </div>
  
                <CardDescription className="text-[16px] leading-relaxed ">
                  {t(locale, "previewDesc")}
                </CardDescription>
              </CardHeader>
  
              <CardContent className="space-y-5 px-5 pb-5 sm:space-y-6 sm:px-7 sm:pb-7">
                {/* Scope */}
                <div className="rounded-xl border border-border/70 bg-muted/30 p-4 sm:rounded-2xl sm:p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[14px] font-bold uppercase tracking-wide opacity-85 ">
                      {t(locale, "scopeEyebrow")}
                    </p>
                    <span className="text-[14px] font-medium opacity-85 ">
                      {t(locale, "scopeCount")}
                    </span>
                  </div>
  
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="max-w-full rounded-md border border-primary/60 bg-primary/15 px-3 py-4 text-[15px] font-medium"
                    >
                      {t(locale, "scopeFeature1")}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="max-w-full rounded-md border border-primary/60 bg-primary/15 px-3 py-4 text-[15px] font-medium"
                    >
                      {t(locale, "scopeFeature2")}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="max-w-full rounded-md border border-primary/60 bg-primary/15 px-3 py-4 text-[15px] font-medium"
                    >
                      {t(locale, "scopeFeature3")}
                    </Badge>
                  </div>
                </div>
  
                {/* AI inspiration */}
                <div className="relative overflow-hidden rounded-xl border border-accent/25 bg-accent/[0.06] p-4 sm:rounded-2xl sm:p-5">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-accent/10 blur-2xl"
                  />
  
                  <div className="relative flex items-center gap-2">
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                      <Sparkles size={15} />
                    </div>
  
                    <p className="text-[16px] font-bold text-foreground">
                      {t(locale, "previewAiTitle")}
                    </p>
  
                    <Badge
                      variant="outline"
                      className="ml-auto shrink-0 border-accent/25 bg-background/70 text-[14px] text-accent"
                    >
                      {t(locale, "previewAiBadge")}
                    </Badge>
                  </div>
  
                  <p className="relative mt-3 text-[16px] leading-relaxed opacity-85 ">
                    {t(locale, "previewAiDesc")}
                  </p>
                </div>
  
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border/70 pt-4 text-[15px] font-medium opacity-85 ">
                  <span className="tracking-wide">
                    {t(locale, "previewFooter1")}
                  </span>
                  <span className="font-semibold text-primary">
                    {t(locale, "previewFooter2")}
                  </span>
                </div>
              </CardContent>
            </Card>
  
            <div className="mt-4 flex items-center justify-center gap-2 text-[14px] opacity-85  sm:justify-end">
              <ShieldCheck size={14} className="shrink-0 text-primary" />
              <span>{t(locale, "previewHint")}</span>
            </div>
          </div>
        </div>
      </section>
  
      {/* Feature pillars */}
      <section className="relative">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="mb-2 text-lg font-bold uppercase tracking-wide text-primary">
              {t(locale, "pillarsEyebrow")}
            </p>
  
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t(locale, "pillarsTitle")}
            </h2>
  
            <p className="mt-3 text-lg leading-relaxed opacity-85 ">
              {t(locale, "pillarsDesc")}
            </p>
          </div>
  
          <div className="mt-10 grid gap-4 sm:mt-12 sm:gap-5 md:grid-cols-3 lg:gap-6">
            {pillars.map(
              ({
                icon: Icon,
                number,
                titleKey,
                textKey,
                accent,
                iconBackground,
              }) => (
                <Card
                  key={number}
                  className="group relative min-w-0 overflow-hidden rounded-2xl border-border/70 bg-card/80 transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-primary/30 hover:bg-card hover:shadow-xl hover:shadow-primary/5"
                >
                  <CardContent className="p-5 sm:p-7">
                    <div className="flex items-center justify-between gap-4">
                      <div
                        className={`grid size-12 shrink-0 place-items-center rounded-xl ${iconBackground} ${accent} transition-transform duration-200 group-hover:scale-105`}
                      >
                        <Icon size={22} />
                      </div>
  
                      <span className="text-[16px] font-bold opacity-85 /60 transition-colors group-hover:text-primary">
                        {number}
                      </span>
                    </div>
  
                    <h3 className="mt-6 text-lg font-bold tracking-tight">
                      {t(locale, titleKey)}
                    </h3>
  
                    <p className="mt-2 text-[16px] leading-relaxed opacity-85 ">
                      {t(locale, textKey)}
                    </p>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>
      </section>
  
      {/* Closing call to action */}
      <section className="relative mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <Card className="relative overflow-hidden rounded-2xl border-border/70 bg-card shadow-xl shadow-black/[0.03] sm:rounded-[2rem]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-full bg-gradient-to-l from-primary/[0.09] via-accent/[0.04] to-transparent sm:w-3/4"
          />
  
          <div className="relative flex flex-col gap-7 p-5 sm:gap-8 sm:p-8 md:flex-row md:items-center md:justify-between md:p-10 lg:p-12">
            <div className="min-w-0 max-w-2xl">
              <p className="mb-2 text-[16px] font-bold uppercase tracking-wide text-accent">
                {t(locale, "ctaEyebrow")}
              </p>
  
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {t(locale, "ctaTitle")}
              </h2>
  
              <p className="mt-2 text-[16px] leading-relaxed opacity-85 ">
                {t(locale, "ctaDesc")}
              </p>
            </div>
  
            <Link
              href={catalogueHref}
              className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-fit"
            >
              {t(locale, "ctaButton")}
              <ArrowRight size={20} />
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}