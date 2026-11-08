// import "server-only";

// import type { ProjectCacheLanguage, ProjectCacheResource } from "./project-cache.types";

// const PROJECT_CACHE_KEY_VERSION = "v1";
// const DEFAULT_PROJECT_CACHE_TTL_SECONDS = 15 * 60;

// export function buildProjectCacheKey(
//   resource: ProjectCacheResource,
//   projectId: string,
//   language: ProjectCacheLanguage,
// ): string {
//   return `pr:${PROJECT_CACHE_KEY_VERSION}:${resource}:${encodeURIComponent(projectId)}:language:${language}`;
// }

// export function buildProjectCacheKeys(projectId: string): string[] {
//   const languages: ProjectCacheLanguage[] = ["ar", "en"];
//   const resources: ProjectCacheResource[] = ["list", "details", "suggestions"];

//   return languages.flatMap((language) =>
//     resources.map((resource) =>
//       buildProjectCacheKey(resource, projectId, language),
//     ),
//   );
// }

// export function getProjectCacheTtlSeconds(): number {
//   const configured = Number.parseInt(
//     process.env.PROJECT_CACHE_TTL_SECONDS ?? "",
//     10,
//   );

//   return Number.isFinite(configured) && configured > 0
//     ? configured
//     : DEFAULT_PROJECT_CACHE_TTL_SECONDS;
// }

// export function hasProjectId(value: string): boolean {
//   return typeof value === "string" && value.trim().length > 0;
// }

// export function withCacheLanguage<T extends object>(
//   value: T,
//   language: ProjectCacheLanguage,
// ): T & { language: ProjectCacheLanguage } {
//   return { ...value, language };
// }
import "server-only";

import type { ProjectCacheLanguage, ProjectCacheResource } from "./project-cache.types";

const PROJECT_CACHE_KEY_VERSION = "v1";
const DEFAULT_PROJECT_CACHE_TTL_SECONDS = 15 * 60;

export function buildProjectCacheKey(
  resource: ProjectCacheResource,
  projectId: string,
  language: ProjectCacheLanguage,
): string {
  return `pr:${PROJECT_CACHE_KEY_VERSION}:${resource}:${encodeURIComponent(projectId)}:language:${language}`;
}

export function buildProjectCacheKeys(projectId: string): string[] {
  const languages: ProjectCacheLanguage[] = ["ar", "en"];
  const resources: ProjectCacheResource[] = ["list", "details", "suggestions"];

  return languages.flatMap((language) =>
    resources.map((resource) =>
      buildProjectCacheKey(resource, projectId, language),
    ),
  );
}

export function getProjectCacheTtlSeconds(): number {
  const configured = Number.parseInt(
    process.env.PROJECT_CACHE_TTL_SECONDS ?? "",
    10,
  );

  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_PROJECT_CACHE_TTL_SECONDS;
}

export function hasProjectId(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function withCacheLanguage<T extends object>(
  value: T,
  language: ProjectCacheLanguage,
): T & { language: ProjectCacheLanguage } {
  return { ...value, language };
}
