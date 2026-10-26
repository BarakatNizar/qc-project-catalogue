import "server-only";
import { prisma } from "@/infrastructure/database/prisma";
import { projectWithBrief } from "@/modules/project/mappers/project-mapper";
import type { ProjectType, ProjectVisibility, ProjectFeatureScope, Prisma } from "@prisma/client"

export type ProjectWriteData = {
  title: string;
  summary: string;
  description: string;
  problemStatement: string;
  proposedSolution: string;
  objectives: string;
  targetUsers?: string;
  availableResources?: string;
  constraints?: string;
  yearPresentation?: string;
  projectSupervisorName?: string;
  projectType: ProjectType;
  inScopeFeatures: string[];
  outOfScopeFeatures: string[];
  technologies: string[];
  images?: { data: Uint8Array; mimeType: string; fileName?: string; fileSizeBytes: number }[];
};

function nestedData(input: ProjectWriteData) {
  const features = [
    ...input.inScopeFeatures.map((content) => ({ content, scope: "IN_SCOPE" as ProjectFeatureScope })),
    ...input.outOfScopeFeatures.map((content) => ({ content, scope: "OUT_OF_SCOPE" as ProjectFeatureScope })),
  ];
  const technologies = [...new Set(input.technologies.map((value) => value.trim()).filter(Boolean))];
  return {
    features: { create: features.map((feature, sortOrder) => ({ ...feature, sortOrder })) },
    technologies: { create: technologies.map((name, sortOrder) => ({ name, sortOrder })) },
  };
}

export const projectRepository = {
  async list(options: { query?: string; supervisorName?: string; projectType?: ProjectType; visibility?: ProjectVisibility; includeHidden: boolean; page?: number; pageSize?: number; }) {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const query = options.query?.trim();
    const supervisorName = options.supervisorName?.trim();

    const where: Prisma.ProjectWhereInput = {
      ...(options.includeHidden ? {} : { visibility: "VISIBLE" }),
      ...(options.visibility ? { visibility: options.visibility } : {}),
      ...(options.projectType ? { projectType: options.projectType } : {}),
      ...(query ? {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { summary: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ]
      } : {}),
      ...(supervisorName ? { projectSupervisorName: { contains: supervisorName, mode: "insensitive" } } : {}),
    };

    const [data, totalCount] = await Promise.all([
      prisma.project.findMany({
        where,
        include: projectWithBrief,
        orderBy: [{ updatedAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.project.count({ where }),
    ]);

    return { data, totalCount };
  },

  findById(id: string) {
    return prisma.project.findUnique({ where: { id }, include: projectWithBrief });
  },

  async findAiContextById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        features: { orderBy: [{ scope: "asc" }, { sortOrder: "asc" }] },
        technologies: { orderBy: { sortOrder: "asc" } },
        suggestions: { orderBy: { createdAt: "asc" }, select: { id: true, content: true, title: true, createdAt: true } },
      },
    });
  },

  create(input: ProjectWriteData) {
    const related = nestedData(input);
    return prisma.project.create({
      data: {
        title: input.title,
        summary: input.summary,
        description: input.description,
        problemStatement: input.problemStatement,
        proposedSolution: input.proposedSolution,
        objectives: input.objectives,
        availableResources: input.availableResources || null,
        targetUsers: input.targetUsers || null,
        constraints: input.constraints || null,
        yearPresentation: input.yearPresentation || null,
        projectSupervisorName: input.projectSupervisorName ?? "",
        projectType: input.projectType,
        // FIXED: Wrap image data in Buffer.from() to satisfy Prisma Bytes type
        ...(input.images?.length ? { 
          images: { 
            create: input.images.map((image, sortOrder) => ({ 
              ...image, 
              data: Buffer.from(image.data), 
              sortOrder 
            })) 
          } 
        } : {}),
        ...related,
      },
      include: projectWithBrief,
    });
  },

  async update(id: string, input: ProjectWriteData) {
    const technologies = [...new Set(input.technologies.map((value) => value.trim()).filter(Boolean))];
    const features = [
      ...input.inScopeFeatures.map((content) => ({ content, scope: "IN_SCOPE" as ProjectFeatureScope })),
      ...input.outOfScopeFeatures.map((content) => ({ content, scope: "OUT_OF_SCOPE" as ProjectFeatureScope })),
    ];
    return prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id }, data: {
          title: input.title,
          summary: input.summary,
          description: input.description,
          problemStatement: input.problemStatement,
          proposedSolution: input.proposedSolution,
          objectives: input.objectives,
          projectSupervisorName: input.projectSupervisorName,
          projectType: input.projectType,
        }
      });
      await tx.projectFeature.deleteMany({ where: { projectId: id } });
      await tx.projectTechnology.deleteMany({ where: { projectId: id } });
      if (features.length) await tx.projectFeature.createMany({ data: features.map((feature, sortOrder) => ({ ...feature, projectId: id, sortOrder })) });
      if (technologies.length) await tx.projectTechnology.createMany({ data: technologies.map((name, sortOrder) => ({ projectId: id, name, sortOrder })) });
      
      if (input.images?.length) {
        const currentCount = await tx.projectImage.count({ where: { projectId: id } });
        // FIXED: Wrap image data in Buffer.from() here as well
        await tx.projectImage.createMany({ 
          data: input.images.map((image, index) => ({ 
            ...image, 
            data: Buffer.from(image.data), 
            projectId: id, 
            sortOrder: currentCount + index 
          })) 
        });
      }
      return tx.project.findUniqueOrThrow({ where: { id }, include: projectWithBrief });
    });
  },

  setVisibility(id: string, visibility: ProjectVisibility) {
    return prisma.project.update({ where: { id }, data: { visibility }, include: projectWithBrief });
  },

  delete(id: string) {
    return prisma.project.delete({ where: { id }, select: { id: true } });
  },

  getImage(projectId: string, imageId: string) {
    return prisma.projectImage.findFirst({ where: { id: imageId, projectId }, select: { data: true, mimeType: true, fileName: true } });
  },

  deleteImage(projectId: string, imageId: string) {
    return prisma.projectImage.delete({ where: { id: imageId, projectId } });
  },
};