// components/forms/project-form.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Trash2, 
  Loader2, 
  Type, 
  Layers, 
  UserCheck, 
  FileText, 
  AlignLeft, 
  AlertCircle, 
  CheckCircle2, 
  Target, 
  Users, 
  Wrench, 
  ShieldAlert, 
  Calendar, 
  Check, 
  X, 
  Code 
} from "lucide-react";
import { notify } from "@/components/notificationToaster";
import { Button } from "@/components/ui/button";
import type { ExtractedProject, ProjectDto } from "@/modules/project/types";
import type { CreateProjectPayload, UpdateProjectPayload, DeleteProjectImagePayload } from "@/shared/validation/project";
import { createProjectAction, deleteProjectImageAction, updateProjectAction } from "@/Interfaces/actions/projects.actions";
import FileScannerUploader from "./ProjectFileScannerUploader";

type Props = { project?: ProjectDto };

export function ProjectForm({ project }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditing = !!project;

  // State initialization for all form fields
  const [title, setTitle] = useState(project?.title ?? "");
  const [projectType, setProjectType] = useState<"GRADUATION" | "PRE_GRADUATION">(project?.projectType ?? "GRADUATION");
  const [projectSupervisorName, setProjectSupervisorName] = useState(project?.projectSupervisorName ?? "");
  const [summary, setSummary] = useState(project?.summary ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [problemStatement, setProblemStatement] = useState(project?.problemStatement ?? "");
  const [proposedSolution, setProposedSolution] = useState(project?.proposedSolution ?? "");
  const [objectives, setObjectives] = useState(project?.objectives ?? "");

  const [targetUsers, setTargetUsers] = useState(project?.targetUsers ?? "");
  const [availableResources, setAvailableResources] = useState(project?.availableResources ?? "");
  const [constraints, setConstraints] = useState(project?.constraints ?? "");
  const [yearPresentation, setYearPresentation] = useState(project?.yearPresentation ?? ""); 

  const [inScope, setInScope] = useState(
    project?.features.filter((f) => f.scope === "IN_SCOPE").map((f) => f.content).join("\n") ?? ""
  );
  const [outScope, setOutScope] = useState(
    project?.features.filter((f) => f.scope === "OUT_OF_SCOPE").map((f) => f.content).join("\n") ?? ""
  );
  const [technologies, setTechnologies] = useState(
    project?.technologies.map((t) => t.name).join("\n") ?? ""
  );

  // Handle scanned project data population
  const handleExtractedProject = (extracted: ExtractedProject) => {
    setTitle(extracted.title || "");
    setSummary(extracted.summary || "");
    setDescription(extracted.description || "");
    setProblemStatement(extracted.problemStatement || "");
    setProposedSolution(extracted.proposedSolution || "");
    setObjectives(extracted.objectives || "");
    setTargetUsers(extracted.targetUsers|| "");
    setAvailableResources(extracted.availableResources|| "");
    setConstraints(extracted.constraints|| "");
    setYearPresentation(extracted.yearPresentation|| "");
    setProjectSupervisorName(extracted.projectSupervisorName || "");

    // Normalize project type mapping
    const ptLower = extracted.projectType?.toLowerCase() || "";
    if (ptLower.includes("pre")) {
      setProjectType("PRE_GRADUATION");
    } else {
      setProjectType("GRADUATION");
    }

    setInScope(extracted.inScopeFeatures?.map((f) => f.content).join("\n") || "");
    setOutScope(extracted.outScopeFeatures?.map((f) => f.content).join("\n") || "");
    setTechnologies(extracted.technologies?.map((t) => t.content).join("\n") || "");

    notify.success("Project scanned successfully", "Form fields have been populated with extracted brief data.");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const inScopeFeatures = inScope
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const outOfScopeFeatures = outScope
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const techList = technologies
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    // Extract image files if any
    const imagesFileField = formData.getAll("images");
    const hasImages = imagesFileField.some((file) => file instanceof File && file.size > 0);
    const imagesFormData = hasImages ? new FormData() : undefined;
    if (imagesFormData && hasImages) {
      imagesFileField.forEach((file) => {
        if (file instanceof File && file.size > 0) {
          imagesFormData.append("images", file);
        }
      });
    }

    startTransition(async () => {
      if (isEditing) {
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
        const res = await updateProjectAction(payload, imagesFormData);
        if ("error" in res) {
          notify.error("Failed to update project", res.error);
        } else {
          notify.success("Project updated", "Changes have been saved successfully.");
          router.push(`/supervisor/projects/${project.id}`);
          router.refresh();
        }
      } else {
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
        const res = await createProjectAction(payload, imagesFormData);
        if ("error" in res) {
          notify.error("Failed to create project", res.error);
        } else {
          notify.success("Project created", "Structured project brief has been added to the catalogue.");
          router.push("/supervisor/projects");
          router.refresh();
        }
      }
    });
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!project) return;
    const payload: DeleteProjectImagePayload = {
      projectId: project.id,
      imageId,
    };
    startTransition(async () => {
      const res = await deleteProjectImageAction(payload);
      if ("error" in res) {
        notify.error("Failed to delete image", res.error);
      } else {
        notify.success("Image removed", "The project image has been deleted.");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section: Brief */}
      <section className="rounded-[2rem] border border-white/10 bg-card/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div>
          <div className="flex justify-between items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight">Project brief</h2>
            <FileScannerUploader onExtracted={handleExtractedProject} />
          </div>
          <p className="mt-1 text-[15px] text-muted-foreground">Describe the idea clearly. This is a structured brief, not a full project report.</p>
        </div>
        
        <div className="grid gap-5 md:grid-cols-2">
          {/* Project Title */}
          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Type className="w-4 h-4 text-primary" />
              Project title <span className="text-destructive">*</span>
            </label>
            <input
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              type="text"
              name="title"
              required
              minLength={4}
              maxLength={180}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Campus Resource Booking Platform"
            />
          </div>

          {/* Project Type */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Layers className="w-4 h-4 text-primary" />
              Project type <span className="text-destructive">*</span>
            </label>
            <select
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              name="projectType"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value as any)}
            >
              <option value="GRADUATION" className="bg-card text-foreground">Graduation project</option>
              <option value="PRE_GRADUATION" className="bg-card text-foreground">Pre-graduation / semester project</option>
            </select>
          </div>

          {/* Project Supervisor Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserCheck className="w-4 h-4 text-primary" />
              Project supervisor name <span className="text-destructive">*</span>
            </label>
            <input
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              type="text"
              name="projectSupervisorName"
              maxLength={160}
              value={projectSupervisorName}
              onChange={(e) => setProjectSupervisorName(e.target.value)}
              placeholder="Supervisor name"
            />
            <p className="text-xs text-muted-foreground">Plain project metadata; this does not need to be a QC account.</p>
          </div>

          {/* Year / Presentation Term */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              Year & Presentation Term
            </label>
            <input
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              type="text"
              name="yearPresentation"
              maxLength={20}
              value={yearPresentation}
              onChange={(e) => setYearPresentation(e.target.value)}
              placeholder="e.g. 2026-1"
            />
            <p className="text-xs text-muted-foreground">Format: '20yy-x' (where x is 1-3)</p>
          </div>

          {/* Available Resources */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Wrench className="w-4 h-4 text-primary" />
              Available resources
            </label>
            <input
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              type="text"
              name="availableResources"
              maxLength={300}
              value={availableResources}
              onChange={(e) => setAvailableResources(e.target.value)}
              placeholder="e.g. APIs, datasets, IoT hardware kits"
            />
          </div>

          
          {/* Short summary */}
          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlignLeft className="w-4 h-4 text-primary" />
              Short summary <span className="text-destructive">*</span>
            </label>
            <textarea
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
              name="summary"
              required
              minLength={20}
              maxLength={500}
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What does this project do, and who is it for?"
            />
            <p className="text-xs text-muted-foreground">Shown on project cards. Aim for 1–3 sentences.</p>
          </div>
          {/* Description */}
          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="w-4 h-4 text-primary" />
              Description <span className="text-destructive">*</span>
            </label>
            <textarea
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
              name="description"
              required
              minLength={30}
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the project concept, users, and expected behavior."
            />
          </div>

          {/* Target users */}
          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Users className="w-4 h-4 text-primary" />
            Target users
            </label>
            <textarea
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
              name="targetUsers"
              minLength={20}
              rows={3}
              maxLength={200}
              value={targetUsers}
              onChange={(e) => setTargetUsers(e.target.value)}
              placeholder="e.g. Students, Faculty Members, Admins"
            />
          </div>
          {/* Constraints */}
          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldAlert className="w-4 h-4 text-primary" />
            Constraints
            </label>
            <textarea
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
              name="constraints"
              minLength={20}
              maxLength={1500}
              rows={3}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g. Offline support, strict latency limits"
            />
          </div>
          
          {/* Problem statement */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertCircle className="w-4 h-4 text-primary" />
              Problem statement <span className="text-destructive">*</span>
            </label>
            <textarea
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
              name="problemStatement"
              rows={4}
              required
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="What problem does it address?"
            />
          </div>

          {/* Proposed solution */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Proposed solution <span className="text-destructive">*</span>
            </label>
            <textarea
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
              name="proposedSolution"
              rows={4}
              required
              value={proposedSolution}
              onChange={(e) => setProposedSolution(e.target.value)}
              placeholder="How will the system address the problem?"
            />
          </div>

          {/* Objectives */}
          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="w-4 h-4 text-primary" />
              Objectives <span className="text-destructive">*</span>
            </label>
            <textarea
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
              name="objectives"
              rows={3}
              value={objectives}
              required
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Key outcomes or goals, one per line if useful."
            />
          </div>
        </div>
      </section>

      {/* Section: Scope & Tech */}
      <section className="rounded-[2rem] border border-white/10 bg-card/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Scope and technologies</h2>
          <p className="mt-1 text-[15px] text-muted-foreground">Enter one feature or technology per line. AI suggestions use these boundaries as context.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Check className="w-4 h-4 text-primary" />
              Features in scope
            </label>
            <textarea
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
              name="inScopeFeatures"
              rows={6}
              value={inScope}
              onChange={(e) => setInScope(e.target.value)}
              placeholder={"Account login\nSearch and filtering\nUser dashboard"}
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <X className="w-4 h-4 text-primary" />
              Features out of scope
            </label>
            <textarea
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
              name="outOfScopeFeatures"
              rows={6}
              value={outScope}
              onChange={(e) => setOutScope(e.target.value)}
              placeholder={"Payment processing\nNative mobile application"}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Code className="w-4 h-4 text-primary" />
              Technologies
            </label>
            <textarea
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
              name="technologies"
              rows={3}
              value={technologies}
              onChange={(e) => setTechnologies(e.target.value)}
              placeholder={"Next.js\nPostgreSQL\nPrisma"}
            />
          </div>
        </div>
      </section>

      {/* Section: Images */}
      <section className="rounded-[2rem] border border-white/10 bg-card/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Project images</h2>
          <p className="mt-1 text-[15px] text-muted-foreground">Optional. JPEG, PNG, WebP, or AVIF; up to four images, 4 MB each.</p>
        </div>
        <input
          className="file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-[15px] file:font-semibold file:text-primary-foreground hover:file:bg-primary/90 w-full max-w-xl text-[15px] text-muted-foreground cursor-pointer"
          type="file"
          name="images"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
        />
        {project && project.images.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {project.images.map((image) => (
              <div key={image.id} className="overflow-hidden rounded-2xl border border-white/10 bg-background/50 p-2 backdrop-blur-sm space-y-2">
                <img src={`/projects/${project.id}/images/${image.id}`} alt={image.fileName ?? "Project image"} className="h-28 w-full rounded-xl object-cover" />
                <div className="flex items-center justify-between px-1">
                  <p className="truncate text-[11px] text-muted-foreground">{image.fileName ?? "Image"}</p>
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(image.id)}
                    className="flex items-center gap-1 text-[12px] font-semibold text-destructive hover:underline cursor-pointer"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button variant="ghost" className="rounded-xl">
          <Link href="/supervisor/projects">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending} className="rounded-xl px-6 font-semibold shadow-lg shadow-primary/20 min-w-36">
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Saving...
            </span>
          ) : isEditing ? (
            "Save changes"
          ) : (
            "Create project"
          )}
        </Button>
      </div>
    </form>
  );
}