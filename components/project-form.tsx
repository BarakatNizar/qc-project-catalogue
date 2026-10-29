// components/forms/project-form.tsx
"use client";

import { useState, useTransition, type ReactNode, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlignLeft,
  AlertCircle,
  CalendarDays,
  Check,
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
import type { ExtractedProject, ProjectDto } from "@/modules/project/types";
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

type Props = { project?: ProjectDto };
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
  "w-full min-w-0 rounded-xl border border-border/70 bg-background/65 px-3.5 py-3 text-sm text-foreground " +
  "placeholder:text-muted-foreground/70 outline-none transition-colors " +
  "focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClass =
  inputClass + " min-h-28 resize-y leading-6";

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
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-primary">
              {number} / {eyebrow}
            </p>
            <h2 className="mt-1 break-words text-base font-bold tracking-tight sm:text-lg">
              {title}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
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
      className="mb-2 flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground"
    >
      {icon && <span className="shrink-0 text-primary">{icon}</span>}
      <span className="min-w-0">{children}</span>
      {required && <span className="text-destructive">*</span>}
    </label>
  );
}

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{children}</p>;
}

export function ProjectForm({ project }: Props) {
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
      extracted.inScopeFeatures?.map((feature) => feature.content).join("\n") || ""
    );
    setOutScope(
      extracted.outScopeFeatures?.map((feature) => feature.content).join("\n") || ""
    );
    setTechnologies(
      extracted.technologies?.map((technology) => technology.content).join("\n") || ""
    );

    notify.success(
      "Project scanned successfully",
      "Form fields have been populated with extracted brief data."
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
          notify.error("Failed to update project", result.error);
        } else {
          notify.success(
            "Project updated",
            "Changes have been saved successfully."
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
        notify.error("Failed to create project", result.error);
      } else {
        notify.success(
          "Project created",
          "Structured project brief has been added to the catalogue."
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
        notify.error("Failed to delete image", result.error);
      } else {
        notify.success("Image removed", "The project image has been deleted.");
        router.refresh();
      }
    });
  };

  const inScopeCount = inScope.split("\n").filter((item) => item.trim()).length;
  const outScopeCount = outScope.split("\n").filter((item) => item.trim()).length;
  const technologyCount = technologies
    .split("\n")
    .filter((item) => item.trim()).length;

  const cancelHref = project
    ? `/supervisor/projects/${project.id}`
    : "/supervisor/projects";

  return (
    <form onSubmit={handleSubmit} className="w-full min-w-0 space-y-5 pb-24 sm:space-y-6">
      {/* Brief identity */}
      <SectionCard
        number="01"
        eyebrow="Foundation"
        title="Project identity"
        description="Set the title, academic classification, supervisor, and short catalogue summary."
        icon={<Layers3 size={19} />}
        action={<FileScannerUploader onExtracted={handleExtractedProject} />}
      >
        <div className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="min-w-0 md:col-span-2 xl:col-span-3">
            <FieldLabel htmlFor="project-title" icon={<Type size={15} />} required>
              Project title
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
              placeholder="e.g. Campus Resource Booking Platform"
            />
            <FieldHint>Use a clear, specific title that describes the project.</FieldHint>
          </div>

          <div className="min-w-0">
            <FieldLabel htmlFor="project-type" icon={<Layers3 size={15} />} required>
              Project type
            </FieldLabel>
            <select
              id="project-type"
              className={inputClass}
              name="projectType"
              value={projectType}
              onChange={(event) => setProjectType(event.target.value as ProjectType)}
            >
              <option value="GRADUATION">Graduation project</option>
              <option value="PRE_GRADUATION">Pre-graduation / semester</option>
            </select>
          </div>

          <div className="min-w-0">
            <FieldLabel htmlFor="project-supervisor" icon={<UserRound size={15} />}>
              Supervisor name
            </FieldLabel>
            <input
              id="project-supervisor"
              className={inputClass}
              type="text"
              name="projectSupervisorName"
              maxLength={160}
              value={projectSupervisorName}
              onChange={(event) => setProjectSupervisorName(event.target.value)}
              placeholder="Supervisor name"
            />
            <FieldHint>Academic metadata; it does not need to be a user account.</FieldHint>
          </div>

          <div className="min-w-0">
            <FieldLabel htmlFor="year-presentation" icon={<CalendarDays size={15} />}>
              Presentation year / term
            </FieldLabel>
            <input
              id="year-presentation"
              className={inputClass}
              type="text"
              name="yearPresentation"
              maxLength={20}
              value={yearPresentation}
              onChange={(event) => setYearPresentation(event.target.value)}
              placeholder="e.g. 2026-1"
            />
            <FieldHint>Format: 20yy-x, where x is 1–3.</FieldHint>
          </div>


          <div className="min-w-0 md:col-span-2 xl:col-span-3">
            <FieldLabel htmlFor="project-summary" icon={<AlignLeft size={15} />} required>
              Short summary
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
              placeholder="What does the project do, who is it for, and why does it matter?"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <FieldHint>Shown on project cards. Aim for one to three sentences.</FieldHint>
              <span className="text-xs tabular-nums text-muted-foreground">{summary.length}/500</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Academic narrative */}
      <SectionCard
        number="02"
        eyebrow="Academic brief"
        title="Project narrative"
        description="Explain the project, the problem it addresses, the planned solution, and its intended outcomes."
        icon={<FileText size={19} />}
      >
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="min-w-0 xl:col-span-2">
            <FieldLabel htmlFor="project-description" icon={<FileText size={15} />} required>
              Description
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
              placeholder="Describe the concept, intended users, context, and expected system behavior."
            />
          </div>

          <div className="min-w-0">
            <FieldLabel htmlFor="problem-statement" icon={<AlertCircle size={15} />} required>
              Problem statement
            </FieldLabel>
            <textarea
              id="problem-statement"
              className={`${textareaClass} min-h-36`}
              name="problemStatement"
              rows={5}
              required
              value={problemStatement}
              onChange={(event) => setProblemStatement(event.target.value)}
              placeholder="What problem or unmet need does this project address?"
            />
          </div>

          <div className="min-w-0">
            <FieldLabel htmlFor="proposed-solution" icon={<Lightbulb size={15} />} required>
              Proposed solution
            </FieldLabel>
            <textarea
              id="proposed-solution"
              className={`${textareaClass} min-h-36`}
              name="proposedSolution"
              rows={5}
              required
              value={proposedSolution}
              onChange={(event) => setProposedSolution(event.target.value)}
              placeholder="Explain how the proposed system will address the problem."
            />
          </div>

          <div className="min-w-0 xl:col-span-2">
            <FieldLabel htmlFor="project-objectives" icon={<Target size={15} />} required>
              Objectives
            </FieldLabel>
            <textarea
              id="project-objectives"
              className={textareaClass}
              name="objectives"
              rows={4}
              required
              value={objectives}
              onChange={(event) => setObjectives(event.target.value)}
              placeholder="Describe the outcomes the project should achieve. One objective per line works well."
            />
          </div>
        </div>
      </SectionCard>

      {/* Operating context */}
      <SectionCard
        number="03"
        eyebrow="Context and limits"
        title="Users, resources, and constraints"
        description="Capture the project's target audience and the conditions that shape its implementation."
        icon={<Users size={19} />}
      >
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="min-w-0">
            <FieldLabel htmlFor="target-users" icon={<Users size={15} />}>
              Target users
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
              placeholder="Students, faculty members, administrators..."
            />
            <FieldHint>Who will use or benefit from the project?</FieldHint>
          </div>

          <div className="min-w-0">
            <FieldLabel htmlFor="resources-details" icon={<Wrench size={15} />}>
              Available resources
            </FieldLabel>
            <textarea
              id="resources-details"
              className={textareaClass}
              name="availableResources"
              rows={5}
              maxLength={300}
              value={availableResources}
              onChange={(event) => setAvailableResources(event.target.value)}
              placeholder="Existing APIs, devices, datasets, facilities..."
            />
            <FieldHint>Existing resources the team can rely on.</FieldHint>
          </div>

          <div className="min-w-0">
            <FieldLabel htmlFor="project-constraints" icon={<ShieldAlert size={15} />}>
              Constraints
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
              placeholder="Time, budget, privacy, offline operation, hardware, or technical limits..."
            />
            <FieldHint>Limitations or requirements that affect delivery.</FieldHint>
          </div>
        </div>
      </SectionCard>

      {/* Scope and stack */}
      <SectionCard
        number="04"
        eyebrow="Boundaries"
        title="Scope and technologies"
        description="Enter one feature or technology per line. Scope boundaries help keep the project and AI suggestions realistic."
        icon={<Target size={19} />}
      >
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="min-w-0 rounded-xl border border-success/20 bg-success/[0.035] p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <FieldLabel htmlFor="in-scope-features" icon={<CheckCircle2 size={15} />}>
                Features in scope
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
              placeholder={"Account login\nSearch and filtering\nUser dashboard"}
            />
            <FieldHint>Features that the project is expected to deliver.</FieldHint>
          </div>

          <div className="min-w-0 rounded-xl border border-border/70 bg-background/20 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <FieldLabel htmlFor="out-scope-features" icon={<X size={15} />}>
                Features out of scope
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
              placeholder={"Payment processing\nNative mobile application\nExternal integrations"}
            />
            <FieldHint>Explicit exclusions help prevent scope creep.</FieldHint>
          </div>

          <div className="min-w-0 xl:col-span-2">
            <div className="mb-3 flex items-center justify-between gap-2">
              <FieldLabel htmlFor="project-technologies" icon={<Code2 size={15} />}>
                Technologies
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
              placeholder={"Next.js\nPostgreSQL\nPrisma"}
            />
            <FieldHint>Enter one language, framework, platform, or tool per line.</FieldHint>
          </div>
        </div>
      </SectionCard>

      {/* Images */}
      <SectionCard
        number="05"
        eyebrow="Visual references"
        title="Project images"
        description="Add screenshots, diagrams, mockups, or other images that help explain the project."
        icon={<Sparkles size={19} />}
      >
        <div className="rounded-xl border border-dashed border-border/80 bg-background/25 p-4 sm:p-5">
          <label htmlFor="project-images" className="block text-sm font-semibold">
            Upload images
          </label>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            JPEG, PNG, WebP, or AVIF. Up to four images, 4 MB each.
          </p>
          <input
            id="project-images"
            className="mt-4 block w-full min-w-0 cursor-pointer text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
            type="file"
            name="images"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
          />
        </div>

        {project && project.images.length > 0 && (
          <div className="mt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Current images</h3>
              <span className="text-xs text-muted-foreground">
                {project.images.length} attached
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
                      aria-label={`Open ${image.fileName ?? "project image"}`}
                    >
                      <img
                        src={`/projects/${project.id}/images/${image.id}`}
                        alt={image.fileName ?? "Project image"}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </a>

                    <div className="flex min-w-0 items-center justify-between gap-2 px-1 pt-3">
                      <p className="min-w-0 truncate text-xs text-muted-foreground">
                        {image.fileName ?? "Project image"}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(image.id)}
                        disabled={isPending}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                        Remove
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
            <p className="truncate text-sm font-semibold">
              {isEditing ? "Editing project brief" : "Creating project brief"}
            </p>
            <p className="text-xs text-muted-foreground">
              Required fields are marked with an asterisk.
            </p>
          </div>

          <div className="flex min-w-0 gap-2 sm:ml-auto sm:w-auto">
            <Button
              variant="outline"
              disabled={isPending}
              className="min-w-0 flex-1 sm:flex-none"
            >
              <Link href={cancelHref}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="min-w-0 flex-1 gap-2 shadow-sm shadow-primary/20 sm:min-w-40 sm:flex-none"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing ? "Save changes" : "Create project"}
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
    <span className="inline-flex min-w-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/70 px-2 py-1 text-xs font-semibold tabular-nums text-muted-foreground">
      {count}
    </span>
  );
}

