import type { ProjectDto } from "@/modules/project/types";

export type ProjectCacheLanguage = "en" | "ar";

export interface CachedProjectSnapshot {
  source: ProjectDto;
  translations: {
    en: ProjectDto | null;
    ar: ProjectDto | null;
  };
}

export interface LocalizedProjectCacheWrite {
  language: ProjectCacheLanguage;
  data: ProjectDto;
}

export interface ProjectCacheWrite {
  source: ProjectDto;
  localized?: LocalizedProjectCacheWrite;
}

export interface CachedProjectLookup {
  projectId: string;
  data: CachedProjectSnapshot | null;
}
