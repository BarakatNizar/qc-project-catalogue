// import type {
//   ProjectDetailsCacheResult,
//   ProjectFullCacheResult,
//   ProjectItemsCacheResult,
//   ProjectListsCacheResult,
//   ProjectSuggestionsCacheResult,
// } from "./project-cache.types";
// import type {
//   ProjectListItem,
//   ProjectRestDetails,
//   ProjectSuggestions,
// } from "@/modules/project/types";

// export function mapFullProjectCache(
//   values: Array<ProjectListItem | ProjectRestDetails | ProjectSuggestions | null>,
// ): ProjectFullCacheResult {
//   const result: ProjectFullCacheResult = {};

//   const en = {
//     list: values[0] as ProjectListItem | null,
//     details: values[1] as ProjectRestDetails | null,
//     suggestions: values[2] as ProjectSuggestions | null,
//   };
//   const ar = {
//     list: values[3] as ProjectListItem | null,
//     details: values[4] as ProjectRestDetails | null,
//     suggestions: values[5] as ProjectSuggestions | null,
//   };

//   if (en.list || en.details || en.suggestions) {
//     result.en = {
//       ...(en.list ? { list: en.list } : {}),
//       ...(en.details ? { details: en.details } : {}),
//       ...(en.suggestions ? { suggestions: en.suggestions } : {}),
//     };
//   }

//   if (ar.list || ar.details || ar.suggestions) {
//     result.ar = {
//       ...(ar.list ? { list: ar.list } : {}),
//       ...(ar.details ? { details: ar.details } : {}),
//       ...(ar.suggestions ? { suggestions: ar.suggestions } : {}),
//     };
//   }

//   return result;
// }

// export function mapProjectItemsCache(
//   english: ProjectListItem | null,
//   arabic: ProjectListItem | null,
// ): ProjectItemsCacheResult {
//   return {
//     ...(english ? { en: { list: english } } : {}),
//     ...(arabic ? { ar: { list: arabic } } : {}),
//   };
// }
export function mapProjectDetailsCache(
  english: ProjectRestDetails | null,
  arabic: ProjectRestDetails | null,
): ProjectDetailsCacheResult {
  return {
    ...(english ? { en: { details: english } } : {}),
    ...(arabic ? { ar: { details: arabic } } : {}),
  };
}

// export function mapProjectSuggestionsCache(
//   english: ProjectSuggestions | null,
//   arabic: ProjectSuggestions | null,
// ): ProjectSuggestionsCacheResult {
//   return {
//     ...(english ? { en: { suggestions: english } } : {}),
//     ...(arabic ? { ar: { suggestions: arabic } } : {}),
//   };
// }

// export function mapProjectListsCache(
//   english: ProjectListItem[],
//   arabic: ProjectListItem[],
// ): ProjectListsCacheResult {
//   return { lists: { en: english, ar: arabic } };
// }

import type {
  ProjectDetailsCacheResult,
  ProjectFullCacheResult,
  ProjectItemsCacheResult,
  ProjectListsCacheResult,
  ProjectSuggestionsCacheResult,
} from "./project-cache.types";
import type {
  ProjectListItem,
  ProjectRestDetails,
  ProjectSuggestions,
} from "@/modules/project/types";

export function mapFullProjectCache(
  values: Array<ProjectListItem | ProjectRestDetails | ProjectSuggestions | null>,
): ProjectFullCacheResult {
  const result: ProjectFullCacheResult = {};

  const en = {
    list: values[0] as ProjectListItem | null,
    details: values[1] as ProjectRestDetails | null,
    suggestions: values[2] as ProjectSuggestions | null,
  };
  const ar = {
    list: values[3] as ProjectListItem | null,
    details: values[4] as ProjectRestDetails | null,
    suggestions: values[5] as ProjectSuggestions | null,
  };

  if (en.list || en.details || en.suggestions) {
    result.en = {
      ...(en.list ? { list: en.list } : {}),
      ...(en.details ? { details: en.details } : {}),
      ...(en.suggestions ? { suggestions: en.suggestions } : {}),
    };
  }

  if (ar.list || ar.details || ar.suggestions) {
    result.ar = {
      ...(ar.list ? { list: ar.list } : {}),
      ...(ar.details ? { details: ar.details } : {}),
      ...(ar.suggestions ? { suggestions: ar.suggestions } : {}),
    };
  }

  return result;
}

export function mapProjectItemsCache(
  english: ProjectListItem | null,
  arabic: ProjectListItem | null,
): ProjectItemsCacheResult {
  return {
    ...(english ? { en: { list: english } } : {}),
    ...(arabic ? { ar: { list: arabic } } : {}),
  };
}

export function mapProjectSuggestionsCache(
  english: ProjectSuggestions | null,
  arabic: ProjectSuggestions | null,
): ProjectSuggestionsCacheResult {
  return {
    ...(english ? { en: { suggestions: english } } : {}),
    ...(arabic ? { ar: { suggestions: arabic } } : {}),
  };
}

export function mapProjectListsCache(
  english: ProjectListItem[],
  arabic: ProjectListItem[],
): ProjectListsCacheResult {
  return { lists: { en: english, ar: arabic } };
}
