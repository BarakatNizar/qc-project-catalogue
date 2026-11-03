// import "server-only";

// import { createHash } from "node:crypto";

// import type { ProjectDto } from "@/modules/project/types";
// import {
//   redisDeleteMany,
//   redisGetManyJson,
//   redisSetManyJson,
// } from "@/infrastructure/redis/redis-operations";
// import { parseRedisError } from "@/infrastructure/redis/redis-error-parser";
// import type { RedisResult } from "@/infrastructure/redis/redis.types";

// import type {
//   CachedProjectLookup,
//   CachedProjectSnapshot,
//   ProjectCacheLanguage,
//   ProjectCacheWrite,
// } from "./project-cache.types";

// const PROJECT_CACHE_SCHEMA_VERSION = 1;
// const PROJECT_CACHE_KEY_VERSION = "v1";
// const DEFAULT_PROJECT_CACHE_TTL_SECONDS = 15 * 60;

// interface ProjectSourceEnvelope {
//   schemaVersion: number;
//   fingerprint: string;
//   data: unknown;
// }

// interface ProjectLocalizedEnvelope {
//   schemaVersion: number;
//   sourceFingerprint: string;
//   data: unknown;
// }

// function getProjectCacheTtlSeconds(): number {
//   const configured = Number.parseInt(
//     process.env.PROJECT_CACHE_TTL_SECONDS ?? "",
//     10,
//   );

//   return Number.isFinite(configured) && configured > 0
//     ? configured
//     : DEFAULT_PROJECT_CACHE_TTL_SECONDS;
// }

// function projectKey(projectId: string, suffix: string): string {
//   return `project:${PROJECT_CACHE_KEY_VERSION}:${encodeURIComponent(projectId)}:${suffix}`;
// }

// function sourceKey(projectId: string): string {
//   return projectKey(projectId, "source");
// }

// function languageKey( projectId: string, language: ProjectCacheLanguage, ): string {
//   return projectKey(projectId, `language:${language}`);
// }

// function isRecord(value: unknown): value is Record<string, unknown> {
//   return typeof value === "object" && value !== null && !Array.isArray(value);
// }

// function isValidDate(value: unknown): value is string | Date {
//   if (value instanceof Date) return Number.isFinite(value.getTime());
//   if (typeof value !== "string") return false;
//   return Number.isFinite(new Date(value).getTime());
// }

// function hydrateProjectDto(value: unknown): ProjectDto | null {
//   if (!isRecord(value)) return null;

//   const requiredStrings = [
//     "id",
//     "title",
//     "summary",
//     "description",
//     "problemStatement",
//     "proposedSolution",
//     "objectives",
//   ];

//   if (requiredStrings.some((key) => typeof value[key] !== "string")) {
//     return null;
//   }

//   if (
//     !(value.projectType === "GRADUATION" || value.projectType === "PRE_GRADUATION") ||
//     !(value.visibility === "VISIBLE" || value.visibility === "HIDDEN") ||
//     !(value.projectSupervisorName === null || typeof value.projectSupervisorName === "string") ||
//     !(value.targetUsers === null || typeof value.targetUsers === "string") ||
//     !(value.availableResources === null || typeof value.availableResources === "string") ||
//     !(value.constraints === null || typeof value.constraints === "string") ||
//     !(value.yearPresentation === undefined || value.yearPresentation === null || typeof value.yearPresentation === "string") ||
//     !isValidDate(value.createdAt) ||
//     !isValidDate(value.updatedAt) ||
//     !Array.isArray(value.features) ||
//     !Array.isArray(value.technologies) ||
//     !Array.isArray(value.images) ||
//     !isRecord(value.counts) ||
//     typeof value.counts.images !== "number" ||
//     typeof value.counts.suggestions !== "number"
//   ) {
//     return null;
//   }

//   const features = value.features.map((feature) => {
//     if (
//       !isRecord(feature) ||
//       typeof feature.id !== "string" ||
//       typeof feature.content !== "string" ||
//       !(feature.scope === "IN_SCOPE" || feature.scope === "OUT_OF_SCOPE") ||
//       typeof feature.sortOrder !== "number"
//     ) {
//       return null;
//     }

//     return {
//       id: feature.id,
//       content: feature.content,
//       scope: feature.scope,
//       sortOrder: feature.sortOrder,
//     };
//   });

//   const technologies = value.technologies.map((technology) => {
//     if (
//       !isRecord(technology) ||
//       typeof technology.id !== "string" ||
//       typeof technology.name !== "string" ||
//       typeof technology.sortOrder !== "number"
//     ) {
//       return null;
//     }

//     return {
//       id: technology.id,
//       name: technology.name,
//       sortOrder: technology.sortOrder,
//     };
//   });

//   const images = value.images.map((image) => {
//     if (
//       !isRecord(image) ||
//       typeof image.id !== "string" ||
//       typeof image.mimeType !== "string" ||
//       !(image.fileName === null || typeof image.fileName === "string") ||
//       typeof image.fileSizeBytes !== "number" ||
//       typeof image.sortOrder !== "number" ||
//       !isValidDate(image.createdAt)
//     ) {
//       return null;
//     }

//     return {
//       id: image.id,
//       mimeType: image.mimeType,
//       fileName: image.fileName,
//       fileSizeBytes: image.fileSizeBytes,
//       sortOrder: image.sortOrder,
//       createdAt: new Date(image.createdAt),
//     };
//   });

//   if (
//     features.some((item) => item === null) ||
//     technologies.some((item) => item === null) ||
//     images.some((item) => item === null)
//   ) {
//     return null;
//   }

//   return {
//     id: value.id as string,
//     title: value.title as string,
//     summary: value.summary as string,
//     description: value.description as string,
//     targetUsers: value.targetUsers as string | null,
//     availableResources: value.availableResources as string | null,
//     constraints: value.constraints as string | null,
//     yearPresentation: value.yearPresentation as string | null | undefined,
//     problemStatement: value.problemStatement as string,
//     proposedSolution: value.proposedSolution as string,
//     objectives: value.objectives as string,
//     projectSupervisorName: value.projectSupervisorName as string | null,
//     projectType: value.projectType,
//     visibility: value.visibility,
//     createdAt: new Date(value.createdAt),
//     updatedAt: new Date(value.updatedAt),
//     features: features as ProjectDto["features"],
//     technologies: technologies as ProjectDto["technologies"],
//     images: images as ProjectDto["images"],
//     counts: {
//       images: value.counts.images,
//       suggestions: value.counts.suggestions,
//     },
//   };
// }

// /**
//  * Creates a stable fingerprint for the original DTO. Localized cache entries
//  * are accepted only when their fingerprint matches the current source DTO.
//  */
// function createProjectFingerprint(project: ProjectDto): string {
//   const stableValue = {
//     id: project.id,
//     title: project.title,
//     summary: project.summary,
//     description: project.description,
//     targetUsers: project.targetUsers,
//     availableResources: project.availableResources,
//     constraints: project.constraints,
//     yearPresentation: project.yearPresentation ?? null,
//     problemStatement: project.problemStatement,
//     proposedSolution: project.proposedSolution,
//     objectives: project.objectives,
//     projectSupervisorName: project.projectSupervisorName,
//     projectType: project.projectType,
//     visibility: project.visibility,
//     createdAt: project.createdAt.toISOString(),
//     updatedAt: project.updatedAt.toISOString(),
//     features: project.features.map((feature) => ({
//       id: feature.id,
//       content: feature.content,
//       scope: feature.scope,
//       sortOrder: feature.sortOrder,
//     })),
//     technologies: project.technologies.map((technology) => ({
//       id: technology.id,
//       name: technology.name,
//       sortOrder: technology.sortOrder,
//     })),
//     images: project.images.map((image) => ({
//       id: image.id,
//       mimeType: image.mimeType,
//       fileName: image.fileName,
//       fileSizeBytes: image.fileSizeBytes,
//       sortOrder: image.sortOrder,
//       createdAt: image.createdAt.toISOString(),
//     })),
//     counts: project.counts,
//   };

//   return createHash("sha256")
//     .update(JSON.stringify(stableValue))
//     .digest("hex");
// }

// function readSourceEnvelope(value: unknown): { fingerprint: string; data: ProjectDto; } | null {
//   if (
//     !isRecord(value) ||
//     value.schemaVersion !== PROJECT_CACHE_SCHEMA_VERSION ||
//     typeof value.fingerprint !== "string"
//   ) {
//     return null;
//   }

//   const data = hydrateProjectDto(value.data);
//   return data ? { fingerprint: value.fingerprint, data } : null;
// }

// function readLocalizedEnvelope( value: unknown, sourceFingerprint: string, ): ProjectDto | null {
//   if (
//     !isRecord(value) ||
//     value.schemaVersion !== PROJECT_CACHE_SCHEMA_VERSION ||
//     value.sourceFingerprint !== sourceFingerprint
//   ) {
//     return null;
//   }

//   return hydrateProjectDto(value.data);
// }

// function buildSnapshot( projectId: string, values: Array<unknown | null>, ): CachedProjectLookup {
//   const sourceEnvelope = readSourceEnvelope(values[0]);

//   if (!sourceEnvelope || sourceEnvelope.data.id !== projectId) {
//     return { projectId, data: null };
//   }

//   const english = readLocalizedEnvelope(values[1], sourceEnvelope.fingerprint);
//   const arabic = readLocalizedEnvelope(values[2], sourceEnvelope.fingerprint);

//   return {
//     projectId,
//     data: {
//       source: sourceEnvelope.data,
//       translations: {
//         en: english,
//         ar: arabic,
//       },
//     },
//   };
// }

// function buildProjectKeys(projectId: string): string[] {
//   return [sourceKey(projectId), languageKey(projectId, "en"), languageKey(projectId, "ar")];
// }

// export async function getCachedProject( projectId: string, ): Promise<RedisResult<CachedProjectSnapshot | null>> {
//   try {
//     const redisResult = await redisGetManyJson<unknown>(buildProjectKeys(projectId));
//     if ("error" in redisResult) return redisResult;
//     return { data: buildSnapshot(projectId, redisResult.data).data };
//   } catch (error) {
//     return { error: parseRedisError(error, "GET") };
//   }
// }

// export async function setCachedProject( write: ProjectCacheWrite, ): Promise<RedisResult<null>> {
//   try {
//     const fingerprint = createProjectFingerprint(write.source);
//     const entries: Array<{ key: string; value: unknown }> = [
//       {
//         key: sourceKey(write.source.id),
//         value: {
//           schemaVersion: PROJECT_CACHE_SCHEMA_VERSION,
//           fingerprint,
//           data: write.source,
//         } satisfies ProjectSourceEnvelope,
//       },
//     ];

//     if (write.localized) {
//       if (write.localized.data.id !== write.source.id) {
//         return { error: "Localized project ID does not match its source project ID." };
//       }

//       entries.push({
//         key: languageKey(write.source.id, write.localized.language),
//         value: {
//           schemaVersion: PROJECT_CACHE_SCHEMA_VERSION,
//           sourceFingerprint: fingerprint,
//           data: write.localized.data,
//         } satisfies ProjectLocalizedEnvelope,
//       });
//     }

//     return redisSetManyJson(entries, getProjectCacheTtlSeconds());
//   } catch (error) {
//     return { error: parseRedisError(error, "SET") };
//   }
// }

// export async function getCachedProjects( projectIds: string[], ): Promise<RedisResult<CachedProjectLookup[]>> {
//   if (projectIds.length === 0) return { data: [] };

//   try {
//     const keys = projectIds.flatMap(buildProjectKeys);
//     const redisResult = await redisGetManyJson<unknown>(keys);
//     if ("error" in redisResult) return redisResult;

//     const lookups = projectIds.map((projectId, index) => {
//       const start = index * 3;
//       return buildSnapshot(projectId, redisResult.data.slice(start, start + 3));
//     });

//     return { data: lookups };
//   } catch (error) {
//     return { error: parseRedisError(error, "MGET") };
//   }
// }


// /**
//  * Batch lookup for a page whose source DTOs have just been loaded from the
//  * repository. Comparing fingerprints prevents serving a localized DTO for an
//  * older source snapshot if invalidation previously failed.
//  */
// export async function getCachedLocalizedProjects( sourceProjects: ProjectDto[], language: ProjectCacheLanguage, ): Promise<RedisResult<Array<ProjectDto | null>>> {
//   if (sourceProjects.length === 0) return { data: [] };

//   try {
//     const cachedResult = await getCachedProjects(
//       sourceProjects.map((project) => project.id),
//     );
//     if ("error" in cachedResult) return cachedResult;

//     const localized = sourceProjects.map((sourceProject, index) => {
//       const cached = cachedResult.data[index]?.data;
//       if (!cached) return null;

//       const currentFingerprint = createProjectFingerprint(sourceProject);
//       const cachedSourceFingerprint = createProjectFingerprint(cached.source);

//       if (currentFingerprint !== cachedSourceFingerprint) return null;
//       return cached.translations[language];
//     });

//     return { data: localized };
//   } catch (error) {
//     return { error: parseRedisError(error, "MGET") };
//   }
// }

// export async function setCachedProjects(
//   writes: ProjectCacheWrite[],
// ): Promise<RedisResult<null>> {
//   if (writes.length === 0) return { data: null };

//   try {
//     const entries = new Map<string, unknown>();

//     for (const write of writes) {
//       const fingerprint = createProjectFingerprint(write.source);

//       entries.set(sourceKey(write.source.id), {
//         schemaVersion: PROJECT_CACHE_SCHEMA_VERSION,
//         fingerprint,
//         data: write.source,
//       } satisfies ProjectSourceEnvelope);

//       if (write.localized) {
//         if (write.localized.data.id !== write.source.id) {
//           return { error: "Localized project ID does not match its source project ID." };
//         }

//         entries.set(languageKey(write.source.id, write.localized.language), {
//           schemaVersion: PROJECT_CACHE_SCHEMA_VERSION,
//           sourceFingerprint: fingerprint,
//           data: write.localized.data,
//         } satisfies ProjectLocalizedEnvelope);
//       }
//     }

//     return redisSetManyJson(
//       [...entries].map(([key, value]) => ({ key, value })),
//       getProjectCacheTtlSeconds(),
//     );
//   } catch (error) {
//     return { error: parseRedisError(error, "MSET") };
//   }
// }

// export async function invalidateCachedProject(
//   projectId: string,
// ): Promise<RedisResult<null>> {
//   return redisDeleteMany(buildProjectKeys(projectId));
// }

// export async function invalidateCachedProjects(
//   projectIds: string[],
// ): Promise<RedisResult<null>> {
//   return redisDeleteMany(projectIds.flatMap(buildProjectKeys));
// }



import "server-only";

import { createHash } from "node:crypto";

import type { ProjectDto } from "@/modules/project/types";
import {
  redisDeleteMany,
  redisGetManyJson,
  redisSetManyJson,
} from "@/infrastructure/redis/redis-operations";
import { getRedisClient } from "@/infrastructure/redis/redis-client";
import { parseRedisError } from "@/infrastructure/redis/redis-error-parser";
import type { RedisResult } from "@/infrastructure/redis/redis.types";

import type {
  CachedProjectLookup,
  CachedProjectSnapshot,
  ProjectCacheLanguage,
  ProjectCacheWrite,
} from "./project-cache.types";

const PROJECT_CACHE_SCHEMA_VERSION = 1;
const PROJECT_CACHE_KEY_VERSION = "v1";
const DEFAULT_PROJECT_CACHE_TTL_SECONDS = 15 * 60;

interface ProjectSourceEnvelope {
  schemaVersion: number;
  fingerprint: string;
  data: unknown;
}

interface ProjectLocalizedEnvelope {
  schemaVersion: number;
  sourceFingerprint: string;
  data: unknown;
}

function getProjectCacheTtlSeconds(): number {
  const configured = Number.parseInt(
    process.env.PROJECT_CACHE_TTL_SECONDS ?? "",
    10,
  );

  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_PROJECT_CACHE_TTL_SECONDS;
}

function projectKey(projectId: string, suffix: string): string {
  return `project:${PROJECT_CACHE_KEY_VERSION}:${encodeURIComponent(projectId)}:${suffix}`;
}

function sourceKey(projectId: string): string {
  return projectKey(projectId, "source");
}

function languageKey( projectId: string, language: ProjectCacheLanguage, ): string {
  return projectKey(projectId, `language:${language}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidDate(value: unknown): value is string | Date {
  if (value instanceof Date) return Number.isFinite(value.getTime());
  if (typeof value !== "string") return false;
  return Number.isFinite(new Date(value).getTime());
}

function hydrateProjectDto(value: unknown): ProjectDto | null {
  if (!isRecord(value)) return null;

  const requiredStrings = [
    "id",
    "title",
    "summary",
    "description",
    "problemStatement",
    "proposedSolution",
    "objectives",
  ];

  if (requiredStrings.some((key) => typeof value[key] !== "string")) {
    return null;
  }

  if (
    !(value.projectType === "GRADUATION" || value.projectType === "PRE_GRADUATION") ||
    !(value.visibility === "VISIBLE" || value.visibility === "HIDDEN") ||
    !(value.projectSupervisorName === null || typeof value.projectSupervisorName === "string") ||
    !(value.targetUsers === null || typeof value.targetUsers === "string") ||
    !(value.availableResources === null || typeof value.availableResources === "string") ||
    !(value.constraints === null || typeof value.constraints === "string") ||
    !(value.yearPresentation === undefined || value.yearPresentation === null || typeof value.yearPresentation === "string") ||
    !isValidDate(value.createdAt) ||
    !isValidDate(value.updatedAt) ||
    !Array.isArray(value.features) ||
    !Array.isArray(value.technologies) ||
    !Array.isArray(value.images) ||
    !isRecord(value.counts) ||
    typeof value.counts.images !== "number" ||
    typeof value.counts.suggestions !== "number"
  ) {
    return null;
  }

  const features = value.features.map((feature) => {
    if (
      !isRecord(feature) ||
      typeof feature.id !== "string" ||
      typeof feature.content !== "string" ||
      !(feature.scope === "IN_SCOPE" || feature.scope === "OUT_OF_SCOPE") ||
      typeof feature.sortOrder !== "number"
    ) {
      return null;
    }

    return {
      id: feature.id,
      content: feature.content,
      scope: feature.scope,
      sortOrder: feature.sortOrder,
    };
  });

  const technologies = value.technologies.map((technology) => {
    if (
      !isRecord(technology) ||
      typeof technology.id !== "string" ||
      typeof technology.name !== "string" ||
      typeof technology.sortOrder !== "number"
    ) {
      return null;
    }

    return {
      id: technology.id,
      name: technology.name,
      sortOrder: technology.sortOrder,
    };
  });

  const images = value.images.map((image) => {
    if (
      !isRecord(image) ||
      typeof image.id !== "string" ||
      typeof image.mimeType !== "string" ||
      !(image.fileName === null || typeof image.fileName === "string") ||
      typeof image.fileSizeBytes !== "number" ||
      typeof image.sortOrder !== "number" ||
      !isValidDate(image.createdAt)
    ) {
      return null;
    }

    return {
      id: image.id,
      mimeType: image.mimeType,
      fileName: image.fileName,
      fileSizeBytes: image.fileSizeBytes,
      sortOrder: image.sortOrder,
      createdAt: new Date(image.createdAt),
    };
  });

  if (
    features.some((item) => item === null) ||
    technologies.some((item) => item === null) ||
    images.some((item) => item === null)
  ) {
    return null;
  }

  return {
    id: value.id as string,
    title: value.title as string,
    summary: value.summary as string,
    description: value.description as string,
    targetUsers: value.targetUsers as string | null,
    availableResources: value.availableResources as string | null,
    constraints: value.constraints as string | null,
    yearPresentation: value.yearPresentation as string | null | undefined,
    problemStatement: value.problemStatement as string,
    proposedSolution: value.proposedSolution as string,
    objectives: value.objectives as string,
    projectSupervisorName: value.projectSupervisorName as string | null,
    projectType: value.projectType,
    visibility: value.visibility,
    createdAt: new Date(value.createdAt),
    updatedAt: new Date(value.updatedAt),
    features: features as ProjectDto["features"],
    technologies: technologies as ProjectDto["technologies"],
    images: images as ProjectDto["images"],
    counts: {
      images: value.counts.images,
      suggestions: value.counts.suggestions,
    },
  };
}

/**
 * Creates a stable fingerprint for the original DTO. Localized cache entries
 * are accepted only when their fingerprint matches the current source DTO.
 */
function createProjectFingerprint(project: ProjectDto): string {
  const stableValue = {
    id: project.id,
    title: project.title,
    summary: project.summary,
    description: project.description,
    targetUsers: project.targetUsers,
    availableResources: project.availableResources,
    constraints: project.constraints,
    yearPresentation: project.yearPresentation ?? null,
    problemStatement: project.problemStatement,
    proposedSolution: project.proposedSolution,
    objectives: project.objectives,
    projectSupervisorName: project.projectSupervisorName,
    projectType: project.projectType,
    visibility: project.visibility,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    features: project.features.map((feature) => ({
      id: feature.id,
      content: feature.content,
      scope: feature.scope,
      sortOrder: feature.sortOrder,
    })),
    technologies: project.technologies.map((technology) => ({
      id: technology.id,
      name: technology.name,
      sortOrder: technology.sortOrder,
    })),
    images: project.images.map((image) => ({
      id: image.id,
      mimeType: image.mimeType,
      fileName: image.fileName,
      fileSizeBytes: image.fileSizeBytes,
      sortOrder: image.sortOrder,
      createdAt: image.createdAt.toISOString(),
    })),
    counts: project.counts,
  };

  return createHash("sha256")
    .update(JSON.stringify(stableValue))
    .digest("hex");
}

function readSourceEnvelope(value: unknown): { fingerprint: string; data: ProjectDto; } | null {
  if (
    !isRecord(value) ||
    value.schemaVersion !== PROJECT_CACHE_SCHEMA_VERSION ||
    typeof value.fingerprint !== "string"
  ) {
    return null;
  }

  const data = hydrateProjectDto(value.data);
  return data ? { fingerprint: value.fingerprint, data } : null;
}

function readLocalizedEnvelope( value: unknown, sourceFingerprint: string, ): ProjectDto | null {
  if (
    !isRecord(value) ||
    value.schemaVersion !== PROJECT_CACHE_SCHEMA_VERSION ||
    value.sourceFingerprint !== sourceFingerprint
  ) {
    return null;
  }

  return hydrateProjectDto(value.data);
}

function buildSnapshot( projectId: string, values: Array<unknown | null>, ): CachedProjectLookup {
  const sourceEnvelope = readSourceEnvelope(values[0]);

  if (!sourceEnvelope || sourceEnvelope.data.id !== projectId) {
    return { projectId, data: null };
  }

  const english = readLocalizedEnvelope(values[1], sourceEnvelope.fingerprint);
  const arabic = readLocalizedEnvelope(values[2], sourceEnvelope.fingerprint);

  return {
    projectId,
    data: {
      source: sourceEnvelope.data,
      translations: {
        en: english,
        ar: arabic,
      },
    },
  };
}

function buildProjectKeys(projectId: string): string[] {
  return [sourceKey(projectId), languageKey(projectId, "en"), languageKey(projectId, "ar")];
}

export async function getCachedProject( projectId: string, ): Promise<RedisResult<CachedProjectSnapshot | null>> {
  try {
    const redisResult = await redisGetManyJson<unknown>(buildProjectKeys(projectId));
    if ("error" in redisResult) return redisResult;
    return { data: buildSnapshot(projectId, redisResult.data).data };
  } catch (error) {
    return { error: parseRedisError(error, "GET") };
  }
}

export async function setCachedProject( write: ProjectCacheWrite, ): Promise<RedisResult<null>> {
  try {
    const fingerprint = createProjectFingerprint(write.source);
    const entries: Array<{ key: string; value: unknown }> = [
      {
        key: sourceKey(write.source.id),
        value: {
          schemaVersion: PROJECT_CACHE_SCHEMA_VERSION,
          fingerprint,
          data: write.source,
        } satisfies ProjectSourceEnvelope,
      },
    ];

    if (write.localized) {
      if (write.localized.data.id !== write.source.id) {
        return { error: "Localized project ID does not match its source project ID." };
      }

      entries.push({
        key: languageKey(write.source.id, write.localized.language),
        value: {
          schemaVersion: PROJECT_CACHE_SCHEMA_VERSION,
          sourceFingerprint: fingerprint,
          data: write.localized.data,
        } satisfies ProjectLocalizedEnvelope,
      });
    }

    return redisSetManyJson(entries, getProjectCacheTtlSeconds());
  } catch (error) {
    return { error: parseRedisError(error, "SET") };
  }
}

export async function getCachedProjects( projectIds: string[], ): Promise<RedisResult<CachedProjectLookup[]>> {
  if (projectIds.length === 0) return { data: [] };

  try {
    const keys = projectIds.flatMap(buildProjectKeys);
    const redisResult = await redisGetManyJson<unknown>(keys);
    if ("error" in redisResult) return redisResult;

    const lookups = projectIds.map((projectId, index) => {
      const start = index * 3;
      return buildSnapshot(projectId, redisResult.data.slice(start, start + 3));
    });

    return { data: lookups };
  } catch (error) {
    return { error: parseRedisError(error, "MGET") };
  }
}

/**
 * Returns all the projects currently stored in the cache.
 */
export async function getAllCachedProjects(): Promise<RedisResult<CachedProjectLookup[]>> {
  try {
    const clientResult = await getRedisClient();
    if ("error" in clientResult) return clientResult;

    const pattern = `project:${PROJECT_CACHE_KEY_VERSION}:*:source`;
    const keys = await clientResult.data.keys(pattern);

    if (!keys || keys.length === 0) {
      return { data: [] };
    }

    const projectIds: string[] = [];
    for (const key of keys) {
      const parts = key.split(":");
      if (parts.length >= 4 && parts[3] === "source") {
        try {
          projectIds.push(decodeURIComponent(parts[2]));
        } catch {
          // Ignore malformed keys safely
        }
      }
    }

    if (projectIds.length === 0) {
      return { data: [] };
    }

    return getCachedProjects(projectIds);
  } catch (error) {
    return { error: parseRedisError(error, "GET") };
  }
}

/**
 * Batch lookup for a page whose source DTOs have just been loaded from the
 * repository. Comparing fingerprints prevents serving a localized DTO for an
 * older source snapshot if invalidation previously failed.
 */
export async function getCachedLocalizedProjects( sourceProjects: ProjectDto[], language: ProjectCacheLanguage, ): Promise<RedisResult<Array<ProjectDto | null>>> {
  if (sourceProjects.length === 0) return { data: [] };

  try {
    const cachedResult = await getCachedProjects(
      sourceProjects.map((project) => project.id),
    );
    if ("error" in cachedResult) return cachedResult;

    const localized = sourceProjects.map((sourceProject, index) => {
      const cached = cachedResult.data[index]?.data;
      if (!cached) return null;

      const currentFingerprint = createProjectFingerprint(sourceProject);
      const cachedSourceFingerprint = createProjectFingerprint(cached.source);

      if (currentFingerprint !== cachedSourceFingerprint) return null;
      return cached.translations[language];
    });

    return { data: localized };
  } catch (error) {
    return { error: parseRedisError(error, "MGET") };
  }
}

export async function setCachedProjects(
  writes: ProjectCacheWrite[],
): Promise<RedisResult<null>> {
  if (writes.length === 0) return { data: null };

  try {
    const entries = new Map<string, unknown>();

    for (const write of writes) {
      const fingerprint = createProjectFingerprint(write.source);

      entries.set(sourceKey(write.source.id), {
        schemaVersion: PROJECT_CACHE_SCHEMA_VERSION,
        fingerprint,
        data: write.source,
      } satisfies ProjectSourceEnvelope);

      if (write.localized) {
        if (write.localized.data.id !== write.source.id) {
          return { error: "Localized project ID does not match its source project ID." };
        }

        entries.set(languageKey(write.source.id, write.localized.language), {
          schemaVersion: PROJECT_CACHE_SCHEMA_VERSION,
          sourceFingerprint: fingerprint,
          data: write.localized.data,
        } satisfies ProjectLocalizedEnvelope);
      }
    }

    return redisSetManyJson(
      [...entries].map(([key, value]) => ({ key, value })),
      getProjectCacheTtlSeconds(),
    );
  } catch (error) {
    return { error: parseRedisError(error, "MSET") };
  }
}

export async function invalidateCachedProject(
  projectId: string,
): Promise<RedisResult<null>> {
  return redisDeleteMany(buildProjectKeys(projectId));
}

export async function invalidateCachedProjects(
  projectIds: string[],
): Promise<RedisResult<null>> {
  return redisDeleteMany(projectIds.flatMap(buildProjectKeys));
}