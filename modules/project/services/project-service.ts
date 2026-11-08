
// // // modules/projects/services/project-service.ts
// // import "server-only";

// // import { Prisma } from "@prisma/client";
// // import type { ServerUser } from "@/core/auth/session";
// // import { authorize } from "@/core/authorization/authorization-layer";
// // import { AppError, toSafeMessage } from "@/core/errors/app-error";
// // import { projectRepository, type ProjectWriteData, } from "@/modules/project/repositories/project-repository";
// // import { toProjectDto } from "@/modules/project/mappers/project-mapper";
// // import { getPaginationMeta, type PaginationMeta, } from "@/shared/utils/pagincation-utils";
// // import type { CreateProjectPayload, UpdateProjectData, ProjectSearchPayload, } from "@/shared/validation/project";
// // import type { ProjectData, ProjectListItem } from "../types";

// // // ==========================================
// // // Service Result Types
// // // ==========================================

// // type ServiceError = {
// //   error: string;
// // };

// // type ServiceSuccess = {
// //   ok: true;
// // };

// // // ==========================================
// // // Error Handling
// // // ==========================================

// // function toServiceError(error: unknown): ServiceError {
// //   let appError: AppError;

// //   if (error instanceof AppError) {
// //     appError = error;
// //   } else if ( error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" ) {
// //     appError = new AppError("CONFLICT");
// //   } else if ( error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025" ) {
// //     appError = new AppError("NOT_FOUND");
// //   } else {
// //     appError = new AppError("INTERNAL");
// //   }

// //   return {
// //     error: toSafeMessage(appError),
// //   };
// // }

// // // ==========================================
// // // Prepare Repository Write Data
// // // ==========================================

// // function parseWriteData<T>(
// //   input: T,
// //   images?: ProjectWriteData["images"],
// // ): T & Partial<ProjectWriteData> {
// //   return {
// //     ...input,
// //     ...(images !== undefined ? { images } : {}),
// //   };
// // }

// // // ==========================================
// // // Project Service
// // // ==========================================

// // export const projectService = {
// //   // ==========================================
// //   // List Projects
// //   // ==========================================

// //   async listProjects(
// //     actor: ServerUser,
// //     search: ProjectSearchPayload = {},
// //     page = 1,
// //     pageSize = 10,
// //   ): Promise<
// //     | {
// //         data: ProjectListItem[];
// //         pagination: PaginationMeta;
// //       }
// //     | ServiceError
// //   > {
// //     try {
// //       if (
// //         actor.role !== "SUPERVISOR" &&
// //         actor.role !== "STUDENT" &&
// //         actor.role !== "ADMIN"
// //       ) {
// //         throw new AppError("FORBIDDEN");
// //       }

// //       const supervisor = actor.role === "SUPERVISOR";

// //       const { ids, totalCount } = await projectRepository.listIds({
// //         query: search.query,
// //         supervisorName: search.supervisorName,
// //         projectType: search.projectType,
// //         includeHidden: supervisor,
// //         page,
// //         pageSize,
// //       });

// //       if (ids.length === 0) {
// //         return {
// //           data: [],
// //           pagination: getPaginationMeta(totalCount, page, pageSize),
// //         };
// //       }

// //       const records = await projectRepository.findByIds(ids);

// //       // Preserve the original ordering returned by listIds.
// //       const projectMap = new Map(
// //         records.map((record) => [
// //           record.id,
// //           toProjectDto(record),
// //         ]),
// //       );

// //       const orderedData = ids
// //         .map((id) => projectMap.get(id))
// //         .filter((project): project is ProjectData => project !== undefined);

// //       return {
// //         data: orderedData,
// //         pagination: getPaginationMeta(totalCount, page, pageSize),
// //       };
// //     } catch (error) {
// //       return toServiceError(error);
// //     }
// //   },

// //   // ==========================================
// //   // Get Project
// //   // ==========================================

// //   async getProjectById(
// //     actor: ServerUser,
// //     projectId: string,
// //   ): Promise<{ data: ProjectData } | ServiceError> {
// //     try {
// //       if (
// //         actor.role !== "STUDENT" &&
// //         actor.role !== "SUPERVISOR"
// //       ) {
// //         throw new AppError("FORBIDDEN");
// //       }

// //       const project = await projectRepository.findById(projectId);

// //       if (!project) {
// //         throw new AppError("NOT_FOUND");
// //       }

// //       return {
// //         data: toProjectDto(project),
// //       };
// //     } catch (error) {
// //       return toServiceError(error);
// //     }
// //   },

// //   // ==========================================
// //   // Get Project Image
// //   // ==========================================

// //   async getImage(
// //     actor: ServerUser,
// //     projectId: string,
// //     imageId: string,
// //   ): Promise<
// //     | {
// //         data: Uint8Array<ArrayBuffer>;
// //         mimeType: string;
// //         fileName: string | null;
// //       }
// //     | ServiceError
// //   > {
// //     try {

// //       const project = await projectRepository.findById(projectId);
// //       if (!project) {
// //         throw new AppError("NOT_FOUND");
// //       }

// //       if ( actor.role === "STUDENT" && project.visibility !== "VISIBLE" ) {
// //         throw new AppError("UNAUTHORIZED");
// //       }

// //       const image = await projectRepository.getImage(
// //         projectId,
// //         imageId,
// //       );

// //       if (!image) {
// //         throw new AppError("NOT_FOUND");
// //       }

// //       return image;
// //     } catch (error) {
// //       return toServiceError(error);
// //     }
// //   },

// //   // ==========================================
// //   // Create Project
// //   // ==========================================

// //   async create(
// //     actor: ServerUser,
// //     payload: CreateProjectPayload,
// //     images?: ProjectWriteData["images"],
// //   ): Promise<ServiceSuccess | ServiceError> {
// //     try {
// //       authorize(actor, "PROJECT_MANAGE");

// //       const input = parseWriteData(payload, images);

// //       await projectRepository.create(input);

// //       return { ok: true };
// //     } catch (error) {
// //       return toServiceError(error);
// //     }
// //   },

// //   // ==========================================
// //   // Update Project
// //   // ==========================================

// //   async update(
// //     actor: ServerUser,
// //     projectId: string,
// //     data: UpdateProjectData,
// //     images?: ProjectWriteData["images"],
// //   ): Promise<ServiceSuccess | ServiceError> {
// //     try {
// //       authorize(actor, "PROJECT_MANAGE");

// //       const input = parseWriteData(data, images);

// //       await projectRepository.update(projectId, input);

// //       return { ok: true };
// //     } catch (error) {
// //       return toServiceError(error);
// //     }
// //   },

// //   // ==========================================
// //   // Set Project Visibility
// //   // ==========================================

// //   async setVisibility(
// //     actor: ServerUser,
// //     projectId: string,
// //     visibility: "VISIBLE" | "HIDDEN",
// //   ): Promise<ServiceSuccess | ServiceError> {
// //     try {
// //       authorize(actor, "PROJECT_MANAGE");

// //       await projectRepository.setVisibility(
// //         projectId,
// //         visibility,
// //       );

// //       return { ok: true };
// //     } catch (error) {
// //       return toServiceError(error);
// //     }
// //   },

// //   // ==========================================
// //   // Delete Project
// //   // ==========================================

// //   async delete(
// //     actor: ServerUser,
// //     projectId: string,
// //   ): Promise<ServiceSuccess | ServiceError> {
// //     try {
// //       authorize(actor, "PROJECT_MANAGE");

// //       await projectRepository.delete(projectId);

// //       return { ok: true };
// //     } catch (error) {
// //       return toServiceError(error);
// //     }
// //   },

// //   // ==========================================
// //   // Delete Project Image
// //   // ==========================================

// //   async deleteImage(
// //     actor: ServerUser,
// //     projectId: string,
// //     imageId: string,
// //   ): Promise<ServiceSuccess | ServiceError> {
// //     try {
// //       authorize(actor, "PROJECT_MANAGE");

// //       await projectRepository.deleteImage(
// //         projectId,
// //         imageId,
// //       );

// //       return { ok: true };
// //     } catch (error) {
// //       return toServiceError(error);
// //     }
// //   },
// // };

// // modules/projects/services/project-service.ts
// import "server-only";

// import { Prisma } from "@prisma/client";
// import type { Language } from "@prisma/client";
// import type { ServerUser } from "@/core/auth/session";
// import { authorize } from "@/core/authorization/authorization-layer";
// import { AppError, toSafeMessage } from "@/core/errors/app-error";
// import {
//   projectRepository,
//   type ProjectWriteData,
// } from "@/modules/project/repositories/project-repository";
// import { toProjectDto } from "@/modules/project/mappers/project-mapper";
// import { projectCacheService } from "@/modules/project/cache/project-cache.service";
// import { projectTranslationService } from "@/modules/translation/services/project-translation.service";
// import type { TranslationLanguage } from "@/modules/translation/types/translation.types";
// import {
//   getPaginationMeta,
//   type PaginationMeta,
// } from "@/shared/utils/pagincation-utils";
// import type {
//   CreateProjectPayload,
//   UpdateProjectData,
//   ProjectSearchPayload,
// } from "@/shared/validation/project";
// import type {
//   ProjectData,
//   ProjectListItem,
//   ProjectRestDetails,
// } from "../types";

// // ==========================================
// // Service Result Types
// // ==========================================

// type ServiceError = {
//   error: string;
// };

// type ServiceSuccess = {
//   ok: true;
// };

// type ProjectListResult = {
//   data: ProjectListItem[];
//   pagination: PaginationMeta;
// };

// // ==========================================
// // Error Handling
// // ==========================================

// function toServiceError(error: unknown): ServiceError {
//   let appError: AppError;

//   if (error instanceof AppError) {
//     appError = error;
//   } else if (
//     error instanceof Prisma.PrismaClientKnownRequestError &&
//     error.code === "P2002"
//   ) {
//     appError = new AppError("CONFLICT");
//   } else if (
//     error instanceof Prisma.PrismaClientKnownRequestError &&
//     error.code === "P2025"
//   ) {
//     appError = new AppError("NOT_FOUND");
//   } else {
//     appError = new AppError("INTERNAL");
//   }

//   return { error: toSafeMessage(appError) };
// }

// function toTranslationLanguage(language: unknown): TranslationLanguage | null {
//   if (typeof language !== "string") return null;

//   const normalized = language.trim().toLowerCase();
//   return normalized === "en" || normalized === "ar" ? normalized : null;
// }

// function logCacheWarning(operation: string, error: string): void {
//   console.warn(`[Project] Cache ${operation} failed: ${error}`);
// }

// async function invalidateProjectCache(projectId: string): Promise<void> {
//   try {
//     const result = await projectCacheService.invalidateProject(projectId);
//     if (!result.ok) logCacheWarning("invalidation", result.error);
//   } catch (error) {
//     logCacheWarning(
//       "invalidation",
//       error instanceof Error ? error.message : "Unexpected cache error.",
//     );
//   }
// }

// // ==========================================
// // Project Cache DTO Mapping
// // ==========================================

// function toProjectListItem(
//   project: ProjectData,
//   language: TranslationLanguage,
// ): ProjectListItem {
//   return {
//     id: project.id,
//     language,
//     title: project.title,
//     summary: project.summary,
//     projectSupervisorName: project.projectSupervisorName,
//     projectType: project.projectType,
//     visibility: project.visibility,
//     technologies: project.technologies,
//     images: project.images.map((image) => ({
//       id: image.id,
//       mimeType: image.mimeType,
//     })),
//     counts: project.counts,
//   };
// }

// function toProjectRestDetails(
//   project: ProjectData,
//   language: TranslationLanguage,
// ): ProjectRestDetails {
//   return {
//     id: project.id,
//     language,
//     description: project.description,
//     targetUsers: project.targetUsers,
//     availableResources: project.availableResources,
//     constraints: project.constraints,
//     yearPresentation: project.yearPresentation,
//     problemStatement: project.problemStatement,
//     proposedSolution: project.proposedSolution,
//     objectives: project.objectives,
//     createdAt: project.createdAt,
//     updatedAt: project.updatedAt,
//     features: project.features,
//   };
// }

// function omitLanguage<T extends { language: TranslationLanguage }>(
//   value: T,
// ): Omit<T, "language"> {
//   const { language: _language, ...data } = value;
//   return data;
// }

// async function cacheLocalizedListItems(
//   items: ProjectListItem[],
//   language: TranslationLanguage,
// ): Promise<void> {
//   if (items.length === 0) return;

//   try {
//     const list = items.map(omitLanguage);
//     const result =
//       language === "en"
//         ? await projectCacheService.setCachedProjectItemsEn({ list })
//         : await projectCacheService.setCachedProjectItemsAr({ list });

//     if (!result.ok) logCacheWarning("list write", result.error);
//   } catch (error) {
//     logCacheWarning(
//       "list write",
//       error instanceof Error ? error.message : "Unexpected cache error.",
//     );
//   }
// }

// async function cacheLocalizedListItem(item: ProjectListItem): Promise<void> {
//   try {
//     const list = omitLanguage(item);
//     const result =
//       item.language === "en"
//         ? await projectCacheService.setCachedProjectListEn({ list })
//         : await projectCacheService.setCachedProjectListAr({ list });

//     if (!result.ok) logCacheWarning("list write", result.error);
//   } catch (error) {
//     logCacheWarning(
//       "list write",
//       error instanceof Error ? error.message : "Unexpected cache error.",
//     );
//   }
// }

// async function cacheLocalizedDetails(
//   details: ProjectRestDetails,
// ): Promise<void> {
//   try {
//     const value = omitLanguage(details);
//     const result =
//       details.language === "en"
//         ? await projectCacheService.setCachedProjectDetailsEn({ details: value })
//         : await projectCacheService.setCachedProjectDetailsAr({ details: value });

//     if (!result.ok) logCacheWarning("details write", result.error);
//   } catch (error) {
//     logCacheWarning(
//       "details write",
//       error instanceof Error ? error.message : "Unexpected cache error.",
//     );
//   }
// }

// function applyLocalizedProjectData(
//   source: ProjectData,
//   list: ProjectListItem,
//   details: ProjectRestDetails,
//   targetLanguage: Language,
// ): ProjectData {
//   return {
//     ...source,
//     language: targetLanguage,
//     title: list.title,
//     summary: list.summary,
//     description: details.description,
//     targetUsers: details.targetUsers,
//     availableResources: details.availableResources,
//     constraints: details.constraints,
//     yearPresentation: details.yearPresentation,
//     problemStatement: details.problemStatement,
//     proposedSolution: details.proposedSolution,
//     objectives: details.objectives,
//     features: details.features,
//   };
// }

// // ==========================================
// // Prepare Repository Write Data
// // ==========================================

// function parseWriteData<T>(
//   input: T,
//   images?: ProjectWriteData["images"],
// ): T & Partial<ProjectWriteData> {
//   return {
//     ...input,
//     ...(images !== undefined ? { images } : {}),
//   };
// }

// // ==========================================
// // Project Service
// // ==========================================

// export const projectService = {
//   // ==========================================
//   // List Projects
//   // ==========================================

//   async listProjects(
//     actor: ServerUser,
//     search: ProjectSearchPayload = {},
//     page = 1,
//     pageSize = 10,
//     targetLanguage: Language = "en",
//   ): Promise<ProjectListResult | ServiceError> {
//     try {
//       if (
//         actor.role !== "SUPERVISOR" &&
//         actor.role !== "STUDENT" &&
//         actor.role !== "ADMIN"
//       ) {
//         return toServiceError(new AppError("FORBIDDEN"));
//       }

//       const targetLocale = toTranslationLanguage(targetLanguage);
//       if (!targetLocale) {
//         return { error: "The requested project language is not supported." };
//       }

//       const supervisor = actor.role === "SUPERVISOR";

//       const { ids, totalCount } = await projectRepository.listIds({
//         query: search.query,
//         supervisorName: search.supervisorName,
//         projectType: search.projectType,
//         includeHidden: supervisor,
//         page,
//         pageSize,
//       });

//       if (ids.length === 0) {
//         return {
//           data: [],
//           pagination: getPaginationMeta(totalCount, page, pageSize),
//         };
//       }

//       // Redis is an optional cache. A cache failure must not prevent the DB read.
//       const cachedResult = await projectCacheService.getCachedLocalizedProjectList(
//         ids,
//         targetLocale,
//       );

//       const cachedItems =
//         "data" in cachedResult
//           ? cachedResult.data.lists
//           : (logCacheWarning("list read", cachedResult.error), []);

//       const cachedById = new Map<string, ProjectListItem>(
//         cachedItems
//           .filter(
//             (item) =>
//               ids.includes(item.id) && item.language === targetLocale,
//           )
//           .map((item) => [item.id, item] as const),
//       );

//       const missingIds = ids.filter((id) => !cachedById.has(id));
//       const freshItems: ProjectListItem[] = [];

//       if (missingIds.length > 0) {
//         const records = await projectRepository.findByIds(missingIds);
//         const sourceProjects = records.map((record) => toProjectDto(record));
//         const sourceItems: ProjectListItem[] = [];

//         for (const project of sourceProjects) {
//           const sourceLanguage = toTranslationLanguage(project.language);
//           if (!sourceLanguage) {
//             return {
//               error: `Project ${project.id} has an unsupported source language.`,
//             };
//           }

//           sourceItems.push(toProjectListItem(project, sourceLanguage));
//         }

//         const translationResult =
//           await projectTranslationService.translateProjectListItems(
//             sourceItems,
//             targetLocale,
//           );

//         if ("error" in translationResult) {
//           return { error: translationResult.error };
//         }

//         freshItems.push(...translationResult.data);
//         await cacheLocalizedListItems(freshItems, targetLocale);
//       }

//       const resultById = new Map<string, ProjectListItem>(cachedById);
//       for (const item of freshItems) {
//         resultById.set(item.id, item);
//       }

//       return {
//         data: ids.flatMap((id) => {
//           const item = resultById.get(id);
//           return item ? [item] : [];
//         }),
//         pagination: getPaginationMeta(totalCount, page, pageSize),
//       };
//     } catch (error) {
//       return toServiceError(error);
//     }
//   },

//   // ==========================================
//   // Get Project
//   // ==========================================

//   async getProjectById(
//     actor: ServerUser,
//     projectId: string,
//     targetLanguage: Language = "en",
//   ): Promise<{ data: ProjectData } | ServiceError> {
//     try {
//       if (actor.role !== "STUDENT" && actor.role !== "SUPERVISOR") {
//         return toServiceError(new AppError("FORBIDDEN"));
//       }

//       const targetLocale = toTranslationLanguage(targetLanguage);
//       if (!targetLocale) {
//         return { error: "The requested project language is not supported." };
//       }

//       // The full ProjectData DTO contains fields not represented by the cache DTOs
//       // (for example studentsPresented and full image metadata), so the repository
//       // remains the source of truth for the complete record.
//       const projectRecord = await projectRepository.findById(projectId);
//       if (!projectRecord) {
//         return toServiceError(new AppError("NOT_FOUND"));
//       }

//       const sourceProject = toProjectDto(projectRecord);
//       const sourceLanguage = toTranslationLanguage(sourceProject.language);
//       if (!sourceLanguage) {
//         return {
//           error: "The project's source language is not supported for translation.",
//         };
//       }

//       const [cachedListResult, cachedDetailsResult] = await Promise.all([
//         projectCacheService.getCachedLocalizedProjectItem(
//           projectId,
//           targetLocale,
//         ),
//         projectCacheService.getCachedLocalizedProjectDetails(
//           projectId,
//           targetLocale,
//         ),
//       ]);

//       let cachedList =
//         "data" in cachedListResult ? cachedListResult.data : null;
//       let cachedDetails =
//         "data" in cachedDetailsResult ? cachedDetailsResult.data : null;

//       if ("error" in cachedListResult) {
//         logCacheWarning("list read", cachedListResult.error);
//       }
//       if ("error" in cachedDetailsResult) {
//         logCacheWarning("details read", cachedDetailsResult.error);
//       }

//       const hasMismatchedCache =
//         (cachedList !== null &&
//           (cachedList.id !== projectId || cachedList.language !== targetLocale)) ||
//         (cachedDetails !== null &&
//           (cachedDetails.id !== projectId ||
//             cachedDetails.language !== targetLocale));

//       if (hasMismatchedCache) {
//         logCacheWarning(
//           "read",
//           "A cached project resource did not match its project ID or language.",
//         );
//         cachedList = null;
//         cachedDetails = null;
//         await invalidateProjectCache(projectId);
//       }

//       let localizedList = cachedList;
//       if (!localizedList) {
//         const translationResult =
//           await projectTranslationService.translateProjectListItem(
//             toProjectListItem(sourceProject, sourceLanguage),
//             targetLocale,
//           );

//         if ("error" in translationResult) {
//           return { error: translationResult.error };
//         }

//         localizedList = translationResult.data;
//         await cacheLocalizedListItem(localizedList);
//       }

//       let localizedDetails = cachedDetails;
//       if (!localizedDetails) {
//         const translationResult =
//           await projectTranslationService.translateProjectDetails(
//             toProjectRestDetails(sourceProject, sourceLanguage),
//             targetLocale,
//           );

//         if ("error" in translationResult) {
//           return { error: translationResult.error };
//         }

//         localizedDetails = translationResult.data;
//         await cacheLocalizedDetails(localizedDetails);
//       }

//       return {
//         data: applyLocalizedProjectData(
//           sourceProject,
//           localizedList,
//           localizedDetails,
//           targetLanguage,
//         ),
//       };
//     } catch (error) {
//       return toServiceError(error);
//     }
//   },

//   // ==========================================
//   // Get Project Image
//   // ==========================================

//   async getImage(
//     actor: ServerUser,
//     projectId: string,
//     imageId: string,
//   ): Promise<
//     | {
//         data: Uint8Array<ArrayBuffer>;
//         mimeType: string;
//         fileName: string | null;
//       }
//     | ServiceError
//   > {
//     try {
//       const project = await projectRepository.findById(projectId);
//       if (!project) {
//         return toServiceError(new AppError("NOT_FOUND"));
//       }

//       if (actor.role === "STUDENT" && project.visibility !== "VISIBLE") {
//         return toServiceError(new AppError("UNAUTHORIZED"));
//       }

//       const image = await projectRepository.getImage(projectId, imageId);
//       if (!image) {
//         return toServiceError(new AppError("NOT_FOUND"));
//       }

//       return image;
//     } catch (error) {
//       return toServiceError(error);
//     }
//   },

//   // ==========================================
//   // Create Project
//   // ==========================================

//   async create(
//     actor: ServerUser,
//     payload: CreateProjectPayload,
//     images?: ProjectWriteData["images"],
//   ): Promise<ServiceSuccess | ServiceError> {
//     try {
//       authorize(actor, "PROJECT_MANAGE");

//       const input = parseWriteData(payload, images);
//       await projectRepository.create(input);

//       return { ok: true };
//     } catch (error) {
//       return toServiceError(error);
//     }
//   },

//   // ==========================================
//   // Update Project
//   // ==========================================

//   async update(
//     actor: ServerUser,
//     projectId: string,
//     data: UpdateProjectData,
//     images?: ProjectWriteData["images"],
//   ): Promise<ServiceSuccess | ServiceError> {
//     try {
//       authorize(actor, "PROJECT_MANAGE");

//       const input = parseWriteData(data, images);
//       await projectRepository.update(projectId, input);
//       await invalidateProjectCache(projectId);

//       return { ok: true };
//     } catch (error) {
//       return toServiceError(error);
//     }
//   },

//   // ==========================================
//   // Set Project Visibility
//   // ==========================================

//   async setVisibility(
//     actor: ServerUser,
//     projectId: string,
//     visibility: "VISIBLE" | "HIDDEN",
//   ): Promise<ServiceSuccess | ServiceError> {
//     try {
//       authorize(actor, "PROJECT_MANAGE");

//       await projectRepository.setVisibility(projectId, visibility);
//       await invalidateProjectCache(projectId);

//       return { ok: true };
//     } catch (error) {
//       return toServiceError(error);
//     }
//   },

//   // ==========================================
//   // Delete Project
//   // ==========================================

//   async delete(
//     actor: ServerUser,
//     projectId: string,
//   ): Promise<ServiceSuccess | ServiceError> {
//     try {
//       authorize(actor, "PROJECT_MANAGE");

//       await projectRepository.delete(projectId);
//       await invalidateProjectCache(projectId);

//       return { ok: true };
//     } catch (error) {
//       return toServiceError(error);
//     }
//   },

//   // ==========================================
//   // Delete Project Image
//   // ==========================================

//   async deleteImage(
//     actor: ServerUser,
//     projectId: string,
//     imageId: string,
//   ): Promise<ServiceSuccess | ServiceError> {
//     try {
//       authorize(actor, "PROJECT_MANAGE");

//       await projectRepository.deleteImage(projectId, imageId);
//       await invalidateProjectCache(projectId);

//       return { ok: true };
//     } catch (error) {
//       return toServiceError(error);
//     }
//   },
// };


import "server-only";

import { Prisma, type Language } from "@prisma/client";
import type { ServerUser } from "@/core/auth/session";
import { authorize } from "@/core/authorization/authorization-layer";
import { AppError, toSafeMessage } from "@/core/errors/app-error";
import {
  projectRepository,
  type ProjectWriteData,
} from "@/modules/project/repositories/project-repository";
import { toProjectDto } from "@/modules/project/mappers/project-mapper";
import { projectCacheService } from "@/modules/project/cache/project-cache.service";
import { projectTranslationService } from "@/modules/translation/services/project-translation.service";
import type { TranslationLanguage } from "@/modules/translation/types/translation.types";
import {
  getPaginationMeta,
  type PaginationMeta,
} from "@/shared/utils/pagincation-utils";
import type {
  CreateProjectPayload,
  UpdateProjectData,
  ProjectSearchPayload,
} from "@/shared/validation/project";
import type {
  ProjectData,
  ProjectListItem,
  ProjectRestDetails,
} from "@/modules/project/types";
import type {
  ProjectCacheLanguage,
  ProjectCacheResource,
} from "@/modules/project/cache/project-cache.types";

// ==========================================
// Service Result Types
// ==========================================

type ServiceError = { error: string };
type ServiceSuccess = { ok: true };

type ProjectListResult = {
  data: ProjectListItem[];
  pagination: PaginationMeta;
};

// ==========================================
// Error Handling
// ==========================================

function toServiceError(error: unknown): ServiceError {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    appError = new AppError("CONFLICT");
  } else if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    appError = new AppError("NOT_FOUND");
  } else {
    appError = new AppError("INTERNAL");
  }

  return { error: toSafeMessage(appError) };
}

function toTranslationLanguage(language: unknown): TranslationLanguage | null {
  if (typeof language !== "string") return null;
  const normalized = language.trim().toLowerCase();
  return normalized === "en" || normalized === "ar" ? normalized : null;
}

function oppositeLanguage(language: ProjectCacheLanguage): ProjectCacheLanguage {
  return language === "en" ? "ar" : "en";
}

function logCacheWarning(operation: string, error: string): void {
  console.warn(`[Project] Cache ${operation} failed: ${error}`);
}

function logTranslationWarning(operation: string, error: string): void {
  console.warn(`[Project] Translation ${operation} failed; returning original project data: ${error}`);
}

// ==========================================
// Project Cache DTO Mapping
// ==========================================

function toProjectListItem(
  project: ProjectData,
  language: TranslationLanguage,
): ProjectListItem {
  return {
    id: project.id,
    language,
    title: project.title,
    summary: project.summary,
    projectSupervisorName: project.projectSupervisorName,
    projectType: project.projectType,
    visibility: project.visibility,
    technologies: project.technologies,
    // Keep the complete image metadata so ProjectData can be reconstructed
    // from the list and details cache resources without a database query.
    images: project.images,
    counts: project.counts,
  };
}

function toProjectRestDetails(
  project: ProjectData,
  language: TranslationLanguage,
): ProjectRestDetails {
  return {
    id: project.id,
    language,
    description: project.description,
    targetUsers: project.targetUsers,
    availableResources: project.availableResources,
    constraints: project.constraints,
    yearPresentation: project.yearPresentation,
    problemStatement: project.problemStatement,
    proposedSolution: project.proposedSolution,
    objectives: project.objectives,
    studentsPresented: project.studentsPresented,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    features: project.features,
  };
}

function omitLanguage<T extends { language: TranslationLanguage }>(
  value: T,
): Omit<T, "language"> {
  const { language: _language, ...data } = value;
  return data;
}

function isMatchingListItem(
  value: ProjectListItem | null | undefined,
  projectId: string,
  language: TranslationLanguage,
): value is ProjectListItem {
  return Boolean(
    value && value.id === projectId && value.language === language,
  );
}

function isMatchingDetails(
  value: ProjectRestDetails | null | undefined,
  projectId: string,
  language: TranslationLanguage,
): value is ProjectRestDetails {
  return Boolean(
    value && value.id === projectId && value.language === language,
  );
}

/**
 * The list and details resources together contain every ProjectData field.
 * This is why a complete cache hit does not need to query PostgreSQL.
 */
function toProjectDataFromCache(
  list: ProjectListItem,
  details: ProjectRestDetails,
  language: Language,
): ProjectData {
  return {
    id: list.id,
    title: list.title,
    summary: list.summary,
    description: details.description,
    targetUsers: details.targetUsers,
    availableResources: details.availableResources,
    constraints: details.constraints,
    yearPresentation: details.yearPresentation,
    problemStatement: details.problemStatement,
    proposedSolution: details.proposedSolution,
    language,
    objectives: details.objectives,
    projectSupervisorName: list.projectSupervisorName,
    studentsPresented: details.studentsPresented,
    projectType: list.projectType,
    visibility: list.visibility,
    createdAt: details.createdAt,
    updatedAt: details.updatedAt,
    features: details.features,
    technologies: list.technologies,
    images: list.images,
    counts: list.counts,
  };
}

// ==========================================
// Best-Effort Cache Reads and Writes
// ==========================================

async function readLocalizedProjectLists(
  projectIds: string[],
  language: TranslationLanguage,
): Promise<ProjectListItem[]> {
  try {
    const result = await projectCacheService.getCachedLocalizedProjectList(
      projectIds,
      language,
    );

    if ("error" in result) {
      logCacheWarning("list read", result.error);
      return [];
    }

    const requestedIds = new Set(projectIds);
    return result.data.lists.filter(
      (item: ProjectListItem) =>
        requestedIds.has(item.id) && item.language === language,
    );
  } catch (error) {
    logCacheWarning(
      "list read",
      error instanceof Error ? error.message : "Unexpected cache error.",
    );
    return [];
  }
}

async function readLocalizedFullProject(
  projectId: string,
  language: TranslationLanguage,
): Promise<{
  list: ProjectListItem | null;
  details: ProjectRestDetails | null;
}> {
  try {
    const result = await projectCacheService.getCachedFullProjectLocalized(
      projectId,
      language,
    );

    if ("error" in result) {
      logCacheWarning("full project read", result.error);
      return { list: null, details: null };
    }

    const list = isMatchingListItem(
      result.data?.list,
      projectId,
      language,
    )
      ? result.data.list
      : null;
    const details = isMatchingDetails(
      result.data?.details,
      projectId,
      language,
    )
      ? result.data.details
      : null;

    if (result.data?.list && !list) {
      await invalidateProjectResources(projectId, ["list"], [language]);
    }
    if (result.data?.details && !details) {
      await invalidateProjectResources(projectId, ["details"], [language]);
    }

    return { list, details };
  } catch (error) {
    logCacheWarning(
      "full project read",
      error instanceof Error ? error.message : "Unexpected cache error.",
    );
    return { list: null, details: null };
  }
}

async function writeLocalizedListItem(item: ProjectListItem): Promise<boolean> {
  try {
    const list = omitLanguage(item);
    const result =
      item.language === "en"
        ? await projectCacheService.setCachedProjectListEn({ list })
        : await projectCacheService.setCachedProjectListAr({ list });

    if (!result.ok) {
      logCacheWarning("list write", result.error);
      return false;
    }
    return true;
  } catch (error) {
    logCacheWarning(
      "list write",
      error instanceof Error ? error.message : "Unexpected cache error.",
    );
    return false;
  }
}

async function writeLocalizedDetails(
  details: ProjectRestDetails,
): Promise<boolean> {
  try {
    const value = omitLanguage(details);
    const result =
      details.language === "en"
        ? await projectCacheService.setCachedProjectDetailsEn({ details: value })
        : await projectCacheService.setCachedProjectDetailsAr({ details: value });

    if (!result.ok) {
      logCacheWarning("details write", result.error);
      return false;
    }
    return true;
  } catch (error) {
    logCacheWarning(
      "details write",
      error instanceof Error ? error.message : "Unexpected cache error.",
    );
    return false;
  }
}

async function writeLocalizedListItems(items: ProjectListItem[]): Promise<void> {
  if (items.length === 0) return;

  const english = items
    .filter((item) => item.language === "en")
    .map(omitLanguage);
  const arabic = items
    .filter((item) => item.language === "ar")
    .map(omitLanguage);

  try {
    const results = await Promise.all([
      english.length > 0
        ? projectCacheService.setCachedProjectItemsEn({ list: english })
        : Promise.resolve({ ok: true as const }),
      arabic.length > 0
        ? projectCacheService.setCachedProjectItemsAr({ list: arabic })
        : Promise.resolve({ ok: true as const }),
    ]);

    for (const result of results) {
      if (!result.ok) logCacheWarning("list batch write", result.error);
    }
  } catch (error) {
    logCacheWarning(
      "list batch write",
      error instanceof Error ? error.message : "Unexpected cache error.",
    );
  }
}

async function invalidateProjectResources(
  projectId: string,
  resources: ProjectCacheResource[],
  languages: ProjectCacheLanguage[] = ["en", "ar"],
): Promise<boolean> {
  try {
    const result = await projectCacheService.invalidateProjectResources(
      projectId,
      resources,
      languages,
    );
    if (!result.ok) {
      logCacheWarning("resource invalidation", result.error);
      return false;
    }
    return true;
  } catch (error) {
    logCacheWarning(
      "resource invalidation",
      error instanceof Error ? error.message : "Unexpected cache error.",
    );
    return false;
  }
}

async function invalidateProjectCache(projectId: string): Promise<void> {
  try {
    const result = await projectCacheService.invalidateProject(projectId);
    if (!result.ok) logCacheWarning("invalidation", result.error);
  } catch (error) {
    logCacheWarning(
      "invalidation",
      error instanceof Error ? error.message : "Unexpected cache error.",
    );
  }
}

// ==========================================
// Best-Effort Translation
// ==========================================

async function translateListOrOriginal(
  item: ProjectListItem,
  targetLanguage: TranslationLanguage,
): Promise<{ item: ProjectListItem; translated: boolean }> {
  try {
    const result = await projectTranslationService.translateProjectListItem(
      item,
      targetLanguage,
    );

    if ("error" in result) {
      logTranslationWarning(`list item ${item.id}`, result.error);
      return { item, translated: false };
    }

    if (result.data.id !== item.id || result.data.language !== targetLanguage) {
      logTranslationWarning(
        `list item ${item.id}`,
        "Translation returned a mismatched project ID or language.",
      );
      return { item, translated: false };
    }

    return { item: result.data, translated: true };
  } catch (error) {
    logTranslationWarning(
      `list item ${item.id}`,
      error instanceof Error ? error.message : "Unexpected translation error.",
    );
    return { item, translated: false };
  }
}

async function translateDetailsOrOriginal(
  details: ProjectRestDetails,
  targetLanguage: TranslationLanguage,
): Promise<{ details: ProjectRestDetails; translated: boolean }> {
  try {
    const result = await projectTranslationService.translateProjectDetails(
      details,
      targetLanguage,
    );

    if ("error" in result) {
      logTranslationWarning(`details ${details.id}`, result.error);
      return { details, translated: false };
    }

    if (
      result.data.id !== details.id ||
      result.data.language !== targetLanguage
    ) {
      logTranslationWarning(
        `details ${details.id}`,
        "Translation returned a mismatched project ID or language.",
      );
      return { details, translated: false };
    }

    return { details: result.data, translated: true };
  } catch (error) {
    logTranslationWarning(
      `details ${details.id}`,
      error instanceof Error ? error.message : "Unexpected translation error.",
    );
    return { details, translated: false };
  }
}

// ==========================================
// Cache Refresh After Mutations
// ==========================================

function mergeListMetadata(
  cached: ProjectListItem,
  source: ProjectListItem,
): ProjectListItem {
  return {
    ...cached,
    projectSupervisorName: source.projectSupervisorName,
    projectType: source.projectType,
    visibility: source.visibility,
    technologies: source.technologies,
    images: source.images,
    counts: source.counts,
  };
}

/**
 * Visibility and image changes affect only the list resource. Existing localized
 * titles and summaries are retained for the opposite language.
 */
async function refreshProjectListCache(projectId: string): Promise<void> {
  try {
    const record = await projectRepository.findById(projectId);
    if (!record) {
      await invalidateProjectResources(projectId, ["list"]);
      return;
    }

    const project = toProjectDto(record);
    const sourceLanguage = toTranslationLanguage(project.language);
    if (!sourceLanguage) {
      await invalidateProjectResources(projectId, ["list"]);
      return;
    }

    const cachedResult = await projectCacheService.getCachedProjectItem(projectId);
    let english: ProjectListItem | undefined;
    let arabic: ProjectListItem | undefined;

    if ("error" in cachedResult) {
      logCacheWarning("list refresh read", cachedResult.error);
      // We cannot safely preserve a localized title/summary if the cache read
      // failed. Remove both variants and repopulate only the source language.
      await invalidateProjectResources(projectId, ["list"]);
    } else {
      english = cachedResult.data.en?.list;
      arabic = cachedResult.data.ar?.list;
    }

    const sourceItem = toProjectListItem(project, sourceLanguage);
    const itemsToWrite: ProjectListItem[] = [];

    if (sourceLanguage === "en") {
      itemsToWrite.push(sourceItem);
      if (arabic) itemsToWrite.push(mergeListMetadata(arabic, sourceItem));
    } else {
      itemsToWrite.push(sourceItem);
      if (english) itemsToWrite.push(mergeListMetadata(english, sourceItem));
    }

    let allWritesSucceeded = true;
    for (const item of itemsToWrite) {
      const succeeded = await writeLocalizedListItem(item);
      if (!succeeded) allWritesSucceeded = false;
    }

    if (!allWritesSucceeded) {
      await invalidateProjectResources(projectId, ["list"]);
    }
  } catch (error) {
    logCacheWarning(
      "list refresh",
      error instanceof Error ? error.message : "Unexpected cache refresh error.",
    );
    // A mutation has already succeeded. If refresh fails, invalidate the
    // affected resource so stale data is not knowingly served.
    await invalidateProjectResources(projectId, ["list"]);
  }
}

/**
 * A general project update refreshes list + details in the source language and
 * removes only those two resources in the opposite language. Suggestions are
 * deliberately left untouched.
 */
async function refreshProjectCacheAfterUpdate(projectId: string): Promise<void> {
  try {
    const record = await projectRepository.findById(projectId);
    if (!record) {
      await invalidateProjectResources(projectId, ["list", "details"]);
      return;
    }

    const project = toProjectDto(record);
    const sourceLanguage = toTranslationLanguage(project.language);
    if (!sourceLanguage) {
      await invalidateProjectResources(projectId, ["list", "details"]);
      return;
    }

    const sourceList = toProjectListItem(project, sourceLanguage);
    const sourceDetails = toProjectRestDetails(project, sourceLanguage);
    const opposite = oppositeLanguage(sourceLanguage);

    // Remove stale translations before writing the fresh source-language data.
    const oppositeRemoved = await invalidateProjectResources(
      projectId,
      ["list", "details"],
      [opposite],
    );
    if (!oppositeRemoved) {
      // Retry by clearing both locales. If Redis is recovering from a transient
      // failure, this prevents an old translation from surviving the update.
      await invalidateProjectResources(projectId, ["list", "details"]);
    }

    const [listWritten, detailsWritten] = await Promise.all([
      writeLocalizedListItem(sourceList),
      writeLocalizedDetails(sourceDetails),
    ]);

    if (!listWritten || !detailsWritten) {
      // Avoid serving stale source or translated resources after a partial write.
      await invalidateProjectResources(projectId, ["list", "details"]);
    }
  } catch (error) {
    logCacheWarning(
      "project update refresh",
      error instanceof Error ? error.message : "Unexpected cache refresh error.",
    );
    await invalidateProjectResources(projectId, ["list", "details"]);
  }
}

async function cacheSourceProject(
  project: ProjectData,
  sourceLanguage: TranslationLanguage,
): Promise<void> {
  await Promise.all([
    writeLocalizedListItem(toProjectListItem(project, sourceLanguage)),
    writeLocalizedDetails(toProjectRestDetails(project, sourceLanguage)),
  ]);
}

function extractProjectId(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    value.id.trim().length > 0
  ) {
    return value.id;
  }
  return null;
}

// ==========================================
// Prepare Repository Write Data
// ==========================================

function parseWriteData<T>(
  input: T,
  images?: ProjectWriteData["images"],
): T & Partial<ProjectWriteData> {
  return {
    ...input,
    ...(images !== undefined ? { images } : {}),
  };
}

// ==========================================
// Project Service
// ==========================================

export const projectService = {
  // ==========================================
  // List Projects
  // ==========================================

  async listProjects(
    actor: ServerUser,
    search: ProjectSearchPayload = {},
    page = 1,
    pageSize = 10,
    targetLanguage: Language = "en",
  ): Promise<ProjectListResult | ServiceError> {
    try {
      if (
        actor.role !== "SUPERVISOR" &&
        actor.role !== "STUDENT" &&
        actor.role !== "ADMIN"
      ) {
        return toServiceError(new AppError("FORBIDDEN"));
      }

      const targetLocale = toTranslationLanguage(targetLanguage);
      if (!targetLocale) {
        return { error: "The requested project language is not supported." };
      }

      // Listing always queries IDs because filtering, visibility, ordering and
      // pagination belong to PostgreSQL. Project payloads are then cache-first.
      const { ids, totalCount } = await projectRepository.listIds({
        query: search.query,
        supervisorName: search.supervisorName,
        projectType: search.projectType,
        includeHidden: actor.role === "SUPERVISOR",
        page,
        pageSize,
      });

      if (ids.length === 0) {
        return {
          data: [],
          pagination: getPaginationMeta(totalCount, page, pageSize),
        };
      }

      const cachedItems = await readLocalizedProjectLists(ids, targetLocale);
      const cachedById = new Map(cachedItems.map((item) => [item.id, item]));
      const missingIds = ids.filter((id) => !cachedById.has(id));
      let freshItems: ProjectListItem[] = [];

      if (missingIds.length > 0) {
        // Only cache misses are loaded from PostgreSQL.
        const records = await projectRepository.findByIds(missingIds);
        const sourceItems: ProjectListItem[] = [];

        for (const record of records) {
          const project = toProjectDto(record);
          const sourceLanguage = toTranslationLanguage(project.language);
          if (!sourceLanguage) {
            // The source value is still useful; return it without attempting to
            // translate or cache it under an unsupported language key.
            console.warn(
              `[Project] Project ${project.id} has an unsupported source language; returning its original list item.`,
            );
            continue;
          }
          sourceItems.push(toProjectListItem(project, sourceLanguage));
        }

        try {
          const translatedResult =
            await projectTranslationService.translateProjectListItems(
              sourceItems,
              targetLocale,
            );

          if (
            "error" in translatedResult ||
            translatedResult.data.length !== sourceItems.length ||
            translatedResult.data.some(
              (item, index) =>
                !item ||
                item.id !== sourceItems[index]?.id ||
                (item.language !== targetLocale &&
                  item.language !== sourceItems[index]?.language),
            )
          ) {
            const reason =
              "error" in translatedResult
                ? translatedResult.error
                : "Translation returned an incomplete or mismatched list.";
            logTranslationWarning("project list batch", reason);
            freshItems = sourceItems;
          } else {
            freshItems = translatedResult.data;
          }
        } catch (error) {
          logTranslationWarning(
            "project list batch",
            error instanceof Error ? error.message : "Unexpected translation error.",
          );
          freshItems = sourceItems;
        }

        // Store each item under the language actually present in its text.
        // A failed translation must never be cached under the requested locale.
        await writeLocalizedListItems(freshItems);
      }

      const resultById = new Map<string, ProjectListItem>(cachedById);
      for (const item of freshItems) resultById.set(item.id, item);

      return {
        data: ids.flatMap((id) => {
          const item = resultById.get(id);
          return item ? [item] : [];
        }),
        pagination: getPaginationMeta(totalCount, page, pageSize),
      };
    } catch (error) {
      return toServiceError(error);
    }
  },

  // ==========================================
  // Get Project
  // ==========================================

  async getProjectById(
    actor: ServerUser,
    projectId: string,
    targetLanguage: Language = "en",
  ): Promise<{ data: ProjectData } | ServiceError> {
    try {
      if (actor.role !== "STUDENT" && actor.role !== "SUPERVISOR") {
        return toServiceError(new AppError("FORBIDDEN"));
      }

      const targetLocale = toTranslationLanguage(targetLanguage);
      if (!targetLocale) {
        return { error: "The requested project language is not supported." };
      }

      // Try the complete localized cache before touching PostgreSQL.
      const cached = await readLocalizedFullProject(projectId, targetLocale);
      if (cached.list && cached.details) {
        return {
          data: toProjectDataFromCache(cached.list, cached.details, targetLanguage),
        };
      }

      // At least one required resource is missing. Load the source project once,
      // then build only the missing localized resource(s).
      const record = await projectRepository.findById(projectId);
      if (!record) return toServiceError(new AppError("NOT_FOUND"));

      const sourceProject = toProjectDto(record);
      const sourceLanguage = toTranslationLanguage(sourceProject.language);
      if (!sourceLanguage) {
        // Unsupported source language: return the database DTO unchanged.
        return { data: sourceProject };
      }

      let localizedList = cached.list;
      let localizedDetails = cached.details;
      let translationFailed = false;

      if (!localizedList) {
        const translated = await translateListOrOriginal(
          toProjectListItem(sourceProject, sourceLanguage),
          targetLocale,
        );
        localizedList = translated.item;
        if (!translated.translated) translationFailed = true;
        else await writeLocalizedListItem(localizedList);
      }

      if (!localizedDetails) {
        const translated = await translateDetailsOrOriginal(
          toProjectRestDetails(sourceProject, sourceLanguage),
          targetLocale,
        );
        localizedDetails = translated.details;
        if (!translated.translated) translationFailed = true;
        else await writeLocalizedDetails(localizedDetails);
      }

      if (translationFailed) {
        // Do not mix cached target-language text with untranslated source text.
        // Return the complete original database DTO and retain a source-language
        // cache snapshot for subsequent requests.
        await cacheSourceProject(sourceProject, sourceLanguage);
        return { data: sourceProject };
      }

      if (
        !localizedList ||
        !localizedDetails ||
        localizedList.language !== targetLocale ||
        localizedDetails.language !== targetLocale
      ) {
        // Defensive fallback: incomplete translation is treated like a failed
        // translation, not as a failed project read.
        logTranslationWarning(
          `project ${projectId}`,
          "Translation did not produce all requested localized resources.",
        );
        await cacheSourceProject(sourceProject, sourceLanguage);
        return { data: sourceProject };
      }

      return {
        data: toProjectDataFromCache(
          localizedList,
          localizedDetails,
          targetLanguage,
        ),
      };
    } catch (error) {
      return toServiceError(error);
    }
  },

  // ==========================================
  // Get Project Image
  // ==========================================

  async getImage(
    actor: ServerUser,
    projectId: string,
    imageId: string,
  ): Promise<
    | {
        data: Uint8Array<ArrayBuffer>;
        mimeType: string;
        fileName: string | null;
      }
    | ServiceError
  > {
    try {
      const project = await projectRepository.findById(projectId);
      if (!project) return toServiceError(new AppError("NOT_FOUND"));

      if (actor.role === "STUDENT" && project.visibility !== "VISIBLE") {
        return toServiceError(new AppError("UNAUTHORIZED"));
      }

      const image = await projectRepository.getImage(projectId, imageId);
      if (!image) return toServiceError(new AppError("NOT_FOUND"));

      return image;
    } catch (error) {
      return toServiceError(error);
    }
  },

  // ==========================================
  // Create Project
  // ==========================================

  async create(
    actor: ServerUser,
    payload: CreateProjectPayload,
    images?: ProjectWriteData["images"],
  ): Promise<ServiceSuccess | ServiceError> {
    try {
      authorize(actor, "PROJECT_MANAGE");
      const input = parseWriteData(payload, images);
      const createdRecord: unknown = await projectRepository.create(input);
      const createdProjectId = extractProjectId(createdRecord);
      if (createdProjectId) {
        await refreshProjectCacheAfterUpdate(createdProjectId);
      }
      return { ok: true };
    } catch (error) {
      return toServiceError(error);
    }
  },

  // ==========================================
  // Update Project
  // ==========================================

  async update(
    actor: ServerUser,
    projectId: string,
    data: UpdateProjectData,
    images?: ProjectWriteData["images"],
  ): Promise<ServiceSuccess | ServiceError> {
    try {
      authorize(actor, "PROJECT_MANAGE");
      const input = parseWriteData(data, images);
      await projectRepository.update(projectId, input);

      // A cache refresh failure must not undo or fail a successful DB mutation.
      await refreshProjectCacheAfterUpdate(projectId);
      return { ok: true };
    } catch (error) {
      return toServiceError(error);
    }
  },

  // ==========================================
  // Set Project Visibility
  // ==========================================

  async setVisibility(
    actor: ServerUser,
    projectId: string,
    visibility: "VISIBLE" | "HIDDEN",
  ): Promise<ServiceSuccess | ServiceError> {
    try {
      authorize(actor, "PROJECT_MANAGE");
      await projectRepository.setVisibility(projectId, visibility);

      // Visibility is non-translatable metadata: update list only and preserve
      // both language variants when the opposite-language entry is cached.
      await refreshProjectListCache(projectId);
      return { ok: true };
    } catch (error) {
      return toServiceError(error);
    }
  },

  // ==========================================
  // Delete Project
  // ==========================================

  async delete(
    actor: ServerUser,
    projectId: string,
  ): Promise<ServiceSuccess | ServiceError> {
    try {
      authorize(actor, "PROJECT_MANAGE");
      await projectRepository.delete(projectId);
      await invalidateProjectCache(projectId);
      return { ok: true };
    } catch (error) {
      return toServiceError(error);
    }
  },

  // ==========================================
  // Delete Project Image
  // ==========================================

  async deleteImage(
    actor: ServerUser,
    projectId: string,
    imageId: string,
  ): Promise<ServiceSuccess | ServiceError> {
    try {
      authorize(actor, "PROJECT_MANAGE");
      await projectRepository.deleteImage(projectId, imageId);

      // Image previews/counts live in the list cache resource.
      await refreshProjectListCache(projectId);
      return { ok: true };
    } catch (error) {
      return toServiceError(error);
    }
  },
};
