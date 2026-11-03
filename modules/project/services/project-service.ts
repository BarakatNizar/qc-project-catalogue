
import "server-only";

import { Prisma } from "@prisma/client";
import type { ServerUser } from "@/core/auth/session";
import { authorize } from "@/core/authorization/authorization-layer";
import { AppError } from "@/core/errors/app-error";

import {
  checkProject_Create_Schema,
  checkProject_Update_Schema,
  checkProject_Visibility_Set_Schema,
  checkProject_Delete_Schema,
  checkProjectImage_Delete_Schema,
  checkProjectId_Schema,
  checkProject_QuerySearch_Schema,
  type CreateProjectPayload,
  type UpdateProjectData,
  type SetProjectVisibilityPayload,
  type DeleteProjectPayload,
  type DeleteProjectImagePayload,
  type ProjectSearchPayload,
} from "@/shared/validation/project";

import {
  projectRepository,
  type ProjectWriteData,
} from "@/modules/project/repositories/project-repository";

import { toProjectDto } from "@/modules/project/mappers/project-mapper";
import { getPaginationMeta } from "@/shared/utils/pagincation-utils";
import { TranslationLanguage } from "@/modules/translation/types/translation.types";
import { getAllCachedProjects, getCachedLocalizedProjects, getCachedProject, getCachedProjects, setCachedProject, setCachedProjects } from "../cache/project-cache";
import { ProjectDto } from "../types";
import { projectTranslationService } from "@/modules/translation/services/project-translation.service";

// ==========================================
// Map Known Database Errors
// ==========================================
function mapKnownError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AppError("CONFLICT");
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new AppError("NOT_FOUND");
  throw error;
}

// ==========================================
// Throw Validation Errors
// ==========================================
function assertValid(
  validation: { ok: true } | { ok: false; reason: string },
): void {
  if (!validation.ok) {
    throw new AppError("VALIDATION", validation.reason);
  }
}

// ==========================================
// Prepare Repository Write Data
// Call only after successful validation.
// ==========================================
function parseWriteData(
  input: CreateProjectPayload | UpdateProjectData,
  images?: ProjectWriteData["images"],
): ProjectWriteData {
  return {
    ...input,
    images,    
  };
}

// ==========================================
// Project Service
// ==========================================

export const projectService = {
  // ==========================================
  // List Projects
  // ==========================================
  // async listProject(actor: ServerUser, search: ProjectSearchPayload = {}) {
  //   /*
  //   (alias) type ProjectSearchPayload = {
  //     query?: string | undefined;
  //     supervisorName?: string | undefined;
  //     projectType?: "PRE_GRADUATION" | "GRADUATION" | undefined;
  //   }
  //    */
  //  assertValid(checkProject_QuerySearch_Schema(search));

  //   const supervisor = actor.role === "SUPERVISOR";

  //   if ( actor.role !== "SUPERVISOR" && actor.role !== "STUDENT" ) {
  //     throw new AppError("FORBIDDEN");
  //   }

  //   const projects = await projectRepository.list({ query: search.query, supervisorName: search.supervisorName, projectType: search.projectType , includeHidden: supervisor, });

  //   return projects.map(toProjectDto);
  // },
  
  
  // // // OLD VERSION
  // async listProjects(actor: ServerUser, search: ProjectSearchPayload = {}, page = 1, pageSize = 10,  targetLanguage?: TranslationLanguage) {
  //   assertValid(checkProject_QuerySearch_Schema(search));

  //   const supervisor = actor.role === "SUPERVISOR";

  //   if (actor.role !== "SUPERVISOR" && actor.role !== "STUDENT" && actor.role !== "ADMIN") {
  //     throw new AppError("FORBIDDEN");
  //   }

  //   const cacheResult = await getAllCachedProjects();

    



  //   const { data, totalCount } = await projectRepository.list({ 
  //     query: search.query, 
  //     supervisorName: search.supervisorName, 
  //     projectType: search.projectType, 
  //     includeHidden: supervisor,
  //     page,
  //     pageSize,
  //   });

  //   return {
  //     data: data.map(toProjectDto),
  //     pagination: getPaginationMeta(totalCount, page, pageSize),
  //   };
  // },
  

  async listProjects(
    actor: ServerUser,
    search: ProjectSearchPayload = {},
    page = 1,
    pageSize = 10,
    targetLanguage?: TranslationLanguage,
  ) {
    assertValid(checkProject_QuerySearch_Schema(search));

    const supervisor = actor.role === "SUPERVISOR";

    if (
      actor.role !== "SUPERVISOR" &&
      actor.role !== "STUDENT" &&
      actor.role !== "ADMIN"
    ) {
      throw new AppError("FORBIDDEN");
    }

    // 1. FAST INDEX QUERY: Get only the IDs and total count from Postgres
    const { ids, totalCount } = await projectRepository.listIds({
      query: search.query,
      supervisorName: search.supervisorName,
      projectType: search.projectType,
      includeHidden: supervisor,
      page,
      pageSize,
    });

    if (ids.length === 0) {
      return {
        data: [],
        pagination: getPaginationMeta(totalCount, page, pageSize),
      };
    }

    // 2. CACHE LOOKUP: Fetch the full project snapshots & translations from Redis using the IDs
    const cachedResult = await getCachedProjects(ids);
    const cachedLookups = "data" in cachedResult ? cachedResult.data : [];

    const projectMap = new Map<string, ProjectDto>();
    const missingIds: string[] = [];

    // Map existing cache hits, track what's missing
    ids.forEach((id, index) => {
      const cached = cachedLookups[index]?.data;
      if (cached) {
        // If a target language is requested, check if translation is cached
        const localized = targetLanguage ? cached.translations[targetLanguage] : cached.source;
        if (localized) {
          projectMap.set(id, localized);
        } else {
          // Source is in cache, but the specific language translation is missing
          missingIds.push(id);
        }
      } else {
        // Completely missing from cache
        missingIds.push(id);
      }
    });

    // 3. CACHE MISS FALLBACK: Fetch missing records from PostgreSQL
    let sourceProjectsToCache: ProjectDto[] = [];
    if (missingIds.length > 0) {
      const dbRecords = await projectRepository.findByIds(missingIds);
      sourceProjectsToCache = dbRecords.map(toProjectDto);
    }

    // 4. TRANSLATE & BACKFILL: Handle translations for missing/uncached items
    if (sourceProjectsToCache.length > 0) {
      let finalProcessedProjects = sourceProjectsToCache;

      if (targetLanguage) {
        const translationResult = await projectTranslationService.translateProjects(
          sourceProjectsToCache,
          targetLanguage,
        );

        if ("data" in translationResult) {
          finalProcessedProjects = translationResult.data;

          // Prepare batch writes to Redis for both source and translation
          const cacheWrites = sourceProjectsToCache.map((sourceProj, i) => ({
            source: sourceProj,
            localized: {
              language: targetLanguage,
              data: finalProcessedProjects[i],
            },
          }));
          await setCachedProjects(cacheWrites);
        } else {
          // Fallback to source if translation service fails
          console.warn("[Project] Translation fallback in list:", translationResult.error);
          await setCachedProjects(sourceProjectsToCache.map(source => ({ source })));
        }
      } else {
        // Cache source-only items
        await setCachedProjects(sourceProjectsToCache.map(source => ({ source })));
      }

      // Add newly fetched/translated projects to our map
      sourceProjectsToCache.forEach((sourceProj, i) => {
        const targetProj = targetLanguage ? finalProcessedProjects[i] : sourceProj;
        projectMap.set(sourceProj.id, targetProj);
      });
    }

    // 5. RECONSTRUCT ORDER: Ensure the returned array matches the exact order of the original Postgres `ids` array
    const orderedData = ids.map((id) => projectMap.get(id)).filter(Boolean) as ProjectDto[];

    return {
      data: orderedData,
      pagination: getPaginationMeta(totalCount, page, pageSize),
    };
  },
  
  
  // ==========================================
  // Get Project
  // ==========================================
  async getProjectById(actor: ServerUser, projectId: string, targetLanguage?: TranslationLanguage) {
    if ( actor.role !== "STUDENT" && actor.role !== "SUPERVISOR" ) {
      throw new AppError("FORBIDDEN");
    }
    
    assertValid(checkProjectId_Schema(projectId))
    
    
  const cacheResult = await getCachedProject(projectId);

  let sourceProject: ProjectDto | null = null;

  if ("data" in cacheResult && cacheResult.data) {
    const cached = cacheResult.data;
    const cachedLocalized = targetLanguage? cached.translations[targetLanguage]: cached.source;

    if (cachedLocalized) {
      return { data: cachedLocalized };
    }

    sourceProject = cached.source;
  } else if ("error" in cacheResult) {
    console.warn("[Project] Cache read skipped:", cacheResult.error);
  }

  // 2. On a cache miss, retrieve and map the source DTO from PostgreSQL.
  if (!sourceProject) {
    // Replace these two lines with your existing repository + mapper calls.

    const repositoryResult = await projectRepository.findById(projectId);
    if (!repositoryResult) return { error: "Project not found." };

    sourceProject = toProjectDto(repositoryResult);
  }

  // 3. Translate only the requested language. The translator uses its own
  // field-level cache, so already translated fields do not call Google again.
  if (targetLanguage){

    const translationResult = await projectTranslationService.translateProject(
      sourceProject,
      targetLanguage,
    );

  if ("data" in translationResult) {
    const cacheWrite = await setCachedProject({
      source: sourceProject,
      localized: {
        language: targetLanguage,
        data: translationResult.data,
      },
    });

    if ("error" in cacheWrite) {
      console.warn("[Project] Cache write skipped:", cacheWrite.error);
    }

    return { data: translationResult.data };
  }
  console.warn("[Project] Translation fallback:", translationResult.error);
  }

  // Translation failure is not a project retrieval failure. Cache the source
  // DTO if possible, then return the original source data as a fallback.

  const sourceCacheWrite = await setCachedProject({ source: sourceProject });
 

  if ("error" in sourceCacheWrite) {
    console.warn("[Project] Source cache write skipped:", sourceCacheWrite.error);
  }

  return { data: sourceProject };
  },

  // ==========================================
  // Get Project Image
  // ==========================================
  async getImage( actor: ServerUser, projectId: string, imageId: string, ) {
    assertValid(checkProjectId_Schema(projectId));
    assertValid(checkProjectId_Schema(imageId));

    if (
      actor.role !== "SUPERVISOR" &&
      actor.role !== "STUDENT"
    ) {
      throw new AppError("FORBIDDEN");
    }

    const project = await projectRepository.findById(projectId);

    if (!project ) {
      throw new AppError("NOT_FOUND");
    }else if ((actor.role === "STUDENT" && project.visibility !== "VISIBLE")){
      throw new AppError("UNAUTHENTICATED");
    }

    const image = await projectRepository.getImage( projectId, imageId );

    if (!image) {
      throw new AppError("NOT_FOUND");
    }

    return image;
  },


  // ==========================================
  // Create Project
  // ==========================================
  async create( actor: ServerUser, payload: CreateProjectPayload, images?: ProjectWriteData["images"], ) {
    authorize(actor, "PROJECT_MANAGE");

    const validation = checkProject_Create_Schema(payload);
    assertValid(validation);

    const input = parseWriteData(payload, images);

    try {
      const created = await projectRepository.create(input);
      return toProjectDto(created);
    } catch (error) {
      return mapKnownError(error);
    }
  },

  // ==========================================
  // Update Project
  // ==========================================
  async update( actor: ServerUser, projectId: string, data: UpdateProjectData, images?: ProjectWriteData["images"], ) {
    authorize(actor, "PROJECT_MANAGE");

    const validation = checkProject_Update_Schema({ projectId: projectId, data, });

    assertValid(validation);

    const id = projectId;
    const input = parseWriteData(data, images);

    try {
      const updated = await projectRepository.update(id, input);
      return toProjectDto(updated);
    } catch (error) {
      return mapKnownError(error);
    }
  },

  // ==========================================
  // Set Project Visibility
  // ==========================================
  async setVisibility( actor: ServerUser, projectId: string, visibility: SetProjectVisibilityPayload["visibility"], ) {
    authorize(actor, "PROJECT_MANAGE");

    const payload: SetProjectVisibilityPayload = {
      projectId: projectId,
      visibility,
    };

    const validation =
      checkProject_Visibility_Set_Schema(payload);

    assertValid(validation);

    try {
      const updated = await projectRepository.setVisibility(
        payload.projectId,
        payload.visibility,
      );

      return toProjectDto(updated);
    } catch (error) {
      return mapKnownError(error);
    }
  },

  // ==========================================
  // Delete Project
  // ==========================================
  async delete(actor: ServerUser, projectId: string) {
    authorize(actor, "PROJECT_MANAGE");

    const payload: DeleteProjectPayload = {
      projectId: projectId,
    };

    const validation = checkProject_Delete_Schema(payload);
    assertValid(validation);

    try {
      return await projectRepository.delete(payload.projectId);
    } catch (error) {
      return mapKnownError(error);
    }
  },

  
  // ==========================================
  // Delete Project Image
  // ==========================================
  async deleteImage( actor: ServerUser, projectId: string, imageId: string ) {
    authorize(actor, "PROJECT_MANAGE");
    assertValid(checkProjectId_Schema(projectId));
    assertValid(checkProjectId_Schema(imageId));

    const payload: DeleteProjectImagePayload = {
      projectId: projectId,
      imageId: imageId,
    };

    const validation = checkProjectImage_Delete_Schema(payload);

    assertValid(validation);

    const result = await projectRepository.deleteImage(
      payload.projectId,
      payload.imageId,
    );

  },
};
