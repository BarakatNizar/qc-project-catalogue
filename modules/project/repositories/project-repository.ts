
// modules/projects/repositories/project-repository.ts
import "server-only";
import { prisma } from "@/infrastructure/database/prisma";
import { projectWithBrief } from "@/modules/project/mappers/project-mapper";
import type { ProjectType, ProjectVisibility, ProjectFeatureScope, Prisma } from "@prisma/client"
import { CreateProjectPayload, UpdateProjectData } from "@/shared/validation/project";

export type ProjectWriteData = (CreateProjectPayload | UpdateProjectData);


function nestedData(input: ProjectWriteData) {
  const features = [
    ...(input.inScopeFeatures??[]).map((content) => ({ content, scope: "IN_SCOPE" as ProjectFeatureScope })),
    ...(input.outOfScopeFeatures??[]).map((content) => ({ content, scope: "OUT_OF_SCOPE" as ProjectFeatureScope })),
  ];
  const technologies = [...new Set((input.technologies??[]).map((value) => value.trim()).filter(Boolean))];
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

  /**
   * LIGHTWEIGHT INDEX QUERY: Returns only IDs and total count for a given filter/page.
   * Used in combination with Redis payload caching.
   */
  async listIds(options: { query?: string; supervisorName?: string; projectType?: ProjectType; visibility?: ProjectVisibility; includeHidden: boolean; page?: number; pageSize?: number; }) {
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

    const [rows, totalCount] = await Promise.all([
      prisma.project.findMany({
        where,
        select: { id: true },
        orderBy: [{ updatedAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.project.count({ where }),
    ]);

    return {
      ids: rows.map((r) => r.id),
      totalCount,
    };
  },

  async findById(id: string) {
    return prisma.project.findUnique({ where: { id }, include: projectWithBrief });
  },

  /**
   * Batch lookup for missing project IDs during cache fallback.
   */
  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    const projects = await prisma.project.findMany({
      where: { id: { in: ids } },
      include: projectWithBrief,
    });

    // Preserve the exact order of the input `ids` array
    const map = new Map(projects.map((p) => [p.id, p]));
    return ids.map((id) => map.get(id)).filter(Boolean) as typeof projects;
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

  async create(input: CreateProjectPayload & ProjectWriteData ) {
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
        projectSupervisorName: input.projectSupervisorName ?? null,
        studentsPresented: input.studentsPresented ?? null,
        language:input.language,
        projectType: input.projectType,
        ...(input.images?.length ? { 
          images: { 
            create: input.images.map((image, sortOrder) => ({ 
              ...image, 
              data: Buffer.from(image.dataBase64), 
              sortOrder 
            })) 
          } 
        } : {}),
        ...related,
      },
      include: projectWithBrief,
    });
  },

  async update(id: string, input: UpdateProjectData & ProjectWriteData) {
    const technologies = [...new Set((input.technologies??[]).map((value) => value.trim()).filter(Boolean))];
    const features = [
      ...(input.inScopeFeatures??[]).map((content) => ({ content, scope: "IN_SCOPE" as ProjectFeatureScope })),
      ...(input.outOfScopeFeatures??[]).map((content) => ({ content, scope: "OUT_OF_SCOPE" as ProjectFeatureScope })),
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
        await tx.projectImage.createMany({ 
          data: input.images.map((image, index) => ({ 
            fileName: image.fileName,
            mimeType: image.mimeType,
            fileSizeBytes: image.fileSizeBytes,
            data: Buffer.from(image.dataBase64), 
            projectId: id, 
            sortOrder: currentCount + index 
          })) 
        });
      }
      return tx.project.findUniqueOrThrow({ where: { id }, include: projectWithBrief });
    });
  },
  
  async updateImages(id: string, images:{ data: Uint8Array; mimeType: string; fileName?: string; fileSizeBytes: number }[]) {
    return prisma.$transaction(async (tx) => {
        const currentCount = await tx.projectImage.count({ where: { projectId: id } });
        await tx.projectImage.createMany({ 
          data: images.map((image, index) => ({ 
            fileName: image.fileName,
            mimeType: image.mimeType,
            fileSizeBytes: image.fileSizeBytes,
            data: Buffer.from(image.data), 
            projectId: id, 
            sortOrder: currentCount + index 
          })) 
        });
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
    return prisma.projectImage.deleteMany({ where: { id: imageId, projectId } });
  },
};