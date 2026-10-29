
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleOff,
  Code2,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  Layers3,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
  UserCheck,
  Wrench,
} from "lucide-react";

import type { ProjectDto } from "@/modules/project/types";
import { AiSuggestionsPanel } from "@/components/ai-suggestions-panel";
import { SuggestionAdminList } from "@/components/suggestion-admin-list";
import { formatDate } from "@/shared/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ChangeProjectVisibility from "./changeProjectVisibility";
import DeleteProjectButton from "./deleteProjectButton";

type Suggestion = {
  id: string;
  projectId: string;
  responseId: string;
  title: string;
  content: string;
  createdAt: Date;
};

type ProjectDetailsProps = {
  project: ProjectDto;
  suggestions: Suggestion[];
  canRequestAi?: boolean;
  aiEnabled?: boolean;
  supervisorView?: boolean;
};

const panelClass =
  "min-w-0 rounded-2xl border border-border/70 bg-card/70";

function SectionHeading({
  icon,
  eyebrow,
  title,
  description,
  trailing,
}: {
  icon: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        )}

        <h2 className="break-words text-base font-bold tracking-tight sm:text-lg">
          {title}
        </h2>

        {description && (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`${panelClass} p-4 sm:p-5 lg:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

/**
 * Native, keyboard-accessible accordion.
 *
 * The full text is rendered only in the details body, not in the summary.
 * It remains collapsed until the user opens the section.
 */
function ExpandableSection({
  title,
  content,
  icon,
  index,
}: {
  title: string;
  content: string | null | undefined;
  icon: ReactNode;
  index?: string;
}) {
  if (!content?.trim()) return null;

  return (
    <details className="group min-w-0 overflow-hidden rounded-xl border border-border/70 bg-background/25 transition-colors open:border-primary/30 open:bg-background/50">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/[0.09] text-primary">
          {icon}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            {index && (
              <span className="shrink-0 font-mono text-xs text-primary/80">
                {index}
              </span>
            )}
            <span className="break-words text-sm font-semibold text-foreground sm:text-base">
              {title}
            </span>
          </span>

          <span className="mt-1 block text-xs text-muted-foreground">
            Open to read full section
          </span>
        </span>

        <ChevronDown
          aria-hidden="true"
          size={18}
          className="shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-border/60 px-4 py-4 sm:px-5 sm:py-5">
        <p className="whitespace-pre-line break-words text-sm leading-7 text-foreground/85 [overflow-wrap:anywhere]">
          {content}
        </p>
      </div>
    </details>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-border/60 bg-card/65 p-3 sm:p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/[0.09] text-primary">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-1 break-words text-sm font-bold leading-5">
          {value}
        </div>
      </div>
    </div>
  );
}

function MetadataRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4 border-b border-border/50 py-3 last:border-0 last:pb-0">
      <span className="shrink-0 text-xs text-muted-foreground">
        {label}
      </span>
      <div className="min-w-0 text-right text-sm font-medium">
        {children}
      </div>
    </div>
  );
}

function FeatureList({
  title,
  features,
  included,
  emptyMessage,
}: {
  title: string;
  features: ProjectDto["features"];
  included: boolean;
  emptyMessage: string;
}) {
  return (
    <section className="min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        {included ? (
          <CheckCircle2 size={17} className="shrink-0 text-success" />
        ) : (
          <CircleOff size={17} className="shrink-0 text-muted-foreground" />
        )}

        <h3 className="min-w-0 break-words text-sm font-bold sm:text-base">
          {title}
        </h3>

        <Badge variant="secondary" className="ml-auto shrink-0">
          {features.length}
        </Badge>
      </div>

      {features.length > 0 ? (
        <ul className="mt-3 space-y-2 overflow-y-auto max-h-[500px]">
          {features.map((feature) => (
            <li
              key={feature.id}
              className="flex min-w-0 items-start gap-3 rounded-xl border border-border/50 bg-background/35 p-3"
            >
              {included ? (
                <Check
                  size={15}
                  className="mt-1 shrink-0 text-success"
                />
              ) : (
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
              )}

              <span className="min-w-0 whitespace-pre-line break-words text-sm leading-6 text-foreground/80 [overflow-wrap:anywhere]">
                {feature.content}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-border/70 p-4 text-sm leading-6 text-muted-foreground">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}

export function ProjectDetails({
  project,
  suggestions,
  canRequestAi = false,
  aiEnabled = true,
  supervisorView = false,
}: ProjectDetailsProps) {
  const inScope = project.features.filter(
    (feature) => feature.scope === "IN_SCOPE"
  );

  const outScope = project.features.filter(
    (feature) => feature.scope === "OUT_OF_SCOPE"
  );

  const backHref = supervisorView
    ? "/supervisor/projects"
    : "/projects";

  const projectType =
    project.projectType === "GRADUATION"
      ? "Graduation project"
      : "Pre-graduation project";

  return (
    <main className="w-full min-w-0 space-y-5 px-3 pb-10 pt-3 sm:space-y-6 sm:px-5 lg:px-8 xl:px-10 2xl:px-12">
      {/* Top navigation */}
      <nav className="flex min-w-0 flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Button
          
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 sm:w-auto"
        >
          <Link href={backHref} className="flex items-center gap-2 duration-200 hover:gap-5">
            <ArrowLeft size={16} />
            Back to {supervisorView ? "project management" : "catalogue"}
          </Link>
        </Button>

        {supervisorView && (
          <div className="flex min-w-0 gap-2 sm:flex-wrap sm:items-center">
            <ChangeProjectVisibility
              projectId={project.id}
              currentVisibility={project.visibility}
            />
            <DeleteProjectButton projectId={project.id} />
          </div>
        )}
      </nav>

      {/* Full-width project header */}
      <header className="relative isolate min-w-0 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.13] via-card to-card">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 -z-10 size-80 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0 p-5 sm:p-7 lg:p-9">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge className="gap-1.5 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15">
                <GraduationCap size={13} />
                {projectType}
              </Badge>

              {project.yearPresentation && (
                <Badge variant="outline" className="gap-1.5">
                  <CalendarDays size={12} />
                  {project.yearPresentation}
                </Badge>
              )}

              {supervisorView && (
                <Badge
                  variant="outline"
                  className={
                    project.visibility === "VISIBLE"
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-muted-foreground/30 bg-muted text-muted-foreground"
                  }
                >
                  <Eye size={12} className="mr-1" />
                  {project.visibility === "VISIBLE" ? "Published" : "Hidden"}
                </Badge>
              )}
            </div>

            <h1 className="mt-5 max-w-5xl break-words text-2xl font-black leading-tight tracking-tight [overflow-wrap:anywhere] sm:text-3xl lg:text-4xl xl:text-5xl">
              {project.title}
            </h1>

            <div className="mt-4 h-1 w-16 rounded-full bg-primary" />

            {project.summary && (
              <p className="mt-5 max-w-4xl whitespace-pre-line break-words text-sm leading-7 text-muted-foreground sm:text-base">
                {project.summary}
              </p>
            )}

            <div className="mt-6 flex min-w-0 flex-col gap-4 border-t border-border/60 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-2.5">
                <UserCheck
                  size={16}
                  className="mt-0.5 shrink-0 text-primary"
                />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Project supervisor
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold">
                    {project.projectSupervisorName || "Not specified"}
                  </p>
                </div>
              </div>

              {supervisorView && (
                <Button  className="w-full sm:w-auto">
                  <Link href={`/supervisor/projects/${project.id}/edit`}>
                    Edit project brief
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Header side information */}
          <div className="grid content-start grid-cols-2 gap-3 border-t border-border/60 bg-background/20 p-4 sm:p-5 lg:grid-cols-1 lg:border-l lg:border-t-0 lg:p-6">
            <div className="col-span-2 lg:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Catalogue status
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`size-2 shrink-0 rounded-full ${
                    project.visibility === "VISIBLE"
                      ? "bg-success"
                      : "bg-muted-foreground/50"
                  }`}
                />
                <span className="text-sm font-semibold">
                  {project.visibility === "VISIBLE"
                    ? "Visible to students"
                    : "Hidden from students"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/60 p-3">
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="mt-1 break-words text-sm font-semibold">
                {formatDate(project.createdAt)}
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/60 p-3">
              <p className="text-xs text-muted-foreground">Last updated</p>
              <p className="mt-1 break-words text-sm font-semibold">
                {formatDate(project.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Project metrics */}
      <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label="Included features"
          value={inScope.length}
          icon={<CheckCircle2 size={18} />}
        />
        <Metric
          label="Excluded features"
          value={outScope.length}
          icon={<ShieldAlert size={18} />}
        />
        <Metric
          label="Technologies"
          value={project.technologies.length}
          icon={<Code2 size={18} />}
        />
        <Metric
          label="AI suggestions"
          value={project.counts.suggestions}
          icon={<Sparkles size={18} />}
        />
      </div>

      {/* Full-width responsive content grid */}
      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-12 xl:gap-6">
        {/* Main project content */}
        <div className="min-w-0 space-y-5 xl:col-span-8">
          <Panel>
            <SectionHeading
              icon={<FileText size={19} />}
              eyebrow="Project documentation"
              title="Academic brief"
              description="Each section opens independently, so you can focus on the information you need."
              trailing={
                <Badge variant="outline" className="hidden sm:inline-flex">
                  {[
                    project.description,
                    project.problemStatement,
                    project.proposedSolution,
                    project.objectives,
                  ].filter((value) => Boolean(value?.trim())).length}{" "}
                  sections
                </Badge>
              }
            />

            <div className="mt-5 space-y-3">
              <ExpandableSection
                index="01"
                title="Project description"
                content={project.description}
                icon={<FileText size={15} />}
              />

              <ExpandableSection
                index="02"
                title="Problem statement"
                content={project.problemStatement}
                icon={<ShieldAlert size={15} />}
              />

              <ExpandableSection
                index="03"
                title="Proposed solution"
                content={project.proposedSolution}
                icon={<Lightbulb size={15} />}
              />

              <ExpandableSection
                index="04"
                title="Project objectives"
                content={project.objectives}
                icon={<Target size={15} />}
              />
            </div>
          </Panel>

          {/* Context */}
          {(project.targetUsers ||
            project.availableResources ||
            project.constraints) && (
            <Panel>
              <SectionHeading
                icon={<Layers3 size={19} />}
                eyebrow="Planning context"
                title="Operational parameters"
                description="Additional information that defines the environment and limits of the project."
              />

              <div className="mt-5 space-y-3">
                <ExpandableSection
                  title="Target users"
                  content={project.targetUsers}
                  icon={<Users size={15} />}
                />

                <ExpandableSection
                  title="Available resources"
                  content={project.availableResources}
                  icon={<Wrench size={15} />}
                />

                <ExpandableSection
                  title="Constraints"
                  content={project.constraints}
                  icon={<ShieldAlert size={15} />}
                />
              </div>
            </Panel>
          )}

          {/* Scope */}
          <Panel>
            <SectionHeading
              icon={<Target size={19} />}
              eyebrow="Feature boundaries"
              title="Project scope"
              description="Separate what the project intends to deliver from what is explicitly excluded."
            />

            <div className="mt-5 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-5">
              <FeatureList
                title="In scope"
                features={inScope}
                included
                emptyMessage="No included features have been specified."
              />

              <div className="min-w-0 border-t border-border/60 pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                <FeatureList
                  title="Out of scope"
                  features={outScope}
                  included={false}
                  emptyMessage="No excluded features have been specified."
                />
              </div>
            </div>
          </Panel>

          {/* Technologies */}
          <Panel>
            <SectionHeading
              icon={<Code2 size={19} />}
              eyebrow="Implementation"
              title="Technology stack"
              description="Tools and technologies identified in the project brief."
            />

            {project.technologies.length > 0 ? (
              <div className="mt-5 flex min-w-0 flex-wrap gap-2">
                {project.technologies
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((technology) => (
                    <Badge
                      key={technology.id}
                      variant="secondary"
                      className="max-w-full break-words rounded-lg border border-border/60 px-3 py-1.5 text-xs"
                    >
                      {technology.name}
                    </Badge>
                  ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                No technologies have been specified.
              </p>
            )}
          </Panel>

          {/* Images */}
          {project.images.length > 0 && (
            <Panel>
              <SectionHeading
                icon={<ExternalLink size={19} />}
                eyebrow="Visual material"
                title="Project gallery"
                description="Open an image to view it separately."
                trailing={
                  <Badge variant="secondary">
                    {project.counts.images}
                  </Badge>
                }
              />

              <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-3">
                {project.images
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((image) => (
                    <a
                      key={image.id}
                      href={`/projects/${project.id}/images/${image.id}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${image.fileName ?? `project image ${image.sortOrder + 1}`}`}
                      className="group min-w-0 overflow-hidden rounded-xl border border-border/70 bg-background/30 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <img
                        loading="lazy"
                        src={`/projects/${project.id}/images/${image.id}`}
                        alt={
                          image.fileName ??
                          `Project image ${image.sortOrder + 1}`
                        }
                        className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />

                      <div className="flex min-w-0 items-center gap-2 border-t border-border/60 px-3 py-2.5">
                        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                          {image.fileName ?? "Project image"}
                        </span>
                        <ExternalLink
                          size={13}
                          className="shrink-0 text-primary"
                        />
                      </div>
                    </a>
                  ))}
              </div>
            </Panel>
          )}
        </div>

        {/* Information and suggestions sidebar */}
        <aside className="grid min-w-0 grid-cols-1 items-start gap-5 xl:col-span-4 xl:grid-cols-1">
          <Panel>
            <SectionHeading
              icon={<GraduationCap size={19} />}
              eyebrow="At a glance"
              title="Project information"
            />

            <div className="mt-4">
              <MetadataRow label="Project type">
                {projectType}
              </MetadataRow>

              <MetadataRow label="Presentation year">
                {project.yearPresentation || "Not specified"}
              </MetadataRow>

              <MetadataRow label="Supervisor">
                {project.projectSupervisorName || "Not specified"}
              </MetadataRow>

              <MetadataRow label="Created">
                {formatDate(project.createdAt)}
              </MetadataRow>

              <MetadataRow label="Last updated">
                {formatDate(project.updatedAt)}
              </MetadataRow>

              <MetadataRow label="Visibility">
                <span
                  className={
                    project.visibility === "VISIBLE"
                      ? "text-success"
                      : "text-muted-foreground"
                  }
                >
                  {project.visibility === "VISIBLE"
                    ? "Visible"
                    : "Hidden"}
                </span>
              </MetadataRow>
            </div>
          </Panel>

          {/* Suggestions retain their existing interactions */}
          {supervisorView ? (
            <Panel>
              <SectionHeading
                icon={<Sparkles size={19} />}
                eyebrow="AI-assisted discovery"
                title="Manage suggestions"
                description="Review and manage ideas shared with this project."
              />

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Removing a suggestion permanently deletes it from the shared
                list and future AI context. Its parent AI response remains
                available for history.
              </p>

              <div className="mt-4 min-w-0 border-t border-border/60 pt-4">
                <SuggestionAdminList
                  projectId={project.id}
                  suggestions={suggestions}
                />
              </div>
            </Panel>
          ) : (
            <div className="min-w-0">
              <AiSuggestionsPanel
                projectId={project.id}
                initialSuggestions={suggestions}
                canRequest={canRequestAi}
                aiEnabled={aiEnabled}
              />
            </div>
          )}
        </aside>
      </div>

    </main>
  );
}
