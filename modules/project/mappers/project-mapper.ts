import type { Prisma } from "@prisma/client";
import { ProjectDto } from "../types";

export const projectWithBrief = {
  features: { orderBy: [{ scope: "asc" as const }, { sortOrder: "asc" as const }] },
  technologies: { orderBy: { sortOrder: "asc" as const } },
  images: { select: { id: true, mimeType: true, fileName: true, fileSizeBytes: true, sortOrder: true, createdAt: true }, orderBy: { sortOrder: "asc" as const } },
  _count: { select: { images: true, suggestions: true } },
} satisfies Prisma.ProjectInclude;

export type ProjectRecord = Prisma.ProjectGetPayload<{ include: typeof projectWithBrief }>;

export function toProjectDto(project: ProjectRecord):ProjectDto {
  return {
    id: project.id,
    title: project.title,
    summary: project.summary,
    yearPresentation:project.yearPresentation,
    description: project.description,
    problemStatement: project.problemStatement,
    proposedSolution: project.proposedSolution,
    objectives: project.objectives,
    availableResources: project.availableResources,
    constraints: project.constraints,
    targetUsers: project.targetUsers,
    projectSupervisorName: project.projectSupervisorName,
    projectType: project.projectType,
    visibility: project.visibility,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    features: project.features.map((feature) => ({ id: feature.id, content: feature.content, scope: feature.scope, sortOrder: feature.sortOrder })),
    technologies: project.technologies.map((technology) => ({ id: technology.id, name: technology.name, sortOrder: technology.sortOrder })),
    images: project.images,
    counts: project._count,
  };
}
