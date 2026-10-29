
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  Eye,
  FolderKanban,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";

import { PageHeading } from "@/components/ui/page-heading";
import { Card, CardTitle } from "@/components/ui/card";
import ErrorState from "@/components/ErrorState";
import { getCountsAction } from "@/Interfaces/getters/user.getters";
import { ProjectBriefingTools } from "@/components/project-briefing-tools";

export default async function SupervisorDashboard() {
  const supervisorData = await getCountsAction();

  if ("error" in supervisorData) {
    return <ErrorState message={supervisorData.error} />;
  }

  const { data: counts, user } = supervisorData;

  const firstName = user.name.trim().split(/\s+/)[0] || "there";

  const stats = [
    {
      title: "Project briefs",
      value: counts.projects,
      icon: FolderKanban,
      href: "/supervisor/projects",
      detail: "Create, update, and maintain academic project briefs.",
      eyebrow: "PROJECT CATALOGUE",
      accent: "text-primary bg-primary/10 border-primary/15",
    },
    {
      title: "Student accounts",
      value: counts.students,
      icon: Users,
      href: "/supervisor/students",
      detail: "Manage student accounts and their access to the platform.",
      eyebrow: "STUDENT DIRECTORY",
      accent:
        "text-emerald-700 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
    },
  ];

  return (
    <div className="mx-auto w-full space-y-7 pb-8 sm:space-y-9">
      {/* Welcome header */}
      <PageHeading
        title={`Welcome, ${firstName}`}
        description="Manage the academic project catalogue and student accounts from one workspace. Keep project briefs clear, relevant, and useful for students exploring their next academic project."
        action={
          <Link
            href="/supervisor/projects/new"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
          >
            <Plus size={18} aria-hidden="true" />
            <span>Create project</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        }
      />

      {/* Dashboard metrics */}
      <section aria-label="Workspace overview" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              Your workspace at a glance
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Quick access to the two areas you manage most.
            </p>
          </div>

          <span className="text-xs text-muted-foreground">
            Select a section to get started
          </span>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {stats.map(({ title, value, icon: Icon, href, detail, eyebrow, accent }) => (
            <Link
              key={title}
              href={href}
              aria-label={`${title}: ${value}. ${detail}`}
              className="group block min-w-0 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Card className="relative h-full min-w-0 overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/5 sm:p-6">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-primary/[0.04] blur-2xl transition-colors group-hover:bg-primary/[0.09]"
                />

                <div className="relative flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 space-y-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`grid size-11 shrink-0 place-items-center rounded-2xl border ${accent}`}
                      >
                        <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
                      </span>

                      <span className="min-w-0 break-words text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {eyebrow}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <CardTitle className="break-words text-base font-bold tracking-tight text-foreground sm:text-lg">
                        {title}
                      </CardTitle>

                      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                        {detail}
                      </p>
                    </div>
                  </div>

                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-xl border border-border/70 bg-background/70 text-muted-foreground transition-all group-hover:border-primary/20 group-hover:bg-primary/10 group-hover:text-primary"
                  >
                    <ArrowUpRight size={17} />
                  </span>
                </div>

                <div className="relative mt-6 flex items-end justify-between gap-3 border-t border-border/60 pt-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Total
                    </p>
                    <p className="mt-1 break-words text-3xl font-extrabold leading-none tracking-tight text-foreground tabular-nums sm:text-4xl">
                      {value}
                    </p>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-1.5 pb-0.5 text-xs font-semibold text-primary">
                    Open section
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        
      </section>

      {/* Shared catalogue information */}
      <section aria-labelledby="catalogue-overview-title">
        <Card className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/[0.06] blur-3xl"
          />

          <div className="relative grid min-w-0 grid-cols-1 gap-7 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.7fr)] lg:items-center lg:gap-10 lg:p-8">
            <div className="min-w-0 space-y-5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                  <BookOpenCheck size={21} aria-hidden="true" />
                </span>

                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                    Catalogue overview
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Shared academic workspace
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h2
                  id="catalogue-overview-title"
                  className="max-w-xl text-xl font-extrabold leading-tight tracking-tight text-foreground sm:text-2xl"
                >
                  One shared catalogue for academic project discovery
                </h2>

                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Project briefs provide students with a starting point for
                  exploring academic ideas, understanding project scope, and
                  identifying work that aligns with their interests.
                </p>

                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Every supervisor can edit every project and manage every
                  student. The Project Supervisor name on a brief is metadata;
                  it does not determine QC account permissions.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
                <Link
                  href="/supervisor/projects"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
                >
                  <Eye size={16} className="text-primary" aria-hidden="true" />
                  Review catalogue
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>

                <Link
                  href="/supervisor/students"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
                >
                  <Users size={16} className="text-primary" aria-hidden="true" />
                  Manage students
                </Link>
              </div>
              
            </div>

            {/* Catalogue principles */}
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <FolderKanban size={17} aria-hidden="true" />
                </span>

                <div className="min-w-0 space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    Maintain project briefs
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Keep catalogue entries clear, structured, and useful for
                    student discovery.
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck size={17} aria-hidden="true" />
                </span>

                <div className="min-w-0 space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    Shared management access
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Project editing and student management are shared across
                    supervisors under the existing permission model.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </Card>
        
      </section>
      <ProjectBriefingTools/>
    
    </div>
  );
}
