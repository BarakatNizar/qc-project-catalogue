// import { z } from "zod";

// const cacheLanguageSchema = z.enum(["en", "ar"]);
// const projectTypeSchema = z.enum(["GRADUATION", "PRE_GRADUATION"]);
// const projectVisibilitySchema = z.enum(["VISIBLE", "HIDDEN"]);
// const featureScopeSchema = z.enum(["IN_SCOPE", "OUT_OF_SCOPE"]);
// const dateSchema = z.coerce.date();
// const idSchema = z.string().min(1);
// const sortOrderSchema = z.number().int().nonnegative();
// const countSchema = z.number().int().nonnegative();

// export const projectListItemSchema = z.object({
//   id: idSchema,
//   language: cacheLanguageSchema,
//   title: z.string(),
//   summary: z.string(),
//   projectSupervisorName: z.string().nullable(),
//   projectType: projectTypeSchema,
//   visibility: projectVisibilitySchema,
//   technologies: z.array(
//     z.object({
//       id: idSchema,
//       name: z.string(),
//       sortOrder: sortOrderSchema,
//     }),
//   ),
//   images: z.array(
//     z.object({
//       id: idSchema,
//       mimeType: z.string(),
//     }),
//   ),
//   counts: z.object({
//     images: countSchema,
//     suggestions: countSchema,
//   }),
// });

// export const projectRestDetailsSchema = z.object({
//   id: idSchema,
//   language: cacheLanguageSchema,
//   description: z.string(),
//   targetUsers: z.string().nullable(),
//   availableResources: z.string().nullable(),
//   constraints: z.string().nullable(),
//   yearPresentation: z.string().nullable().optional(),
//   problemStatement: z.string(),
//   proposedSolution: z.string(),
//   objectives: z.string(),
//   createdAt: dateSchema,
//   updatedAt: dateSchema,
//   features: z.array(
//     z.object({
//       id: idSchema,
//       content: z.string(),
//       scope: featureScopeSchema,
//       sortOrder: sortOrderSchema,
//     }),
//   ),
// });

// export const projectSuggestionSchema = z.object({
//   id: idSchema,
//   title: z.string(),
//   createdAt: dateSchema,
//   content: z.string(),
// });

// export const projectSuggestionsSchema = z.object({
//   projectId: idSchema,
//   language: cacheLanguageSchema,
//   suggestions: z.array(projectSuggestionSchema),
// });

// const projectFullCacheLanguageResultSchema = z.object({
//   list: projectListItemSchema.optional(),
//   details: projectRestDetailsSchema.optional(),
//   suggestions: projectSuggestionsSchema.optional(),
// });

// export const projectFullCacheResultSchema = z.object({
//   en: projectFullCacheLanguageResultSchema.optional(),
//   ar: projectFullCacheLanguageResultSchema.optional(),
// });

// export const projectLocalizedFullCacheResultSchema =
//   projectFullCacheLanguageResultSchema.nullable();

// export const projectItemsCacheResultSchema = z.object({
//   en: z.object({ list: projectListItemSchema }).optional(),
//   ar: z.object({ list: projectListItemSchema }).optional(),
// });

// export const projectLocalizedItemCacheResultSchema =
//   projectListItemSchema.nullable();


// export const projectsCacheDetailsResultSchema = z.object({
//   en: z.object({ details: projectRestDetailsSchema }).optional(),
//   ar: z.object({ details: projectRestDetailsSchema }).optional(),
// });

// export const projectLocalizedDetailsCacheResultSchema =
//   projectRestDetailsSchema.nullable();



// export const projectSuggestionsCacheResultSchema = z.object({
//   en: z.object({ suggestions: projectSuggestionsSchema }).optional(),
//   ar: z.object({ suggestions: projectSuggestionsSchema }).optional(),
// });

// export const projectLocalizedSuggestionsCacheResultSchema =
//   projectSuggestionsSchema.nullable();

// export const projectListsCacheResultSchema = z.object({
//   lists: z.object({
//     en: z.array(projectListItemSchema),
//     ar: z.array(projectListItemSchema),
//   }),
// });

// export const projectLocalizedListsCacheResultSchema = z.object({
//   lists: z.array(projectListItemSchema),
// });

import { z } from "zod";

const cacheLanguageSchema = z.enum(["en", "ar"]);
const projectTypeSchema = z.enum(["GRADUATION", "PRE_GRADUATION"]);
const projectVisibilitySchema = z.enum(["VISIBLE", "HIDDEN"]);
const featureScopeSchema = z.enum(["IN_SCOPE", "OUT_OF_SCOPE"]);
const dateSchema = z.coerce.date();
const idSchema = z.string().min(1);
const sortOrderSchema = z.number().int().nonnegative();
const countSchema = z.number().int().nonnegative();

export const projectListItemSchema = z.object({
  id: idSchema,
  language: cacheLanguageSchema,
  title: z.string(),
  summary: z.string(),
  projectSupervisorName: z.string().nullable(),
  projectType: projectTypeSchema,
  visibility: projectVisibilitySchema,
  technologies: z.array(
    z.object({
      id: idSchema,
      name: z.string(),
      sortOrder: sortOrderSchema,
    }),
  ),
  images: z.array(
    z.object({
      id: idSchema,
      mimeType: z.string(),
      fileName: z.string().nullable(),
      fileSizeBytes: z.number().nonnegative(),
      sortOrder: sortOrderSchema,
      createdAt: dateSchema,
    }),
  ),
  counts: z.object({
    images: countSchema,
    suggestions: countSchema,
  }),
});

export const projectRestDetailsSchema = z.object({
  id: idSchema,
  language: cacheLanguageSchema,
  description: z.string(),
  targetUsers: z.string().nullable(),
  availableResources: z.string().nullable(),
  constraints: z.string().nullable(),
  yearPresentation: z.string().nullable().optional(),
  problemStatement: z.string(),
  proposedSolution: z.string(),
  objectives: z.string(),
  studentsPresented: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  features: z.array(
    z.object({
      id: idSchema,
      content: z.string(),
      scope: featureScopeSchema,
      sortOrder: sortOrderSchema,
    }),
  ),
});

export const projectSuggestionSchema = z.object({
  id: idSchema,
  title: z.string(),
  createdAt: dateSchema,
  content: z.string(),
});

export const projectSuggestionsSchema = z.object({
  projectId: idSchema,
  language: cacheLanguageSchema,
  suggestions: z.array(projectSuggestionSchema),
});

const projectFullCacheLanguageResultSchema = z.object({
  list: projectListItemSchema.optional(),
  details: projectRestDetailsSchema.optional(),
  suggestions: projectSuggestionsSchema.optional(),
});

export const projectFullCacheResultSchema = z.object({
  en: projectFullCacheLanguageResultSchema.optional(),
  ar: projectFullCacheLanguageResultSchema.optional(),
});

export const projectLocalizedFullCacheResultSchema =
  projectFullCacheLanguageResultSchema.nullable();

export const projectItemsCacheResultSchema = z.object({
  en: z.object({ list: projectListItemSchema }).optional(),
  ar: z.object({ list: projectListItemSchema }).optional(),
});

export const projectLocalizedItemCacheResultSchema =
  projectListItemSchema.nullable();

export const projectSuggestionsCacheResultSchema = z.object({
  en: z.object({ suggestions: projectSuggestionsSchema }).optional(),
  ar: z.object({ suggestions: projectSuggestionsSchema }).optional(),
});

export const projectLocalizedSuggestionsCacheResultSchema =
  projectSuggestionsSchema.nullable();

export const projectListsCacheResultSchema = z.object({
  lists: z.object({
    en: z.array(projectListItemSchema),
    ar: z.array(projectListItemSchema),
  }),
});

export const projectLocalizedListsCacheResultSchema = z.object({
  lists: z.array(projectListItemSchema),
});

export const projectsCacheDetailsResultSchema = z.object({
  en: z.object({ details: projectRestDetailsSchema }).optional(),
  ar: z.object({ details: projectRestDetailsSchema }).optional(),
});

export const projectLocalizedDetailsCacheResultSchema =
  projectRestDetailsSchema.nullable();
