
"use client";

import {
  useState,
  useTransition,
  type ReactNode,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlignLeft,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Code2,
  FileText,
  Layers3,
  Lightbulb,
  Loader2,
  Save,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  Type,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";

import { notify } from "@/components/notificationToaster";
import { Button } from "@/components/ui/button";
import type { ExtractedProject, ProjectData } from "@/modules/project/types";
import type { Locale } from "@/shared/i18n/dictionary";
import { t } from "@/shared/i18n/dictionary";
import type {
  CreateProjectPayload,
  DeleteProjectImagePayload,
  UpdateProjectPayload,
} from "@/shared/validation/project";
import {
  createProjectAction,
  deleteProjectImageAction,
  updateProjectAction,
} from "@/Interfaces/actions/projects.actions";
import FileScannerUploader from "./ProjectFileScannerUploader";

type Props = {
  project?: ProjectData;
  locale?: Locale;
};

type ProjectType = "GRADUATION" | "PRE_GRADUATION";

type SectionCardProps = {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
};

const inputClass =
  "w-full min-w-0 rounded-xl border border-border/70 bg-background/65 px-3.5 py-3 text-[17px] text-foreground " +
  "placeholder:text-muted-foreground/70 outline-none transition-colors " +
  "focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClass = inputClass + " min-h-28 resize-y leading-6";

function SectionCard({
  number,
  eyebrow,
  title,
  description,
  icon,
  children,
  action,
}: SectionCardProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card/75 shadow-sm">
      <div className="flex min-w-0 flex-col gap-4 border-b border-border/60 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5 lg:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-13 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            {icon}
          </span>

          <div className="min-w-0 space-y-2">
            <p className=" text-lg lg:text-xl font-black uppercase tracking-wide text-primary">
              {number} / {eyebrow}
            </p>

            <h2 className="mt-1 break-words text-xl font-bold tracking-tight lg:text-2xl">
              {title}
            </h2>

            <p className="mt-1 max-w-3xl text-lg leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {action && <div className="shrink-0 self-start">{action}</div>}
      </div>

      <div className="min-w-0 p-4 sm:p-5 lg:p-6">{children}</div>
    </section>
  );
}

function FieldLabel({
  htmlFor,
  icon,
  children,
  required = false,
}: {
  htmlFor: string;
  icon?: ReactNode;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 flex min-w-0 items-center gap-2 text-lg font-semibold text-foreground"
    >
      {icon && <span className="shrink-0 text-primary">{icon}</span>}

      <span className="min-w-0">{children}</span>

      {required && <span className="text-destructive">*</span>}
    </label>
  );
}

function FieldHint({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1.5 text-[15px] leading-5 text-muted-foreground">
      {children}
    </p>
  );
}

export function ProjectForm({ project, locale = "en" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditing = Boolean(project);

  const [title, setTitle] = useState(project?.title ?? "");
  const [projectType, setProjectType] = useState<ProjectType>(
    project?.projectType ?? "GRADUATION"
  );
  const [projectSupervisorName, setProjectSupervisorName] = useState(
    project?.projectSupervisorName ?? ""
  );
  const [summary, setSummary] = useState(project?.summary ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [problemStatement, setProblemStatement] = useState(
    project?.problemStatement ?? ""
  );
  const [proposedSolution, setProposedSolution] = useState(
    project?.proposedSolution ?? ""
  );
  const [objectives, setObjectives] = useState(project?.objectives ?? "");
  const [targetUsers, setTargetUsers] = useState(project?.targetUsers ?? "");
  const [availableResources, setAvailableResources] = useState(
    project?.availableResources ?? ""
  );
  const [constraints, setConstraints] = useState(project?.constraints ?? "");
  const [yearPresentation, setYearPresentation] = useState(
    project?.yearPresentation ?? ""
  );

  const [inScope, setInScope] = useState(
    project?.features
      .filter((feature) => feature.scope === "IN_SCOPE")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((feature) => feature.content)
      .join("\n") ?? ""
  );

  const [outScope, setOutScope] = useState(
    project?.features
      .filter((feature) => feature.scope === "OUT_OF_SCOPE")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((feature) => feature.content)
      .join("\n") ?? ""
  );

  const [technologies, setTechnologies] = useState(
    project?.technologies
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((technology) => technology.name)
      .join("\n") ?? ""
  );

  const handleExtractedProject = (extracted: ExtractedProject) => {
    setTitle(extracted.title || "");
    setSummary(extracted.summary || "");
    setDescription(extracted.description || "");
    setProblemStatement(extracted.problemStatement || "");
    setProposedSolution(extracted.proposedSolution || "");
    setObjectives(extracted.objectives || "");
    setTargetUsers(extracted.targetUsers || "");
    setAvailableResources(extracted.availableResources || "");
    setConstraints(extracted.constraints || "");
    setYearPresentation(extracted.yearPresentation || "");
    setProjectSupervisorName(extracted.projectSupervisorName || "");

    const normalizedType = extracted.projectType?.toLowerCase() || "";

    setProjectType(
      normalizedType.includes("pre") ? "PRE_GRADUATION" : "GRADUATION"
    );

    setInScope(
      extracted.inScopeFeatures
        ?.map((feature) => feature.content)
        .join("\n") || ""
    );

    setOutScope(
      extracted.outScopeFeatures
        ?.map((feature) => feature.content)
        .join("\n") || ""
    );

    setTechnologies(
      extracted.technologies
        ?.map((technology) => technology.content)
        .join("\n") || ""
    );

    notify.success(
      t(locale, "projectScannedSuccessfully"),
      t(locale, "projectScannedFieldsPopulated")
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const inScopeFeatures = inScope
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const outOfScopeFeatures = outScope
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const techList = technologies
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const imageFiles = formData.getAll("images");

    const hasImages = imageFiles.some(
      (file) => file instanceof File && file.size > 0
    );

    const imagesFormData = hasImages ? new FormData() : undefined;

    if (imagesFormData) {
      imageFiles.forEach((file) => {
        if (file instanceof File && file.size > 0) {
          imagesFormData.append("images", file);
        }
      });
    }

    startTransition(async () => {
      if (isEditing && project) {
        const payload: UpdateProjectPayload = {
          projectId: project.id,
          data: {
            title,
            summary,
            description,
            problemStatement,
            proposedSolution,
            objectives,
            availableResources,
            constraints,
            targetUsers,
            yearPresentation,
            projectSupervisorName,
            projectType,
            inScopeFeatures,
            outOfScopeFeatures,
            technologies: techList,
          },
        };

        const result = await updateProjectAction(payload, imagesFormData);

        if ("error" in result) {
          notify.error(
            t(locale, "failedToUpdateProject"),
            result.error
          );
        } else {
          notify.success(
            t(locale, "projectUpdated"),
            t(locale, "projectChangesSaved")
          );

          router.push(`/supervisor/projects/${project.id}`);
          router.refresh();
        }

        return;
      }

      const payload: CreateProjectPayload = {
        title,
        summary,
        description,
        problemStatement,
        proposedSolution,
        objectives,
        projectSupervisorName,
        projectType,
        inScopeFeatures,
        outOfScopeFeatures,
        technologies: techList,
        availableResources,
        constraints,
        targetUsers,
        yearPresentation,
      };

      const result = await createProjectAction(payload, imagesFormData);

      if ("error" in result) {
        notify.error(
          t(locale, "failedToCreateProject"),
          result.error
        );
      } else {
        notify.success(
          t(locale, "projectCreated"),
          t(locale, "projectAddedToCatalogue")
        );

        router.push("/supervisor/projects");
        router.refresh();
      }
    });
  };

  const handleDeleteImage = (imageId: string) => {
    if (!project) return;

    const payload: DeleteProjectImagePayload = {
      projectId: project.id,
      imageId,
    };

    startTransition(async () => {
      const result = await deleteProjectImageAction(payload);

      if ("error" in result) {
        notify.error(
          t(locale, "failedToDeleteImage"),
          result.error
        );
      } else {
        notify.success(
          t(locale, "imageRemoved"),
          t(locale, "projectImageDeleted")
        );

        router.refresh();
      }
    });
  };

  const inScopeCount = inScope
    .split("\n")
    .filter((item) => item.trim()).length;

  const outScopeCount = outScope
    .split("\n")
    .filter((item) => item.trim()).length;

  const technologyCount = technologies
    .split("\n")
    .filter((item) => item.trim()).length;

  const cancelHref = project
    ? `/supervisor/projects/${project.id}`
    : "/supervisor/projects";

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full min-w-0 space-y-5 pb-24 sm:space-y-6"
    >
      {/* Brief identity */}
      <SectionCard
        number="01"
        eyebrow={t(locale, "foundation")}
        title={t(locale, "projectIdentity")}
        description={t(locale, "projectIdentityDesc")}
        icon={<Layers3 size={24} />}
        action={<FileScannerUploader onExtracted={handleExtractedProject} />}
      >
        <div className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="min-w-0 md:col-span-2 xl:col-span-3">
            <FieldLabel
              htmlFor="project-title"
              icon={<Type size={20} />}
              required
            >
              {t(locale, "projectTitle")}
            </FieldLabel>

            <input
              id="project-title"
              className={inputClass}
              type="text"
              name="title"
              required
              minLength={4}
              maxLength={180}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t(locale, "projectTitlePlaceholder")}
            />

            <FieldHint>{t(locale, "projectTitleHint")}</FieldHint>
          </div>

          <div className="min-w-0">
            <FieldLabel
              htmlFor="project-type"
              icon={<Layers3 size={20} />}
              required
            >
              {t(locale, "projectTypeLabel")}
            </FieldLabel>

            <select
              id="project-type"
              className={inputClass}
              name="projectType"
              value={projectType}
              onChange={(event) =>
                setProjectType(event.target.value as ProjectType)
              }
            >
              <option value="GRADUATION">
                {t(locale, "graduationProject")}
              </option>

              <option value="PRE_GRADUATION">
                {t(locale, "preGraduationSemester")}
              </option>
            </select>
          </div>

          <div className="min-w-0">
            <FieldLabel
              htmlFor="project-supervisor"
              icon={<UserRound size={20} />}
            >
              {t(locale, "supervisorName")}
            </FieldLabel>

            <input
              id="project-supervisor"
              className={inputClass}
              type="text"
              name="projectSupervisorName"
              maxLength={160}
              value={projectSupervisorName}
              onChange={(event) =>
                setProjectSupervisorName(event.target.value)
              }
              placeholder={t(locale, "supervisorName")}
            />

            <FieldHint>{t(locale, "supervisorNameHint")}</FieldHint>
          </div>

          <div className="min-w-0">
            <FieldLabel
              htmlFor="year-presentation"
              icon={<CalendarDays size={20} />}
            >
              {t(locale, "presentationYearTerm")}
            </FieldLabel>

            <input
              id="year-presentation"
              className={inputClass}
              type="text"
              name="yearPresentation"
              maxLength={20}
              value={yearPresentation}
              onChange={(event) =>
                setYearPresentation(event.target.value)
              }
              placeholder="2026-1"
            />

            <FieldHint>{t(locale, "presentationYearHint")}</FieldHint>
          </div>

          <div className="min-w-0 md:col-span-2 xl:col-span-3">
            <FieldLabel
              htmlFor="project-summary"
              icon={<AlignLeft size={20} />}
              required
            >
              {t(locale, "shortSummary")}
            </FieldLabel>

            <textarea
              id="project-summary"
              className={textareaClass}
              name="summary"
              required
              minLength={20}
              maxLength={500}
              rows={3}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder={t(locale, "shortSummaryPlaceholder")}
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <FieldHint>{t(locale, "shortSummaryHint")}</FieldHint>

              <span className="text-[15px] tabular-nums text-muted-foreground">
                {summary.length}/500
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Academic narrative */}
      <SectionCard
        number="02"
        eyebrow={t(locale, "academicBrief")}
        title={t(locale, "narrative")}
        description={t(locale, "narrativeDesc")}
        icon={<FileText size={24} />}
      >
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="min-w-0 xl:col-span-2">
            <FieldLabel
              htmlFor="project-description"
              icon={<FileText size={20} />}
              required
            >
              {t(locale, "descriptionLabel")}
            </FieldLabel>

            <textarea
              id="project-description"
              className={`${textareaClass} min-h-40`}
              name="description"
              required
              minLength={30}
              rows={6}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t(locale, "descriptionPlaceholder")}
            />
          </div>

          <div className="min-w-0">
            <FieldLabel
              htmlFor="problem-statement"
              icon={<AlertCircle size={20} />}
              required
            >
              {t(locale, "problemStatement")}
            </FieldLabel>

            <textarea
              id="problem-statement"
              className={`${textareaClass} min-h-36`}
              name="problemStatement"
              rows={5}
              required
              value={problemStatement}
              onChange={(event) =>
                setProblemStatement(event.target.value)
              }
              placeholder={t(locale, "problemStatementPlaceholder")}
            />
          </div>

          <div className="min-w-0">
            <FieldLabel
              htmlFor="proposed-solution"
              icon={<Lightbulb size={20} />}
              required
            >
              {t(locale, "proposedSolution")}
            </FieldLabel>

            <textarea
              id="proposed-solution"
              className={`${textareaClass} min-h-36`}
              name="proposedSolution"
              rows={5}
              required
              value={proposedSolution}
              onChange={(event) =>
                setProposedSolution(event.target.value)
              }
              placeholder={t(locale, "proposedSolutionPlaceholder")}
            />
          </div>

          <div className="min-w-0 xl:col-span-2">
            <FieldLabel
              htmlFor="project-objectives"
              icon={<Target size={20} />}
              required
            >
              {t(locale, "objectivesLabel")}
            </FieldLabel>

            <textarea
              id="project-objectives"
              className={textareaClass}
              name="objectives"
              rows={4}
              required
              value={objectives}
              onChange={(event) => setObjectives(event.target.value)}
              placeholder={t(locale, "objectivesPlaceholder")}
            />
          </div>
        </div>
      </SectionCard>

      {/* Operating context */}
      <SectionCard
        number="03"
        eyebrow={t(locale, "contextAndLimits")}
        title={t(locale, "usersResourcesConstraints")}
        description={t(locale, "contextDesc")}
        icon={<Users size={24} />}
      >
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="min-w-0">
            <FieldLabel
              htmlFor="target-users"
              icon={<Users size={20} />}
            >
              {t(locale, "targetUsers")}
            </FieldLabel>

            <textarea
              id="target-users"
              className={textareaClass}
              name="targetUsers"
              minLength={20}
              rows={5}
              maxLength={200}
              value={targetUsers}
              onChange={(event) => setTargetUsers(event.target.value)}
              placeholder={t(locale, "targetUsersPlaceholder")}
            />

            <FieldHint>{t(locale, "targetUsersHint")}</FieldHint>
          </div>

          <div className="min-w-0">
            <FieldLabel
              htmlFor="resources-details"
              icon={<Wrench size={20} />}
            >
              {t(locale, "availableResources")}
            </FieldLabel>

            <textarea
              id="resources-details"
              className={textareaClass}
              name="availableResources"
              rows={5}
              maxLength={300}
              value={availableResources}
              onChange={(event) =>
                setAvailableResources(event.target.value)
              }
              placeholder={t(locale, "availableResourcesPlaceholder")}
            />

            <FieldHint>{t(locale, "availableResourcesHint")}</FieldHint>
          </div>

          <div className="min-w-0">
            <FieldLabel
              htmlFor="project-constraints"
              icon={<ShieldAlert size={20} />}
            >
              {t(locale, "constraints")}
            </FieldLabel>

            <textarea
              id="project-constraints"
              className={textareaClass}
              name="constraints"
              minLength={20}
              maxLength={1500}
              rows={5}
              value={constraints}
              onChange={(event) => setConstraints(event.target.value)}
              placeholder={t(locale, "constraintsPlaceholder")}
            />

            <FieldHint>{t(locale, "constraintsHint")}</FieldHint>
          </div>
        </div>
      </SectionCard>

      {/* Scope and stack */}
      <SectionCard
        number="04"
        eyebrow={t(locale, "boundaries")}
        title={t(locale, "scopeAndTechnologies")}
        description={t(locale, "scopeAndTechDesc")}
        icon={<Target size={24} />}
      >
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="min-w-0 rounded-xl border border-success/20 bg-success/[0.035] p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <FieldLabel
                htmlFor="in-scope-features"
                icon={<CheckCircle2 size={20} />}
              >
                {t(locale, "featuresInScope")}
              </FieldLabel>

              <BadgeCount count={inScopeCount} />
            </div>

            <textarea
              id="in-scope-features"
              className={`${textareaClass} min-h-44`}
              name="inScopeFeatures"
              rows={7}
              value={inScope}
              onChange={(event) => setInScope(event.target.value)}
              placeholder={t(locale, "featuresInScopePlaceholder")}
            />

            <FieldHint>{t(locale, "featuresInScopeHint")}</FieldHint>
          </div>

          <div className="min-w-0 rounded-xl border border-border/70 bg-background/20 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <FieldLabel
                htmlFor="out-scope-features"
                icon={<X size={20} />}
              >
                {t(locale, "featuresOutScope")}
              </FieldLabel>

              <BadgeCount count={outScopeCount} />
            </div>

            <textarea
              id="out-scope-features"
              className={`${textareaClass} min-h-44`}
              name="outOfScopeFeatures"
              rows={7}
              value={outScope}
              onChange={(event) => setOutScope(event.target.value)}
              placeholder={t(locale, "featuresOutScopePlaceholder")}
            />

            <FieldHint>{t(locale, "featuresOutScopeHint")}</FieldHint>
          </div>

          <div className="min-w-0 xl:col-span-2">
            <div className="mb-3 flex items-center justify-between gap-2">
              <FieldLabel
                htmlFor="project-technologies"
                icon={<Code2 size={20} />}
              >
                {t(locale, "technologiesLabel")}
              </FieldLabel>

              <BadgeCount count={technologyCount} />
            </div>

            <textarea
              id="project-technologies"
              className={textareaClass}
              name="technologies"
              rows={4}
              value={technologies}
              onChange={(event) => setTechnologies(event.target.value)}
              placeholder={t(locale, "technologiesPlaceholder")}
            />

            <FieldHint>{t(locale, "technologiesHint")}</FieldHint>
          </div>
        </div>
      </SectionCard>

      {/* Images */}
      <SectionCard
        number="05"
        eyebrow={t(locale, "visualReferences")}
        title={t(locale, "projectImages")}
        description={t(locale, "projectImagesDesc")}
        icon={<Sparkles size={24} />}
      >
        <div className="rounded-xl border border-dashed border-border/80 bg-background/25 p-4 sm:p-5">
          <label
            htmlFor="project-images"
            className="block text-lg font-semibold"
          >
            {t(locale, "uploadImages")}
          </label>

          <p className="mt-1 text-[15px] leading-5 text-muted-foreground">
            {t(locale, "uploadImagesHint")}
          </p>

          <input
            id="project-images"
            className="mt-4 block w-full min-w-0 cursor-pointer text-lg text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-lg file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
            type="file"
            name="images"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
          />
        </div>

        {project && project.images.length > 0 && (
          <div className="mt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">
                {t(locale, "currentImages")}
              </h3>

              <span className="text-[15px] text-muted-foreground">
                {project.images.length} {t(locale, "attachedCount")}
              </span>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-3 min-[380px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {project.images
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((image) => (
                  <div
                    key={image.id}
                    className="min-w-0 overflow-hidden rounded-xl border border-border/70 bg-background/35 p-2"
                  >
                    <a
                      href={`/projects/${project.id}/images/${image.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label={t(locale, "openProjectImage")}
                    >
                      <img
                        src={`/projects/${project.id}/images/${image.id}`}
                        alt={image.fileName ?? t(locale, "projectImage")}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </a>

                    <div className="flex min-w-0 items-center justify-between gap-2 px-1 pt-3">
                      <p className="min-w-0 truncate text-[15px] text-muted-foreground">
                        {image.fileName ?? t(locale, "projectImage")}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleDeleteImage(image.id)}
                        disabled={isPending}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[15px] font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                        {t(locale, "remove")}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Submit bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 p-3 backdrop-blur-xl sm:px-5 lg:px-8 xl:px-10 2xl:px-12">
        <div className="mx-auto flex w-full min-w-0 max-w-none flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-lg font-semibold">
              {isEditing
                ? t(locale, "editingProjectBrief")
                : t(locale, "creatingProjectBrief")}
            </p>

            <p className="text-[15px] text-muted-foreground">
              {t(locale, "requiredFieldsAsterisk")}
            </p>
          </div>

          <div className="flex min-w-0 gap-2 sm:ml-auto sm:w-auto">
            <Button
              variant="outline"
              disabled={isPending}
              className="min-w-0 flex-1 sm:flex-none"
            >
              <Link href={cancelHref}>{t(locale, "cancel")}</Link>
            </Button>

            <Button
              type="submit"
              disabled={isPending}
              className="min-w-0 flex-1 gap-2 shadow-sm shadow-primary/20 sm:min-w-40 sm:flex-none"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t(locale, "saving")}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing
                    ? t(locale, "saveChanges")
                    : t(locale, "createProject")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function BadgeCount({ count }: { count: number }) {
  return (
    <span className="inline-flex min-w-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/70 px-2 py-1 text-[15px] font-semibold tabular-nums text-muted-foreground">
      {count}
    </span>
  );
}
