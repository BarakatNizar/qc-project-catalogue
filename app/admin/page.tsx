
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

export default async function AdminDashboard() {
  const adminData = await getCountsAction();

  if ("error" in adminData) {
    return <ErrorState message={adminData.error} />;
  }

  const { data: counts } = adminData;

  const cards = [
    {
      label: "Supervisors",
      value: counts.supervisors,
      detail:
        "Manage supervisor accounts and their access to the academic project catalogue.",
      icon: UserCog,
      accent: "text-primary bg-primary/10 ring-primary/15",
    },
    {
      label: "Students",
      value: counts.students,
      detail:
        "Track the student accounts using the platform to discover and explore project ideas.",
      icon: Users,
      accent: "text-sky-600 bg-sky-500/10 ring-sky-500/15 dark:text-sky-400",
    },
    {
      label: "Projects",
      value: counts.projects,
      detail:
        "See the total number of academic project briefs available in the catalogue.",
      icon: FolderKanban,
      accent:
        "text-emerald-700 bg-emerald-500/10 ring-emerald-500/15 dark:text-emerald-400",
    },
  ];

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <PageHeading
        eyebrow="System overview"
        title="Welcome to administration"
        description="Monitor platform activity at a glance, manage supervisor access, and control whether AI-powered suggestions are available."
      />

      {/* Platform overview */}
      <section aria-labelledby="overview-heading" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2
              id="overview-heading"
              className="text-base font-bold tracking-tight text-foreground sm:text-lg"
            >
              Platform overview
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A snapshot of the accounts and project briefs on the platform.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-primary"
            />
            Current totals
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {cards.map(({ label, value, detail, icon: Icon, accent }) => (
            <Card
              key={label}
              className="group relative min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/70 via-primary/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              />

              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-5 pb-0 sm:p-6 sm:pb-0">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground/80">
                    Platform total
                  </p>
                </div>

                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-xl ring-1 transition-transform duration-200 group-hover:scale-105 ${accent}`}
                >
                  <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                </span>
              </CardHeader>

              <CardContent className="p-5 pt-4 sm:p-6 sm:pt-4">
                <CardTitle className="break-words text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
                  {value}
                </CardTitle>

                <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                  {detail}
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
              <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary sm:size-14">
                  <Bot size={26} strokeWidth={1.7} aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                      <Sparkles size={12} aria-hidden="true" />
                      AI controls
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Administrative settings
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h2
                      id="ai-controls-heading"
                      className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
                    >
                      AI service availability
                    </h2>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                      Control whether AI-powered suggestions are available
                      through the platform. This setting governs availability;
                      provider URLs, API keys, model selection, and the fixed
                      prompt remain managed in deployment configuration.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/60 p-3 sm:max-w-xl">
                    <ShieldCheck
                      size={17}
                      className="mt-0.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <p className="text-xs leading-5 text-muted-foreground">
                      Sensitive provider credentials and model configuration
                      are not edited from this page.
                    </p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 lg:pl-4">
                <Link
                  href="/admin/ai"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:brightness-95 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
                >
                  <span>Manage AI availability</span>
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>

                <p className="mt-2 text-center text-xs text-muted-foreground lg:text-right">
                  Opens AI settings
                  <ArrowUpRight
                    size={12}
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
