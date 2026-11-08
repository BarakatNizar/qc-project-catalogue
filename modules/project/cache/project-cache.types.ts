// // import type { ProjectData } from "@/modules/project/types";

// // export type ProjectCacheLanguage = "en" | "ar";

// // export interface CachedProjectSnapshot {
// //   source: ProjectData;
// //   translations: {
// //     en: ProjectData | null;
// //     ar: ProjectData | null;
// //   };
// // }

// // export interface LocalizedProjectCacheWrite {
// //   language: ProjectCacheLanguage;
// //   data: ProjectData;
// // }

// // export interface ProjectCacheWrite {
// //   source: ProjectData;
// //   localized?: LocalizedProjectCacheWrite;
// // }

// // export interface CachedProjectLookup {
// //   projectId: string;
// //   data: CachedProjectSnapshot | null;
// // }

// // modules/project/cache/project-cache.type.ts

// import type {
//   ProjectListItem,
//   ProjectRestDetails,
//   ProjectSuggestions,
// } from "@/modules/project/types";

// export type ProjectCacheLanguage = "en" | "ar";
// export type ProjectCacheResource = "list" | "details" | "suggestions";

// export type ProjectCacheReadResult<T> =
//   | { data: T }
//   | { error: string };

// export type ProjectCacheWriteResult =
//   | { ok: true }
//   | { ok: false; error: string };

// /** Setter inputs omit `language`; the setter supplies it from its locale argument. */
// export type ProjectListCacheValue = Omit<ProjectListItem, "language">;
// export type ProjectDetailsCacheValue = Omit<ProjectRestDetails, "language">;
// export type ProjectSuggestionsCacheValue = Omit<ProjectSuggestions, "language">;

// export interface ProjectFullCacheValue {
//   list: ProjectListCacheValue;
//   details: ProjectDetailsCacheValue;
//   suggestions: ProjectSuggestionsCacheValue;
// }

// export interface LocalizedProjectFullCacheWrite extends ProjectFullCacheValue {
//   language: ProjectCacheLanguage;
// }

// export interface LocalizedProjectListCacheWrite {
//   language: ProjectCacheLanguage;
//   list: ProjectListCacheValue;
// }

// export interface LocalizedProjectDetailsCacheWrite {
//   language: ProjectCacheLanguage;
//   details: ProjectDetailsCacheValue;
// }

// export interface LocalizedProjectSuggestionsCacheWrite {
//   language: ProjectCacheLanguage;
//   suggestions: ProjectSuggestionsCacheValue;
// }

// export interface LocalizedProjectItemsCacheWrite {
//   language: ProjectCacheLanguage;
//   list: ProjectListCacheValue[];
// }

// export interface ProjectFullCacheLanguageResult {
//   list?: ProjectListItem;
//   details?: ProjectRestDetails;
//   suggestions?: ProjectSuggestions;
// }

// export interface ProjectFullCacheResult {
//   en?: ProjectFullCacheLanguageResult;
//   ar?: ProjectFullCacheLanguageResult;
// }

// export interface ProjectItemsCacheResult {
//   en?: { list: ProjectListItem };
//   ar?: { list: ProjectListItem };
// }

export interface ProjectDetailsCacheResult {
  en?: { details: ProjectRestDetails };
  ar?: { details: ProjectRestDetails };
}

// export interface ProjectSuggestionsCacheResult {
//   en?: { suggestions: ProjectSuggestions };
//   ar?: { suggestions: ProjectSuggestions };
// }

// export interface ProjectListsCacheResult {
//   lists: {
//     en: ProjectListItem[];
//     ar: ProjectListItem[];
//   };
// }

// export interface LocalizedProjectListsCacheResult {
//   lists: ProjectListItem[];
// }

import type {
  ProjectListItem,
  ProjectRestDetails,
  ProjectSuggestions,
} from "@/modules/project/types";

export type ProjectCacheLanguage = "en" | "ar";
export type ProjectCacheResource = "list" | "details" | "suggestions";

export type ProjectCacheReadResult<T> =
  | { data: T }
  | { error: string };

export type ProjectCacheWriteResult =
  | { ok: true }
  | { ok: false; error: string };

/** Setter inputs omit `language`; the setter supplies it from its locale argument. */
export type ProjectListCacheValue = Omit<ProjectListItem, "language">;
export type ProjectDetailsCacheValue = Omit<ProjectRestDetails, "language">;
export type ProjectSuggestionsCacheValue = Omit<ProjectSuggestions, "language">;

export interface ProjectFullCacheValue {
  list: ProjectListCacheValue;
  details: ProjectDetailsCacheValue;
  suggestions: ProjectSuggestionsCacheValue;
}

export interface LocalizedProjectFullCacheWrite extends ProjectFullCacheValue {
  language: ProjectCacheLanguage;
}

export interface LocalizedProjectListCacheWrite {
  language: ProjectCacheLanguage;
  list: ProjectListCacheValue;
}

export interface LocalizedProjectDetailsCacheWrite {
  language: ProjectCacheLanguage;
  details: ProjectDetailsCacheValue;
}

export interface LocalizedProjectSuggestionsCacheWrite {
  language: ProjectCacheLanguage;
  suggestions: ProjectSuggestionsCacheValue;
}

export interface LocalizedProjectItemsCacheWrite {
  language: ProjectCacheLanguage;
  list: ProjectListCacheValue[];
}

export interface ProjectFullCacheLanguageResult {
  list?: ProjectListItem;
  details?: ProjectRestDetails;
  suggestions?: ProjectSuggestions;
}

export interface ProjectFullCacheResult {
  en?: ProjectFullCacheLanguageResult;
  ar?: ProjectFullCacheLanguageResult;
}

export interface ProjectItemsCacheResult {
  en?: { list: ProjectListItem };
  ar?: { list: ProjectListItem };
}

export interface ProjectSuggestionsCacheResult {
  en?: { suggestions: ProjectSuggestions };
  ar?: { suggestions: ProjectSuggestions };
}

export interface ProjectListsCacheResult {
  lists: {
    en: ProjectListItem[];
    ar: ProjectListItem[];
  };
}

export interface LocalizedProjectListsCacheResult {
  lists: ProjectListItem[];
}




export interface ProjectDetailsCacheResult {
  en?: { details: ProjectRestDetails };
  ar?: { details: ProjectRestDetails };
}
