import Link from "next/link";
import { 
  ArrowLeft, 
  CalendarDays, 
  CheckCircle2, 
  CircleOff, 
  Code2, 
  FileText, 
  Target, 
  Users, 
  Wrench, 
  ShieldAlert, 
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  UserCheck,
  Eye
} from "lucide-react";
import type { ProjectDto } from "@/modules/project/types";
import { AiSuggestionsPanel } from "@/components/ai-suggestions-panel";
import { SuggestionAdminList } from "@/components/suggestion-admin-list";
import { formatDate } from "@/shared/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ChangeProjectVisibility from "./changeProjectVisibility";
import DeleteProjectButton from "./deleteProjectButton";

type Suggestion = { id: string; projectId: string; responseId: string; title: string; content: string; createdAt: Date };

export function ProjectDetails({ project, suggestions, canRequestAi = false, aiEnabled = true, supervisorView = false }: {
  project: ProjectDto; suggestions: Suggestion[]; canRequestAi?: boolean; aiEnabled?: boolean; supervisorView?: boolean;
}) {
  const inScope = project.features.filter((feature) => feature.scope === "IN_SCOPE");
  const outScope = project.features.filter((feature) => feature.scope === "OUT_OF_SCOPE");
  const backHref = supervisorView ? "/supervisor/projects" : "/projects";

  return (
    <div className="page-shell space-y-8 relative">
      <div className="pointer-events-none absolute -top-12 left-1/2 -z-10 h-96 w-full -translate-x-1/2 max-w-7xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent blur-3xl opacity-70" />

      {/* Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-card/40 p-2.5 backdrop-blur-2xl shadow-2xl transition-all hover:border-white/20">
        <Button variant="ghost" size="sm" className="rounded-xl gap-2 font-semibold hover:bg-white/5">
          <Link href={backHref} className="flex items-center gap-2">
            <ArrowLeft size={18} className="text-primary transition-transform group-hover:-translate-x-1" /> Back to {supervisorView ? "project management" : "catalogue"}
          </Link>
        </Button>
        {supervisorView && (
          <div className="flex flex-wrap items-center gap-3">
            <ChangeProjectVisibility projectId={project.id} currentVisibility={project.visibility} />
            <DeleteProjectButton projectId={project.id} />
          </div>
        )}
      </div>

      {/* Header Info Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-card/90 via-card/50 to-background/80 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl">
        <div className="absolute -right-20 -top-20 -z-10 size-80 rounded-full bg-primary/15 blur-3xl" />
        
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-start">
          <div className="max-w-6xl space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="outline" className="rounded-full border-primary/40 bg-primary/15 px-4 text-xs py-4 text-center font-bold text-primary shadow-sm shadow-primary/20 backdrop-blur-md">
                <Sparkles size={13} className="mr-1.5 inline animate-pulse" />
                {project.projectType === "GRADUATION" ? "Graduation project" : "Pre-graduation project"}
              </Badge>
              {project.yearPresentation && (
                <Badge variant="outline" className="rounded-full border-white/10 bg-white/5 px-4 text-xs py-4 text-center font-medium opacity-90 backdrop-blur-md">
                  <Calendar size={13} className="mr-1.5 inline text-primary" /> {project.yearPresentation}
                </Badge>
              )}
              {supervisorView && (
                <Badge className={`rounded-full text-xs py-4 px-4 text-center font-semibold uppercase tracking-wider backdrop-blur-md ${project.visibility === "VISIBLE" ? "bg-primary/20 text-primary border border-primary/30" : "bg-warning/20 text-warning border border-warning/30 opacity-90"}`}>
                  <Eye size={13} className="mr-1.5 inline" />
                  {project.visibility.toLowerCase()}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              {project.title}
            </h1>

            <p className="max-w-4xl text-base leading-relaxed opacity-90 text-muted-foreground/90 font-normal">
              {project.summary}
            </p>

            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
              <UserCheck size={16} className="text-primary" />
              <p className="text-lg font-medium opacity-90">
                Supervisor: <span className="font-bold text-foreground">{project.projectSupervisorName}</span>
              </p>
            </div>
          </div>

          {supervisorView && (
            <Button className="rounded-2xl shadow-xl shadow-primary/25 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-bold">
              <Link href={`/supervisor/projects/${project.id}/edit`}>Edit Project Brief</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
        <div className="space-y-8">
          
          {/* Description & Core Concepts Section */}
          <section className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-white/20">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5 mb-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20 shadow-inner">
                <FileText size={22} />
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">Project description</h2>
            </div>

            <p className="text-lg leading-relaxed opacity-90 whitespace-pre-line text-muted-foreground/90">{project.description}</p>

            {project.problemStatement && (
              <div className="mt-8 rounded-2xl border border-white/10 bg-background/30 p-6 backdrop-blur-md space-y-2">
                <h3 className="font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span className="size-2 rounded-full bg-destructive" /> Problem statement
                </h3>
                <p className="text-lg leading-relaxed opacity-90/90 whitespace-pre-line text-muted-foreground/90">{project.problemStatement}</p>
              </div>
            )}

            {project.proposedSolution && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-background/30 p-6 backdrop-blur-md space-y-2">
                <h3 className="font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary" /> Proposed solution
                </h3>
                <p className="text-lg leading-relaxed opacity-90/90 whitespace-pre-line text-muted-foreground/90">{project.proposedSolution}</p>
              </div>
            )}

            {project.objectives && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-background/30 p-6 backdrop-blur-md space-y-2">
                <h3 className="flex items-center gap-2 font-bold tracking-tight text-foreground">
                  <Target size={18} className="text-primary" /> Objectives
                </h3>
                <p className="text-lg leading-relaxed opacity-90/90 whitespace-pre-line text-muted-foreground/90">{project.objectives}</p>
              </div>
            )}
          </section>

          {/* Operational Context & Parameters */}
          {(project.targetUsers || project.availableResources || project.constraints) && (
            <section className="rounded-[2.5rem] border border-white/10 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-5">
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20 shadow-inner">
                  <Layers size={22} />
                </span>
                <h2 className="text-xl font-extrabold tracking-tight">Operational parameters & context</h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                {project.targetUsers && (
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-background/60 to-background/20 p-5 space-y-2 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-lg font-bold text-primary">
                      <Users size={18} /> Target Users
                    </div>
                    <p className="text-lg leading-relaxed opacity-90 text-muted-foreground">{project.targetUsers}</p>
                  </div>
                )}
                {project.availableResources && (
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-background/60 to-background/20 p-5 space-y-2 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-lg font-bold text-primary">
                      <Wrench size={18} /> Resources
                    </div>
                    <p className="text-lg leading-relaxed opacity-90 text-muted-foreground">{project.availableResources}</p>
                  </div>
                )}
                {project.constraints && (
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-background/60 to-background/20 p-5 space-y-2 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-lg font-bold text-primary">
                      <ShieldAlert size={18} /> Constraints
                    </div>
                    <p className="text-lg leading-relaxed opacity-90 text-muted-foreground">{project.constraints}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Scope Section */}
          <section className="rounded-[2.5rem] border border-white/10 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-400 ring-1 ring-emerald-500/20 shadow-inner">
                <CheckCircle2 size={22} />
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">Features in scope</h2>
            </div>

            {inScope.length ? (
              <div className="grid gap-3">
                {inScope.map((feature) => (
                  <div key={feature.id} className="flex gap-3.5 items-start rounded-xl border border-white/5 bg-white/[0.02] p-4 text-lg leading-relaxed opacity-90 backdrop-blur-sm transition-colors hover:bg-white/[0.04]">
                    <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-400" />
                    <span className="text-muted-foreground/90">{feature.content}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-lg opacity-90/60 italic">No in-scope features specified.</p>
            )}

            <div className="border-t border-white/10 pt-6 space-y-4">
              <h3 className="flex items-center gap-2 font-bold tracking-tight opacity-90 text-muted-foreground">
                <CircleOff size={18} className="text-muted-foreground/50" /> Out of scope
              </h3>
              {outScope.length ? (
                <div className="grid gap-3">
                  {outScope.map((feature) => (
                    <div key={feature.id} className="flex gap-3.5 items-start rounded-xl border border-white/5 bg-white/[0.01] p-3.5 text-lg leading-relaxed opacity-90/80">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                      <span className="text-muted-foreground/80">{feature.content}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-lg opacity-90/60 italic">No out-of-scope items specified.</p>
              )}
            </div>
          </section>

          {/* Technologies Section */}
          <section className="rounded-[2.5rem] border border-white/10 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20 shadow-inner">
                <Code2 size={22} />
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">Technologies</h2>
            </div>
            {project.technologies.length ? (
              <div className="flex flex-wrap gap-2.5">
                {project.technologies.map((technology) => (
                  <Badge key={technology.id} variant="secondary" className="rounded-xl px-4 py-2 text-lg font-medium bg-background/80 border border-white/10 shadow-md backdrop-blur-md hover:border-primary/50 transition-colors">
                    {technology.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-lg opacity-90/60 italic">No technologies specified.</p>
            )}
          </section>

          {/* Images Gallery */}
          {project.images.length > 0 && (
            <section className="rounded-[2.5rem] border border-white/10 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <h2 className="text-xl font-extrabold tracking-tight">Project images</h2>
                <Badge variant="outline" className="text-lg font-mono rounded-full border-primary/30 bg-primary/10 text-primary px-3 py-1">
                  {project.counts.images} attached
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {project.images.map((image) => (
                  <a key={image.id} href={`/projects/${project.id}/images/${image.id}`} target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-2xl border border-white/10 bg-background/40 shadow-lg transition-all duration-300 hover:border-primary/50 hover:shadow-primary/10">
                    <img loading="lazy" src={`/projects/${project.id}/images/${image.id}`} alt={image.fileName ?? `Project screenshot ${image.sortOrder + 1}`} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 flex items-end p-3">
                      <span className="flex items-center gap-1.5 truncate text-[13px] font-medium text-white">
                        <ExternalLink size={13} /> {image.fileName ?? "View Image"}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Info & AI Panel */}
        <aside className="space-y-8">
          <section className="rounded-[2.5rem] border border-white/10 bg-card/60 p-6 backdrop-blur-xl shadow-2xl space-y-6">
            <p className="font-mono text-lg font-bold uppercase tracking-widest text-primary flex items-center gap-2 border-b border-white/10 pb-4">
              <Sparkles size={18} /> Brief Details
            </p>
            <div className="space-y-5 text-lg">
              <div className="rounded-xl bg-white/[0.02] p-3.5 border border-white/5">
                <p className="text-muted-foreground text-sm">Project type</p>
                <p className="mt-1 font-semibold text-foreground text-lg">{project.projectType === "GRADUATION" ? "Graduation" : "Pre-graduation / semester"}</p>
              </div>
              {project.yearPresentation && (
                <div className="rounded-xl bg-white/[0.02] p-3.5 border border-white/5">
                  <p className="text-muted-foreground text-sm">Year & Presentation Term</p>
                  <p className="mt-1 font-semibold text-foreground text-lg">{project.yearPresentation}</p>
                </div>
              )}
              <div className="rounded-xl bg-white/[0.02] p-3.5 border border-white/5">
                <p className="text-muted-foreground text-sm">Project supervisor</p>
                <p className="mt-1 font-semibold text-foreground text-lg">{project.projectSupervisorName}</p>
                <p className="mt-1 text-xs leading-relaxed opacity-90/70 text-muted-foreground">Project metadata only; independent of QC account permissions.</p>
              </div>
              <div className="rounded-xl bg-white/[0.02] p-3.5 border border-white/5">
                <p className="flex items-center gap-1.5 text-muted-foreground text-sm"><CalendarDays size={15} className="text-primary" /> Created at</p>
                <p className="mt-1 font-semibold text-foreground text-lg">{formatDate(project.createdAt)}</p>
              </div>
              <div className="rounded-xl bg-white/[0.02] p-3.5 border border-white/5">
                <p className="flex items-center gap-1.5 text-muted-foreground text-sm"><CalendarDays size={15} className="text-primary" /> Last updated</p>
                <p className="mt-1 font-semibold text-foreground text-lg">{formatDate(project.updatedAt)}</p>
              </div>
              <div className="rounded-xl bg-white/[0.02] p-3.5 border border-white/5">
                <p className="text-muted-foreground text-sm">Catalogue visibility</p>
                <p className="mt-1 font-semibold text-foreground text-lg">{project.visibility === "VISIBLE" ? "Visible to students" : "Hidden from students"}</p>
              </div>
              <div className="border-t border-white/10 pt-4 flex justify-between items-center px-1">
                <span className="text-muted-foreground text-sm">Suggestions count:</span>
                <span className="font-mono font-bold text-foreground bg-primary/10 border border-primary/20 px-3 py-0.5 rounded-full text-lg text-primary">{project.counts.suggestions}</span>
              </div>
            </div>
          </section>

          {supervisorView ? (
            <section className="rounded-[2.5rem] border border-white/10 bg-card/60 p-6 backdrop-blur-xl shadow-2xl space-y-4">
              <h2 className="text-lg font-bold tracking-tight">Manage shared suggestions</h2>
              <p className="text-lg leading-relaxed opacity-90 text-muted-foreground">Removing a suggestion deletes it permanently from the shared list and future AI context. Its parent AI response remains for history.</p>
              <SuggestionAdminList projectId={project.id} suggestions={suggestions} />
            </section>
          ) : (
            <AiSuggestionsPanel projectId={project.id} initialSuggestions={suggestions} canRequest={canRequestAi} aiEnabled={aiEnabled} />
          )}
        </aside>
      </div>
    </div>
  );
}




const panelClass =
  "group relative isolate rounded-[2rem] border border-border/60 " +
  "bg-gradient-to-br from-card via-card/95 to-primary/[0.035] " +
  "shadow-lg shadow-foreground/[0.025] " +
  "transition-all duration-300 " +
  "hover:-translate-y-0.5 hover:border-primary/25 " +
  "hover:shadow-xl hover:shadow-primary/10 " +
  "before:pointer-events-none before:absolute before:inset-x-10 " +
  "before:top-0 before:h-px before:content-[''] " +
  "before:bg-gradient-to-r before:from-transparent " +
  "before:via-primary/60 before:to-transparent";

const sectionIconClass =
  "grid size-10 shrink-0 place-items-center rounded-2xl " +
  "border border-primary/15 " +
  "bg-gradient-to-br from-primary/15 via-primary/[0.06] to-transparent " +
  "text-primary shadow-inner shadow-primary/10 " +
  "transition-transform duration-300 " +
  "group-hover:rotate-3 group-hover:scale-105";

const detailBlockClass =
  "rounded-2xl border border-border/50 border-l-2 border-l-primary/35 " +
  "bg-gradient-to-r from-primary/[0.045] via-background/20 to-transparent " +
  "px-4 py-4 transition-colors duration-300 hover:border-l-primary/70";

const miniCardClass =
  "group/mini relative rounded-2xl border border-border/60 " +
  "bg-gradient-to-br from-background/70 via-background/40 to-primary/[0.035] " +
  "p-4 space-y-2 transition-all duration-300 " +
  "hover:-translate-y-1 hover:border-primary/25 " +
  "hover:shadow-lg hover:shadow-primary/5";

const metadataItemClass =
  "rounded-xl border border-border/40 bg-background/25 px-3 py-2.5 " +
  "transition-all duration-200 hover:border-primary/20 " +
  "hover:bg-primary/[0.035]";

export function ProjectDetailsV2({
  project,
  suggestions,
  canRequestAi = false,
  aiEnabled = true,
  supervisorView = false,
}: {
  project: ProjectDto;
  suggestions: Suggestion[];
  canRequestAi?: boolean;
  aiEnabled?: boolean;
  supervisorView?: boolean;
}) {
  const inScope = project.features.filter(
    (feature) => feature.scope === "IN_SCOPE"
  );

  const outScope = project.features.filter(
    (feature) => feature.scope === "OUT_OF_SCOPE"
  );

  const backHref = supervisorView ? "/supervisor/projects" : "/projects";

  return (
    <div className="page-shell space-y-6">
      <div className="relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-card/95 via-card/75 to-primary/[0.06] px-4 py-3 shadow-md shadow-foreground/[0.02] backdrop-blur-xl sm:px-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-1/4 w-32 bg-primary/[0.035] blur-2xl"
        />

        <Button
          variant="ghost"
          size="sm"
          className="relative gap-2 rounded-xl font-semibold transition-all duration-200 hover:bg-primary/10 hover:text-primary"
        >
          <Link href={backHref} className="flex items-center gap-2">
            <ArrowLeft
              size={18}
              className="transition-transform duration-200 group-hover:-translate-x-1"
            />
            Back to {supervisorView ? "project management" : "catalogue"}
          </Link>
        </Button>

        {supervisorView && (
          <div className="relative flex flex-wrap items-center gap-3">
            <ChangeProjectVisibility
              projectId={project.id}
              currentVisibility={project.visibility}
            />

            <DeleteProjectButton projectId={project.id} />
          </div>
        )}
      </div>

      <header className="relative isolate overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/[0.10] via-card/90 to-card/55 p-6 shadow-xl shadow-primary/[0.045] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 left-1/3 size-64 rounded-full bg-primary/[0.065] blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-8 left-0 w-1 rounded-r-full bg-gradient-to-b from-primary via-primary/40 to-transparent"
        />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="max-w-6xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-full border-primary/30 bg-gradient-to-r from-primary/15 to-primary/[0.05] px-3 py-2.5 text-center text-xs font-bold text-primary shadow-sm shadow-primary/5"
              >
                {project.projectType === "GRADUATION"
                  ? "Graduation project"
                  : "Pre-graduation project"}
              </Badge>

              {project.yearPresentation && (
                <Badge
                  variant="outline"
                  className="rounded-full border-border/60 bg-background/45 px-3 py-2.5 text-center text-xs font-medium opacity-90 backdrop-blur-md"
                >
                  <Calendar size={12} className="mr-1 inline" />
                  {project.yearPresentation}
                </Badge>
              )}

              {supervisorView && (
                <Badge
                  className={`rounded-full border px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider shadow-sm ${project.visibility === "VISIBLE"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-warning/30 bg-warning/10 text-warning"
                    }`}
                >
                  {project.visibility.toLowerCase()}
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight [text-wrap:balance] sm:text-4xl lg:text-5xl">
                {project.title}
              </h1>

              <div
                aria-hidden="true"
                className="h-1 w-20 rounded-full bg-gradient-to-r from-primary via-primary/50 to-transparent"
              />

              <p className="max-w-4xl text-base leading-relaxed opacity-90">
                {project.summary}
              </p>
            </div>

            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-border/40 bg-background/25 px-3 py-2 backdrop-blur-sm">
              <span className="text-lg font-medium opacity-90">
                Project supervisor:
              </span>

              <span className="text-lg font-bold text-foreground">
                {project.projectSupervisorName}
              </span>
            </div>
          </div>

          {supervisorView && (
            <div className="relative shrink-0">
              <Button className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary to-primary/85 shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25">
                <Link href={`/supervisor/projects/${project.id}/edit`}>
                  Edit Project Brief
                </Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
        <div className="min-w-0 space-y-6">
          <section className={`${panelClass} space-y-6 p-6 sm:p-8`}>
            <div className="flex items-center gap-3">
              <span className={sectionIconClass}>
                <FileText size={20} />
              </span>

              <div className="min-w-0">
                <h2 className="text-xl font-extrabold tracking-tight">
                  Project description
                </h2>

                <div className="mt-1 h-0.5 w-12 rounded-full bg-gradient-to-r from-primary/60 to-transparent" />
              </div>
            </div>

            <p className="whitespace-pre-line text-lg leading-relaxed opacity-90">
              {project.description}
            </p>

            {project.problemStatement && (
              <div className={detailBlockClass}>
                <h3 className="mb-2 font-bold tracking-tight text-foreground">
                  Problem statement
                </h3>

                <p className="whitespace-pre-line text-lg leading-relaxed opacity-90">
                  {project.problemStatement}
                </p>
              </div>
            )}

            {project.proposedSolution && (
              <div className={detailBlockClass}>
                <h3 className="mb-2 font-bold tracking-tight text-foreground">
                  Proposed solution
                </h3>

                <p className="whitespace-pre-line text-lg leading-relaxed opacity-90">
                  {project.proposedSolution}
                </p>
              </div>
            )}

            {project.objectives && (
              <div className={detailBlockClass}>
                <h3 className="mb-2 flex items-center gap-2 font-bold tracking-tight text-foreground">
                  <Target size={17} className="shrink-0 text-primary" />
                  Objectives
                </h3>

                <p className="whitespace-pre-line text-lg leading-relaxed opacity-90">
                  {project.objectives}
                </p>
              </div>
            )}
          </section>

          {(project.targetUsers ||
            project.availableResources ||
            project.constraints) && (
              <section className={`${panelClass} space-y-6 p-6 sm:p-8`}>
                <div className="flex items-center gap-3">
                  <span className={sectionIconClass}>
                    <Layers size={20} />
                  </span>

                  <div className="min-w-0">
                    <h2 className="text-xl font-extrabold tracking-tight">
                      Operational parameters & context
                    </h2>

                    <div className="mt-1 h-0.5 w-12 rounded-full bg-gradient-to-r from-primary/60 to-transparent" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {project.targetUsers && (
                    <div className={miniCardClass}>
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute right-0 top-0 size-20 rounded-full bg-primary/[0.06] blur-2xl"
                      />

                      <div className="relative flex items-center gap-2 text-lg font-bold text-primary">
                        <Users size={15} />
                        Target Users
                      </div>

                      <p className="relative text-lg leading-relaxed opacity-90">
                        {project.targetUsers}
                      </p>
                    </div>
                  )}

                  {project.availableResources && (
                    <div className={miniCardClass}>
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute right-0 top-0 size-20 rounded-full bg-primary/[0.06] blur-2xl"
                      />

                      <div className="relative flex items-center gap-2 text-lg font-bold text-primary">
                        <Wrench size={15} />
                        Available Resources
                      </div>

                      <p className="relative text-lg leading-relaxed opacity-90">
                        {project.availableResources}
                      </p>
                    </div>
                  )}

                  {project.constraints && (
                    <div className={miniCardClass}>
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute right-0 top-0 size-20 rounded-full bg-primary/[0.06] blur-2xl"
                      />

                      <div className="relative flex items-center gap-2 text-lg font-bold text-primary">
                        <ShieldAlert size={15} />
                        Constraints
                      </div>

                      <p className="relative text-lg leading-relaxed opacity-90">
                        {project.constraints}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

          <section className={`${panelClass} space-y-6 p-6 sm:p-8`}>
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-success/20 bg-gradient-to-br from-success/15 to-success/[0.035] text-success shadow-inner shadow-success/5 transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105">
                <CheckCircle2 size={20} />
              </span>

              <div className="min-w-0">
                <h2 className="text-xl font-extrabold tracking-tight">
                  Features in scope
                </h2>

                <div className="mt-1 h-0.5 w-12 rounded-full bg-gradient-to-r from-success/70 to-transparent" />
              </div>
            </div>

            {inScope.length ? (
              <ul className="space-y-2">
                {inScope.map((feature) => (
                  <li
                    key={feature.id}
                    className="flex gap-3 rounded-xl border border-transparent px-3 py-2 text-lg leading-relaxed opacity-90 transition-all duration-200 hover:border-success/15 hover:bg-success/[0.035]"
                  >
                    <CheckCircle2
                      size={16}
                      className="mt-1 shrink-0 text-success"
                    />

                    <span>{feature.content}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-lg opacity-60">
                No in-scope features have been listed.
              </p>
            )}

            <div className="relative space-y-3 border-t border-border/60 pt-6 before:pointer-events-none before:absolute before:-top-px before:left-0 before:h-px before:w-1/3 before:bg-gradient-to-r before:from-muted-foreground/30 before:to-transparent">
              <h3 className="flex items-center gap-2 font-bold tracking-tight opacity-90">
                <CircleOff size={17} className="opacity-50" />
                Out of scope
              </h3>

              {outScope.length ? (
                <ul className="space-y-2">
                  {outScope.map((feature) => (
                    <li
                      key={feature.id}
                      className="flex gap-3 rounded-xl border border-transparent px-3 py-2 text-lg leading-relaxed opacity-80 transition-all duration-200 hover:border-border/60 hover:bg-background/35"
                    >
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />

                      <span>{feature.content}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-lg opacity-60">
                  No out-of-scope items have been specified.
                </p>
              )}
            </div>
          </section>

          <section className={`${panelClass} space-y-4 p-6 sm:p-8`}>
            <div className="flex items-center gap-3">
              <span className={sectionIconClass}>
                <Code2 size={20} />
              </span>

              <div className="min-w-0">
                <h2 className="text-xl font-extrabold tracking-tight">
                  Technologies
                </h2>

                <div className="mt-1 h-0.5 w-12 rounded-full bg-gradient-to-r from-primary/60 to-transparent" />
              </div>
            </div>

            {project.technologies.length ? (
              <div className="flex flex-wrap gap-2.5">
                {project.technologies.map((technology) => (
                  <Badge
                    key={technology.id}
                    variant="secondary"
                    className="rounded-xl border border-border/60 bg-gradient-to-br from-background/80 to-primary/[0.045] px-3.5 py-1.5 text-lg font-semibold shadow-sm shadow-foreground/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/10 hover:shadow-md hover:shadow-primary/5"
                  >
                    {technology.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-lg opacity-60">
                No technologies specified.
              </p>
            )}
          </section>

          {project.images.length > 0 && (
            <section className={`${panelClass} space-y-4 p-6 sm:p-8`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">
                    Project images
                  </h2>

                  <div className="mt-1 h-0.5 w-12 rounded-full bg-gradient-to-r from-primary/60 to-transparent" />
                </div>

                <Badge
                  variant="outline"
                  className="rounded-xl border-border/60 bg-background/50 px-3 py-1.5 text-lg font-mono"
                >
                  {project.counts.images} attached
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {project.images.map((image) => (
                  <a
                    key={image.id}
                    href={`/projects/${project.id}/images/${image.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group/image relative isolate overflow-hidden rounded-2xl border border-border/60 bg-background/40 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        loading="lazy"
                        src={`/projects/${project.id}/images/${image.id}`}
                        alt={
                          image.fileName ??
                          `Project screenshot ${image.sortOrder + 1}`
                        }
                        className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover/image:scale-110"
                      />

                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover/image:opacity-30"
                      />

                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-t-2xl ring-1 ring-inset ring-white/10"
                      />
                    </div>

                    <span className="block truncate border-t border-border/40 bg-gradient-to-r from-background/80 to-background/40 p-2.5 text-[13px] font-medium opacity-90 transition-colors duration-200 group-hover/image:text-primary">
                      {image.fileName ?? "Project image"}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="min-w-0 space-y-6">
          <section className={`${panelClass} space-y-4 p-6`}>
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/[0.08] text-primary">
                <Layers size={18} />
              </span>

              <div>
                <p className="font-mono text-lg font-bold uppercase tracking-widest text-primary">
                  Brief information
                </p>

                <div className="mt-1 h-px w-full bg-gradient-to-r from-primary/40 to-transparent" />
              </div>
            </div>

            <div className="space-y-2 text-lg">
              <div className={metadataItemClass}>
                <p className="opacity-70">Project type</p>

                <p className="mt-1 font-semibold text-foreground text-lg">
                  {project.projectType === "GRADUATION"
                    ? "Graduation"
                    : "Pre-graduation / semester"}
                </p>
              </div>

              {project.yearPresentation && (
                <div className={metadataItemClass}>
                  <p className="opacity-70">Year & Presentation Term</p>

                  <p className="mt-1 font-semibold text-foreground text-lg">
                    {project.yearPresentation}
                  </p>
                </div>
              )}

              <div className={metadataItemClass}>
                <p className="opacity-70">Project supervisor</p>

                <p className="mt-1 font-semibold text-foreground text-lg">
                  {project.projectSupervisorName}
                </p>

                <p className="mt-1 leading-relaxed opacity-70">
                  Project metadata only; independent of QC account permissions.
                </p>
              </div>

              <div className={metadataItemClass}>
                <p className="flex items-center gap-1.5 opacity-70">
                  <CalendarDays size={13} />
                  Created at
                </p>

                <p className="mt-1 font-semibold text-foreground text-lg">
                  {formatDate(project.createdAt)}
                </p>
              </div>

              <div className={metadataItemClass}>
                <p className="flex items-center gap-1.5 opacity-70">
                  <CalendarDays size={13} />
                  Last updated
                </p>

                <p className="mt-1 font-semibold text-foreground text-lg">
                  {formatDate(project.updatedAt)}
                </p>
              </div>

              <div className={metadataItemClass}>
                <p className="opacity-70">Catalogue visibility</p>

                <p className="mt-1 flex items-center gap-2 font-semibold text-foreground text-lg">
                  <span
                    className={`size-2 shrink-0 rounded-full ${project.visibility === "VISIBLE"
                        ? "bg-success shadow-[0_0_10px_var(--color-success)]"
                        : "bg-muted-foreground/50"
                      }`}
                  />

                  {project.visibility === "VISIBLE"
                    ? "Visible to students"
                    : "Hidden from students"}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/15 bg-gradient-to-r from-primary/[0.08] to-transparent px-3 py-3">
                <span className="opacity-80">Suggestions count:</span>

                <span className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-1 font-bold text-foreground">
                  {project.counts.suggestions}
                </span>
              </div>
            </div>
          </section>

          {supervisorView ? (
            <section className={`${panelClass} space-y-4 p-6`}>
              <div className="flex items-center gap-3">
                <span className={sectionIconClass}>
                  <Layers size={20} />
                </span>

                <h2 className="text-lg font-bold tracking-tight">
                  Manage shared suggestions
                </h2>
              </div>

              <p className="text-lg leading-relaxed opacity-80">
                Removing a suggestion deletes it permanently from the shared
                list and future AI context. Its parent AI response remains for
                history.
              </p>

              <div className="border-t border-border/50 pt-4">
                <SuggestionAdminList
                  projectId={project.id}
                  suggestions={suggestions}
                />
              </div>
            </section>
          ) : (
            <AiSuggestionsPanel
              projectId={project.id}
              initialSuggestions={suggestions}
              canRequest={canRequestAi}
              aiEnabled={aiEnabled}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
