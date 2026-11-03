
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
import { t, type Locale } from "@/shared/i18n/dictionary";
import { Button } from "@/components/ui/button";
import ChangeProjectVisibility from "./changeProjectVisibility";
import DeleteProjectButton from "./deleteProjectButton";
import { getCurrentApplicationLanguage } from "@/modules/translation/services/application-language.service";

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

// Format project text by inserting a line break after every period.
function formatProjectText(
  value: string | null | undefined
): string {
  if (!value) return "";

  return value.replace(/\.\s*/g, ".\n\n").replace(/;\s*/g, ".\n");
}

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

      <div className="min-w-0 flex-1 space-y-3">
        {eyebrow && (
          <p className="text-lg sm:text-xl font-bold uppercase tracking-wide text-primary">
            {eyebrow}
          </p>
        )}

        <h2 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>

        {description && (
          <p className="max-w-4xl text-lg sm:text-xl leading-6 text-muted-foreground font-semibold">
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
    <section className={`${panelClass} p-4 sm:p-5 lg:p-6 ${className}`}>
      {children}
    </section>
  );
}

function ExpandableSection({
  title,
  content,
  icon,
  index,
  locale
}: {
  title: string;
  content: string | null | undefined;
  icon: ReactNode;
  locale: Locale;
  index?: string;
}) {
  if (!content?.trim()) return null;

  return (
    <details className="group min-w-0 overflow-hidden rounded-xl border border-border/70 bg-base-100 transition-colors open:border-primary/30 open:bg-primary/25 duration-500">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden group-hover:bg-primary/50 duration-700">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/[0.09] text-primary group-open:text-primary-content group-open:bg-primary duration-700">
          {icon}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            {index && (
              <span className="shrink-0 font-mono text-[16px] text-primary/80">
                {index}
              </span>
            )}

            <span className="break-words text-lg font-semibold text-foreground ">
              {title}
            </span>
          </span>

          <span className="mt-1 block text-[16px] font-semibold opacity-75">
            {t(locale, "openToReadSection")}
          </span>
        </span>

        <ChevronDown
          aria-hidden="true"
          size={18}
          className="shrink-0 text-muted-foreground font-semibold transition-transform duration-200 group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-border/60 px-4 py-4 sm:px-5 sm:py-5">
        <p className="whitespace-pre-line break-words text-lg leading-8 text-foreground/85 [overflow-wrap:anywhere]">
          {formatProjectText(content)}
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
        <p className="text-[16px] text-muted-foreground font-semibold">{label}</p>
        <div className="mt-1 break-words text-lg font-bold leading-5">
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
      <span className="shrink-0 text-[16px] text-muted-foreground font-semibold">
        {label}
      </span>

      <div className="min-w-0 text-right text-lg font-medium">
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
          <CircleOff size={17} className="shrink-0 text-muted-foreground font-semibold" />
        )}

        <h3 className="min-w-0 break-words text-lg font-bold ">
          {title}
        </h3>

        <div className="ml-auto shrink-0">
          {features.length}
        </div>
      </div>

      {features.length > 0 ? (
        <ul className="mt-3 max-h-[500px] space-y-2 overflow-y-auto">
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

              <span className="min-w-0 whitespace-pre-line break-words text-lg leading-6 text-foreground/80 [overflow-wrap:anywhere]">
                {formatProjectText(feature.content)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-border/70 p-4 text-lg leading-6 text-muted-foreground font-semibold">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}

export async function ProjectDetails({
  project,
  suggestions,
  canRequestAi = false,
  aiEnabled = true,
  supervisorView = false,
}: ProjectDetailsProps) {
  const locale = await getCurrentApplicationLanguage();

  const inScope = project.features.filter(
    (feature) => feature.scope === "IN_SCOPE"
  );

  const outScope = project.features.filter(
    (feature) => feature.scope === "OUT_OF_SCOPE"
  );

  const backHref = supervisorView
    ? "/supervisor/projects"
    : "/projects";

  const backLabel = supervisorView
    ? t(locale, "backToProjectManagementLabel")
    : t(locale, "backToCatalogueLabel");

  const projectType =
    project.projectType === "GRADUATION"
      ? t(locale, "graduationProject")
      : t(locale, "preGraduationProject");

  return (
    <main className="w-full min-w-0 space-y-5 px-3 pb-10 pt-3 sm:space-y-6 sm:px-5 lg:px-8 xl:px-10 2xl:px-12">
      {/* Top navigation */}
      <nav className="flex min-w-0 flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 sm:w-auto"
        >
          <Link
            href={backHref}
            className="flex items-center gap-2 duration-200 hover:gap-5 text-[15px]"
          >
            <ArrowLeft size={20} />
            {backLabel}
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
      <header className="relative isolate min-w-0 overflow-hidden rounded-2xl border border-primary/25 shadow shadow-lg shadow-primary/20 border border-primary/40 bg-primary/20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 -z-10 size-80 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0 p-5 sm:p-7 lg:p-9">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <div className="badge p-4 text-[14px] gap-1.5 border border-primary">
                <GraduationCap size={20} />
                {projectType}
              </div>

              {project.yearPresentation && (
                <div className="badge px-2 py-4 text-[14px] gap-1.5">
                  <CalendarDays size={20} />
                  {project.yearPresentation}
                </div>
              )}

              {supervisorView && (
                <div
                  className={
                    project.visibility === "VISIBLE"
                      ? "badge px-2 py-4 text-[14px] border-success/30 bg-success/10 text-success"
                      : "badge px-2 py-4 text-[14px] border-muted-foreground/30 bg-muted text-muted-foreground font-semibold"
                  }
                >
                  <Eye size={20} className="mr-1" />
                  {project.visibility === "VISIBLE"
                    ? t(locale, "published")
                    : t(locale, "hidden")}
                </div>
              )}
            </div>

            <h1 className="mt-5 max-w-5xl break-words text-2xl font-black leading-tight tracking-tight [overflow-wrap:anywhere] sm:text-3xl lg:text-4xl xl:text-5xl">
              {project.title}
            </h1>

            <div className="mt-4 h-1 w-16 rounded-full bg-primary" />

            {project.summary && (
              <p className="mt-5 max-w-4xl whitespace-pre-line break-words text-lg leading-7 text-muted-foreground font-semibold ">
                {formatProjectText(project.summary)}
              </p>
            )}

            <div className="mt-6 flex min-w-0 flex-col gap-4 border-t border-border/60 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-2.5">
                <UserCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-primary"
                />

                <div className="min-w-0">
                  <p className="text-[16px] text-muted-foreground font-semibold">
                    {t(locale, "projectSupervisor")}
                  </p>

                  <p className="mt-1 break-words text-lg font-semibold">
                    {project.projectSupervisorName ||
                      t(locale, "notSpecified")}
                  </p>
                </div>
              </div>

              {supervisorView && (
                <Button className="w-full sm:w-auto">
                  <Link href={`/supervisor/projects/${project.id}/edit`}>
                    {t(locale, "editProjectBrief")}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Header side information */}
          <div className="grid content-start grid-cols-2 gap-3 border-t border-border/60 bg-background/20 p-4 sm:p-5 lg:grid-cols-1 lg:border-l lg:border-t-0 lg:p-6">
            <div className="col-span-2 lg:col-span-1">
              <p className="text-[14px] font-bold uppercase tracking-wide text-muted-foreground font-semibold">
                {t(locale, "catalogueStatus")}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`size-2 shrink-0 rounded-full ${
                    project.visibility === "VISIBLE"
                      ? "bg-success"
                      : "bg-muted-foreground/50"
                  }`}
                />

                <span className="text-lg font-semibold">
                  {project.visibility === "VISIBLE"
                    ? t(locale, "visibleToStudents")
                    : t(locale, "hiddenFromStudents")}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/60 p-3">
              <p className="text-[16px] text-muted-foreground font-semibold">
                {t(locale, "created")}
              </p>

              <p className="mt-1 break-words text-lg font-semibold">
                {formatDate(project.createdAt)}
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/60 p-3">
              <p className="text-[16px] text-muted-foreground font-semibold">
                {t(locale, "lastUpdated")}
              </p>

              <p className="mt-1 break-words text-lg font-semibold">
                {formatDate(project.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Project metrics */}
      <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label={t(locale, "includedFeatures")}
          value={inScope.length}
          icon={<CheckCircle2 size={18} />}
        />

        <Metric
          label={t(locale, "excludedFeatures")}
          value={outScope.length}
          icon={<ShieldAlert size={18} />}
        />

        <Metric
          label={t(locale, "technologiesLabel")}
          value={project.technologies.length}
          icon={<Code2 size={18} />}
        />

        <Metric
          label={t(locale, "aiSuggestions")}
          value={project.counts.suggestions}
          icon={<Sparkles size={18} />}
        />
      </div>

      {/* Full-width responsive content grid */}
      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-12 xl:gap-6">
        {/* Main project content */}
        <div className="min-w-0 space-y-10 xl:col-span-8">
          <Panel className="shadow shadow-lg shadow-primary/20 border border-primary/40 bg-primary/10">
            <SectionHeading
              icon={<FileText size={26} />}
              eyebrow={t(locale, "projectDocumentation")}
              title={t(locale, "academicBrief")}
              description={t(locale, "academicBriefDesc")}
              trailing={
                <div className="hidden sm:inline-flex">
                  {
                    [
                      project.description,
                      project.problemStatement,
                      project.proposedSolution,
                      project.objectives,
                    ].filter((value) => Boolean(value?.trim())).length
                  }{" "}
                  {t(locale, "sections")}
                </div>
              }
            />

            <div className="mt-5 space-y-3">
              <ExpandableSection
                index="01"
                title={t(locale, "projectDescription")}
                content={project.description}
                icon={<FileText size={20} />}
                locale={locale}
              />

              <ExpandableSection
                index="02"
                title={t(locale, "problemStatement")}
                content={project.problemStatement}
                icon={<ShieldAlert size={20} />}
                locale={locale}
              />

              <ExpandableSection
                index="03"
                title={t(locale, "proposedSolution")}
                content={project.proposedSolution}
                icon={<Lightbulb size={20} />}
                locale={locale}
              />

              <ExpandableSection
                index="04"
                title={t(locale, "projectObjectives")}
                content={project.objectives}
                icon={<Target size={20} />}
                locale={locale}
              />
            </div>
          </Panel>

          {/* Context */}
          {(project.targetUsers ||
            project.availableResources ||
            project.constraints) && (
            <Panel className="shadow shadow-lg shadow-primary/20 border border-primary/40 bg-primary/10">
              <SectionHeading
                icon={<Layers3 size={26} />}
                eyebrow={t(locale, "planningContext")}
                title={t(locale, "operationalParameters")}
                description={t(locale, "operationalParametersDesc")}
              />

              <div className="mt-5 space-y-3">
                <ExpandableSection
                  title={t(locale, "targetUsers")}
                  content={project.targetUsers}
                  icon={<Users size={20} />}
                  locale={locale}
                />

                <ExpandableSection
                  title={t(locale, "availableResources")}
                  content={project.availableResources}
                  icon={<Wrench size={20} />}
                  locale={locale}
                />

                <ExpandableSection
                  title={t(locale, "constraints")}
                  content={project.constraints}
                  icon={<ShieldAlert size={20} />}
                  locale={locale}
                />
              </div>
            </Panel>
          )}

          {/* Scope */}
          <Panel className="shadow shadow-lg shadow-primary/20 border border-primary/40 bg-primary/10">
            <SectionHeading
              icon={<Target size={26} />}
              eyebrow={t(locale, "featureBoundaries")}
              title={t(locale, "projectScope")}
              description={t(locale, "projectScopeDesc")}
            />

            <div className="mt-5 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-5">
              <FeatureList
                title={t(locale, "inScope")}
                features={inScope}
                included
                emptyMessage={t(locale, "noIncludedFeatures")}
              />

              <div className="min-w-0 border-t border-border/60 pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                <FeatureList
                  title={t(locale, "outOfScope")}
                  features={outScope}
                  included={false}
                  emptyMessage={t(locale, "noExcludedFeatures")}
                />
              </div>
            </div>
          </Panel>

          {/* Technologies */}
          <Panel className="shadow shadow-lg shadow-primary/20 border border-primary/40 bg-primary/10">
            <SectionHeading
              icon={<Code2 size={26} />}
              eyebrow={t(locale, "implementation")}
              title={t(locale, "technologyStack")}
              description={t(locale, "technologyStackDesc")}
            />

            {project.technologies.length > 0 ? (
              <div className="mt-5 flex min-w-0 flex-wrap gap-2">
                {project.technologies
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((technology) => (
                    <div
                      key={technology.id}
                      className="max-w-full break-words rounded-lg border border-border/60 px-3 py-1.5 text-[16px]"
                    >
                      {technology.name}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-border/60 p-4 text-lg text-muted-foreground font-semibold">
                {t(locale, "noTechnologies")}
              </p>
            )}
          </Panel>

          {/* Images */}
          {project.images.length > 0 && (
            <Panel className="shadow shadow-lg shadow-primary/20 border border-primary/40 bg-primary/10">
              <SectionHeading
                icon={<ExternalLink size={26} />}
                eyebrow={t(locale, "visualMaterial")}
                title={t(locale, "projectGallery")}
                description={t(locale, "projectGalleryDesc")}
                trailing={
                  <div>
                    {project.counts.images}
                  </div>
                }
              />

              <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-3">
                {project.images
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((image) => {
                    const imageLabel =
                      image.fileName ??
                      `${t(locale, "projectImage")} ${image.sortOrder + 1}`;

                    return (
                      <a
                        key={image.id}
                        href={`/projects/${project.id}/images/${image.id}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={t(locale, "openProjectImageAria").replace(
                          "{name}",
                          imageLabel
                        )}
                        className="group min-w-0 overflow-hidden rounded-xl border border-border/70 bg-background/30 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <img
                          loading="lazy"
                          src={`/projects/${project.id}/images/${image.id}`}
                          alt={imageLabel}
                          className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />

                        <div className="flex min-w-0 items-center gap-2 border-t border-border/60 px-3 py-2.5">
                          <span className="min-w-0 flex-1 truncate text-[16px] text-muted-foreground font-semibold">
                            {image.fileName ?? t(locale, "projectImage")}
                          </span>

                          <ExternalLink
                            size={20}
                            className="shrink-0 text-primary"
                          />
                        </div>
                      </a>
                    );
                  })}
              </div>
            </Panel>
          )}
        </div>

        {/* Information and suggestions sidebar */}
        <aside className="grid min-w-0 grid-cols-1 items-start gap-5 xl:col-span-4">
          <Panel className="shadow shadow-lg shadow-primary/20 border border-primary/40 bg-primary/10">
            <SectionHeading
              icon={<GraduationCap size={26} />}
              eyebrow={t(locale, "atAGlance")}
              title={t(locale, "projectInformation")}
            />

            <div className="mt-4">
              <MetadataRow label={t(locale, "projectTypeLabel")}>
                {projectType}
              </MetadataRow>

              <MetadataRow label={t(locale, "presentationYear")}>
                {project.yearPresentation || t(locale, "notSpecified")}
              </MetadataRow>

              <MetadataRow label={t(locale, "projectSupervisor")}>
                {project.projectSupervisorName || t(locale, "notSpecified")}
              </MetadataRow>

              <MetadataRow label={t(locale, "created")}>
                {formatDate(project.createdAt)}
              </MetadataRow>

              <MetadataRow label={t(locale, "lastUpdated")}>
                {formatDate(project.updatedAt)}
              </MetadataRow>

              <MetadataRow label={t(locale, "visibility")}>
                <span
                  className={
                    project.visibility === "VISIBLE"
                      ? "text-success"
                      : "text-muted-foreground font-semibold"
                  }
                >
                  {project.visibility === "VISIBLE"
                    ? t(locale, "visible")
                    : t(locale, "hidden")}
                </span>
              </MetadataRow>
            </div>
          </Panel>

          {/* Suggestions retain their existing interactions */}
          {supervisorView ? (
            <Panel className="shadow shadow-lg shadow-primary/20 border border-primary/40 bg-primary/10">
              <SectionHeading
                icon={<Sparkles size={26} />}
                eyebrow={t(locale, "aiAssistedDiscovery")}
                title={t(locale, "manageSuggestions")}
                description={t(locale, "manageSuggestionsDesc")}
              />

              <p className="mt-4 text-lg leading-6 text-muted-foreground font-semibold">
                {t(locale, "manageSuggestionsWarning")}
              </p>

              <div className="mt-4 min-w-0 border-t border-border/60 pt-4">
                <SuggestionAdminList
                  projectId={project.id}
                  suggestions={suggestions}
                  locale={locale}
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
                locale={locale}
              />
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
