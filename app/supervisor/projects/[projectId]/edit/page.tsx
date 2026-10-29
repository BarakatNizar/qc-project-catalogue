import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FilePenLine,
  GraduationCap,
} from "lucide-react";

import { ProjectForm } from "@/components/project-form"; 
import { getProjectByIdAction } from "@/Interfaces/getters/project.getters";
import ErrorState from "@/components/ErrorState";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const getProjectResult = await getProjectByIdAction(projectId);

  if ("error" in getProjectResult) {
    return <ErrorState message={getProjectResult.error} />;
  }

  const { data: project } = getProjectResult;

  return (
    <main className="w-full min-w-0 space-y-5 px-3 pb-6 pt-3 sm:space-y-6 sm:px-5 lg:px-8 xl:px-10 2xl:px-12">
      <div className="flex min-w-0 flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Link
          href={`/supervisor/projects/${project.id}`}
          className="inline-flex min-h-9 items-center gap-2 self-start rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft size={16} />
          Back to project details
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5">
            <GraduationCap size={14} className="text-primary" />
            {project.projectType === "GRADUATION"
              ? "Graduation project"
              : "Pre-graduation project"}
          </span>
          {project.yearPresentation && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5">
              <CalendarDays size={13} />
              {project.yearPresentation}
            </span>
          )}
        </div>
      </div>

      <header className="relative isolate min-w-0 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.13] via-card to-card p-5 sm:p-7 lg:p-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary sm:size-12">
            <FilePenLine size={21} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary sm:text-xs">
              Project management / Edit brief
            </p>
            <h1 className="mt-2 break-words text-2xl font-black leading-tight tracking-tight [overflow-wrap:anywhere] sm:text-3xl lg:text-4xl">
              Update project
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Keep the project overview, academic context, scope boundaries,
              and technologies accurate and useful. Changes will be reflected
              in the project catalogue.
            </p>
            <div className="mt-5 flex min-w-0 items-center gap-2 border-t border-border/60 pt-4">
              <span className="size-2 shrink-0 rounded-full bg-primary" />
              <p className="min-w-0 break-words text-sm font-semibold text-foreground">
                {project.title}
              </p>
            </div>
          </div>
        </div>
      </header>

      <ProjectForm project={project} />
    </main>
  );
}
